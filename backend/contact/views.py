from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import ContactSerializer


class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response({"detail": "Thanks! Your message was sent. We'll reply by email soon."}, status=status.HTTP_201_CREATED)
