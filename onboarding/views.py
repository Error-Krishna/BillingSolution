from datetime import datetime
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from core.mongo_client import get_company_details_collection

def onboarding_view(request):
    """
    Onboarding view for new users to set up company details
    """
    # Check if company details already exist
    company_collection = get_company_details_collection()
    existing_company = company_collection.find_one()
    
    if existing_company:
        # Company details already set, redirect to dashboard
        return redirect('dashboard:dashboard')
    
    return render(request, 'onboarding/onboarding.html')

@csrf_exempt
def save_company_details(request):
    """
    Save company details from onboarding
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
            
            # Check if company details already exist
            existing_company = company_collection.find_one()
            if existing_company:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Company details already set up'
                }, status=400)
            
            # Prepare company data
            company_data = {
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
                'created_at': datetime.now().isoformat()
            }
            
            # Save to database
            result = company_collection.insert_one(company_data)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Company details saved successfully!',
                'company_id': str(result.inserted_id)
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

def check_company_setup(request):
    """
    Check if company details are set up
    """
    company_collection = get_company_details_collection()
    existing_company = company_collection.find_one()
    
    return JsonResponse({
        'status': 'success',
        'company_setup': bool(existing_company)
    })

def get_company_details(request):
    """
    Get company details for use in bills
    """
    company_collection = get_company_details_collection()
    company_details = company_collection.find_one()
    
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