from rest_framework import serializers
from .models import Notification




class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id', 'type', 'title', 'message', 'is_read', 'created_at',
            'post_id', 'course_id', 'lesson_id', 'comment_id'
        )
        read_only_fields = fields


