from config.testing import StoreTestCase, User


class AuthTests(StoreTestCase):
    def test_register_creates_user_and_returns_tokens(self):
        r = self.client.post("/api/auth/register/", {"email": "New@Example.com", "password": "Sup3r-Secret!", "first_name": "New"})
        self.assertEqual(r.status_code, 201)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        user = User.objects.get(email="new@example.com")
        self.assertNotEqual(user.password, "Sup3r-Secret!")  # hashed
        self.assertTrue(user.password.startswith(("pbkdf2", "md5", "argon2")))

    def test_register_rejects_duplicate_and_weak_password(self):
        r = self.client.post("/api/auth/register/", {"email": "A@example.com", "password": "Sup3r-Secret!", "first_name": "x"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("email", r.data["errors"])
        r = self.client.post("/api/auth/register/", {"email": "c@example.com", "password": "12345678", "first_name": "x"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("password", r.data["errors"])

    def test_login_success_and_failure(self):
        ok = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "StrongPass!234"})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.data["user"]["email"], "a@example.com")
        bad = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "wrong"})
        self.assertEqual(bad.status_code, 401)

    def test_refresh_and_logout_blacklists_token(self):
        tokens = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "StrongPass!234"}).data
        refreshed = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]})
        self.assertEqual(refreshed.status_code, 200)
        new_refresh = refreshed.data["refresh"]
        # works without an access token: the refresh token itself is the proof
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": new_refresh}).status_code, 204)
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": new_refresh}).status_code, 401)

    def test_profile_requires_auth(self):
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 401)
        self.assertEqual(self.client.patch("/api/auth/profile/", {"first_name": "Z"}).status_code, 401)

    def test_profile_get_and_update_with_validation(self):
        self.login()
        self.assertEqual(self.client.get("/api/auth/profile/").data["email"], "a@example.com")
        r = self.client.patch("/api/auth/profile/", {"first_name": "Anna", "phone": "+1 555 000 1111"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["first_name"], "Anna")
        self.assertEqual(r.data["phone"], "+1 555 000 1111")
        self.assertEqual(self.client.patch("/api/auth/profile/", {"phone": "abc"}).status_code, 400)

    def test_addresses_are_private_and_default_is_unique(self):
        self.login()
        base = {"full_name": "Ann", "phone": "5551234567", "address_line": "1 St", "city": "C", "state": "S", "postal_code": "12345", "country": "USA"}
        a1 = self.client.post("/api/auth/addresses/", base).data
        a2 = self.client.post("/api/auth/addresses/", {**base, "is_default": True}).data
        listing = self.client.get("/api/auth/addresses/").data
        self.assertEqual(sum(1 for a in listing if a["is_default"]), 1)
        self.assertTrue(next(a for a in listing if a["id"] == a2["id"])["is_default"])
        self.login(self.other)
        self.assertEqual(self.client.get("/api/auth/addresses/").data, [])
        self.assertEqual(self.client.delete(f"/api/auth/addresses/{a1['id']}/").status_code, 404)
