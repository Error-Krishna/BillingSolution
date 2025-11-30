from django.shortcuts import render
from django.http import JsonResponse
from core.mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection
from core.utils import calculate_collection_totals, get_monthly_trends, get_top_customers
from datetime import datetime, timedelta

def dashboard_view(request):
    """
    Dashboard view with statistics and overview
    """
    return render(request, 'dashboard/dashboard.html')

def get_dashboard_data(request):
    """
    API endpoint to get dashboard statistics with comprehensive error handling
    """
    if request.method == 'GET':
        # Initialize variables with default values
        this_week_drafts = 0
        this_week_kacha = 0
        this_week_pakka = 0
        this_week_total = 0
        total_revenue = 0
        average_bill_amount = 0
        
        try:
            drafts_collection = get_drafts_collection()
            kacha_bills_collection = get_kacha_bills_collection()
            pakka_bills_collection = get_pakka_bills_collection()
            
            # Get current date and date ranges
            today = datetime.now()
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)
            
            # Basic counts with comprehensive error handling
            total_drafts = drafts_collection.count_documents({})
            total_kacha_bills = kacha_bills_collection.count_documents({})
            total_pakka_bills = pakka_bills_collection.count_documents({})
            total_bills = total_kacha_bills + total_pakka_bills
            
            # Recent activity (last 7 days) with error handling
            recent_drafts = list(drafts_collection.find({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            }).sort('_id', -1).limit(5))
            
            recent_kacha_bills = list(kacha_bills_collection.find({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            }).sort('_id', -1).limit(5))
            
            recent_pakka_bills = list(pakka_bills_collection.find({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            }).sort('_id', -1).limit(5))
            
            # Calculate totals for each collection with error handling
            draft_totals = calculate_collection_totals(drafts_collection)
            kacha_totals = calculate_collection_totals(kacha_bills_collection)
            pakka_totals = calculate_collection_totals(pakka_bills_collection)
            
            # Monthly trends with error handling
            monthly_data = get_monthly_trends()
            
            # Top customers with error handling
            top_customers = get_top_customers()
            
            # Convert ObjectId to string for JSON serialization with error handling
            for draft in recent_drafts:
                draft['_id'] = str(draft['_id'])
            
            for bill in recent_kacha_bills:
                bill['_id'] = str(bill['_id'])
            
            for bill in recent_pakka_bills:
                bill['_id'] = str(bill['_id'])
            
            # Calculate additional statistics
            # This week's activity count
            this_week_drafts = drafts_collection.count_documents({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            })
            
            this_week_kacha = kacha_bills_collection.count_documents({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            })
            
            this_week_pakka = pakka_bills_collection.count_documents({
                'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
            })
            
            this_week_total = this_week_drafts + this_week_kacha + this_week_pakka
            
            # Total revenue (kacha + pakka)
            total_revenue = kacha_totals.get('amount', 0) + pakka_totals.get('amount', 0)
            
            # Average bill amount
            total_bill_count = kacha_totals.get('count', 0) + pakka_totals.get('count', 0)
            average_bill_amount = total_revenue / total_bill_count if total_bill_count > 0 else 0
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'counts': {
                        'drafts': total_drafts,
                        'kacha_bills': total_kacha_bills,
                        'pakka_bills': total_pakka_bills,
                        'total_bills': total_bills,
                        'this_week_total': this_week_total
                    },
                    'totals': {
                        'drafts': draft_totals,
                        'kacha': kacha_totals,
                        'pakka': pakka_totals,
                        'revenue': total_revenue,
                        'average_bill_amount': average_bill_amount
                    },
                    'recent_activity': {
                        'drafts': recent_drafts,
                        'kacha_bills': recent_kacha_bills,
                        'pakka_bills': recent_pakka_bills
                    },
                    'monthly_trends': monthly_data,
                    'top_customers': top_customers,
                    'weekly_activity': {
                        'drafts': this_week_drafts,
                        'kacha_bills': this_week_kacha,
                        'pakka_bills': this_week_pakka,
                        'total': this_week_total
                    }
                }
            })
            
        except Exception as e:
            print(f"Critical error in get_dashboard_data: {e}")
            return JsonResponse({
                'status': 'error', 
                'message': f'Failed to load dashboard data: {str(e)}'
            }, status=500)
            
    return JsonResponse({
        'status': 'error', 
        'message': 'Invalid request method'
    }, status=405)