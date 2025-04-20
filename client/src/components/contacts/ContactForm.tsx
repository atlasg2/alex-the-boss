import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactWithDetail } from "@/lib/types";
import { useState } from "react";

// Simplify the form schema as much as possible - only require first and last name
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  type: z.string().default("lead"),
});

interface ContactFormProps {
  contact?: ContactWithDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactForm({ contact, onClose, onSuccess }: ContactFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize the form with default values or existing contact data
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      companyName: contact?.companyName || "",
      type: contact?.type || "lead",
    },
  });

  // Direct fetch approach for contact creation
  const createContact = async (data: z.infer<typeof contactSchema>) => {
    try {
      setErrorMessage(null);
      
      // Log what we're sending to the server
      console.log("Creating contact with data:", data);
      
      // Create a clean data object with explicit defaults for optional fields
      const contactData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || "",
        phone: data.phone || "",
        companyName: data.companyName || "",
        type: data.type || "lead",
      };
      
      // Use plain fetch to simplify debugging
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
        credentials: "include"
      });
      
      // Log the raw response
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        setErrorMessage(`Server error: ${errorText}`);
        return null;
      }
      
      // Try to parse the response as JSON
      const responseData = await response.json();
      console.log("Contact created successfully:", responseData);
      
      // Invalidate the contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      return responseData;
    } catch (error) {
      console.error("Error creating contact:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      return null;
    }
  };
  
  // Direct fetch approach for contact updates
  const updateContact = async (data: z.infer<typeof contactSchema>) => {
    try {
      setErrorMessage(null);
      
      // Log what we're sending to the server
      console.log("Updating contact with data:", data);
      
      // Create a clean data object with explicit defaults for optional fields
      const contactData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || "",
        phone: data.phone || "",
        companyName: data.companyName || "",
        type: data.type || "lead",
      };
      
      // Use plain fetch to simplify debugging
      const response = await fetch(`/api/contacts/${contact?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
        credentials: "include"
      });
      
      // Log the raw response
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        setErrorMessage(`Server error: ${errorText}`);
        return null;
      }
      
      // Try to parse the response as JSON
      const responseData = await response.json();
      console.log("Contact updated successfully:", responseData);
      
      // Invalidate the contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      return responseData;
    } catch (error) {
      console.error("Error updating contact:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      return null;
    }
  };
  
  // Use mutations with our direct fetch functions
  const createContactMutation = useMutation({
    mutationFn: createContact,
    onSuccess: (data) => {
      if (data) onSuccess();
    }
  });
  
  const updateContactMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: (data) => {
      if (data) onSuccess();
    }
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    if (contact) {
      updateContactMutation.mutate(data);
    } else {
      createContactMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display any error messages */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="555-123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createContactMutation.isPending || updateContactMutation.isPending}
          >
            {contact ? "Update Contact" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
