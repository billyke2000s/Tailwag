#!/usr/bin/env python3
import os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));os.environ.setdefault('DJANGO_SETTINGS_MODULE','shelter.settings')
import django;django.setup()
from django.utils import timezone
from datetime import timedelta
from shelter.models import RateWindow,Receipt
RateWindow.objects.filter(started_at__lt=timezone.now()-timedelta(days=1)).delete()
Receipt.objects.filter(state='sent',created_at__lt=timezone.now()-timedelta(days=90)).delete()
from django.core.management import call_command
call_command('clearsessions')
