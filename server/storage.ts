import {
  users, contacts, quotes, quoteItems, contracts, invoices, jobs, files, messages, notes, portalTokens,
  type User, type InsertUser, type Contact, type InsertContact, type Quote, type InsertQuote,
  type QuoteItem, type InsertQuoteItem, type Contract, type InsertContract, type Invoice, type InsertInvoice,
  type Job, type InsertJob, type File, type InsertFile, type Message, type InsertMessage,
  type Note, type InsertNote, type PortalToken, type InsertPortalToken
} from "@shared/schema";

// Storage interface for all entities
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByContact(contactId: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<boolean>;
  
  // Quote Items
  getQuoteItems(quoteId: string): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined>;
  deleteQuoteItem(id: number): Promise<boolean>;

  // Contracts
  getContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractByQuote(quoteId: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByContract(contractId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobByContract(contractId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  
  // Files
  getFiles(jobId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: string): Promise<boolean>;
  
  // Messages
  getMessages(): Promise<Message[]>;
  getMessagesByContact(contactId: string): Promise<Message[]>;
  getMessagesByJob(jobId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageReadStatus(id: string, readStatus: boolean): Promise<Message | undefined>;
  
  // Notes
  getNotesByJob(jobId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  // Portal Tokens
  getPortalToken(token: string): Promise<PortalToken | undefined>;
  createPortalToken(portalToken: InsertPortalToken): Promise<PortalToken>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<string, Contact>;
  private quotes: Map<string, Quote>;
  private quoteItems: Map<number, QuoteItem>;
  private contracts: Map<string, Contract>;
  private invoices: Map<string, Invoice>;
  private jobs: Map<string, Job>;
  private files: Map<string, File>;
  private messages: Map<string, Message>;
  private notes: Map<string, Note>;
  private portalTokens: Map<string, PortalToken>;
  currentUserId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.quotes = new Map();
    this.quoteItems = new Map();
    this.contracts = new Map();
    this.invoices = new Map();
    this.jobs = new Map();
    this.files = new Map();
    this.messages = new Map();
    this.notes = new Map();
    this.portalTokens = new Map();
    this.currentUserId = 1;
    
    // Create a default user
    this.createUser({
      username: "admin",
      password: "admin",
      firstName: "Mike",
      lastName: "Pereira",
      email: "mike@pereiraconstruction.com",
      role: "admin"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = crypto.randomUUID();
    const newContact: Contact = { ...contact, id, createdAt: new Date() };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;
    
    const updatedContact = { ...existingContact, ...contact };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async getQuotesByContact(contactId: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(quote => quote.contactId === contactId);
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const id = crypto.randomUUID();
    const newQuote: Quote = { ...quote, id, createdAt: new Date() };
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const existingQuote = this.quotes.get(id);
    if (!existingQuote) return undefined;
    
    const updatedQuote = { ...existingQuote, ...quote };
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }

  async deleteQuote(id: string): Promise<boolean> {
    return this.quotes.delete(id);
  }

  // Quote Items
  async getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
    return Array.from(this.quoteItems.values()).filter(item => item.quoteId === quoteId);
  }

  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const lastItem = Array.from(this.quoteItems.values()).sort((a, b) => b.id - a.id)[0];
    const id = lastItem ? lastItem.id + 1 : 1;
    const newItem: QuoteItem = { ...item, id };
    this.quoteItems.set(id, newItem);
    return newItem;
  }

  async updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined> {
    const existingItem = this.quoteItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.quoteItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteQuoteItem(id: number): Promise<boolean> {
    return this.quoteItems.delete(id);
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractByQuote(quoteId: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find(contract => contract.quoteId === quoteId);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const id = crypto.randomUUID();
    const newContract: Contract = { ...contract, id, createdAt: new Date() };
    this.contracts.set(id, newContract);
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existingContract = this.contracts.get(id);
    if (!existingContract) return undefined;
    
    const updatedContract = { ...existingContract, ...contract };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByContract(contractId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.contractId === contractId);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = crypto.randomUUID();
    const newInvoice: Invoice = { ...invoice, id, createdAt: new Date() };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice = { ...existingInvoice, ...invoice };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobByContract(contractId: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(job => job.contractId === contractId);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = crypto.randomUUID();
    const newJob: Job = { ...job, id, createdAt: new Date() };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) return undefined;
    
    const updatedJob = { ...existingJob, ...job };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Files
  async getFiles(jobId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.jobId === jobId);
  }

  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = crypto.randomUUID();
    const newFile: File = { ...file, id, createdAt: new Date() };
    this.files.set(id, newFile);
    return newFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessagesByContact(contactId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.contactId === contactId);
  }

  async getMessagesByJob(jobId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.jobId === jobId);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = crypto.randomUUID();
    const newMessage: Message = { ...message, id, createdAt: new Date() };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async updateMessageReadStatus(id: string, readStatus: boolean): Promise<Message | undefined> {
    const existingMessage = this.messages.get(id);
    if (!existingMessage) return undefined;
    
    const updatedMessage = { ...existingMessage, readStatus };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Notes
  async getNotesByJob(jobId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.jobId === jobId);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const id = crypto.randomUUID();
    const newNote: Note = { ...note, id, createdAt: new Date() };
    this.notes.set(id, newNote);
    return newNote;
  }

  // Portal Tokens
  async getPortalToken(token: string): Promise<PortalToken | undefined> {
    return Array.from(this.portalTokens.values()).find(portalToken => portalToken.token === token);
  }

  async createPortalToken(portalToken: InsertPortalToken): Promise<PortalToken> {
    const id = crypto.randomUUID();
    const newPortalToken: PortalToken = { ...portalToken, id, createdAt: new Date() };
    this.portalTokens.set(id, newPortalToken);
    return newPortalToken;
  }
}

// Uncomment and use the line below for production with a database
// import { DatabaseStorage } from './database-storage';
// export const storage = new DatabaseStorage();

// Use memory storage for development/demo
export const storage = new MemStorage();
