from config.testing import StoreTestCase


class ProductApiTests(StoreTestCase):
    def test_list_products_is_public_and_paginated(self):
        r = self.client.get("/api/products/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 2)
        self.assertIn("results", r.data)

    def test_detail_by_id_includes_images_sizes_related(self):
        r = self.client.get(f"/api/products/{self.runner.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["sizes"], ["7", "8", "9"])
        self.assertEqual(len(r.data["images"]), 1)
        self.assertEqual(r.data["current_price"], "60.00")
        self.assertEqual(r.data["discount_percent"], 25)

    def test_inactive_products_are_hidden(self):
        self.boot.is_active = False
        self.boot.save()
        self.assertEqual(self.client.get("/api/products/").data["count"], 1)
        self.assertEqual(self.client.get(f"/api/products/{self.boot.id}/").status_code, 404)

    def test_search_category_price_size_filters(self):
        self.assertEqual(self.client.get("/api/products/?search=hiker").data["count"], 1)
        self.assertEqual(self.client.get("/api/products/?category=boots").data["count"], 1)
        self.assertEqual(self.client.get("/api/products/?min_price=100").data["count"], 1)  # runner effective price is 60
        self.assertEqual(self.client.get("/api/products/?max_price=70").data["count"], 1)
        self.assertEqual(self.client.get("/api/products/?size=7").data["count"], 1)
        self.assertEqual(self.client.get("/api/products/?size=9").data["count"], 2)
        self.assertEqual(self.client.get("/api/products/?size=1").data["count"], 0)

    def test_sorting_by_effective_price(self):
        names = [p["name"] for p in self.client.get("/api/products/?ordering=price_asc").data["results"]]
        self.assertEqual(names, ["Runner", "Hiker Boot"])
        names = [p["name"] for p in self.client.get("/api/products/?ordering=price_desc").data["results"]]
        self.assertEqual(names, ["Hiker Boot", "Runner"])

    def test_categories_endpoint_counts_products(self):
        r = self.client.get("/api/categories/")
        self.assertEqual(r.status_code, 200)
        counts = {c["slug"]: c["product_count"] for c in r.data}
        self.assertEqual(counts, {"sneakers": 1, "boots": 1})

    def test_store_settings_endpoint(self):
        r = self.client.get("/api/store-settings/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["free_shipping_threshold"], "100.00")
