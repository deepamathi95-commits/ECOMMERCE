from decimal import Decimal, InvalidOperation

from django.db.models import Count, Q
from django.db.models.functions import Coalesce
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer

ORDERING = {
    "newest": ("-created_at", "-id"),
    "price_asc": ("effective_price", "id"),
    "price_desc": ("-effective_price", "id"),
    "rating": ("-rating", "-review_count", "id"),
    "popular": ("-review_count", "-rating", "id"),
}


def _decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        return None


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/products/ (search, category, audience, size, min_price, max_price, featured,
    best_seller, ordering) and GET /api/products/<id>/."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_serializer_class(self):
        return ProductDetailSerializer if self.action == "retrieve" else ProductListSerializer

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images")
            .annotate(effective_price=Coalesce("discount_price", "price"))
        )
        if self.action != "list":
            return qs
        p = self.request.query_params

        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(category__name__icontains=search)
            )
        if p.get("category"):
            qs = qs.filter(category__slug=p["category"])
        if p.get("audience"):
            qs = qs.filter(audience=p["audience"])
        size = p.get("size", "").strip()
        if size:
            qs = qs.filter(
                Q(sizes=size) | Q(sizes__startswith=f"{size},") | Q(sizes__endswith=f",{size}") | Q(sizes__contains=f",{size},")
            )
        low, high = _decimal(p.get("min_price")), _decimal(p.get("max_price"))
        if low is not None:
            qs = qs.filter(effective_price__gte=low)
        if high is not None:
            qs = qs.filter(effective_price__lte=high)
        if p.get("featured") in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)
        if p.get("best_seller") in ("1", "true", "True"):
            qs = qs.filter(is_best_seller=True)

        return qs.order_by(*ORDERING.get(p.get("ordering"), ORDERING["newest"]))


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(product_count=Count("products", filter=Q(products__is_active=True)))


class StoreSettingsView(generics.GenericAPIView):
    """Public business rules so guest carts show the same totals the server will charge."""

    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get(self, request):
        from django.conf import settings
        from rest_framework.response import Response

        return Response({
            "shipping_flat_rate": str(settings.SHIPPING_FLAT_RATE),
            "free_shipping_threshold": str(settings.FREE_SHIPPING_THRESHOLD),
            "max_line_quantity": settings.MAX_LINE_QUANTITY,
        })
