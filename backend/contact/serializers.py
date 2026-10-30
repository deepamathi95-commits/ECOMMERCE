from rest_framework import serializers

from .models import ContactMessage


class ContactSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=120, min_length=2)
    subject = serializers.CharField(max_length=160, min_length=3)
    message = serializers.CharField(max_length=3000, min_length=10)

    class Meta:
        model = ContactMessage
        fields = ("name", "email", "subject", "message")
