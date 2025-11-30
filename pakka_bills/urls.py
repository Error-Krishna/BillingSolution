# pakka_bills/urls.py
from django.urls import path
from . import views

app_name = 'pakka_bills'

urlpatterns = [
    path('pakka-bill/', views.pakka_bill_view, name='pakka_bill'),
    path('pakka-bills/', views.pakka_bills_view, name='pakka_bills'),
    path('api/get-pakka-bills/', views.get_all_pakka_bills, name='get_all_pakka_bills'),
    path('api/get-pakka-bill/<str:pakka_id>/', views.get_pakka_bill_by_id, name='get_pakka_bill_by_id'),
]