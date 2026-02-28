from rest_framework import serializers
from .models import Post, Comment, Like, Dislike, PostImage
from ..subscriptions.models import Subscription

class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image']


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    images = PostImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(child=serializers.ImageField(),
    write_only=True,
    required=False
                                            )


    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author',)

    def create(self, validated_data):

        images = validated_data.pop('uploaded_images', [])

        post = Post.objects.create(**validated_data)

        for image in images:
            PostImage.objects.create(
                post=post,
                image=image
            )

        return post

    def update(self, instance, validated_data):

        images = validated_data.pop('uploaded_images', [])

        instance = super().update(instance, validated_data)

        if images:
            instance.images.all().delete()

            for image in images:
                PostImage.objects.create(
                    post=instance,
                    image=image
                )

        return instance

    def validate(self, data):
        post_type = data.get('type')
        body = data.get('body')
        url = data.get('external_url')

        if post_type in {'article', "news"} and not body:
            raise serializers.ValidationError(
                "Text content is required for articles and news"
            )
        if post_type in {'video', "link"} and not body:
            raise serializers.ValidationError(
                "URL is required for videos and link posts"
            )



        return data

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.likes.filter(user=user).exists()

    def get_is_disliked(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.dislikes.filter(user=user).exists()

    def get_is_subscribed(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return Subscription.objects.filter(user=user, author=obj.author).exists()

    def get_is_bookmarked(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.bookmarked_by.filter(user=user).exists()

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "first_name": obj.author.first_name,
            "last_name": obj.author.last_name,
        }


class RecursiveCommentSerializer(serializers.ModelSerializer):
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    children = RecursiveCommentSerializer(many=True, read_only=True)
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "author",
            "text",
            "created_at",
            "children"
        )



class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ("id", "user", "post", "created_at")

class DislikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dislike
        fields = ("id", "user", "post", "created_at")


