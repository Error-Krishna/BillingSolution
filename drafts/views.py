# drafts/views.py - Updated for multi-user
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from core.mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection, get_next_bill_number, get_company_details_collection
from bson.objectid import ObjectId
from datetime import datetime

@login_required
def drafts_view(request):
    """
    Drafts Management - Continue working on existing drafts
    """
    return render(request, 'drafts/drafts.html')

@csrf_exempt
@login_required
def save_bill_view(request):
    """
    This view saves the bill data to MongoDB in appropriate collection.
    Handles both new bills and updates to existing drafts.
    """
    if request.method == 'POST':
        try:
            # Parse JSON data
            data = json.loads(request.body.decode('utf-8'))
            status = data.get('status', 'draft')
            draft_id = data.get('draftId')  # Get draft ID if provided
            
            print(f"Received data - Status: {status}, Draft ID: {draft_id}")  # Debug log
            
            # Remove status and draftId from data before saving
            bill_data = data.copy()
            if 'status' in bill_data:
                del bill_data['status']
            if 'draftId' in bill_data:
                del bill_data['draftId']
            
            # Add user_id to bill data
            bill_data['user_id'] = str(request.user.id)
            
            # Generate automatic bill number for new bills - ALWAYS generate for new bills
            if not draft_id:
                bill_data['billNumber'] = get_next_bill_number(status, str(request.user.id))
            # For existing drafts, keep the existing bill number
            # If somehow it's missing, generate one
            elif draft_id and not bill_data.get('billNumber'):
                bill_data['billNumber'] = get_next_bill_number(status, str(request.user.id))
            
            # If we have a draftId and status is draft, UPDATE the existing draft
            if draft_id and status == 'draft':
                try:
                    drafts_collection = get_drafts_collection()
                    
                    # Update the existing draft (only if it belongs to the user)
                    result = drafts_collection.update_one(
                        {'_id': ObjectId(draft_id), 'user_id': str(request.user.id)},
                        {'$set': bill_data}
                    )
                    
                    if result.modified_count == 1:
                        message = 'Draft updated successfully!'
                        return JsonResponse({
                            'status': 'success', 
                            'message': message, 
                            'bill_id': draft_id,
                            'bill_number': bill_data.get('billNumber'),
                            'updated': True
                        })
                    else:
                        return JsonResponse({
                            'status': 'error', 
                            'message': 'Draft not found or no changes made'
                        }, status=404)
                        
                except Exception as e:
                    return JsonResponse({
                        'status': 'error', 
                        'message': f'Error updating draft: {str(e)}'
                    }, status=500)
            
            # Otherwise, INSERT new document (new draft, kacha bill, or pakka bill)
            else:
                # Determine which collection to use
                if status == 'draft':
                    collection = get_drafts_collection()
                    message = 'Draft saved successfully!'
                elif status == 'kacha':
                    collection = get_kacha_bills_collection()
                    message = 'Kacha Bill generated successfully!'
                elif status == 'pakka':
                    collection = get_pakka_bills_collection()
                    message = 'Pakka Bill generated successfully!'
                    
                    # For pakka bills, automatically add company details
                    company_collection = get_company_details_collection()
                    company_details = company_collection.find_one({'user_id': str(request.user.id)})
                    
                    if company_details:
                        # Add company details to pakka bill
                        bill_data['firmName'] = company_details.get('companyName', '')
                        bill_data['gstNumber'] = company_details.get('gstNumber', '')
                        
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
                        
                        bill_data['sellerAddress'] = '\n'.join(address_parts)
                        
                        # Add additional company details if available
                        if company_details.get('phone'):
                            bill_data['sellerPhone'] = company_details['phone']
                        if company_details.get('email'):
                            bill_data['sellerEmail'] = company_details['email']
                        if company_details.get('bankName'):
                            bill_data['bankName'] = company_details['bankName']
                        if company_details.get('accountNumber'):
                            bill_data['accountNumber'] = company_details['accountNumber']
                        if company_details.get('ifscCode'):
                            bill_data['ifscCode'] = company_details['ifscCode']
                else:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'Invalid bill status'
                    }, status=400)
                
                # Insert new document
                result = collection.insert_one(bill_data)
                
                return JsonResponse({
                    'status': 'success', 
                    'message': message, 
                    'bill_id': str(result.inserted_id),
                    'bill_number': bill_data.get('billNumber'),
                    'updated': False
                })
            
        except json.JSONDecodeError as e:
            return JsonResponse({
                'status': 'error', 
                'message': f'Invalid JSON: {str(e)}'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': f'Server error: {str(e)}'
            }, status=500)
            
    return JsonResponse({
        'status': 'error', 
        'message': 'Invalid request method. Only POST allowed.'
    }, status=405)

@login_required
def get_drafts_view(request):
    """
    Retrieve all draft bills for current user
    """
    if request.method == 'GET':
        try:
            drafts_collection = get_drafts_collection()
            drafts = list(drafts_collection.find({'user_id': str(request.user.id)}).sort('_id', -1))
            
            # Convert ObjectId to string for JSON serialization
            for draft in drafts:
                draft['_id'] = str(draft['_id'])
                
            return JsonResponse({
                'status': 'success', 
                'drafts': drafts
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
def get_draft_by_id(request, draft_id):
    """
    Retrieve a single draft by ID (only if it belongs to the user)
    """
    if request.method == 'GET':
        try:
            drafts_collection = get_drafts_collection()
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            if draft:
                # Convert ObjectId to string for JSON serialization
                draft['_id'] = str(draft['_id'])
                return JsonResponse({
                    'status': 'success', 
                    'draft': draft
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Draft not found'
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

@csrf_exempt
@login_required
def delete_draft_view(request, draft_id):
    """
    Delete a draft by ID (only if it belongs to the user)
    """
    if request.method == 'DELETE':
        try:
            drafts_collection = get_drafts_collection()
            result = drafts_collection.delete_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            if result.deleted_count == 1:
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Draft deleted successfully!'
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Draft not found'
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

@csrf_exempt
@login_required
def convert_draft_to_kacha(request, draft_id):
    """
    Convert a draft to kacha bill and delete the draft (only if it belongs to the user)
    """
    if request.method == 'POST':
        try:
            drafts_collection = get_drafts_collection()
            kacha_bills_collection = get_kacha_bills_collection()
            
            # Get the draft
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            if not draft:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Draft not found'
                }, status=404)
            
            # Remove _id from draft to create new kacha bill
            draft_data = draft.copy()
            if '_id' in draft_data:
                del draft_data['_id']
            
            # Add conversion metadata and generate new bill number
            draft_data['converted_from'] = 'draft'
            draft_data['original_draft_id'] = draft_id
            draft_data['converted_at'] = datetime.now().isoformat()
            draft_data['billNumber'] = get_next_bill_number('kacha', str(request.user.id))
            
            # Insert into kacha bills
            result = kacha_bills_collection.insert_one(draft_data)
            
            # Delete the original draft
            drafts_collection.delete_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Draft converted to Kacha Bill successfully!',
                'kacha_bill_id': str(result.inserted_id)
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
def convert_draft_to_pakka(request, draft_id):
    """
    Convert a draft directly to pakka bill and delete the draft (only if it belongs to the user)
    """
    if request.method == 'POST':
        try:
            drafts_collection = get_drafts_collection()
            pakka_bills_collection = get_pakka_bills_collection()
            company_collection = get_company_details_collection()
            
            # Get the draft
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            if not draft:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Draft not found'
                }, status=404)
            
            # Get company details
            company_details = company_collection.find_one({'user_id': str(request.user.id)})
            if not company_details:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Company details not found. Please complete onboarding first.'
                }, status=400)
            
            # Remove _id from draft to create new pakka bill
            draft_data = draft.copy()
            if '_id' in draft_data:
                del draft_data['_id']
            
            # Add company details to pakka bill
            draft_data['firmName'] = company_details.get('companyName', '')
            draft_data['gstNumber'] = company_details.get('gstNumber', '')
            
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
            
            draft_data['sellerAddress'] = '\n'.join(address_parts)
            
            # Add additional company details if available
            if company_details.get('phone'):
                draft_data['sellerPhone'] = company_details['phone']
            if company_details.get('email'):
                draft_data['sellerEmail'] = company_details['email']
            if company_details.get('bankName'):
                draft_data['bankName'] = company_details['bankName']
            if company_details.get('accountNumber'):
                draft_data['accountNumber'] = company_details['accountNumber']
            if company_details.get('ifscCode'):
                draft_data['ifscCode'] = company_details['ifscCode']
            
            # Add conversion metadata and required pakka bill fields
            draft_data['converted_from'] = 'draft'
            draft_data['original_draft_id'] = draft_id
            draft_data['converted_at'] = datetime.now().isoformat()
            draft_data['billType'] = 'pakka'
            draft_data['billNumber'] = get_next_bill_number('pakka', str(request.user.id))
            
            # Ensure required pakka bill fields exist
            # REMOVED: customerGst field
            if 'customerAddress' not in draft_data:
                draft_data['customerAddress'] = ''
            if 'terms' not in draft_data:
                draft_data['terms'] = ''
            
            # Insert into pakka bills
            result = pakka_bills_collection.insert_one(draft_data)
            
            # Delete the original draft
            drafts_collection.delete_one({'_id': ObjectId(draft_id), 'user_id': str(request.user.id)})
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Draft converted to Pakka Bill successfully!',
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