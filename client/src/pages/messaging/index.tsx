import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Filter } from "lucide-react";
import { MessageList } from "@/components/messaging/MessageList";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { ContactWithDetail } from "@/lib/types";

export default function Messaging() {
  const [selectedContact, setSelectedContact] = useState<ContactWithDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [selectedContact ? `/api/contacts/${selectedContact.id}/messages` : "/api/messages"],
    enabled: !!selectedContact,
  });

  // Filter contacts based on search query
  const filteredContacts = contacts?.filter((contact: ContactWithDetail) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const company = (contact.companyName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || company.includes(query);
  });

  // Handle contact selection
  const handleContactSelect = (contact: ContactWithDetail) => {
    setSelectedContact(contact);
  };

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Messaging</h1>
            <p className="mt-1 text-sm text-slate-500">Communicate with your clients and team.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contacts sidebar */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              Your recent message threads.
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search contacts"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                <TabsTrigger value="important" className="flex-1">Important</TabsTrigger>
              </TabsList>

              {contactsLoading ? (
                <div className="text-center py-10 text-slate-500">Loading contacts...</div>
              ) : filteredContacts?.length ? (
                <div className="space-y-1">
                  {filteredContacts.map((contact: ContactWithDetail) => (
                    <div
                      key={contact.id}
                      className={`p-2 flex items-center rounded-md cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-slate-100"
                      }`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/80 flex items-center justify-center text-white mr-3">
                        {contact.firstName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {contact.companyName || contact.email || "No additional info"}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">2h ago</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  {searchQuery ? "No contacts found." : "No contacts available."}
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            {selectedContact ? (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/80 flex items-center justify-center text-white mr-3">
                  {selectedContact.firstName.charAt(0)}
                </div>
                <div>
                  <CardTitle>{selectedContact.firstName} {selectedContact.lastName}</CardTitle>
                  <CardDescription>
                    {selectedContact.companyName || selectedContact.email || selectedContact.phone || "No contact info"}
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <CardTitle>Select a contact to view messages</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {selectedContact ? (
              <>
                <div className="h-[400px] overflow-y-auto p-4 border-t border-b border-slate-200">
                  <MessageList
                    messages={messages || []}
                    isLoading={messagesLoading}
                    contactName={`${selectedContact.firstName} ${selectedContact.lastName}`}
                  />
                </div>
                <div className="p-4">
                  <MessageComposer 
                    contactId={selectedContact.id}
                    contactEmail={selectedContact.email || undefined}
                    contactName={`${selectedContact.firstName} ${selectedContact.lastName}`}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Select a contact to start messaging.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
