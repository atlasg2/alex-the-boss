import { db } from "./db";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import { 
  User, InsertUser, Contact, InsertContact, Quote, InsertQuote, 
  QuoteItem, InsertQuoteItem, Contract, InsertContract, Invoice, 
  InsertInvoice, Job, InsertJob, File, InsertFile, Message, 
  InsertMessage, Note, InsertNote, PortalToken, InsertPortalToken
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(schema.contacts);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(schema.contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(schema.contacts)
      .set(contact)
      .where(eq(schema.contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    await db.delete(schema.contacts).where(eq(schema.contacts.id, id));
    return true;
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(schema.quotes);
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
    return quote;
  }

  async getQuotesByContact(contactId: string): Promise<Quote[]> {
    return await db.select().from(schema.quotes).where(eq(schema.quotes.contactId, contactId));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(schema.quotes).values(quote).returning();
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(schema.quotes)
      .set(quote)
      .where(eq(schema.quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: string): Promise<boolean> {
    await db.delete(schema.quotes).where(eq(schema.quotes.id, id));
    return true;
  }

  // Quote Items
  async getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
    return await db.select().from(schema.quoteItems).where(eq(schema.quoteItems.quoteId, quoteId));
  }

  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const [newItem] = await db.insert(schema.quoteItems).values(item).returning();
    return newItem;
  }

  async updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined> {
    const [updatedItem] = await db
      .update(schema.quoteItems)
      .set(item)
      .where(eq(schema.quoteItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteQuoteItem(id: number): Promise<boolean> {
    await db.delete(schema.quoteItems).where(eq(schema.quoteItems.id, id));
    return true;
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return await db.select().from(schema.contracts);
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, id));
    return contract;
  }

  async getContractByQuote(quoteId: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.quoteId, quoteId));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(schema.contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updatedContract] = await db
      .update(schema.contracts)
      .set(contract)
      .where(eq(schema.contracts.id, id))
      .returning();
    return updatedContract;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(schema.invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return invoice;
  }

  async getInvoicesByContract(contractId: string): Promise<Invoice[]> {
    return await db.select().from(schema.invoices).where(eq(schema.invoices.contractId, contractId));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(schema.invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(schema.invoices)
      .set(invoice)
      .where(eq(schema.invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return await db.select().from(schema.jobs);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
    return job;
  }

  async getJobByContract(contractId: string): Promise<Job | undefined> {
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.contractId, contractId));
    return job;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(schema.jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(schema.jobs)
      .set(job)
      .where(eq(schema.jobs.id, id))
      .returning();
    return updatedJob;
  }

  // Files
  async getFiles(jobId: string): Promise<File[]> {
    return await db.select().from(schema.files).where(eq(schema.files.jobId, jobId));
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(schema.files).where(eq(schema.files.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(schema.files).values(file).returning();
    return newFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    await db.delete(schema.files).where(eq(schema.files.id, id));
    return true;
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return await db.select().from(schema.messages);
  }

  async getMessagesByContact(contactId: string): Promise<Message[]> {
    return await db.select().from(schema.messages).where(eq(schema.messages.contactId, contactId));
  }

  async getMessagesByJob(jobId: string): Promise<Message[]> {
    return await db.select().from(schema.messages).where(eq(schema.messages.jobId, jobId));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(schema.messages).values(message).returning();
    return newMessage;
  }

  async updateMessageReadStatus(id: string, readStatus: boolean): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(schema.messages)
      .set({ readStatus })
      .where(eq(schema.messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Notes
  async getNotesByJob(jobId: string): Promise<Note[]> {
    return await db.select().from(schema.notes).where(eq(schema.notes.jobId, jobId));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(schema.notes).values(note).returning();
    return newNote;
  }

  // Portal Tokens
  async getPortalToken(token: string): Promise<PortalToken | undefined> {
    const [portalToken] = await db.select().from(schema.portalTokens).where(eq(schema.portalTokens.token, token));
    return portalToken;
  }

  async createPortalToken(portalToken: InsertPortalToken): Promise<PortalToken> {
    const [newPortalToken] = await db.insert(schema.portalTokens).values(portalToken).returning();
    return newPortalToken;
  }
}