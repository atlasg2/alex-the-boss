import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, quoteApi } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteItemForm } from "./QuoteItemForm";
import { Separator } from "@/components/ui/separator";
import { ContactWithDetail, QuoteWithDetails, QuoteItemWithCalculation } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Download, Send, Check } from "lucide-react";
import { Label } from "../ui/label";
import { formatCurrency, downloadPDF, generateQuotePDF } from '../../lib/pdf-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Form schema based on the quote model
const quoteSchema = z.object({
  contactId: z.string().min(1, "Client is required"),
  validUntil: z.string().optional(),
  status: z.string().default("draft"),
  total: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val) || 0), // Convert string to number with fallback
    z.undefined().transform(() => 0) // Set undefined to 0
  ]),
});

// Props for the original form component
interface QuoteFormProps {
  quote?: QuoteWithDetails;
  contacts: ContactWithDetail[];
  onClose: () => void;
  onSuccess: () => void;
}

// Props for viewing an existing quote
interface QuoteViewProps {
  quote: QuoteWithDetails;
  contact: ContactWithDetail;
  onSend?: (quoteId: string) => void;
  onApprove?: (quoteId: string, signature: string, name?: string) => void;
}

// Combined props type
type CombinedProps = QuoteFormProps | QuoteViewProps;

// Type guard to check if props are for viewing
function isViewProps(props: CombinedProps): props is QuoteViewProps {
  return 'contact' in props && !!props.contact && 'quote' in props && !!props.quote;
}

export function QuoteForm(props: CombinedProps) {
  // If this is a view of an existing quote with a contact, render the view mode
  if (isViewProps(props)) {
    return <QuoteViewer {...props} />;
  }
  
  // Otherwise, render the edit form
  return <QuoteEditor {...props} />;
}

// The original quote form editor component
function QuoteEditor({ quote, contacts, onClose, onSuccess }: QuoteFormProps) {
  const [quoteItems, setQuoteItems] = useState<QuoteItemWithCalculation[]>([]);
  const [total, setTotal] = useState(0);

  // If editing, fetch quote items
  const { data: fetchedItems } = useQuery({
    queryKey: [quote ? `/api/quotes/${quote.id}/items` : null],
    enabled: !!quote,
  });

  // Initialize the form with default values or existing quote data
  const form = useForm<z.infer<typeof quoteSchema>>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      contactId: quote?.contactId || "",
      validUntil: quote?.validUntil 
        ? new Date(quote.validUntil).toISOString().slice(0, 10) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: quote?.status || "draft",
      total: quote?.total || 0,
    },
  });

  // Update quote items when fetched
  useEffect(() => {
    if (fetchedItems && Array.isArray(fetchedItems)) {
      setQuoteItems(fetchedItems);
      calculateTotal(fetchedItems);
    }
  }, [fetchedItems]);

  // Calculate total whenever quote items change
  useEffect(() => {
    calculateTotal(quoteItems);
  }, [quoteItems]);

  // Calculate the total amount based on the quote items
  const calculateTotal = (items: QuoteItemWithCalculation[]) => {
    const sum = items.reduce((acc, item) => {
      const itemTotal = (item.unitPrice * item.quantity);
      return acc + itemTotal;
    }, 0);
    setTotal(sum);
    form.setValue("total", sum);
  };

  // Setup mutations for creating or updating a quote
  const toast = useToast();
  
  const createQuoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quoteSchema>) => {
      console.log("Creating quote with data:", data);
      const response = await apiRequest("POST", "/api/quotes", data);
      
      if (!response.ok) {
        console.error("Server error creating quote:", response.status, response.statusText);
        const errorText = await response.text();
        throw new Error(`Failed to create quote: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log("Quote created:", responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log("Quote created successfully:", data);
      
      // Show success message
      toast.toast({
        title: "Quote Created",
        description: "Your quote has been created successfully.",
        variant: "default",
      });
      
      // Forcefully invalidate the quotes cache to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      
      // After creating the quote, create each quote item (if any)
      if (quoteItems.length > 0) {
        console.log("Adding items to new quote:", quoteItems.length);
        Promise.all(
          quoteItems.map(item => {
            console.log("Adding item:", {...item, quoteId: data.id});
            return apiRequest("POST", "/api/quote-items", { 
              ...item, 
              quoteId: data.id 
            });
          })
        )
        .then(() => {
          console.log("All quote items saved");
          // Invalidate one more time to make sure we get the latest data
          queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
          onSuccess();
        })
        .catch(error => {
          console.error("Error saving quote items:", error);
          // Still mark success as the quote was created
          queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
          onSuccess();
        });
      } else {
        // If no items, still consider it a success
        console.log("Quote created with no items");
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error creating quote:", error);
      
      toast.toast({
        title: "Error Creating Quote",
        description: "There was a problem creating your quote. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quoteSchema>) => {
      console.log("Updating quote with data:", data);
      const response = await apiRequest("PUT", `/api/quotes/${quote?.id}`, data);
      console.log("Quote update response:", response.status);
      return response;
    },
    onSuccess: () => {
      console.log("Quote updated successfully");
      
      // Handle existing items: update or delete
      if (quoteItems.length > 0) {
        console.log("Processing quote items:", quoteItems.length);
        const promises = quoteItems.map(item => {
          if (item.id) {
            // Update existing item
            console.log("Updating item:", item);
            return apiRequest("PUT", `/api/quote-items/${item.id}`, item);
          } else {
            // Create new item for this quote
            console.log("Creating new item for existing quote:", {...item, quoteId: quote?.id});
            return apiRequest("POST", "/api/quote-items", { 
              ...item, 
              quoteId: quote?.id 
            });
          }
        });

        // Execute all promises and notify parent on completion
        Promise.all(promises)
          .then(() => {
            console.log("All quote items saved/updated");
            onSuccess();
          })
          .catch(error => {
            console.error("Error saving/updating quote items:", error);
            // Still mark success as the quote was updated
            onSuccess();
          });
      } else {
        // If no items, still consider it a success
        console.log("Quote updated with no items");
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error updating quote:", error);
    }
  });

  // Add a new empty quote item
  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      {
        id: 0, // Will be assigned by the server
        quoteId: quote?.id || "", // This will be filled in when the item is submitted
        description: "",
        sqft: 0,
        unitPrice: 0,
        quantity: 1,
        total: 0
      }
    ]);
  };

  // Remove a quote item
  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  // Update a quote item
  const updateQuoteItem = (index: number, updatedItem: QuoteItemWithCalculation) => {
    const newItems = [...quoteItems];
    newItems[index] = updatedItem;
    setQuoteItems(newItems);
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof quoteSchema>) => {
    try {
      console.log("Form submitted with data:", data);
      console.log("Current total:", total);
      console.log("Form errors:", form.formState.errors);
      
      // Check if there are any form errors
      if (Object.keys(form.formState.errors).length > 0) {
        console.error("Form has validation errors:", form.formState.errors);
        return;
      }
      
      // Ensure we always have a valid total even if no items added
      const submissionData = {
        ...data,
        total: total || 0, // Use the calculated total from state
        status: data.status || "draft"
      };
      
      console.log("Prepared submission data:", submissionData);
      
      if (quote) {
        console.log("Updating existing quote");
        updateQuoteMutation.mutate(submissionData);
      } else {
        console.log("Creating new quote");
        createQuoteMutation.mutate(submissionData);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto py-2" style={{ maxHeight: "75vh" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Client</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                        {contact.companyName && ` (${contact.companyName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Valid Until</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Quote Items</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addQuoteItem}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          {quoteItems.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              No items added yet. Click 'Add Item' to start building your quote.
            </div>
          )}

          {quoteItems.map((item, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-md relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeQuoteItem(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <QuoteItemForm
                item={item}
                onChange={(updatedItem) => updateQuoteItem(index, updatedItem)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="text-lg font-semibold">Total</div>
          <div className="text-lg font-semibold">${total.toFixed(2)}</div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createQuoteMutation.isPending || updateQuoteMutation.isPending}
          >
            {quote ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// The viewer component for quotes (new functionality)
function QuoteViewer({ quote, contact, onSend, onApprove }: QuoteViewProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [signature, setSignature] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  
  const handleDownloadPDF = async () => {
    if (quote && contact) {
      try {
        // Generate PDF and download it
        const pdfBytes = await generateQuotePDF(quote, contact);
        downloadPDF(pdfBytes, `quote_${quote.id}.pdf`);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        toast.toast({
          title: 'Error',
          description: 'Failed to generate PDF. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };
  
  const handleSendQuote = async () => {
    if (quote && onSend) {
      try {
        setSending(true);
        await onSend(quote.id);
        toast.toast({
          title: 'Success',
          description: 'Quote has been sent to the client.',
          variant: 'default'
        });
      } catch (error) {
        console.error('Failed to send quote:', error);
        toast.toast({
          title: 'Error',
          description: 'Failed to send quote. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setSending(false);
      }
    }
  };
  
  const handleApproveQuote = async () => {
    if (!signature.trim()) {
      toast.toast({
        title: 'Error',
        description: 'Please provide your signature to approve the quote.',
        variant: 'destructive'
      });
      return;
    }
    
    if (quote && onApprove) {
      try {
        await onApprove(quote.id, signature, customerName || undefined);
        setIsApproving(false);
        setSignature('');
        setCustomerName('');
        toast.toast({
          title: 'Success',
          description: 'Quote has been approved successfully!',
          variant: 'default'
        });
      } catch (error) {
        console.error('Failed to approve quote:', error);
        toast.toast({
          title: 'Error',
          description: 'Failed to approve quote. Please try again.',
          variant: 'destructive'
        });
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
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={handleSendQuote}
                disabled={sending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsApproving(true)}
              >
                <Check className="h-4 w-4 mr-2" />
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
                    <Label htmlFor="customerName">Your Name</Label>
                    <Input 
                      id="customerName" 
                      placeholder="Enter your full name" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mb-3"
                    />
                    
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
    </Card>
  );
}