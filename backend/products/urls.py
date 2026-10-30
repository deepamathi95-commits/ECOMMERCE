from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import CategoryListView, ProductViewSet, StoreSettingsView

router = SimpleRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("store-settings/", StoreSettingsView.as_view(), name="store-settings"),
] + router.urls
