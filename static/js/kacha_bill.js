// static/js/kacha_bill.js
document.addEventListener('DOMContentLoaded', function() {
    
    // --- GLOBAL VARIABLES ---
    let currentDraftId = null;
    let companyDetails = null; // Store company details for PDF generation
    
    // --- SETUP ---
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) {
        billDateEl.value = new Date().toISOString().split('T')[0];
    }
    
    // Check if we're editing a draft or viewing a bill
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');
    const viewId = urlParams.get('view');
    
    if (draftId) {
        currentDraftId = draftId;
        loadDraftData(draftId);
    } else if (viewId) {
        loadBillForView(viewId);
    } else {
        addProductRow();
        // Load company details for PDF generation only (not for form)
        loadCompanyDetailsForPDF();
    }
    
    // --- EVENT LISTENERS ---
    const addProductBtn = document.getElementById('addProduct');
    const resetBillBtn = document.getElementById('resetBill');
    const saveDraftBtn = document.getElementById('saveDraft');
    const downloadBillBtn = document.getElementById('downloadBill');
    const generateBillBtn = document.getElementById('generateBill');

    if (addProductBtn) addProductBtn.addEventListener('click', addProductRow);
    if (resetBillBtn) resetBillBtn.addEventListener('click', resetBill);
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);
    if (downloadBillBtn) downloadBillBtn.addEventListener('click', downloadCurrentBill);
    if (generateBillBtn) generateBillBtn.addEventListener('click', generateBill);
    
    // --- FUNCTIONS ---
    async function loadDraftData(draftId) {
        try {
            showAppAlert('Loading draft...', 'info');
            const response = await fetch(`/api/get-draft/${draftId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                populateFormWithDraft(result.draft);
                showAppAlert('Draft loaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load draft');
            }
        } catch (error) {
            console.error('Error loading draft:', error);
            showAppAlert(`Error loading draft: ${error.message}`, 'error');
            addProductRow();
        }
    }

    async function loadBillForView(billId) {
        try {
            showAppAlert('Loading bill...', 'info');
            const response = await fetch(`/api/get-kacha-bill/${billId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                populateFormWithBill(result.bill);
                setViewMode();
                showAppAlert('Bill loaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load bill');
            }
        } catch (error) {
            console.error('Error loading bill:', error);
            showAppAlert(`Error loading bill: ${error.message}`, 'error');
        }
    }
    
    async function loadCompanyDetailsForPDF() {
        try {
            const response = await fetch('/api/get-company-details/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                companyDetails = result.company;
                console.log('Company details loaded for PDF generation');
            } else {
                console.warn('Company details not found for PDF generation');
                companyDetails = null;
            }
        } catch (error) {
            console.error('Error loading company details for PDF:', error);
            companyDetails = null;
        }
    }

    async function enrichBillDataWithCompanyDetails(billData) {
        try {
            // If company details not loaded yet, load them
            if (!companyDetails) {
                await loadCompanyDetailsForPDF();
            }
            
            if (companyDetails) {
                // Add company details to bill data for PDF generation
                // DO NOT overwrite firmName from user input
                billData.companyDetails = companyDetails;
                
                // Format company address for PDF
                const addressParts = [];
                if (companyDetails.address) addressParts.push(companyDetails.address);
                
                const cityStatePincode = [];
                if (companyDetails.city) cityStatePincode.push(companyDetails.city);
                if (companyDetails.state) cityStatePincode.push(companyDetails.state);
                if (companyDetails.pincode) cityStatePincode.push(`PIN: ${companyDetails.pincode}`);
                
                if (cityStatePincode.length > 0) {
                    addressParts.push(cityStatePincode.join(', '));
                }
                
                billData.companyAddress = addressParts.join('\n');
                billData.pdfCompanyName = companyDetails.companyName || ''; // For PDF only
                billData.pdfGstNumber = companyDetails.gstNumber || ''; // For PDF only
            }
            return billData;
        } catch (error) {
            console.error('Error enriching bill data:', error);
            return billData;
        }
    }
    
    function populateFormWithDraft(draft) {
        // Only populate what user entered in draft
        if (draft.billDate) document.getElementById('billDate').value = draft.billDate;
        if (draft.customerName) document.getElementById('customerName').value = draft.customerName;
        if (draft.customerAddress) document.getElementById('customerAddress').value = draft.customerAddress;
        if (draft.notes) document.getElementById('notes').value = draft.notes;
        if (draft.terms) document.getElementById('terms').value = draft.terms;
        
        // Do NOT populate firmName from draft unless it's empty and user wants to keep it
        // This allows user to enter their own firm name
        if (draft.firmName && document.getElementById('firmName').value === '') {
            document.getElementById('firmName').value = draft.firmName;
        }
        
        const productsBody = document.getElementById('productsBody');
        if (productsBody) productsBody.innerHTML = '';
        
        if (draft.products && draft.products.length > 0) {
            draft.products.forEach(product => {
                addProductRow();
                const rows = document.querySelectorAll('.product-row');
                const newRow = rows[rows.length - 1];
                
                if (newRow) {
                    newRow.querySelector('.product-name').value = product.name || '';
                    newRow.querySelector('.quantity').value = product.quantity || 1;
                    newRow.querySelector('.rate').value = product.rate || 0;
                    calculateRowAmount({ target: newRow.querySelector('.quantity') });
                }
            });
        } else {
            addProductRow();
        }
        
        updateSerialNumbers();
        updateUIForEditMode();
    }

    function populateFormWithBill(bill) {
        // Only populate what user entered in bill
        if (bill.billDate) document.getElementById('billDate').value = bill.billDate;
        if (bill.customerName) document.getElementById('customerName').value = bill.customerName;
        if (bill.customerAddress) document.getElementById('customerAddress').value = bill.customerAddress;
        if (bill.notes) document.getElementById('notes').value = bill.notes;
        if (bill.terms) document.getElementById('terms').value = bill.terms;
        
        // Do NOT populate firmName from bill unless it's empty and user wants to keep it
        if (bill.firmName && document.getElementById('firmName').value === '') {
            document.getElementById('firmName').value = bill.firmName;
        }
        
        const productsBody = document.getElementById('productsBody');
        if (productsBody) productsBody.innerHTML = '';
        
        if (bill.products && bill.products.length > 0) {
            bill.products.forEach(product => {
                addProductRow();
                const rows = document.querySelectorAll('.product-row');
                const newRow = rows[rows.length - 1];
                
                if (newRow) {
                    newRow.querySelector('.product-name').value = product.name || '';
                    newRow.querySelector('.quantity').value = product.quantity || 1;
                    newRow.querySelector('.rate').value = product.rate || 0;
                    calculateRowAmount({ target: newRow.querySelector('.quantity') });
                }
            });
        } else {
            addProductRow();
        }
        
        updateSerialNumbers();
    }

    function setViewMode() {
        // Make all fields read-only
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Hide action buttons
        document.getElementById('resetBill').style.display = 'none';
        document.getElementById('saveDraft').style.display = 'none';
        document.getElementById('downloadBill').style.display = 'none';
        document.getElementById('generateBill').style.display = 'none';
        
        // Add download button
        const actionButtons = document.querySelector('.flex.justify-end.space-x-4');
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadCurrentBill';
        downloadBtn.className = 'btn-primary px-6 py-2 rounded-lg font-medium';
        downloadBtn.innerHTML = 'Download PDF';
        downloadBtn.onclick = function() {
            downloadCurrentBillPDF();
        };
        actionButtons.appendChild(downloadBtn);
        
        // Update page title
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = 'View Kacha Bill';
    }

    function updateUIForEditMode() {
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = 'Kacha Bill Generator (Editing Draft)';
        
        const saveDraftBtn = document.getElementById('saveDraft');
        if (saveDraftBtn) saveDraftBtn.textContent = 'Update Draft';
    }

    function addProductRow() {
        const template = document.getElementById('productRowTemplate');
        const productsBody = document.getElementById('productsBody');
        if (!template || !productsBody) return;

        const clone = template.content.cloneNode(true);
        productsBody.appendChild(clone);
        
        const newRow = productsBody.lastElementChild;
        setupRowListeners(newRow);
        updateSerialNumbers();
    }
    
    function setupRowListeners(row) {
        const quantityInput = row.querySelector('.quantity');
        const rateInput = row.querySelector('.rate');
        const deleteBtn = row.querySelector('.delete-product');
        
        if (quantityInput) quantityInput.addEventListener('input', calculateRowAmount);
        if (rateInput) rateInput.addEventListener('input', calculateRowAmount);
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (document.querySelectorAll('.product-row').length > 1) {
                    row.remove();
                    updateSerialNumbers();
                    calculateTotal();
                } else {
                    showAppAlert('Bill must have at least one product.', 'error');
                }
            });
        }
        
        // Initial calc
        if (quantityInput) calculateRowAmount({ target: quantityInput });
    }
    
    function updateSerialNumbers() {
        document.querySelectorAll('.product-row').forEach((row, index) => {
            const sn = row.querySelector('.serial-number');
            if (sn) sn.textContent = index + 1;
        });
    }
    
    function calculateRowAmount(event) {
        const row = event.target.closest('.product-row');
        if (!row) return;
        
        const qty = parseFloat(row.querySelector('.quantity').value) || 0;
        const rate = parseFloat(row.querySelector('.rate').value) || 0;
        const amount = qty * rate;
        
        row.querySelector('.amount').textContent = `₹${amount.toFixed(2)}`;
        calculateTotal();
    }
    
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.amount').forEach(cell => {
            total += parseFloat(cell.textContent.replace('₹', '')) || 0;
        });
        const totalEl = document.getElementById('totalAmount');
        if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
    }
    
    function resetBill() {
        if (confirm('Are you sure you want to reset the bill? All data will be lost.')) {
            document.getElementById('firmName').value = '';
            document.getElementById('customerName').value = '';
            document.getElementById('customerAddress').value = '';
            document.getElementById('notes').value = '';
            document.getElementById('terms').value = '';
            document.getElementById('productsBody').innerHTML = '';
            currentDraftId = null;
            
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) pageTitle.textContent = 'Kacha Bill Generator';
            const saveBtn = document.getElementById('saveDraft');
            if (saveBtn) saveBtn.textContent = 'Save Draft';
            
            addProductRow();
            calculateTotal();
        }
    }
    
    // --- DATA HANDLING ---

    function saveDraft() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            if (currentDraftId) billData.draftId = currentDraftId;
            billData.status = 'draft';
            sendDataToServer(billData);
        }
    }
    
    function generateBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            // Do NOT send draftId here; we want a fresh Kacha bill
            billData.status = 'kacha';
            sendDataToServer(billData);
        }
    }

    async function downloadCurrentBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            // Add bill number if available
            if (currentDraftId) {
                billData.billNumber = `DRAFT-${currentDraftId.substring(0, 8)}`;
            }
            // Enrich with company details for PDF only
            const enrichedBillData = await enrichBillDataWithCompanyDetails(billData);
            downloadKachaBillPDF(enrichedBillData);
        }
    }

    async function downloadCurrentBillPDF() {
        const billData = collectBillData();
        // Add bill number if available from view mode
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get('view');
        if (viewId) {
            billData.billNumber = `KACHA-${viewId.substring(0, 8)}`;
        } else if (currentDraftId) {
            billData.billNumber = `DRAFT-${currentDraftId.substring(0, 8)}`;
        }
        // Enrich with company details for PDF only
        const enrichedBillData = await enrichBillDataWithCompanyDetails(billData);
        downloadKachaBillPDF(enrichedBillData);
    }

    async function downloadKachaBillPDF(billData) {
        try {
            showAppAlert('Generating PDF...', 'info');
            
            // Check if PDFGenerator is available
            if (!window.PDFGenerator || typeof window.PDFGenerator.generateKachaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            await window.PDFGenerator.generateKachaBillPDF(billData);
            showAppAlert('Kacha Bill PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showAppAlert(`Error generating PDF: ${error.message}`, 'error');
        }
    }

    function collectBillData() {
        const products = [];
        document.querySelectorAll('.product-row').forEach(row => {
            const name = row.querySelector('.product-name').value;
            const qty = parseFloat(row.querySelector('.quantity').value) || 0;
            const rate = parseFloat(row.querySelector('.rate').value) || 0;
            
            if (name || qty > 0 || rate > 0) {
                products.push({
                    name: name,
                    quantity: qty,
                    rate: rate,
                    amount: qty * rate
                });
            }
        });
        
        // Collect ONLY user-entered data
        return {
            firmName: document.getElementById('firmName')?.value || '', // User enters this
            billDate: document.getElementById('billDate')?.value || '',
            customerName: document.getElementById('customerName')?.value || '',
            customerAddress: document.getElementById('customerAddress')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            notes: document.getElementById('notes')?.value || '',
            terms: document.getElementById('terms')?.value || ''
        };
    }
    
    function validateBill(billData) {
        // Validation logic - strictly checks ONLY these fields
        if (!billData.firmName.trim()) {
            showAppAlert('Please enter firm name.', 'error');
            document.getElementById('firmName')?.focus();
            return false;
        }
        
        if (!billData.customerName.trim()) {
            showAppAlert('Please enter customer name.', 'error');
            document.getElementById('customerName')?.focus();
            return false;
        }
        
        if (!billData.customerAddress.trim()) {
            showAppAlert('Please enter customer address.', 'error');
            document.getElementById('customerAddress')?.focus();
            return false;
        }
        
        if (billData.products.length === 0) {
            showAppAlert('Please add at least one product.', 'error');
            return false;
        }
        
        for (let i = 0; i < billData.products.length; i++) {
            const product = billData.products[i];
            if (!product.name.trim()) {
                showAppAlert(`Please enter a name for product ${i + 1}.`, 'error');
                return false;
            }
            if (product.quantity <= 0) {
                showAppAlert(`Please enter a valid quantity (greater than 0) for product "${product.name}".`, 'error');
                return false;
            }
            if (product.rate <= 0) {
                showAppAlert(`Please enter a valid rate (greater than 0) for product "${product.name}".`, 'error');
                return false;
            }
        }

        return true;
    }

    async function sendDataToServer(billData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        if (!csrfToken) {
            showAppAlert('CSRF token missing. Please refresh.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(billData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                showAppAlert(result.message, 'success');
                
                if (billData.status === 'draft') {
                    // Update current context to this draft
                    currentDraftId = result.bill_id;
                    updateUIForEditMode();
                } else if (billData.status === 'kacha') {
                    // Redirect to list after success
                    setTimeout(() => {
                        window.location.href = '/kacha-bills/';
                    }, 1000);
                }
            } else {
                throw new Error(result.message || 'Server error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showAppAlert(error.message, 'error');
        }
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