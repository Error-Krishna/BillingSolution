# drafts/urls.py
from django.urls import path
from . import views

app_name = 'drafts'

urlpatterns = [
    path('drafts/', views.drafts_view, name='drafts'),
    path('api/save/', views.save_bill_view, name='save_bill'),
    path('api/get-drafts/', views.get_drafts_view, name='get_drafts'),
    path('api/get-draft/<str:draft_id>/', views.get_draft_by_id, name='get_draft_by_id'),
    path('api/delete-draft/<str:draft_id>/', views.delete_draft_view, name='delete_draft'),
    path('api/convert/draft-to-kacha/<str:draft_id>/', views.convert_draft_to_kacha, name='convert_draft_to_kacha'),
    path('api/convert/draft-to-pakka/<str:draft_id>/', views.convert_draft_to_pakka, name='convert_draft_to_pakka'),
]