# core/admin.py
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'read', 'timestamp', 'bill_type')
    list_filter = ('notification_type', 'read', 'bill_type', 'timestamp')
    search_fields = ('title', 'message', 'customer_name', 'user__username')
    readonly_fields = ('timestamp', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'message', 'notification_type', 'read')
        }),
        ('Bill Information', {
            'fields': ('bill_type', 'customer_name', 'amount', 'action_url'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('timestamp', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    list_per_page = 50
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(read=False)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"