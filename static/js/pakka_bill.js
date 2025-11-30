// static/js/pakka_bill.js
document.addEventListener('DOMContentLoaded', function() {
    
    // --- SETUP ---
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) {
        billDateEl.value = new Date().toISOString().split('T')[0];
    }
    addProductRow();
    
    // Load company details to auto-fill seller information
    loadCompanyDetails();
    
    // --- EVENT LISTENERS ---
    document.getElementById('addProduct').addEventListener('click', addProductRow);
    document.getElementById('resetBill').addEventListener('click', resetBill);
    document.getElementById('generatePakkaBill').addEventListener('click', generatePakkaBill);

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
        calculateRowAmount({ target: quantityInput });
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
            // Reset seller information (but keep company details)
            document.getElementById('firmName').value = '';
            document.getElementById('gstNumber').value = '';
            document.getElementById('sellerAddress').value = '';
            
            // Reset customer information
            document.getElementById('customerName').value = '';
            document.getElementById('customerGst').value = '';
            document.getElementById('customerAddress').value = '';
            
            // Reset products
            const productsBody = document.getElementById('productsBody');
            if (productsBody) {
                productsBody.innerHTML = '';
            }
            
            // Reset terms
            document.getElementById('terms').value = '';
            
            // Add initial product row and reset total
            addProductRow();
            calculateTotal();
            
            // Reload company details to auto-fill again
            loadCompanyDetails();
        }
    }

    // --- COMPANY DETAILS FUNCTIONS ---

    async function loadCompanyDetails() {
        try {
            const response = await fetch('/api/get-company-details/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const company = result.company;
                
                // Auto-fill company details in the form
                if (company.companyName) {
                    document.getElementById('firmName').value = company.companyName;
                }
                
                if (company.gstNumber) {
                    document.getElementById('gstNumber').value = company.gstNumber;
                }
                
                // Build address string
                if (company.address || company.city || company.state || company.pincode) {
                    const addressParts = [];
                    if (company.address) addressParts.push(company.address);
                    if (company.city || company.state || company.pincode) {
                        const cityStatePincode = [company.city, company.state, company.pincode]
                            .filter(part => part)
                            .join(', ');
                        if (cityStatePincode) addressParts.push(cityStatePincode);
                    }
                    
                    document.getElementById('sellerAddress').value = addressParts.join('\n');
                }
                
                // Show success message if company details were auto-filled
                if (company.companyName && company.gstNumber) {
                    console.log('Company details auto-filled from onboarding data');
                }
            } else {
                // Company details not set up yet - show informational message
                console.log('Company details not set up. User needs to fill manually.');
                showAppAlert('Please set up your company details in the onboarding to auto-fill seller information.', 'info');
            }
        } catch (error) {
            console.error('Error loading company details:', error);
            showAppAlert('Unable to load company details. Please fill seller information manually.', 'warning');
        }
    }
    
    // --- DATA SAVING FUNCTIONS ---

    function generatePakkaBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            billData.status = 'pakka';
            sendDataToServer(billData);
        }
    }

    async function sendDataToServer(billData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
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
            
            if (response.ok) {
                let successMessage = result.message;
                if (result.bill_number) {
                    successMessage += ` Bill Number: ${result.bill_number}`;
                }
                showAppAlert(successMessage, 'success');
                // Optionally reset form after successful generation
                // resetBill();
            } else {
                throw new Error(result.message || 'Failed to save bill.');
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
            gstNumber: document.getElementById('gstNumber')?.value || '',
            billDate: document.getElementById('billDate')?.value || '',
            customerName: document.getElementById('customerName')?.value || '',
            customerGst: document.getElementById('customerGst')?.value || '',
            sellerAddress: document.getElementById('sellerAddress')?.value || '',
            customerAddress: document.getElementById('customerAddress')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            terms: document.getElementById('terms')?.value || '',
            billType: 'pakka'
        };
    }
    
    function validateBill(billData) {
        // Validate seller information
        if (!billData.firmName.trim()) {
            showAppAlert('Please enter firm name.', 'error');
            document.getElementById('firmName').focus();
            return false;
        }
        if (!billData.gstNumber.trim()) {
            showAppAlert('Please enter GST number.', 'error');
            document.getElementById('gstNumber').focus();
            return false;
        }
        
        // Validate customer information
        if (!billData.customerName.trim()) {
            showAppAlert('Please enter customer name.', 'error');
            document.getElementById('customerName').focus();
            return false;
        }
        if (!billData.sellerAddress.trim()) {
            showAppAlert('Please enter seller address.', 'error');
            document.getElementById('sellerAddress').focus();
            return false;
        }
        
        // Validate products
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

    // A simple replacement for alert()
    function showAppAlert(message, type = 'success') {
        console.log(`ALERT (${type}):`, message);
        
        // Use the global showAppAlert function if available, otherwise use basic alert
        if (window.showAppAlert) {
            window.showAppAlert(message, type);
        } else {
            // Fallback to basic alert with color coding
            const alertDiv = document.createElement('div');
            alertDiv.className = `p-4 mb-4 rounded-lg ${
                type === 'success' ? 'bg-green-900 text-green-200 border border-green-700' :
                type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' :
                type === 'warning' ? 'bg-yellow-900 text-yellow-200 border border-yellow-700' :
                'bg-blue-900 text-blue-200 border border-blue-700'
            }`;
            alertDiv.textContent = message;
            
            // Insert at the top of the content
            const content = document.querySelector('main');
            if (content) {
                content.insertBefore(alertDiv, content.firstChild);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 5000);
            } else {
                alert(message);
            }
        }
    }
});