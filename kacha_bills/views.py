# kacha_bills/views.py - Updated for multi-user with notifications
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from core.mongo_client import get_kacha_bills_collection, get_pakka_bills_collection, get_next_bill_number, get_company_details_collection
from core.utils import create_bill_notification, create_conversion_notification, create_bill_deleted_notification
from bson.objectid import ObjectId
from datetime import datetime

@login_required
def kacha_bill_view(request):
    """
    Kacha Bill Generator - Initial bill for deal negotiation
    """
    return render(request, 'kacha_bills/kacha_bill.html')

@login_required
def kacha_bills_view(request):
    """
    View to display all kacha bills
    """
    return render(request, 'kacha_bills/kacha_bills.html')

@csrf_exempt
@login_required
def create_kacha_bill(request):
    """
    API endpoint to create a new kacha bill
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            kacha_bills_collection = get_kacha_bills_collection()
            company_collection = get_company_details_collection()
            
            # Get company details
            company_details = company_collection.find_one({'user_id': str(request.user.id)})
            
            # Generate bill number
            bill_number = get_next_bill_number('kacha', str(request.user.id))
            
            # Prepare bill data with company details
            bill_data = {
                'user_id': str(request.user.id),
                'billNumber': bill_number,
                'billDate': data.get('billDate', datetime.now().strftime('%Y-%m-%d')),
                'customerName': data.get('customerName', ''),
                'customerAddress': data.get('customerAddress', ''),
                'products': data.get('products', []),
                'totalAmount': data.get('totalAmount', 0),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'billType': 'kacha'
            }
            
            # Add company details if available
            if company_details:
                bill_data['firmName'] = company_details.get('companyName', '')
                bill_data['gstNumber'] = company_details.get('gstNumber', '')
                bill_data['companyDetails'] = {
                    'companyName': company_details.get('companyName', ''),
                    'gstNumber': company_details.get('gstNumber', ''),
                    'address': company_details.get('address', ''),
                    'city': company_details.get('city', ''),
                    'state': company_details.get('state', ''),
                    'pincode': company_details.get('pincode', ''),
                    'phone': company_details.get('phone', ''),
                    'email': company_details.get('email', '')
                }
            
            # Add optional fields
            optional_fields = ['paymentTerms', 'notes', 'deliveryDate', 'discount', 'tax', 'terms', 'yourOwnerName', 'customerOwnerName']
            for field in optional_fields:
                if field in data:
                    bill_data[field] = data[field]
            
            # Insert into database
            result = kacha_bills_collection.insert_one(bill_data)
            
            # Create notification
            create_bill_notification(
                user=request.user,
                bill_type='kacha',
                bill_number=bill_number,
                customer_name=data.get('customerName', 'Unknown'),
                bill_id=str(result.inserted_id)
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Kacha Bill created successfully!',
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
def get_all_kacha_bills(request):
    """
    API endpoint to get all kacha bills for current user
    """
    if request.method == 'GET':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            kacha_bills = list(kacha_bills_collection.find({'user_id': str(request.user.id)}).sort('_id', -1))
            
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
@login_required
def convert_kacha_to_pakka(request, kacha_id):
    """
    Convert a kacha bill to pakka bill and delete the kacha bill (only if it belongs to the user)
    """
    if request.method == 'POST':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            pakka_bills_collection = get_pakka_bills_collection()
            company_collection = get_company_details_collection()
            
            # Get the kacha bill
            kacha_bill = kacha_bills_collection.find_one({'_id': ObjectId(kacha_id), 'user_id': str(request.user.id)})
            
            if not kacha_bill:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Kacha Bill not found'
                }, status=404)
            
            # Get company details
            company_details = company_collection.find_one({'user_id': str(request.user.id)})
            if not company_details:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Company details not found. Please complete onboarding first.'
                }, status=400)
            
            # Remove _id from kacha bill to create new pakka bill
            pakka_data = kacha_bill.copy()
            if '_id' in pakka_data:
                del pakka_data['_id']
            
            # Add company details to pakka bill
            pakka_data['sellerName'] = company_details.get('companyName', '')
            pakka_data['gstNumber'] = company_details.get('gstNumber', '')
            
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
            
            pakka_data['sellerAddress'] = '\n'.join(address_parts)
            
            # Add additional company details if available
            if company_details.get('phone'):
                pakka_data['sellerPhone'] = company_details['phone']
            if company_details.get('email'):
                pakka_data['sellerEmail'] = company_details['email']
            if company_details.get('bankName'):
                pakka_data['bankName'] = company_details['bankName']
            if company_details.get('accountNumber'):
                pakka_data['accountNumber'] = company_details['accountNumber']
            if company_details.get('ifscCode'):
                pakka_data['ifscCode'] = company_details['ifscCode']
            
            # Add conversion metadata and required pakka bill fields
            pakka_data['converted_from'] = 'kacha'
            pakka_data['original_kacha_id'] = kacha_id
            pakka_data['converted_at'] = datetime.now().isoformat()
            pakka_data['billType'] = 'pakka'
            pakka_data['billNumber'] = get_next_bill_number('pakka', str(request.user.id))
            
            # Ensure required pakka bill fields exist
            if 'customerAddress' not in pakka_data:
                pakka_data['customerAddress'] = ''
            if 'terms' not in pakka_data:
                pakka_data['terms'] = ''
            
            # Insert into pakka bills
            result = pakka_bills_collection.insert_one(pakka_data)
            
            # Create notification for conversion
            create_conversion_notification(
                user=request.user,
                from_type='kacha',
                to_type='pakka',
                bill_number=kacha_bill.get('billNumber', ''),
                customer_name=kacha_bill.get('customerName', 'Unknown')
            )
            
            # DELETE the kacha bill after successful conversion
            kacha_bills_collection.delete_one({'_id': ObjectId(kacha_id), 'user_id': str(request.user.id)})
            
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

@csrf_exempt
@login_required
def delete_kacha_bill(request, kacha_id):
    """
    Delete a kacha bill by ID (only if it belongs to the user)
    """
    if request.method == 'DELETE':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            
            # Get the bill info before deleting for notification
            bill = kacha_bills_collection.find_one({'_id': ObjectId(kacha_id), 'user_id': str(request.user.id)})
            
            if not bill:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Kacha Bill not found'
                }, status=404)
            
            result = kacha_bills_collection.delete_one({'_id': ObjectId(kacha_id), 'user_id': str(request.user.id)})
            
            if result.deleted_count == 1:
                # Create notification for deletion
                create_bill_deleted_notification(
                    user=request.user,
                    bill_type='kacha',
                    bill_number=bill.get('billNumber', '')
                )
                
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Kacha Bill deleted successfully!'
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Kacha Bill not found'
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
def get_kacha_bill_by_id(request, kacha_id):
    """
    API endpoint to get a single kacha bill by ID (only if it belongs to the user)
    """
    if request.method == 'GET':
        try:
            kacha_bills_collection = get_kacha_bills_collection()
            bill = kacha_bills_collection.find_one({'_id': ObjectId(kacha_id), 'user_id': str(request.user.id)})
            
            if bill:
                bill['_id'] = str(bill['_id'])
                return JsonResponse({
                    'status': 'success', 
                    'bill': bill
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Kacha Bill not found'
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


@login_required
def kacha_bill_detail(request, bill_id):
    """
    View a single kacha bill with company details
    """
    try:
        kacha_collection = get_kacha_bills_collection()
        company_collection = get_company_details_collection()
        
        bill = kacha_collection.find_one({
            '_id': ObjectId(bill_id),
            'user_id': str(request.user.id)
        })
        
        if not bill:
            return render(request, '404.html', status=404)
        
        # Get company details
        company_details = company_collection.find_one({'user_id': str(request.user.id)})
        
        context = {
            'bill': bill,
            'company_details': company_details
        }
        
        return render(request, 'kacha_bills/kacha_bill_detail.html', context)
        
    except Exception as e:
        return render(request, 'error.html', {'error': str(e)})