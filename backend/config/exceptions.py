"""Consistent error shape: {"detail": "...", "errors": {...}} for every failure."""
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    if isinstance(exc, ValidationError):
        data = response.data
        if isinstance(data, dict):
            detail = data.get("detail") or data.get("non_field_errors")
            if isinstance(detail, list):
                detail = detail[0]
            response.data = {"detail": str(detail) if detail else "Please correct the highlighted fields.", "errors": data}
        else:
            response.data = {"detail": str(data[0]) if data else "Invalid request.", "errors": {}}
    return response
