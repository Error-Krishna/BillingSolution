// static/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const desktopToggle = document.getElementById('desktop-sidebar-toggle');
    const sidebarItems = document.querySelectorAll('.sidebar-item');

    // Mobile menu functions
    function openMenu() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Mobile menu toggle
    if (toggleButton) {
        toggleButton.addEventListener('click', function(e) {
            e.stopPropagation(); 
            if (sidebar.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    // Desktop sidebar toggle functionality
    function initSidebarToggle() {
        const mainContent = document.querySelector('.min-h-screen.flex.flex-col');
        
        if (desktopToggle && sidebar && mainContent) {
            // Check saved state
            const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            
            if (sidebarCollapsed) {
                sidebar.classList.add('sidebar-desktop-hidden');
                mainContent.classList.add('main-content-expanded');
                
                // Update toggle button icon
                updateToggleButtonIcon(true);
            }
            
            desktopToggle.addEventListener('click', function() {
                const isCollapsed = sidebar.classList.toggle('sidebar-desktop-hidden');
                mainContent.classList.toggle('main-content-expanded');
                
                // Update toggle button icon
                updateToggleButtonIcon(isCollapsed);
                
                // Save state
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
        }
    }

    function updateToggleButtonIcon(isCollapsed) {
        if (!desktopToggle) return;
        
        if (isCollapsed) {
            desktopToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
        } else {
            desktopToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            `;
        }
    }

    // Close menu when clicking on overlay
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Close menu when clicking on a sidebar item on mobile
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth < 1024) {
                closeMenu();
            }
        });
    });

    // --- Fixed Sidebar Active State Management ---
    function setActiveSidebarItem() {
        const currentPath = window.location.pathname;
        
        // Remove active class from all items first
        sidebarItems.forEach(item => {
            item.classList.remove('active');
        });

        // Find the matching sidebar item based on current path
        let activeFound = false;

        sidebarItems.forEach(item => {
            const href = item.getAttribute('href');
            
            if (href) {
                // Remove trailing slashes for consistent comparison
                const cleanHref = href.replace(/\/$/, '');
                const cleanPath = currentPath.replace(/\/$/, '');
                
                // Exact match or path starts with href (for nested routes)
                if (cleanPath === cleanHref || cleanPath.startsWith(cleanHref + '/')) {
                    item.classList.add('active');
                    activeFound = true;
                }
                
                // Special handling for root/dashboard
                if ((cleanPath === '' || cleanPath === '/dashboard') && 
                    (cleanHref === '' || cleanHref === '/' || cleanHref === '/dashboard')) {
                    item.classList.add('active');
                    activeFound = true;
                }
            }
        });

        // If no active item found, use data-page attribute as fallback
        if (!activeFound) {
            const pathSegments = currentPath.split('/').filter(segment => segment);
            const currentPage = pathSegments[pathSegments.length - 1] || 'dashboard';
            
            sidebarItems.forEach(item => {
                const dataPage = item.getAttribute('data-page');
                if (dataPage === currentPage) {
                    item.classList.add('active');
                }
            });
        }
    }

    // Initialize active state
    setActiveSidebarItem();

    // Update active state when navigating (for browser back/forward)
    window.addEventListener('popstate', setActiveSidebarItem);

    // Enhanced click handler for sidebar items
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only prevent default for non-navigation links
            if (!href || href === '#' || href.startsWith('javascript:')) {
                e.preventDefault();
            }
            
            // Close mobile menu if open
            if (window.innerWidth < 1024) {
                closeMenu();
            }
            
            // Update active state immediately for better UX
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeMenu();
        }
    });

    // Search functionality
    const searchInput = document.querySelector('input[type="text"][placeholder="Search..."]');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                    showAppAlert(`Search functionality for "${searchTerm}" will be implemented soon.`, 'info');
                    this.value = '';
                }
            }
        });
    }

    // Notification button functionality
    const notificationButton = document.querySelector('button.relative.p-2.rounded-lg.bg-mystic');
    if (notificationButton) {
        notificationButton.addEventListener('click', function() {
            showAppAlert('Notifications feature will be implemented soon.', 'info');
        });
    }

    // Global helper function for showing alerts
    window.showAppAlert = function(message, type = 'success') {
        console.log(`ALERT (${type}):`, message);
        
        // Remove any existing alerts first
        const existingAlerts = document.querySelectorAll('[data-alert]');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create a beautiful alert
        const alertDiv = document.createElement('div');
        alertDiv.setAttribute('data-alert', 'true');
        alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
            type === 'success' 
                ? 'bg-green-900/80 border-green-400 text-green-200' 
                : type === 'error'
                ? 'bg-red-900/80 border-red-400 text-red-200'
                : type === 'warning'
                ? 'bg-yellow-900/80 border-yellow-400 text-yellow-200'
                : 'bg-blue-900/80 border-blue-400 text-blue-200'
        } backdrop-blur-sm max-w-sm transform transition-all duration-300 ease-in-out translate-x-full`;
        
        alertDiv.innerHTML = `
            <div class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button type="button" class="ml-4 text-gray-300 hover:text-white transition" onclick="this.parentElement.parentElement.remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Animate in
        requestAnimationFrame(() => {
            alertDiv.style.transform = 'translateX(0)';
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.parentNode.removeChild(alertDiv);
                    }
                }, 300);
            }
        }, 5000);
    };

    // Global CSRF token helper
    window.getCSRFToken = function() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    };

    // Enhanced error handling for fetch requests
    window.handleFetchError = function(error, defaultMessage = 'An error occurred') {
        console.error('Fetch error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showAppAlert('Network error: Please check your internet connection.', 'error');
        } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
            showAppAlert('Server error: Invalid response received.', 'error');
        } else {
            showAppAlert(error.message || defaultMessage, 'error');
        }
    };

    // Utility function to format currency
    window.formatCurrency = function(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Utility function to format date
    window.formatDate = function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Load company information for sidebar
    async function loadCompanyInfo() {
        try {
            const response = await fetch('/api/get-company-details/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const company = result.company;
                
                // Update sidebar with company name
                const businessNameElements = document.querySelectorAll('.business-name');
                businessNameElements.forEach(el => {
                    el.textContent = company.companyName || 'Your Business';
                });
                
                // Update business email if available
                const businessEmailElements = document.querySelectorAll('.business-email');
                businessEmailElements.forEach(el => {
                    el.textContent = company.email || 'business@example.com';
                });

                // Update the user avatar with company initials
                const userAvatar = document.querySelector('.user-avatar');
                const businessInitials = document.querySelector('.business-initials');
                
                if (userAvatar && businessInitials && company.companyName) {
                    const initials = company.companyName
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
                    businessInitials.textContent = initials;
                }
                
                // Update page title with company name if it's the default
                const pageTitle = document.querySelector('.glow-text');
                if (pageTitle && (pageTitle.textContent.includes('Page name') || pageTitle.textContent.includes('Dashboard'))) {
                    pageTitle.textContent = `${company.companyName} Dashboard`;
                }
                
                // Update document title
                if (company.companyName && !document.title.includes(company.companyName)) {
                    document.title = `${company.companyName} - Nexus Bills`;
                }
            }
        } catch (error) {
            console.error('Error loading company info:', error);
            // Don't show error for company info as it might not be set up yet
        }
    }

    // Initialize company info
    loadCompanyInfo();

    // Initialize sidebar toggle
    initSidebarToggle();

    // Initialize any tooltips
    function initTooltips() {
        const elementsWithTitle = document.querySelectorAll('[title]');
        elementsWithTitle.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                // Custom tooltip implementation can be added here
                const title = this.getAttribute('title');
                if (title) {
                    // Simple tooltip implementation
                    const tooltip = document.createElement('div');
                    tooltip.className = 'fixed z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg';
                    tooltip.textContent = title;
                    document.body.appendChild(tooltip);
                    
                    const rect = this.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX}px`;
                    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;
                    
                    this.setAttribute('data-tooltip', tooltip);
                    this.removeAttribute('title');
                    
                    this.addEventListener('mouseleave', function() {
                        if (tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                        }
                        this.setAttribute('title', title);
                    }, { once: true });
                }
            });
        });
    }

    // Initialize when DOM is ready
    initTooltips();

    // Handle window resize
    function handleResize() {
        if (window.innerWidth >= 1024) {
            // On desktop, ensure mobile menu is closed
            closeMenu();
        }
    }

    window.addEventListener('resize', handleResize);

    // Enhanced form handling
    window.handleFormSubmit = async function(formElement, successCallback, errorCallback) {
        try {
            const formData = new FormData(formElement);
            const submitButton = formElement.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            // Show loading state
            submitButton.innerHTML = `
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
            `;
            submitButton.disabled = true;
            
            const response = await fetch(formElement.action, {
                method: formElement.method,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    ...(formElement.enctype !== 'multipart/form-data' && { 
                        'Content-Type': 'application/json' 
                    })
                },
                body: formElement.enctype === 'multipart/form-data' ? formData : JSON.stringify(Object.fromEntries(formData))
            });
            
            const result = await response.json();
            
            if (response.ok) {
                if (successCallback) {
                    successCallback(result);
                } else {
                    showAppAlert('Operation completed successfully!', 'success');
                }
            } else {
                throw new Error(result.message || 'Operation failed');
            }
            
            return result;
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            if (errorCallback) {
                errorCallback(error);
            } else {
                showAppAlert(error.message || 'An error occurred', 'error');
            }
            
            throw error;
        } finally {
            // Reset button state
            const submitButton = formElement.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }
    };

    // Utility for debouncing function calls
    window.debounce = function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    };

    // Utility for deep cloning objects
    window.deepClone = function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => window.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = window.deepClone(obj[key]);
            });
            return clonedObj;
        }
    };

    // Debug info
    console.log('App initialized successfully. Current path:', window.location.pathname);
});

// Make functions available globally for other scripts
window.closeMobileMenu = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
};

window.openMobileMenu = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

// Auto-load company info on page load
window.addEventListener('load', () => {
    // Re-load company info to ensure latest data
    if (typeof loadCompanyInfo === 'function') {
        setTimeout(loadCompanyInfo, 100);
    }
    
    // Page load performance monitoring
    if (performance.getEntriesByType('navigation').length > 0) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        console.log('Page loaded in:', (navEntry.loadEventEnd - navEntry.fetchStart).toFixed(2), 'ms');
    }
});

// Export functions for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAppAlert: window.showAppAlert,
        formatCurrency: window.formatCurrency,
        formatDate: window.formatDate,
        getCSRFToken: window.getCSRFToken,
        handleFetchError: window.handleFetchError,
        debounce: window.debounce,
        deepClone: window.deepClone
    };
}