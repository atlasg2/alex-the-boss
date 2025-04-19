import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";

export function ContactManager() {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-medium text-slate-800 mb-6">Contact Your Project Manager</h2>
        
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white">
            M
          </div>
          <div className="ml-4">
            <div className="font-medium text-slate-900">Mike Pereira</div>
            <div className="text-sm text-slate-500">Project Manager</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <a href="tel:5551234567">
              <Phone className="mr-2 h-4 w-4" /> Call: (555) 123-4567
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:mike@pereiraconstruction.com">
              <Mail className="mr-2 h-4 w-4" /> Email
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
