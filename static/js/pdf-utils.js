// static/js/pdf-utils.js

// Wait for libraries to load
document.addEventListener('DOMContentLoaded', function() {
    // Make jsPDF available globally
    if (window.jspdf) {
        window.jsPDF = window.jspdf.jsPDF;
    }
});

class PDFGenerator {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        // Wait for jsPDF to be available
        if (!window.jsPDF) {
            setTimeout(() => this.init(), 100);
            return;
        }
        this.initialized = true;
        console.log('PDFGenerator initialized successfully');
    }

    // Generate Kacha Bill PDF
    async generateKachaBillPDF(billData) {
        await this.ensureInitialized();
        
        try {
            // Create a temporary div for PDF generation
            const pdfContent = this.createKachaBillHTML(billData);
            document.body.appendChild(pdfContent);

            // Generate PDF
            await this.generatePDFFromElement(pdfContent, `Kacha_Bill_${billData.billNumber || 'Draft'}.pdf`);
            
            // Clean up
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
            // Create a temporary div for PDF generation
            const pdfContent = this.createPakkaBillHTML(billData);
            document.body.appendChild(pdfContent);

            // Generate PDF
            await this.generatePDFFromElement(pdfContent, `Pakka_Bill_${billData.billNumber || 'Draft'}.pdf`);
            
            // Clean up
            document.body.removeChild(pdfContent);
            
            return true;
        } catch (error) {
            console.error('Error generating Pakka Bill PDF:', error);
            throw error;
        }
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

    // Create Kacha Bill HTML for PDF
    createKachaBillHTML(billData) {
        const div = document.createElement('div');
        div.id = 'temp-pdf-content';
        div.style.cssText = `
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            position: absolute;
            left: -9999px;
            top: -9999px;
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

        div.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #2c5aa0; font-size: 28px;">KACHA BILL</h1>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Provisional Bill for Deal Negotiation</p>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">From:</h3>
                    <p style="margin: 0; font-weight: bold;">${this.escapeHtml(billData.firmName || 'Your Firm Name')}</p>
                    <p style="margin: 5px 0; font-size: 14px;">Kacha Bill</p>
                    ${billData.yourOwnerName ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Owner:</strong> ${this.escapeHtml(billData.yourOwnerName)}</p>` : ''}
                </div>
                <div style="flex: 1; text-align: right;">
                    <p style="margin: 0;"><strong>Bill No:</strong> ${this.escapeHtml(billData.billNumber || 'Pending')}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDate(billData.billDate)}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
                <p style="margin: 0; font-weight: bold;">${this.escapeHtml(billData.customerFirmName || billData.customerName)}</p>
                ${billData.customerOwnerName ? `<p style="margin: 5px 0;"><strong>Owner:</strong> ${this.escapeHtml(billData.customerOwnerName)}</p>` : ''}
                <p style="margin: 5px 0; white-space: pre-line;">${this.escapeHtml(billData.customerAddress)}</p>
            </div>

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
                <tbody>
                    ${productsTable}
                </tbody>
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
            </div>
            ` : ''}

            ${billData.terms ? `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Terms & Conditions:</h4>
                <p style="margin: 0; white-space: pre-line; font-size: 12px;">${this.escapeHtml(billData.terms)}</p>
            </div>
            ` : ''}

            <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 12px;">
                    This is a provisional Kacha Bill for negotiation purposes only.<br>
                    Final Pakka Bill will be generated after deal confirmation.
                </p>
            </div>
        `;

        return div;
    }

    // Create Pakka Bill HTML for PDF
    createPakkaBillHTML(billData) {
        const div = document.createElement('div');
        div.id = 'temp-pdf-content';
        div.style.cssText = `
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            position: absolute;
            left: -9999px;
            top: -9999px;
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

        div.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #2c5aa0; font-size: 28px;">TAX INVOICE</h1>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Original for Recipient</p>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Sold By:</h3>
                    <p style="margin: 0; font-weight: bold; font-size: 16px;">${this.escapeHtml(billData.yourFirmName || billData.firmName || 'Your Firm Name')}</p>
                    ${billData.yourOwnerName ? `<p style="margin: 5px 0;"><strong>Owner:</strong> ${this.escapeHtml(billData.yourOwnerName)}</p>` : ''}
                    <p style="margin: 5px 0; white-space: pre-line;">${this.escapeHtml(billData.sellerAddress)}</p>
                    <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${this.escapeHtml(billData.gstNumber)}</p>
                    ${billData.sellerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${this.escapeHtml(billData.sellerPhone)}</p>` : ''}
                    ${billData.sellerEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${this.escapeHtml(billData.sellerEmail)}</p>` : ''}
                </div>
                <div style="flex: 1; text-align: right;">
                    <p style="margin: 0;"><strong>Invoice No:</strong> ${this.escapeHtml(billData.billNumber)}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDate(billData.billDate)}</p>
                    <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${this.escapeHtml(billData.gstNumber)}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Billed To:</h3>
                <p style="margin: 0; font-weight: bold;">${this.escapeHtml(billData.customerFirmName || billData.customerName)}</p>
                ${billData.customerOwnerName ? `<p style="margin: 5px 0;"><strong>Owner:</strong> ${this.escapeHtml(billData.customerOwnerName)}</p>` : ''}
                <p style="margin: 5px 0; white-space: pre-line;">${this.escapeHtml(billData.customerAddress)}</p>
            </div>

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
                <tbody>
                    ${productsTable}
                </tbody>
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
            </div>
            ` : ''}

            ${billData.bankName || billData.accountNumber ? `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #ffc107;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Bank Details:</h4>
                ${billData.bankName ? `<p style="margin: 5px 0;"><strong>Bank:</strong> ${this.escapeHtml(billData.bankName)}</p>` : ''}
                ${billData.accountNumber ? `<p style="margin: 5px 0;"><strong>Account No:</strong> ${this.escapeHtml(billData.accountNumber)}</p>` : ''}
                ${billData.ifscCode ? `<p style="margin: 5px 0;"><strong>IFSC Code:</strong> ${this.escapeHtml(billData.ifscCode)}</p>` : ''}
            </div>
            ` : ''}

            <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #333; width: 200px; padding-top: 10px;">
                        <p style="margin: 0; font-weight: bold;">Authorized Signatory</p>
                        <p style="margin: 5px 0; font-size: 12px;">${this.escapeHtml(billData.yourFirmName || billData.firmName || 'Your Firm Name')}</p>
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
                <p style="margin: 0; color: #666; font-size: 12px;">
                    This is a computer-generated invoice and does not require a physical signature.
                </p>
            </div>
        `;

        return div;
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