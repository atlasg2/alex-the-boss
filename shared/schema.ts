import { pgTable, text, serial, integer, boolean, uuid, numeric, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - from existing schema with additional fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  role: text("role").default("staff"),
});

// Custom enum types
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "accepted", "expired"]);
export const contractStatusEnum = pgEnum("contract_status", ["pending", "active", "complete"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue"]);
export const contactTypeEnum = pgEnum("contact_type", ["lead", "customer", "supplier"]);
export const jobStageEnum = pgEnum("job_stage", ["planning", "materials_ordered", "in_progress", "finishing", "complete"]);

// Contacts table
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  phone: text("phone"),
  type: text("type").notNull().default("lead"),
  // Portal access fields
  portalEnabled: boolean("portal_enabled").default(false),
  portalPassword: text("portal_password"), // Will store hashed password
  portalLastLogin: timestamp("portal_last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  total: numeric("total").default("0").notNull(),
  status: text("status").notNull().default("draft"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quote items table
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  sqft: numeric("sqft"),
  unitPrice: numeric("unit_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  signedUrl: text("signed_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  amountDue: numeric("amount_due").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  siteAddress: text("site_address"),
  stage: text("stage").notNull().default("planning"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  filesize: integer("filesize"),
  mimetype: text("mimetype"),
  label: text("label"),
  uploadedBy: text("uploaded_by"), // Just store the user ID as text to avoid type conflicts
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id),
  subject: text("subject"),
  body: text("body").notNull(),
  type: text("type").notNull().default("email"), // email, sms
  direction: text("direction").notNull().default("inbound"), // inbound, outbound
  readStatus: boolean("read_status").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  createdBy: text("created_by"), // Just store the user ID as text to avoid type conflicts
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portal tokens table
export const portalTokens = pgTable("portal_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
});

export const insertContactSchema = createInsertSchema(contacts)
  .pick({
    companyName: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    type: true,
    portalEnabled: true,
    portalPassword: true,
  })
  .extend({
    // Make optional fields more forgiving
    companyName: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    type: z.string().default("lead"),
    portalEnabled: z.boolean().default(false).optional(),
    portalPassword: z.string().optional(),
  });

export const insertQuoteSchema = createInsertSchema(quotes)
  .pick({
    contactId: true,
    total: true,
    status: true,
    validUntil: true,
  })
  .extend({
    total: z.union([z.string(), z.number()]).optional().transform(val => val || "0"),
    status: z.string().default("draft")
  });

export const insertQuoteItemSchema = createInsertSchema(quoteItems).pick({
  quoteId: true,
  description: true,
  sqft: true,
  unitPrice: true,
  quantity: true,
});

export const insertContractSchema = createInsertSchema(contracts).pick({
  quoteId: true,
  signedUrl: true,
  status: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  contractId: true,
  amountDue: true,
  dueDate: true,
  status: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  contractId: true,
  title: true,
  siteAddress: true,
  stage: true,
  startDate: true,
  endDate: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  jobId: true,
  url: true,
  filename: true,
  filesize: true,
  mimetype: true,
  label: true,
  uploadedBy: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  contactId: true,
  jobId: true,
  subject: true,
  body: true,
  type: true,
  direction: true,
  readStatus: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  jobId: true,
  createdBy: true,
  content: true,
});

export const insertPortalTokenSchema = createInsertSchema(portalTokens)
  .pick({
    jobId: true,
    token: true,
    expiresAt: true,
  })
  .extend({
    jobId: z.string().min(1, "Job ID is required"),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type PortalToken = typeof portalTokens.$inferSelect;
export type InsertPortalToken = z.infer<typeof insertPortalTokenSchema>;
