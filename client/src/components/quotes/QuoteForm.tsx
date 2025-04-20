import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { PlusCircle, Trash2 } from "lucide-react";

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

interface QuoteFormProps {
  quote?: QuoteWithDetails;
  contacts: ContactWithDetail[];
  onClose: () => void;
  onSuccess: () => void;
}

export function QuoteForm({ quote, contacts, onClose, onSuccess }: QuoteFormProps) {
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
  const createQuoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quoteSchema>) => {
      console.log("Creating quote with data:", data);
      const response = await apiRequest("POST", "/api/quotes", data);
      const responseData = await response.json();
      console.log("Quote created:", responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log("Quote created successfully:", data);
      
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
          onSuccess();
        })
        .catch(error => {
          console.error("Error saving quote items:", error);
          // Still mark success as the quote was created
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
        quoteId: quote?.id || "",
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
      
      // Ensure we always have a valid total even if no items added
      const submissionData = {
        ...data,
        total: total || 0, // Use the calculated total from state
        status: data.status || "draft"
      };
      
      console.log("Prepared submission data:", submissionData);
      
      if (quote) {
        updateQuoteMutation.mutate(submissionData);
      } else {
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
