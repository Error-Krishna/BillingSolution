from datetime import datetime
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from core.mongo_client import get_company_details_collection

@login_required
def onboarding_view(request):
    """
    Onboarding view for new users to set up company details
    """
    # Check if company details already exist for this user
    company_collection = get_company_details_collection()
    existing_company = company_collection.find_one({'user_id': str(request.user.id)})
    
    # If company details exist and onboarding is complete, redirect to dashboard
    if existing_company and existing_company.get('onboarding_complete'):
        return redirect('dashboard:dashboard')
    
    return render(request, 'onboarding/onboarding.html')

@csrf_exempt
@login_required
def save_company_details(request):
    """
    Save company details from onboarding (user-specific)
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            
            # Validate required fields
            required_fields = ['companyName', 'gstNumber', 'address', 'city', 'state', 'pincode']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Please fill in the {field.replace("_", " ")}'
                    }, status=400)
            
            company_collection = get_company_details_collection()
            
            # Check if company details already exist for this user
            existing_company = company_collection.find_one({'user_id': str(request.user.id)})
            
            # Prepare company data with user_id
            company_data = {
                'user_id': str(request.user.id),
                'companyName': data['companyName'],
                'gstNumber': data['gstNumber'],
                'address': data['address'],
                'city': data['city'],
                'state': data['state'],
                'pincode': data['pincode'],
                'phone': data.get('phone', ''),
                'email': data.get('email', ''),
                'website': data.get('website', ''),
                'bankName': data.get('bankName', ''),
                'accountNumber': data.get('accountNumber', ''),
                'ifscCode': data.get('ifscCode', ''),
                'onboarding_complete': True,  # Mark onboarding as complete
                'onboarding_completed_at': datetime.now().isoformat(),
                'created_at': datetime.now().isoformat()
            }
            
            if existing_company:
                # Update existing company details
                result = company_collection.update_one(
                    {'user_id': str(request.user.id)},
                    {'$set': company_data}
                )
                message = 'Company details updated successfully!'
            else:
                # Insert new company details
                result = company_collection.insert_one(company_data)
                message = 'Company details saved successfully!'
            
            return JsonResponse({
                'status': 'success',
                'message': message,
                'onboarding_complete': True
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
        'message': 'Invalid request method'
    }, status=405)

@login_required
def check_company_setup(request):
    """
    Check if company details are set up for current user
    """
    company_collection = get_company_details_collection()
    existing_company = company_collection.find_one({'user_id': str(request.user.id)})
    
    return JsonResponse({
        'status': 'success',
        'company_setup': bool(existing_company and existing_company.get('onboarding_complete'))
    })

@login_required
def get_company_details(request):
    """
    Get company details for current user
    """
    company_collection = get_company_details_collection()
    company_details = company_collection.find_one({'user_id': str(request.user.id)})
    
    if company_details:
        # Remove MongoDB _id for JSON serialization
        if '_id' in company_details:
            company_details['_id'] = str(company_details['_id'])
        
        return JsonResponse({
            'status': 'success',
            'company': company_details
        })
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'Company details not found'
        }, status=404)