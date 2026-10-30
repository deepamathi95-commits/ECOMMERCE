from django.contrib import admin, messages

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = [f.name for f in OrderItem._meta.fields if f.name != "order"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "total", "payment_method", "payment_status", "status", "created_at")
    list_filter = ("status", "payment_method", "payment_status")
    search_fields = ("order_number", "email", "full_name")
    readonly_fields = (
        "order_number", "user", "idempotency_key", "subtotal", "discount_amount", "shipping_charge", "total",
        "payment_method", "created_at", "updated_at",
    )
    inlines = [OrderItemInline]
    actions = ["cancel_and_restock"]

    @admin.action(description="Cancel selected orders and return items to stock")
    def cancel_and_restock(self, request, queryset):
        done = sum(1 for order in queryset if order.cancel_and_restock())
        self.message_user(request, f"{done} order(s) cancelled and restocked.", messages.SUCCESS)
