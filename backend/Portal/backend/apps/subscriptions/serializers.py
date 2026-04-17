from rest_framework import serializers
from .models import Subscription
from django.contrib.auth.models import User



class SubscriptionSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)


    class Meta:
        model = Subscription
        fields = ("id", "author", "author_email", "created_at")
        read_only_fields = ("id", "created_at")