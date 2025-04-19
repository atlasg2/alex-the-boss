import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Phone } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface MessageComposerProps {
  contactId: string;
}

export function MessageComposer({ contactId }: MessageComposerProps) {
  const [message, setMessage] = useState("");

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { contactId: string; body: string; direction: string; type: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      contactId,
      body: message,
      direction: "outbound",
      type: "email"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
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
      />
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" title="Attach Files">
            <Paperclip className="h-4 w-4" />
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
    </div>
  );
}
