import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, FileSignature, DollarSign, User } from "lucide-react";
import { JobWithDetails, ContactWithDetail } from "@/lib/types";

interface JobDetailProps {
  job: JobWithDetails;
  onStageChange: (stage: string) => void;
}

export function JobDetail({ job, onStageChange }: JobDetailProps) {
  // Fetch related data
  const { data: contracts } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const { data: quotes } = useQuery({
    queryKey: ["/api/quotes"],
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const { data: invoices } = useQuery({
    queryKey: job.contractId ? [`/api/contracts/${job.contractId}/invoices`] : null,
    enabled: !!job.contractId,
  });

  // Get related data
  const contract = contracts?.find((c: any) => c.id === job.contractId);
  const quote = contract ? quotes?.find((q: any) => q.id === contract.quoteId) : null;
  const contact = quote ? contacts?.find((c: ContactWithDetail) => c.id === quote.contactId) : null;

  // Calculate job completion percentage based on stage
  const getJobCompletionPercentage = () => {
    const stages = ["planning", "materials_ordered", "in_progress", "finishing", "complete"];
    const currentIndex = stages.indexOf(job.stage);
    return Math.round((currentIndex / (stages.length - 1)) * 100);
  };

  // Calculate payments progress
  const calculatePaymentProgress = () => {
    if (!invoices || !quote) return 0;
    
    const totalPaid = invoices
      .filter((invoice: any) => invoice.status === "paid")
      .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.amountDue), 0);
    
    return Math.round((totalPaid / parseFloat(quote.total)) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Client</CardTitle>
          </CardHeader>
          <CardContent>
            {contact ? (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                  {contact.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{contact.firstName} {contact.lastName}</p>
                  {contact.companyName && <p className="text-sm text-slate-500">{contact.companyName}</p>}
                  {contact.email && <p className="text-sm text-primary">{contact.email}</p>}
                </div>
              </div>
            ) : (
              <div className="text-slate-500">Client information not available</div>
            )}
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Contract Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-slate-900">${quote?.total?.toFixed(2) || '0.00'}</p>
            <div className="text-sm text-slate-500 flex items-center mt-1">
              <FileSignature className="h-4 w-4 mr-1" />
              {quote ? `Quote #${quote.id.substring(0, 8)}` : 'No quote'}
              {contract && ` • Contract #${contract.id.substring(0, 8)}`}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-slate-900">
                ${invoices?.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + parseFloat(i.amountDue), 0).toFixed(2) || '0.00'}
              </p>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {calculatePaymentProgress()}% Paid
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Next payment due: {invoices?.find((i: any) => i.status === "sent")?.dueDate ? new Date(invoices.find((i: any) => i.status === "sent").dueDate).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Job Progress</CardTitle>
          <CardDescription>Current stage: {job.stage.replace('_', ' ')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span>{getJobCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${getJobCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Start: {new Date(job.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm text-slate-600 ml-4">
              <Calendar className="h-4 w-4 mr-1" />
              <span>End: {new Date(job.endDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
            <span className="text-sm font-medium">Update Stage:</span>
            <Select 
              value={job.stage} 
              onValueChange={onStageChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="materials_ordered">Materials Ordered</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="finishing">Finishing</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Contact Client
        </Button>
        <Button variant="outline" size="sm">
          <FileSignature className="h-4 w-4 mr-2" />
          View Contract
        </Button>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          View Invoices
        </Button>
      </div>
    </div>
  );
}
