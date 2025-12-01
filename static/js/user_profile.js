// Profile Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load profile data when page loads
    loadProfileData();
    
    // Initialize form event listeners
    initForms();
});

// Load profile data from server
async function loadProfileData() {
    try {
        showLoadingState();
        
        const response = await fetch('/api/get-profile-data/');
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            populateForms(result.user, result.company);
            updateUserDisplay(result.user);
        } else {
            showMessage(result.message || 'Failed to load profile data', 'error');
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        showMessage('Network error: Failed to load profile data', 'error');
    } finally {
        hideLoadingState();
    }
}

// Initialize form event listeners
function initForms() {
    // Company form
    const companyForm = document.getElementById('company-form');
    if (companyForm) {
        companyForm.addEventListener('submit', handleCompanySubmit);
    }
    
    // Personal form
    const personalForm = document.getElementById('personal-form');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalSubmit);
    }
    
    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
}

// Populate forms with existing data
function populateForms(userData, companyData) {
    // Populate company form
    if (companyData) {
        const companyForm = document.getElementById('company-form');
        const fields = [
            'companyName', 'gstNumber', 'address', 'city', 'state', 'pincode',
            'phone', 'email', 'website', 'bankName', 'accountNumber', 'ifscCode'
        ];
        
        fields.forEach(field => {
            const input = companyForm.querySelector(`[name="${field}"]`);
            if (input && companyData[field]) {
                input.value = companyData[field];
            }
        });
    }
    
    // Populate personal form
    if (userData) {
        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');
        const emailInput = document.getElementById('user-email-input');
        
        if (firstNameInput) firstNameInput.value = userData.first_name || '';
        if (lastNameInput) lastNameInput.value = userData.last_name || '';
        if (emailInput) emailInput.value = userData.email || '';
    }
}

// Update user display information
function updateUserDisplay(userData) {
    // Update user initials
    const initialsElement = document.getElementById('user-initials');
    if (initialsElement && userData.first_name && userData.last_name) {
        const initials = (userData.first_name.charAt(0) + userData.last_name.charAt(0)).toUpperCase();
        initialsElement.textContent = initials;
    }
    
    // Update user full name
    const fullNameElement = document.getElementById('user-fullname');
    if (fullNameElement) {
        if (userData.first_name && userData.last_name) {
            fullNameElement.textContent = `${userData.first_name} ${userData.last_name}`;
        } else {
            fullNameElement.textContent = userData.username;
        }
    }
    
    // Update user email
    const emailElement = document.getElementById('user-email');
    if (emailElement) {
        emailElement.textContent = userData.email;
    }
}

// Handle company form submission
async function handleCompanySubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoadingState();
        
        const response = await fetch('/api/update-company-details/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            // Reload company info in sidebar
            if (typeof loadCompanyInfo === 'function') {
                loadCompanyInfo();
            }
        } else {
            showMessage(result.message || 'Failed to update company details', 'error');
        }
    } catch (error) {
        console.error('Error updating company details:', error);
        showMessage('Network error: Failed to update company details', 'error');
    } finally {
        hideLoadingState();
    }
}

// Handle personal form submission
async function handlePersonalSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoadingState();
        
        const response = await fetch('/api/update-user-profile/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            // Update display
            loadProfileData();
        } else {
            showMessage(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Network error: Failed to update profile', 'error');
    } finally {
        hideLoadingState();
    }
}

// Handle password form submission
async function handlePasswordSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validate password match
    if (data.new_password !== data.confirm_password) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    // Validate password length
    if (data.new_password.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }
    
    try {
        showLoadingState();
        
        const response = await fetch('/api/change-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            form.reset();
        } else {
            showMessage(result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('Network error: Failed to change password', 'error');
    } finally {
        hideLoadingState();
    }
}

// Show/hide sections
function showSection(sectionName) {
    // Hide all sections
    const sections = ['company', 'personal', 'password'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
}

// Show message
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    const alertClass = {
        'success': 'bg-green-900/80 border-green-400 text-green-200',
        'error': 'bg-red-900/80 border-red-400 text-red-200',
        'warning': 'bg-yellow-900/80 border-yellow-400 text-yellow-200',
        'info': 'bg-blue-900/80 border-blue-400 text-blue-200'
    }[type] || 'bg-blue-900/80 border-blue-400 text-blue-200';
    
    messageContainer.innerHTML = `
        <div class="rounded-lg border-l-4 p-4 ${alertClass} backdrop-blur-sm">
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="${
                        type === 'success' 
                            ? 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            : type === 'error'
                            ? 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                            : type === 'warning'
                            ? 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            : 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    }" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium">${message}</p>
                <button type="button" class="ml-auto text-gray-300 hover:text-white transition" onclick="this.parentElement.parentElement.remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageContainer.innerHTML.includes(message)) {
            messageContainer.innerHTML = '';
        }
    }, 5000);
}

// Show loading state
function showLoadingState() {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        const originalText = button.innerHTML;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = `
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
        `;
        button.disabled = true;
    });
}

// Hide loading state
function hideLoadingState() {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        }
        button.disabled = false;
    });
}

// Make functions available globally
window.showSection = showSection;
window.showMessage = showMessage;