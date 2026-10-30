from django.conf import settings
from rest_framework import serializers


def max_quantity(product):
    return min(product.stock_quantity, settings.MAX_LINE_QUANTITY)


def validate_variant(product, size, color):
    """Size/color must be one the product actually offers."""
    errors = {}
    sizes, colors = product.size_list, product.color_names
    if sizes and size not in sizes:
        errors["size"] = "Please choose an available size."
    if not sizes and size:
        errors["size"] = "This product has no size options."
    if colors and color not in colors:
        errors["color"] = "Please choose an available color."
    if not colors and color:
        errors["color"] = "This product has no color options."
    if errors:
        raise serializers.ValidationError(errors)


def validate_quantity(product, quantity):
    if not product.is_active:
        raise serializers.ValidationError({"detail": f"{product.name} is no longer available."})
    if product.stock_quantity <= 0:
        raise serializers.ValidationError({"quantity": f"{product.name} is out of stock."})
    limit = max_quantity(product)
    if quantity < 1:
        raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
    if quantity > limit:
        raise serializers.ValidationError({"quantity": f"Only {limit} available for {product.name}."})
