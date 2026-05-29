from django.contrib.contenttypes.models import ContentType
from Portal.choices import ModerationStatus
from .models import ExpertReview


VOTES_TO_DECIDE = 2



def get_votes(obj):
    ct = ContentType.objects.get_for_model(obj)
    reviews = ExpertReview.objects.filter(content_type=ct, object_id=obj.id).select_related('expert')
    return {
        'reviews': reviews,
        'approve': reviews.filter(vote='approve').count(),
        'reject': reviews.filter(vote='reject').count(),
        'total': reviews.count(),
    }


def process_vote(obj, expert, vote, comment=''):
    ct = ContentType.objects.get_for_model(obj)

    ExpertReview.objects.update_or_create(
        content_type=ct,
        object_id=obj.id,
        expert=expert,
        defaults={'vote': vote, 'comment': comment}
    )

    votes = get_votes(obj)
    decision = None

    if votes['approve'] >= VOTES_TO_DECIDE:
        _apply_decision(obj, 'approved')
        decision = 'approved'

    elif votes['reject'] >= VOTES_TO_DECIDE:
        _apply_decision(obj, 'rejected')
        decision = 'rejected'

    return {
        'your_vote': vote,
        'votes': {
            'approve': votes['approve'],
            'reject': votes['reject'],
            'total': votes['total'],
        },
        'decision': decision,
        'detail': _decision_message(decision)
    }

def _apply_decision(obj, decision):
    from apps.posts.models import Post
    from .models import Course

    if decision == 'approved':
        obj.status = ModerationStatus.PUBLISHED
        obj.save()
        if isinstance(obj, Course):
            _publish_course_quizzes(obj)

    elif decision == 'rejected':
        obj.status = ModerationStatus.REJECTED
        if hasattr(obj, 'reject_comment'):
            obj.reject_comment = 'Отклонено экспертным советом'
        obj.save()

        # если это курс — откатываем тесты
        if isinstance(obj, Course):
            _rollback_course_quizzes(obj)


def _publish_course_quizzes(course):
    from apps.quiz.models import Quiz
    Quiz.objects.filter(
        chapter__course=course
    ).update(status=ModerationStatus.PUBLISHED)
    Quiz.objects.filter(
        lesson__chapter__course=course
    ).update(status=ModerationStatus.PUBLISHED)


def _rollback_course_quizzes(course):
    from apps.quiz.models import Quiz
    Quiz.objects.filter(
        chapter__course=course
    ).update(status=ModerationStatus.DRAFT)
    Quiz.objects.filter(
        lesson__chapter__course=course
    ).update(status=ModerationStatus.DRAFT)


def _decision_message(decision):
    if decision == 'approved':
        return 'Одобрено экспертным советом (2+ голоса за)'
    elif decision == 'rejected':
        return 'Отклонено экспертным советом (2+ голоса против)'
    return 'Голос учтён, ждём остальных экспертов'
