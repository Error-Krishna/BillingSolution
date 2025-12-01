# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),  # Add accounts URLs
    path('', include('dashboard.urls')),
    path('', include('kacha_bills.urls')),
    path('', include('pakka_bills.urls')),
    path('', include('drafts.urls')),
    path('', include('onboarding.urls')),
    path('', include('user_profile.urls')),
]