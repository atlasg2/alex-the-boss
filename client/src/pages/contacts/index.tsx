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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Phone, Mail, Building } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Badge } from "@/components/ui/badge";
import { ContactWithDetail } from "@/lib/types";

export default function Contacts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactWithDetail | null>(null);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const handleEditContact = (contact: ContactWithDetail) => {
    setSelectedContact(contact);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "lead":
        return "bg-yellow-100 text-yellow-800";
      case "customer":
        return "bg-green-100 text-green-800";
      case "supplier":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Contacts</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your leads and customers.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <ContactForm 
                  onClose={() => setIsAddOpen(false)} 
                  onSuccess={() => {
                    setIsAddOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            View and manage all your contacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading contacts...</div>
          ) : contacts?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: ContactWithDetail) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell>
                      {contact.companyName ? (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1 text-slate-400" />
                          {contact.companyName}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getContactTypeColor(contact.type)}>
                        {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-1 text-slate-400" />
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-1 text-slate-400" />
                            <a href={`tel:${contact.phone}`} className="hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contact.id)}
                          disabled={deleteContactMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center text-slate-500">
              No contacts found. Add your first contact to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <ContactForm 
              contact={selectedContact} 
              onClose={() => setIsEditOpen(false)} 
              onSuccess={() => {
                setIsEditOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
