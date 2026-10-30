from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartItemWriteSerializer, serialize_cart
from .validators import validate_quantity


def get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def add_to_cart(cart, product, size, color, quantity):
    """Adds quantity to an existing identical line, validating the combined total."""
    item = CartItem.objects.select_for_update().filter(cart=cart, product=product, size=size, color=color).first()
    new_qty = (item.quantity if item else 0) + quantity
    validate_quantity(product, new_qty)
    if item:
        item.quantity = new_qty
        item.save(update_fields=["quantity"])
    else:
        item = CartItem.objects.create(cart=cart, product=product, size=size, color=color, quantity=new_qty)
    return item


class CartView(APIView):
    def get(self, request):
        return Response(serialize_cart(get_cart(request.user), request))

    def delete(self, request):
        get_cart(request.user).items.all().delete()
        return Response(serialize_cart(get_cart(request.user), request))


class CartItemListView(APIView):
    def post(self, request):
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        with transaction.atomic():
            add_to_cart(get_cart(request.user), d["product"], d["size"], d["color"], d["quantity"])
        return Response(serialize_cart(get_cart(request.user), request), status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    def _item(self, request, pk):
        from django.shortcuts import get_object_or_404

        return get_object_or_404(CartItem.objects.select_related("product"), pk=pk, cart__user=request.user)

    def patch(self, request, pk):
        item = self._item(request, pk)
        try:
            quantity = int(request.data.get("quantity"))
        except (TypeError, ValueError):
            raise ValidationError({"quantity": "Enter a whole number."})
        validate_quantity(item.product, quantity)
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(serialize_cart(item.cart, request))

    def delete(self, request, pk):
        item = self._item(request, pk)
        cart = item.cart
        item.delete()
        return Response(serialize_cart(cart, request))


class CartSyncView(APIView):
    """Merge a guest (localStorage) cart into the account cart after login.
    Lines that are no longer valid are skipped and reported instead of failing the whole sync."""

    def post(self, request):
        lines = request.data.get("items", [])
        if not isinstance(lines, list) or len(lines) > 50:
            raise ValidationError({"items": "Provide a list of up to 50 items."})
        cart, skipped = get_cart(request.user), []
        for line in lines:
            serializer = CartItemWriteSerializer(data=line)
            try:
                serializer.is_valid(raise_exception=True)
                d = serializer.validated_data
                with transaction.atomic():
                    add_to_cart(cart, d["product"], d["size"], d["color"], d["quantity"])
            except ValidationError as exc:
                skipped.append({"product_id": line.get("product_id") if isinstance(line, dict) else None, "reason": exc.detail})
        data = serialize_cart(cart, request)
        data["skipped"] = skipped
        return Response(data)
