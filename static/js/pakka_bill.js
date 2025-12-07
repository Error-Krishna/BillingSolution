// static/js/pakka_bill.js
document.addEventListener('DOMContentLoaded', function() {
    
    // --- SETUP ---
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        billDateEl.value = `${yyyy}-${mm}-${dd}`;
    }
    addProductRow();
    
    // Load company details to auto-fill seller information
    loadCompanyDetails();
    
    // --- EVENT LISTENERS ---
    const addProductBtn = document.getElementById('addProduct');
    const resetBillBtn = document.getElementById('resetBill');
    const downloadPakkaBillBtn = document.getElementById('downloadPakkaBill');
    const generatePakkaBillBtn = document.getElementById('generatePakkaBill');

    if(addProductBtn) addProductBtn.addEventListener('click', addProductRow);
    if(resetBillBtn) resetBillBtn.addEventListener('click', resetBill);
    if(downloadPakkaBillBtn) downloadPakkaBillBtn.addEventListener('click', downloadPakkaBill);
    if(generatePakkaBillBtn) generatePakkaBillBtn.addEventListener('click', generatePakkaBill);

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
        if (!event || !event.target) return;
        const row = event.target.closest('.product-row');
        if (!row) return;
        
        const quantityInput = row.querySelector('.quantity');
        const rateInput = row.querySelector('.rate');
        const amountCell = row.querySelector('.amount');
        
        if (!quantityInput || !rateInput || !amountCell) return;
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = quantity * rate;
        amountCell.textContent = `₹${amount.toFixed(2)}`;
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
            document.getElementById('customerName').value = '';
            document.getElementById('customerFirmName').value = '';  // NEW
            document.getElementById('customerAddress').value = '';
            
            const productsBody = document.getElementById('productsBody');
            if (productsBody) {
                productsBody.innerHTML = '';
            }
            
            document.getElementById('terms').value = '';
            
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
                
                document.getElementById('autoFirmName').textContent = company.companyName || 'Not set';
                document.getElementById('autoGstNumber').textContent = company.gstNumber || 'Not set';
                
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
                
            } else {
                document.getElementById('autoFirmName').textContent = 'Not set up';
                document.getElementById('autoGstNumber').textContent = 'Not set up';
                document.getElementById('autoSellerAddress').textContent = 'Not set up';
                showAppAlert('Company details not found. Please complete onboarding first.', 'error');
            }
        } catch (error) {
            console.error('Error loading company details:', error);
            document.getElementById('autoFirmName').textContent = 'Error loading';
            document.getElementById('autoGstNumber').textContent = 'Error loading';
            document.getElementById('autoSellerAddress').textContent = 'Error loading';
        }
    }

    async function enrichBillDataWithCompanyDetails(billData) {
        try {
            const response = await fetch('/api/get-company-details/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const company = result.company;
                billData.companyDetails = company;
                billData.yourFirmName = company.companyName;
                billData.firmName = company.companyName;
                billData.gstNumber = company.gstNumber;
                
                // Build seller address
                const addressParts = [];
                if (company.address) addressParts.push(company.address);
                if (company.city || company.state || company.pincode) {
                    const cityStatePincode = [company.city, company.state, company.pincode]
                        .filter(part => part)
                        .join(', ');
                    if (cityStatePincode) addressParts.push(cityStatePincode);
                }
                billData.sellerAddress = addressParts.join('\n');
                
                if (company.phone) billData.sellerPhone = company.phone;
                if (company.email) billData.sellerEmail = company.email;
                if (company.bankName) billData.bankName = company.bankName;
                if (company.accountNumber) billData.accountNumber = company.accountNumber;
                if (company.ifscCode) billData.ifscCode = company.ifscCode;
                
                // Add customer firm name if available for PDF
                if (billData.customerFirmName) {
                    billData.customerCompanyName = billData.customerFirmName;
                }
            } else {
                console.warn('Company details not found for PDF generation');
            }
        } catch (error) {
            console.error('Error enriching bill data with company details:', error);
        }
        return billData;
    }

    // --- DATA SAVING FUNCTIONS ---

    function generatePakkaBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            sendDataToServer(billData);
        }
    }

    async function downloadPakkaBill() {
        const billData = collectBillData();
        if (validateBill(billData)) {
            billData.billNumber = `PAKKA-PREVIEW-${Date.now().toString().substring(8)}`;
            // Enrich with company details
            const enrichedBillData = await enrichBillDataWithCompanyDetails(billData);
            downloadPakkaBillPDF(enrichedBillData);
        }
    }

    async function downloadPakkaBillPDF(billData) {
        try {
            showAppAlert('Generating PDF...', 'info');
            
            if (!window.PDFGenerator || typeof window.PDFGenerator.generatePakkaBillPDF !== 'function') {
                throw new Error('PDF generator is not available. Please refresh the page and try again.');
            }
            
            await window.PDFGenerator.generatePakkaBillPDF(billData);
            showAppAlert('Pakka Bill PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showAppAlert(`Error generating PDF: ${error.message}`, 'error');
        }
    }

    async function sendDataToServer(billData) {
        const csrfTokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
        const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';
        
        // Get the create URL from the hidden div
        const urlsDiv = document.getElementById('urls');
        const createUrl = urlsDiv ? urlsDiv.dataset.createUrl : '/pakka-bills/api/create/';
        
        try {
            const companyResponse = await fetch('/api/get-company-details/');
            const companyResult = await companyResponse.json();
            
            if (!companyResponse.ok || companyResult.status !== 'success') {
                throw new Error('Company details not found. Please complete onboarding first.');
            }
            
            const response = await fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(billData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                let successMessage = result.message;
                if (result.bill_number) {
                    successMessage += ` Bill Number: ${result.bill_number}`;
                }
                showAppAlert(successMessage, 'success');
                
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
            customerFirmName: document.getElementById('customerFirmName')?.value || '',  // NEW FIELD
            customerAddress: document.getElementById('customerAddress')?.value || '',
            products: products,
            totalAmount: parseFloat(document.getElementById('totalAmount')?.textContent.replace('₹', '') || 0),
            terms: document.getElementById('terms')?.value || '',
            billType: 'pakka'
        };
    }
    
    function validateBill(billData) {
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

    function showAppAlert(message, type = 'success') {
        console.log(`ALERT (${type}):`, message);
        
        // Try to use existing alert system
        if (window.showAppAlert) {
            window.showAppAlert(message, type);
            return;
        }
        
        // Create a simple alert if no alert system exists
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 z-50 p-4 mb-4 rounded-lg ${
            type === 'success' ? 'bg-green-900 text-green-200 border border-green-700' :
            type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' :
            type === 'warning' ? 'bg-yellow-900 text-yellow-200 border border-yellow-700' :
            'bg-blue-900 text-blue-200 border border-blue-700'
        }`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
});