# Excellence Furnishing — Project Intelligence Guide

> **GEMINI.md** — The single source of truth for all agents working on this project.
> Every agent MUST read this file before performing any work.

---

## 🏢 Business Identity

| Field | Value |
|---|---|
| **Business Name** | Excellence The Furnishing Gallery |
| **Proprietor** | Mr. Altab Chauhan |
| **Key Staff** | Mr. Altamash, Mr. Alim |
| **Established** | 2003 (23+ years) |
| **Address** | Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Station, Andheri West, Mumbai — 400058 |
| **Landmark** | Next to Cafe Arfa, near Fish Market / Navneeth Colony |
| **Hours** | Mon–Sun, 10:00 AM – 9:30 PM |
| **Instagram** | [@excellence_furnishing](https://www.instagram.com/excellence_furnishinggallery/) |
| **Rating** | 4.3 / 5.0 (113+ verified reviews) |
| **Tagline** | *"Where Every Thread Tells a Story of Excellence"* |

---

## 🎨 Brand Identity & Theme

### Color Palette
The brand identity draws from premium furnishing aesthetics and the business card/marketing materials:

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Deep Royal Gold | `#B8860B` | Headers, CTAs, premium accents |
| Primary Dark | Rich Espresso | `#2C1810` | Text, nav, footers |
| Secondary | Warm Ivory | `#FAF3E0` | Backgrounds, cards |
| Accent | Burgundy Wine | `#722F37` | Highlights, badges, sale tags |
| Neutral Light | Pearl White | `#F8F6F3` | Page backgrounds |
| Neutral Dark | Charcoal | `#333333` | Body text |
| Success | Forest Green | `#2E7D32` | Confirmations, stock indicators |
| CTA Gradient | Gold→Burgundy | `#B8860B → #722F37` | Primary action buttons |

### Typography
- **Display / Headings:** Playfair Display (serif) — luxury & elegance
- **Body / UI:** Inter or DM Sans (sans-serif) — crisp readability
- **Accent / Logo:** Cormorant Garamond — refinement

### Design Philosophy
- Premium, warm, tactile — like walking into a high-end furnishing gallery
- Generous whitespace, large fabric imagery, subtle texture overlays
- Soft shadows, rounded corners (8px–16px), glass-morphism on modals
- Micro-animations: fabric drape effects on hover, smooth page transitions

---

## 🛍️ Product Categories (Exhaustive)

### A. Curtains & Window Treatments
- Sheer curtains (voile, organza, net)
- Heavy drapes (velvet, jacquard, brocade, silk blend)
- Blackout curtains (coated, triple-weave)
- Printed curtains (floral, geometric, abstract)
- Roman blinds, roller blinds, vertical blinds
- Custom-stitched options:
  - Heading styles: Eyelet, Pinch Pleat (single/double/triple), Wave/S-Fold, Tab Top, Rod Pocket, Goblet Pleat, Box Pleat
  - Lining: Unlined, Cotton-lined, Blackout-lined, Thermal-lined
  - Motorization: Manual / Motorized (Somfy, generic)

### B. Sofa Upholstery Fabrics
- PU Leather / Rexine
- Velvet (plain, crushed, embossed)
- Jacquard weaves
- Suede & microfiber
- Cotton blends & linen
- Heavy-duty commercial-grade
- Custom sofa reupholstering service

### C. Wallpapers
- PVC / Vinyl
- Non-woven
- Textured / Embossed / Metallic
- 3D wallpapers
- Custom designer murals
- Branded: Nilaya (Asian Paints), imported European rolls

### D. Mattresses & Sleep Solutions
- **Authorized Brands:** Refresh Mattress, Dr. Ortho, Dunlop, Kurlon
- Types: Latex, Memory Foam, Spring, Gel-Based, Coir, Orthopedic
- Custom sizing for non-standard beds
- Sofa-Cum-Bed mattresses

### E. Bedding & Accessories
- Bedsheets, pillow covers, cushion covers
- Quilts, comforters, duvets
- Mattress protectors

### F. Home Decor
- Carpets & rugs
- Headboards
- Mosquito nets (custom-fitted)
- Artificial turf
- Decorative items

---

## 💰 Pricing Reference (Mumbai Market Rates)

### Curtain Fabric (per meter)
| Tier | Range |
|---|---|
| Budget / Wholesale | ₹150 – ₹450 |
| Mid-Range Branded | ₹500 – ₹1,200 |
| Premium / Designer / Imported | ₹1,500 – ₹3,500+ |
| Blackout Fabrics | ₹400 – ₹1,500 |

### Stitching Charges (per meter of fabric)
| Style | Range |
|---|---|
| Basic Eyelet / Rod Pocket | ₹100 – ₹250 |
| Advanced Pleating (Pinch/Box) | +₹100 – ₹250 extra |
| Lining addition | +30%–50% surcharge |

### Sofa Upholstery
| Item | Range |
|---|---|
| Labor (3-seater) | ₹2,500 – ₹6,000 |
| Labor (per seat) | ₹800 – ₹1,500 |
| PU Leather / Rexine fabric | ₹300 – ₹700/m |
| Jacquard / Velvet / Suede | ₹800 – ₹2,500+/m |
| HD Foam replacement | ₹1,500 – ₹4,500 |

### Wallpaper
| Type | Range |
|---|---|
| Economy (PVC/NW import) | ₹1,200 – ₹2,500/roll |
| Branded / Textured | ₹3,000 – ₹7,000+/roll |
| Custom Murals | ₹90 – ₹250+/sq.ft |
| Installation charges | ₹15 – ₹30/sq.ft |

---

## 🏗️ Technical Architecture

### Tech Stack (Google Ecosystem Optimized)

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 14+ (App Router)                       │
│  TypeScript · Tailwind CSS · Shadcn/UI          │
│  Framer Motion (animations)                      │
│  React Hook Form + Zod (validation)             │
│  Zustand (state management)                      │
│  next-auth / Firebase Auth                       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│                   BACKEND                        │
│  Next.js API Routes (Server Actions)            │
│  Firebase Admin SDK                              │
│  Gemini API (AI Visualizer)                      │
│  PDF generation (jsPDF / @react-pdf/renderer)   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│                 DATA LAYER                       │
│  Cloud Firestore (primary DB)                   │
│  Firebase Storage (images, swatches, uploads)   │
│  Firebase Auth (admin/user roles)               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│               DEPLOYMENT                         │
│  Firebase App Hosting → Cloud Run               │
│  Cloud CDN (static assets)                      │
│  Google Cloud Build (CI/CD)                      │
└─────────────────────────────────────────────────┘
```

### Firestore Schema (Top-Level Collections)

```
/users/{userId}
  - name, email, phone, role ("admin"|"user"), createdAt, address

/clients/{clientId}
  - name, phone, email, address, projectAddress
  - notes, tags[], createdAt, updatedAt
  - /rooms/{roomId}
      - type ("master_bedroom"|"living_room"|...), name, photos[]
      - /measurements/{measurementId}
          - productType ("curtain"|"wallpaper"|"upholstery")
          - dimensions { width, height, unit }
          - configuration { headingStyle, liningType, motorized, ... }
          - fabricId (ref), quantity, pricePerMeter
          - totalEstimate, notes, createdAt

/products/{productId}
  - name, category, subcategory, description
  - pricePerUnit, unit ("meter"|"roll"|"piece"|"sq.ft")
  - images[], swatchImage, colors[], patterns[], materials[]
  - tags[], stock, brand, isActive
  - metadata { weight, width, composition }

/orders/{orderId}
  - clientId (ref), userId (ref)
  - items[] { productId, quantity, configuration, unitPrice, lineTotal }
  - subtotal, discount, tax, grandTotal
  - status ("draft"|"confirmed"|"in_production"|"ready"|"delivered"|"cancelled")
  - paymentStatus ("pending"|"partial"|"paid")
  - payments[] { amount, method, date, receiptUrl }
  - deliveryAddress, notes, createdAt, updatedAt

/invoices/{invoiceId}
  - orderId (ref), clientId (ref)
  - invoiceNumber (auto-generated: EF-2026-XXXXX)
  - items[], subtotal, discount, tax (GST breakdown), grandTotal
  - status ("draft"|"sent"|"paid"|"overdue"|"cancelled")
  - dueDate, paidDate, pdfUrl
  - createdAt

/visualizations/{vizId}
  - userId (ref), roomImageUrl, swatchImageUrl
  - resultImageUrl, productId, status, createdAt

/analytics/{docId}
  - dailySales, monthlySales, topProducts, clientActivity
```

### Authentication & Authorization Flow

```
Login Page
  ├── Email + Password → Firebase Auth
  │     ├── Check custom claims: { role: "admin" } → Admin Dashboard
  │     └── Check custom claims: { role: "user" }  → User Portal
  └── Home Page (public, no auth required)
        ├── Browse Products
        ├── View Gallery
        ├── Business Info / Contact
        └── Login/Register CTA
```

### Key Pages & Routes

```
PUBLIC (No Auth):
  /                         → Landing / Home (advertising page)
  /products                 → Product Catalog (browseable)
  /products/[id]            → Product Detail
  /about                    → About Us / Story
  /contact                  → Contact & Map
  /gallery                  → Showroom Gallery

AUTH REQUIRED — USER PORTAL:
  /dashboard                → User Dashboard (My Orders, Profile)
  /dashboard/orders         → Order History & Tracking
  /dashboard/orders/[id]    → Order Detail + Invoice Download
  /dashboard/visualizer     → AI Fabric Visualizer
  /dashboard/profile        → Edit Profile

AUTH REQUIRED — ADMIN PANEL:
  /admin                    → Admin Dashboard (Analytics Overview)
  /admin/clients            → Client CRM List
  /admin/clients/new        → Add New Client
  /admin/clients/[id]       → Client Detail + Rooms + Measurements
  /admin/clients/[id]/measure → New Measurement Form
  /admin/products           → Product Management (CRUD)
  /admin/products/new       → Add Product
  /admin/products/[id]/edit → Edit Product
  /admin/orders             → All Orders Management
  /admin/orders/new         → Create Order (from measurement sheet)
  /admin/orders/[id]        → Order Detail + Status Update
  /admin/invoices           → Invoice Management
  /admin/invoices/[id]      → Invoice Detail + PDF Generation
  /admin/analytics          → Sales & Performance Analytics
  /admin/settings           → Business Settings, Tax, Pricing Rules
```

---

## 🤖 AI Visualizer — Technical Spec

### Flow
1. User uploads **Room Photo** (JPEG/PNG, max 10MB)
2. User uploads or selects **Fabric Swatch** from catalog
3. Frontend sends both to `/api/visualize` endpoint
4. Backend calls Gemini API (multimodal) with structured prompt:
   - "Apply this fabric/wallpaper swatch to the window/wall area in this room photo, maintaining perspective, lighting, and shadows"
5. Returns generated mockup image
6. Result saved to Firebase Storage, reference saved to Firestore

### Frontend UX
- Split-screen: Left = Room upload zone, Right = Swatch selector
- Drag-and-drop with preview thumbnails
- "Visualize My Space" CTA button with loading skeleton
- Result overlay with before/after slider comparison
- Save & share functionality

---

## 📐 Measurement & CRM Module — Technical Spec

### Workflow
1. **Select/Add Client** → Search existing or create new profile
2. **Select Room** → Visual grid (Living Room, Master Bedroom, etc.)
3. **Select Product Type** → Curtain / Wallpaper / Upholstery
4. **Dynamic Config Form** (per product type):
   - **Curtains:** Track width, drop length, fullness ratio, heading style, lining, motorization, number of panels
   - **Wallpaper:** Wall dimensions (H × W), pattern repeat, coverage calculation
   - **Upholstery:** Furniture type, seat count, foam grade, fabric quantity estimate
5. **Auto-Calculate** → Fabric required + stitching + installation = preliminary quote
6. **Generate** → Digital measurement sheet (PDF) + save to Firestore
7. **Convert** → One-click convert measurement to Order → Invoice

---

## 🧾 Invoice Generation — Technical Spec

### Invoice Fields
- Auto-incrementing number: `EF-{YEAR}-{5-digit}`
- Client details, order items with quantities and rates
- Subtotal, Discount (% or flat), GST breakdown (CGST + SGST or IGST)
- Grand Total, Payment terms, Due date
- Business header with logo, address, GSTIN
- PDF export with professional layout
- Email/WhatsApp share capability

---

## 🚀 Deployment Target

- **Primary:** Firebase App Hosting (auto-deploys to Cloud Run)
- **Domain:** Custom domain via Firebase Hosting
- **CI/CD:** GitHub → Cloud Build → Firebase deploy
- **Environment Variables:**
  - `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
  - `FIREBASE_ADMIN_*` — Service account credentials
  - `GEMINI_API_KEY` — For AI Visualizer
  - `NEXT_PUBLIC_APP_URL` — Base URL

---

## 📋 Agent Responsibilities

### 1. Product Strategist Agent
**Scope:** Business logic, data architecture, and product catalog design
- Define and validate the complete Firestore schema
- Create seed data scripts for all product categories
- Design the pricing engine (fabric cost × quantity + stitching + installation)
- Map business workflows to technical requirements
- Define user stories and acceptance criteria for each feature
- Create the measurement-to-order-to-invoice pipeline logic

### 2. UI/UX Stitch Designer Agent
**Scope:** Design system, component library, and all visual assets
- Use Google Stitch MCP to generate component designs
- Create the Tailwind + Shadcn/UI design system configuration
- Design responsive layouts for all pages (mobile-first)
- Create the "Shop the Room" interactive component
- Design the AI Visualizer split-screen interface
- Design the measurement form with dynamic sections
- Design the invoice PDF template
- Create loading states, skeleton loaders, micro-animations
- Ensure WCAG 2.1 AA accessibility compliance

### 3. Full-Stack & Gemini Architect Agent
**Scope:** All application code — frontend, backend, API, auth, and AI integration
- Initialize the Next.js project with TypeScript, Tailwind, Shadcn/UI
- Implement Firebase Auth with role-based access (admin/user)
- Build all page routes and components
- Implement Firestore CRUD operations with Admin SDK
- Build the measurement calculator engine
- Integrate Gemini API for AI Visualizer
- Build the invoice PDF generator
- Implement the product filtering engine (faceted search)
- Server-side rendering and optimization
- State management with Zustand
- Form validation with React Hook Form + Zod

### 4. QA & Cloud Run Guard Agent
**Scope:** Testing, quality assurance, deployment, and DevOps
- Write unit tests (Vitest) for business logic
- Write integration tests for API routes
- Write E2E tests (Playwright) for critical user flows
- Performance auditing (Lighthouse, Core Web Vitals)
- Security review (auth flows, Firestore rules, input sanitization)
- Dockerfile and Cloud Run configuration
- Firebase security rules for Firestore and Storage
- CI/CD pipeline configuration
- Environment variable management
- Error monitoring setup

---

## 📁 Project Structure

```
excellence-furnishing/
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── rooms/           # Room type icons
│   │   ├── banners/         # Hero & promotional banners
│   │   └── gallery/         # Showroom photos
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (public)/        # Public pages group
│   │   │   ├── page.tsx     # Landing / Home
│   │   │   ├── products/
│   │   │   ├── gallery/
│   │   │   ├── about/
│   │   │   └── contact/
│   │   ├── (auth)/          # Auth pages group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/       # User portal (protected)
│   │   │   ├── page.tsx
│   │   │   ├── orders/
│   │   │   ├── visualizer/
│   │   │   └── profile/
│   │   ├── admin/           # Admin panel (protected)
│   │   │   ├── page.tsx
│   │   │   ├── clients/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── invoices/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── clients/
│   │   │   ├── orders/
│   │   │   ├── invoices/
│   │   │   ├── visualize/
│   │   │   └── measurements/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # Shadcn/UI base components
│   │   ├── layout/          # Navbar, Sidebar, Footer
│   │   ├── home/            # Landing page sections
│   │   ├── products/        # Product cards, filters, grid
│   │   ├── measurement/     # Measurement form components
│   │   ├── visualizer/      # AI Visualizer components
│   │   ├── invoice/         # Invoice templates
│   │   ├── admin/           # Admin-specific components
│   │   └── shared/          # Reusable cross-cutting components
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts    # Client-side Firebase init
│   │   │   ├── admin.ts     # Server-side Admin SDK init
│   │   │   ├── auth.ts      # Auth helpers
│   │   │   └── firestore.ts # DB helpers
│   │   ├── gemini/
│   │   │   └── visualizer.ts # Gemini API integration
│   │   ├── pricing/
│   │   │   └── calculator.ts # Quote calculation engine
│   │   ├── pdf/
│   │   │   └── invoice.ts   # PDF generation
│   │   ├── validators/
│   │   │   └── schemas.ts   # Zod schemas
│   │   └── utils.ts
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── cart-store.ts
│   │   └── measurement-store.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── product.ts
│   │   ├── client.ts
│   │   ├── order.ts
│   │   ├── invoice.ts
│   │   └── measurement.ts
│   └── config/
│       ├── site.ts          # Site metadata & constants
│       └── navigation.ts    # Nav menu structure
├── scripts/
│   └── seed-data.ts         # Firestore seed script
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
├── firebase.json
├── firestore.rules
├── storage.rules
├── GEMINI.md               # ← This file
└── package.json
```

---

## ⚠️ Critical Rules for All Agents

1. **Always read this GEMINI.md first** before starting any task.
2. **Use TypeScript strictly** — no `any` types except where absolutely unavoidable.
3. **Mobile-first responsive design** — all components must work on 320px+ screens.
4. **Server Components by default** — use `"use client"` only when necessary.
5. **All Firestore operations** go through helper functions in `src/lib/firebase/`.
6. **Pricing calculations** must use the calculator engine, never inline math.
7. **All forms** use React Hook Form + Zod validation schemas.
8. **Indian Rupee (₹)** as the currency throughout. Use `Intl.NumberFormat('en-IN')`.
9. **GST compliance** — invoices must show CGST/SGST or IGST breakdowns.
10. **Image optimization** — use `next/image` with proper sizing and lazy loading.
11. **No hardcoded strings** for categories/types — use config constants from `src/config/`.
12. **Accessibility** — semantic HTML, ARIA labels, keyboard navigation, contrast ratios.
13. **Error boundaries** — every page/section should gracefully handle errors.
14. **Loading states** — every async operation should show appropriate feedback.
