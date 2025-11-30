from django.shortcuts import redirect
from django.urls import reverse
from core.mongo_client import get_company_details_collection

class OnboardingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for onboarding URLs and static files
        if (request.path.startswith('/onboarding/') or 
            request.path.startswith('/static/') or 
            request.path.startswith('/admin/') or
            request.path.startswith('/api/')):
            return self.get_response(request)
        
        # Check if company details exist
        company_collection = get_company_details_collection()
        existing_company = company_collection.find_one()
        
        # If no company details and not on onboarding page, redirect to onboarding
        if not existing_company and not request.path == reverse('onboarding:onboarding'):
            return redirect('onboarding:onboarding')
        
        return self.get_response(request)