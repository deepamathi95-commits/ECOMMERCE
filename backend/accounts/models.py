from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models, transaction

phone_validator = RegexValidator(r"^\+?[0-9 ()\-]{7,20}$", "Enter a valid phone number.")


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True, validators=[phone_validator])

    def __str__(self):
        return f"Profile of {self.user}"


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=40, blank=True, help_text="e.g. Home, Office")
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, validators=[phone_validator])
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    postal_code = models.CharField(max_length=12)
    country = models.CharField(max_length=80)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        verbose_name_plural = "addresses"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            first = not Address.objects.filter(user=self.user).exclude(pk=self.pk).exists()
            if first:
                self.is_default = True
            if self.is_default:
                Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.label or 'Address'} - {self.city}"
