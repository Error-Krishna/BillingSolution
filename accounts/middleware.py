from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import logout

class UserDataMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add user-specific data to request context
        if request.user.is_authenticated:
            request.user_id = str(request.user.id)
        else:
            request.user_id = None
            
        response = self.get_response(request)
        return response