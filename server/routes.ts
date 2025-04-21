import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertContactSchema, insertQuoteSchema, insertQuoteItemSchema, 
  insertContractSchema, insertInvoiceSchema, insertJobSchema,
  insertFileSchema, insertMessageSchema, insertNoteSchema, insertPortalTokenSchema,
  insertFlooringMaterialSchema,
  InsertContact
} from "@shared/schema";
import { z } from "zod";
import { hashPassword, comparePasswords } from './utils/auth';
import { sendTestEmail, sendQuoteEmail, sendQuoteApprovalEmail, sendJobUpdateEmail } from './utils/email';
import session from 'express-session';

// Extend Express request type to include session
declare module 'express-session' {
  interface SessionData {
    portalUser?: {
      contactId: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
    },
    testCounter?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for both Express and WebSocket
  const server = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Connected clients with their jobId
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    let clientId: string = '';
    
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Client provides job ID on initial connection
        if (data.type === 'init' && data.jobId) {
          clientId = data.jobId;
          clients.set(clientId, ws);
          console.log(`Client registered for job ${clientId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'connected',
            message: `Connected to job ${clientId} updates`
          }));
        }
      } catch (e) {
        console.error('Invalid message format', e);
      }
    });
    
    ws.on('close', () => {
      if (clientId) {
        clients.delete(clientId);
        console.log(`Client disconnected from job ${clientId}`);
      }
    });
  });
  
  // Helper function to send updates to connected clients
  const sendJobUpdate = (jobId: string, updateData: any) => {
    const client = clients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        data: updateData
      }));
    }
  };
  
  // Contacts API
  app.get("/api/contacts", async (req: Request, res: Response) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  
  app.get("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });
  
  app.post("/api/contacts", async (req: Request, res: Response) => {
    try {
      console.log("Contact creation request received:", req.body);
      
      // Simplify validation to just require first and last name
      if (!req.body.firstName || !req.body.firstName.trim()) {
        return res.status(400).json({ 
          message: "First name is required" 
        });
      }
      
      if (!req.body.lastName || !req.body.lastName.trim()) {
        return res.status(400).json({ 
          message: "Last name is required" 
        });
      }
      
      // Create a simple, clean contact object
      const contactToCreate = {
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        email: req.body.email ? req.body.email.trim() : "",
        phone: req.body.phone ? req.body.phone.trim() : "",
        companyName: req.body.companyName ? req.body.companyName.trim() : "",
        type: req.body.type || "lead",
        portalEnabled: false,
        portalPassword: null
      };
      
      console.log("Creating contact with data:", contactToCreate);
      
      // Insert directly without schema validation
      const contact = await storage.createContact(contactToCreate as InsertContact);
      console.log("Contact created successfully:", contact);
      
      res.status(201).json(contact);
    } catch (error) {
      console.error("Contact creation error:", error);
      
      // Check for unique constraint violation (duplicate email)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(409).json({ 
          message: "A contact with this email already exists"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create contact",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.put("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, contactData);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });
  
  // Enable portal access for a contact
  app.post("/api/contacts/:id/enable-portal", async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;
      
      // Get the contact
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Check if contact has an email
      if (!contact.email) {
        return res.status(400).json({ 
          message: "Cannot enable portal access: Contact does not have an email address" 
        });
      }
      
      // Use the contact's first name as the password (simple for now)
      const password = contact.firstName || "password";
      
      // Hash the password for storage
      const hashedPassword = await hashPassword(password);
      
      // Enable portal access
      const updatedContact = await storage.enablePortalAccess(contactId, hashedPassword);
      if (!updatedContact) {
        return res.status(500).json({ message: "Failed to enable portal access" });
      }
      
      // Return success with the credentials
      res.status(200).json({ 
        message: "Portal access enabled successfully",
        portalAccess: {
          username: contact.email,
          password: password, // Only returning this for testing purposes
          url: "/portal/login"
        }
      });
    } catch (error) {
      console.error("Error enabling portal access:", error);
      res.status(500).json({ 
        message: "Failed to enable portal access",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.delete("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteContact(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Quotes API
  app.get("/api/quotes", async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });
  
  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });
  
  app.get("/api/contacts/:contactId/quotes", async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotesByContact(req.params.contactId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });
  
  app.post("/api/quotes", async (req: Request, res: Response) => {
    try {
      console.log("Creating quote with data:", req.body);
      
      // Make sure we have a valid total even if not provided
      if (!req.body.total) {
        req.body.total = "0";
      }
      
      // Ensure status is always valid
      if (!req.body.status) {
        req.body.status = "draft";
      }
      
      // Convert validUntil to Date object if it's a string
      if (req.body.validUntil && typeof req.body.validUntil === 'string') {
        try {
          // Convert the string to a Date object
          const date = new Date(req.body.validUntil);
          // Check if it's a valid date
          if (!isNaN(date.getTime())) {
            req.body.validUntil = date;
          }
        } catch (e) {
          console.warn("Failed to convert validUntil to date:", e);
          // If conversion fails, let Zod handle it
        }
      }
      
      console.log("Prepared data for parsing:", req.body);
      const quoteData = insertQuoteSchema.parse(req.body);
      console.log("Parsed quote data:", quoteData);
      
      const quote = await storage.createQuote(quoteData);
      console.log("Quote created successfully:", quote);
      
      res.status(201).json(quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quote data", 
          errors: error.errors,
          receivedData: req.body
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create quote",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.put("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      console.log("Updating quote with ID:", req.params.id, "Data:", req.body);
      
      // Make sure we have proper defaults
      if (req.body.total === undefined || req.body.total === null) {
        req.body.total = "0";
      }
      
      // Ensure status is valid if provided
      if (req.body.status === undefined || req.body.status === null) {
        req.body.status = "draft";
      }
      
      // Convert validUntil to Date object if it's a string
      if (req.body.validUntil && typeof req.body.validUntil === 'string') {
        try {
          // Convert the string to a Date object
          const date = new Date(req.body.validUntil);
          // Check if it's a valid date
          if (!isNaN(date.getTime())) {
            req.body.validUntil = date;
          }
        } catch (e) {
          console.warn("Failed to convert validUntil to date:", e);
          // If conversion fails, let Zod handle it
        }
      }
      
      console.log("Prepared data for parsing:", req.body);
      const quoteData = insertQuoteSchema.partial().parse(req.body);
      console.log("Parsed quote update data:", quoteData);
      
      const quote = await storage.updateQuote(req.params.id, quoteData);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      console.log("Quote updated successfully:", quote);
      res.json(quote);
    } catch (error) {
      console.error("Error updating quote:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quote data", 
          errors: error.errors,
          receivedData: req.body
        });
      }
      
      res.status(500).json({ 
        message: "Failed to update quote",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Quote Items API
  app.get("/api/quotes/:quoteId/items", async (req: Request, res: Response) => {
    try {
      const items = await storage.getQuoteItems(req.params.quoteId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quote items" });
    }
  });
  
  app.post("/api/quote-items", async (req: Request, res: Response) => {
    try {
      const itemData = insertQuoteItemSchema.parse(req.body);
      const item = await storage.createQuoteItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quote item" });
    }
  });
  
  app.put("/api/quote-items/:id", async (req: Request, res: Response) => {
    try {
      const itemData = insertQuoteItemSchema.partial().parse(req.body);
      const item = await storage.updateQuoteItem(parseInt(req.params.id), itemData);
      if (!item) {
        return res.status(404).json({ message: "Quote item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update quote item" });
    }
  });
  
  app.delete("/api/quote-items/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteQuoteItem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Quote item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quote item" });
    }
  });

  // Contracts API
  app.get("/api/contracts", async (req: Request, res: Response) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });
  
  app.get("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });
  
  app.get("/api/quotes/:quoteId/contract", async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContractByQuote(req.params.quoteId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });
  
  app.post("/api/contracts", async (req: Request, res: Response) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(contractData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contract" });
    }
  });
  
  app.put("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contractData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(req.params.id, contractData);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  // Invoices API
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  
  app.get("/api/contracts/:contractId/invoices", async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoicesByContract(req.params.contractId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Jobs API
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  
  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });
  
  app.get("/api/contracts/:contractId/job", async (req: Request, res: Response) => {
    try {
      const job = await storage.getJobByContract(req.params.contractId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });
  
  app.post("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });
  
  app.put("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, jobData);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
      
      // Send WebSocket update
      sendJobUpdate(req.params.id, {
        type: 'job_update',
        job
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update job" });
    }
  });
  
  // Files API
  app.get("/api/jobs/:jobId/files", async (req: Request, res: Response) => {
    try {
      const files = await storage.getFiles(req.params.jobId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
  
  app.post("/api/files", async (req: Request, res: Response) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
      
      // Send WebSocket update about new file
      sendJobUpdate(fileData.jobId, {
        type: 'new_file',
        file
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create file" });
    }
  });
  
  app.delete("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const success = await storage.deleteFile(req.params.id);
      res.status(204).send();
      
      // Send WebSocket update about deleted file
      sendJobUpdate(file.jobId, {
        type: 'deleted_file',
        fileId: req.params.id
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });
  
  // Messages API
  app.get("/api/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.get("/api/contacts/:contactId/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessagesByContact(req.params.contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.get("/api/jobs/:jobId/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessagesByJob(req.params.jobId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
      
      // Send WebSocket update if message is related to a job
      if (messageData.jobId) {
        sendJobUpdate(messageData.jobId, {
          type: 'new_message',
          message
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });
  
  app.put("/api/messages/:id/read", async (req: Request, res: Response) => {
    try {
      const message = await storage.updateMessageReadStatus(req.params.id, true);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to update message" });
    }
  });
  
  // Notes API
  app.get("/api/jobs/:jobId/notes", async (req: Request, res: Response) => {
    try {
      const notes = await storage.getNotesByJob(req.params.jobId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  
  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
      
      // Send WebSocket update about new note
      if (noteData.jobId) {
        sendJobUpdate(noteData.jobId, {
          type: 'new_note',
          note
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  
  // Portal API for session-based authentication
  app.get("/api/portal/me", (req: Request, res: Response) => {
    console.log("GET /api/portal/me - Session data:", req.session);
    if (req.session?.portalUser) {
      res.status(200).json(req.session.portalUser);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // Get all jobs for the currently logged in portal user
  app.get("/api/portal/jobs", async (req: Request, res: Response) => {
    try {
      if (!req.session?.portalUser?.contactId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const contactId = req.session.portalUser.contactId;
      
      // Get all quotes for this contact
      const quotes = await storage.getQuotesByContact(contactId);
      
      if (!quotes || quotes.length === 0) {
        return res.status(404).json({ message: "No quotes found" });
      }
      
      // Get all contracts from these quotes
      const contracts = await Promise.all(
        quotes.map(async (quote) => {
          return await storage.getContractByQuote(quote.id);
        })
      );
      
      const validContracts = contracts.filter(c => c !== undefined);
      
      if (validContracts.length === 0) {
        return res.status(404).json({ message: "No contracts found" });
      }
      
      // Get all jobs from these contracts
      const jobs = await Promise.all(
        validContracts.map(async (contract) => {
          if (contract) {
            return await storage.getJobByContract(contract.id);
          }
          return undefined;
        })
      );
      
      const validJobs = jobs.filter(j => j !== undefined);
      
      res.status(200).json(validJobs);
    } catch (error) {
      console.error("Get portal jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });
  
  // Portal API for token-based access
  app.get("/api/portal/:token", async (req: Request, res: Response) => {
    try {
      const portalToken = await storage.getPortalToken(req.params.token);
      if (!portalToken) {
        return res.status(404).json({ message: "Portal token not found or expired" });
      }
      
      // Check if token is expired
      if (portalToken.expiresAt && new Date() > new Date(portalToken.expiresAt)) {
        return res.status(401).json({ message: "Portal token has expired" });
      }
      
      // Load the job details
      if (!portalToken.jobId) {
        return res.status(400).json({ message: "Invalid job reference in portal token" });
      }
      
      const job = await storage.getJob(portalToken.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Load related contract
      const contract = await storage.getContract(job.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Load related quote
      const quote = await storage.getQuote(contract.quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      // Load related contact
      const contact = await storage.getContact(quote.contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Load invoices
      const invoices = await storage.getInvoicesByContract(contract.id);
      
      // Load files
      const files = await storage.getFiles(job.id);
      
      res.json({
        job,
        contract,
        quote,
        contact,
        invoices,
        files
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load portal data" });
    }
  });
  
  app.post("/api/portal/tokens", async (req: Request, res: Response) => {
    try {
      const tokenData = insertPortalTokenSchema.parse(req.body);
      const portalToken = await storage.createPortalToken(tokenData);
      res.status(201).json(portalToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid portal token data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create portal token" });
    }
  });

  // Portal Authentication endpoints
  app.post("/api/portal/enable", async (req: Request, res: Response) => {
    try {
      const { contactId, password } = req.body;
      
      if (!contactId || !password) {
        return res.status(400).json({ message: "Contact ID and password are required" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(password);
      
      // Enable portal access for this contact
      const updatedContact = await storage.enablePortalAccess(contactId, hashedPassword);
      
      if (!updatedContact) {
        return res.status(500).json({ message: "Failed to enable portal access" });
      }
      
      // Never return the hashed password to the client
      const { portalPassword, ...contactWithoutPassword } = updatedContact;
      
      res.status(200).json(contactWithoutPassword);
    } catch (error) {
      console.error("Portal enable error:", error);
      res.status(500).json({ message: "Failed to enable portal access" });
    }
  });

  app.post("/api/portal/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Get contact by email
      const contact = await storage.getContactByEmail(email);
      
      if (!contact || !contact.portalEnabled || !contact.portalPassword) {
        return res.status(401).json({ message: "Invalid credentials or portal access not enabled" });
      }
      
      // Verify password
      const passwordValid = await comparePasswords(password, contact.portalPassword);
      
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login timestamp
      await storage.updatePortalLastLogin(contact.id);
      
      // Create session for the portal user
      if (!req.session) {
        console.error("Session object not available on request");
        return res.status(500).json({ message: "Session handling error" });
      }
      
      req.session.portalUser = {
        contactId: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName
      };
      
      // Make sure the session is saved before responding
      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).json({ message: "Session handling error" });
        }
        
        console.log("Session saved successfully:", req.session.id);
        console.log("Session portalUser:", req.session.portalUser);
        
        // Never return the hashed password to the client
        const { portalPassword, ...contactWithoutPassword } = contact;
        
        res.status(200).json(contactWithoutPassword);
      });
    } catch (error) {
      console.error("Portal login error:", error);
      res.status(500).json({ message: "Failed to login to portal" });
    }
  });

  app.post("/api/portal/logout", (req: Request, res: Response) => {
    if (req.session) {
      delete req.session.portalUser;
      res.status(200).json({ message: "Successfully logged out" });
    } else {
      res.status(400).json({ message: "No active session" });
    }
  });

  // Test route for debugging session management
  // Debug route - not protected by portal token
  app.get("/api/session-test", (req: Request, res: Response) => {
    console.log("GET /api/session-test - Session data:", req.session);
    console.log("Session ID:", req.sessionID);
    console.log("Cookies:", req.headers.cookie);
    
    if (!req.session) {
      return res.status(500).json({ message: "No session object available" });
    }
    
    if (!req.session.testCounter) {
      req.session.testCounter = 1;
    } else {
      req.session.testCounter++;
    }
    
    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ message: "Session save error" });
      }
      
      res.status(200).json({ 
        message: "Session test", 
        counter: req.session.testCounter,
        sessionID: req.sessionID,
        hasPortalUser: !!req.session.portalUser
      });
    });
  });
  
  // Test email route
  app.post("/api/send-test-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      console.log(`Attempting to send test email to: ${email}`);
      const success = await sendTestEmail(email);
      
      if (success) {
        res.json({ message: `Test email sent to ${email}` });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        message: "Error sending test email",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Flooring Materials API
  app.get("/api/flooring-materials", async (req: Request, res: Response) => {
    try {
      const materials = await storage.getFlooringMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flooring materials" });
    }
  });
  
  app.get("/api/flooring-materials/type/:type", async (req: Request, res: Response) => {
    try {
      const materials = await storage.getFlooringMaterialsByType(req.params.type);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flooring materials by type" });
    }
  });
  
  app.get("/api/flooring-materials/:id", async (req: Request, res: Response) => {
    try {
      const material = await storage.getFlooringMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Flooring material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flooring material" });
    }
  });
  
  app.post("/api/flooring-materials", async (req: Request, res: Response) => {
    try {
      const materialData = insertFlooringMaterialSchema.parse(req.body);
      const material = await storage.createFlooringMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flooring material data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create flooring material" });
    }
  });
  
  app.put("/api/flooring-materials/:id", async (req: Request, res: Response) => {
    try {
      const materialData = insertFlooringMaterialSchema.partial().parse(req.body);
      const material = await storage.updateFlooringMaterial(req.params.id, materialData);
      if (!material) {
        return res.status(404).json({ message: "Flooring material not found" });
      }
      res.json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flooring material data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update flooring material" });
    }
  });
  
  app.delete("/api/flooring-materials/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFlooringMaterial(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Flooring material not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flooring material" });
    }
  });
  
  // PDF Generation API
  app.get("/api/quotes/:id/pdf", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      const quoteItems = await storage.getQuoteItems(quote.id);
      const contact = await storage.getContact(quote.contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // If there's an associated contract and job, get that information too
      let job = undefined;
      const contract = await storage.getContractByQuote(quote.id);
      if (contract) {
        job = await storage.getJobByContract(contract.id);
      }
      
      // Format the data for the client
      const quoteWithDetails = {
        ...quote,
        items: quoteItems,
        contact: contact
      };
      
      // Option to return PDF directly or just the data depending on request
      const format = req.query.format as string || 'json';
      
      if (format === 'pdf') {
        // Server-side PDF generation
        // Import the pdf-lib library
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // US Letter size
        
        // Get fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Set some basic metadata
        pdfDoc.setTitle(`Quote for ${contact.firstName} ${contact.lastName}`);
        pdfDoc.setAuthor('Apex Flooring');
        pdfDoc.setCreator('Contractor Portal');
        
        // Draw header
        page.drawText('Apex Flooring', {
          x: 50,
          y: 730,
          size: 24,
          font: helveticaBold,
          color: rgb(0.15, 0.39, 0.92), // Primary blue color
        });
        
        page.drawText('QUOTE', {
          x: 450,
          y: 730,
          size: 24,
          font: helveticaBold,
          color: rgb(0.15, 0.39, 0.92),
        });
        
        // Draw company info
        page.drawText('123 Main Street, Suite 100', {
          x: 50,
          y: 700,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawText('Boston, MA 02108', {
          x: 50,
          y: 685,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawText('Phone: (555) 123-4567', {
          x: 50,
          y: 670,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawText('Email: info@apexflooring.com', {
          x: 50,
          y: 655,
          size: 10,
          font: helveticaFont,
        });
        
        // Draw quote info
        page.drawText(`Quote #: Q-${quote.id.substring(0, 8).toUpperCase()}`, {
          x: 400,
          y: 700,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawText(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, {
          x: 400,
          y: 685,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawText(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, {
          x: 400,
          y: 670,
          size: 10,
          font: helveticaFont,
        });
        
        // Draw billing info
        page.drawText('Billed To:', {
          x: 50,
          y: 620,
          size: 12,
          font: helveticaBold,
        });
        
        const contactName = `${contact.firstName} ${contact.lastName}`;
        page.drawText(contactName, {
          x: 50,
          y: 605,
          size: 10,
          font: helveticaFont,
        });
        
        if (contact.companyName) {
          page.drawText(contact.companyName, {
            x: 50,
            y: 590,
            size: 10,
            font: helveticaFont,
          });
        }
        
        if (contact.email) {
          page.drawText(`Email: ${contact.email}`, {
            x: 50,
            y: contact.companyName ? 575 : 590,
            size: 10,
            font: helveticaFont,
          });
        }
        
        if (contact.phone) {
          page.drawText(`Phone: ${contact.phone}`, {
            x: 50,
            y: contact.companyName && contact.email ? 560 : contact.companyName || contact.email ? 575 : 590,
            size: 10,
            font: helveticaFont,
          });
        }
        
        // Draw quote items header
        const tableTop = 520;
        page.drawText('Description', {
          x: 50,
          y: tableTop,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawText('Sq.Ft', {
          x: 300,
          y: tableTop,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawText('Unit Price', {
          x: 380,
          y: tableTop,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawText('Qty', {
          x: 450,
          y: tableTop,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawText('Total', {
          x: 500,
          y: tableTop,
          size: 12,
          font: helveticaBold,
        });
        
        // Draw a horizontal line
        page.drawLine({
          start: { x: 50, y: tableTop - 10 },
          end: { x: 550, y: tableTop - 10 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        
        // Draw quote items
        let lineY = tableTop - 30;
        if (quoteItems && quoteItems.length > 0) {
          for (const item of quoteItems) {
            page.drawText(item.description, {
              x: 50,
              y: lineY,
              size: 10,
              font: helveticaFont,
              maxWidth: 240,
            });
            
            if (item.sqft) {
              page.drawText(item.sqft.toString(), {
                x: 300,
                y: lineY,
                size: 10,
                font: helveticaFont,
              });
            }
            
            page.drawText(`$${parseFloat(item.unitPrice.toString()).toFixed(2)}`, {
              x: 380,
              y: lineY,
              size: 10,
              font: helveticaFont,
            });
            
            page.drawText(item.quantity.toString(), {
              x: 450,
              y: lineY,
              size: 10,
              font: helveticaFont,
            });
            
            const total = item.quantity * parseFloat(item.unitPrice.toString());
            page.drawText(`$${total.toFixed(2)}`, {
              x: 500,
              y: lineY,
              size: 10,
              font: helveticaFont,
            });
            
            // If the item has flooring specific details, add them on the next line
            if (item.roomName || item.materialType || item.serviceType) {
              lineY -= 20;
              
              let details = [];
              if (item.roomName) details.push(`Room: ${item.roomName}`);
              if (item.materialType) details.push(`Material: ${item.materialType}`);
              if (item.serviceType) details.push(`Service: ${item.serviceType}`);
              
              if (details.length > 0) {
                page.drawText(details.join(', '), {
                  x: 70,
                  y: lineY,
                  size: 9,
                  font: helveticaFont,
                  color: rgb(0.4, 0.4, 0.4),
                  maxWidth: 480,
                });
              }
            }
            
            lineY -= 25;
          }
        }
        
        // Draw total
        page.drawLine({
          start: { x: 380, y: lineY - 10 },
          end: { x: 550, y: lineY - 10 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        
        page.drawText('Total:', {
          x: 400,
          y: lineY - 30,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawText(`$${parseFloat(quote.total.toString()).toFixed(2)}`, {
          x: 500,
          y: lineY - 30,
          size: 12,
          font: helveticaBold,
        });
        
        // Terms and conditions
        page.drawText('Terms and Conditions:', {
          x: 50,
          y: lineY - 70,
          size: 12,
          font: helveticaBold,
        });
        
        const terms = [
          '1. This quote is valid for 30 days from the date of issue.',
          '2. A 50% deposit is required to begin work, with the balance due upon completion.',
          '3. Any additional work not specified in this quote will be subject to a separate quote.',
          '4. Changes to the scope of work may affect the final price.',
          '5. Apex Flooring is fully licensed and insured.'
        ];
        
        let termsY = lineY - 90;
        for (const term of terms) {
          page.drawText(term, {
            x: 50,
            y: termsY,
            size: 9,
            font: helveticaFont,
          });
          termsY -= 15;
        }
        
        // Signature area
        page.drawText('Acceptance of Quote:', {
          x: 50,
          y: 150,
          size: 12,
          font: helveticaBold,
        });
        
        page.drawLine({
          start: { x: 50, y: 120 },
          end: { x: 250, y: 120 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Signature', {
          x: 130,
          y: 105,
          size: 10,
          font: helveticaFont,
        });
        
        page.drawLine({
          start: { x: 300, y: 120 },
          end: { x: 500, y: 120 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Date', {
          x: 390,
          y: 105,
          size: 10,
          font: helveticaFont,
        });
        
        // Footer
        page.drawText('Thank you for your business!', {
          x: 230,
          y: 70,
          size: 12,
          font: helveticaBold,
          color: rgb(0.15, 0.39, 0.92),
        });
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        
        // Send the PDF directly
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id.substring(0, 8)}.pdf"`);
        res.send(Buffer.from(pdfBytes));
      } else {
        // Return JSON data for client-side PDF generation
        res.json({
          quote: quoteWithDetails,
          contact,
          job,
          success: true
        });
      }
    } catch (error) {
      console.error("Error generating quote PDF:", error);
      res.status(500).json({ 
        message: "Error generating quote PDF",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Send Quote Email API with PDF
  app.post("/api/quotes/:id/send", async (req: Request, res: Response) => {
    try {
      const quoteId = req.params.id;
      
      // Get quote
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      // Get quote items
      const quoteItems = await storage.getQuoteItems(quoteId);
      
      // Get contact
      const contact = await storage.getContact(quote.contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (!contact.email) {
        return res.status(400).json({ message: "Contact does not have an email address" });
      }
      
      // Update quote status to "sent"
      await storage.updateQuote(quoteId, { status: "sent" });
      
      // Format the amount correctly
      const formattedAmount = `$${parseFloat(quote.total.toString()).toFixed(2)}`;
      
      // Generate PDF
      const quoteWithItems = {
        ...quote,
        items: quoteItems
      };
      
      // Use the server-side PDF generation
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      // Add PDF content (similar to what's in the PDF API endpoint)
      const page = pdfDoc.addPage([612, 792]); // US Letter size
      
      // Get fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Set some basic metadata
      pdfDoc.setTitle(`Quote for ${contact.firstName} ${contact.lastName}`);
      pdfDoc.setAuthor('Apex Flooring');
      pdfDoc.setCreator('Contractor Portal');
      
      // Draw header
      page.drawText('Apex Flooring', {
        x: 50,
        y: 730,
        size: 24,
        font: helveticaBold,
        color: rgb(0.15, 0.39, 0.92), // Primary blue color
      });
      
      page.drawText('QUOTE', {
        x: 450,
        y: 730,
        size: 24,
        font: helveticaBold,
        color: rgb(0.15, 0.39, 0.92),
      });
      
      // Basic quote and customer info
      page.drawText(`Quote #: Q-${quoteId.substring(0, 8).toUpperCase()}`, {
        x: 50,
        y: 700,
        size: 12,
        font: helveticaBold,
      });
      
      page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: 680,
        size: 10,
        font: helveticaFont,
      });
      
      page.drawText(`Client: ${contact.firstName} ${contact.lastName}`, {
        x: 50,
        y: 660,
        size: 10,
        font: helveticaFont,
      });
      
      page.drawText(`Total Amount: $${formattedAmount}`, {
        x: 50,
        y: 640,
        size: 10,
        font: helveticaFont,
      });
      
      // Simplified details section
      page.drawText('Quote Details:', {
        x: 50,
        y: 600,
        size: 12,
        font: helveticaBold,
      });
      
      let yPos = 580;
      for (const item of quoteItems) {
        const formatCurrency = (value: any) => `$${parseFloat(value.toString()).toFixed(2)}`;
        page.drawText(`• ${item.description}: ${formatCurrency(item.unitPrice)} x ${item.quantity}`, {
          x: 60,
          y: yPos,
          size: 10,
          font: helveticaFont,
        });
        yPos -= 20;
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Send the email with PDF attachment
      const success = await sendQuoteEmail(
        contact.email, 
        quoteId, 
        `${contact.firstName} ${contact.lastName}`,
        formattedAmount,
        pdfBytes
      );
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Quote sent to ${contact.email} with PDF attachment` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send quote email" 
        });
      }
    } catch (error) {
      console.error("Error sending quote email:", error);
      res.status(500).json({ 
        message: "Error sending quote email",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Quote Approval API
  app.post("/api/quotes/:id/approve", async (req: Request, res: Response) => {
    try {
      const quoteId = req.params.id;
      const { signature, date, customerName, customerEmail, notes } = req.body;
      
      if (!signature) {
        return res.status(400).json({ message: "Signature is required" });
      }
      
      // Get quote
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      // Get contact
      const contact = await storage.getContact(quote.contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Update quote status to accepted with approval details
      const updatedQuote = await storage.updateQuote(quoteId, { 
        status: "accepted",
        updatedAt: new Date()
      });
      
      // Create a contract with approval details
      const contract = await storage.createContract({
        quoteId: quoteId,
        status: "pending",
        signedUrl: signature, // In a real app, you'd store the signature image
        signedDate: date || new Date(),
        signedBy: customerName || `${contact.firstName} ${contact.lastName}`,
        notes: notes || `Quote approved via client portal on ${new Date().toLocaleString()}`
      });
      
      // Create a job from this contract
      const job = await storage.createJob({
        contractId: contract.id,
        title: `Flooring Job - ${contact.firstName} ${contact.lastName}`,
        stage: "contract_signed",
        startDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to a week from now
        endDate: new Date(new Date().setDate(new Date().getDate() + 14)),  // Default to 2 weeks from now
        status: "scheduled"
      });
      
      // If the customer has a portal account, associate the job with them
      if (contact.portalEnabled) {
        // Create a portal token for this job if needed
        const portalToken = await storage.createPortalToken({
          jobId: job.id,
          token: `${job.id.split('-')[0]}-${Math.random().toString(36).substring(2, 7)}`,
          expiresAt: new Date(new Date().setDate(new Date().getDate() + 90)) // 90 days validity
        });
      }
      
      // Send email notification to admin about the quote approval
      console.log(`QUOTE APPROVED: ${quoteId} by ${customerName || contact.firstName} ${contact.lastName}`);
      
      // Send confirmation email to the customer
      if (contact.email) {
        try {
          await sendQuoteApprovalEmail(
            contact.email,
            quoteId,
            customerName || `${contact.firstName} ${contact.lastName}`,
            contract.id,
            job.id
          );
          console.log(`Quote approval confirmation email sent to ${contact.email}`);
        } catch (emailError) {
          console.error("Error sending quote approval email:", emailError);
          // Don't fail the request if email fails - just log it
        }
      }
      
      // Send back success response
      res.json({
        quote: updatedQuote,
        contract,
        job,
        success: true,
        message: "Quote approved successfully and contract created"
      });
    } catch (error) {
      console.error("Error approving quote:", error);
      res.status(500).json({ 
        message: "Error approving quote",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create test data
  await createTestData();

  return server;
}

async function createTestData() {
  try {
    // Create flooring materials catalog if it doesn't exist
    const existingMaterials = await storage.getFlooringMaterials();
    if (!existingMaterials || existingMaterials.length === 0) {
      console.log("Creating flooring materials catalog...");
      
      // Hardwood flooring
      await storage.createFlooringMaterial({
        name: "Oak Hardwood",
        type: "hardwood",
        brand: "Premium Woods",
        color: "Golden Oak",
        thickness: "3/4 inch",
        width: "5 inch",
        length: "Random (1-7 feet)",
        unitPrice: "8.99",
        unitType: "sqft",
        description: "Premium solid oak hardwood flooring with natural grain patterns. Durable and timeless.",
        imageUrl: "https://example.com/images/oak-hardwood.jpg",
        inStock: true
      });
      
      await storage.createFlooringMaterial({
        name: "Maple Hardwood",
        type: "hardwood",
        brand: "Premium Woods",
        color: "Natural Maple",
        thickness: "3/4 inch",
        width: "3.25 inch",
        length: "Random (1-7 feet)",
        unitPrice: "9.50",
        unitType: "sqft",
        description: "Solid maple hardwood with smooth grain and light color. Perfect for contemporary spaces.",
        imageUrl: "https://example.com/images/maple-hardwood.jpg",
        inStock: true
      });
      
      // Laminate flooring
      await storage.createFlooringMaterial({
        name: "Water-Resistant Laminate",
        type: "laminate",
        brand: "DuraFloor",
        color: "Rustic Hickory",
        thickness: "12mm",
        width: "7.5 inch",
        length: "48 inch",
        unitPrice: "3.49",
        unitType: "sqft",
        description: "Water-resistant laminate with realistic wood grain texture. Easy click-lock installation.",
        imageUrl: "https://example.com/images/laminate-hickory.jpg",
        inStock: true
      });
      
      // Vinyl flooring
      await storage.createFlooringMaterial({
        name: "Luxury Vinyl Plank",
        type: "vinyl",
        brand: "StoneCore",
        color: "Weathered Gray",
        thickness: "5mm",
        width: "7 inch",
        length: "48 inch",
        unitPrice: "4.99",
        unitType: "sqft",
        description: "100% waterproof luxury vinyl with realistic stone texture. Ideal for bathrooms and kitchens.",
        imageUrl: "https://example.com/images/vinyl-stone.jpg",
        inStock: true
      });
      
      await storage.createFlooringMaterial({
        name: "Sheet Vinyl",
        type: "vinyl",
        brand: "FlexiFloor",
        color: "Marble White",
        thickness: "2.5mm",
        width: "12 feet",
        length: "Custom Cut",
        unitPrice: "2.99",
        unitType: "sqft",
        description: "Budget-friendly sheet vinyl with marble pattern. Easy maintenance and water resistant.",
        imageUrl: "https://example.com/images/vinyl-sheet.jpg",
        inStock: true
      });
      
      // Tile flooring
      await storage.createFlooringMaterial({
        name: "Ceramic Tile",
        type: "tile",
        brand: "TileWorks",
        color: "Desert Sand",
        thickness: "10mm",
        width: "12 inch",
        length: "12 inch",
        unitPrice: "5.49",
        unitType: "sqft",
        description: "Durable ceramic tile suitable for high traffic areas. Stain and scratch resistant.",
        imageUrl: "https://example.com/images/ceramic-tile.jpg",
        inStock: true
      });
      
      // Carpet
      await storage.createFlooringMaterial({
        name: "Plush Carpet",
        type: "carpet",
        brand: "SoftStep",
        color: "Coastal Beige",
        thickness: "0.5 inch",
        width: "12 feet",
        length: "Custom Cut",
        unitPrice: "3.99",
        unitType: "sqft",
        description: "Soft and comfortable plush carpet. Stain-resistant and easy to clean.",
        imageUrl: "https://example.com/images/plush-carpet.jpg",
        inStock: true
      });
    } else {
      console.log("Flooring materials already exist, skipping creation");
    }
    
    // Check if test contact already exists
    let contact = await storage.getContactByEmail("john.smith@example.com");
    
    // Create test contact if it doesn't exist
    if (!contact) {
      console.log("Creating test contact...");
      contact = await storage.createContact({
        companyName: "Home Sweet Home",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "555-123-4567",
        type: "customer"
      });
    } else {
      console.log("Test contact already exists, skipping creation");
    }

    // Check if test quote already exists
    const existingQuotes = await storage.getQuotesByContact(contact.id);
    
    // Create test quote if none exists for this contact
    if (!existingQuotes || existingQuotes.length === 0) {
      console.log("Creating test quote...");
      const quote = await storage.createQuote({
        contactId: contact.id,
        total: "8450",
        status: "accepted",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
      });

      // Create test quote items with flooring-specific details
      await storage.createQuoteItem({
        quoteId: quote.id,
        description: "Luxury Vinyl Plank Installation - Living Room",
        materialType: "vinyl",
        serviceType: "installation",
        roomName: "Living Room",
        width: "15",
        length: "18",
        sqft: "270",
        unitPrice: "4.99",
        quantity: 1,
        notes: "Remove existing carpet before installation."
      });

      await storage.createQuoteItem({
        quoteId: quote.id,
        description: "Carpet Removal - Living Room",
        materialType: "carpet",
        serviceType: "removal",
        roomName: "Living Room",
        width: "15",
        length: "18",
        sqft: "270",
        unitPrice: "1.50",
        quantity: 1,
        notes: "Includes disposal of old carpet and padding."
      });

      await storage.createQuoteItem({
        quoteId: quote.id,
        description: "Subfloor Preparation",
        materialType: "other",
        serviceType: "subfloor_prep",
        roomName: "Living Room",
        sqft: "270",
        unitPrice: "2.00",
        quantity: 1,
        notes: "Includes leveling and sealing subfloor."
      });

      // Create test contract
      const contract = await storage.createContract({
        quoteId: quote.id,
        signedUrl: "https://example.com/signed-contract.pdf",
        status: "active"
      });

      // Create test invoice
      await storage.createInvoice({
        contractId: contract.id,
        amountDue: "4225",
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: "sent"
      });

      // Create test job with flooring-specific details
      const job = await storage.createJob({
        contractId: contract.id,
        title: "Living Room Floor Installation",
        siteAddress: "123 Main St, Suite 4, Boston, MA",
        stage: "in_progress",
        startDate: new Date(new Date().setDate(new Date().getDate() - 3)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        totalSqft: "270",
        primaryFlooringType: "vinyl",
        requiresSubfloorPrep: true,
        hasExistingFlooringRemoval: true,
        specialInstructions: "Customer has pets - ensure all doors remain closed during work."
      });

      // Create test notes
      await storage.createNote({
        jobId: job.id,
        createdBy: "1", // Default admin user
        content: "Completed carpet removal today. Found some moisture issues in the subfloor that will need to be addressed before vinyl installation."
      });

      // Create test file
      await storage.createFile({
        jobId: job.id,
        url: "https://example.com/files/floor-plan.pdf",
        filename: "Living_Room_Floor_Plan.pdf",
        filesize: 1200000, // 1.2 MB
        mimetype: "application/pdf",
        label: "Floor Plan",
        uploadedBy: "1" // Default admin user
      });
      
      // Create a portal token
      await storage.createPortalToken({
        jobId: job.id,
        token: "test-portal-token-123",
        expiresAt: new Date(new Date().setDate(new Date().getDate() + 30))
      });

      // Create more test jobs with flooring-specific details
      const anotherContact = await storage.createContact({
        companyName: "Modern Living",
        firstName: "Emma",
        lastName: "Johnson",
        email: "emma.johnson@example.com",
        phone: "555-987-6543",
        type: "customer"
      });

      const anotherQuote = await storage.createQuote({
        contactId: anotherContact.id,
        total: "6450",
        status: "accepted",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
      });
      
      await storage.createQuoteItem({
        quoteId: anotherQuote.id,
        description: "Ceramic Tile Installation - Master Bathroom",
        materialType: "tile",
        serviceType: "installation",
        roomName: "Master Bathroom",
        width: "8",
        length: "10",
        sqft: "80",
        unitPrice: "12.50",
        quantity: 1,
        notes: "Includes tile, grout, and installation."
      });

      const anotherContract = await storage.createContract({
        quoteId: anotherQuote.id,
        signedUrl: "https://example.com/signed-contract-2.pdf",
        status: "active"
      });

      await storage.createJob({
        contractId: anotherContract.id,
        title: "Bathroom Tile Installation",
        siteAddress: "456 Park Ave, Apt 7B, Boston, MA",
        stage: "finishing",
        startDate: new Date(new Date().setDate(new Date().getDate() - 14)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        totalSqft: "80",
        primaryFlooringType: "tile",
        requiresSubfloorPrep: true,
        hasExistingFlooringRemoval: true,
        specialInstructions: "Need to protect new vanity during installation."
      });

      // Create a third job
      const thirdContact = await storage.createContact({
        companyName: "",
        firstName: "Mike",
        lastName: "Davis",
        email: "mike.davis@example.com",
        phone: "555-555-5555",
        type: "customer"
      });

      const thirdQuote = await storage.createQuote({
        contactId: thirdContact.id,
        total: "12800",
        status: "accepted",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
      });
      
      await storage.createQuoteItem({
        quoteId: thirdQuote.id,
        description: "Oak Hardwood Flooring - Entire House",
        materialType: "hardwood",
        serviceType: "installation",
        roomName: "Entire House",
        sqft: "1200",
        unitPrice: "8.99",
        quantity: 1,
        notes: "Premium oak hardwood throughout main level."
      });
      
      await storage.createQuoteItem({
        quoteId: thirdQuote.id,
        description: "Trim Work",
        materialType: "hardwood",
        serviceType: "trim_work",
        roomName: "Entire House",
        unitPrice: "950",
        quantity: 1,
        notes: "Includes quarter round and transition pieces."
      });

      const thirdContract = await storage.createContract({
        quoteId: thirdQuote.id,
        signedUrl: "https://example.com/signed-contract-3.pdf",
        status: "active"
      });

      await storage.createJob({
        contractId: thirdContract.id,
        title: "Whole House Hardwood Installation",
        siteAddress: "789 Lake Dr, Framingham, MA",
        stage: "materials_ordered",
        startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 12)),
        totalSqft: "1200",
        primaryFlooringType: "hardwood",
        requiresSubfloorPrep: false,
        hasExistingFlooringRemoval: false,
        specialInstructions: "New construction - hardwood to be installed after cabinets."
      });

      // Create messages
      await storage.createMessage({
        contactId: contact.id,
        subject: "Question about vinyl flooring",
        body: "Hi, I'm wondering if the luxury vinyl is suitable for homes with pets?",
        type: "email",
        direction: "inbound",
        readStatus: true
      });

      await storage.createMessage({
        contactId: anotherContact.id,
        subject: "Tile grout selection",
        body: "Can we switch to the darker grout color we discussed?",
        type: "email",
        direction: "inbound",
        readStatus: false
      });
      
      // Create some pending quotes
      const leadContact = await storage.createContact({
        companyName: "",
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@example.com",
        phone: "555-111-2222",
        type: "lead"
      });

      // Create a draft quote with flooring details
      const draftQuote = await storage.createQuote({
        contactId: leadContact.id,
        total: "5200",
        status: "draft",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
      });
      
      await storage.createQuoteItem({
        quoteId: draftQuote.id,
        description: "Luxury Vinyl Plank - Kitchen",
        materialType: "vinyl",
        serviceType: "installation",
        roomName: "Kitchen",
        width: "12",
        length: "14",
        sqft: "168",
        unitPrice: "4.99",
        quantity: 1,
        notes: "Stone-look vinyl with waterproof core."
      });
      
      await storage.createQuoteItem({
        quoteId: draftQuote.id,
        description: "Removal of Existing Tile",
        materialType: "tile",
        serviceType: "removal",
        roomName: "Kitchen",
        sqft: "168",
        unitPrice: "3.50",
        quantity: 1,
        notes: "Includes disposal of old tile and adhesive removal."
      });
    } else {
      console.log("Test quote already exists, skipping creation");
    }

  } catch (error) {
    console.error("Failed to create test data:", error);
  }
}