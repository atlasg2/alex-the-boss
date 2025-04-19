import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, File, FileSpreadsheet, FileImage, CreditCard } from "lucide-react";
import { FileWithDetails, InvoiceWithDetails, ContractWithDetails, QuoteWithDetails } from "@/lib/types";

interface PortalDocumentsProps {
  invoices: InvoiceWithDetails[];
  files: FileWithDetails[];
  contract: ContractWithDetails;
  quote: QuoteWithDetails;
}

export function PortalDocuments({ invoices, files, contract, quote }: PortalDocumentsProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);

  // Get document files and add contract/quote as virtual files
  const documents = [
    {
      id: "contract",
      type: "Contract",
      name: "Project Contract",
      icon: <File className="text-blue-600" />,
      size: "2.4 MB",
      format: "PDF",
      date: new Date(contract.createdAt),
      meta: contract,
      status: null
    },
    {
      id: "quote",
      type: "Quote",
      name: "Project Quote",
      icon: <FileText className="text-blue-600" />,
      size: "1.2 MB",
      format: "PDF",
      date: new Date(quote.createdAt),
      meta: quote,
      status: null
    },
    ...files
      .filter(file => file.mimetype !== "image/jpeg" && file.mimetype !== "image/png")
      .map(file => ({
        id: file.id,
        type: "File",
        name: file.label || file.filename,
        icon: getFileIcon(file.mimetype),
        size: formatFileSize(file.filesize),
        format: file.mimetype.split('/')[1]?.toUpperCase() || file.mimetype,
        date: new Date(file.createdAt),
        meta: file,
        status: null
      })),
    ...invoices.map(invoice => ({
      id: invoice.id,
      type: "Invoice",
      name: `Invoice #${invoice.id.substring(0, 8)}`,
      icon: <FileText className="text-blue-600" />,
      size: "1.0 MB",
      format: "PDF",
      date: new Date(invoice.createdAt),
      meta: invoice,
      status: invoice.status
    }))
  ];

  // Helper to get file icon based on mimetype
  function getFileIcon(mimetype: string) {
    if (mimetype.includes('pdf')) {
      return <File className="text-red-600" />;
    } else if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
      return <FileSpreadsheet className="text-green-600" />;
    } else if (mimetype.includes('image')) {
      return <FileImage className="text-purple-600" />;
    } else {
      return <FileText className="text-blue-600" />;
    }
  }

  // Helper to format file size
  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // Open payment modal for invoice
  const handlePayInvoice = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
    
    // For demo, redirect to a payment page after a delay
    setTimeout(() => {
      alert('In a production app, this would redirect to a payment processor.');
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Project Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-slate-200">
          {documents.map((doc) => (
            <li key={doc.id} className="py-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded">
                  {doc.icon}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.format} • {doc.size}</p>
                </div>
              </div>
              <div className="flex items-center">
                {doc.status && (
                  <span className={`mr-4 px-2 py-1 text-xs font-medium rounded-full ${
                    doc.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    doc.status === 'sent' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                )}
                
                {/* If it's an invoice and status is "sent", show pay button */}
                {doc.type === "Invoice" && doc.status === "sent" && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => handlePayInvoice(doc.meta as InvoiceWithDetails)}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pay Now
                  </Button>
                )}
                
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}

          {documents.length === 0 && (
            <li className="py-6 text-center text-slate-500">
              No documents available for this project yet.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
