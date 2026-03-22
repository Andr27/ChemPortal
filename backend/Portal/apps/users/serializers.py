from rest_framework import serializers
from django.contrib.auth.models import User
from apps.subscriptions.models import Subscription


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

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'avatar', 'rating', 'level')

    def get_level(self, obj):
        return obj.profile.get_level()


class MeUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', required=False)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'avatar')  # было field вместо fields

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        # было profile_data.get — неправильно, надо validated_data
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        profile = instance.profile
        if 'avatar' in profile_data:
            profile.avatar = profile_data['avatar']
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

