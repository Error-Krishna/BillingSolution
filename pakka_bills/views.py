# pakka_bills/views.py
from django.shortcuts import render
from django.http import JsonResponse
from core.mongo_client import get_pakka_bills_collection

def pakka_bill_view(request):
    """
    Pakka Bill Generator - Final official bill with complete details
    """
    return render(request, 'pakka_bills/pakka_bill.html')

def pakka_bills_view(request):
    """
    View to display all pakka bills
    """
    return render(request, 'pakka_bills/pakka_bills.html')

def get_all_pakka_bills(request):
    """
    API endpoint to get all pakka bills
    """
    if request.method == 'GET':
        try:
            pakka_bills_collection = get_pakka_bills_collection()
            pakka_bills = list(pakka_bills_collection.find().sort('_id', -1))
            
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