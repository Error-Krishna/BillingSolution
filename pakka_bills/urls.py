# pakka_bills/urls.py
from django.urls import path
from . import views

app_name = 'pakka_bills'

urlpatterns = [
    path('pakka-bill/', views.pakka_bill_view, name='pakka_bill'),
    path('pakka-bills/', views.pakka_bills_view, name='pakka_bills'),
    path('api/get-pakka-bills/', views.get_all_pakka_bills, name='get_all_pakka_bills'),
    path('api/get-pakka-bill/<str:pakka_id>/', views.get_pakka_bill_by_id, name='get_pakka_bill_by_id'),
    path('api/create/', views.create_pakka_bill, name='create_pakka_bill'),  # Added this
    path('api/delete/<str:pakka_id>/', views.delete_pakka_bill, name='delete_pakka_bill'),
      path('api/delete-pakka-bill/<str:pakka_id>/', views.delete_pakka_bill, name='delete_pakka_bill'),  # Added this
]