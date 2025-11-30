// static/js/kacha_bills.js
document.addEventListener('DOMContentLoaded', function() {
    const kachaBillsList = document.getElementById('kachaBillsList');
    const refreshButton = document.getElementById('refreshKachaBills');

    // Load kacha bills on page load
    loadKachaBills();

    // Refresh kacha bills when button clicked
    if (refreshButton) {
        refreshButton.addEventListener('click', loadKachaBills);
    }

    async function loadKachaBills() {
        try {
            showLoadingState();
            const response = await fetch('/api/get-kacha-bills/');
            const result = await response.json();
            
            if (response.ok && result.kacha_bills && result.kacha_bills.length > 0) {
                displayKachaBills(result.kacha_bills);
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading kacha bills:', error);
            showAppAlert('Error loading kacha bills: ' + error.message, 'error');
            showEmptyState();
        }
    }

    function showLoadingState() {
        kachaBillsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-3"></div>
                <p>Loading kacha bills...</p>
            </div>
        `;
    }

    function showEmptyState() {
        kachaBillsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-mystic" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No kacha bills found. Start by creating a new kacha bill.</p>
            </div>
        `;
    }

    function displayKachaBills(bills) {
        kachaBillsList.innerHTML = bills.map(bill => `
            <div class="card p-4 hover:border-yellow-500 transition-colors" id="kacha-bill-${bill._id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-white">${escapeHtml(bill.firmName || 'Untitled Kacha Bill')}</h4>
                        <p class="text-sm text-gray-400 mt-1">Bill #: ${escapeHtml(bill.billNumber || 'Not set')}</p>
                        <p class="text-sm text-gray-400">Customer: ${escapeHtml(bill.customerName || 'Not specified')}</p>
                        <p class="text-sm text-gray-400">Date: ${escapeHtml(bill.billDate || 'Not set')}</p>
                        <p class="text-sm text-yellow-500 mt-2">Total: ${bill.totalAmount ? '₹' + bill.totalAmount.toFixed(2) : '₹0.00'}</p>
                        ${bill.converted_from ? `<p class="text-xs text-gray-500 mt-1">Converted from: ${bill.converted_from}</p>` : ''}
                    </div>
                    <div class="flex flex-col space-y-2 ml-4">
                        <div class="flex space-x-2">
                            <button onclick="convertToPakka('${bill._id}')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Convert to Pakka
                            </button>
                            <button onclick="viewKachaBill('${bill._id}')" class="px-3 py-1 bg-electric text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                                </svg>
                                View
                            </button>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="downloadKachaBillPDF('${bill._id}')" class="px-3 py-1 bg-neon text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                                Download PDF
                            </button>
                            <button onclick="deleteKachaBill('${bill._id}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                Delete
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

    window.convertToPakka = async function(kachaId) {
        if (!confirm('Are you sure you want to convert this Kacha Bill to Pakka Bill? The kacha bill will be deleted after conversion.')) {
            return;
        }
        try {
            // Show converting state
            const billElement = document.getElementById(`kacha-bill-${kachaId}`);
            if (billElement) {
                billElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Converting to Pakka Bill...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/convert/kacha-to-pakka/${kachaId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the kacha bill from UI since it's been deleted from database
                if (billElement) {
                    billElement.remove();
                }
                // Check if there are any bills left
                const remainingBills = document.querySelectorAll('[id^="kacha-bill-"]');
                if (remainingBills.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to convert to pakka bill');
            }
        } catch (error) {
            console.error('Error converting kacha bill:', error);
            showAppAlert(`Error converting bill: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadKachaBills();
        }
    };

    window.viewKachaBill = function(kachaId) {
        // Redirect to kacha bill page with view mode
        window.location.href = '/kacha-bill/?view=' + kachaId;
    };

    window.downloadKachaBillPDF = async function(kachaId) {
        try {
            showAppAlert('Loading bill data...', 'info');
            
            // Check if PDFGenerator is available
            if (!window.PDFGenerator || typeof window.PDFGenerator.generateKachaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            // Fetch the bill data
            const response = await fetch(`/api/get-kacha-bill/${kachaId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                await window.PDFGenerator.generateKachaBillPDF(result.bill);
                showAppAlert('Kacha Bill PDF downloaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load bill data');
            }
        } catch (error) {
            console.error('Error downloading Kacha Bill PDF:', error);
            showAppAlert(`Error: ${error.message}`, 'error');
        }
    };

    window.deleteKachaBill = async function(kachaId) {
        if (!confirm('Are you sure you want to delete this Kacha Bill? This action cannot be undone.')) {
            return;
        }

        try {
            // Show deleting state
            const billElement = document.getElementById(`kacha-bill-${kachaId}`);
            if (billElement) {
                billElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Deleting...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/delete-kacha-bill/${kachaId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the kacha bill from UI
                if (billElement) {
                    billElement.remove();
                }
                // Check if there are any bills left
                const remainingBills = document.querySelectorAll('[id^="kacha-bill-"]');
                if (remainingBills.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to delete kacha bill');
            }
        } catch (error) {
            console.error('Error deleting kacha bill:', error);
            showAppAlert(`Error deleting bill: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadKachaBills();
        }
    };
});