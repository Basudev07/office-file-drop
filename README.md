# 📤 Office File Drop

> **Instant, zero-login peer-to-desk file and raw text transfers via permanent QR standee.**  
> Built for seamless office collaboration without friction, email attachments, or messaging clutter.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Edge%20Deployed-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![Creator](https://img.shields.io/badge/Author-©%20BASUDEV-indigo)](https://github.com/Basudev07)

---

## ✨ Features

- **Sender Direct Landing (`/upload`)**:
  Colleagues scanning your desk QR standee or opening your link land directly on the sleek Drop Page. They never see receiver controls, admin switchers, or other colleagues' files.

- **Instant Direct Downloads**:
  Clicking "Download" fetches the file blob client-side and triggers an instant native download directly to your device's Downloads folder (no unwanted new tabs).

- **Raw Text Drop (100% Format Preservation)**:
  Drop raw text notes, code snippets, logs, or credentials of any length with strict preservation of whitespace, line breaks, indentation, and tabs. Includes live character/byte counters and 1-click clipboard paste.

- **1-Click Office Printing**:
  Print incoming documents, PDFs, images, and raw text notes directly to connected office printers without manual opening or converting.

- **Batch ZIP Downloading**:
  Download all files sent by a specific colleague as a single packaged `.zip` archive with 1 click.

- **Printable Desk QR Standee**:
  Built-in print layout formats an elegant desk standee with instructions and a high-resolution QR code, ready to print and display at your workstation.

- **Receiver Station Privacy & Security**:
  The Receiver Dashboard is strictly guarded by Supabase Authentication. Unauthenticated senders cannot query or access receiver records over the network.

- **Super Mobile-Responsive**:
  Optimized for screens from 360px smartphones to 4K desk monitors with touch-friendly toolbars, fluid typography, and glassmorphism aesthetics.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Lucide Icons, Canvas Confetti
- **Styling**: Vanilla CSS Design System with dark tech glassmorphism theme
- **Backend & Database**: Supabase PostgreSQL + Realtime WebSockets
- **Storage**: Supabase S3-compatible Object Storage Bucket (`office_files`)
- **Archiving & QR**: JSZip, node-qrcode

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Basudev07/office-file-drop.git
cd office-file-drop
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

### 3. Setup Supabase Database & Storage

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)** > **SQL Editor**.
2. Run the provided [`supabase_schema.sql`](./supabase_schema.sql) script. This configures:
   - `office_files` table with 24-hour auto-expiration
   - Row-Level Security (RLS) policies for anonymous sender drops and authenticated receiver management
   - `office_files` public storage bucket
   - Real-time WebSocket replication

### 4. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Free 0-Cold-Start Deployment (Vercel)

This application is designed as a client-side Single Page App (SPA) connected to Supabase serverless services. Hosting on an Edge CDN guarantees **0 second cold starts** and **sub-second page loads**:

1. Push your code to **GitHub**.
2. Go to **[Vercel](https://vercel.com)** > **"Add New Project"** and import the repository.
3. Vercel automatically detects **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add your Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

> Pre-configured with [`vercel.json`](./vercel.json) and [`public/_redirects`](./public/_redirects) for instant SPA routing and clean URL refreshes.

---

## 👥 How to Use

### For Senders (Colleagues)

1. Scan the desk QR standee or open the office link.
2. Enter your name or department.
3. Choose files/photos or switch to **Drop Raw Text**.
4. Click **Send** — transfer arrives on the desk receiver's monitor instantly.

### For Receiver (Desk Owner)

1. Click the discreet **Desk Owner** button in the navbar.
2. Sign in with your Supabase receiver credentials.
3. View real-time incoming drops, preview files, print directly, or download all files as a ZIP.
4. Click **Desk QR** to display or print your desk standee.

---

## 📄 License & Attribution

Designed & Developed with visual excellence by **BASUDEV**.  
Attribution: `© BASUDEV`
