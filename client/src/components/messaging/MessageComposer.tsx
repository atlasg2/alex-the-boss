import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  Paperclip, 
  Phone, 
  Mail, 
  AlertCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface MessageComposerProps {
  contactId: string;
  contactEmail?: string;
  contactName?: string;
}

export function MessageComposer({ 
  contactId, 
  contactEmail, 
  contactName = "the recipient" 
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const { toast } = useToast();
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      contactId: string; 
      subject?: string;
      body: string; 
      direction: string; 
      type: string 
    }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessage("");
      setSubject("");
      setShowEmailDialog(false);
      
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${contactName}.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Handle sending a regular message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // For regular messages (not emails with subject lines)
    sendMessageMutation.mutate({
      contactId,
      body: message,
      direction: "outbound",
      type: "message" // Regular message type
    });
  };

  // Open the email dialog
  const openEmailDialog = () => {
    if (!contactEmail) {
      toast({
        title: "Cannot send email",
        description: "This contact does not have an email address.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setShowEmailDialog(true);
  };
  
  // Handle sending an email
  const handleSendEmail = () => {
    if (!message.trim()) {
      toast({
        title: "Email body is empty",
        description: "Please enter a message to send.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!subject.trim()) {
      toast({
        title: "Subject is empty",
        description: "Please enter an email subject.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Send via the regular message endpoint but with type: 'email'
    sendMessageMutation.mutate({
      contactId: contactId,
      subject: subject,
      body: message,
      direction: "outbound",
      type: "email" // Email type
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (showEmailDialog) {
        handleSendEmail();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col">
      <Textarea
        placeholder="Type your message here..."
        className="min-h-[80px] resize-none mb-3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        ref={messageInputRef}
      />
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" title="Attach Files">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Send Email" onClick={openEmailDialog}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Call Contact">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>
      {sendMessageMutation.isPending && (
        <div className="text-xs text-slate-500 mt-2 text-right">Sending...</div>
      )}
      
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {contactEmail && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Sending to: {contactEmail}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your email message here..."
                rows={8}
                className="resize-none"
              />
            </div>
            
            {!process.env.SENDGRID_API_KEY && (
              <div className="flex items-center space-x-2 rounded-md bg-amber-50 p-3 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>Email sending may not work without a proper SendGrid API key.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}