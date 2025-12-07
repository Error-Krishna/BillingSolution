# core/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    )
    
    BILL_TYPES = (
        ('kacha', 'Kacha Bill'),
        ('pakka', 'Pakka Bill'),
        ('draft', 'Draft'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True, null=True)
    bill_type = models.CharField(max_length=20, choices=BILL_TYPES, blank=True, null=True)
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'read', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def get_formatted_time(self):
        """Return formatted time for display"""
        now = timezone.now()
        diff = now - self.timestamp
        
        if diff.days == 0:
            if diff.seconds < 60:
                return "Just now"
            elif diff.seconds < 3600:
                return f"{diff.seconds // 60}m ago"
            else:
                return f"{diff.seconds // 3600}h ago"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days}d ago"
        else:
            return self.timestamp.strftime("%b %d, %Y")
    
    # Property for frontend compatibility
    @property
    def type(self):
        """Alias for notification_type for frontend compatibility"""
        return self.notification_type