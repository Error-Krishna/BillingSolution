from django.urls import path
from . import views

app_name = 'user_profile'

urlpatterns = [
    path('profile/', views.profile_view, name='profile'),
    path('api/get-profile-data/', views.get_profile_data, name='get_profile_data'),
    path('api/update-company-details/', views.update_company_details, name='update_company_details'),
    path('api/update-user-profile/', views.update_user_profile, name='update_user_profile'),
    path('api/change-password/', views.change_password, name='change_password'),
]