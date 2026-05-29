from rest_framework import serializers
from .models import Subscription
from django.contrib.auth.models import User



class SubscriptionSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_first_name = serializers.CharField(source='author.first_name', read_only=True)
    author_last_name = serializers.CharField(source='author.last_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()




    class Meta:
        model = Subscription
        fields = (
            "id", "author", "author_id", "author_email",
            "author_first_name", "author_last_name", "author_avatar",
            "created_at"
        )
        read_only_fields = ("id", "created_at")

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        avatar = obj.author.profile.avatar
        if avatar and request:
            return request.build_absolute_uri(avatar.url)
        return None