# core/utils.py - Updated for multi-user
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from .mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection

def calculate_collection_totals(collection, user_id=None):
    """
    Calculate total amount and count for a collection with robust error handling
    """
    try:
        # Build query with user filter if provided
        query = {}
        if user_id:
            query['user_id'] = user_id
            
        # Try aggregation pipeline first (more efficient)
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
        print(f"Aggregation failed for collection, falling back to manual calculation: {e}")
        try:
            # Fall back to manual calculation
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
    Get monthly trends for the last 6 months with error handling
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
                
                # Build user query
                user_query = {}
                if user_id:
                    user_query['user_id'] = user_id
                
                # Kacha bills for the month
                kacha_query = {
                    **user_query,
                    'billDate': {
                        '$gte': month_start.strftime('%Y-%m-%d'),
                        '$lte': month_end.strftime('%Y-%m-%d')
                    }
                }
                kacha_count = kacha_collection.count_documents(kacha_query)
                
                # Pakka bills for the month
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
                # Add empty data for this month to maintain consistency
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
        # Return empty trends if there's an error
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
    Get top customers by bill count with comprehensive error handling
    """
    try:
        all_bills = []
        kacha_collection = get_kacha_bills_collection()
        pakka_collection = get_pakka_bills_collection()
        
        # Build user query
        user_query = {}
        if user_id:
            user_query['user_id'] = user_id
        
        # Get kacha bills
        kacha_bills = list(kacha_collection.find(user_query, {'customerName': 1}))
        all_bills.extend(kacha_bills)
        
        # Get pakka bills
        pakka_bills = list(pakka_collection.find(user_query, {'customerName': 1}))
        all_bills.extend(pakka_bills)
        
        # Count customers with error handling
        customer_counts = {}
        for bill in all_bills:
            try:
                customer_name = bill.get('customerName')
                if customer_name and customer_name.strip():
                    customer_counts[customer_name] = customer_counts.get(customer_name, 0) + 1
            except Exception as e:
                print(f"Error processing customer name: {e}")
                continue
        
        # Get top 5 customers
        sorted_customers = sorted(customer_counts.items(), key=lambda x: x[1], reverse=True)
        top_customers = [{'name': customer, 'count': count} 
                        for customer, count in sorted_customers[:5]]
        
        return top_customers
        
    except Exception as e:
        print(f"Critical error in get_top_customers: {e}")
        return []