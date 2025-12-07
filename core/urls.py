# core/urls.py
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Notifications API endpoints
    path('api/notifications/', views.notifications_api, name='notifications_api'),
    path('api/notifications/all/', views.api_get_all_notifications, name='api_all_notifications'),
    path('api/notifications/<int:notification_id>/read/', views.api_mark_notification_read, name='api_mark_notification_read'),
    path('api/notifications/<int:notification_id>/unread/', views.api_mark_notification_unread, name='api_mark_notification_unread'),
    path('api/notifications/read-all/', views.api_mark_all_read, name='api_mark_all_read'),
    path('api/notifications/<int:notification_id>/delete/', views.api_delete_notification, name='api_delete_notification'),
    path('api/notifications/clear-all/', views.api_clear_all_notifications, name='api_clear_all'),
    path('api/notifications/check-new/', views.api_check_new_notifications, name='api_check_new'),
    
    # Overdue bills endpoint
    path('api/check-overdue-bills/', views.api_check_overdue_bills, name='api_check_overdue_bills'),
    
    # Test endpoint
    path('api/test-notifications/', views.api_test_notifications, name='api_test_notifications'),
    
    # Notifications page
    path('notifications/', views.notifications_page, name='all_notifications'),
]