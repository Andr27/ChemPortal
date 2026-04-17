from rest_framework import serializers
from .models import Quiz, QuizAttempt, Question, AnswerOption, UserAnswer

# Для пользователя без is_correct
class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id', 'text', 'order')


# Для создателя с is_correct
class AnswerOptionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id', 'text', 'order', 'is_correct')


# Для пользователя
class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'type', 'order', 'points', 'options')


#Для создателя
class QuestionAdminSerializer(serializers.ModelSerializer):
    options = AnswerOptionAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = (
            'id', 'text', 'type', 'order', 'points',
            'partial_credit', 'hint', 'explanation',
            'correct_string_answer', 'correct_string_alternatives',
            'options',
        )


#для cu вопроса
class QuestionCreateSerializer(serializers.ModelSerializer):
    options = AnswerOptionAdminSerializer(many=True, required=False)

    class Meta:
        model = Question
        exclude = ('quiz', )

    def validate(self, data):
        q_type = data.get('type')
        options = data.get('options', [])
        correct_string = data.get('correct_string_answer', '')

        if q_type in ('single', 'multiple'):
            if not options:
                raise serializers.ValidationError(
                    "Добавьте варианты ответов"
                )
            correct_count = sum(1 for o in options if o.get('is_correct'))
            if correct_count == 0:
                raise serializers.ValidationError(
                    "Укажите хотя бы один правильный вариант"
                )
            if q_type == 'single' and correct_count > 1:
                raise serializers.ValidationError(
                    "Для одиночного выбора только один правильный вариант"
                )

        if q_type == 'string' and not correct_string:
            raise serializers.ValidationError(
                "Для типа 'строка' укажите правильный ответ"
            )
        return data

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for opt in options_data:
            AnswerOption.objects.create(question=question, **opt)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            instance.options.all().delete()
            for opt in options_data:
                AnswerOption.objects.create(question=instance, **opt)
        return instance








class QuizSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = (
            'id', 'title', 'description',
            'lesson', 'chapter',
            'created_by', 'created_at', 'status',
            'time_limit_minutes', 'passing_score',
            'max_attempts', 'show_explanation_after',
            'questions_count',
        )
        read_only_fields = ('created_by', 'created_at', 'status')

    def get_created_by(self, obj):
        return {
            'id': obj.created_by.id,
            'first_name': obj.created_by.first_name,
            'last_name': obj.created_by.last_name,
        }

    def get_questions_count(self, obj):
        return obj.questions.count()


# Для пользователя — вопросы без ответов
class QuizDetailSerializer(QuizSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ('questions',)


# Для создателя — вопросы с ответами
class QuizDetailAdminSerializer(QuizSerializer):
    questions = QuestionAdminSerializer(many=True, read_only=True)
    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ('questions',)



class UserAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )
    string_answer = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
    )

class QuizSubmitSerializer(serializers.Serializer):
    answers = UserAnswerSerializer(many=True)



class UserAnswerResultSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='question.id')
    question_text = serializers.CharField(source='question.text')
    question_type = serializers.CharField(source='question.type')
    selected_options = serializers.SerializerMethodField()
    correct_options = serializers.SerializerMethodField()
    correct_string_answer = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()
    max_points = serializers.IntegerField(source='question.points')

    class Meta:
        model = UserAnswer
        fields = (
            'question_id', 'question_text', 'question_type',
            'selected_options', 'string_answer',
            'correct_options', 'correct_string_answer',
            'is_correct', 'is_partial',
            'points_earned', 'max_points',
            'explanation',
        )

    def get_selected_options(self, obj):
        return list(obj.selected_options.values('id', 'text'))

    def get_correct_options(self, obj):
        if not obj.attempt.quiz.show_explanation_after:
            return None
        if obj.question.type in ('single', 'multiple'):
            return list(
                obj.question.options.filter(is_correct=True).values('id', 'text')
            )
        return []

    def get_correct_string_answer(self, obj):
        if not obj.attempt.quiz.show_explanation_after:
            return None
        if obj.question.type == 'string':
            return obj.question.correct_string_answer
        return None

    def get_explanation(self, obj):
        if not obj.attempt.quiz.show_explanation_after:
            return None
        return obj.question.explanation or None


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    answers = UserAnswerResultSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title')
    passing_score = serializers.IntegerField(source='quiz.passing_score')
    show_explanation = serializers.BooleanField(source='quiz.show_explanation_after')

    class Meta:
        model = QuizAttempt
        fields = (
            'id', 'quiz_title', 'status',
            'started_at', 'finished_at',
            'score', 'total_points', 'earned_points',
            'is_passed', 'passing_score',
            'show_explanation',
            'answers',
        )


















