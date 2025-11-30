# drafts/views.py
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from core.mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection, get_next_bill_number
from bson.objectid import ObjectId
from datetime import datetime

def drafts_view(request):
    """
    Drafts Management - Continue working on existing drafts
    """
    return render(request, 'drafts/drafts.html')

@csrf_exempt
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
            
            # Generate automatic bill number for new bills - ALWAYS generate for new bills
            if not draft_id:
                bill_data['billNumber'] = get_next_bill_number(status)
            # For existing drafts, keep the existing bill number
            # If somehow it's missing, generate one
            elif draft_id and not bill_data.get('billNumber'):
                bill_data['billNumber'] = get_next_bill_number(status)
            
            # If we have a draftId and status is draft, UPDATE the existing draft
            if draft_id and status == 'draft':
                try:
                    drafts_collection = get_drafts_collection()
                    
                    # Update the existing draft
                    result = drafts_collection.update_one(
                        {'_id': ObjectId(draft_id)},
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

def get_drafts_view(request):
    """
    Retrieve all draft bills
    """
    if request.method == 'GET':
        try:
            drafts_collection = get_drafts_collection()
            drafts = list(drafts_collection.find().sort('_id', -1))
            
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

def get_draft_by_id(request, draft_id):
    """
    Retrieve a single draft by ID
    """
    if request.method == 'GET':
        try:
            drafts_collection = get_drafts_collection()
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id)})
            
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
def delete_draft_view(request, draft_id):
    """
    Delete a draft by ID
    """
    if request.method == 'DELETE':
        try:
            drafts_collection = get_drafts_collection()
            result = drafts_collection.delete_one({'_id': ObjectId(draft_id)})
            
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
def convert_draft_to_kacha(request, draft_id):
    """
    Convert a draft to kacha bill and delete the draft
    """
    if request.method == 'POST':
        try:
            drafts_collection = get_drafts_collection()
            kacha_bills_collection = get_kacha_bills_collection()
            
            # Get the draft
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id)})
            
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
            draft_data['billNumber'] = get_next_bill_number('kacha')
            
            # Insert into kacha bills
            result = kacha_bills_collection.insert_one(draft_data)
            
            # Delete the original draft
            drafts_collection.delete_one({'_id': ObjectId(draft_id)})
            
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
def convert_draft_to_pakka(request, draft_id):
    """
    Convert a draft directly to pakka bill and delete the draft
    """
    if request.method == 'POST':
        try:
            drafts_collection = get_drafts_collection()
            pakka_bills_collection = get_pakka_bills_collection()
            
            # Get the draft
            draft = drafts_collection.find_one({'_id': ObjectId(draft_id)})
            
            if not draft:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Draft not found'
                }, status=404)
            
            # Remove _id from draft to create new pakka bill
            draft_data = draft.copy()
            if '_id' in draft_data:
                del draft_data['_id']
            
            # Add conversion metadata and required pakka bill fields
            draft_data['converted_from'] = 'draft'
            draft_data['original_draft_id'] = draft_id
            draft_data['converted_at'] = datetime.now().isoformat()
            draft_data['billType'] = 'pakka'
            draft_data['billNumber'] = get_next_bill_number('pakka')
            
            # Ensure required pakka bill fields exist
            if 'gstNumber' not in draft_data:
                draft_data['gstNumber'] = 'TO_BE_ADDED'
            if 'sellerAddress' not in draft_data:
                draft_data['sellerAddress'] = 'TO_BE_ADDED'
            if 'terms' not in draft_data:
                draft_data['terms'] = ''
            
            # Insert into pakka bills
            result = pakka_bills_collection.insert_one(draft_data)
            
            # Delete the original draft
            drafts_collection.delete_one({'_id': ObjectId(draft_id)})
            
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