# pakka_bills/views.py - Updated for multi-user
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from core.mongo_client import get_pakka_bills_collection
from bson.objectid import ObjectId

@login_required
def pakka_bill_view(request):
    """
    Pakka Bill Generator - Final official bill with complete details
    """
    return render(request, 'pakka_bills/pakka_bill.html')

@login_required
def pakka_bills_view(request):
    """
    View to display all pakka bills
    """
    return render(request, 'pakka_bills/pakka_bills.html')

@login_required
def get_all_pakka_bills(request):
    """
    API endpoint to get all pakka bills for current user
    """
    if request.method == 'GET':
        try:
            pakka_bills_collection = get_pakka_bills_collection()
            pakka_bills = list(pakka_bills_collection.find({'user_id': str(request.user.id)}).sort('_id', -1))
            
            # Convert ObjectId to string for JSON serialization
            for bill in pakka_bills:
                bill['_id'] = str(bill['_id'])
                
            return JsonResponse({
                'status': 'success', 
                'pakka_bills': pakka_bills
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=400)
            
    return JsonResponse({
        'status': 'error', 
        'message': 'Invalid request method'
    }, status=405)

@login_required
def get_pakka_bill_by_id(request, pakka_id):
    """
    API endpoint to get a single pakka bill by ID (only if it belongs to the user)
    """
    if request.method == 'GET':
        try:
            pakka_bills_collection = get_pakka_bills_collection()
            bill = pakka_bills_collection.find_one({'_id': ObjectId(pakka_id), 'user_id': str(request.user.id)})
            
            if bill:
                bill['_id'] = str(bill['_id'])
                return JsonResponse({
                    'status': 'success', 
                    'bill': bill
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Pakka Bill not found'
                }, status=404)
                
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=400)
            
    return JsonResponse({
        'status': 'error', 
        'message': 'Invalid request method'
    }, status=405)