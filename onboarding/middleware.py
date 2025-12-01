from django.shortcuts import redirect
from django.urls import reverse

from core.mongo_client import get_company_details_collection


class OnboardingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for authentication URLs, static files, and admin
        if (request.path.startswith('/accounts/') or 
            request.path.startswith('/static/') or 
            request.path.startswith('/admin/') or
            request.path.startswith('/api/') or
            request.path == reverse('onboarding:onboarding')):
            return self.get_response(request)
        
        # If user is not authenticated and not on login/register page, redirect to login
        if not request.user.is_authenticated:
            if not (request.path == reverse('accounts:login') or request.path == reverse('accounts:register')):
                return redirect('accounts:login')
            return self.get_response(request)
        
        # If user is authenticated but hasn't completed onboarding
        if request.user.is_authenticated:
            company_collection = get_company_details_collection()
            existing_company = company_collection.find_one({'user_id': str(request.user.id)})
            
            # Check session flag or onboarding status
            force_onboarding = request.session.get('force_onboarding', False)
            onboarding_complete = existing_company and existing_company.get('onboarding_complete')
            
            # If forced onboarding OR onboarding not complete, redirect to onboarding
            if (force_onboarding or not onboarding_complete):
                if not request.path == reverse('onboarding:onboarding'):
                    # Clear the session flag once we redirect to onboarding
                    if 'force_onboarding' in request.session:
                        del request.session['force_onboarding']
                    return redirect('onboarding:onboarding')
        
        return self.get_response(request)