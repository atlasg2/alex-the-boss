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
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Download, 
  CreditCard, 
  FileText, 
  DollarSign 
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateInvoicePDF, downloadPDF } from "@/lib/pdf-utils";
import { ContactWithDetail, QuoteWithDetails } from "@/lib/types";

export default function Invoices() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Fetch contracts
  const { data: contracts } = useQuery({
    queryKey: ["/api/contracts"],
  });

  // Fetch quotes for display
  const { data: quotes } = useQuery({
    queryKey: ["/api/quotes"],
  });

  // Fetch contacts for display
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: { contractId: string; amountDue: number; dueDate: string }) => {
      return apiRequest("POST", "/api/invoices", {
        ...data,
        status: "draft"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateOpen(false);
      setSelectedContract("");
      setInvoiceAmount("");
      setInvoiceDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    },
  });

  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsPaymentOpen(false);
      setSelectedInvoice(null);
    },
  });

  // Handle invoice creation
  const handleCreateInvoice = () => {
    if (selectedContract && invoiceAmount) {
      createInvoiceMutation.mutate({
        contractId: selectedContract,
        amountDue: parseFloat(invoiceAmount),
        dueDate: invoiceDueDate
      });
    }
  };

  // Handle invoice payment
  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPaymentOpen(true);
  };

  const completePayment = () => {
    if (selectedInvoice) {
      updateInvoiceStatusMutation.mutate({
        id: selectedInvoice.id,
        status: "paid"
      });
    }
  };

  // Handle invoice sending
  const handleSendInvoice = (invoice: any) => {
    updateInvoiceStatusMutation.mutate({
      id: invoice.id,
      status: "sent"
    });
  };

  // Handle PDF generation
  const handleGeneratePDF = async (invoice: any) => {
    // Find the contract
    const contract = contracts?.find((c: any) => c.id === invoice.contractId);
    if (!contract) return;
    
    // Find the quote
    const quote = quotes?.find((q: any) => q.id === contract.quoteId);
    if (!quote) return;
    
    // Find the contact
    const contact = contacts?.find((c: any) => c.id === quote.contactId);
    if (!contact) return;
    
    const pdfBytes = await generateInvoicePDF(invoice, contract, quote, contact);
    downloadPDF(pdfBytes, `Invoice-${invoice.id.substring(0, 8)}.pdf`);
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">Draft</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Find active contracts without invoices or with room for additional invoices
  const availableContracts = contracts?.filter((contract: any) => 
    contract.status === "active"
  );

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Invoices</h1>
            <p className="mt-1 text-sm text-slate-500">Create and track client invoices.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!availableContracts?.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Create an invoice for an active contract.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Select Contract
                    </Label>
                    <Select 
                      value={selectedContract} 
                      onValueChange={setSelectedContract}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContracts?.map((contract: any) => {
                          const quote = quotes?.find((q: any) => q.id === contract.quoteId);
                          const contact = quote ? contacts?.find((c: any) => c.id === quote.contactId) : null;
                          
                          return (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'} - C-{contract.id.substring(0, 8)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="invoiceAmount">Amount</Label>
                    <div className="relative">
                      <span className="absolute top-0 bottom-0 left-0 flex items-center pl-3 text-slate-500">
                        $
                      </span>
                      <Input
                        id="invoiceAmount"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="invoiceDueDate">Due Date</Label>
                    <Input
                      id="invoiceDueDate"
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateInvoice}
                    disabled={!selectedContract || !invoiceAmount || createInvoiceMutation.isPending}
                  >
                    Create Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            View and manage all client invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading invoices...</div>
          ) : invoices?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => {
                  const contract = contracts?.find((c: any) => c.id === invoice.contractId);
                  const quote = contract ? quotes?.find((q: any) => q.id === contract.quoteId) : null;
                  const contact = quote ? contacts?.find((c: any) => c.id === quote.contactId) : null;
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        INV-{invoice.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                        {contact?.companyName && <div className="text-xs text-slate-500">{contact.companyName}</div>}
                      </TableCell>
                      <TableCell>${invoice.amountDue.toFixed(2)}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePDF(invoice)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                          
                          {invoice.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendInvoice(invoice)}
                              title="Send Invoice"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Send</span>
                            </Button>
                          )}
                          
                          {invoice.status === "sent" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePayInvoice(invoice)}
                              title="Mark as Paid"
                            >
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="sr-only">Mark Paid</span>
                            </Button>
                          )}
                          
                          {contract && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.location.href = `/contracts?id=${contract.id}`}
                              title="View Contract"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View Contract</span>
                            </Button>
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
              No invoices found. Create your first invoice to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for this invoice. In a production environment, this would integrate with a payment processor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border border-slate-200 rounded-md p-6">
              <div className="flex justify-between mb-4">
                <span className="text-slate-600">Invoice Amount:</span>
                <span className="font-semibold">${selectedInvoice?.amountDue.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-4">
                <span className="text-slate-600">Payment Method:</span>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-slate-500" />
                  <span>Credit Card (simulated)</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={completePayment}
              disabled={updateInvoiceStatusMutation.isPending}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
