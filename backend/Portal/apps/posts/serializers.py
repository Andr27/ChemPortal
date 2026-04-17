from rest_framework import serializers
from .models import Post, Comment, Like, Dislike, PostImage
from ..subscriptions.models import Subscription
from ..tags.models import Tag
from ..tags.serializers import TagSerializer


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
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.filter(is_active=True),
        write_only=True, source='tags'
    )


    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author',)

    def create(self, validated_data):

        images = validated_data.pop('uploaded_images', [])
        tags = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)

        for image in images:
            PostImage.objects.create(
                post=post,
                image=image
            )

        return post

    def update(self, instance, validated_data):

        images = validated_data.pop('uploaded_images', [])
        tags = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)

        if tags is not None:
            instance.tags.set(tags)

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

    def validate_tags(self, tags):
        for tag in tags:
            if not tag.is_active:
                raise serializers.ValidationError(f'Тег "{tag.name}" недоступен.')
        return tags

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        return obj.id in self.context.get('liked_ids', set())

    def get_is_disliked(self, obj):
        return obj.id in self.context.get('disliked_ids', set())

    def get_is_bookmarked(self, obj):
        return obj.id in self.context.get('bookmarked_ids', set())

    def get_is_subscribed(self, obj):
        return obj.author_id in self.context.get('subscribed_ids', set())

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
    author = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "author",
            "text",
            "created_at",
            "children"
        )
    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "first_name": obj.author.first_name,
            "last_name": obj.author.last_name,
        }


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ("id", "user", "post", "created_at")

class DislikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dislike
        fields = ("id", "user", "post", "created_at")


