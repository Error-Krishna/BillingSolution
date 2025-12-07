// static/js/notifications.js
(function() {
    'use strict';

    // Global notification state
    window.notificationState = {
        unreadCount: 0,
        notifications: [],
        isLoading: false
    };

    // Initialize notifications system
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on the notifications page
        if (window.location.pathname === '/notifications/') {
            loadNotificationsPage();
        }
        
        // Initialize notification badge on all pages
        updateNotificationBadgeFromAPI();
    });

    // Main function to load notifications for the page
    async function loadNotificationsPage() {
        try {
            window.notificationState.isLoading = true;
            showLoadingIndicator();
            
            const response = await fetch('/api/notifications/all/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Update global state
                window.notificationState.notifications = data.notifications;
                window.notificationState.unreadCount = data.unread_count;
                
                // Update UI - check if we're using Alpine.js
                if (typeof Alpine !== 'undefined' && Alpine.data('notificationPage')) {
                    // If using Alpine.js, update the component
                    const alpineContext = document.querySelector('[x-data="notificationPage()"]');
                    if (alpineContext && alpineContext.__x) {
                        alpineContext.__x.$data.notifications = data.notifications;
                        alpineContext.__x.$data.unreadCount = data.unread_count;
                        alpineContext.__x.$data.totalCount = data.total_count;
                        alpineContext.__x.$data.filteredNotifications = [...data.notifications];
                        alpineContext.__x.$data.isLoading = false;
                    }
                } else {
                    // Fallback to manual DOM updates
                    updateNotificationsList(data.notifications);
                }
                
                // Update notification badge
                updateNotificationBadge(data.unread_count);
                
                console.log('Loaded notifications:', data.notifications.length);
            } else {
                throw new Error(data.message || 'Failed to load notifications');
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            showError('Failed to load notifications. Please try again.');
        } finally {
            window.notificationState.isLoading = false;
            hideLoadingIndicator();
        }
    }

    // Update notification badge from API
    async function updateNotificationBadgeFromAPI() {
        try {
            const response = await fetch('/api/notifications/');
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    updateNotificationBadge(data.unread_count);
                }
            }
        } catch (error) {
            console.error('Failed to update notification badge:', error);
        }
    }

    // Mark notification as read
    async function markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Update global state
                window.notificationState.unreadCount = data.unread_count || Math.max(0, window.notificationState.unreadCount - 1);
                
                // Update UI
                updateNotificationBadge(window.notificationState.unreadCount);
                
                // Update specific notification
                const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (notificationElement) {
                    notificationElement.classList.remove('bg-blue-500/10');
                    notificationElement.classList.add('read');
                    
                    // Remove mark as read button
                    const markReadBtn = notificationElement.querySelector('[data-mark-read]');
                    if (markReadBtn) {
                        markReadBtn.remove();
                    }
                }
                
                showSuccess('Notification marked as read');
                return true;
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            showError('Failed to mark notification as read');
            return false;
        }
    }

    // Mark all notifications as read
    async function markAllAsRead() {
        try {
            if (window.notificationState.unreadCount === 0) {
                showInfo('No unread notifications');
                return;
            }
            
            if (!confirm(`Are you sure you want to mark all ${window.notificationState.unreadCount} notifications as read?`)) {
                return;
            }
            
            const response = await fetch('/api/notifications/read-all/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Update global state
                window.notificationState.unreadCount = 0;
                
                // Update all notifications to read
                window.notificationState.notifications.forEach(n => n.read = true);
                
                // Update UI
                updateNotificationBadge(0);
                
                // Update all notification elements
                document.querySelectorAll('[data-notification-id]').forEach(element => {
                    element.classList.remove('bg-blue-500/10');
                    element.classList.add('read');
                    
                    // Remove mark as read buttons
                    const markReadBtn = element.querySelector('[data-mark-read]');
                    if (markReadBtn) {
                        markReadBtn.remove();
                    }
                });
                
                showSuccess('All notifications marked as read');
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            showError('Failed to mark notifications as read');
        }
    }

    // Delete notification
    async function deleteNotification(notificationId) {
        try {
            if (!confirm('Are you sure you want to delete this notification?')) {
                return;
            }
            
            const response = await fetch(`/api/notifications/${notificationId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Remove from global state
                window.notificationState.notifications = window.notificationState.notifications.filter(n => n.id != notificationId);
                window.notificationState.unreadCount = data.unread_count || window.notificationState.unreadCount;
                
                // Update UI
                updateNotificationBadge(window.notificationState.unreadCount);
                
                // Remove the notification element
                const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (notificationElement) {
                    notificationElement.remove();
                }
                
                // If no notifications left, show empty state
                if (window.notificationState.notifications.length === 0) {
                    showEmptyState();
                }
                
                showSuccess('Notification deleted');
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            showError('Failed to delete notification');
        }
    }

    // Clear all notifications
    async function clearAllNotifications() {
        try {
            if (window.notificationState.notifications.length === 0) {
                showInfo('No notifications to clear');
                return;
            }
            
            if (!confirm('Are you sure you want to delete all notifications?')) {
                return;
            }
            
            const response = await fetch('/api/notifications/clear-all/', {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Reset global state
                window.notificationState.notifications = [];
                window.notificationState.unreadCount = 0;
                
                // Update UI
                updateNotificationBadge(0);
                showEmptyState();
                
                showSuccess('All notifications cleared');
            }
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
            showError('Failed to clear notifications');
        }
    }

    // UI Helper Functions
    function updateNotificationBadge(count) {
        const badgeElements = document.querySelectorAll('.notification-badge');
        badgeElements.forEach(element => {
            if (count > 0) {
                element.textContent = count > 99 ? '99+' : count;
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    }

    function updateNotificationsList(notifications) {
        const container = document.querySelector('[data-notifications-container]');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (notifications.length === 0) {
            showEmptyState();
            return;
        }
        
        notifications.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            container.appendChild(notificationElement);
        });
    }

    function createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item p-4 border border-mystic rounded-lg mb-3 ${!notification.read ? 'bg-blue-500/10' : 'bg-space-black'}`;
        div.dataset.notificationId = notification.id;
        
        const typeIcon = getNotificationIcon(notification.type);
        const typeColor = getNotificationTypeColor(notification.type);
        const timeAgo = formatNotificationTime(notification.timestamp);
        
        div.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 mt-1">
                    <div class="h-10 w-10 rounded-lg ${typeColor.bg} flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${typeColor.text}" viewBox="0 0 20 20" fill="currentColor">
                            ${typeIcon}
                        </svg>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-white">${escapeHtml(notification.title)}</h3>
                        <span class="text-sm text-gray-400">${timeAgo}</span>
                    </div>
                    <p class="text-gray-300 mb-3">${escapeHtml(notification.message)}</p>
                    
                    ${notification.bill_type || notification.customer_name || notification.amount ? `
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${notification.bill_type ? `
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            notification.bill_type === 'kacha' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                        }">
                            ${notification.bill_type.charAt(0).toUpperCase() + notification.bill_type.slice(1)} Bill
                        </span>` : ''}
                        
                        ${notification.customer_name ? `
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-mystic/30 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            ${escapeHtml(notification.customer_name)}
                        </span>` : ''}
                        
                        ${notification.amount ? `
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neon/20 text-neon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                            </svg>
                            ₹${notification.amount}
                        </span>` : ''}
                    </div>` : ''}
                    
                    <div class="flex items-center gap-2 pt-3 border-t border-mystic/50">
                        ${!notification.read ? `
                        <button data-mark-read="${notification.id}" 
                                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500/20 transition-colors">
                            Mark as read
                        </button>` : ''}
                        
                        ${notification.action_url && notification.action_url !== '#' ? `
                        <a href="${notification.action_url}" 
                           class="px-3 py-1.5 text-xs font-medium rounded-lg bg-neon/10 border border-neon text-neon hover:bg-neon/20 transition-colors">
                            View details
                        </a>` : ''}
                        
                        <button data-delete-notification="${notification.id}" 
                                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500 text-red-400 hover:bg-red-500/20 transition-colors ml-auto">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }

    function showEmptyState() {
        const container = document.querySelector('[data-notifications-container]');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 class="text-xl font-semibold text-white mb-2">No notifications yet</h3>
                <p class="text-gray-400 mb-6">When you get notifications, they'll appear here.</p>
            </div>
        `;
    }

    function showLoadingIndicator() {
        const container = document.querySelector('[data-notifications-container]');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto"></div>
                <p class="text-gray-400 mt-4">Loading notifications...</p>
            </div>
        `;
    }

    function hideLoadingIndicator() {
        // Loading indicator is replaced by content
    }

    // Helper Functions
    function getNotificationIcon(type) {
        const icons = {
            'info': '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />',
            'success': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />',
            'warning': '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />',
            'error': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />'
        };
        return icons[type] || icons.info;
    }

    function getNotificationTypeColor(type) {
        const colors = {
            'info': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
            'success': { bg: 'bg-green-500/20', text: 'text-green-400' },
            'warning': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
            'error': { bg: 'bg-red-500/20', text: 'text-red-400' }
        };
        return colors[type] || colors.info;
    }

    function formatNotificationTime(timestamp) {
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
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    function showSuccess(message) {
        if (typeof showAppAlert === 'function') {
            showAppAlert(message, 'success');
        } else {
            alert(message);
        }
    }

    function showError(message) {
        if (typeof showAppAlert === 'function') {
            showAppAlert(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    function showInfo(message) {
        if (typeof showAppAlert === 'function') {
            showAppAlert(message, 'info');
        } else {
            alert(message);
        }
    }

    // Event Listeners
    document.addEventListener('click', function(e) {
        // Mark as read
        if (e.target.matches('[data-mark-read]')) {
            e.preventDefault();
            const notificationId = e.target.dataset.markRead;
            markAsRead(notificationId);
        }
        
        // Delete notification
        if (e.target.matches('[data-delete-notification]')) {
            e.preventDefault();
            const notificationId = e.target.dataset.deleteNotification;
            deleteNotification(notificationId);
        }
        
        // Mark all as read
        if (e.target.matches('[data-mark-all-read]') || e.target.closest('[data-mark-all-read]')) {
            e.preventDefault();
            markAllAsRead();
        }
        
        // Clear all
        if (e.target.matches('[data-clear-all]') || e.target.closest('[data-clear-all]')) {
            e.preventDefault();
            clearAllNotifications();
        }
    });

    // Public API
    window.NotificationSystem = {
        load: loadNotificationsPage,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        deleteNotification: deleteNotification,
        clearAll: clearAllNotifications,
        refresh: loadNotificationsPage
    };

    console.log('Notifications system loaded');
})();