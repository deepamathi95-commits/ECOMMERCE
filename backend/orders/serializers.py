import re

from rest_framework import serializers

from accounts.models import phone_validator

from .models import Order, OrderItem

POSTAL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 \-]{2,11}$")


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id", "product", "product_name", "product_image", "size", "color", "quantity",
            "list_price", "unit_price", "line_total",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "order_number", "status", "status_display", "payment_method", "payment_method_display",
            "payment_status", "payment_status_display", "full_name", "email", "phone", "address_line", "city",
            "state", "postal_code", "country", "subtotal", "discount_amount", "shipping_charge", "total",
            "created_at", "items",
        )
        read_only_fields = fields


class ShippingSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, validators=[phone_validator])
    address_line = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=80)
    state = serializers.CharField(max_length=80)
    postal_code = serializers.CharField(max_length=12)
    country = serializers.CharField(max_length=80)

    def validate_postal_code(self, value):
        value = value.strip()
        if not POSTAL_RE.match(value):
            raise serializers.ValidationError("Enter a valid postal code.")
        return value


class OrderLineSerializer(serializers.Serializer):
    """Only identifiers and quantity are accepted; any price sent by the client is ignored."""

    product_id = serializers.IntegerField()
    size = serializers.CharField(required=False, allow_blank=True, default="", max_length=10)
    color = serializers.CharField(required=False, allow_blank=True, default="", max_length=40)
    quantity = serializers.IntegerField(min_value=1)


class CreateOrderSerializer(serializers.Serializer):
    shipping = ShippingSerializer()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    simulated_outcome = serializers.ChoiceField(choices=["success", "decline"], required=False, default="success")
    items = OrderLineSerializer(many=True, required=False)
    idempotency_key = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
