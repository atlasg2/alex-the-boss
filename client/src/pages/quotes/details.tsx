import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { apiRequest } from '@/lib/queryClient';
import { QuoteWithDetails, ContactWithDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [contact, setContact] = useState<ContactWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchQuoteDetails(id as string);
    }
  }, [id]);
  
  const fetchQuoteDetails = async (quoteId: string) => {
    try {
      setLoading(true);
      
      // Fetch quote details
      const quoteResponse = await apiRequest('GET', `/api/quotes/${quoteId}`);
      const quoteData = await quoteResponse.json();
      
      if (!quoteData) {
        setError('Quote not found');
        setLoading(false);
        return;
      }
      
      // Fetch quote items
      const itemsResponse = await apiRequest('GET', `/api/quotes/${quoteId}/items`);
      const itemsData = await itemsResponse.json();
      
      // Fetch contact details
      const contactResponse = await apiRequest('GET', `/api/contacts/${quoteData.contactId}`);
      const contactData = await contactResponse.json();
      
      // Combine the data
      const quoteWithDetails: QuoteWithDetails = {
        ...quoteData,
        items: itemsData || []
      };
      
      setQuote(quoteWithDetails);
      setContact(contactData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quote details:', err);
      setError('Failed to load quote details');
      setLoading(false);
    }
  };
  
  const handleSendQuote = async (quoteId: string) => {
    try {
      const response = await apiRequest('POST', `/api/quotes/${quoteId}/send`, {});
      
      if (response.ok) {
        toast({
          title: 'Quote Sent',
          description: 'The quote has been sent to the client.',
          variant: 'default',
        });
        
        // Refresh quote data to update status
        fetchQuoteDetails(quoteId);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send quote');
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send quote',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const handleApproveQuote = async (quoteId: string, signature: string) => {
    try {
      const response = await apiRequest('POST', `/api/quotes/${quoteId}/approve`, {
        signature,
        date: new Date().toISOString()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: 'Quote Approved',
          description: 'The quote has been approved and a contract has been created.',
          variant: 'default',
        });
        
        // Navigate to the contract page
        if (data.contract && data.contract.id) {
          router.push(`/contracts/${data.contract.id}`);
        } else {
          // Just refresh the current page
          fetchQuoteDetails(quoteId);
        }
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve quote');
      }
    } catch (error) {
      console.error('Error approving quote:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve quote',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-600">Loading quote details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/quotes')}
          >
            Back to Quotes
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!quote || !contact) {
    return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Quote Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested quote could not be found.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/quotes')}
          >
            Back to Quotes
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quote Details</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/quotes')}
          >
            Back to Quotes
          </Button>
        </div>
        
        <QuoteForm
          quote={quote}
          contact={contact}
          onSend={handleSendQuote}
          onApprove={handleApproveQuote}
        />
        
        {/* Add PDF viewer or additional sections as needed */}
      </div>
    </div>
  );
}