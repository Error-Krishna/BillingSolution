# kacha_bills/urls.py
from django.urls import path
from . import views

app_name = 'kacha_bills'

urlpatterns = [
    path('kacha-bill/', views.kacha_bill_view, name='kacha_bill'),
    path('kacha-bills/', views.kacha_bills_view, name='kacha_bills'),
    path('api/get-kacha-bills/', views.get_all_kacha_bills, name='get_all_kacha_bills'),
    path('api/convert/kacha-to-pakka/<str:kacha_id>/', views.convert_kacha_to_pakka, name='convert_kacha_to_pakka'),
]