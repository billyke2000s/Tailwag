from django.conf import settings

def organisation(request):
    return {'org':{'name':settings.ORG_NAME,'email':settings.ORG_EMAIL,'address':settings.ORG_ADDRESS,'visiting':settings.ORG_VISITING,'donate_url':settings.DONATE_URL,'staff_url':settings.STAFF_URL,'launched':settings.PUBLIC_LAUNCH}}
