from decimal import Decimal

from config.testing import StoreTestCase
from orders.models import Order
from orders.pricing import compute_totals


class PricingTests(StoreTestCase):
    def test_free_shipping_threshold_and_flat_rate(self):
        self.assertEqual(compute_totals([("50.00", "40.00", 1)])["shipping"], Decimal("5.00"))
        self.assertEqual(compute_totals([("50.00", "50.00", 2)])["shipping"], Decimal("0.00"))  # 100 reaches threshold
        self.assertEqual(compute_totals([])["total"], Decimal("0.00"))

    def test_discount_and_total(self):
        # payable is 90 (< 100 threshold) so flat shipping applies
        t = compute_totals([("80.00", "60.00", 1), ("30.00", "30.00", 1)])
        self.assertEqual(
            (t["subtotal"], t["discount"], t["shipping"], t["total"]),
            (Decimal("110.00"), Decimal("20.00"), Decimal("5.00"), Decimal("95.00")),
        )


class OrderTests(StoreTestCase):
    def payload(self, **over):
        data = {
            "shipping": self.shipping(), "payment_method": "cod",
            "items": [{"product_id": self.runner.id, "size": "8", "color": "Navy", "quantity": 2}],
        }
        data.update(over)
        return data

    def place(self, **over):
        return self.client.post("/api/orders/", self.payload(**over), format="json")

    def test_requires_authentication(self):
        self.assertEqual(self.place().status_code, 401)
        self.assertEqual(self.client.get("/api/orders/").status_code, 401)

    def test_create_order_calculates_totals_on_server_and_reduces_stock(self):
        self.login()
        r = self.place()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["subtotal"], "160.00")
        self.assertEqual(r.data["discount_amount"], "40.00")
        self.assertEqual(r.data["shipping_charge"], "0.00")
        self.assertEqual(r.data["total"], "120.00")
        self.assertTrue(r.data["order_number"].startswith("SU-"))
        self.assertEqual(r.data["status"], "pending")
        self.assertEqual(r.data["payment_status"], "pending")
        self.assertEqual(r.data["items"][0]["unit_price"], "60.00")
        self.runner.refresh_from_db()
        self.assertEqual(self.runner.stock_quantity, 3)

    def test_client_supplied_prices_are_ignored(self):
        self.login()
        items = [{"product_id": self.runner.id, "size": "8", "color": "Navy", "quantity": 1, "unit_price": "0.01", "price": 1}]
        r = self.place(items=items, total="0.01")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["items"][0]["unit_price"], "60.00")
        self.assertEqual(r.data["total"], "65.00")  # 60 + 5 shipping

    def test_order_snapshot_survives_price_change(self):
        self.login()
        order_id = self.place().data["id"]
        self.runner.discount_price = None
        self.runner.save()
        self.assertEqual(self.client.get(f"/api/orders/{order_id}/").data["items"][0]["unit_price"], "60.00")

    def test_insufficient_stock_rejected_and_nothing_changes(self):
        self.login()
        r = self.place(items=[{"product_id": self.runner.id, "size": "8", "color": "Navy", "quantity": 4},
                              {"product_id": self.runner.id, "size": "9", "color": "White", "quantity": 4}])
        self.assertEqual(r.status_code, 400)  # 8 combined > stock 5
        self.assertEqual(Order.objects.count(), 0)
        self.runner.refresh_from_db()
        self.assertEqual(self.runner.stock_quantity, 5)

    def test_checkout_field_validation(self):
        self.login()
        for bad in ({"email": "nope"}, {"phone": "abc"}, {"postal_code": "!"}, {"full_name": ""}, {"country": ""}):
            r = self.place(shipping=self.shipping(**bad))
            self.assertEqual(r.status_code, 400, bad)
            self.assertIn("shipping", r.data["errors"])
        self.assertEqual(self.place(payment_method="bitcoin").status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_variant_and_inactive_product_rejected(self):
        self.login()
        self.assertEqual(self.place(items=[{"product_id": self.runner.id, "size": "99", "color": "Navy", "quantity": 1}]).status_code, 400)
        self.boot.is_active = False
        self.boot.save()
        self.assertEqual(self.place(items=[{"product_id": self.boot.id, "size": "8", "color": "Brown", "quantity": 1}]).status_code, 400)

    def test_order_from_server_cart_clears_it(self):
        self.login()
        self.client.post("/api/cart/items/", {"product_id": self.runner.id, "size": "8", "color": "Navy", "quantity": 1})
        r = self.client.post("/api/orders/", {"shipping": self.shipping(), "payment_method": "cod"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])
        self.assertEqual(self.client.post("/api/orders/", {"shipping": self.shipping(), "payment_method": "cod"}, format="json").status_code, 400)

    def test_idempotency_key_prevents_duplicate_orders(self):
        self.login()
        first = self.place(idempotency_key="abc-123")
        second = self.place(idempotency_key="abc-123")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Order.objects.count(), 1)
        self.runner.refresh_from_db()
        self.assertEqual(self.runner.stock_quantity, 3)

    def test_simulated_payment_success_is_clearly_labeled(self):
        self.login()
        r = self.place(payment_method="simulated", simulated_outcome="success")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["payment_status"], "simulated_paid")
        self.assertIn("no real charge", r.data["payment_status_display"])
        self.assertEqual(r.data["status"], "confirmed")

    def test_simulated_payment_decline_creates_no_order_and_keeps_stock(self):
        self.login()
        r = self.place(payment_method="simulated", simulated_outcome="decline")
        self.assertEqual(r.status_code, 402)
        self.assertEqual(Order.objects.count(), 0)
        self.runner.refresh_from_db()
        self.assertEqual(self.runner.stock_quantity, 5)

    def test_order_history_and_detail_are_private(self):
        self.login()
        oid = self.place().data["id"]
        self.assertEqual(self.client.get("/api/orders/").data["count"], 1)
        self.assertEqual(self.client.get(f"/api/orders/{oid}/").status_code, 200)
        self.login(self.other)
        self.assertEqual(self.client.get("/api/orders/").data["count"], 0)
        self.assertEqual(self.client.get(f"/api/orders/{oid}/").status_code, 404)

    def test_admin_cancel_restocks_once(self):
        self.login()
        order = Order.objects.get(pk=self.place().data["id"])
        self.assertTrue(order.cancel_and_restock())
        self.assertFalse(order.cancel_and_restock())
        self.runner.refresh_from_db()
        self.assertEqual(self.runner.stock_quantity, 5)
