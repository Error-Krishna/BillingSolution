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
        pakkaBillsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-3"></div>
                <p>Loading pakka bills...</p>
            </div>
        `;
    }

    function showEmptyState() {
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
        pakkaBillsList.innerHTML = bills.map(bill => `
            <div class="card p-4 hover:border-green-500 transition-colors" id="pakka-bill-${bill._id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-white">${escapeHtml(bill.firmName || 'Untitled Pakka Bill')}</h4>
                        <p class="text-sm text-gray-400 mt-1">Bill #: ${escapeHtml(bill.billNumber || 'Not set')}</p>
                        <p class="text-sm text-gray-400">Customer: ${escapeHtml(bill.customerName || 'Not specified')}</p>
                        <p class="text-sm text-gray-400">Date: ${escapeHtml(bill.billDate || 'Not set')}</p>
                        <p class="text-sm text-gray-400">GST: ${escapeHtml(bill.gstNumber || 'Not set')}</p>
                        <p class="text-sm text-green-500 mt-2">Total: ${bill.totalAmount ? '₹' + bill.totalAmount.toFixed(2) : '₹0.00'}</p>
                        ${bill.converted_from ? `<p class="text-xs text-gray-500 mt-1">Converted from: ${bill.converted_from}</p>` : ''}
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="viewPakkaBill('${bill._id}')" class="px-3 py-1 bg-electric text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                            </svg>
                            View PDF
                        </button>
                        <button onclick="downloadPakkaBill('${bill._id}')" class="px-3 py-1 bg-neon text-white rounded text-sm hover:bg-opacity-90 transition flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                            Download
                        </button>
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

    window.viewPakkaBill = async function(pakkaId) {
        try {
            showAppAlert('Loading bill data...', 'info');
            
            // Check if PDFGenerator is available
            if (!window.PDFGenerator || typeof window.PDFGenerator.generatePakkaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            // Fetch the bill data
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

    window.downloadPakkaBill = async function(pakkaId) {
        try {
            showAppAlert('Loading bill data...', 'info');
            
            // Check if PDFGenerator is available
            if (!window.PDFGenerator || typeof window.PDFGenerator.generatePakkaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            // Fetch the bill data
            const response = await fetch(`/api/get-pakka-bill/${pakkaId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                await window.PDFGenerator.generatePakkaBillPDF(result.bill);
                showAppAlert('Pakka Bill PDF downloaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load bill data');
            }
        } catch (error) {
            console.error('Error downloading Pakka Bill PDF:', error);
            showAppAlert(`Error: ${error.message}`, 'error');
        }
    };
});