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
    document.getElementById('downloadPakkaBill').addEventListener('click', downloadPakkaBill);
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
        if (confirm('Are you sure you want to reset the bill? All customer data will be lost.')) {
            // Reset customer information only (seller info stays auto-filled)
            document.getElementById('customerName').value = '';
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
        }
    }

    // --- COMPANY DETAILS FUNCTIONS ---

    async function loadCompanyDetails() {
        try {
            const response = await fetch('/api/get-company-details/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const company = result.company;
                
                // Update the auto-filled seller information display
                document.getElementById('autoFirmName').textContent = company.companyName || 'Not set';
                document.getElementById('autoGstNumber').textContent = company.gstNumber || 'Not set';
                
                // Build address string
                const addressParts = [];
                if (company.address) addressParts.push(company.address);
                if (company.city || company.state || company.pincode) {
                    const cityStatePincode = [company.city, company.state, company.pincode]
                        .filter(part => part)
                        .join(', ');
                    if (cityStatePincode) addressParts.push(cityStatePincode);
                }
                
                document.getElementById('autoSellerAddress').textContent = 
                    addressParts.join('\n') || 'Not set';
                
                console.log('Company details loaded successfully for pakka bill');
            } else {
                // Company details not set up yet - show error message
                document.getElementById('autoFirmName').textContent = 'Not set up';
                document.getElementById('autoGstNumber').textContent = 'Not set up';
                document.getElementById('autoSellerAddress').textContent = 'Not set up';
                
                showAppAlert('Company details not found. Please complete onboarding first.', 'error');
                console.error('Company details not found for pakka bill');
            }
        } catch (error) {
            console.error('Error loading company details:', error);
            document.getElementById('autoFirmName').textContent = 'Error loading';
            document.getElementById('autoGstNumber').textContent = 'Error loading';
            document.getElementById('autoSellerAddress').textContent = 'Error loading';
            
            showAppAlert('Unable to load company details. Please complete onboarding first.', 'error');
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

    function downloadPakkaBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            // For now, show an alert. You can implement PDF generation later
            showAppAlert('Pakka Bill PDF download feature will be implemented soon!', 'info');
            
            // Future implementation:
            // generatePDF(billData);
        }
    }

    async function sendDataToServer(billData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        try {
            // First get company details to include in the bill
            const companyResponse = await fetch('/api/get-company-details/');
            const companyResult = await companyResponse.json();
            
            if (!companyResponse.ok || companyResult.status !== 'success') {
                throw new Error('Company details not found. Please complete onboarding first.');
            }
            
            // Merge company details with bill data
            const company = companyResult.company;
            billData.firmName = company.companyName;
            billData.gstNumber = company.gstNumber;
            
            // Build seller address from company details
            const addressParts = [];
            if (company.address) addressParts.push(company.address);
            if (company.city || company.state || company.pincode) {
                const cityStatePincode = [company.city, company.state, company.pincode]
                    .filter(part => part)
                    .join(', ');
                if (cityStatePincode) addressParts.push(cityStatePincode);
            }
            billData.sellerAddress = addressParts.join('\n');
            
            // Add additional company details if available
            if (company.phone) billData.sellerPhone = company.phone;
            if (company.email) billData.sellerEmail = company.email;
            if (company.bankName) billData.bankName = company.bankName;
            if (company.accountNumber) billData.accountNumber = company.accountNumber;
            if (company.ifscCode) billData.ifscCode = company.ifscCode;
            
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
                
                // Redirect to pakka bills list after short delay
                setTimeout(() => {
                    window.location.href = '/pakka-bills/';
                }, 1500);
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
            billDate: document.getElementById('billDate')?.value || '',
            customerName: document.getElementById('customerName')?.value || '',
            customerAddress: document.getElementById('customerAddress')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            terms: document.getElementById('terms')?.value || '',
            billType: 'pakka'
            // Note: firmName, gstNumber, sellerAddress will be added from company details
        };
    }
    
    function validateBill(billData) {
        // Validate customer information
        if (!billData.customerName.trim()) {
            showAppAlert('Please enter customer name.', 'error');
            document.getElementById('customerName').focus();
            return false;
        }
        
        if (!billData.customerAddress.trim()) {
            showAppAlert('Please enter customer address.', 'error');
            document.getElementById('customerAddress').focus();
            return false;
        }
        
        // Validate products
        if (billData.products.length === 0) {
            showAppAlert('Please add at least one product.', 'error');
            return false;
        }
        for (let i = 0; i < billData.products.length; i++) {
            const product = billData.products[i];
            if (!product.name.trim()) {
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