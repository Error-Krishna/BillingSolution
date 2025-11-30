// static/js/pakka_bill.js
document.addEventListener('DOMContentLoaded', function() {
    
    // --- SETUP ---
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) {
        billDateEl.value = new Date().toISOString().split('T')[0];
    }
    addProductRow();
    
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
            // Reset seller information
            document.getElementById('firmName').value = '';
            document.getElementById('gstNumber').value = '';
            document.getElementById('billNumber').value = '';
            
            // Reset customer information
            document.getElementById('customerName').value = '';
            document.getElementById('customerGst').value = '';
            document.getElementById('sellerAddress').value = '';
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
            const response = await fetch('save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(billData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showAppAlert(`Pakka Bill generated successfully! ID: ${result.bill_id}`, 'success');
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
            billNumber: document.getElementById('billNumber')?.value || '',
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
        alert(message); 
    }
});