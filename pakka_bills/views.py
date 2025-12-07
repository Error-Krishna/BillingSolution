# pakka_bills/views.py - Updated for multi-user with notifications
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from core.mongo_client import get_pakka_bills_collection, get_next_bill_number, get_company_details_collection
from core.utils import create_bill_notification, create_bill_deleted_notification
from bson.objectid import ObjectId
from datetime import datetime

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

@csrf_exempt
@login_required
def create_pakka_bill(request):
    """
    API endpoint to create a new pakka bill
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            pakka_bills_collection = get_pakka_bills_collection()
            company_collection = get_company_details_collection()
            
            # Get company details
            company_details = company_collection.find_one({'user_id': str(request.user.id)})
            if not company_details:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Company details not found. Please complete onboarding first.'
                }, status=400)
            
            # Generate bill number
            bill_number = get_next_bill_number('pakka', str(request.user.id))
            
            # Build seller address from company details
            address_parts = []
            if company_details.get('address'):
                address_parts.append(company_details['address'])
            city_state_pincode = [
                company_details.get('city', ''),
                company_details.get('state', ''),
                company_details.get('pincode', '')
            ]
            city_state_pincode_str = ', '.join([part for part in city_state_pincode if part])
            if city_state_pincode_str:
                address_parts.append(city_state_pincode_str)
            
            seller_address = '\n'.join(address_parts)
            
            # Prepare bill data with company details
            bill_data = {
                'user_id': str(request.user.id),
                'billNumber': bill_number,
                'billDate': data.get('billDate', datetime.now().strftime('%Y-%m-%d')),
                'customerName': data.get('customerName', ''),
                'customerFirmName': data.get('customerFirmName', ''),
                'customerAddress': data.get('customerAddress', ''),
                'sellerName': company_details.get('companyName', ''),
                'sellerAddress': seller_address,
                'gstNumber': company_details.get('gstNumber', ''),
                'products': data.get('products', []),
                'totalAmount': data.get('totalAmount', 0),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'billType': 'pakka',
                'companyDetails': {
                    'companyName': company_details.get('companyName', ''),
                    'gstNumber': company_details.get('gstNumber', ''),
                    'address': company_details.get('address', ''),
                    'city': company_details.get('city', ''),
                    'state': company_details.get('state', ''),
                    'pincode': company_details.get('pincode', ''),
                    'phone': company_details.get('phone', ''),
                    'email': company_details.get('email', ''),
                    'bankName': company_details.get('bankName', ''),
                    'accountNumber': company_details.get('accountNumber', ''),
                    'ifscCode': company_details.get('ifscCode', '')
                }
            }
            
            # Add company contact details
            if company_details.get('phone'):
                bill_data['sellerPhone'] = company_details['phone']
            if company_details.get('email'):
                bill_data['sellerEmail'] = company_details['email']
            
            # Add banking details if available
            if company_details.get('bankName'):
                bill_data['bankName'] = company_details['bankName']
            if company_details.get('accountNumber'):
                bill_data['accountNumber'] = company_details['accountNumber']
            if company_details.get('ifscCode'):
                bill_data['ifscCode'] = company_details['ifscCode']
            
            # Add optional fields from request
            optional_fields = ['terms', 'paymentMethod', 'deliveryDate', 'discount', 'tax', 'notes', 'yourOwnerName', 'customerOwnerName', 'customerFirmName']
            for field in optional_fields:
                if field in data:
                    bill_data[field] = data[field]
            
            # Insert into database
            result = pakka_bills_collection.insert_one(bill_data)
            
            # Create notification
            create_bill_notification(
                user=request.user,
                bill_type='pakka',
                bill_number=bill_number,
                customer_name=data.get('customerName', 'Unknown'),
                bill_id=str(result.inserted_id)
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Pakka Bill created successfully!',
                'bill_id': str(result.inserted_id),
                'bill_number': bill_number
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)
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

@csrf_exempt
@login_required
def delete_pakka_bill(request, pakka_id):
    """
    Delete a pakka bill by ID (only if it belongs to the user)
    """
    if request.method == 'DELETE':
        try:
            pakka_bills_collection = get_pakka_bills_collection()
            
            # Get the bill info before deleting for notification
            bill = pakka_bills_collection.find_one({'_id': ObjectId(pakka_id), 'user_id': str(request.user.id)})
            
            if not bill:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Pakka Bill not found'
                }, status=404)
            
            result = pakka_bills_collection.delete_one({'_id': ObjectId(pakka_id), 'user_id': str(request.user.id)})
            
            if result.deleted_count == 1:
                # Create notification for deletion
                create_bill_deleted_notification(
                    user=request.user,
                    bill_type='pakka',
                    bill_number=bill.get('billNumber', '')
                )
                
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Pakka Bill deleted successfully!'
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
        'message': 'Invalid request method. Only DELETE allowed.'
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