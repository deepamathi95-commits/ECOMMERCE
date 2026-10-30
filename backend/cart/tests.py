from config.testing import StoreTestCase


class CartTests(StoreTestCase):
    def add(self, product, qty=1, size="8", color="Navy"):
        return self.client.post("/api/cart/items/", {"product_id": product.id, "size": size, "color": color, "quantity": qty})

    def test_cart_requires_authentication(self):
        self.assertEqual(self.client.get("/api/cart/").status_code, 401)
        self.assertEqual(self.client.post("/api/cart/items/", {}).status_code, 401)

    def test_add_item_and_totals(self):
        self.login()
        r = self.add(self.runner, 2)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["item_count"], 2)
        s = r.data["summary"]
        self.assertEqual((s["subtotal"], s["discount"], s["shipping"], s["total"]), ("160.00", "40.00", "0.00", "120.00"))

    def test_same_variant_merges_and_different_variant_does_not(self):
        self.login()
        self.add(self.runner, 1)
        self.add(self.runner, 2)
        r = self.add(self.runner, 1, size="9")
        self.assertEqual(len(r.data["items"]), 2)
        self.assertEqual(r.data["items"][0]["quantity"], 3)

    def test_invalid_size_color_and_quantity_rejected(self):
        self.login()
        self.assertEqual(self.add(self.runner, size="12").status_code, 400)
        self.assertEqual(self.add(self.runner, color="Pink").status_code, 400)
        self.assertEqual(self.add(self.runner, 99).status_code, 400)  # stock is 5
        self.assertEqual(self.add(self.runner, 0).status_code, 400)

    def test_cannot_exceed_stock_by_adding_repeatedly(self):
        self.login()
        self.assertEqual(self.add(self.runner, 4).status_code, 201)
        r = self.add(self.runner, 2)
        self.assertEqual(r.status_code, 400)
        self.assertIn("quantity", r.data["errors"])

    def test_out_of_stock_cannot_be_added(self):
        self.login()
        self.runner.stock_quantity = 0
        self.runner.save()
        self.assertEqual(self.add(self.runner).status_code, 400)

    def test_update_and_remove_item(self):
        self.login()
        item_id = self.add(self.runner).data["items"][0]["id"]
        r = self.client.patch(f"/api/cart/items/{item_id}/", {"quantity": 3})
        self.assertEqual(r.data["items"][0]["quantity"], 3)
        self.assertEqual(self.client.patch(f"/api/cart/items/{item_id}/", {"quantity": 50}).status_code, 400)
        r = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(r.data["items"], [])

    def test_users_cannot_touch_each_others_cart_items(self):
        self.login()
        item_id = self.add(self.runner).data["items"][0]["id"]
        self.login(self.other)
        self.assertEqual(self.client.patch(f"/api/cart/items/{item_id}/", {"quantity": 2}).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/cart/items/{item_id}/").status_code, 404)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])

    def test_guest_cart_sync_merges_and_reports_skipped(self):
        self.login()
        r = self.client.post("/api/cart/sync/", {"items": [
            {"product_id": self.runner.id, "size": "8", "color": "Navy", "quantity": 2},
            {"product_id": self.runner.id, "size": "99", "color": "Navy", "quantity": 1},
            {"product_id": 99999, "quantity": 1},
        ]}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["item_count"], 2)
        self.assertEqual(len(r.data["skipped"]), 2)
