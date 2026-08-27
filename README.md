# InvoiceGen

InvoiceGen is a web application for creating, managing, and exporting professional invoices. It is designed for freelancers, agencies, and small businesses that need a simple way to keep client and invoice information organized.

## Features

- Email/password authentication with password reset support
- Dashboard with invoice totals, statuses, and recent invoices
- Business profile with contact details, tax number, and logo
- Client management with contact and address information
- Invoice creation and editing with:
  - Multiple line items
  - Quantity, unit price, tax, and discount calculations
  - Issue date, due date, currency, status, notes, terms, and payment instructions
- Invoice history with view, edit, duplicate, and delete actions
- Invoice preview and client-side PDF download
- Row-level security so users can access only their own data

## Tech stack

- React 19 and TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase Authentication, PostgreSQL, Row Level Security, and Storage
- jsPDF for invoice PDF generation
- React Hook Form and Zod for form handling and validation

## Getting started

### Prerequisites

- Node.js 18 or newer
- A Supabase project

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   copy .env.example .env
   ```

3. Add your Supabase project values to `.env`:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. In the Supabase SQL Editor, run [`supabase-schema.sql`](./supabase-schema.sql). This creates the application tables, the private `business-logos` storage bucket, row-level security policies, and supporting triggers.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open the local URL printed by Vite.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Application routes

Public routes:

- `/` - Landing page
- `/signin` - Sign in
- `/signup` - Create an account
- `/forgot-password` - Request a password reset
- `/reset-password` - Set a new password

Authenticated routes are under `/app`:

- `/app/dashboard` - Dashboard
- `/app/invoices` - Invoice history
- `/app/invoices/create` - Create an invoice
- `/app/clients` - Client management
- `/app/business-profile` - Business profile
- `/app/settings` - Account settings

## Project structure

```text
src/
├── components/    Reusable UI and layout components
├── contexts/      Authentication context
├── lib/           Supabase client
├── pages/         Public and authenticated pages
├── routes/        Protected route handling
├── services/      Supabase and PDF service functions
├── types/         Shared TypeScript types
└── utils/         Invoice calculations and formatting helpers
```

## Security notes

The Supabase anon key is intended for use in the browser. Do not put a Supabase service-role key or other private credentials in `.env` variables prefixed with `VITE_`. Keep row-level security enabled in Supabase and apply the policies in [`supabase-schema.sql`](./supabase-schema.sql).
