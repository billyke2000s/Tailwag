import uuid
from django.db import models


class Receipt(models.Model):
    """Technical metadata only; animal/contact/care records live in ASM."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    state = models.CharField(max_length=12, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    core_id = models.IntegerField(null=True)
    kind = models.CharField(max_length=16)


class RateWindow(models.Model):
    key = models.CharField(primary_key=True, max_length=64)
    count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField()
