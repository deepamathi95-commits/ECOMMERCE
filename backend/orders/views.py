from collections import defaultdict

from django.db import IntegrityError, transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart, CartItem
from cart.validators import validate_quantity, validate_variant
from config.pagination import StandardPagination
from products.models import Product

from .models import Order, OrderItem
from .pricing import compute_totals, money
from .serializers import CreateOrderSerializer, OrderSerializer


class PaymentDeclined(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "The simulated payment was declined. No order was created and you were not charged."
    default_code = "payment_declined"


def _lines_from_request(user, data):
    """Use the lines sent with the request, otherwise fall back to the saved server cart."""
    if data.get("items"):
        return [dict(line) for line in data["items"]]
    cart = Cart.objects.filter(user=user).first()
    lines = [
        {"product_id": i.product_id, "size": i.size, "color": i.color, "quantity": i.quantity}
        for i in (cart.items.all() if cart else [])
    ]
    if not lines:
        raise ValidationError({"detail": "Your cart is empty."})
    return lines


def _create_order(user, data):
    lines = _lines_from_request(user, data)
    ids = sorted({line["product_id"] for line in lines})

    with transaction.atomic():
        # Lock rows so two checkouts cannot oversell the same stock.
        products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=ids, is_active=True)}
        missing = set(ids) - set(products)
        if missing:
            raise ValidationError({"detail": "Some items in your order are no longer available."})

        per_product = defaultdict(int)
        for line in lines:
            product = products[line["product_id"]]
            validate_variant(product, line["size"], line["color"])
            per_product[product.id] += line["quantity"]
        for pid, qty in per_product.items():
            validate_quantity(products[pid], qty)  # combined quantity across sizes/colors

        if data["payment_method"] == Order.PaymentMethod.SIMULATED and data["simulated_outcome"] == "decline":
            raise PaymentDeclined()

        totals = compute_totals((products[l["product_id"]].price, products[l["product_id"]].current_price, l["quantity"]) for l in lines)
        simulated = data["payment_method"] == Order.PaymentMethod.SIMULATED
        order = Order.objects.create(
            user=user,
            idempotency_key=data.get("idempotency_key") or None,
            payment_method=data["payment_method"],
            payment_status=Order.PaymentStatus.SIMULATED_PAID if simulated else Order.PaymentStatus.PENDING,
            status=Order.Status.CONFIRMED if simulated else Order.Status.PENDING,
            subtotal=totals["subtotal"], discount_amount=totals["discount"],
            shipping_charge=totals["shipping"], total=totals["total"],
            **data["shipping"],
        )
        for line in lines:
            p = products[line["product_id"]]
            images = list(p.images.all())
            image = next((i for i in images if line["color"] and i.color == line["color"]), None) or next(
                (i for i in images if not i.color), images[0] if images else None
            )
            OrderItem.objects.create(
                order=order, product=p, product_name=p.name, product_image=image.get_url() if image else "",
                size=line["size"], color=line["color"], quantity=line["quantity"],
                list_price=money(p.price), unit_price=money(p.current_price),
                line_total=money(p.current_price * line["quantity"]),
            )
        for pid, qty in per_product.items():
            Product.objects.filter(pk=pid).update(stock_quantity=F("stock_quantity") - qty)
        CartItem.objects.filter(cart__user=user).delete()
    return order


class OrderListCreateView(APIView):
    def get(self, request):
        qs = Order.objects.filter(user=request.user).prefetch_related("items")
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(OrderSerializer(page, many=True).data)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        key = data.get("idempotency_key")
        if key:  # a retry/double click returns the order already created
            existing = Order.objects.filter(user=request.user, idempotency_key=key).first()
            if existing:
                return Response(OrderSerializer(existing).data, status=status.HTTP_200_OK)
        try:
            order = _create_order(request.user, data)
        except IntegrityError:
            existing = Order.objects.filter(user=request.user, idempotency_key=key).first()
            if not existing:
                raise
            return Response(OrderSerializer(existing).data, status=status.HTTP_200_OK)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")
