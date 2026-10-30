from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "image", "product_count")

    def get_image(self, obj):
        return obj.get_image_url(self.context.get("request"))


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt", "color", "position")

    def get_url(self, obj):
        return obj.get_url(self.context.get("request"))


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    colors = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "price", "discount_price", "current_price", "discount_percent",
            "category", "audience", "image", "colors", "rating", "review_count", "in_stock",
            "is_featured", "is_best_seller",
        )

    def get_image(self, obj):
        images = list(obj.images.all())  # prefetched
        first = next((i for i in images if not i.color), images[0] if images else None)
        return first.get_url(self.context.get("request")) if first else ""

    def get_colors(self, obj):
        return obj.color_list


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description", "specifications", "stock_quantity", "sizes", "images", "related",
        )

    def get_sizes(self, obj):
        return obj.size_list

    def get_related(self, obj):
        qs = (
            Product.objects.filter(is_active=True, category=obj.category)
            .exclude(pk=obj.pk)
            .select_related("category")
            .prefetch_related("images")[:4]
        )
        return ProductListSerializer(qs, many=True, context=self.context).data
