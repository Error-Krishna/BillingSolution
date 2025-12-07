# core/views.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from .models import Notification
from django.core.paginator import Paginator
import json
from datetime import datetime, timedelta

@login_required
@require_http_methods(["GET"])
def notifications_api(request):
    """API to get unread count and recent notifications for badge"""
    try:
        # Get unread notifications count
        unread_count = Notification.objects.filter(
            user=request.user,
            read=False
        ).count()
        
        # Get recent notifications (last 5 for dropdown)
        recent_notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-timestamp')[:5]
        
        # Format notifications
        notifications_list = []
        for notification in recent_notifications:
            notifications_list.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'timestamp': notification.timestamp.isoformat(),
                'read': notification.read,
                'action_url': notification.action_url,
                'bill_type': notification.bill_type,
                'customer_name': notification.customer_name,
                'amount': str(notification.amount) if notification.amount else None,
                'formatted_time': notification.get_formatted_time(),
            })
        
        return JsonResponse({
            'status': 'success',
            'notifications': notifications_list,
            'unread_count': unread_count,
            'total_count': Notification.objects.filter(user=request.user).count()
        })
        
    except Exception as e:
        print(f"Notifications API error: {e}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def notifications_page(request):
    """Render the notifications page"""
    return render(request, 'core/notifications.html')

@login_required
@require_http_methods(["GET"])
def api_get_notifications(request):
    """API to get notifications for dropdown (limited)"""
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        
        # Get notifications for current user
        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-timestamp')
        
        # Paginate
        paginator = Paginator(notifications, limit)
        page_obj = paginator.get_page(page)
        
        # Calculate unread count
        unread_count = Notification.objects.filter(
            user=request.user, 
            read=False
        ).count()
        
        # Format notifications
        notifications_list = []
        for notification in page_obj:
            notifications_list.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'timestamp': notification.timestamp.isoformat(),
                'read': notification.read,
                'action_url': notification.action_url,
                'bill_type': notification.bill_type,
                'customer_name': notification.customer_name,
                'amount': str(notification.amount) if notification.amount else None,
                'formatted_time': notification.get_formatted_time(),
            })
        
        return JsonResponse({
            'status': 'success',
            'notifications': notifications_list,
            'unread_count': unread_count,
            'total_count': notifications.count(),
            'has_more': page_obj.has_next(),
            'current_page': page,
            'total_pages': paginator.num_pages
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["GET"])
def api_get_all_notifications(request):
    """API to get all notifications for notifications page"""
    try:
        # Get all notifications for current user
        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-timestamp')
        
        # Calculate unread count
        unread_count = notifications.filter(read=False).count()
        
        # Format notifications
        notifications_list = []
        for notification in notifications:
            notifications_list.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'timestamp': notification.timestamp.isoformat(),
                'read': notification.read,
                'action_url': notification.action_url,
                'bill_type': notification.bill_type,
                'customer_name': notification.customer_name,
                'amount': str(notification.amount) if notification.amount else None,
                'formatted_time': notification.get_formatted_time(),
            })
        
        return JsonResponse({
            'status': 'success',
            'notifications': notifications_list,
            'unread_count': unread_count,
            'total_count': notifications.count()
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def api_mark_notification_read(request, notification_id):
    """API to mark a notification as read"""
    try:
        notification = Notification.objects.get(
            id=notification_id, 
            user=request.user
        )
        notification.read = True
        notification.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification marked as read'
        })
        
    except Notification.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Notification not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def api_mark_notification_unread(request, notification_id):
    """API to mark a notification as unread"""
    try:
        notification = Notification.objects.get(
            id=notification_id, 
            user=request.user
        )
        notification.read = False
        notification.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification marked as unread'
        })
        
    except Notification.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Notification not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def api_mark_all_read(request):
    """API to mark all notifications as read"""
    try:
        updated_count = Notification.objects.filter(
            user=request.user,
            read=False
        ).update(read=True)
        
        return JsonResponse({
            'status': 'success',
            'message': f'{updated_count} notifications marked as read',
            'count': updated_count
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def api_delete_notification(request, notification_id):
    """API to delete a notification"""
    try:
        notification = Notification.objects.get(
            id=notification_id, 
            user=request.user
        )
        notification.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification deleted'
        })
        
    except Notification.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Notification not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def api_clear_all_notifications(request):
    """API to clear all notifications"""
    try:
        deleted_count, _ = Notification.objects.filter(
            user=request.user
        ).delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'{deleted_count} notifications cleared',
            'count': deleted_count
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["GET"])
def api_check_new_notifications(request):
    """API to check for new notifications since last check"""
    try:
        # Get last check timestamp from request or use default
        last_check = request.GET.get('last_check')
        
        # Count unread notifications
        unread_count = Notification.objects.filter(
            user=request.user,
            read=False
        ).count()
        
        # Count new notifications since last check
        new_count = 0
        if last_check:
            try:
                from django.utils.timezone import make_aware
                last_check_dt = make_aware(datetime.fromisoformat(last_check))
                new_count = Notification.objects.filter(
                    user=request.user,
                    timestamp__gt=last_check_dt,
                    read=False
                ).count()
            except:
                new_count = 0
        else:
            new_count = unread_count
        
        return JsonResponse({
            'status': 'success',
            'new_count': new_count,
            'unread_count': unread_count,
            'has_new': new_count > 0
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["GET"])
def api_check_overdue_bills(request):
    """API to check for overdue kacha bills (older than 7 days)"""
    try:
        from .mongo_client import get_kacha_bills_collection
        
        collection = get_kacha_bills_collection()
        
        # Calculate date 7 days ago
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        # Query for kacha bills older than 7 days for current user
        query = {
            'user_id': str(request.user.id),
            'billDate': {'$lt': seven_days_ago}
        }
        
        # Count overdue bills
        overdue_count = collection.count_documents(query)
        
        # Get the oldest overdue bill date
        oldest_bill_date = None
        if overdue_count > 0:
            oldest_bill = collection.find(query).sort('billDate', 1).limit(1)
            if oldest_bill:
                oldest_bill_date = oldest_bill[0].get('billDate')
        
        return JsonResponse({
            'status': 'success',
            'overdue_count': overdue_count,
            'oldest_bill_date': oldest_bill_date
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

# Test endpoint for debugging
@login_required
@require_http_methods(["GET"])
def api_test_notifications(request):
    """Test endpoint to debug notifications"""
    try:
        # Try to get notifications count
        count = Notification.objects.filter(user=request.user).count()
        unread = Notification.objects.filter(user=request.user, read=False).count()
        
        # Try to get one notification
        if count > 0:
            notification = Notification.objects.filter(user=request.user).first()
            test_data = {
                'id': notification.id,
                'title': notification.title,
                'type': notification.notification_type,
                'formatted_time': notification.get_formatted_time(),
            }
        else:
            test_data = None
            
        return JsonResponse({
            'status': 'success',
            'user': request.user.username,
            'total_count': count,
            'unread_count': unread,
            'test_notification': test_data,
            'field_names': [f.name for f in Notification._meta.get_fields()],
            'database': 'sqlite3'
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc().split('\n')
        }, status=500)