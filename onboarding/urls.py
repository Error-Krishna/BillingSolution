from django.urls import path
from . import views

app_name = 'onboarding'

urlpatterns = [
    path('onboarding/', views.onboarding_view, name='onboarding'),
    path('api/save-company-details/', views.save_company_details, name='save_company_details'),
    path('api/check-company-setup/', views.check_company_setup, name='check_company_setup'),
    path('api/get-company-details/', views.get_company_details, name='get_company_details'),
]