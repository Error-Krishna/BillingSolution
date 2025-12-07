# core/utils.py
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from .mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection
from .models import Notification
from django.utils import timezone

# Notification creation functions
def create_bill_notification(user, bill_type, bill_number, customer_name, bill_id=None):
    """
    Create a notification when a bill is created
    """
    try:
        notification = Notification.objects.create(
            user=user,
            notification_type='success',
            title=f'{bill_type.capitalize()} Bill Created',
            message=f'{bill_type.capitalize()} bill {bill_number} for {customer_name} has been created successfully.',
            action_url=f'/{bill_type}-bills/' + (f'#{bill_id}' if bill_id else ''),
            bill_type=bill_type,
            customer_name=customer_name
        )
        return notification
    except Exception as e:
        print(f"Error creating bill notification: {e}")
        return None

def create_welcome_notification(user):
    """
    Create welcome notification for new users
    """
    try:
        notification = Notification.objects.create(
            user=user,
            title='Welcome to Nexus Bills!',
            notification_type='info',
            message='Get started by creating your first bill.',
            action_url='/kacha-bill/'
        )
        return notification
    except Exception as e:
        print(f"Error creating welcome notification: {e}")
        return None

def create_bill_updated_notification(user, bill_type, bill_number, customer_name):
    """
    Create a notification when a bill is updated
    """
    try:
        notification = Notification.objects.create(
            user=user,
            notification_type='info',
            title=f'{bill_type.capitalize()} Bill Updated',
            message=f'{bill_type.capitalize()} bill {bill_number} for {customer_name} has been updated.',
            action_url=f'/{bill_type}-bills/',
            bill_type=bill_type,
            customer_name=customer_name
        )
        return notification
    except Exception as e:
        print(f"Error creating bill updated notification: {e}")
        return None

def create_bill_deleted_notification(user, bill_type, bill_number):
    """
    Create a notification when a bill is deleted
    """
    try:
        notification = Notification.objects.create(
            user=user,
            notification_type='warning',
            title=f'{bill_type.capitalize()} Bill Deleted',
            message=f'{bill_type.capitalize()} bill {bill_number} has been deleted.',
            action_url=f'/{bill_type}-bills/',
            bill_type=bill_type
        )
        return notification
    except Exception as e:
        print(f"Error creating bill deleted notification: {e}")
        return None

def create_conversion_notification(user, from_type, to_type, bill_number, customer_name):
    """
    Create a notification when a bill is converted
    """
    try:
        notification = Notification.objects.create(
            user=user,
            notification_type='success',
            title='Bill Converted Successfully',
            message=f'{from_type.capitalize()} bill {bill_number} for {customer_name} has been converted to {to_type} bill.',
            action_url=f'/{to_type}-bills/',
            bill_type=to_type,
            customer_name=customer_name
        )
        return notification
    except Exception as e:
        print(f"Error creating conversion notification: {e}")
        return None

def create_notification(user, title, message, notification_type='info', 
                       action_url=None, bill_type=None, customer_name=None, amount=None):
    """
    Generic function to create notifications
    """
    try:
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            bill_type=bill_type,
            customer_name=customer_name,
            amount=amount
        )
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None

# Dashboard utility functions
def calculate_collection_totals(collection, user_id=None):
    """
    Calculate total amount and count for a collection
    """
    try:
        query = {}
        if user_id:
            query['user_id'] = user_id
            
        pipeline = [
            {'$match': query},
            {
                '$group': {
                    '_id': None,
                    'total_amount': {'$sum': '$totalAmount'},
                    'count': {'$sum': 1}
                }
            }
        ]
        
        result = list(collection.aggregate(pipeline))
        if result:
            return {
                'amount': result[0].get('total_amount', 0),
                'count': result[0].get('count', 0)
            }
        else:
            return {'amount': 0, 'count': 0}
            
    except Exception as e:
        print(f"Aggregation failed: {e}")
        try:
            total_amount = 0
            count = 0
            query = {}
            if user_id:
                query['user_id'] = user_id
                
            for doc in collection.find(query, {'totalAmount': 1}):
                total_amount += doc.get('totalAmount', 0)
                count += 1
            return {'amount': total_amount, 'count': count}
        except Exception as e2:
            print(f"Manual calculation also failed: {e2}")
            return {'amount': 0, 'count': 0}

def get_monthly_trends(user_id=None):
    """
    Get monthly trends for the last 6 months
    """
    monthly_data = []
    kacha_collection = get_kacha_bills_collection()
    pakka_collection = get_pakka_bills_collection()
    
    try:
        for i in range(5, -1, -1):
            try:
                month_start = (datetime.now().replace(day=1) - timedelta(days=30*i)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_str = month_start.strftime('%b %Y')
                
                user_query = {}
                if user_id:
                    user_query['user_id'] = user_id
                
                kacha_query = {
                    **user_query,
                    'billDate': {
                        '$gte': month_start.strftime('%Y-%m-%d'),
                        '$lte': month_end.strftime('%Y-%m-%d')
                    }
                }
                kacha_count = kacha_collection.count_documents(kacha_query)
                
                pakka_query = {
                    **user_query,
                    'billDate': {
                        '$gte': month_start.strftime('%Y-%m-%d'),
                        '$lte': month_end.strftime('%Y-%m-%d')
                    }
                }
                pakka_count = pakka_collection.count_documents(pakka_query)
                
                monthly_data.append({
                    'month': month_str,
                    'kacha_bills': kacha_count,
                    'pakka_bills': pakka_count,
                    'total': kacha_count + pakka_count
                })
            except Exception as e:
                print(f"Error processing month {i}: {e}")
                month_start = (datetime.now().replace(day=1) - timedelta(days=30*i)).replace(day=1)
                month_str = month_start.strftime('%b %Y')
                monthly_data.append({
                    'month': month_str,
                    'kacha_bills': 0,
                    'pakka_bills': 0,
                    'total': 0
                })
                
    except Exception as e:
        print(f"Error in get_monthly_trends: {e}")
        monthly_data = []
        for i in range(5, -1, -1):
            month_start = (datetime.now().replace(day=1) - timedelta(days=30*i)).replace(day=1)
            month_str = month_start.strftime('%b %Y')
            monthly_data.append({
                'month': month_str,
                'kacha_bills': 0,
                'pakka_bills': 0,
                'total': 0
            })
    
    return monthly_data

def get_top_customers(user_id=None):
    """
    Get top customers by bill count
    """
    try:
        all_bills = []
        kacha_collection = get_kacha_bills_collection()
        pakka_collection = get_pakka_bills_collection()
        
        user_query = {}
        if user_id:
            user_query['user_id'] = user_id
        
        kacha_bills = list(kacha_collection.find(user_query, {'customerName': 1}))
        all_bills.extend(kacha_bills)
        
        pakka_bills = list(pakka_collection.find(user_query, {'customerName': 1}))
        all_bills.extend(pakka_bills)
        
        customer_counts = {}
        for bill in all_bills:
            try:
                customer_name = bill.get('customerName')
                if customer_name and customer_name.strip():
                    customer_counts[customer_name] = customer_counts.get(customer_name, 0) + 1
            except Exception as e:
                print(f"Error processing customer name: {e}")
                continue
        
        sorted_customers = sorted(customer_counts.items(), key=lambda x: x[1], reverse=True)
        top_customers = [{'name': customer, 'count': count} 
                        for customer, count in sorted_customers[:5]]
        
        return top_customers
        
    except Exception as e:
        print(f"Critical error in get_top_customers: {e}")
        return []