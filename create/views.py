# views.py
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from core.mongo_client import get_drafts_collection, get_kacha_bills_collection, get_pakka_bills_collection
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from collections import Counter

from core.mongo_client import get_next_bill_number

# ===== DASHBOARD VIEWS =====

def dashboard_view(request):
    """
    Dashboard view with statistics and overview
    """
    return render(request, 'kachaBill/dashboard.html')

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
            try:
                total_drafts = drafts_collection.count_documents({})
            except Exception as e:
                print(f"Error counting drafts: {e}")
                total_drafts = 0
            
            try:
                total_kacha_bills = kacha_bills_collection.count_documents({})
            except Exception as e:
                print(f"Error counting kacha bills: {e}")
                total_kacha_bills = 0
            
            try:
                total_pakka_bills = pakka_bills_collection.count_documents({})
            except Exception as e:
                print(f"Error counting pakka bills: {e}")
                total_pakka_bills = 0
            
            total_bills = total_kacha_bills + total_pakka_bills
            
            # Recent activity (last 7 days) with error handling
            try:
                recent_drafts = list(drafts_collection.find({
                    'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
                }).sort('_id', -1).limit(5))
            except Exception as e:
                print(f"Error fetching recent drafts: {e}")
                recent_drafts = []
            
            try:
                recent_kacha_bills = list(kacha_bills_collection.find({
                    'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
                }).sort('_id', -1).limit(5))
            except Exception as e:
                print(f"Error fetching recent kacha bills: {e}")
                recent_kacha_bills = []
            
            try:
                recent_pakka_bills = list(pakka_bills_collection.find({
                    'billDate': {'$gte': week_ago.strftime('%Y-%m-%d')}
                }).sort('_id', -1).limit(5))
            except Exception as e:
                print(f"Error fetching recent pakka bills: {e}")
                recent_pakka_bills = []
            
            # Calculate totals for each collection with error handling
            try:
                draft_totals = calculate_collection_totals(drafts_collection)
            except Exception as e:
                print(f"Error calculating draft totals: {e}")
                draft_totals = {'amount': 0, 'count': 0}
            
            try:
                kacha_totals = calculate_collection_totals(kacha_bills_collection)
            except Exception as e:
                print(f"Error calculating kacha totals: {e}")
                kacha_totals = {'amount': 0, 'count': 0}
            
            try:
                pakka_totals = calculate_collection_totals(pakka_bills_collection)
            except Exception as e:
                print(f"Error calculating pakka totals: {e}")
                pakka_totals = {'amount': 0, 'count': 0}
            
            # Monthly trends with error handling
            try:
                monthly_data = get_monthly_trends(kacha_bills_collection, pakka_bills_collection)
            except Exception as e:
                print(f"Error calculating monthly trends: {e}")
                monthly_data = []
            
            # Top customers with error handling
            try:
                top_customers = get_top_customers(kacha_bills_collection, pakka_bills_collection)
            except Exception as e:
                print(f"Error calculating top customers: {e}")
                top_customers = []
            
            # Convert ObjectId to string for JSON serialization with error handling
            try:
                for draft in recent_drafts:
                    draft['_id'] = str(draft['_id'])
            except Exception as e:
                print(f"Error converting draft ObjectId: {e}")
            
            try:
                for bill in recent_kacha_bills:
                    bill['_id'] = str(bill['_id'])
            except Exception as e:
                print(f"Error converting kacha bill ObjectId: {e}")
            
            try:
                for bill in recent_pakka_bills:
                    bill['_id'] = str(bill['_id'])
            except Exception as e:
                print(f"Error converting pakka bill ObjectId: {e}")
            
            # Calculate additional statistics
            try:
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
                
            except Exception as e:
                print(f"Error calculating additional statistics: {e}")
                # Variables already initialized with default values, so no need to reassign
            
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

def calculate_collection_totals(collection):
    """
    Calculate total amount and count for a collection with robust error handling
    """
    try:
        # Try aggregation pipeline first (more efficient)
        pipeline = [
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
            # Remove boolean check on collection
            for doc in collection.find({}, {'totalAmount': 1}):
                total_amount += doc.get('totalAmount', 0)
                count += 1
            return {'amount': total_amount, 'count': count}
        except Exception as e2:
            print(f"Manual calculation also failed: {e2}")
            return {'amount': 0, 'count': 0}

def get_monthly_trends(kacha_collection, pakka_collection):
    """
    Get monthly trends for the last 6 months with error handling
    """
    monthly_data = []
    try:
        for i in range(5, -1, -1):
            try:
                month_start = (datetime.now().replace(day=1) - timedelta(days=30*i)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_str = month_start.strftime('%b %Y')
                
                # Kacha bills for the month - remove boolean check on collection
                kacha_count = 0
                try:
                    kacha_count = kacha_collection.count_documents({
                        'billDate': {
                            '$gte': month_start.strftime('%Y-%m-%d'),
                            '$lte': month_end.strftime('%Y-%m-%d')
                        }
                    })
                except Exception as e:
                    print(f"Error counting kacha bills for month {month_str}: {e}")
                    kacha_count = 0
                
                # Pakka bills for the month - remove boolean check on collection
                pakka_count = 0
                try:
                    pakka_count = pakka_collection.count_documents({
                        'billDate': {
                            '$gte': month_start.strftime('%Y-%m-%d'),
                            '$lte': month_end.strftime('%Y-%m-%d')
                        }
                    })
                except Exception as e:
                    print(f"Error counting pakka bills for month {month_str}: {e}")
                    pakka_count = 0
                
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

def get_top_customers(kacha_collection, pakka_collection):
    """
    Get top customers by bill count with comprehensive error handling
    """
    try:
        all_bills = []
        
        # Get kacha bills - remove boolean check on collection
        try:
            kacha_bills = list(kacha_collection.find({}, {'customerName': 1}))
            all_bills.extend(kacha_bills)
        except Exception as e:
            print(f"Error fetching kacha bills for top customers: {e}")
        
        # Get pakka bills - remove boolean check on collection
        try:
            pakka_bills = list(pakka_collection.find({}, {'customerName': 1}))
            all_bills.extend(pakka_bills)
        except Exception as e:
            print(f"Error fetching pakka bills for top customers: {e}")
        
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
        try:
            sorted_customers = sorted(customer_counts.items(), key=lambda x: x[1], reverse=True)
            top_customers = [{'name': customer, 'count': count} 
                            for customer, count in sorted_customers[:5]]
        except Exception as e:
            print(f"Error sorting top customers: {e}")
            top_customers = []
        
        return top_customers
        
    except Exception as e:
        print(f"Critical error in get_top_customers: {e}")
        return []
    
# ===== BILL MANAGEMENT VIEWS =====

def kacha_bill_view(request):
    """
    Kacha Bill Generator - Initial bill for deal negotiation
    """
    return render(request, 'kachaBill/kacha_bill.html')

def pakka_bill_view(request):
    """
    Pakka Bill Generator - Final official bill with complete details
    """
    return render(request, 'kachaBill/pakka_bill.html')

def drafts_view(request):
    """
    Drafts Management - Continue working on existing drafts
    """
    return render(request, 'kachaBill/drafts.html')

# In views.py, update the save_bill_view function
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
            
            # Generate automatic bill number for new bills
            if not draft_id and not bill_data.get('billNumber'):
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

def get_kacha_bills_view(request):
    """
    Retrieve all kacha bills
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
            
            # Add conversion metadata
            draft_data['converted_from'] = 'draft'
            draft_data['original_draft_id'] = draft_id
            draft_data['converted_at'] = datetime.now().isoformat()
            
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

def kacha_bills_view(request):
    """
    View to display all kacha bills
    """
    return render(request, 'kachaBill/kacha_bills.html')

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


# Add this function to views.py
def pakka_bills_view(request):
    """
    View to display all pakka bills
    """
    return render(request, 'kachaBill/pakka_bills.html')

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