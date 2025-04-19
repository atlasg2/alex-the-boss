import { Resend } from 'resend';
import { storage } from './storage';
import { render } from '@react-email/render';
import { EmailTemplate } from './emails/EmailTemplate';

// Initialize Resend with API key
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const VERIFIED_SENDER = process.env.RESEND_VERIFIED_SENDER || 'alex@apsflooring.info';

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY environment variable is not set. Email functionality will not work.');
}

const resend = new Resend(RESEND_API_KEY);

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return false;
    }

    const from = params.from || VERIFIED_SENDER;
    
    console.log('Sending email with Resend:');
    console.log('From:', from);
    console.log('To:', params.to);
    console.log('Subject:', params.subject);

    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || ''
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('Email sent successfully with ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return false;
  }
}

/**
 * Send an email message to a contact and save it in the database
 */
export async function sendMessageToContact(
  contactId: string,
  subject: string,
  body: string,
  useHtml: boolean = false
): Promise<boolean> {
  try {
    const contact = await storage.getContact(contactId);
    if (!contact?.email) {
      console.error(`Contact ${contactId} not found or has no email`);
      return false;
    }

    // Create template with recipient name
    const emailHtml = render(EmailTemplate({
      recipientName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'there',
      message: body,
      subject: subject
    }));

    // Send the email
    const success = await sendEmail({
      to: contact.email,
      subject,
      text: body,
      html: emailHtml
    });

    if (success) {
      // Save the message in the database
      await storage.createMessage({
        contactId,
        subject,
        body,
        type: 'email',
        direction: 'outbound',
        readStatus: true
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending message to contact:', error);
    return false;
  }
}

/**
 * Send a quote notification email
 */
export async function sendQuoteEmail(
  quoteId: string,
  message: string = 'Please review the attached quote at your earliest convenience.'
): Promise<boolean> {
  try {
    const quote = await storage.getQuote(quoteId);
    if (!quote) {
      console.error(`Quote ${quoteId} not found`);
      return false;
    }

    const contact = await storage.getContact(quote.contactId);
    if (!contact?.email) {
      console.error(`Contact for quote ${quoteId} not found or has no email`);
      return false;
    }

    // Update quote status to "sent"
    await storage.updateQuote(quoteId, { status: "sent" });

    // Prepare email content
    const recipientName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'there';
    const subject = `Quote from APS Flooring - $${Number(quote.total).toLocaleString('en-US')}`;
    
    // For now, we don't attach PDFs yet, but we'll implement that later
    const emailContent = `
      ${message}

      Quote Details:
      - Total: $${Number(quote.total).toLocaleString('en-US')}
      - Valid Until: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
    `;

    // Create template
    const emailHtml = render(EmailTemplate({
      recipientName,
      message: emailContent,
      subject
    }));

    // Send the email
    const success = await sendEmail({
      to: contact.email,
      subject,
      text: emailContent,
      html: emailHtml
    });

    if (success) {
      // Record the message
      await storage.createMessage({
        contactId: contact.id,
        subject,
        body: message,
        type: 'email',
        direction: 'outbound',
        readStatus: true
      });
    }

    return success;
  } catch (error) {
    console.error('Error sending quote email:', error);
    return false;
  }
}

/**
 * Send an invoice notification email
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  message: string = 'Please find your invoice attached. Payment is due by the date specified.'
): Promise<boolean> {
  try {
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      console.error(`Invoice ${invoiceId} not found`);
      return false;
    }

    const contract = await storage.getContract(invoice.contractId);
    if (!contract) {
      console.error(`Contract for invoice ${invoiceId} not found`);
      return false;
    }

    const quote = await storage.getQuote(contract.quoteId);
    if (!quote) {
      console.error(`Quote for contract ${contract.id} not found`);
      return false;
    }

    const contact = await storage.getContact(quote.contactId);
    if (!contact?.email) {
      console.error(`Contact for quote ${quote.id} not found or has no email`);
      return false;
    }

    // Update invoice status to "sent"
    await storage.updateInvoice(invoiceId, { status: "sent" });

    // Prepare email content
    const recipientName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'there';
    const subject = `Invoice from APS Flooring - $${Number(invoice.amountDue).toLocaleString('en-US')}`;
    
    const emailContent = `
      ${message}

      Invoice Details:
      - Amount Due: $${Number(invoice.amountDue).toLocaleString('en-US')}
      - Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
    `;

    // Create template
    const emailHtml = render(EmailTemplate({
      recipientName,
      message: emailContent,
      subject
    }));

    // Send the email
    const success = await sendEmail({
      to: contact.email,
      subject,
      text: emailContent,
      html: emailHtml
    });

    if (success) {
      // Record the message
      await storage.createMessage({
        contactId: contact.id,
        subject,
        body: message,
        type: 'email',
        direction: 'outbound',
        readStatus: true
      });
    }

    return success;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}