# kacha_bills/views.py
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from core.mongo_client import get_kacha_bills_collection, get_pakka_bills_collection, get_next_bill_number
from bson.objectid import ObjectId
from datetime import datetime  # Add this import

def kacha_bill_view(request):
    """
    Kacha Bill Generator - Initial bill for deal negotiation
    """
    return render(request, 'kacha_bills/kacha_bill.html')

def kacha_bills_view(request):
    """
    View to display all kacha bills
    """
    return render(request, 'kacha_bills/kacha_bills.html')

def get_all_kacha_bills(request):
    """
    API endpoint to get all kacha bills
    """
    if request.method == 'GET':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            kacha_bills = list(kacha_bills_collection.find().sort('_id', -1))
            
            # Convert ObjectId to string for JSON serialization
            for bill in kacha_bills:
                bill['_id'] = str(bill['_id'])
                
            return JsonResponse({
                'status': 'success', 
                'kacha_bills': kacha_bills
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

@csrf_exempt
def convert_kacha_to_pakka(request, kacha_id):
    """
    Convert a kacha bill to pakka bill and delete the kacha bill
    """
    if request.method == 'POST':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            pakka_bills_collection = get_pakka_bills_collection()
            
            # Get the kacha bill
            kacha_bill = kacha_bills_collection.find_one({'_id': ObjectId(kacha_id)})
            
            if not kacha_bill:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Kacha Bill not found'
                }, status=404)
            
            # Remove _id from kacha bill to create new pakka bill
            pakka_data = kacha_bill.copy()
            if '_id' in pakka_data:
                del pakka_data['_id']
            
            # Add conversion metadata and required pakka bill fields
            pakka_data['converted_from'] = 'kacha'
            pakka_data['original_kacha_id'] = kacha_id
            pakka_data['converted_at'] = datetime.now().isoformat()
            pakka_data['billType'] = 'pakka'
            pakka_data['billNumber'] = get_next_bill_number('pakka')
            
            # Ensure required pakka bill fields exist
            if 'gstNumber' not in pakka_data:
                pakka_data['gstNumber'] = 'TO_BE_ADDED'
            if 'sellerAddress' not in pakka_data:
                pakka_data['sellerAddress'] = 'TO_BE_ADDED'
            if 'customerGst' not in pakka_data:
                pakka_data['customerGst'] = ''
            if 'customerAddress' not in pakka_data:
                pakka_data['customerAddress'] = ''
            if 'terms' not in pakka_data:
                pakka_data['terms'] = ''
            
            # Insert into pakka bills
            result = pakka_bills_collection.insert_one(pakka_data)
            
            # DELETE the kacha bill after successful conversion
            kacha_bills_collection.delete_one({'_id': ObjectId(kacha_id)})
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Kacha Bill converted to Pakka Bill successfully! The kacha bill has been removed.',
                'pakka_bill_id': str(result.inserted_id)
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