import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileWithDetails as File, InvoiceWithDetails as Invoice, 
  ContractWithDetails as Contract, QuoteWithDetails as Quote } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PortalDocumentViewerProps {
  document: File | Contract | Quote | Invoice;
  documentType: 'file' | 'contract' | 'quote' | 'invoice';
  isOpen: boolean;
  onClose: () => void;
}

export function PortalDocumentViewer({ 
  document, 
  documentType, 
  isOpen, 
  onClose 
}: PortalDocumentViewerProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<string | undefined>(
    'status' in document ? document.status : undefined
  );
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && 'status' in document) {
      setDocumentStatus(document.status);
    }
  }, [isOpen, document]);

  const getDocumentUrl = () => {
    if (documentType === 'file') {
      return (document as File).url;
    } else if (documentType === 'contract') {
      return (document as Contract).signedUrl;
    } else {
      // For quotes and invoices, we'd typically generate a PDF
      // but for this example we'll just show a placeholder
      return '#';
    }
  };

  const getDocumentTitle = () => {
    if (documentType === 'file') {
      return (document as File).label || (document as File).filename;
    } else if (documentType === 'contract') {
      return 'Service Contract';
    } else if (documentType === 'quote') {
      return 'Project Quote';
    } else {
      return `Invoice #${document.id.substring(0, 8)}`;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-slate-100 text-slate-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
      case 'accepted':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    if (['approved', 'accepted', 'paid'].includes(statusLower)) {
      return <CheckCircle2 className="h-4 w-4 mr-1" />;
    } else if (['rejected', 'declined'].includes(statusLower)) {
      return <XCircle className="h-4 w-4 mr-1" />;
    } else if (['pending', 'sent'].includes(statusLower)) {
      return <AlertTriangle className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const handleApprove = async () => {
    if (!['contract', 'quote', 'invoice'].includes(documentType)) {
      return; // Only contracts, quotes, and invoices can be approved
    }

    try {
      setIsApproving(true);
      
      // Update status based on document type
      const newStatus = documentType === 'quote' ? 'accepted' : 
                       documentType === 'contract' ? 'approved' : 'paid';
      
      // Make API request to update status
      const endpoint = `/api/${documentType}s/${document.id}`;
      const response = await apiRequest('PUT', endpoint, { status: newStatus });
      const updatedDoc = await response.json();
      
      // Update local state
      setDocumentStatus(newStatus);
      
      toast({
        title: 'Document Approved',
        description: `The ${documentType} has been approved successfully.`,
        duration: 5000,
      });

      // Send a WebSocket message (handled by our WebSocket provider)
      
    } catch (error) {
      console.error('Error approving document:', error);
      toast({
        title: 'Approval Failed',
        description: `There was an error approving the ${documentType}.`,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!['contract', 'quote', 'invoice'].includes(documentType)) {
      return; // Only contracts, quotes, and invoices can be rejected
    }

    try {
      setIsRejecting(true);
      
      // Update status based on document type
      const newStatus = documentType === 'quote' ? 'declined' : 
                       documentType === 'contract' ? 'rejected' : 'cancelled';
      
      // Make API request to update status
      const endpoint = `/api/${documentType}s/${document.id}`;
      const response = await apiRequest('PUT', endpoint, { status: newStatus });
      const updatedDoc = await response.json();
      
      // Update local state
      setDocumentStatus(newStatus);
      
      toast({
        title: 'Document Rejected',
        description: `The ${documentType} has been rejected.`,
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: 'Rejection Failed',
        description: `There was an error rejecting the ${documentType}.`,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const isActionable = () => {
    if (documentType === 'file') return false;
    
    const status = documentStatus?.toLowerCase();
    return status === 'pending' || status === 'sent' || !status;
  };

  const embedDocument = () => {
    const url = getDocumentUrl();
    if (url === '#') {
      // Placeholder for documents without a URL
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-md">
          <FileText className="h-16 w-16 text-slate-400 mb-4" />
          <p className="text-slate-500">Document preview not available</p>
        </div>
      );
    }
    
    // Check file type
    if (url.endsWith('.pdf')) {
      return (
        <iframe 
          src={`${url}#toolbar=0&navpanes=0`}
          className="w-full h-96 rounded-md border border-slate-200"
          title={getDocumentTitle()}
        />
      );
    } else if (/\.(jpe?g|png|gif|webp)$/i.test(url)) {
      return (
        <div className="flex justify-center">
          <img 
            src={url} 
            alt={getDocumentTitle()} 
            className="max-h-96 max-w-full object-contain rounded-md"
          />
        </div>
      );
    } else {
      // Generic file viewer
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-md">
          <FileText className="h-16 w-16 text-slate-400 mb-4" />
          <p className="text-slate-500">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open file in new window
            </a>
          </p>
        </div>
      );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getDocumentTitle()}</DialogTitle>
            {documentStatus && (
              <Badge variant="outline" className={`${getStatusColor(documentStatus)} flex items-center`}>
                {getStatusIcon(documentStatus)}
                <span>{documentStatus}</span>
              </Badge>
            )}
          </div>
          <DialogDescription>
            {documentType === 'file' 
              ? 'View project file' 
              : `Review and ${isActionable() ? 'approve or reject' : 'view'} this document`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          {embedDocument()}
        </div>
        
        <DialogFooter className="gap-2">
          {isActionable() && (
            <>
              <Button
                variant="outline" 
                onClick={handleReject}
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}