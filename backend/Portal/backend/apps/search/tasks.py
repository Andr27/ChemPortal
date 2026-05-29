from email._header_value_parser import Section

from celery import shared_task



@shared_task
def generate_post_embedding(post_id: int):
    from apps.posts.models import Post
    from apps.tags.ml import encode
    from .models import PostEmbedding
    from Portal.choices import ModerationStatus


    try:
        post = Post.objects.get(id=post_id, status=ModerationStatus.PUBLISHED)
        text = f'passage: {post.title}. {post.body[:1000]}'
        vector = encode([text])[0].tolist()
        PostEmbedding.objects.update_or_create(
            post=post,
            defaults={'vector': vector}
        )
    except Post.DoesNotExist:
        pass



@shared_task
def generate_course_embedding(course_id: int):
    from apps.education.models import Course
    from apps.tags.ml import encode
    from .models import CourseEmbedding
    from Portal.choices import ModerationStatus


    try:
        course = Course.objects.get(id=course_id, status=ModerationStatus.PUBLISHED)
        text = f'passage: {course.title}. {course.description[:1000]}'
        vector = encode([text])[0].tolist()
        CourseEmbedding.objects.update_or_create(
            course=course,
            defaults={'vector': vector}
        )
    except Course.DoesNotExist:
        pass

@shared_task
def generate_sections_embedding(section_id: int):
    from apps.education.models import EducationSection
    from apps.tags.ml import encode
    from .models import SectionEmbedding
    from Portal.choices import ModerationStatus


    try:
        section = EducationSection.objects.get(id=section_id, status=ModerationStatus.PUBLISHED)
        text = f'passage: {section.title}. {section.description[:1000]}'
        vector = encode([text])[0].tolist()
        SectionEmbedding.objects.update_or_create(
            section=section,
            defaults={'vector': vector}
        )
    except EducationSection.DoesNotExist:
        pass


@shared_task
def generate_all_embeddings():
    from apps.posts.models import Post
    from apps.education.models import Course, EducationSection
    from Portal.choices import ModerationStatus

    post_ids = Post.objects.filter(
        status=ModerationStatus.PUBLISHED
    ).values_list('id', flat=True)
    for pid in post_ids:
        generate_post_embedding.delay(pid)

    course_ids = Course.objects.filter(
        status=ModerationStatus.PUBLISHED
    ).values_list('id', flat=True)
    for cid in course_ids:
        generate_course_embedding.delay(cid)

    section_ids = EducationSection.objects.filter(
        status=ModerationStatus.PUBLISHED
    ).values_list('id', flat=True)
    for sid in section_ids:
        generate_sections_embedding.delay(sid)
