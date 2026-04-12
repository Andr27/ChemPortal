import this
from calendar import c

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q

from Portal.choices import ModerationStatus



class GlobalSearchView(APIView):
    permission_classes = (AllowAny, )
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')
        limit = int(request.query_params.get('limit', 10))
        if not query or len(query) < 2:
            return Response({
                'query': query,
                'results': {
                    'posts': [],
                    'courses': [],
                    'sections': [],
                    'tags': [],
                }
            })
        results = {}

        if search_type in ('all', 'posts'):
            results['posts'] = self._search_posts(query, limit)

        if search_type in ('all', 'courses'):
            results['courses'] = self._seacrch_courses(query, limit)

        if search_type in ('all', 'sections'):
            results['sections'] = self._search_sections(query, limit)

        if search_type in ('all', 'tags'):
            results['tags'] = self._search_tags(query, limit)

        return Response({'query': query, 'results': results})


    def _search_posts(self, query, limit):
        from apps.posts.models import Post
        from Portal.choices import ModerationStatus

        search_vector = SearchVector('title', weight='A') + SearchVector('body', weight='B')
        search_query = SearchQuery(query, config='russian')

        posts = Post.objects.annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(
            rank__gt=0.01,
            status=ModerationStatus.PUBLISHED
        ).order_by('-rank')[:limit]

        if not posts.exists():
            posts = Post.objects.filter(
                Q(title__icontains=query) | Q(body__icontains=query),
                status=ModerationStatus.PUBLISHED
            )[:limit]

        return [
            {
                'id': p.id,
                'title': p.title,
                'type': p.type,
                'author': {
                    'id': p.author.id,
                    'first_name': p.author.first_name,
                    'last_name': p.author.last_name,
                },
                'created_at': p.created_at,
                'tags': [{'id': t.id, 'name': t.name, 'slug': t.slug} for t in p.tags.all()[:3]],
            }
            for p in posts
        ]

    def _seacrch_courses(self, query, limit):
        from apps.education.models import Course

        secrch_vector = SearchVector('title', weight='A') + SearchVector('description', weight='B')
        secrch_query = SearchQuery(query, config='russian')

        courses = Course.objects.annotate(
            rank=SearchRank(secrch_vector, secrch_query)
        ).filter(
            rank__gt=0.01,
            status=ModerationStatus.PUBLISHED
        ).select_related('section', 'created_by').order_by('-rank')[:limit]
        if not courses.exists():
            courses = Course.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query),
                status=ModerationStatus.PUBLISHED
            ).select_related('section', 'created_by')[:limit]

        return [
            {
                'id': c.id,
                'title': c.title,
                'description': c.description[:200] if c.description else '',
                'rating': c.rating,
                'section': {'id': c.section.id, 'title': c.section.title},
                'created_by': {
                    'id': c.created_by.id,
                    'first_name': c.created_by.first_name,
                    'last_name': c.created_by.last_name,
                },
            }
            for c in courses
        ]

    def _search_sections(self, query, limit):
        from apps.education.models import EducationSection

        search_vector = SearchVector('title', weight='A') + SearchVector('description', weight='B')
        search_query = SearchQuery(query, config='russian')
        sections = EducationSection.objects.annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(
            rank__gt=0.01,
            status=ModerationStatus.PUBLISHED
        ).select_related('created_by').order_by('-rank')[:limit]
        if not sections.exists():
            sections = EducationSection.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query),
                status=ModerationStatus.PUBLISHED
            ).select_related('created_by')[:limit]

        return [
            {
                'id': s.id,
                'title': s.title,
                'description': s.description[:200] if s.description else '',
                'rating': s.rating,
                'created_by': {
                    'id': s.created_by.id,
                    'first_name': s.created_by.first_name,
                    'last_name': s.created_by.last_name,
                },
            }
            for s in sections
        ]

    def _search_tags(self, query, limit):
        from apps.tags.models import Tag

        tag = Tag.objects.filter(
            name__icontains=query,
            is_active=True
        )[:limit]
        return [
            {
                "id": t.id,
                'name': t.name,
                'slug': t.slug,
            }
            for t in tag
        ]