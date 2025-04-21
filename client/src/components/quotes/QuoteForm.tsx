import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { formatCurrency, downloadPDF, generateQuotePDF } from '../../lib/pdf-utils';
import { QuoteWithDetails, ContactWithDetail } from '../../lib/types';

interface QuoteFormProps {
  quote?: QuoteWithDetails;
  contact?: ContactWithDetail;
  onSave?: (quoteData: any) => void;
  onSend?: (quoteId: string) => void;
  onApprove?: (quoteId: string, signature: string) => void;
}

export function QuoteForm({ quote, contact, onSave, onSend, onApprove }: QuoteFormProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [signature, setSignature] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleDownloadPDF = async () => {
    if (quote && contact) {
      try {
        // Generate PDF and download it
        const pdfBytes = await generateQuotePDF(quote, contact);
        downloadPDF(pdfBytes, `quote_${quote.id}.pdf`);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    }
  };
  
  const handleSendQuote = async () => {
    if (quote && onSend) {
      try {
        setSending(true);
        await onSend(quote.id);
        alert('Quote has been sent successfully!');
      } catch (error) {
        console.error('Failed to send quote:', error);
        alert('Failed to send quote. Please try again.');
      } finally {
        setSending(false);
      }
    }
  };
  
  const handleApproveQuote = async () => {
    if (!signature.trim()) {
      alert('Please provide your signature to approve the quote.');
      return;
    }
    
    if (quote && onApprove) {
      try {
        await onApprove(quote.id, signature);
        setIsApproving(false);
        setSignature('');
        alert('Quote has been approved successfully!');
      } catch (error) {
        console.error('Failed to approve quote:', error);
        alert('Failed to approve quote. Please try again.');
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {quote ? 'Quote Details' : 'New Quote'}
          {quote && (
            <div className="float-right">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={handleSendQuote}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsApproving(true)}
              >
                Approve Quote
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {quote ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <div className="font-medium">
                  {contact?.firstName} {contact?.lastName}
                  {contact?.companyName && ` (${contact.companyName})`}
                </div>
              </div>
              
              <div>
                <Label>Quote Status</Label>
                <div className="font-medium capitalize">
                  {quote.status || 'Draft'}
                </div>
              </div>
              
              <div>
                <Label>Total Amount</Label>
                <div className="font-medium">
                  {formatCurrency(quote.total)}
                </div>
              </div>
              
              <div>
                <Label>Created On</Label>
                <div className="font-medium">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Label>Quote Items</Label>
              <table className="min-w-full bg-white mt-2">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-4 text-left">Description</th>
                    <th className="py-2 px-4 text-right">Room</th>
                    <th className="py-2 px-4 text-right">Sq.Ft</th>
                    <th className="py-2 px-4 text-right">Unit Price</th>
                    <th className="py-2 px-4 text-right">Qty</th>
                    <th className="py-2 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items && quote.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-2 px-4">
                        {item.description}
                        {item.materialType && (
                          <div className="text-xs text-gray-500">
                            Material: {item.materialType}
                          </div>
                        )}
                        {item.serviceType && (
                          <div className="text-xs text-gray-500">
                            Service: {item.serviceType}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">{item.roomName || '-'}</td>
                      <td className="py-2 px-4 text-right">{item.sqft || '-'}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-4 text-right">{item.quantity}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-2 px-4 font-semibold text-right">Total:</td>
                    <td className="py-2 px-4 font-semibold text-right">{formatCurrency(quote.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Quote Approval Dialog */}
            {isApproving && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Approve Quote</h3>
                  <p className="mb-4">
                    By signing below, you agree to the terms and conditions outlined in this quote
                    and authorize Apex Flooring to proceed with the project.
                  </p>
                  
                  <div className="mb-4">
                    <Label htmlFor="signature">Signature</Label>
                    <Input 
                      id="signature" 
                      placeholder="Type your full name to sign" 
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsApproving(false)}>Cancel</Button>
                    <Button onClick={handleApproveQuote}>Approve Quote</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p>Please fill out the quote details...</p>
            {/* Quote creation form fields would go here */}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!quote && (
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Save Quote</Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}