from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from core.mongo_client import get_company_details_collection

def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Create minimal company details with just user_id for now
            company_collection = get_company_details_collection()
            company_collection.insert_one({
                'user_id': str(user.id),
                'company_name': form.cleaned_data['company_name'],
                'onboarding_complete': False,  # Add this flag
                'created_at': user.date_joined.isoformat()
            })
            
            login(request, user)
            messages.success(request, 'Registration successful! Please complete your company setup.')
            return redirect('onboarding:onboarding')  # Force redirect to onboarding
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {user.username}!')
                
                # Check if onboarding is complete
                company_collection = get_company_details_collection()
                company_details = company_collection.find_one({'user_id': str(user.id)})
                
                if company_details and company_details.get('onboarding_complete'):
                    return redirect('dashboard:dashboard')
                else:
                    # Redirect to onboarding if not complete
                    return redirect('onboarding:onboarding')
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'accounts/login.html', {'form': form})

@login_required
def logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out successfully.')
    return redirect('accounts:login')

@login_required
def profile_view(request):
    return render(request, 'accounts/profile.html')