// static/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleButton = document.getElementById('mobile-menu-toggle');
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
                if (company.email) {
                    const businessEmailElements = document.querySelectorAll('.business-email');
                    businessEmailElements.forEach(el => {
                        el.textContent = company.email;
                    });
                }

                // Update the user avatar with company initials
                const userAvatar = document.querySelector('.user-avatar');
                if (userAvatar && company.companyName) {
                    const initials = company.companyName
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
                    userAvatar.textContent = initials;
                }
            }
        } catch (error) {
            console.error('Error loading company info:', error);
            // Don't show error for company info as it might not be set up yet
        }
    }

    // Initialize company info
    loadCompanyInfo();

    // Initialize any tooltips
    function initTooltips() {
        const elementsWithTitle = document.querySelectorAll('[title]');
        elementsWithTitle.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                // Custom tooltip implementation can be added here
            });
        });
    }

    // Initialize when DOM is ready
    initTooltips();

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

// Page load performance monitoring
window.addEventListener('load', () => {
    if (performance.getEntriesByType('navigation').length > 0) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        console.log('Page loaded in:', (navEntry.loadEventEnd - navEntry.fetchStart).toFixed(2), 'ms');
    }
});