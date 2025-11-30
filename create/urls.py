# create/urls.py
from django.urls import path
from . import views

app_name = 'create' 

urlpatterns = [
    # Dashboard
    path('', views.dashboard_view, name='dashboard'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('api/dashboard-data/', views.get_dashboard_data, name='dashboard_data'),
    
    # Main pages
    path('kacha-bill/', views.kacha_bill_view, name='kacha_bill'),
    path('pakka-bill/', views.pakka_bill_view, name='pakka_bill'),
    path('drafts/', views.drafts_view, name='drafts'),
    path('kacha-bills/', views.kacha_bills_view, name='kacha_bills'),  # New kacha bills page
    
    # API endpoints
    path('api/save/', views.save_bill_view, name='save_bill'),
    path('api/get-drafts/', views.get_drafts_view, name='get_drafts'),
    path('api/get-draft/<str:draft_id>/', views.get_draft_by_id, name='get_draft_by_id'),
    path('api/delete-draft/<str:draft_id>/', views.delete_draft_view, name='delete_draft'),
    path('api/get-kacha-bills/', views.get_all_kacha_bills, name='get_all_kacha_bills'),
    
    # Conversion endpoints
    path('api/convert/draft-to-kacha/<str:draft_id>/', views.convert_draft_to_kacha, name='convert_draft_to_kacha'),
    path('api/convert/draft-to-pakka/<str:draft_id>/', views.convert_draft_to_pakka, name='convert_draft_to_pakka'),
    path('api/convert/kacha-to-pakka/<str:kacha_id>/', views.convert_kacha_to_pakka, name='convert_kacha_to_pakka'),

    path('pakka-bills/', views.pakka_bills_view, name='pakka_bills'),
    path('api/get-pakka-bills/', views.get_all_pakka_bills, name='get_all_pakka_bills'),
]