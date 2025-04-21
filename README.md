# Contractor Management Portal

A comprehensive contractor management platform designed to streamline client interactions, project tracking, and business operations through an integrated software solution.

## Features

- **Contact Management**: Store and manage leads, customers, and suppliers with detailed information
- **Portal Access**: Generate client-specific portal access to allow customers to view their projects
- **Quote Management**: Create and manage detailed quotes with line items
- **Contract Handling**: Generate contracts from approved quotes
- **Job Tracking**: Monitor job status, schedules, and progress
- **Invoice Management**: Create and track invoices linked to contracts and jobs
- **File Storage**: Upload and share files related to specific jobs
- **Messaging**: Communicate with clients through an integrated messaging system
- **Client Portal**: Allow clients to view job progress, files, and communicate with you

## Technical Details

- **Frontend**: React with TypeScript, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Updates**: WebSockets for live notifications and messaging
- **Authentication**: Custom portal access system for clients and standard auth for staff

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure the database connection in the environment variables
4. Start the development server: `npm run dev`

## Portal Access

The system allows contractors to create portal access for clients with a simple click. Clients can then:

1. Log in to view their projects
2. See all job-related information
3. Access files and documents
4. Communicate with the contractor
5. View quotes, contracts, and invoices

## Development Notes

This project is actively being developed. The current focus is on implementing and refining the client portal experience.