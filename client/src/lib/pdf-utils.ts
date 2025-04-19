import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { QuoteWithDetails, ContactWithDetail, QuoteItemWithCalculation } from './types';

// Generate a PDF for a quote
export const generateQuotePDF = async (
  quote: QuoteWithDetails,
  contact: ContactWithDetail
): Promise<Uint8Array> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  
  // Get fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set some basic metadata
  pdfDoc.setTitle(`Quote for ${contact.firstName} ${contact.lastName}`);
  pdfDoc.setAuthor('Pereira Construction');
  pdfDoc.setCreator('Pereira Portal');
  
  // Draw header
  page.drawText('Pereira Construction', {
    x: 50,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92), // Primary blue color
  });
  
  page.drawText('QUOTE', {
    x: 450,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  
  // Draw company info
  page.drawText('1234 Construction Ave.', {
    x: 50,
    y: 700,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Boston, MA 02110', {
    x: 50,
    y: 685,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Phone: (555) 123-4567', {
    x: 50,
    y: 670,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Email: info@pereiraconstruction.com', {
    x: 50,
    y: 655,
    size: 10,
    font: helveticaFont,
  });
  
  // Draw quote info
  page.drawText(`Quote #: Q-${quote.id.split('-')[0]}`, {
    x: 400,
    y: 700,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, {
    x: 400,
    y: 685,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, {
    x: 400,
    y: 670,
    size: 10,
    font: helveticaFont,
  });
  
  // Draw billing info
  page.drawText('Billed To:', {
    x: 50,
    y: 620,
    size: 12,
    font: helveticaBold,
  });
  
  const contactName = `${contact.firstName} ${contact.lastName}`;
  page.drawText(contactName, {
    x: 50,
    y: 605,
    size: 10,
    font: helveticaFont,
  });
  
  if (contact.companyName) {
    page.drawText(contact.companyName, {
      x: 50,
      y: 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.email) {
    page.drawText(`Email: ${contact.email}`, {
      x: 50,
      y: contact.companyName ? 575 : 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.phone) {
    page.drawText(`Phone: ${contact.phone}`, {
      x: 50,
      y: contact.companyName && contact.email ? 560 : contact.companyName || contact.email ? 575 : 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  // Draw quote items header
  const tableTop = 520;
  page.drawText('Description', {
    x: 50,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Sq.Ft', {
    x: 300,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Unit Price', {
    x: 380,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Qty', {
    x: 450,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Total', {
    x: 500,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  // Draw a horizontal line
  page.drawLine({
    start: { x: 50, y: tableTop - 10 },
    end: { x: 550, y: tableTop - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  // Draw quote items
  let lineY = tableTop - 30;
  if (quote.items && quote.items.length > 0) {
    quote.items.forEach((item, index) => {
      page.drawText(item.description, {
        x: 50,
        y: lineY,
        size: 10,
        font: helveticaFont,
      });
      
      if (item.sqft) {
        page.drawText(item.sqft.toString(), {
          x: 300,
          y: lineY,
          size: 10,
          font: helveticaFont,
        });
      }
      
      page.drawText(`$${item.unitPrice.toFixed(2)}`, {
        x: 380,
        y: lineY,
        size: 10,
        font: helveticaFont,
      });
      
      page.drawText(item.quantity.toString(), {
        x: 450,
        y: lineY,
        size: 10,
        font: helveticaFont,
      });
      
      const total = item.quantity * item.unitPrice;
      page.drawText(`$${total.toFixed(2)}`, {
        x: 500,
        y: lineY,
        size: 10,
        font: helveticaFont,
      });
      
      lineY -= 20;
    });
  }
  
  // Draw total
  page.drawLine({
    start: { x: 380, y: lineY - 10 },
    end: { x: 550, y: lineY - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  page.drawText('Total:', {
    x: 400,
    y: lineY - 30,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText(`$${quote.total.toFixed(2)}`, {
    x: 500,
    y: lineY - 30,
    size: 12,
    font: helveticaBold,
  });
  
  // Terms and conditions
  page.drawText('Terms and Conditions:', {
    x: 50,
    y: lineY - 70,
    size: 12,
    font: helveticaBold,
  });
  
  const terms = [
    '1. This quote is valid for 30 days from the date of issue.',
    '2. A 50% deposit is required to begin work, with the balance due upon completion.',
    '3. Any additional work not specified in this quote will be subject to a separate quote.',
    '4. Changes to the scope of work may affect the final price.',
    '5. Pereira Construction is fully licensed and insured.'
  ];
  
  let termsY = lineY - 90;
  terms.forEach(term => {
    page.drawText(term, {
      x: 50,
      y: termsY,
      size: 9,
      font: helveticaFont,
    });
    termsY -= 15;
  });
  
  // Signature area
  page.drawText('Acceptance of Quote:', {
    x: 50,
    y: 150,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawLine({
    start: { x: 50, y: 120 },
    end: { x: 250, y: 120 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Signature', {
    x: 130,
    y: 105,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawLine({
    start: { x: 300, y: 120 },
    end: { x: 500, y: 120 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Date', {
    x: 390,
    y: 105,
    size: 10,
    font: helveticaFont,
  });
  
  // Footer
  page.drawText('Thank you for your business!', {
    x: 230,
    y: 70,
    size: 12,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

// Generate a PDF for an invoice
export const generateInvoicePDF = async (
  invoice: any,
  contract: any,
  quote: QuoteWithDetails,
  contact: ContactWithDetail
): Promise<Uint8Array> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  
  // Get fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set some basic metadata
  pdfDoc.setTitle(`Invoice for ${contact.firstName} ${contact.lastName}`);
  pdfDoc.setAuthor('Pereira Construction');
  pdfDoc.setCreator('Pereira Portal');
  
  // Draw header
  page.drawText('Pereira Construction', {
    x: 50,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92), // Primary blue color
  });
  
  page.drawText('INVOICE', {
    x: 450,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  
  // Company info
  page.drawText('1234 Construction Ave.', {
    x: 50,
    y: 700,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Boston, MA 02110', {
    x: 50,
    y: 685,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Phone: (555) 123-4567', {
    x: 50,
    y: 670,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Email: info@pereiraconstruction.com', {
    x: 50,
    y: 655,
    size: 10,
    font: helveticaFont,
  });
  
  // Invoice info
  page.drawText(`Invoice #: INV-${invoice.id.split('-')[0]}`, {
    x: 400,
    y: 700,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, {
    x: 400,
    y: 685,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
    x: 400,
    y: 670,
    size: 10,
    font: helveticaFont,
  });
  
  // Draw billing info
  page.drawText('Billed To:', {
    x: 50,
    y: 620,
    size: 12,
    font: helveticaBold,
  });
  
  const contactName = `${contact.firstName} ${contact.lastName}`;
  page.drawText(contactName, {
    x: 50,
    y: 605,
    size: 10,
    font: helveticaFont,
  });
  
  if (contact.companyName) {
    page.drawText(contact.companyName, {
      x: 50,
      y: 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.email) {
    page.drawText(`Email: ${contact.email}`, {
      x: 50,
      y: contact.companyName ? 575 : 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.phone) {
    page.drawText(`Phone: ${contact.phone}`, {
      x: 50,
      y: contact.companyName && contact.email ? 560 : contact.companyName || contact.email ? 575 : 590,
      size: 10,
      font: helveticaFont,
    });
  }
  
  // Draw invoice items header
  const tableTop = 520;
  page.drawText('Description', {
    x: 50,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Amount', {
    x: 500,
    y: tableTop,
    size: 12,
    font: helveticaBold,
  });
  
  // Draw a horizontal line
  page.drawLine({
    start: { x: 50, y: tableTop - 10 },
    end: { x: 550, y: tableTop - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  // Draw invoice amount
  const lineY = tableTop - 30;
  
  page.drawText(`Payment for Contract #C-${contract.id.split('-')[0]}`, {
    x: 50,
    y: lineY,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`$${invoice.amountDue.toFixed(2)}`, {
    x: 500,
    y: lineY,
    size: 10,
    font: helveticaFont,
  });
  
  // Draw total
  page.drawLine({
    start: { x: 400, y: lineY - 10 },
    end: { x: 550, y: lineY - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  page.drawText('Total Due:', {
    x: 400,
    y: lineY - 30,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText(`$${invoice.amountDue.toFixed(2)}`, {
    x: 500,
    y: lineY - 30,
    size: 12,
    font: helveticaBold,
  });
  
  // Payment instructions
  page.drawText('Payment Instructions:', {
    x: 50,
    y: lineY - 70,
    size: 12,
    font: helveticaBold,
  });
  
  const paymentInfo = [
    'Please make checks payable to: Pereira Construction',
    'Wire Transfer:',
    'Bank: First National Bank',
    'Account #: 123456789',
    'Routing #: 987654321',
    'Or pay online at: www.pereiraconstruction.com/pay'
  ];
  
  let paymentY = lineY - 90;
  paymentInfo.forEach(info => {
    page.drawText(info, {
      x: 50,
      y: paymentY,
      size: 9,
      font: helveticaFont,
    });
    paymentY -= 15;
  });
  
  // Footer
  page.drawText('Thank you for your business!', {
    x: 230,
    y: 70,
    size: 12,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

// Function to create a contract PDF
export const generateContractPDF = async (
  contract: any,
  quote: QuoteWithDetails,
  contact: ContactWithDetail
): Promise<Uint8Array> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  
  // Get fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set some basic metadata
  pdfDoc.setTitle(`Contract for ${contact.firstName} ${contact.lastName}`);
  pdfDoc.setAuthor('Pereira Construction');
  pdfDoc.setCreator('Pereira Portal');
  
  // Draw header
  page.drawText('Pereira Construction', {
    x: 50,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92), // Primary blue color
  });
  
  page.drawText('CONTRACT', {
    x: 450,
    y: 730,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  
  // Contract info
  page.drawText(`Contract #: C-${contract.id.split('-')[0]}`, {
    x: 400,
    y: 700,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText(`Date: ${new Date(contract.createdAt).toLocaleDateString()}`, {
    x: 400,
    y: 685,
    size: 10,
    font: helveticaFont,
  });
  
  // Parties information
  page.drawText('This Construction Contract (the "Contract") is entered into by and between:', {
    x: 50,
    y: 650,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Pereira Construction', {
    x: 50,
    y: 630,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('1234 Construction Ave., Boston, MA 02110', {
    x: 50,
    y: 615,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('(hereinafter referred to as "Contractor")', {
    x: 50,
    y: 600,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('And', {
    x: 50,
    y: 580,
    size: 10,
    font: helveticaFont,
  });
  
  const contactName = `${contact.firstName} ${contact.lastName}`;
  page.drawText(contactName, {
    x: 50,
    y: 560,
    size: 12,
    font: helveticaBold,
  });
  
  if (contact.companyName) {
    page.drawText(contact.companyName, {
      x: 50,
      y: 545,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.email) {
    page.drawText(`Email: ${contact.email}`, {
      x: 50,
      y: contact.companyName ? 530 : 545,
      size: 10,
      font: helveticaFont,
    });
  }
  
  if (contact.phone) {
    page.drawText(`Phone: ${contact.phone}`, {
      x: 50,
      y: contact.companyName && contact.email ? 515 : contact.companyName || contact.email ? 530 : 545,
      size: 10,
      font: helveticaFont,
    });
  }
  
  const clientInfoEndY = contact.companyName && contact.email && contact.phone ? 500 :
                          (contact.companyName && contact.email) || (contact.companyName && contact.phone) || (contact.email && contact.phone) ? 515 :
                          contact.companyName || contact.email || contact.phone ? 530 : 545;
  
  page.drawText('(hereinafter referred to as "Client")', {
    x: 50,
    y: clientInfoEndY - 15,
    size: 10,
    font: helveticaFont,
  });
  
  // Contract sections
  const sectionStartY = clientInfoEndY - 45;
  
  // Scope of Work
  page.drawText('1. Scope of Work', {
    x: 50,
    y: sectionStartY,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('The Contractor agrees to perform the following work:', {
    x: 50,
    y: sectionStartY - 20,
    size: 10,
    font: helveticaFont,
  });
  
  // Get the scope from quote items
  let scopeText = '';
  if (quote.items && quote.items.length > 0) {
    scopeText = quote.items.map(item => item.description).join(', ');
  } else {
    scopeText = 'As detailed in attached Quote #' + quote.id.split('-')[0];
  }
  
  page.drawText(scopeText, {
    x: 60,
    y: sectionStartY - 35,
    size: 10,
    font: helveticaFont,
    maxWidth: 500,
  });
  
  // Contract Price
  page.drawText('2. Contract Price', {
    x: 50,
    y: sectionStartY - 65,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText(`The Client agrees to pay the Contractor the total sum of $${quote.total.toFixed(2)} for the work described above.`, {
    x: 50,
    y: sectionStartY - 85,
    size: 10,
    font: helveticaFont,
  });
  
  // Payment Schedule
  page.drawText('3. Payment Schedule', {
    x: 50,
    y: sectionStartY - 115,
    size: 12,
    font: helveticaBold,
  });
  
  const paymentText = 
    `a. A deposit of $${(quote.total * 0.5).toFixed(2)} (50%) is due upon signing this Contract.\n` +
    `b. The remaining balance of $${(quote.total * 0.5).toFixed(2)} (50%) is due upon completion of the work.`;
  
  page.drawText(paymentText, {
    x: 50,
    y: sectionStartY - 135,
    size: 10,
    font: helveticaFont,
  });
  
  // Time of Performance
  page.drawText('4. Time of Performance', {
    x: 50,
    y: sectionStartY - 165,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('The Contractor shall commence work within 7 days after signing this Contract and shall', {
    x: 50,
    y: sectionStartY - 185,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('substantially complete the work within 30 days from commencement, subject to delays beyond', {
    x: 50,
    y: sectionStartY - 200,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('the Contractor\'s control.', {
    x: 50,
    y: sectionStartY - 215,
    size: 10,
    font: helveticaFont,
  });
  
  // Signatures
  page.drawText('IN WITNESS WHEREOF, the parties have executed this Contract:', {
    x: 50,
    y: 150,
    size: 12,
    font: helveticaBold,
  });
  
  page.drawText('Contractor:', {
    x: 50,
    y: 130,
    size: 10,
    font: helveticaBold,
  });
  
  page.drawLine({
    start: { x: 50, y: 110 },
    end: { x: 250, y: 110 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Signature', {
    x: 130,
    y: 95,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Client:', {
    x: 300,
    y: 130,
    size: 10,
    font: helveticaBold,
  });
  
  page.drawLine({
    start: { x: 300, y: 110 },
    end: { x: 500, y: 110 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Signature', {
    x: 380,
    y: 95,
    size: 10,
    font: helveticaFont,
  });
  
  page.drawText('Date: _____________________', {
    x: 300,
    y: 75,
    size: 10,
    font: helveticaFont,
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

// Helper function to download PDF
export const downloadPDF = (pdfBytes: Uint8Array, fileName: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
};
