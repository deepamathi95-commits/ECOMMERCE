import secrets
import string

from django.conf import settings
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone

from products.models import Product


def generate_order_number():
    alphabet = string.ascii_uppercase + string.digits
    while True:
        number = f"SU-{timezone.now():%y%m%d}-{''.join(secrets.choice(alphabet) for _ in range(6))}"
        if not Order.objects.filter(order_number=number).exists():
            return number


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        SIMULATED = "simulated", "Simulated payment (demo, no real charge)"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending - pay on delivery"
        SIMULATED_PAID = "simulated_paid", "Simulated payment (no real charge)"
        FAILED = "failed", "Failed"

    order_number = models.CharField(max_length=24, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="orders")
    idempotency_key = models.CharField(max_length=64, blank=True, null=True)

    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    postal_code = models.CharField(max_length=12)
    country = models.CharField(max_length=80)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    payment_method = models.CharField(max_length=12, choices=PaymentMethod.choices)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(fields=["user", "idempotency_key"], name="unique_order_idempotency_per_user"),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_number()
        if not self.idempotency_key:
            self.idempotency_key = None  # NULLs never collide in the unique constraint
        super().save(*args, **kwargs)

    @transaction.atomic
    def cancel_and_restock(self):
        """Used by the admin action: marks the order cancelled and returns units to stock once."""
        if self.status == self.Status.CANCELLED:
            return False
        for item in self.items.select_related("product"):
            if item.product_id:
                Product.objects.filter(pk=item.product_id).update(stock_quantity=F("stock_quantity") + item.quantity)
        self.status = self.Status.CANCELLED
        self.save(update_fields=["status", "updated_at"])
        return True

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=160)
    product_image = models.CharField(max_length=255, blank=True)
    size = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=40, blank=True)
    quantity = models.PositiveIntegerField()
    list_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"
