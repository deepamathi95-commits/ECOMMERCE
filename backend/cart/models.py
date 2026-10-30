from django.conf import settings
from django.db import models

from products.models import Product


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=40, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["added_at", "id"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product", "size", "color"], name="unique_cart_variant"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
