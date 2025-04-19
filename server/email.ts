import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import { Contact, Message } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the SendGrid mail service
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will not work.");
}

if (!process.env.SENDGRID_VERIFIED_SENDER) {
  console.warn("SENDGRID_VERIFIED_SENDER environment variable is not set. A verified sender email is required for SendGrid.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Always use the verified sender email for SendGrid
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_VERIFIED_SENDER || 'nicholas@atlasgrowth.ai';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set. Email not sent.');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send an email message to a contact and save it in the database
 */
export async function sendMessageToContact(
  contactId: string, 
  subject: string, 
  body: string
): Promise<Message | null> {
  // Get the contact to retrieve their email
  const contact = await storage.getContact(contactId);
  if (!contact || !contact.email) {
    console.error(`Cannot send email: Contact ${contactId} not found or has no email.`);
    return null;
  }

  // Create the message in the database first
  const newMessage = await storage.createMessage({
    contactId,
    subject,
    body,
    type: 'email',
    direction: 'outbound',
    readStatus: true
  });

  // Send the actual email via SendGrid
  const emailSent = await sendEmail({
    to: contact.email,
    from: DEFAULT_FROM_EMAIL,
    subject: subject || 'Message from Pereira Construction',
    text: body,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>${body.replace(/\n/g, '<br/>')}</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">
        This email was sent from the Pereira Construction Management Portal.
      </p>
    </div>`,
  });

  // If email sending fails, we still keep the message in our database but mark it somehow
  // For now, we're just logging the failure
  if (!emailSent) {
    console.error(`Failed to send email to ${contact.email}`);
  }

  return newMessage;
}

/**
 * Send a quote notification email
 */
export async function sendQuoteEmail(
  contactId: string,
  quoteId: string,
  subject = 'Your Quote from Pereira Construction'
): Promise<boolean> {
  const contact = await storage.getContact(contactId);
  const quote = await storage.getQuote(quoteId);
  
  if (!contact || !contact.email || !quote) {
    console.error('Cannot send quote email: Missing contact or quote data');
    return false;
  }

  const items = await storage.getQuoteItems(quoteId);
  
  // Create a simple HTML template for the quote email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your Quote from Pereira Construction</h2>
      <p>Dear ${contact.firstName},</p>
      <p>Thank you for your interest. Please find your quote details below:</p>
      
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">Quote Summary</h3>
        <p><strong>Quote ID:</strong> ${quote.id}</p>
        <p><strong>Total Amount:</strong> $${Number(quote.total).toFixed(2)}</p>
        <p><strong>Valid Until:</strong> ${new Date(quote.validUntil || '').toLocaleDateString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #eee;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${Number(item.unitPrice).toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">$${Number(quote.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p>To accept this quote or if you have any questions, please contact us directly.</p>
      <p>Thank you for choosing Pereira Construction for your project.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>This is an automated email from Pereira Construction Management Portal. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  // Store the email as a message in our system
  await storage.createMessage({
    contactId,
    subject,
    body: `Quote #${quoteId} has been sent to your email.`,
    type: 'email',
    direction: 'outbound',
    readStatus: true
  });

  // Send the actual email
  return await sendEmail({
    to: contact.email,
    from: DEFAULT_FROM_EMAIL,
    subject,
    html: htmlContent
  });
}

/**
 * Send an invoice notification email
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  subject = 'Invoice from Pereira Construction'
): Promise<boolean> {
  const invoice = await storage.getInvoice(invoiceId);
  if (!invoice) {
    console.error(`Invoice ${invoiceId} not found`);
    return false;
  }

  const contract = await storage.getContract(invoice.contractId);
  if (!contract) {
    console.error(`Contract ${invoice.contractId} not found`);
    return false;
  }

  const quote = await storage.getQuote(contract.quoteId);
  if (!quote) {
    console.error(`Quote ${contract.quoteId} not found`);
    return false;
  }

  const contact = await storage.getContact(quote.contactId);
  if (!contact || !contact.email) {
    console.error(`Contact for quote ${quote.id} not found or has no email`);
    return false;
  }

  // Create HTML content for the invoice email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Invoice from Pereira Construction</h2>
      <p>Dear ${contact.firstName},</p>
      <p>Please find your invoice details below:</p>
      
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">Invoice Summary</h3>
        <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        <p><strong>Amount Due:</strong> $${Number(invoice.amountDue).toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate || '').toLocaleDateString()}</p>
      </div>

      <p>Please make payment by the due date to ensure uninterrupted service.</p>
      <p>Thank you for choosing Pereira Construction for your project.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>This is an automated email from Pereira Construction Management Portal. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  // Store the email as a message in our system
  await storage.createMessage({
    contactId: contact.id,
    subject,
    body: `Invoice #${invoiceId} has been sent to your email.`,
    type: 'email',
    direction: 'outbound',
    readStatus: true
  });

  // Send the actual email
  return await sendEmail({
    to: contact.email,
    from: DEFAULT_FROM_EMAIL,
    subject,
    html: htmlContent
  });
}