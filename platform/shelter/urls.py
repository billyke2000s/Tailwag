from django.urls import path
from . import views
urlpatterns=[path('',views.home,name='home'),path('animals/',views.listings,name='animals'),path('animals/<int:animal_id>/',views.animal,name='animal'),path('animals/<int:animal_id>/photo/',views.photo,name='photo'),path('apply/<slug:kind>/',views.apply,name='apply'),path('health/',views.health,name='health'),path('<slug:slug>/',views.page,name='page')]
