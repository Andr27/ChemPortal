from rest_framework import serializers
from django.contrib.auth.models import User
from apps.subscriptions.models import Subscription
from apps.users.models import CreatorApplication


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data.get('email'),
            email=validated_data.get('email'),
            password=validated_data.get('password'),
            first_name=validated_data.get('first_name', ""),
            last_name=validated_data.get('last_name', ""),
            is_active = False
        )
        return user

class MeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)
    rating = serializers.IntegerField(source='profile.rating', read_only=True)
    level = serializers.SerializerMethodField()
    bio = serializers.CharField(source='profile.bio', read_only=True)
    affiliation = serializers.CharField(source='profile.affiliation', read_only=True)
    scientific_interests = serializers.CharField(source='profile.scientific_interests', read_only=True)
    vk_url = serializers.URLField(source='profile.vk_url', read_only=True)
    telegram_url = serializers.URLField(source='profile.telegram_url', read_only=True)
    website_url = serializers.URLField(source='profile.website_url', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role',
                  'avatar', 'rating', 'level', 'bio', 'affiliation',
                  'scientific_interests', 'vk_url', 'telegram_url', 'website_url')

    def get_level(self, obj):
        return obj.profile.get_level()


class MeUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', required=False)
    bio = serializers.CharField(source='profile.bio', required=False)
    affiliation = serializers.CharField(source='profile.affiliation', required=False)
    scientific_interests = serializers.CharField(source='profile.scientific_interests', required=False)
    vk_url = serializers.URLField(source='profile.vk_url', required=False)
    telegram_url = serializers.URLField(source='profile.telegram_url', required=False)
    website_url = serializers.URLField(source='profile.website_url', required=False)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'avatar', 'bio', 'affiliation',
                  'scientific_interests', 'vk_url', 'telegram_url', 'website_url')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        profile = instance.profile
        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()

        return instance

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email не найден')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8)



class ProfileSerializer(serializers.ModelSerializer):
    subscribers_count = serializers.SerializerMethodField()
    rating = serializers.IntegerField(source='profile.rating', read_only=True)
    level = serializers.SerializerMethodField()
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'subscribers_count', 'rating', 'level', 'avatar')

    def get_subscribers_count(self, obj):
        return Subscription.objects.filter(author=obj).count()

    def get_level(self, obj):
        return obj.profile.get_level()



class CreatorApplicationSerializer(serializers.ModelSerializer):
    """Для создания заявки пользователем"""
    class Meta:
        model = CreatorApplication
        fields = ('id', 'bio', 'affiliation', 'scientific_interests',
                  'vk_url', 'telegram_url', 'website_url', 'status', 'created_at')
        read_only_fields = ('status', 'created_at')


class CreatorApplicationDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = CreatorApplication
        fields = ('id', 'user', 'bio', 'affiliation', 'scientific_interests',
                  'vk_url', 'telegram_url', 'website_url',
                  'status', 'reject_comment', 'reviewed_by', 'reviewed_at', 'created_at')

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'avatar': obj.user.profile.avatar.url if obj.user.profile.avatar else None,
        }

    def get_reviewed_by(self, obj):
        if not obj.reviewed_by:
            return None
        return {
            'id': obj.reviewed_by.id,
            'email': obj.reviewed_by.email,
        }

class CreatorProfileSerializer(serializers.ModelSerializer):
    """Профтль для Креатора"""
    subscribers_count = serializers.SerializerMethodField()
    rating = serializers.IntegerField(source='profile.rating', read_only=True)
    level = serializers.SerializerMethodField()
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)
    bio = serializers.CharField(source='profile.bio', read_only=True)
    affiliation = serializers.CharField(source='profile.affiliation', read_only=True)
    scientific_interests = serializers.CharField(source='profile.scientific_interests', read_only=True)
    vk_url = serializers.URLField(source='profile.vk_url', read_only=True)
    telegram_url = serializers.URLField(source='profile.telegram_url', read_only=True)
    website_url = serializers.URLField(source='profile.website_url', read_only=True)
    posts_count = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'avatar', 'rating', 'level',
                  'bio', 'affiliation', 'scientific_interests',
                  'vk_url', 'telegram_url', 'website_url',
                  'subscribers_count', 'posts_count', 'courses_count')


    def get_subscribers_count(self, obj):
        return Subscription.objects.filter(author=obj).count()


    def get_level(self, obj):
        return obj.profile.get_level()


    def get_posts_count(self, obj):
        from apps.posts.models import Post
        from Portal.choices import ModerationStatus
        return Post.objects.filter(author=obj, status=ModerationStatus.PUBLISHED).count()


    def get_courses_count(self, obj):
        from apps.education.models import Course
        from Portal.choices import ModerationStatus
        return Course.objects.filter(created_by=obj, status=ModerationStatus.PUBLISHED).count()