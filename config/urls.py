# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dashboard.urls')),
    path('', include('kacha_bills.urls')),
    path('', include('pakka_bills.urls')),
    path('', include('drafts.urls')),
]