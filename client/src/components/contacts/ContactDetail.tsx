import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Phone, Mail, Building, AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ContactWithDetail } from "@/lib/types";

interface ContactDetailProps {
  contact: ContactWithDetail;
  onEdit: () => void;
}

export function ContactDetail({ contact: initialContact, onEdit }: ContactDetailProps) {
  const { toast } = useToast();
  const [isPortalDialogOpen, setIsPortalDialogOpen] = useState(false);
  const [localContact, setLocalContact] = useState<ContactWithDetail>(initialContact);
  const [portalCredentials, setPortalCredentials] = useState<{
    username: string;
    password: string;
    url: string;
  } | null>(null);

  // Update localContact when initialContact changes
  useEffect(() => {
    setLocalContact(initialContact);
  }, [initialContact]);

  // Enable portal access mutation
  const enablePortalMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const res = await apiRequest("POST", `/api/contacts/${contactId}/enable-portal`);
      return await res.json();
    },
    onSuccess: (data) => {
      // Update local contact state with portal enabled
      setLocalContact(prev => ({
        ...prev,
        portalEnabled: true
      }));
      
      setPortalCredentials(data.portalAccess);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${localContact.id}`] });
      toast({
        title: "Portal access enabled",
        description: "Client can now access the portal",
      });
      setIsPortalDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enable portal access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEnablePortal = () => {
    if (!localContact.email) {
      toast({
        title: "Cannot enable portal access",
        description: "Contact must have an email address",
        variant: "destructive",
      });
      return;
    }
    
    enablePortalMutation.mutate(localContact.id);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {localContact.firstName} {localContact.lastName}
              </CardTitle>
              <CardDescription>
                {localContact.type === "lead" ? (
                  <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                    Lead
                  </Badge>
                ) : localContact.type === "customer" ? (
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                    Customer
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                    Supplier
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onEdit}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localContact.companyName && (
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-slate-400" />
              <span>{localContact.companyName}</span>
            </div>
          )}
          
          {localContact.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-slate-400" />
              <span>{localContact.email}</span>
            </div>
          )}
          
          {localContact.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-slate-400" />
              <span>{localContact.phone}</span>
            </div>
          )}
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Portal Access</h3>
            <div className="flex items-center mb-2">
              <KeyRound className="h-4 w-4 mr-2 text-slate-400" />
              <span className="mr-2">Status:</span>
              {localContact.portalEnabled ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                  Disabled
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant={localContact.portalEnabled ? "outline" : "default"} 
            onClick={handleEnablePortal}
            disabled={enablePortalMutation.isPending || !localContact.email}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {localContact.portalEnabled ? "Reset Portal Access" : "Enable Portal Access"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Portal credentials dialog */}
      <Dialog open={isPortalDialogOpen} onOpenChange={setIsPortalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portal Access Enabled</DialogTitle>
            <DialogDescription>
              Portal access has been successfully enabled for this contact.
            </DialogDescription>
          </DialogHeader>
          
          {portalCredentials && (
            <div className="py-4">
              <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Client Portal Credentials</span>
                </div>
                <div className="space-y-2 ml-7">
                  <div>
                    <span className="text-sm font-medium block">Username:</span>
                    <span className="text-sm block">{portalCredentials.username}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Password:</span>
                    <span className="text-sm block">{portalCredentials.password}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Portal URL:</span>
                    <span className="text-sm block">{portalCredentials.url}</span>
                  </div>
                </div>
                <div className="flex items-center mt-3 ml-7">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-xs text-slate-500">
                    Please save these credentials. This is the only time the password will be shown.
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}