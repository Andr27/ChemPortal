from rest_framework import serializers

from Portal.choices import ModerationStatus
from .models import Tag, TagRequest, FavoriteTag




class TagSerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug', 'description', 'posts_count', 'is_favorite')

    def get_posts_count(self, obj):
        return obj.posts.filter(status=ModerationStatus.PUBLISHED).count()

    def get_is_favorite(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.favorited_by.filter(user=user).exists()



class TagRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagRequest
        fields = ('id', 'name', 'reason', 'status', 'created_at')
        read_only_fields = ('status', 'created_at')


class TagRequestDetailSerializer(serializers.ModelSerializer):
    requested_by = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = TagRequest
        fields = (
            'id', 'name', 'reason',
            'status', 'created_at',
            'requested_by',
            'reviewed_by', 'review_comment', 'reviewed_at',
        )


    def get_requested_by(self, obj):
        return {
            'id': obj.requested_by.id,
            'email': obj.requested_by.email,
            'first_name': obj.requested_by.first_name,
            'last_name': obj.requested_by.last_name,
        }

    def get_reviewed_by(self, obj):
        if not obj.reviewed_by:
            return None
        return {
            'id': obj.reviewed_by.id,
            'email': obj.reviewed_by.email,
        }




