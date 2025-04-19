import * as React from 'react';
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Heading, 
  Hr, 
  Link,
  Preview
} from '@react-email/components';

interface EmailTemplateProps {
  recipientName?: string;
  message?: string;
  subject?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  recipientName = "there",
  message = "This is a test email from APS Flooring.",
  subject = "Test Email"
}) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <Heading style={headingStyle}>APS Flooring</Heading>
            <Text style={greetingStyle}>Hello {recipientName},</Text>
            <Text style={paragraphStyle}>{message}</Text>
            <Hr style={hrStyle} />
            <Text style={footerStyle}>
              This email was sent from the APS Flooring Management Portal.
              If you have any questions, please contact us at{' '}
              <Link href="mailto:info@apsflooring.info" style={linkStyle}>
                info@apsflooring.info
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
};

const headingStyle = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const greetingStyle = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '12px',
};

const paragraphStyle = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const hrStyle = {
  borderColor: '#e9e9e9',
  margin: '24px 0',
};

const footerStyle = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '22px',
};

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
};