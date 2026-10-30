from rest_framework.test import APITestCase

from .models import ContactMessage


class ContactTests(APITestCase):
    def test_valid_submission_is_stored(self):
        r = self.client.post("/api/contact/", {"name": "Sam", "email": "sam@example.com", "subject": "Sizing", "message": "Do you have size 12?"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_invalid_submission_returns_field_errors(self):
        r = self.client.post("/api/contact/", {"name": "", "email": "bad", "subject": "", "message": "hi"})
        self.assertEqual(r.status_code, 400)
        for field in ("name", "email", "subject", "message"):
            self.assertIn(field, r.data["errors"])
        self.assertEqual(ContactMessage.objects.count(), 0)
