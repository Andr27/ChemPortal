from django.utils import timezone
from django.db.models import Avg
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError


from Portal.permissions import IsCreator, IsModerator
from Portal.choices import ModerationStatus, UserRole
from Portal.mixins import StatusAccessMixin, ModeratorMixin

from .models import Quiz, QuizAttempt, Question, AnswerOption, UserAnswer
from .serializers  import (
QuizSerializer, QuizDetailSerializer, QuizDetailAdminSerializer, QuestionCreateSerializer, QuizSubmitSerializer, QuizAttemptResultSerializer
)



class QuizViewSet(ModeratorMixin, StatusAccessMixin, ModelViewSet):
    queryset = Quiz.objects.all().prefetch_related('questions__options')
    owner_field = 'created_by'
    status_field = 'status'

    def get_serializer_class(self):
        if self.action == 'admin_detail':
            return QuizDetailAdminSerializer
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer


    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        if self.action in ('approve', 'reject', 'moderation_list'):
            return [IsModerator()]
        if self.action in ('admin_detail', 'add_question', 'update_question', 'delete_question', 'my_quizzes', 'stats'):
            return [IsCreator()]
        if self.action in ('start', 'submit', 'my_result', 'hint'):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


    def perform_update(self, serializer):
        obj = self.get_object()
        user = self.request.user
        if obj.created_by != user and user.profile.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            raise PermissionDenied("Вы не можете редактировать этот тест")
        if obj.status == ModerationStatus.PUBLISHED and user.profile.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            raise PermissionDenied("Нельзя редактировать опубликнованный тест")
        serializer.save(status=ModerationStatus.DRAFT)


    def perform_destroy(self, instance):
        user = self.request.user
        if instance.created_by != user and user.profile.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            return PermissionDenied("Вы не можете удалить этот тест")
        instance.delete()




    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk, created_by=self.request.user)

        if quiz.status == ModerationStatus.PUBLISHED:
            raise PermissionDenied("Нельзя редактировать опубликованный тест")

        serializer = QuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last = quiz.questions.order_by('-order').first()
        next_order = (last.order + 1) if last else 1
        serializer.save(quiz=quiz, order=next_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch'], url_path='update_question/(?P<q_id>[^/.]+)')
    def update_question(self, request, pk=None, q_id=None):
        quiz = get_object_or_404(Quiz, pk=pk, created_by=self.request.user)
        if quiz.status == ModerationStatus.PUBLISHED:
            raise PermissionDenied("Нельзя редактировать опубликованный тест")

        question = get_object_or_404(Question, pk=q_id, quiz=quiz)
        serializer = QuestionCreateSerializer(question, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='delete_question/(?P<q_id>[^/.]+)')
    def delete_question(self, request, pk=None, q_id=None):
        quiz = get_object_or_404(Quiz, pk=pk, created_by=self.request.user)
        if quiz.status == ModerationStatus.PUBLISHED:
            raise PermissionDenied("Нельзя редактировать опубликованный тест")
        question = get_object_or_404(Question, pk=q_id, quiz=quiz)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    #Прохождение теста


    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk, status=ModerationStatus.PUBLISHED)
        done = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user,
        ).exclude(status='in_progress').count()
        #ПРОВЕКРКА ЛИМИТА ПОПЫТОК
        if quiz.max_attempts > 0:
            done = QuizAttempt.objects.filter(
                quiz=quiz,
                user=request.user,
            ).exclude(status='in_progress').count()

            if done >= quiz.max_attempts:
                raise ValidationError(
                    f"Вы исчерпали максимальное количество попыток ({quiz.max_attempts})"
                )
        #ЗАКРЫТИЕ ЗАВИСШИХ ПОПЫТОК
        QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user,
            status='in_progress',
        ).update(status='timed_out', finished_at=timezone.now())

        attempt = QuizAttempt.objects.create(quiz=quiz, user=request.user)

        return Response({
            'attempt_id': attempt.id,
            "started_at": attempt.started_at,
            "time_limit_minutes": quiz.time_limit_minutes,
            'questions_count': quiz.questions.count(),
            'attempts_used': done + 1,  # эта попытка уже началась
            'attempts_max': quiz.max_attempts,  # 0 = без ограничений
            'attempts_left': (quiz.max_attempts - done - 1) if quiz.max_attempts > 0 else None,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='hint/(?P<q_id>[^/.]+)')
    def hint(self, request, pk=None, q_id=None):
        quiz = get_object_or_404(Quiz, pk=pk)
        question = get_object_or_404(Question, pk=q_id, quiz=quiz)

        #Проверка на активнуб попытку
        active_attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user,
            status='in_progress',
        ).first()

        if not active_attempt:
            raise ValidationError(
                "У вас нет активной попытки в этом тесте"
            )
        if not question.hint:
            return Response({
                'detail': "Нет подсказки для данного вопроса"
            })
        return Response({
            'question_id': question.id,
            'hint': question.hint,
        })



    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk, status=ModerationStatus.PUBLISHED)

        attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user,
            status='in_progress',
        ).first()

        #Чек таймаут
        if quiz.time_limit_minutes:
            elapsed = (timezone.now() - attempt.started_at).total_seconds() /60
            if elapsed > quiz.time_limit_minutes:
                attempt.status = 'timed_out'
                attempt.finished_at = timezone.now()
                attempt.save()
                raise ValidationError(
                    "Время прохожднения теста истекло"
                )

        submit_serializer = QuizSubmitSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        answers_data = {
            a['question_id']: a
            for a in submit_serializer.validated_data['answers']
        }
        total_points = 0.0
        earned_points = 0.0

        for question in quiz.questions.prefetch_related('options').all():
            total_points += question.points
            ans = answers_data.get(question.id, {})

            user_answer, _ = UserAnswer.objects.get_or_create(
                attempt=attempt,
                question=question,
            )

            #string
            if question.type == 'string':
                raw = ans.get('string_answer', '')
                is_correct = question.check_string_answer(raw)
                user_answer.string_answer = raw
                user_answer.is_correct = is_correct
                user_answer.is_partial = False
                user_answer.points_earned = float(question.points) if is_correct else 0.0
                user_answer.save()


            #single
            elif question.type == 'single':
                selected_ids = set(ans.get('selected_option_ids', []))
                correct_ids = set(
                    question.options.filter(
                        is_correct=True
                    ).values_list('id', flat=True)
                )
                is_correct = selected_ids == correct_ids
                user_answer.is_correct = is_correct
                user_answer.is_partial = False
                user_answer.points_earned = float(question.points) if is_correct else 0.0
                user_answer.save()
                user_answer.selected_options.set(
                    AnswerOption.objects.filter(
                        id__in=selected_ids,
                        question=question,
                    )
                )
            #multiple
            elif question.type == 'multiple':
                selected_ids = set(ans.get('selected_option_ids', []))
                correct_ids = set(question.options.filter(is_correct=True).values_list('id', flat=True))
                wrong_ids = set(
                    question.options.filter(is_correct=False).values_list('id', flat=True)
                )
                if selected_ids == correct_ids:
                    is_correct = True
                    is_partial = False
                    pts = float(question.points)
                elif question.partial_credit and correct_ids:
                    correct_selected = len(selected_ids & correct_ids)
                    wrong_selected = len(selected_ids & wrong_ids)
                    raw_score = max(0, correct_selected - wrong_selected)
                    pts = round(
                        float(question.points) * raw_score / len(correct_ids), 2
                    )
                    is_correct = False
                    is_partial = pts > 0
                else:
                    is_correct = False
                    is_partial = False
                    pts = 0.0

                user_answer.is_correct = is_correct
                user_answer.is_partial = is_partial
                user_answer.points_earned = pts
                user_answer.save()
                user_answer.selected_options.set(
                    AnswerOption.objects.filter(
                        id__in=selected_ids,
                        question=question,
                    )
                )
            earned_points += user_answer.points_earned


            #подсчет истого
        score  = round(earned_points / total_points * 100, 2) if total_points > 0 else 0.0
        is_passed = score >= quiz.passing_score

        attempt.status = 'completed'
        attempt.finished_at = timezone.now()
        attempt.total_points = total_points
        attempt.earned_points = earned_points
        attempt.score = score
        attempt.is_passed = is_passed
        attempt.save()

        # Если тест привязан к модулю — обновляние best_score

        '''if quiz.module_id:
            from apps.enrollment.models import CourseEnrollment, ModuleProgress
            enrollment = CourseEnrollment.objects.filter(
                user=request.user,
                course=quiz.module.course,
                status='active',
            ).first()
            if enrollment:
                mp, _ = ModuleProgress.objects.get_or_create(
                    enrollment=enrollment,
                    module=quiz.module,
                )
                if mp.best_score is None or score > mp.best_score:
                    mp.best_score = score
                    mp.save()'''


        return Response(QuizAttemptResultSerializer(attempt).data)


    @action(detail=True, methods=['get'])
    def my_results(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk)

        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user,
        ).prefetch_related(
            'answers__selected_options',
            "answers__question__options"
        )
        serializer = QuizAttemptResultSerializer(attempts, many=True)
        return Response(serializer.data)


    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk)

        if quiz.created_by != request.user and request.user.profile.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            raise PermissionDenied("Нет доступа")

        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            status='completed'
        )
        total = attempts.count()
        passed = attempts.filter(is_passed=True).count()
        avg = attempts.aggregate(avg=Avg('score'))['avg'] or 0

        question_stats = []

        for q in quiz.questions.all():
            answers = UserAnswer.objects.filter(
                question=q,
                attempt__status='completed'
            )
            total_ans = answers.count()
            correct_ans = answers.filter(is_correct=True).count()
            partial_ans = answers.filter(is_partial=True).count()

            question_stats.append({
                'question_id': q.id,
                'question_text': q.text,
                'type': q.type,
                'total_answers': total_ans,
                'correct': correct_ans,
                'partial': partial_ans,
                'wrong': total_ans - correct_ans - partial_ans,
                'correct_rate': round(correct_ans / total_ans * 100, 1) if total_ans > 0 else 0,
            })
        return Response({
            'total_attempts': total,
            'passed': passed,
            'failed': total - passed,
            'pass_rate_percent': round(passed / total * 100, 1) if total > 0 else 0,
            'average_score': round(avg, 1),
            'question_stats': question_stats,
        })

    @action(detail=True, methods=['get'])
    def admin_detail(self, request, pk=None):
        quiz = get_object_or_404(Quiz, pk=pk)
        if quiz.created_by != request.user and request.user.profile.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            raise PermissionDenied("Нет доступа")
        return Response(QuizDetailAdminSerializer(quiz).data)

    @action(detail=False, methods=['get'])
    def my_quizzes(self, request, pk=None):
        quizzes = self.get_base_queryset().filter(created_by=request.user)
        return Response(QuizSerializer(quizzes, many=True).data)

    @action(detail=False, methods=['get'])
    def my_draft_quizzes(self, request, pk=None):
        quizzes = self.get_base_queryset().filter(
            created_by=request.user,
            status=ModerationStatus.DRAFT,
        )
        return Response(QuizSerializer(quizzes, many=True).data)

    @action(detail=False, methods=['get'])
    def my_published_quizzes(self, request):
        quizzes = self.get_base_queryset().filter(
            created_by=request.user,
            status=ModerationStatus.PUBLISHED,
        )
        return Response(QuizSerializer(quizzes, many=True).data)

    @action(detail=False, methods=['get'])
    def my_rejected_quizzes(self, request):
        quizzes = self.get_base_queryset().filter(
            created_by=request.user,
            status=ModerationStatus.REJECTED,
        )
        return Response(QuizSerializer(quizzes, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def moderation_list(self, request):
        quizzes = self.get_base_queryset().filter(
            status=ModerationStatus.MODERATION,
        )
        return Response(QuizSerializer(quizzes, many=True).data)















