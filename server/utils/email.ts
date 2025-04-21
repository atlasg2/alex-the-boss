import { Resend } from 'resend';

// We'll use Resend for all emails
const resend = new Resend('re_hT7xcmE4_52xWuJNjxXYDazJparJCmeUS');
const DOMAIN = 'apsflooring.info';
const FROM_EMAIL = `info@${DOMAIN}`;

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log(`Sending email from ${params.from} to ${params.to}...`);
    
    // Always send with Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    console.log('Resend response:', JSON.stringify(response));
    return true;
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

// Function to send a test email
export async function sendTestEmail(to: string): Promise<boolean> {
  const currentDate = new Date().toLocaleString();
  return sendEmail({
    to,
    from: 'info@apexflooring.com', // The flooring company email
    subject: 'Test Email from Apex Flooring',
    text: `This is a test email from Apex Flooring. Sent at: ${currentDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #112233;">Apex Flooring</h1>
        <p>This is a test email from Apex Flooring.</p>
        <p>If you're receiving this, email functionality is working correctly!</p>
        <p>Sent at: ${currentDate}</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  });
}

// Function to send a quote to a client with PDF attachment
export async function sendQuoteEmail(to: string, quoteId: string, customerName: string, quoteAmount: string, pdfData?: Uint8Array): Promise<boolean> {
  try {
    // Create a basic email first
    const emailData = {
      from: FROM_EMAIL,
      to: to,
      subject: 'Your Flooring Quote from Alex Pereira',
      text: `Dear ${customerName},\n\nThank you for your interest in Alex Pereira Flooring. Your quote (ID: ${quoteId}) for $${quoteAmount} is attached to this email.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nAlex Pereira`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #112233;">Alex Pereira Flooring</h1>
          <p>Dear ${customerName},</p>
          <p>Thank you for your interest in Alex Pereira Flooring. Your quote (ID: ${quoteId.substring(0, 8).toUpperCase()}) for $${quoteAmount} is attached to this email.</p>
          
          <p>Please review the attached PDF. If you approve this quote, please reply to this email.</p>
          
          <p>Best regards,<br>Alex Pereira</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>This is an automated message from APS Flooring. Please contact us at info@apsflooring.info.</p>
          </div>
        </div>
      `
    };

    // If PDF data is provided, add as attachment
    if (pdfData) {
      const response = await resend.emails.send({
        ...emailData,
        attachments: [
          {
            filename: `Quote-${quoteId.substring(0, 8).toUpperCase()}.pdf`,
            content: Buffer.from(pdfData).toString('base64')
          }
        ]
      });
      
      console.log('Email with PDF sent successfully:', response);
      return true;
    } else {
      // Standard email without PDF
      const response = await resend.emails.send(emailData);
      console.log('Email sent successfully (no PDF):', response);
      return true;
    }
  } catch (error) {
    console.error('Error sending quote email:', error);
    return false;
  }
}

// Function to send a quote approval confirmation email
export async function sendQuoteApprovalEmail(to: string, quoteId: string, customerName: string, contractId: string, jobId: string): Promise<boolean> {
  return sendEmail({
    to,
    from: 'info@apexflooring.com',
    subject: 'Your Flooring Quote Has Been Approved - Next Steps',
    text: `Dear ${customerName},\n\nThank you for approving your quote (ID: ${quoteId}). We're excited to get started on your flooring project!\n\nYour contract has been created and a job has been scheduled. You can track the progress of your project by logging into your client portal.\n\nOur team will contact you shortly to confirm the installation schedule and discuss any additional details.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nThe Apex Flooring Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #112233;">Apex Flooring</h1>
        <p>Dear ${customerName},</p>
        <p>Thank you for approving your quote (ID: ${quoteId.substring(0, 8).toUpperCase()}). We're excited to get started on your flooring project!</p>
        
        <div style="background-color: #f7f7f7; border-left: 4px solid #112233; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; padding: 0;"><strong>Contract #:</strong> ${contractId.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 10px 0 0; padding: 0;"><strong>Job #:</strong> ${jobId.substring(0, 8).toUpperCase()}</p>
        </div>
        
        <p>Your contract has been created and a job has been scheduled. You can track the progress of your project by logging into your client portal.</p>
        
        <p style="margin: 20px 0; text-align: center;">
          <a href="/portal/jobs/${jobId}" style="background-color: #112233; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Track Your Project
          </a>
        </p>
        
        <p>Our team will contact you shortly to confirm the installation schedule and discuss any additional details.</p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Apex Flooring Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This is an automated message from our system. Please do not reply to this email.</p>
        </div>
      </div>
    `
  });
}

// Function to send a job update notification to client
export async function sendJobUpdateEmail(to: string, jobId: string, customerName: string, status: string, message: string): Promise<boolean> {
  return sendEmail({
    to,
    from: 'info@apexflooring.com',
    subject: `Update on Your Flooring Project - ${status}`,
    text: `Dear ${customerName},\n\nWe have an update on your flooring project (Job ID: ${jobId}).\n\nStatus: ${status}\n\n${message}\n\nYou can track the progress of your project by logging into your client portal.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nThe Apex Flooring Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #112233;">Apex Flooring</h1>
        <p>Dear ${customerName},</p>
        <p>We have an update on your flooring project (Job ID: ${jobId.substring(0, 8).toUpperCase()}).</p>
        
        <div style="background-color: #f7f7f7; border-left: 4px solid #112233; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; padding: 0;"><strong>Status:</strong> ${status}</p>
          <p style="margin: 10px 0 0; padding: 0;">${message}</p>
        </div>
        
        <p style="margin: 20px 0; text-align: center;">
          <a href="/portal/jobs/${jobId}" style="background-color: #112233; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Track Your Project
          </a>
        </p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Apex Flooring Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This is an automated message from our system. Please do not reply to this email.</p>
        </div>
      </div>
    `
  });
}