// static/js/pdf-utils.js - Updated "Billed To" section

(function() {
    // Prevent re-declaration if this script is loaded twice
    if (window.PDFGenerator) {
        console.log('PDFGenerator already loaded, skipping re-initialization.');
        return;
    }

    // Wait for libraries to load
    document.addEventListener('DOMContentLoaded', function() {
        // Make jsPDF available globally if needed
        if (window.jspdf) {
            window.jsPDF = window.jspdf.jsPDF;
        }
    });

    class PDFGenerator {
        constructor() {
            this.initialized = false;
            this.companyDetails = null;
            this.init();
        }

        async init() {
            // Wait for jsPDF to be available
            if (!window.jsPDF && window.jspdf) {
                 window.jsPDF = window.jspdf.jsPDF;
            }
            
            if (!window.jsPDF) {
                setTimeout(() => this.init(), 100);
                return;
            }
            
            this.initialized = true;
            console.log('PDFGenerator initialized successfully');
        }

        async ensureInitialized() {
            if (!this.initialized) {
                await new Promise(resolve => {
                    const checkInit = () => {
                        if (this.initialized) {
                            resolve();
                        } else {
                            setTimeout(checkInit, 100);
                        }
                    };
                    checkInit();
                });
            }
        }

        // Generate Kacha Bill PDF
        async generateKachaBillPDF(billData) {
            await this.ensureInitialized();
            
            try {
                // Fetch company details before generating PDF
                await this.loadCompanyDetails();
                const billWithCompany = await this.enrichBillData(billData, 'kacha');
                const pdfContent = this.createKachaBillHTML(billWithCompany);
                document.body.appendChild(pdfContent);
                await this.generatePDFFromElement(pdfContent, `Kacha_Bill_${billData.billNumber || 'Draft'}.pdf`);
                document.body.removeChild(pdfContent);
                return true;
            } catch (error) {
                console.error('Error generating Kacha Bill PDF:', error);
                throw error;
            }
        }

        // Generate Pakka Bill PDF
        async generatePakkaBillPDF(billData) {
            await this.ensureInitialized();
            
            try {
                // Fetch company details before generating PDF
                await this.loadCompanyDetails();
                const billWithCompany = await this.enrichBillData(billData, 'pakka');
                const pdfContent = this.createPakkaBillHTML(billWithCompany);
                document.body.appendChild(pdfContent);
                await this.generatePDFFromElement(pdfContent, `Pakka_Bill_${billData.billNumber || 'Draft'}.pdf`);
                document.body.removeChild(pdfContent);
                return true;
            } catch (error) {
                console.error('Error generating Pakka Bill PDF:', error);
                throw error;
            }
        }

        // Load company details from server
        async loadCompanyDetails() {
            try {
                if (this.companyDetails) return this.companyDetails;
                
                const response = await fetch('/api/get-company-details/');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.company) {
                        this.companyDetails = data.company;
                        console.log('Company details loaded successfully');
                    } else {
                        console.warn('Company details not found:', data.message);
                    }
                } else {
                    console.warn('Failed to load company details');
                }
                return this.companyDetails;
            } catch (error) {
                console.warn('Could not load company details:', error);
                return null;
            }
        }

        // Enrich bill data with company details
        async enrichBillData(billData, billType) {
            // Try to get company details
            const companyDetails = await this.loadCompanyDetails();
            
            const enrichedData = { ...billData };
            
            // Format company address for "From" section
            if (companyDetails) {
                const addressParts = [];
                if (companyDetails.address) addressParts.push(companyDetails.address);
                
                const cityStatePincode = [];
                if (companyDetails.city) cityStatePincode.push(companyDetails.city);
                if (companyDetails.state) cityStatePincode.push(companyDetails.state);
                if (companyDetails.pincode) cityStatePincode.push(`PIN: ${companyDetails.pincode}`);
                
                if (cityStatePincode.length > 0) {
                    addressParts.push(cityStatePincode.join(', '));
                }
                
                enrichedData.companyDetails = companyDetails;
                enrichedData.companyAddress = addressParts.join('\n');
            }
            
            return enrichedData;
        }

        // Create Kacha Bill HTML for PDF
        createKachaBillHTML(billData) {
            const div = document.createElement('div');
            div.id = 'temp-pdf-content';
            div.style.cssText = `
                width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto;
                background: white; color: black; font-family: Arial, sans-serif;
                box-sizing: border-box; position: absolute; left: -9999px; top: -9999px;
            `;

            const productsTable = billData.products.map((product, index) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${this.escapeHtml(product.name)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${product.rate.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${product.amount.toFixed(2)}</td>
                </tr>
            `).join('');

            // Use company details from enrichment for "From" section
            const companyName = billData.companyDetails?.companyName || billData.firmName || 'Your Company';
            const gstNumber = billData.companyDetails?.gstNumber || '';
            const companyAddress = billData.companyAddress || '';

            // Enhanced "Billed To" section
            const billedToContent = this.createBilledToSection(billData);

            div.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <h1 style="margin: 0; color: #2c5aa0; font-size: 28px;">KACHA BILL</h1>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">Provisional Bill for Deal Negotiation</p>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">From:</h3>
                        <p style="margin: 0; font-weight: bold;">${this.escapeHtml(companyName)}</p>
                        <p style="margin: 5px 0; font-size: 14px;">Kacha Bill</p>
                        ${companyAddress ? `<p style="margin: 5px 0; font-size: 14px; white-space: pre-line;">${this.escapeHtml(companyAddress)}</p>` : ''}
                        ${gstNumber ? `<p style="margin: 5px 0; font-size: 14px;"><strong>GSTIN:</strong> ${this.escapeHtml(gstNumber)}</p>` : ''}
                        ${billData.sellerPhone ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${this.escapeHtml(billData.sellerPhone)}</p>` : ''}
                        ${billData.sellerEmail ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${this.escapeHtml(billData.sellerEmail)}</p>` : ''}
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <p style="margin: 0;"><strong>Bill No:</strong> ${this.escapeHtml(billData.billNumber || 'Pending')}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDate(billData.billDate)}</p>
                    </div>
                </div>
                ${billedToContent}
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 8%;">#</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Product/Service Description</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 12%;">Qty</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; width: 15%;">Rate (₹)</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; width: 15%;">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>${productsTable}</tbody>
                </table>
                <div style="text-align: right; margin-bottom: 30px;">
                    <div style="display: inline-block; text-align: left;">
                        <p style="margin: 5px 0; font-size: 16px;"><strong>Total Amount: ₹${billData.totalAmount.toFixed(2)}</strong></p>
                    </div>
                </div>
                ${billData.notes ? `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c5aa0;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Notes:</h4>
                    <p style="margin: 0; white-space: pre-line;">${this.escapeHtml(billData.notes)}</p>
                </div>` : ''}
                ${billData.terms ? `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Terms & Conditions:</h4>
                    <p style="margin: 0; white-space: pre-line; font-size: 12px;">${this.escapeHtml(billData.terms)}</p>
                </div>` : ''}
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">This is a provisional Kacha Bill for negotiation purposes only.<br>Final Pakka Bill will be generated after deal confirmation.</p>
                </div>
            `;
            return div;
        }

        // Create Pakka Bill HTML for PDF
        createPakkaBillHTML(billData) {
            const div = document.createElement('div');
            div.id = 'temp-pdf-content';
            div.style.cssText = `
                width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto;
                background: white; color: black; font-family: Arial, sans-serif;
                box-sizing: border-box; position: absolute; left: -9999px; top: -9999px;
            `;

            const productsTable = billData.products.map((product, index) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${this.escapeHtml(product.name)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${product.rate.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${product.amount.toFixed(2)}</td>
                </tr>
            `).join('');

            // Use company details from enrichment for "Sold By" section
            const companyName = billData.companyDetails?.companyName || billData.yourFirmName || billData.firmName || 'Your Company';
            const gstNumber = billData.companyDetails?.gstNumber || '';
            const sellerAddress = billData.sellerAddress || billData.companyAddress || '';
            const sellerPhone = billData.sellerPhone || '';
            const sellerEmail = billData.sellerEmail || '';
            const bankName = billData.bankName || '';
            const accountNumber = billData.accountNumber || '';
            const ifscCode = billData.ifscCode || '';

            // Enhanced "Billed To" section
            const billedToContent = this.createBilledToSection(billData);

            div.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <h1 style="margin: 0; color: #2c5aa0; font-size: 28px;">TAX INVOICE</h1>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">Original for Recipient</p>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Sold By:</h3>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">${this.escapeHtml(companyName)}</p>
                        ${billData.yourOwnerName ? `<p style="margin: 5px 0;"><strong>Owner:</strong> ${this.escapeHtml(billData.yourOwnerName)}</p>` : ''}
                        ${sellerAddress ? `<p style="margin: 5px 0; white-space: pre-line;">${this.escapeHtml(sellerAddress)}</p>` : ''}
                        ${gstNumber ? `<p style="margin: 5px 0;"><strong>GSTIN:</strong> ${this.escapeHtml(gstNumber)}</p>` : ''}
                        ${sellerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${this.escapeHtml(sellerPhone)}</p>` : ''}
                        ${sellerEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${this.escapeHtml(sellerEmail)}</p>` : ''}
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <p style="margin: 0;"><strong>Invoice No:</strong> ${this.escapeHtml(billData.billNumber)}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDate(billData.billDate)}</p>
                        ${gstNumber ? `<p style="margin: 5px 0;"><strong>GSTIN:</strong> ${this.escapeHtml(gstNumber)}</p>` : ''}
                    </div>
                </div>
                ${billedToContent}
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #2c5aa0; color: white;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 8%;">#</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Product/Service Description</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 12%;">Qty</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; width: 15%;">Rate (₹)</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; width: 15%;">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>${productsTable}</tbody>
                </table>
                <div style="text-align: right; margin-bottom: 30px;">
                    <div style="display: inline-block; text-align: left;">
                        <p style="margin: 5px 0; font-size: 16px;"><strong>Total Amount: ₹${billData.totalAmount.toFixed(2)}</strong></p>
                    </div>
                </div>
                ${billData.terms ? `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Terms & Conditions:</h4>
                    <p style="margin: 0; white-space: pre-line; font-size: 12px;">${this.escapeHtml(billData.terms)}</p>
                </div>` : ''}
                ${bankName || accountNumber ? `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #ffc107;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Bank Details:</h4>
                    ${bankName ? `<p style="margin: 5px 0;"><strong>Bank:</strong> ${this.escapeHtml(bankName)}</p>` : ''}
                    ${accountNumber ? `<p style="margin: 5px 0;"><strong>Account No:</strong> ${this.escapeHtml(accountNumber)}</p>` : ''}
                    ${ifscCode ? `<p style="margin: 5px 0;"><strong>IFSC Code:</strong> ${this.escapeHtml(ifscCode)}</p>` : ''}
                </div>` : ''}
                <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 10px;">
                            <p style="margin: 0; font-weight: bold;">Authorized Signatory</p>
                            <p style="margin: 5px 0; font-size: 12px;">${this.escapeHtml(companyName)}</p>
                            ${billData.yourOwnerName ? `<p style="margin: 5px 0; font-size: 12px;">${this.escapeHtml(billData.yourOwnerName)}</p>` : ''}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 10px;">
                            <p style="margin: 0; font-weight: bold;">Customer Signature</p>
                            <p style="margin: 5px 0; font-size: 12px;">${this.escapeHtml(billData.customerFirmName || billData.customerName)}</p>
                            ${billData.customerOwnerName ? `<p style="margin: 5px 0; font-size: 12px;">${this.escapeHtml(billData.customerOwnerName)}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">This is a computer-generated invoice and does not require a physical signature.</p>
                </div>
            `;
            return div;
        }

        // Create enhanced "Billed To" section
        createBilledToSection(billData) {
            // Get customer firm name (from user input) and customer name
            const customerFirmName = billData.customerFirmName || '';
            const customerName = billData.customerName || '';
            const customerAddress = billData.customerAddress || '';
            const customerOwnerName = billData.customerOwnerName || '';

            let billedToHTML = `
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
            `;

            // If we have both firm name and customer name, show both
            if (customerFirmName && customerName && customerFirmName !== customerName) {
                billedToHTML += `
                    <p style="margin: 0; font-weight: bold;">${this.escapeHtml(customerFirmName)}</p>
                    <p style="margin: 5px 0;"><strong>Contact Person:</strong> ${this.escapeHtml(customerName)}</p>
                `;
            } 
            // If only firm name is available
            else if (customerFirmName) {
                billedToHTML += `<p style="margin: 0; font-weight: bold;">${this.escapeHtml(customerFirmName)}</p>`;
            }
            // If only customer name is available
            else if (customerName) {
                billedToHTML += `<p style="margin: 0; font-weight: bold;">${this.escapeHtml(customerName)}</p>`;
            }
            // If neither is available
            else {
                billedToHTML += `<p style="margin: 0; font-weight: bold; color: #999;">Customer Name Not Provided</p>`;
            }

            // Add owner name if available
            if (customerOwnerName) {
                billedToHTML += `<p style="margin: 5px 0;"><strong>Owner:</strong> ${this.escapeHtml(customerOwnerName)}</p>`;
            }

            // Add customer address
            if (customerAddress) {
                billedToHTML += `<p style="margin: 5px 0; white-space: pre-line;">${this.escapeHtml(customerAddress)}</p>`;
            }

            billedToHTML += `</div>`;
            return billedToHTML;
        }

        // Generate PDF from HTML element
        async generatePDFFromElement(element, filename) {
            return new Promise((resolve, reject) => {
                if (!window.jsPDF) {
                    reject(new Error('jsPDF not loaded'));
                    return;
                }

                html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new window.jsPDF('p', 'mm', 'a4');
                    const imgWidth = 210;
                    const pageHeight = 295;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(filename);
                    resolve(true);
                }).catch(reject);
            });
        }

        // Utility functions
        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        formatDate(dateString) {
            if (!dateString) return 'Not specified';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Create global instance
    window.PDFGenerator = new PDFGenerator();
})();