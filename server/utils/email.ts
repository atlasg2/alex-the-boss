import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

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
    
    const response = await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    console.log('SendGrid response:', JSON.stringify(response));
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const errorObj = error as any;
      console.error('SendGrid error details:', JSON.stringify(errorObj.response?.body, null, 2));
    }
    return false;
  }
}

// Function to send a test email
export async function sendTestEmail(to: string): Promise<boolean> {
  const currentDate = new Date().toLocaleString();
  return sendEmail({
    to,
    from: 'nicksanford2341@gmail.com', // Using your email as the verified sender
    subject: 'Test Email from ContractorFlow',
    text: `This is a test email from ContractorFlow. Sent at: ${currentDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #4a6ee0;">ContractorFlow</h1>
        <p>This is a test email from the ContractorFlow system.</p>
        <p>If you're receiving this, email functionality is working correctly!</p>
        <p>Sent at: ${currentDate}</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  });
}