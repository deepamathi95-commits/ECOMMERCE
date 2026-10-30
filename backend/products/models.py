from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


def image_url(image_field, path, request=None):
    """Uploaded image (admin) wins; otherwise fall back to a bundled path such as /images/products/x.png."""
    if image_field:
        url = image_field.url
        return request.build_absolute_uri(url) if request else url
    return path or ""


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    image_path = models.CharField(max_length=255, blank=True, help_text="Bundled image path, e.g. /images/banners/men.png")

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_image_url(self, request=None):
        return image_url(self.image, self.image_path, request)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Audience(models.TextChoices):
        MEN = "men", "Men"
        WOMEN = "women", "Women"
        KIDS = "kids", "Kids"
        UNISEX = "unisex", "Unisex"

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    audience = models.CharField(max_length=10, choices=Audience.choices, default=Audience.UNISEX)
    sizes = models.CharField(max_length=120, blank=True, help_text="Comma separated, e.g. 6,7,8,9")
    colors = models.CharField(max_length=200, blank=True, help_text="Comma separated Name:#hex, e.g. Tan:#B07A45,Navy:#1F2A44")
    specifications = models.JSONField(default=dict, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=Decimal("0.0"))
    review_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gt=0), name="product_price_positive"),
        ]

    def clean(self):
        if self.discount_price is not None and self.discount_price >= self.price:
            raise ValidationError({"discount_price": "Discount price must be lower than the regular price."})

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "product"
            slug, n = base, 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        super().save(*args, **kwargs)

    # --- helpers -------------------------------------------------------
    @property
    def size_list(self):
        return [s.strip() for s in self.sizes.split(",") if s.strip()]

    @property
    def color_list(self):
        out = []
        for part in self.colors.split(","):
            part = part.strip()
            if not part:
                continue
            name, _, hexcode = part.partition(":")
            out.append({"name": name.strip(), "hex": hexcode.strip() or "#cccccc"})
        return out

    @property
    def color_names(self):
        return [c["name"] for c in self.color_list]

    @property
    def current_price(self):
        return self.discount_price if self.discount_price is not None else self.price

    @property
    def discount_percent(self):
        if self.discount_price is None or self.price <= 0:
            return 0
        return int(round((self.price - self.discount_price) / self.price * 100))

    @property
    def in_stock(self):
        return self.stock_quantity > 0

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/", blank=True)
    path = models.CharField(max_length=255, blank=True, help_text="Bundled image path, e.g. /images/products/x.png")
    alt = models.CharField(max_length=200, blank=True)
    color = models.CharField(max_length=40, blank=True, help_text="Leave blank for images shared by all colors")
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def clean(self):
        if not self.image and not self.path:
            raise ValidationError("Provide an uploaded image or a bundled image path.")

    def get_url(self, request=None):
        return image_url(self.image, self.path, request)

    def __str__(self):
        return f"{self.product.name} image {self.position}"
