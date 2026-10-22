import hashlib, hmac, logging, uuid
from datetime import timedelta
from django.conf import settings
from django.db import transaction, IntegrityError
from django.http import HttpResponse, Http404, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from . import core
from .forms import ApplicationForm
from .models import Receipt, RateWindow
from .locks import writer_lock

log = logging.getLogger(__name__)


def home(request):
    return render(request, "home.html")


def listings(request):
    try:
        animals = core.animals()
        error = False
    except Exception:
        animals = []
        error = True
        log.error("catalogue_unavailable")
    species = request.GET.get("species", "")[:80]
    q = request.GET.get("q", "").strip()[:80]
    if species:
        animals = [a for a in animals if a["species"].casefold() == species.casefold()]
    if q:
        animals = [
            a
            for a in animals
            if q.casefold() in (a["name"] + " " + a["breed"]).casefold()
        ]
    return render(
        request,
        "animals.html",
        {"animals": animals, "error": error, "q": q, "species": species},
        status=503 if error else 200,
    )


def animal(request, animal_id):
    try:
        pet = next((a for a in core.animals() if a["id"] == animal_id), None)
    except Exception:
        return render(request, "unavailable.html", status=503)
    if pet is None:
        raise Http404
    return render(request, "animal.html", {"animal": pet})


def photo(request, animal_id):
    try:
        data = core.image(animal_id)
    except Exception:
        raise Http404
    return HttpResponse(data, content_type="image/jpeg")


PAGES = {
    "about": (
        "Care comes first.",
        "We support rescue, fostering, rehoming and lifelong sanctuary care. Each animal needs an individual assessment and care plan. Organisation details and service eligibility must be confirmed before public launch.",
    ),
    "adoption": (
        "A thoughtful route home.",
        "Explore available animals, submit an enquiry and speak with the team. Staff assess the household and animal together, discuss care, arrange visits and checks, and agree next steps. An enquiry is not a reservation or approval.",
    ),
    "fostering": (
        "A safe place, for a while.",
        "Offer a temporary home with ongoing support. Staff review household suitability, experience, capacity, compatibility and emergency arrangements before placement. Veterinary instructions and contacts are agreed before a move.",
    ),
    "volunteering": (
        "Your time can change a life.",
        "Tell us about your interests and availability. Roles depend on supervision, training, safety and animal needs. Applying does not authorise unsupervised animal handling.",
    ),
    "help": (
        "There is more than one way to help.",
        "Fostering, volunteering and requested supplies all support care. Please ask before delivering supplies. Donations are available only through a verified configured provider.",
    ),
    "visiting": (
        "Plan a calm visit.",
        "Visits are by prior arrangement. Confirm accessibility needs and appointments with the team. Exact foster locations and private animal locations are never published.",
    ),
    "faq": (
        "Before you get in touch.",
        "Can I reserve an animal online? No: staff review suitability and availability. Can I arrive with an animal without warning? Contact the team first; capacity and emergency needs must be assessed. Are all residents adoptable? No: sanctuary and held residents are excluded. In an animal emergency contact a veterinary practice or appropriate emergency service directly.",
    ),
    "privacy": (
        "Your information, handled carefully.",
        "Enquiry details are stored privately to review applications and respond. Access is limited to authorised staff. The organisation must confirm controller identity, lawful bases, retention, providers and rights contacts before launch. Necessary session/security cookies support forms; no advertising or analytics cookies are loaded.",
    ),
    "accessibility": (
        "Care should be accessible.",
        "The public site uses semantic landmarks, keyboard-accessible links/forms, visible focus, responsive layouts and reduced-motion support. No WCAG certification is claimed. Ask the team for an alternative enquiry route or report a barrier. The operational interface needs a separate full accessibility review.",
    ),
}


def page(request, slug):
    if slug not in PAGES:
        raise Http404
    title, body = PAGES[slug]
    return render(request, "page.html", {"title": title, "body": body, "slug": slug})


def limited(request):
    key = hmac.new(
        settings.SECRET_KEY.encode(),
        request.META.get("REMOTE_ADDR", "").encode(),
        hashlib.sha256,
    ).hexdigest()
    with transaction.atomic():
        bucket, _ = RateWindow.objects.get_or_create(
            key=key, defaults={"started_at": timezone.now()}
        )
        bucket = RateWindow.objects.select_for_update().get(pk=key)
        if bucket.started_at < timezone.now() - timedelta(hours=1):
            bucket.count = 0
            bucket.started_at = timezone.now()
        if bucket.count >= 8:
            return True
        bucket.count += 1
        bucket.save()
    return False


@require_http_methods(["GET", "POST"])
def apply(request, kind):
    if kind not in core.FORM_NAMES:
        raise Http404
    aid = request.GET.get("animal", "")
    pet = None
    if aid:
        try:
            pet = next((a for a in core.animals() if str(a["id"]) == aid), None)
        except Exception:
            return render(request, "unavailable.html", status=503)
        if pet is None:
            raise Http404
    if request.method == "GET":
        token = str(uuid.uuid4())
        request.session["form_tokens"] = request.session.get("form_tokens", [])[-9:] + [
            token
        ]
    else:
        token = request.POST.get("submission", "")
    form = ApplicationForm(request.POST or None)
    if request.method == "POST":
        if token not in request.session.get("form_tokens", []):
            return HttpResponse(
                "This form expired. Reload it and try again.", status=400
            )
        if form.is_valid():
            receipt = Receipt.objects.filter(pk=token).first()
            if receipt:
                return render(
                    request,
                    "confirmation.html",
                    {"receipt": receipt},
                    status=200 if receipt.state == "sent" else 503,
                )
            if limited(request):
                return HttpResponse(
                    "Too many requests. Please try later or contact the team.",
                    status=429,
                )
            try:
                with transaction.atomic():
                    receipt = Receipt.objects.create(id=token, kind=kind)
            except IntegrityError:
                return render(
                    request,
                    "confirmation.html",
                    {"receipt": Receipt.objects.get(pk=token)},
                    status=503,
                )
            try:
                with writer_lock():
                    core_id = core.submit(
                        kind,
                        form.cleaned_data,
                        pet["name"] if pet else "",
                        request.META.get("REMOTE_ADDR", ""),
                        request.META.get("HTTP_USER_AGENT", ""),
                    )
                if not core_id or not core.database().query(
                    "SELECT CollationID FROM onlineformincoming WHERE CollationID = ?",
                    [core_id],
                ):
                    raise RuntimeError("No incoming record")
                receipt.state = "sent"
                receipt.core_id = core_id
                receipt.save()
            except Exception:
                log.error("submission_reconciliation_required receipt=%s", receipt.id)
                receipt.state = "review"
                receipt.save()
            return render(
                request,
                "confirmation.html",
                {"receipt": receipt},
                status=200 if receipt.state == "sent" else 503,
            )
    return render(
        request, "apply.html", {"form": form, "kind": kind, "pet": pet, "token": token}
    )


def health(request):
    try:
        core.database().query("SELECT 1")
        Receipt.objects.exists()
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})
