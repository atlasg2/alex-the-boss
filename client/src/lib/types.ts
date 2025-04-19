// Types for the client side that match the database types but with additional fields for UI
export interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
  linkText: string;
  linkUrl: string;
}

export interface JobWithDetails {
  id: string;
  title: string;
  siteAddress: string;
  stage: string;
  startDate: string;
  endDate: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
}

export interface FileWithDetails {
  id: string;
  filename: string;
  filesize: number;
  mimetype: string;
  label?: string;
  url: string;
  createdAt: string;
}

export interface InvoiceWithDetails {
  id: string;
  amountDue: number;
  dueDate: string;
  status: string;
  createdAt: string;
}

export interface NoteWithUser {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByUser: {
    id: number;
    firstName?: string;
    lastName?: string;
    username: string;
  };
}

export interface ContactWithDetail {
  id: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type: string;
  createdAt: string;
}

export interface QuoteWithDetails {
  id: string;
  contactId: string;
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
  contact?: ContactWithDetail;
  items?: QuoteItemWithCalculation[];
}

export interface QuoteItemWithCalculation {
  id: number;
  quoteId: string;
  description: string;
  sqft?: number;
  unitPrice: number;
  quantity: number;
  total?: number;
}

export interface ContractWithDetails {
  id: string;
  quoteId: string;
  signedUrl?: string;
  status: string;
  createdAt: string;
  quote?: QuoteWithDetails;
}

export interface PortalData {
  job: JobWithDetails;
  contract: ContractWithDetails;
  quote: QuoteWithDetails;
  contact: ContactWithDetail;
  files: FileWithDetails[];
  invoices: InvoiceWithDetails[];
}
