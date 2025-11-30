// kacha_bill.js - Update the entire file
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
        // We're editing a draft - load it and store the ID
        currentDraftId = draftId;
        loadDraftData(draftId);
    } else {
        // New bill - add initial product row
        addProductRow();
    }
    
    // --- EVENT LISTENERS ---
    document.getElementById('addProduct').addEventListener('click', addProductRow);
    document.getElementById('resetBill').addEventListener('click', resetBill);
    document.getElementById('saveDraft').addEventListener('click', saveDraft);
    document.getElementById('generateBill').addEventListener('click', generateBill);
    
    // --- DRAFT LOADING FUNCTION ---
    async function loadDraftData(draftId) {
        try {
            showAppAlert('Loading draft...', 'info');
            
            const response = await fetch(`/api/get-draft/${draftId}/`);
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const draft = result.draft;
                populateFormWithDraft(draft);
                showAppAlert('Draft loaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to load draft');
            }
        } catch (error) {
            console.error('Error loading draft:', error);
            showAppAlert(`Error loading draft: ${error.message}`, 'error');
            // Fall back to empty form
            addProductRow();
        }
    }
    
    
    function populateFormWithDraft(draft) {
        // Fill basic form fields
        if (draft.firmName) {
            document.getElementById('firmName').value = draft.firmName;
        }
        if (draft.billDate) {
            document.getElementById('billDate').value = draft.billDate;
        }
        if (draft.billNumber) {
            document.getElementById('billNumber').value = draft.billNumber;
        }
        if (draft.customerName) {
            document.getElementById('customerName').value = draft.customerName;
        }
        if (draft.notes) {
            document.getElementById('notes').value = draft.notes;
        }
        
        // Clear existing products and add draft products
        const productsBody = document.getElementById('productsBody');
        if (productsBody) {
            productsBody.innerHTML = '';
        }
        
        // Add products from draft
        if (draft.products && draft.products.length > 0) {
            draft.products.forEach((product, index) => {
                addProductRow();
                
                // Get the newly added row
                const rows = document.querySelectorAll('.product-row');
                const newRow = rows[rows.length - 1];
                
                // Fill product data
                const productNameInput = newRow.querySelector('.product-name');
                const quantityInput = newRow.querySelector('.quantity');
                const rateInput = newRow.querySelector('.rate');
                
                if (productNameInput && product.name) {
                    productNameInput.value = product.name;
                }
                if (quantityInput && product.quantity) {
                    quantityInput.value = product.quantity;
                }
                if (rateInput && product.rate) {
                    rateInput.value = product.rate;
                }
                
                // Calculate amount for this row
                calculateRowAmount({ target: quantityInput });
            });
        } else {
            // No products in draft - add one empty row
            addProductRow();
        }
        
        // Update serial numbers
        updateSerialNumbers();
        
        // Update page title to indicate we're editing
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Kacha Bill Generator (Editing Draft)';
        }
        
        // Update button text to show we're updating
        const saveDraftBtn = document.getElementById('saveDraft');
        if (saveDraftBtn) {
            saveDraftBtn.textContent = 'Update Draft';
        }
    }

    // --- CORE FUNCTIONS ---
    function addProductRow() {
        const template = document.getElementById('productRowTemplate');
        if (!template) return;
        
        const clone = template.content.cloneNode(true);
        const productsBody = document.getElementById('productsBody');
        if (!productsBody) return;

        productsBody.appendChild(clone);
        updateSerialNumbers();
        
        const newRow = productsBody.lastElementChild;
        
        // Add event listeners to the new row
        const quantityInput = newRow.querySelector('.quantity');
        const rateInput = newRow.querySelector('.rate');
        const deleteBtn = newRow.querySelector('.delete-product');
        
        if (quantityInput) {
            quantityInput.addEventListener('input', calculateRowAmount);
        }
        if (rateInput) {
            rateInput.addEventListener('input', calculateRowAmount);
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (document.querySelectorAll('.product-row').length > 1) {
                    newRow.remove();
                    updateSerialNumbers();
                    calculateTotal();
                } else {
                    showAppAlert('Bill must have at least one product.', 'error');
                }
            });
        }
        
        // Calculate initial amount for the new row
        if (quantityInput) {
            calculateRowAmount({ target: quantityInput });
        }
    }
    
    function updateSerialNumbers() {
        const rows = document.querySelectorAll('.product-row');
        rows.forEach((row, index) => {
            const serialNumber = row.querySelector('.serial-number');
            if (serialNumber) {
                serialNumber.textContent = index + 1;
            }
        });
    }
    
    function calculateRowAmount(event) {
        const row = event.target.closest('.product-row');
        if (!row) return;
        
        const quantityInput = row.querySelector('.quantity');
        const rateInput = row.querySelector('.rate');
        const amountCell = row.querySelector('.amount');
        
        if (!quantityInput || !rateInput || !amountCell) return;
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        amountCell.textContent = `₹${(quantity * rate).toFixed(2)}`;
        calculateTotal();
    }
    
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.amount').forEach(cell => {
            const amountText = cell.textContent.replace('₹', '');
            total += parseFloat(amountText) || 0;
        });
        const totalAmountEl = document.getElementById('totalAmount');
        if (totalAmountEl) {
            totalAmountEl.textContent = `₹${total.toFixed(2)}`;
        }
    }
    
    function resetBill() {
        if (confirm('Are you sure you want to reset the bill? All data will be lost.')) {
            document.getElementById('firmName').value = '';
            document.getElementById('billNumber').value = '';
            document.getElementById('customerName').value = '';
            document.getElementById('notes').value = '';
            
            const productsBody = document.getElementById('productsBody');
            if (productsBody) {
                productsBody.innerHTML = '';
            }
            
            // Reset draft tracking
            currentDraftId = null;
            
            // Reset UI
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = 'Kacha Bill Generator';
            }
            
            const saveDraftBtn = document.getElementById('saveDraft');
            if (saveDraftBtn) {
                saveDraftBtn.textContent = 'Save Draft';
            }
            
            addProductRow();
            calculateTotal();
        }
    }
    
    // --- DATA SAVING FUNCTIONS ---

    function saveDraft() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            // Include draftId if we're editing an existing draft
            if (currentDraftId) {
                billData.draftId = currentDraftId;
            }
            billData.status = 'draft';
            sendDataToServer(billData);
        }
    }
    
    function generateBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            // When generating a bill from a draft, we don't include draftId
            // This will create a new kacha bill and leave the draft as is
            billData.status = 'kacha';
            sendDataToServer(billData);
        }
    }

    async function sendDataToServer(billData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        
        if (!csrfToken) {
            showAppAlert('CSRF token not found. Please refresh the page.', 'error');
            return;
        }
        
        try {
            console.log('Sending data:', billData);
            
            const response = await fetch('/api/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(billData)
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                
                if (response.ok) {
                    let successMessage = result.message;
                    
                    if (result.updated) {
                        // Draft was updated
                        showAppAlert(successMessage, 'success');
                    } else {
                        // New document was created
                        if (billData.status === 'draft') {
                            // Store the new draft ID for future updates
                            currentDraftId = result.bill_id;
                            // Update UI to show we're now editing
                            const pageTitle = document.querySelector('.page-title');
                            if (pageTitle) {
                                pageTitle.textContent = 'Kacha Bill Generator (Editing Draft)';
                            }
                            const saveDraftBtn = document.getElementById('saveDraft');
                            if (saveDraftBtn) {
                                saveDraftBtn.textContent = 'Update Draft';
                            }
                        }
                        showAppAlert(successMessage, 'success');
                    }
                } else {
                    throw new Error(result.message || `Server error: ${response.status}`);
                }
            } else {
                // Handle non-JSON response (HTML error page)
                const text = await response.text();
                console.error('HTML response received:', text.substring(0, 500));
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving bill:', error);
            showAppAlert(`Error: ${error.message}`, 'error');
        }
    }
    
    function collectBillData() {
        const products = [];
        document.querySelectorAll('.product-row').forEach(row => {
            const productNameInput = row.querySelector('.product-name');
            const quantityInput = row.querySelector('.quantity');
            const rateInput = row.querySelector('.rate');
            
            if (productNameInput && quantityInput && rateInput) {
                const productName = productNameInput.value;
                const quantity = parseFloat(quantityInput.value) || 0;
                const rate = parseFloat(rateInput.value) || 0;
                
                if (productName || quantity > 0 || rate > 0) {
                    products.push({
                        name: productName,
                        quantity: quantity,
                        rate: rate,
                        amount: quantity * rate
                    });
                }
            }
        });
        
        return {
            firmName: document.getElementById('firmName')?.value || '',
            billDate: document.getElementById('billDate')?.value || '',
            billNumber: document.getElementById('billNumber')?.value || '',
            customerName: document.getElementById('customerName')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            notes: document.getElementById('notes')?.value || ''
        };
    }
    
    function validateBill(billData) {
        if (!billData.firmName.trim()) {
            showAppAlert('Please enter firm name.', 'error');
            document.getElementById('firmName').focus();
            return false;
        }
        if (!billData.billNumber.trim()) {
            showAppAlert('Please enter bill number.', 'error');
            document.getElementById('billNumber').focus();
            return false;
        }
        if (billData.products.length === 0) {
            showAppAlert('Please add at least one product.', 'error');
            return false;
        }
        for (let i = 0; i < billData.products.length; i++) {
            if (!billData.products[i].name.trim()) {
                showAppAlert(`Please enter a name for product ${i + 1}.`, 'error');
                const productRows = document.querySelectorAll('.product-row');
                if (productRows[i]) {
                    const productNameInput = productRows[i].querySelector('.product-name');
                    if (productNameInput) {
                        productNameInput.focus();
                    }
                }
                return false;
            }
        }
        return true;
    }

    function showAppAlert(message, type = 'success') {
        console.log(`ALERT (${type}):`, message);
        alert(message); 
    }
});