from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Address, Profile, phone_validator

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="profile.phone", read_only=True, default="")

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone", "date_joined")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    first_name = serializers.CharField(max_length=60)
    last_name = serializers.CharField(max_length=60, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, validators=[phone_validator])

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(username__iexact=value).exists() or User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        probe = User(username=attrs["email"], email=attrs["email"], first_name=attrs["first_name"])
        try:
            validate_password(attrs["password"], probe)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, data):
        user = User.objects.create_user(
            username=data["email"],
            email=data["email"],
            password=data["password"],
            first_name=data["first_name"].strip(),
            last_name=data.get("last_name", "").strip(),
        )
        Profile.objects.create(user=user, phone=data.get("phone", ""))
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=60, required=False)
    last_name = serializers.CharField(max_length=60, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, validators=[phone_validator])

    def update(self, user, data):
        for field in ("first_name", "last_name"):
            if field in data:
                setattr(user, field, data[field].strip())
        user.save()
        if "phone" in data:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.phone = data["phone"]
            profile.save()
        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id", "label", "full_name", "phone", "address_line", "city", "state", "postal_code", "country", "is_default",
        )
