// static/js/drafts.js - Updated version
document.addEventListener('DOMContentLoaded', function() {
    const draftsList = document.getElementById('draftsList');
    const refreshButton = document.getElementById('refreshDrafts');

    // Load drafts on page load
    loadDrafts();

    // Refresh drafts when button clicked
    if (refreshButton) {
        refreshButton.addEventListener('click', loadDrafts);
    }

    async function loadDrafts() {
        try {
            showLoadingState();
            const response = await fetch('/api/get-drafts/');
            const result = await response.json();
            
            if (response.ok && result.drafts && result.drafts.length > 0) {
                displayDrafts(result.drafts);
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading drafts:', error);
            showAppAlert('Error loading drafts: ' + error.message, 'error');
            showEmptyState();
        }
    }

    function showLoadingState() {
        draftsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-3"></div>
                <p>Loading drafts...</p>
            </div>
        `;
    }

    function showEmptyState() {
        draftsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-mystic" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No drafts found. Start by creating a new bill.</p>
            </div>
        `;
    }

    function displayDrafts(drafts) {
        draftsList.innerHTML = drafts.map(draft => `
            <div class="card p-4 hover:border-neon transition-colors" id="draft-${draft._id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-white">${escapeHtml(draft.firmName || 'Untitled Draft')}</h4>
                        <p class="text-sm text-gray-400 mt-1">Bill #: ${escapeHtml(draft.billNumber || 'Not set')}</p>
                        <p class="text-sm text-gray-400">Customer: ${escapeHtml(draft.customerName || 'Not specified')}</p>
                        <p class="text-sm text-gray-400">Date: ${escapeHtml(draft.billDate || 'Not set')}</p>
                        <p class="text-sm text-neon mt-2">Total: ${draft.totalAmount ? '₹' + draft.totalAmount.toFixed(2) : '₹0.00'}</p>
                    </div>
                    <div class="flex flex-col space-y-2 ml-4">
                        <div class="flex space-x-2">
                            <button onclick="editDraft('${draft._id}')" class="px-3 py-1 bg-electric text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                            </button>
                            <button onclick="deleteDraft('${draft._id}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                Delete
                            </button>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="convertDraftToKacha('${draft._id}')" class="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                                </svg>
                                To Kacha
                            </button>
                            <button onclick="convertDraftToPakka('${draft._id}')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                To Pakka
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.editDraft = function(draftId) {
        // Redirect to kacha bill page with draft ID
        window.location.href = '/kacha-bill/?draft=' + draftId;
    };

    window.deleteDraft = async function(draftId) {
        if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
            return;
        }

        try {
            // Show deleting state
            const draftElement = document.getElementById(`draft-${draftId}`);
            if (draftElement) {
                draftElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Deleting...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/delete-draft/${draftId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the draft from UI
                if (draftElement) {
                    draftElement.remove();
                }
                // Check if there are any drafts left
                const remainingDrafts = document.querySelectorAll('[id^="draft-"]');
                if (remainingDrafts.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to delete draft');
            }
        } catch (error) {
            console.error('Error deleting draft:', error);
            showAppAlert(`Error deleting draft: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadDrafts();
        }
    };

    window.convertDraftToKacha = async function(draftId) {
        if (!confirm('Convert this draft to Kacha Bill? The draft will be deleted after conversion.')) {
            return;
        }

        try {
            // Show converting state
            const draftElement = document.getElementById(`draft-${draftId}`);
            if (draftElement) {
                draftElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Converting to Kacha Bill...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/convert/draft-to-kacha/${draftId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the draft from UI
                if (draftElement) {
                    draftElement.remove();
                }
                // Check if there are any drafts left
                const remainingDrafts = document.querySelectorAll('[id^="draft-"]');
                if (remainingDrafts.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to convert draft');
            }
        } catch (error) {
            console.error('Error converting draft:', error);
            showAppAlert(`Error converting draft: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadDrafts();
        }
    };

    window.convertDraftToPakka = async function(draftId) {
        if (!confirm('Convert this draft directly to Pakka Bill? The draft will be deleted after conversion.')) {
            return;
        }

        try {
            // Show converting state
            const draftElement = document.getElementById(`draft-${draftId}`);
            if (draftElement) {
                draftElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Converting to Pakka Bill...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/convert/draft-to-pakka/${draftId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the draft from UI
                if (draftElement) {
                    draftElement.remove();
                }
                // Check if there are any drafts left
                const remainingDrafts = document.querySelectorAll('[id^="draft-"]');
                if (remainingDrafts.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to convert draft');
            }
        } catch (error) {
            console.error('Error converting draft:', error);
            showAppAlert(`Error converting draft: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadDrafts();
        }
    };
});