// static/js/onboarding.js
document.addEventListener('DOMContentLoaded', function() {
    const companyForm = document.getElementById('companySetupForm');
    
    // Check if user has already completed onboarding
    checkOnboardingStatus();
    
    companyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(companyForm);
        const companyData = {
            companyName: document.getElementById('companyName').value,
            gstNumber: document.getElementById('gstNumber').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value,
            bankName: document.getElementById('bankName').value,
            accountNumber: document.getElementById('accountNumber').value,
            ifscCode: document.getElementById('ifscCode').value
        };
        
        await saveCompanyDetails(companyData);
    });
    
    async function checkOnboardingStatus() {
        try {
            const response = await fetch('/api/check-company-setup/');
            const result = await response.json();
            
            if (response.ok && result.company_setup) {
                // User has already completed onboarding, redirect to dashboard
                window.location.href = '/dashboard/';
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        }
    }
    
    async function saveCompanyDetails(companyData) {
        try {
            const submitButton = companyForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            // Show loading state
            submitButton.innerHTML = `
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving Company Details...
            `;
            submitButton.disabled = true;
            
            const response = await fetch('/api/save-company-details/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(companyData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                showAppAlert('Company details saved successfully! Redirecting to dashboard...', 'success');
                
                // Force redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to save company details');
            }
            
        } catch (error) {
            console.error('Error saving company details:', error);
            showAppAlert(`Error: ${error.message}`, 'error');
            
            // Reset button
            const submitButton = companyForm.querySelector('button[type="submit"]');
            submitButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Complete Setup & Get Started
            `;
            submitButton.disabled = false;
        }
    }
});