// static/js/pakka_bills.js
document.addEventListener('DOMContentLoaded', function() {
    const pakkaBillsList = document.getElementById('pakkaBillsList');
    const refreshButton = document.getElementById('refreshPakkaBills');

    // Load pakka bills on page load
    loadPakkaBills();

    // Refresh pakka bills when button clicked
    if (refreshButton) {
        refreshButton.addEventListener('click', loadPakkaBills);
    }

    async function loadPakkaBills() {
        try {
            showLoadingState();
            const response = await fetch('/api/get-pakka-bills/');
            const result = await response.json();
            
            if (response.ok && result.pakka_bills && result.pakka_bills.length > 0) {
                displayPakkaBills(result.pakka_bills);
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading pakka bills:', error);
            showAppAlert('Error loading pakka bills: ' + error.message, 'error');
            showEmptyState();
        }
    }

    function showLoadingState() {
        if(!pakkaBillsList) return;
        pakkaBillsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-3"></div>
                <p>Loading pakka bills...</p>
            </div>
        `;
    }

    function showEmptyState() {
        if(!pakkaBillsList) return;
        pakkaBillsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-mystic" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No pakka bills found. Start by creating a new pakka bill.</p>
            </div>
        `;
    }

    function displayPakkaBills(bills) {
        if(!pakkaBillsList) return;
        
        pakkaBillsList.innerHTML = bills.map(bill => {
            // Get company name from sellerName (pakka bills) or firmName (converted kacha bills)
            const companyName = bill.sellerName || bill.firmName || 'Your Company';
            const billNumber = bill.billNumber || 'Not set';
            const customerName = bill.customerName || 'Not specified';
            const billDate = bill.billDate || 'Not set';
            const gstNumber = bill.gstNumber || 'Not set';
            const totalAmount = bill.totalAmount ? '₹' + bill.totalAmount.toFixed(2) : '₹0.00';
            
            return `
            <div class="card p-4 hover:border-green-500 transition-colors" id="pakka-bill-${bill._id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-white mb-2">${escapeHtml(companyName)}</h4>
                        <div class="space-y-1">
                            <p class="text-sm text-gray-400">
                                <span class="text-neon">Bill #:</span> ${escapeHtml(billNumber)}
                            </p>
                            <p class="text-sm text-gray-400">
                                <span class="text-neon">Customer:</span> ${escapeHtml(customerName)}
                            </p>
                            <p class="text-sm text-gray-400">
                                <span class="text-neon">Date:</span> ${escapeHtml(billDate)}
                            </p>
                            <p class="text-sm text-gray-400">
                                <span class="text-neon">GST:</span> ${escapeHtml(gstNumber)}
                            </p>
                            <p class="text-sm text-green-500 mt-2 font-medium">
                                <span class="text-neon">Total:</span> ${totalAmount}
                            </p>
                        </div>
                        ${bill.converted_from ? `
                            <div class="mt-2 pt-2 border-t border-mystic">
                                <p class="text-xs text-gray-500">
                                    <span class="text-yellow-500">Converted from:</span> ${bill.converted_from}
                                </p>
                            </div>` : ''}
                    </div>
                    <div class="flex flex-col space-y-2 ml-4">
                        <div class="flex space-x-2">
                            <button onclick="viewPakkaBill('${bill._id}')" class="px-3 py-1 bg-electric text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                                </svg>
                                View
                            </button>
                            <button onclick="downloadPakkaBill('${bill._id}')" class="px-3 py-1 bg-neon text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                                Download
                            </button>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="deletePakkaBill('${bill._id}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Attach global functions to window so the HTML onclick handlers can find them
    window.viewPakkaBill = async function(pakkaId) {
        try {
            showAppAlert('Loading bill data...', 'info');
            
            if (!window.PDFGenerator || typeof window.PDFGenerator.generatePakkaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            const response = await fetch(`/api/get-pakka-bill/${pakkaId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                await window.PDFGenerator.generatePakkaBillPDF(result.bill);
                showAppAlert('Pakka Bill PDF generated successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load bill data');
            }
        } catch (error) {
            console.error('Error viewing Pakka Bill PDF:', error);
            showAppAlert(`Error: ${error.message}`, 'error');
        }
    };

    window.downloadPakkaBill = window.viewPakkaBill; // Both do the same thing (download)
    
    window.deletePakkaBill = async function(pakkaId) {
        if (!confirm('Are you sure you want to delete this Pakka Bill? This action cannot be undone.')) {
            return;
        }
    
        try {
            // Show deleting state
            const billElement = document.getElementById(`pakka-bill-${pakkaId}`);
            if (billElement) {
                billElement.innerHTML = `
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-400">Deleting...</p>
                    </div>
                `;
            }
    
            const response = await fetch(`/api/delete-pakka-bill/${pakkaId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });
    
            const result = await response.json();
    
            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                // Remove the pakka bill from UI
                if (billElement) {
                    billElement.remove();
                }
                // Check if there are any bills left
                const remainingBills = document.querySelectorAll('[id^="pakka-bill-"]');
                if (remainingBills.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to delete pakka bill');
            }
        } catch (error) {
            console.error('Error deleting pakka bill:', error);
            showAppAlert(`Error deleting bill: ${error.message}`, 'error');
            // Reload the list to reset any UI changes
            loadPakkaBills();
        }
    };

    // Helper function to get CSRF token
    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    function showAppAlert(message, type = 'success') {
        // Use the global showAppAlert function if available, otherwise use basic alert
        if (window.showAppAlert) {
            window.showAppAlert(message, type);
        } else {
            alert(message);
        }
    }
});