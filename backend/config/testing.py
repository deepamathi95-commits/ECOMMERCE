"""Shared helpers for tests."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from products.models import Category, Product, ProductImage

User = get_user_model()


class StoreTestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Sneakers")
        self.boots = Category.objects.create(name="Boots")
        self.runner = self.make_product("Runner", price="80.00", discount="60.00", stock=5, sizes="7,8,9", colors="Navy:#1F2A44,White:#FFFFFF")
        self.boot = self.make_product("Hiker Boot", price="120.00", stock=3, sizes="8,9", colors="Brown:#6B4A32", category=self.boots)
        self.user = User.objects.create_user("a@example.com", "a@example.com", "StrongPass!234", first_name="Ann")
        self.other = User.objects.create_user("b@example.com", "b@example.com", "StrongPass!234", first_name="Bob")

    def make_product(self, name, price="50.00", discount=None, stock=10, sizes="8", colors="", category=None, **extra):
        p = Product.objects.create(
            name=name, description=f"{name} description", price=Decimal(price),
            discount_price=Decimal(discount) if discount else None, category=category or self.category,
            sizes=sizes, colors=colors, stock_quantity=stock, **extra,
        )
        ProductImage.objects.create(product=p, path=f"/images/products/{p.slug}.png", alt=name)
        return p

    def login(self, user=None):
        self.client.force_authenticate(user or self.user)

    def shipping(self, **over):
        data = {
            "full_name": "Ann Lee", "email": "a@example.com", "phone": "+1 555 123 4567",
            "address_line": "12 Main St", "city": "Austin", "state": "TX", "postal_code": "73301", "country": "USA",
        }
        data.update(over)
        return data
