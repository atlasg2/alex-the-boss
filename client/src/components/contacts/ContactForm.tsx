import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactWithDetail } from "@/lib/types";

// Form schema based on the contacts model
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  type: z.string().min(1, "Contact type is required"),
});

interface ContactFormProps {
  contact?: ContactWithDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactForm({ contact, onClose, onSuccess }: ContactFormProps) {
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

  // Setup mutations for creating or updating a contact
  const createContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      console.log("Creating contact with data:", data);
      try {
        const response = await apiRequest("POST", "/api/contacts", data);
        console.log("Contact creation response:", response);
        return response;
      } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Contact created successfully:", data);
      onSuccess();
    },
    onError: (error) => {
      console.error("Contact creation mutation error:", error);
      alert("Failed to create contact. Please check the console for details.");
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      console.log("Updating contact with data:", data);
      try {
        const response = await apiRequest("PUT", `/api/contacts/${contact?.id}`, data);
        console.log("Contact update response:", response);
        return response;
      } catch (error) {
        console.error("Error updating contact:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Contact updated successfully:", data);
      onSuccess();
    },
    onError: (error) => {
      console.error("Contact update mutation error:", error);
      alert("Failed to update contact. Please check the console for details.");
    }
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    console.log("Form submitted with data:", data);
    if (contact) {
      updateContactMutation.mutate(data);
    } else {
      createContactMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormLabel>Email</FormLabel>
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
                <FormLabel>Phone</FormLabel>
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
