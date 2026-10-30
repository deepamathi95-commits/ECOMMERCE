from rest_framework import serializers

from orders.pricing import compute_totals, money
from products.models import Product

from .models import CartItem
from .validators import max_quantity, validate_quantity, validate_variant


class CartItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField(required=False, allow_blank=True, default="", max_length=10)
    color = serializers.CharField(required=False, allow_blank=True, default="", max_length=40)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        try:
            product = Product.objects.get(pk=attrs["product_id"], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "This product does not exist."})
        attrs["product"] = product
        validate_variant(product, attrs["size"], attrs["color"])
        return attrs


class CartItemReadSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    list_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    max_quantity = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ("id", "product", "size", "color", "quantity", "unit_price", "list_price", "line_total", "max_quantity")

    def get_product(self, obj):
        p = obj.product
        images = list(p.images.all())
        match = next((i for i in images if i.color == obj.color and obj.color), None) or next(
            (i for i in images if not i.color), images[0] if images else None
        )
        return {
            "id": p.id, "name": p.name, "slug": p.slug, "in_stock": p.in_stock, "is_active": p.is_active,
            "image": match.get_url(self.context.get("request")) if match else "",
        }

    def get_unit_price(self, obj):
        return str(money(obj.product.current_price))

    def get_list_price(self, obj):
        return str(money(obj.product.price))

    def get_line_total(self, obj):
        return str(money(obj.product.current_price * obj.quantity))

    def get_max_quantity(self, obj):
        return max_quantity(obj.product)


def serialize_cart(cart, request):
    items = list(cart.items.select_related("product").prefetch_related("product__images"))
    summary = compute_totals((i.product.price, i.product.current_price, i.quantity) for i in items)
    return {
        "items": CartItemReadSerializer(items, many=True, context={"request": request}).data,
        "item_count": sum(i.quantity for i in items),
        "summary": {k: str(v) for k, v in summary.items()},
    }
