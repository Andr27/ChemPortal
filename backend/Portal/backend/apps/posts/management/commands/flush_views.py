from django.core.management.base import BaseCommand
from apps.posts.services import flush_post_views




class Command(BaseCommand):
    def handle(self, *args, **options):
        flush_post_views()
        self.stdout.write("Views flushed")

