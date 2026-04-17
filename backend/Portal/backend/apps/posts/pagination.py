from rest_framework.pagination import PageNumberPagination


class PostAPIListPagination(PageNumberPagination):
    page_size = 3
    page_size_query_param = 'limit'
    max_page_size = 15