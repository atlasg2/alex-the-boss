import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Send, Download, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { generateQuotePDF, downloadPDF } from "@/lib/pdf-utils";
import { generatePortalAccess } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { QuoteWithDetails, ContactWithDetail } from "@/lib/types";

export default function Quotes() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPortalDialogOpen, setIsPortalDialogOpen] = useState(false);
  const [portalCredentials, setPortalCredentials] = useState<{email: string, password: string} | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDetails | null>(null);
  const { toast } = useToast();

  // Fetch quotes and include contacts for display
  const { data: quotes, isLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/quotes"],
  });

  // Fetch contacts for the form
  const { data: contacts } = useQuery<ContactWithDetail[]>({
    queryKey: ["/api/contacts"],
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  // Handle quote update (status change)
  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/quotes/${id}`, { status });
      return { id, status, response };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      
      // If quote was accepted, enable portal access for the contact
      if (data.status === "accepted") {
        const quote = quotes?.find((q: QuoteWithDetails) => q.id === data.id);
        if (quote) {
          await enablePortalAccess(quote);
        }
      }
    },
  });

  const handleEditQuote = (quote: QuoteWithDetails) => {
    setSelectedQuote(quote);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      deleteQuoteMutation.mutate(id);
    }
  };

  const handleSendQuote = async (quote: QuoteWithDetails) => {
    // Updating status to "sent"
    updateQuoteStatusMutation.mutate({ id: quote.id, status: "sent" });
  };

  // Enable portal access for a contact
  const enablePortalAccess = async (quote: QuoteWithDetails) => {
    if (!contacts) return;
    
    const contact = contacts.find((c: ContactWithDetail) => c.id === quote.contactId);
    if (!contact) return;
    
    try {
      // Generate portal credentials
      const result = await generatePortalAccess(contact.id);
      
      if (result.success) {
        // Show portal credentials dialog
        setPortalCredentials({
          email: result.email,
          password: result.password
        });
        setIsPortalDialogOpen(true);
        
        toast({
          title: "Portal access enabled",
          description: `Portal access has been enabled for ${contact.firstName} ${contact.lastName}`,
        });
      } else {
        toast({
          title: "Error enabling portal access",
          description: "There was a problem enabling portal access for this client",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Portal access error:", error);
      toast({
        title: "Error enabling portal access",
        description: "There was a problem enabling portal access for this client",
        variant: "destructive"
      });
    }
  };

  // Handle status change to accepted
  const handleAcceptQuote = (quote: QuoteWithDetails) => {
    updateQuoteStatusMutation.mutate({ id: quote.id, status: "accepted" });
  };

  const handleGeneratePDF = async (quote: QuoteWithDetails) => {
    if (!contacts) return;
    
    const contact = contacts?.find((c: ContactWithDetail) => c.id === quote.contactId);
    if (!contact) return;
    
    // Get quote items
    const quoteItemsResponse = await apiRequest("GET", `/api/quotes/${quote.id}/items`);
    const quoteItems = await quoteItemsResponse.json();
    
    const quoteWithItems = {
      ...quote,
      items: quoteItems
    };
    
    const pdfBytes = await generateQuotePDF(quoteWithItems, contact);
    downloadPDF(pdfBytes, `Quote-${quote.id.substring(0, 8)}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">Draft</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if contacts are available
  const noContacts = !contacts || contacts.length === 0;

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Quotes</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage quotes for your clients.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button disabled={noContacts}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Quote
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Create New Quote</DialogTitle>
                </DialogHeader>
                {noContacts ? (
                  <div className="p-6 text-center">
                    <p className="mb-4 text-slate-600">You need to create a contact before you can create quotes.</p>
                    <Button asChild>
                      <a href="/contacts">Go to Contacts</a>
                    </Button>
                  </div>
                ) : (
                  <QuoteForm 
                    contacts={contacts || []}
                    onClose={() => setIsAddOpen(false)} 
                    onSuccess={() => {
                      setIsAddOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Quotes</CardTitle>
          <CardDescription>
            View and manage all quotes sent to your clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading quotes...</div>
          ) : quotes && quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote: QuoteWithDetails) => {
                  const contact = contacts?.find((c: ContactWithDetail) => c.id === quote.contactId);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        Q-{quote.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                        {contact?.companyName && <div className="text-xs text-slate-500">{contact.companyName}</div>}
                      </TableCell>
                      <TableCell>${quote.total?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePDF(quote)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                          {quote.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditQuote(quote)}
                                title="Edit"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendQuote(quote)}
                                title="Send Quote"
                              >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(quote.id)}
                                disabled={deleteQuoteMutation.isPending}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </>
                          )}
                          
                          {quote.status === "sent" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAcceptQuote(quote)}
                                title="Accept Quote"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="sr-only">Accept</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuoteStatusMutation.mutate({ id: quote.id, status: "expired" })}
                                title="Decline Quote"
                              >
                                <X className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Decline</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center text-slate-500">
              No quotes found. Create your first quote to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Quote Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <QuoteForm 
              quote={selectedQuote}
              contacts={contacts || []}
              onClose={() => setIsEditOpen(false)} 
              onSuccess={() => {
                setIsEditOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Portal Credentials Dialog */}
      <Dialog open={isPortalDialogOpen} onOpenChange={setIsPortalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Client Portal Access Created</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                Portal access has been enabled for this client. They can now access their project details.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-medium text-slate-800 mb-2">Client Credentials</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Email</label>
                  <div className="flex items-center mt-1">
                    <input 
                      type="text" 
                      value={portalCredentials?.email || ''} 
                      className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500">Password</label>
                  <div className="flex items-center mt-1">
                    <input 
                      type="text" 
                      value={portalCredentials?.password || ''} 
                      className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm"
                      readOnly
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-4">
                Please provide these credentials to your client securely. They will use them to log in to the client portal.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsPortalDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
