from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
import json
from core.mongo_client import get_company_details_collection
from datetime import datetime

@login_required
def profile_view(request):
    """
    Profile management view where users can edit company details and personal information
    """
    return render(request, 'user_profile/profile.html')

@login_required
def get_profile_data(request):
    """
    API endpoint to get profile data including company details and user information
    """
    if request.method == 'GET':
        try:
            company_collection = get_company_details_collection()
            company_details = company_collection.find_one({'user_id': str(request.user.id)})
            
            # Prepare user data
            user_data = {
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name or '',
                'last_name': request.user.last_name or '',
                'date_joined': request.user.date_joined.isoformat() if request.user.date_joined else None,
                'last_login': request.user.last_login.isoformat() if request.user.last_login else None
            }
            
            # Prepare company data
            company_data = {}
            if company_details:
                # Remove MongoDB _id for JSON serialization
                if '_id' in company_details:
                    company_details['_id'] = str(company_details['_id'])
                company_data = company_details
            
            return JsonResponse({
                'status': 'success',
                'user': user_data,
                'company': company_data
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Failed to load profile data: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=405)

@csrf_exempt
@login_required
def update_company_details(request):
    """
    API endpoint to update company details
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
            
            # Check if company details exist for this user
            existing_company = company_collection.find_one({'user_id': str(request.user.id)})
            
            # Prepare company data
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
                'updated_at': datetime.now().isoformat()
            }
            
            # Preserve onboarding completion status and creation date
            if existing_company:
                company_data['onboarding_complete'] = existing_company.get('onboarding_complete', True)
                company_data['onboarding_completed_at'] = existing_company.get('onboarding_completed_at')
                company_data['created_at'] = existing_company.get('created_at', datetime.now().isoformat())
                
                # Update existing company details
                result = company_collection.update_one(
                    {'user_id': str(request.user.id)},
                    {'$set': company_data}
                )
                message = 'Company details updated successfully!'
            else:
                # Insert new company details (shouldn't happen if onboarding was completed)
                company_data['onboarding_complete'] = True
                company_data['onboarding_completed_at'] = datetime.now().isoformat()
                company_data['created_at'] = datetime.now().isoformat()
                
                result = company_collection.insert_one(company_data)
                message = 'Company details saved successfully!'
            
            return JsonResponse({
                'status': 'success',
                'message': message
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

@csrf_exempt
@login_required
def update_user_profile(request):
    """
    API endpoint to update user profile information
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            
            # Update user fields
            user = request.user
            if 'email' in data and data['email']:
                user.email = data['email']
            
            if 'first_name' in data:
                user.first_name = data['first_name']
            
            if 'last_name' in data:
                user.last_name = data['last_name']
            
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Profile updated successfully!'
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

@csrf_exempt
@login_required
def change_password(request):
    """
    API endpoint to change user password
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            
            # Validate inputs
            if not all([current_password, new_password, confirm_password]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'All password fields are required'
                }, status=400)
            
            if new_password != confirm_password:
                return JsonResponse({
                    'status': 'error',
                    'message': 'New passwords do not match'
                }, status=400)
            
            if len(new_password) < 8:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Password must be at least 8 characters long'
                }, status=400)
            
            # Check current password
            user = request.user
            if not user.check_password(current_password):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Current password is incorrect'
                }, status=400)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Update session to prevent logout
            update_session_auth_hash(request, user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Password changed successfully!'
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