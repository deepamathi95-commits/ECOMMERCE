"""Single source of truth for money math, used by the cart summary and by order creation."""
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings

CENT = Decimal("0.01")


def money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def compute_totals(lines):
    """lines: iterable of (list_price, unit_price, quantity). Returns Decimals."""
    lines = list(lines)
    subtotal = sum((Decimal(lp) * q for lp, _, q in lines), Decimal("0"))
    payable = sum((Decimal(up) * q for _, up, q in lines), Decimal("0"))
    discount = subtotal - payable
    if not lines or payable >= settings.FREE_SHIPPING_THRESHOLD:
        shipping = Decimal("0")
    else:
        shipping = settings.SHIPPING_FLAT_RATE
    return {
        "subtotal": money(subtotal),
        "discount": money(discount),
        "shipping": money(shipping),
        "total": money(payable + shipping),
        "free_shipping_threshold": money(settings.FREE_SHIPPING_THRESHOLD),
    }
