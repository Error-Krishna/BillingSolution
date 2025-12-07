# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Notification

@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):
    """Create welcome notification for new users"""
    if created:
        try:
            Notification.objects.create(
                user=instance,
                title='Welcome to Nexus Bills!',
                message='Get started by creating your first bill. You can create Kacha bills or Pakka bills.',
                notification_type='info',
                action_url='/kacha-bill/'
            )
            print(f"Created welcome notification for user {instance.username}")
        except Exception as e:
            print(f"Error creating welcome notification: {e}")