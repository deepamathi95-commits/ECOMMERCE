from django.urls import path

from .views import CartItemDetailView, CartItemListView, CartSyncView, CartView

urlpatterns = [
    path("", CartView.as_view(), name="cart"),
    path("items/", CartItemListView.as_view(), name="cart-items"),
    path("items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item"),
    path("sync/", CartSyncView.as_view(), name="cart-sync"),
]
