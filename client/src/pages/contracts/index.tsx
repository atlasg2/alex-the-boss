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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileSignature, 
  FileText, 
  Download, 
  CheckCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateContractPDF, downloadPDF } from "@/lib/pdf-utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactWithDetail, QuoteWithDetails } from "@/lib/types";

export default function Contracts() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Fetch contracts with related data
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/contracts"],
  });

  // Fetch quotes for contract creation
  const { data: quotes } = useQuery({
    queryKey: ["/api/quotes"],
  });

  // Fetch contacts for display
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return apiRequest("POST", "/api/contracts", {
        quoteId,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsCreateOpen(false);
      setSelectedQuote("");
    },
  });

  // Update contract status mutation (e.g., signing)
  const updateContractStatusMutation = useMutation({
    mutationFn: async ({ id, status, signedUrl }: { id: string; status: string; signedUrl?: string }) => {
      const data: any = { status };
      if (signedUrl) data.signedUrl = signedUrl;
      return apiRequest("PUT", `/api/contracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsSigningOpen(false);
      setSelectedContract(null);
    },
  });

  // Handle contract creation
  const handleCreateContract = () => {
    if (selectedQuote) {
      createContractMutation.mutate(selectedQuote);
    }
  };

  // Handle contract signing
  const handleSignContract = (contract: any) => {
    setSelectedContract(contract);
    setIsSigningOpen(true);
  };

  const completeContractSigning = () => {
    if (selectedContract) {
      updateContractStatusMutation.mutate({
        id: selectedContract.id,
        status: "active",
        signedUrl: `https://example.com/signed-contracts/${selectedContract.id}.pdf`
      });
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async (contract: any) => {
    if (!contacts) return;
    
    // Get the related quote
    const quote = quotes?.find((q: QuoteWithDetails) => q.id === contract.quoteId);
    if (!quote) return;
    
    // Get the contact
    const contact = contacts.find((c: ContactWithDetail) => c.id === quote.contactId);
    if (!contact) return;
    
    // Get quote items
    const quoteItemsResponse = await apiRequest("GET", `/api/quotes/${quote.id}/items`);
    const quoteItems = await quoteItemsResponse.json();
    
    const quoteWithItems = {
      ...quote,
      items: quoteItems
    };
    
    const pdfBytes = await generateContractPDF(contract, quoteWithItems, contact);
    downloadPDF(pdfBytes, `Contract-${contract.id.substring(0, 8)}.pdf`);
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>;
      case "active":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case "complete":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Complete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Find accepted quotes without contracts
  const availableQuotes = quotes?.filter((quote: QuoteWithDetails) => {
    const hasContract = contracts?.some((contract: any) => contract.quoteId === quote.id);
    return quote.status === "accepted" && !hasContract;
  });

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Contracts</h1>
            <p className="mt-1 text-sm text-slate-500">Generate and track client contracts.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!availableQuotes?.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
                  <DialogDescription>
                    Select an accepted quote to generate a contract.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <label className="block text-sm font-medium mb-2">
                    Select Quote
                  </label>
                  <Select 
                    value={selectedQuote} 
                    onValueChange={setSelectedQuote}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an accepted quote" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuotes?.map((quote: QuoteWithDetails) => {
                        const contact = contacts?.find((c: ContactWithDetail) => c.id === quote.contactId);
                        return (
                          <SelectItem key={quote.id} value={quote.id}>
                            {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'} - ${quote.total}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateContract}
                    disabled={!selectedQuote || createContractMutation.isPending}
                  >
                    Create Contract
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            View and manage all client contracts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading contracts...</div>
          ) : contracts?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Quote Amount</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => {
                  const quote = quotes?.find((q: QuoteWithDetails) => q.id === contract.quoteId);
                  const contact = quote ? contacts?.find((c: ContactWithDetail) => c.id === quote.contactId) : null;
                  
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        C-{contract.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                        {contact?.companyName && <div className="text-xs text-slate-500">{contact.companyName}</div>}
                      </TableCell>
                      <TableCell>${quote?.total?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePDF(contract)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                          
                          {contract.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSignContract(contract)}
                              title="Sign Contract"
                            >
                              <FileSignature className="h-4 w-4" />
                              <span className="sr-only">Sign</span>
                            </Button>
                          )}
                          
                          {quote && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.location.href = `/quotes?id=${quote.id}`}
                              title="View Quote"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View Quote</span>
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
              No contracts found. Create your first contract to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-Signature Dialog */}
      <Dialog open={isSigningOpen} onOpenChange={setIsSigningOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
            <DialogDescription>
              This is a simplified e-signature demo. In a production environment, this would integrate with a service like DocuSign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border border-slate-200 rounded-md p-6 text-center">
              <p className="mb-4 text-slate-600">
                I agree to the terms and conditions outlined in the contract.
              </p>
              
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-md bg-slate-50">
                  <p className="text-slate-500 italic">Click to sign here</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-500">
                By clicking "Complete Signing", you acknowledge that this is legally binding.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSigningOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={completeContractSigning}
              disabled={updateContractStatusMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Signing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
