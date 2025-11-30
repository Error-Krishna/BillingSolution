// static/js/kacha_bill.js
document.addEventListener('DOMContentLoaded', function() {
    
    // --- GLOBAL VARIABLES ---
    let currentDraftId = null;
    
    // --- SETUP ---
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) {
        billDateEl.value = new Date().toISOString().split('T')[0];
    }
    
    // Check if we're editing a draft
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');
    
    if (draftId) {
        currentDraftId = draftId;
        loadDraftData(draftId);
    } else {
        addProductRow();
    }
    
    // --- EVENT LISTENERS ---
    const addProductBtn = document.getElementById('addProduct');
    const resetBillBtn = document.getElementById('resetBill');
    const saveDraftBtn = document.getElementById('saveDraft');
    const generateBillBtn = document.getElementById('generateBill');

    if (addProductBtn) addProductBtn.addEventListener('click', addProductRow);
    if (resetBillBtn) resetBillBtn.addEventListener('click', resetBill);
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);
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
    
    function populateFormWithDraft(draft) {
        if (draft.firmName) document.getElementById('firmName').value = draft.firmName;
        if (draft.billDate) document.getElementById('billDate').value = draft.billDate;
        if (draft.customerName) document.getElementById('customerName').value = draft.customerName;
        if (draft.notes) document.getElementById('notes').value = draft.notes;
        
        // Note: We intentionally DO NOT populate Bill Number here as it is not an input field
        
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
            document.getElementById('notes').value = '';
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
        
        // IMPORTANT: We do NOT collect 'billNumber' here.
        // The backend handles generation automatically.
        return {
            firmName: document.getElementById('firmName')?.value || '',
            billDate: document.getElementById('billDate')?.value || '',
            customerName: document.getElementById('customerName')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            notes: document.getElementById('notes')?.value || ''
        };
    }
    
    function validateBill(billData) {
        // Validation logic - strictly checks ONLY these fields
        if (!billData.firmName.trim()) {
            showAppAlert('Please enter firm name.', 'error');
            document.getElementById('firmName')?.focus();
            return false;
        }
        
        if (billData.products.length === 0) {
            showAppAlert('Please add at least one product.', 'error');
            return false;
        }
        
        for (let i = 0; i < billData.products.length; i++) {
            if (!billData.products[i].name.trim()) {
                showAppAlert(`Please enter a name for product ${i + 1}.`, 'error');
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
        // You can replace this with a nicer toast notification if you have one
        alert(message);
    }
});