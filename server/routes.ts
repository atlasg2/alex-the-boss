import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertContactSchema, insertQuoteSchema, insertQuoteItemSchema, 
  insertContractSchema, insertInvoiceSchema, insertJobSchema,
  insertFileSchema, insertMessageSchema, insertNoteSchema, insertPortalTokenSchema
} from "@shared/schema";
import { z } from "zod";
import { hashPassword, comparePasswords } from './utils/auth';
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
      
      const contactData = insertContactSchema.parse(req.body);
      console.log("Contact data passed validation:", contactData);
      
      const contact = await storage.createContact(contactData);
      console.log("Contact created successfully:", contact);
      
      res.status(201).json(contact);
    } catch (error) {
      console.error("Contact creation error:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", error.errors);
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to create contact" });
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
      const quoteData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quote" });
    }
  });
  
  app.put("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quoteData = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(req.params.id, quoteData);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update quote" });
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
  
  // Create test data
  await createTestData();

  return server;
}

async function createTestData() {
  try {
    // Create test contact
    const contact = await storage.createContact({
      companyName: "Home Sweet Home",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      phone: "555-123-4567",
      type: "customer"
    });

    // Create test quote
    const quote = await storage.createQuote({
      contactId: contact.id,
      total: "24500",
      status: "accepted",
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    // Create test quote items
    await storage.createQuoteItem({
      quoteId: quote.id,
      description: "Kitchen cabinets installation",
      sqft: "200",
      unitPrice: "75",
      quantity: 1
    });

    await storage.createQuoteItem({
      quoteId: quote.id,
      description: "Countertop installation",
      sqft: "40",
      unitPrice: "150",
      quantity: 1
    });

    await storage.createQuoteItem({
      quoteId: quote.id,
      description: "Backsplash tiling",
      sqft: "30",
      unitPrice: "125",
      quantity: 1
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
      amountDue: "12250",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      status: "sent"
    });

    // Create test job
    const job = await storage.createJob({
      contractId: contract.id,
      title: "Kitchen Renovation",
      siteAddress: "123 Main St, Suite 4, Boston, MA",
      stage: "in_progress",
      startDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    // Create test notes
    await storage.createNote({
      jobId: job.id,
      createdBy: "1", // Default admin user
      content: "Demolition phase completed today. Old cabinets and countertops removed. Plumbing and electrical work to begin tomorrow."
    });

    // Create test file
    await storage.createFile({
      jobId: job.id,
      url: "https://example.com/files/kitchen-design.pdf",
      filename: "Kitchen_Design_Final.pdf",
      filesize: 2400000, // 2.4 MB
      mimetype: "application/pdf",
      label: "Kitchen Design",
      uploadedBy: "1" // Default admin user
    });
    
    // Create a portal token
    await storage.createPortalToken({
      jobId: job.id,
      token: "test-portal-token-123",
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    // Create more test jobs
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
      total: "18700",
      status: "accepted",
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    const anotherContract = await storage.createContract({
      quoteId: anotherQuote.id,
      signedUrl: "https://example.com/signed-contract-2.pdf",
      status: "active"
    });

    await storage.createJob({
      contractId: anotherContract.id,
      title: "Bathroom Remodel",
      siteAddress: "456 Park Ave, Apt 7B, Boston, MA",
      stage: "finishing",
      startDate: new Date(new Date().setDate(new Date().getDate() - 14)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7))
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
      total: "9200",
      status: "accepted",
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    const thirdContract = await storage.createContract({
      quoteId: thirdQuote.id,
      signedUrl: "https://example.com/signed-contract-3.pdf",
      status: "active"
    });

    await storage.createJob({
      contractId: thirdContract.id,
      title: "Deck Installation",
      siteAddress: "789 Lake Dr, Framingham, MA",
      stage: "materials_ordered",
      startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 28))
    });

    // Create messages
    await storage.createMessage({
      contactId: contact.id,
      subject: "Question about kitchen cabinets",
      body: "Hi, I'm wondering what brand of cabinets you'll be installing?",
      type: "email",
      direction: "inbound",
      readStatus: true
    });

    await storage.createMessage({
      contactId: anotherContact.id,
      subject: "Bathroom tile selection",
      body: "Can we switch to the porcelain tiles we discussed?",
      type: "email",
      direction: "inbound",
      readStatus: false
    });
    
    // Create some pending quotes
    await storage.createContact({
      companyName: "",
      firstName: "Sarah",
      lastName: "Wilson",
      email: "sarah.wilson@example.com",
      phone: "555-111-2222",
      type: "lead"
    });

    // Create 5 quotes in "draft" status
    for (let i = 1; i <= 5; i++) {
      await storage.createQuote({
        contactId: contact.id,
        total: `${5000 + (i * 1000)}`,
        status: "draft",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
      });
    }

  } catch (error) {
    console.error("Failed to create test data:", error);
  }
}