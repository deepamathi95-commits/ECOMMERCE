from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import (
    AddressSerializer, LoginSerializer, ProfileUpdateSerializer, RegisterSerializer, UserSerializer,
)


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"user": UserSerializer(user).data, **tokens_for(user)}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request, username=serializer.validated_data["email"].strip().lower(), password=serializer.validated_data["password"]
        )
        if user is None:
            return Response({"detail": "Incorrect email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        Profile.objects.get_or_create(user=user)
        return Response({"user": UserSerializer(user).data, **tokens_for(user)})


class LogoutView(APIView):
    """Blacklists the refresh token so it cannot be used again.
    Possessing the refresh token is the proof needed, so no access token is required
    (the client clears its session first, then calls this)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh", "")).blacklist()
        except TokenError:
            pass  # already invalid/expired: the user is effectively logged out
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    def get(self, request):
        Profile.objects.get_or_create(user=request.user)
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        request.user.refresh_from_db()
        return Response(UserSerializer(request.user).data)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    pagination_class = None

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
