import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail, User, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TestEmailPage() {
  const [email, setEmail] = useState("nicksanford2341@gmail.com");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    if (!email.trim()) {
      return toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
    }

    setIsLoading(true);
    setSuccess(false);
    setError("");

    try {
      const payload = { 
        to: email,
        name: name || undefined,
        message: message || undefined
      };

      const response = await apiRequest("POST", "/api/test-email", payload);
      
      // Parse the response to get the success status
      const result = response as any;
      
      if (result && result.success) {
        setSuccess(true);
        toast({
          title: "Test Email Sent",
          description: `Email sent successfully to ${email}`,
        });
      } else {
        setError("Failed to send email. Please check the logs for more details.");
        toast({
          title: "Email Failed",
          description: "There was a problem sending the test email.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error sending test email:", err);
      setError("An error occurred while sending the email.");
      toast({
        title: "Email Error",
        description: "There was a problem communicating with the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Testing Tool</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Send a test email to verify your Resend configuration with React Email templates
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter recipient email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-4 w-4" /> 
                Recipient Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional: Enter recipient name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Custom Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional: Enter a custom message"
                rows={3}
              />
            </div>
            
            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <p>Test email sent successfully!</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSendTestEmail} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send Test Email"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}