// static/js/app.js - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const desktopToggle = document.getElementById('desktop-sidebar-toggle');
    const sidebarItems = document.querySelectorAll('.sidebar-item');

    // Mobile menu functions
    function openMenu() {
        try {
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.warn('Error opening menu:', error);
        }
    }

    function closeMenu() {
        try {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.add('hidden');
            document.body.style.overflow = '';
        } catch (error) {
            console.warn('Error closing menu:', error);
        }
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

    // Global helper function for showing alerts
    window.showAppAlert = function(message, type = 'success') {
        console.log(`ALERT (${type}):`, message);
        
        // Remove any existing alerts first
        const existingAlerts = document.querySelectorAll('[data-alert]');
        existingAlerts.forEach(alert => {
            try {
                alert.remove();
            } catch (e) {
                console.log('Error removing alert:', e);
            }
        });
        
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
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alertDiv && alertDiv.parentNode) {
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
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2
            }).format(amount);
        } catch (e) {
            return '₹' + amount.toFixed(2);
        }
    };

    // Utility function to format date
    window.formatDate = function(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Fallback function to use user information
    window.useUserInfoAsFallback = function() {
        if (!window.djangoData || !window.djangoData.user) return;
        
        const businessNameElements = document.querySelectorAll('.business-name');
        const businessEmailElements = document.querySelectorAll('.business-email');
        const businessInitialsElements = document.querySelectorAll('.business-initials');
        
        businessNameElements.forEach(el => {
            if (el && (el.textContent === 'Your Business' || el.textContent.trim() === '')) {
                el.textContent = window.djangoData.user.username || 'Your Business';
            }
        });
        
        businessEmailElements.forEach(el => {
            if (el && (el.textContent === 'business@example.com' || el.textContent.trim() === '')) {
                el.textContent = window.djangoData.user.email || 'Update your profile';
            }
        });
        
        businessInitialsElements.forEach(el => {
            if (el && (el.textContent === 'KR' || el.textContent === 'NB' || el.textContent.trim() === '')) {
                el.textContent = window.djangoData.user.initials || 'NB';
            }
        });
    };

    // Load company information for sidebar
    async function loadCompanyInfo() {
        try {
            const response = await fetch('/api/get-company-details/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.status === 'success') {
                const company = result.company;
                
                // Update sidebar with company name if available
                const businessNameElements = document.querySelectorAll('.business-name');
                const businessEmailElements = document.querySelectorAll('.business-email');
                const businessInitialsElements = document.querySelectorAll('.business-initials');
                
                if (company.companyName && company.companyName.trim() !== '' && company.companyName !== 'Your Business') {
                    businessNameElements.forEach(el => {
                        if (el) el.textContent = company.companyName;
                    });
                    
                    // Update initials with company name
                    const initials = company.companyName
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
                    
                    businessInitialsElements.forEach(el => {
                        if (el) el.textContent = initials;
                    });
                }
                
                if (company.email && company.email.trim() !== '' && company.email !== 'business@example.com') {
                    businessEmailElements.forEach(el => {
                        if (el) el.textContent = company.email;
                    });
                }

                // Update page title with company name if it's the default
                const pageTitle = document.querySelector('.glow-text');
                if (pageTitle && company.companyName && company.companyName.trim() !== '') {
                    if (pageTitle.textContent.includes('Nexus Bills Dashboard') || pageTitle.textContent.includes('Page name')) {
                        pageTitle.textContent = `${company.companyName} Dashboard`;
                    }
                }
                
                // Update document title
                if (company.companyName && company.companyName.trim() !== '' && !document.title.includes(company.companyName)) {
                    document.title = `${company.companyName} - Nexus Bills`;
                }

                console.log('Company info loaded successfully:', company);
            } else {
                console.log('No company details found, using user information');
                // Use user information as fallback
                useUserInfoAsFallback();
            }
        } catch (error) {
            console.error('Error loading company info:', error);
            // Use user information as fallback
            useUserInfoAsFallback();
        }
    }

    // Initialize company info
    if (window.djangoData && window.djangoData.user && window.djangoData.user.is_authenticated) {
        loadCompanyInfo();
    } else {
        useUserInfoAsFallback();
    }

    // Initialize sidebar toggle
    initSidebarToggle();

    // Fixed tooltip initialization with error handling
    function initTooltips() {
        try {
            const elementsWithTitle = document.querySelectorAll('[title]');
            elementsWithTitle.forEach(element => {
                if (!element) return;
                
                element.addEventListener('mouseenter', function(e) {
                    try {
                        const title = this.getAttribute('title');
                        if (title) {
                            // Check if tooltip already exists
                            if (this.hasAttribute('data-tooltip-initialized')) {
                                return;
                            }
                            
                            // Create tooltip
                            const tooltip = document.createElement('div');
                            tooltip.className = 'fixed z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg pointer-events-none';
                            tooltip.textContent = title;
                            document.body.appendChild(tooltip);
                            
                            // Position tooltip
                            const rect = this.getBoundingClientRect();
                            const scrollX = window.scrollX || document.documentElement.scrollLeft;
                            const scrollY = window.scrollY || document.documentElement.scrollTop;
                            
                            tooltip.style.left = `${rect.left + scrollX}px`;
                            tooltip.style.top = `${rect.top + scrollY - tooltip.offsetHeight - 5}px`;
                            
                            // Mark element as having tooltip
                            this.setAttribute('data-tooltip-initialized', 'true');
                            
                            // Remove tooltip on mouse leave
                            const removeTooltip = () => {
                                if (tooltip.parentNode) {
                                    tooltip.parentNode.removeChild(tooltip);
                                }
                                this.removeEventListener('mouseleave', removeTooltip);
                                this.removeAttribute('data-tooltip-initialized');
                            };
                            
                            this.addEventListener('mouseleave', removeTooltip);
                        }
                    } catch (error) {
                        console.warn('Error creating tooltip:', error);
                    }
                });
            });
        } catch (error) {
            console.warn('Error initializing tooltips:', error);
        }
    }

    // Initialize when DOM is ready
    setTimeout(initTooltips, 100);

    // Handle window resize
    function handleResize() {
        if (window.innerWidth >= 1024) {
            // On desktop, ensure mobile menu is closed
            if (typeof closeMenu === 'function') {
                closeMenu();
            }
        }
    }

    window.addEventListener('resize', handleResize);

    // Enhanced form handling
    window.handleFormSubmit = async function(formElement, successCallback, errorCallback) {
        try {
            if (!formElement) {
                throw new Error('Form element is required');
            }
            
            const formData = new FormData(formElement);
            const submitButton = formElement.querySelector('button[type="submit"]');
            let originalText = '';
            
            if (submitButton) {
                originalText = submitButton.innerHTML;
                
                // Show loading state
                submitButton.innerHTML = `
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                `;
                submitButton.disabled = true;
            }
            
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
        if (Array.isArray(obj)) return obj.map(item => window.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = window.deepClone(obj[key]);
            });
            return clonedObj;
        }
        return obj;
    };

    // --- Django Messages Handling ---
    function handleDjangoMessages() {
        if (!window.djangoData || !window.djangoData.messages) return;
        
        const isLoginPage = window.location.pathname.includes('/accounts/login');
        const isDashboardPage = window.location.pathname === '/' || 
                                window.location.pathname === '/dashboard/' || 
                                window.location.pathname.includes('/dashboard');
        
        window.djangoData.messages.forEach(message => {
            if (message.tags === 'success') {
                if (isDashboardPage && message.text.includes('Welcome back')) {
                    // Show welcome message only on dashboard
                    showAppAlert(message.text, 'success');
                } else if (isLoginPage && message.text.includes('logged out')) {
                    // Show logout message only on login page
                    showAppAlert(message.text, 'success');
                } else if (!message.text.includes('Welcome back') && !message.text.includes('logged out')) {
                    // Show other messages normally
                    showAppAlert(message.text, message.tags);
                }
            } else {
                showAppAlert(message.text, message.tags);
            }
        });
        
        // Clear the welcome shown flag when leaving dashboard
        window.addEventListener('beforeunload', function() {
            if (!isDashboardPage) {
                sessionStorage.removeItem('welcomeShown');
            }
        });
    }

    // Handle Django messages
    handleDjangoMessages();

    // --- ENHANCED SEARCH FUNCTIONALITY ---
    window.enhancedSearch = async function(query, limit = 20) {
        try {
            if (!query || query.length < 2) {
                return {
                    status: 'success',
                    results: [],
                    count: 0,
                    message: 'Please enter at least 2 characters to search'
                };
            }
            
            // Show loading state in search bar if available
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.classList.add('searching');
            }
            
            const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`Search request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Process results with better formatting
                const processedResults = data.results.map(result => {
                    // Format date
                    if (result.billDate && result.billDate !== 'N/A') {
                        try {
                            const date = new Date(result.billDate);
                            if (!isNaN(date)) {
                                result.formattedDate = date.toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });
                            }
                        } catch (e) {
                            result.formattedDate = result.billDate;
                        }
                    } else {
                        result.formattedDate = 'No date';
                    }
                    
                    // Format amount
                    result.formattedAmount = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(result.totalAmount || 0);
                    
                    // Set URL based on type
                    if (result.type === 'kacha') {
                        result.url = '/kacha-bills/';
                        result.badgeColor = 'yellow';
                        result.actionText = 'View in Kacha Bills';
                    } else {
                        result.url = '/pakka-bills/';
                        result.badgeColor = 'green';
                        result.actionText = 'View in Pakka Bills';
                    }
                    
                    // Add display name (customer + firm/seller)
                    result.displayName = result.customerName || 'Unknown Customer';
                    if (result.type === 'kacha' && result.firmName) {
                        result.displayName += ` (${result.firmName})`;
                    } else if (result.type === 'pakka' && result.sellerName) {
                        result.displayName += ` (${result.sellerName})`;
                    }
                    
                    return result;
                });
                
                return {
                    ...data,
                    results: processedResults
                };
            } else {
                console.error('Search API error:', data.message);
                return {
                    status: 'error',
                    results: [],
                    count: 0,
                    message: data.message || 'Search failed'
                };
            }
        } catch (error) {
            console.error('Search failed:', error);
            return {
                status: 'error',
                results: [],
                count: 0,
                message: 'Search service is temporarily unavailable. Please try again.'
            };
        } finally {
            // Remove loading state
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.classList.remove('searching');
            }
        }
    };
    
    // --- Search and Notification Functionality ---
    window.performSearch = async function() {
        try {
            // Get the query from the component or fallback
            const query = this?.query?.trim() || '';
            
            if (!query || query.length < 2) {
                if (this) {
                    this.searchResults = [];
                    this.isLoading = false;
                    this.searchMessage = 'Enter at least 2 characters to search';
                }
                return;
            }
            
            // Set loading state
            if (this) {
                this.isLoading = true;
                this.searchResults = [];
                this.searchMessage = 'Searching...';
            }
            
            // Use enhanced search
            const searchResult = await window.enhancedSearch(query, 10);
            
            if (searchResult.status === 'success') {
                // Update Alpine component if available
                if (this) {
                    this.searchResults = searchResult.results;
                    this.isLoading = false;
                    this.searchMessage = searchResult.results.length === 0 
                        ? `No results found for "${query}"`
                        : `Found ${searchResult.count} results`;
                }
            } else {
                console.error('Search error:', searchResult.message);
                if (this) {
                    this.searchResults = [];
                    this.isLoading = false;
                    this.searchMessage = searchResult.message || 'Search failed';
                }
                showAppAlert(searchResult.message || 'Search failed', 'error');
            }
        } catch (error) {
            console.error('Search failed:', error);
            if (this) {
                this.searchResults = [];
                this.isLoading = false;
                this.searchMessage = 'Search service is temporarily unavailable';
            }
            showAppAlert('Search service is temporarily unavailable', 'error');
        }
    };
    
    // --- ENHANCED NOTIFICATION SYSTEM ---
    window.enhancedNotifications = {
        lastUnreadCount: 0,
        lastNotifications: [],
        isLoading: false,
        pollingInterval: null,
        
        // Load notifications from server
        async loadNotifications() {
            // Don't load if we're on login/register pages
            const currentPath = window.location.pathname;
            const ignorePaths = ['/accounts/login', '/accounts/register', '/accounts/reset'];
            
            if (ignorePaths.some(path => currentPath.includes(path))) {
                return;
            }
            
            this.isLoading = true;
            try {
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch('/api/notifications/', {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        console.log('Notifications endpoint not found.');
                        // Remove notifications feature entirely
                        this.stopPolling();
                        return;
                    }
                    if (response.status === 500) {
                        console.log('Server error loading notifications.');
                        // Stop polling for this session if server returns 500
                        this.stopPolling();
                        return;
                    }
                    if (response.status === 401 || response.status === 403) {
                        console.log('User not authenticated for notifications.');
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.lastNotifications = data.notifications || [];
                    this.lastUnreadCount = data.unread_count || 0;
                    this.updateTabTitle(this.lastUnreadCount);
                    this.updateNotificationBadge(this.lastUnreadCount);
                } else {
                    console.log('Notification API error:', data.message);
                }
            } catch (error) {
                // Handle abort/timeout separately
                if (error.name === 'AbortError') {
                    console.log('Notifications request timed out.');
                } else if (!error.message.includes('Failed to fetch')) {
                    // Don't log network errors
                    console.log('Failed to load notifications:', error.message);
                }
            } finally {
                this.isLoading = false;
            }
        },
        
        // Update notification badge
        updateNotificationBadge(count) {
            try {
                const badgeElements = document.querySelectorAll('.notification-badge');
                badgeElements.forEach(element => {
                    if (element) {
                        if (count > 0) {
                            element.textContent = count > 99 ? '99+' : count;
                            element.classList.remove('hidden');
                            element.classList.add('notification-pulse');
                        } else {
                            element.classList.add('hidden');
                            element.classList.remove('notification-pulse');
                        }
                    }
                });
            } catch (error) {
                console.log('Error updating notification badge:', error.message);
            }
        },
        
        // Start polling for new notifications
        startPolling: function(interval = 30000) {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
            
            // Initial check after 3 seconds
            setTimeout(() => {
                this.loadNotifications();
            }, 3000);
            
            // Set up polling
            this.pollingInterval = setInterval(() => {
                this.loadNotifications();
            }, interval);
        },
        
        // Stop polling
        stopPolling: function() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        },
        
        // Mark a notification as read
        async markAsRead(notificationId) {
            try {
                const response = await fetch(`/api/notifications/${notificationId}/read/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': window.getCSRFToken(),
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 404) {
                    console.log('Mark as read endpoint not found.');
                    return false;
                }
                
                const data = await response.json();
                if (data.status === 'success') {
                    // Update local state
                    const notification = this.lastNotifications.find(n => n.id == notificationId);
                    if (notification) {
                        notification.read = true;
                        this.lastUnreadCount = Math.max(0, this.lastUnreadCount - 1);
                        this.updateTabTitle(this.lastUnreadCount);
                        this.updateNotificationBadge(this.lastUnreadCount);
                    }
                    return true;
                }
                return false;
            } catch (error) {
                console.log('Failed to mark notification as read:', error.message);
                return false;
            }
        },
        
        // Mark all notifications as read
        async markAllAsRead() {
            try {
                const response = await fetch('/api/notifications/read-all/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': window.getCSRFToken(),
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 404) {
                    console.log('Mark all read endpoint not found.');
                    return false;
                }
                
                const data = await response.json();
                if (data.status === 'success') {
                    this.lastUnreadCount = 0;
                    this.updateTabTitle(0);
                    this.updateNotificationBadge(0);
                    
                    // Mark all as read locally
                    this.lastNotifications.forEach(notification => {
                        notification.read = true;
                    });
                    
                    return true;
                }
                return false;
            } catch (error) {
                console.log('Failed to mark all notifications as read:', error.message);
                return false;
            }
        },
        
        // Update browser tab title
        updateTabTitle: function(unreadCount) {
            try {
                const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
                if (unreadCount > 0) {
                    document.title = `(${unreadCount}) ${originalTitle}`;
                } else {
                    document.title = originalTitle;
                }
            } catch (error) {
                console.log('Error updating tab title:', error.message);
            }
        },
        
        // Check for overdue bills and show reminder
        checkOverdueBills: async function() {
            try {
                const response = await fetch('/api/check-overdue-bills/');
                
                // If endpoint doesn't exist, just return
                if (response.status === 404) {
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.overdue_count > 0) {
                    // Only show if not shown recently
                    const lastShown = localStorage.getItem('overdueAlertLastShown');
                    const now = Date.now();
                    
                    if (!lastShown || (now - parseInt(lastShown)) > 3600000) {
                        this.showOverdueAlert(data.overdue_count, data.oldest_bill_date);
                        localStorage.setItem('overdueAlertLastShown', now.toString());
                    }
                }
            } catch (error) {
                // Don't show error for missing endpoint
                if (!error.message.includes('404') && !error.message.includes('Not Found')) {
                    console.log('Failed to check overdue bills:', error.message);
                }
            }
        },
        
        // Show overdue alert
        showOverdueAlert: function(count, oldestDate) {
            const message = `You have ${count} kacha bill${count > 1 ? 's' : ''} pending conversion for more than 7 days.`;
            
            // Check if alert already exists
            if (document.querySelector('[data-overdue-alert]')) {
                return;
            }
            
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('data-overdue-alert', 'true');
            alertDiv.className = 'fixed bottom-4 right-4 z-50 p-4 bg-yellow-900/90 border-l-4 border-yellow-500 rounded-lg shadow-lg max-w-sm backdrop-blur-sm';
            alertDiv.innerHTML = `
                <div class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-yellow-200">Conversion Reminder</p>
                        <p class="text-xs text-yellow-300 mt-1">${message}</p>
                        ${oldestDate ? `<p class="text-xs text-yellow-400/80 mt-1">Oldest bill: ${oldestDate}</p>` : ''}
                        <div class="flex gap-2 mt-2">
                            <a href="/kacha-bills/" class="text-xs px-3 py-1 bg-yellow-600/50 text-yellow-200 rounded hover:bg-yellow-600/70 transition">
                                View Bills
                            </a>
                            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-xs px-3 py-1 bg-gray-700/50 text-gray-300 rounded hover:bg-gray-700/70 transition">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(alertDiv);
            
            // Auto remove after 15 seconds
            setTimeout(() => {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 15000);
        }
    };

    // Initialize enhanced notifications if user is authenticated
    if (window.djangoData && window.djangoData.user && window.djangoData.user.is_authenticated) {
        // Start notification polling after 2 seconds
        setTimeout(() => {
            window.enhancedNotifications.startPolling();
            
            // Check for overdue bills after 5 seconds
            setTimeout(() => {
                window.enhancedNotifications.checkOverdueBills();
            }, 5000);
        }, 2000);
    }

    // Clean up polling when page is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            window.enhancedNotifications.stopPolling();
        } else {
            window.enhancedNotifications.startPolling();
        }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        window.enhancedNotifications.stopPolling();
    });
    
    // Add keyboard shortcuts for search
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search and close dropdowns
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.value = '';
                searchInput.blur();
                // Trigger Alpine.js update if exists
                if (searchInput.__x) {
                    searchInput.__x.$data.query = '';
                    searchInput.__x.$data.isSearchOpen = false;
                }
            }
        }
    });

    // Debug info
    console.log('App initialized successfully. Current path:', window.location.pathname);
});

// Make functions available globally for other scripts
window.closeMobileMenu = function() {
    try {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
    } catch (error) {
        console.warn('Error in closeMobileMenu:', error);
    }
};

window.openMobileMenu = function() {
    try {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.warn('Error in openMobileMenu:', error);
    }
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

// Add CSS for search loading state
const style = document.createElement('style');
style.textContent = `
    input.searching {
        background-image: linear-gradient(90deg, transparent, rgba(255, 102, 0, 0.1), transparent);
        background-size: 200% 100%;
        animation: searchLoading 1.5s infinite;
    }
    
    @keyframes searchLoading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    .search-highlight {
        background-color: rgba(255, 102, 0, 0.2);
        border-radius: 2px;
        padding: 0 2px;
    }
    
    /* Notification animation */
    @keyframes notificationPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .notification-pulse {
        animation: notificationPulse 0.5s ease-in-out;
    }
    
    /* Search results scrollbar */
    .search-results-scroll::-webkit-scrollbar {
        width: 6px;
    }
    
    .search-results-scroll::-webkit-scrollbar-track {
        background: rgba(51, 51, 51, 0.3);
        border-radius: 3px;
    }
    
    .search-results-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 102, 0, 0.5);
        border-radius: 3px;
    }
    
    .search-results-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 102, 0, 0.7);
    }
    
    /* Tooltip styles */
    [data-tooltip-initialized] {
        position: relative;
    }
    
    /* Simple tooltip fallback using CSS */
    [title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

// Global utility for formatting notification time
window.formatNotificationTime = function(timestamp) {
    if (!timestamp) return 'Recently';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: diffDays < 365 ? undefined : 'numeric'
        });
    } catch (e) {
        return 'Recently';
    }
};