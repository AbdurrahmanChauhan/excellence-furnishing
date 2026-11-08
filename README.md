# 👑 Excellence Furnishing — The Digital Gallery & Studio OS

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-302%2F302%20Pass-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg?style=for-the-badge)](LICENSE)

> *"Where Every Thread Tells a Story of Excellence"*

A comprehensive, production-grade enterprise e-commerce platform and client management portal built for **Excellence The Furnishing Gallery** — a premier 23-year-old physical interior design and furnishing gallery based in Andheri West, Mumbai.

This application pairs an open, high-converting consumer storefront with an internal operations suite for custom curtain tailoring, sofa reupholstery, wallpaper estimation, GST invoicing, and an AI-assisted virtual fitting room.

---

## 📑 Table of Contents

- [🏢 About the Business](#-about-the-business)
- [✨ Key Capabilities & Features](#-key-capabilities--features)
  - [1. Public-Facing Storefront](#1-public-facing-storefront)
  - [2. Role-Based Authentication & Navigation](#2-role-based-authentication--navigation)
  - [3. Custom Measurement & CRM Studio](#3-custom-measurement--crm-studio)
  - [4. AI Virtual Fitting Room (Fabric Visualizer)](#4-ai-virtual-fitting-room-fabric-visualizer)
  - [5. Order Management & Workshop Lifecycle](#5-order-management--workshop-lifecycle)
  - [6. Automated GST Tax Invoicing & PDF Engine](#6-automated-gst-tax-invoicing--pdf-engine)
  - [7. Customer Portal](#7-customer-portal)
- [📐 Pricing Engine Mathematical Formulas](#-pricing-engine-mathematical-formulas)
- [🏛️ System Architecture & Tech Stack](#️-system-architecture--tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [🔑 Demo Credentials & Accounts](#-demo-credentials--accounts)
- [🧪 Testing & Quality Verification](#-testing--quality-verification)
- [🛡️ Security, Validation & Compliance](#️-security-validation--compliance)

---

## 🏢 About the Business

| Attribute | Details |
| :--- | :--- |
| **Business Name** | Excellence The Furnishing Gallery |
| **Proprietor** | Mr. Altaf Chauhan |
| **Key Workshop Staff** | Mr. Altamash Chauhan, Mr. Ahmed |
| **Established** | 2003 (23+ Years in soft furnishings & interior decor) |
| **Physical Address** | Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Crossing, Andheri West, Mumbai, Maharashtra 400058 |
| **Landmarks** | Next to Cafe Arfa, Opp. Amboli Railway Crossing |
| **Contact Numbers** | **Mobile:** +91 91462 77255, +91 80975 86466, +91 91466 55990<br>**Landline:** 022-26798786, 26768786, 26760786 |
| **Email** | altamashchauhanexcellence@gmail.com |
| **GSTIN** | 27ANMPC9233E1Z1 |
| **Hours** | Mon–Sun: 10:00 AM – 9:30 PM |
| **Instagram** | [@excellence_furnishinggallery](https://www.instagram.com/excellence_furnishinggallery/) |
| **Reputation** | 4.3 / 5.0 Star Rating across 113+ verified public reviews |

---

## ✨ Key Capabilities & Features

### 1. Public-Facing Storefront
- **Unrestricted Access**: The landing page (`/`) serves as a 24/7 digital showroom and marketing storefront. Visitors can browse freely without being forced to authenticate.
- **Hero & Heritage Showcase**: High-resolution imagery, 23-year trust credentials, and store visit information.
- **IKEA-Style "Shop the Room" (`ShopTheRoom.tsx`)**: Interactive lifestyle living room and bedroom scenes with clickable pulse pins that open coordinate cards for exact fabrics and wallpapers.
- **Wayfair-Style Faceted Catalog (`/products`)**:
  - Filter across Category (Curtains, Upholstery, Wallpaper, Mattresses, Bedding, Decor), Subcategories, Materials (Velvet, Linen, Silk, PU Leather, Jacquard), Patterns (Geometric, Floral, Damask, Solid), Colors, and Price Range dual-sliders.
  - Debounced real-time search and instant mobile filter drawer.
- **Product Detail Views (`/products/[id]`)**: Swatch zoom, fabric width/weight specifications, care instructions, stock levels, and direct links into the AI Visualizer.
- **Marketing Pages**: `/about` (craftsman legacy), `/gallery` (curated installations), and `/contact` (interactive contact form + Mumbai landmark guide).

### 2. Role-Based Authentication & Navigation
- **Unified Auth Gateway (`/login` & `/register`)**: Automatically detects whether a user is an `admin` or standard customer (`user`) upon sign-in.
- **Edge Route Protection (`src/middleware.ts`)**:
  - Requests to `/admin/*` or `/dashboard/*` without authentication receive an immediate `HTTP 307 Temporary Redirect` to `/login?redirect=...`.
  - Customers attempting to access `/admin/*` routes are bounced back to their personal `/dashboard`.
- **Zustand Auth Store (`auth-store.ts`)**: State synchronizes with secure HTTP-only cookies and supports both live Firebase Auth credentials and an offline fallback for staging/demos.

### 3. Custom Measurement & CRM Studio
Designed specifically for interior designers and showroom sales staff:
- **Client Profiles (`/admin/clients`)**: Searchable client directory capturing Indian mobile numbers (`^[6-9]\d{9}$`), 6-digit PIN codes, project site addresses, and GSTINs.
- **Visual Room Selector**: 8 visual presets (*Master Bedroom, Living Room, Dining Room, Guest Room, Kids Room, Study, Home Office, Custom Space*).
- **5-Step Dynamic Measurement Wizard (`/admin/clients/[id]/measure`)**:
  - **Curtain Configuration**: Track/rod width, drop length, fullness ratio (1.5x, 2x, 2.5x), heading pleat styles (*Eyelet, Pinch Pleat Double/Triple, Wave/S-Fold, Box Pleat, Rod Pocket*), lining (*Unlined, 100% Cotton, Blackout 3-Pass*), and motorized tracks (*Somfy / Generic*).
  - **Wallpaper Configuration**: Wall height & width, pattern repeat allowance, usable roll coverage calculator.
  - **Upholstery Configuration**: Furniture type (1/2/3/L-Shape Seater), cushion counts, fabric requirements, and high-density foam replacement (*HD-40*).
- **Digital Cutting Sheet**: Generates exact fabric panel cuts, seam allowances, and hem requirements.
- **1-Click Order Conversion**: Instantly transforms an approved measurement quote into an active workshop order.

### 4. AI Virtual Fitting Room (Fabric Visualizer)
Available on `/dashboard/visualizer` and `/admin/visualizer`:
- **Dual-Input Interface**:
  - **Drop Zone 1**: Room or window photo upload (JPEG/PNG up to 10MB).
  - **Drop Zone 2**: Fabric swatch upload or one-click selection directly from the catalog.
- **Interactive Before/After Comparison Slider (`ComparisonSlider.tsx`)**: Side-by-side drag handle comparing original empty space with styled curtains or mapped wallpaper.
- **Multimodal AI Backend (`/api/visualize`)**: Powered by Google Gemini API (`gemini-2.0-flash-exp`) with a synthetic vector composite fallback for offline or unconfigured API keys.

### 5. Order Management & Workshop Lifecycle
- **Order State Machine (`/admin/orders`)**:
  $$\text{Draft} \longrightarrow \text{Confirmed} \longrightarrow \text{In Production} \longrightarrow \text{Ready for Dispatch} \longrightarrow \text{Delivered}$$
- **Payment Settlement**: Advance deposits and final balance logging with payment method tracking (*UPI, Bank NEFT, Cash, Credit Card*).
- **Financial Status Indicators**: Real-time badges for `Pending`, `Partial`, and `Paid`.

### 6. Automated GST Tax Invoicing & PDF Engine
- **Sequential Invoice Numbering**: Adheres to strict statutory format: `EF-YYYY-XXXXX` (e.g., `EF-2026-00042`).
- **GST Compliance**:
  - **Intra-State (Maharashtra)**: Splits tax into **CGST (9%) + SGST (9%)**.
  - **Inter-State**: Billed as **IGST (18%)**.
  - Calculations computed in integer paise to eliminate floating-point rounding errors.
- **Currency in Words**: Built-in Indian numbering converter (`convertRupeesToWords`) handling sums from ₹1 up to hundreds of Crores.
- **jsPDF Document Generation**: One-click printable and downloadable PDFs with store branding, HSN codes, and bank wire details.

### 7. Customer Portal
- **Dashboard (`/dashboard`)**: Overview of active orders, quotes, and delivery updates.
- **Order Stepper (`/dashboard/orders`)**: 5-stage progress indicator providing complete transparency into factory cutting and tailoring status.
- **Tax Invoice Downloads**: Customers can view and download stamped PDF tax invoices for insurance and record-keeping.

---

## 📐 Pricing Engine Mathematical Formulas

All pricing calculations are centralized in `src/lib/pricing/calculator.ts` and verified by adversarial stress suites.

### Curtain Fabric & Tailoring Formula
$$\text{Fabric Required (meters)} = \left\lceil \frac{\text{Track Width} \times \text{Fullness Ratio}}{\text{Standard Roll Width } (140\text{ cm})} \right\rceil \times \left( \frac{\text{Drop Length} + \text{Hem Allowance } (25\text{ cm})}{100} \right)$$
$$\text{Subtotal} = (\text{Meters} \times \text{Fabric Rate}) + (\text{Meters} \times \text{Pleat Stitching Rate}) + \text{Lining Cost} + \text{Lining Surcharge } (40\%) + \text{Motorization}$$

### Wallpaper Roll Estimation Formula
$$\text{Wall Area (sq. ft.)} = \frac{\text{Width (cm)} \times \text{Height (cm)}}{929.03}$$
$$\text{Rolls Required} = \left\lceil \frac{\text{Wall Area}}{\text{Usable Roll Coverage } (47\text{ sq. ft.})} \times \left(1 + \frac{\text{Pattern Repeat}}{100}\right) \right\rceil \quad (\text{Minimum } 1\text{ Roll})$$
$$\text{Subtotal} = (\text{Rolls} \times \text{Price per Roll}) + (\text{Wall Area} \times \text{Installation Rate per sq. ft.})$$

### Sofa Reupholstery Formula
$$\text{Subtotal} = (\text{Seats} \times \text{Meters per Seat} \times \text{Fabric Rate}) + (\text{Seats} \times \text{Labor Rate}) + (\text{Seats} \times \text{HD Foam Replacement})$$

### Indian GST Tax Split
$$\text{CGST Paise} = \left\lfloor \frac{\text{Subtotal Paise} \times 9}{100} \right\rfloor, \quad \text{SGST Paise} = \text{Total Tax Paise} - \text{CGST Paise}$$
$$\text{Grand Total} = \text{Subtotal} + \text{Total GST}$$

---

## 🏛️ System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                        CLIENT                          │
│  Next.js 14 (App Router) · React 18 · TypeScript 5     │
│  Tailwind CSS · Lucide Icons · Zustand (State Stores) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                  SERVER / EDGE RUNTIME                 │
│  Edge Middleware (RBAC & Session Interception)         │
│  Server Actions & API Routes (/api/visualize)          │
│  Google Gemini API Client (@google/generative-ai)      │
│  jsPDF Document Rendering Engine                       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                       DATA LAYER                       │
│  Dual-Mode Unified Repository (Live Firebase / Mock)   │
│  Cloud Firestore · Firebase Auth · Firebase Storage    │
│  Thread-Safe In-Memory Mock Store with Full Filtering  │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
excellence-furnishing/
├── public/                     # Static media and brand assets
├── scripts/
│   └── seed-data.ts            # Production Firestore seed runner
├── src/
│   ├── app/
│   │   ├── (auth)/             # Route group: /login, /register
│   │   ├── admin/              # Admin Suite: /admin, /clients, /orders, /invoices, /products, /analytics
│   │   ├── dashboard/          # Customer Portal: /dashboard, /orders, /profile, /visualizer
│   │   ├── products/           # Faceted Catalog & Product Detail ([id])
│   │   ├── api/visualize/      # Multimodal AI Visualizer endpoint
│   │   ├── about/, contact/, gallery/
│   │   ├── layout.tsx          # Root layout with Playfair/Inter typography
│   │   └── page.tsx            # High-conversion advertising landing page
│   ├── components/
│   │   ├── admin/              # AdminSidebar, ProductForm, room presets
│   │   ├── dashboard/          # OrderStepper, OrderSummaryCard
│   │   ├── home/               # HeroCarousel, ShopTheRoom, Testimonials, CategoryGrid
│   │   ├── layout/             # Header, Footer, StorefrontShell
│   │   ├── products/           # FilterSidebar, MobileFilterDrawer, ProductCard, SortBar
│   │   ├── ui/                 # Accessible base UI primitives (Button, Card, Badge, Input, Label)
│   │   └── visualizer/         # FabricVisualizer, ComparisonSlider
│   ├── config/
│   │   ├── navigation.ts       # Navigation links and menu schemas
│   │   ├── rate-cards.ts       # Mumbai furnishing trade rates (stitching, labor, foam)
│   │   └── site.ts             # Store profile, SEO metadata, contact info
│   ├── lib/
│   │   ├── firebase/           # auth.ts, firestore.ts, config.ts, mock-db.ts, seed-data.ts
│   │   ├── pdf/                # invoice-generator.ts (jsPDF layout)
│   │   ├── pricing/            # calculator.ts (Pure pricing formulas & GST splits)
│   │   ├── validators/         # schemas.ts (Zod validation for clients, products, measurements)
│   │   └── utils.ts            # Indian currency formatters & string helpers
│   ├── middleware.ts           # Edge RBAC & authentication protection
│   ├── store/                  # auth-store.ts, cart-store.ts (Zustand)
│   └── types/                  # Strict TypeScript domain models
├── tests/
│   ├── e2e/                    # Comprehensive Tier 1-4 integration suite
│   ├── empirical/              # Auth RBAC & database stress tests
│   ├── stress/                 # Order lifecycle & visualizer stress tests
│   └── unit/                   # Unit tests for pricing, CRM, invoices, products
├── GEMINI.md                   # Single source of truth specifications
├── TEST_READY.md               # Quality verification & test inventory
└── package.json
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v20.x or v22.x LTS installed
- **Package Manager**: `pnpm` (recommended) or `npm`

### 1. Clone & Install
```bash
git clone https://github.com/AbdurrahmanChauhan/excellence-furnishing.git
cd excellence-furnishing
pnpm install
```

### 2. Environment Setup
Create a `.env.local` file at the root:
```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Gemini API (For AI Fabric Visualizer)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Optional - falls back to resilient mock store if omitted)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Credentials & Accounts

The project includes pre-seeded demo accounts in `mock-db.ts` for immediate evaluation without requiring cloud database setup:

| Account Type | Email | Password | Primary Destination | Permitted Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@excellencefurnishing.com` | `Admin@12345` | `/admin` | CRM, Measurement Wizard, Orders, Invoices, Product CRUD, Analytics |
| **Customer** | `rahul.mehta@example.com` | `Customer@123` | `/dashboard` | Order Tracking Stepper, Invoice Downloads, AI Fitting Room |

*You can also register a fresh account via `/register` (defaults to customer role).*

---

## 🧪 Testing & Quality Verification

The test harness spans unit tests, property-based fuzzing, adversarial boundary tests, and end-to-end integration journeys across 4 tiers:

```bash
# Run the entire test suite (18 test files, 302 tests)
pnpm test

# Run strict TypeScript compilation check
pnpm type-check

# Compile production build
pnpm build
```

### Test Suite Summary
```
 Test Files  18 passed (18)
      Tests  302 passed (302)
   Duration  7.14s (0 Failures | 0 Skipped)
```

- **Tier 1 (Feature Coverage)**: Public storefront, cart, auth, CRM, measurements, invoices, and AI endpoints.
- **Tier 2 (Boundary & Security)**: Extreme dimensions (15cm window to 25m hotel atrium), NaN/negative inputs, empty stock, and session tampering.
- **Tier 3 (Lifecycle Integration)**: Complete 12-step commerce journey from Client Onboarding $\rightarrow$ Measurement $\rightarrow$ Quote $\rightarrow$ Order $\rightarrow$ Advance Payment $\rightarrow$ Completion $\rightarrow$ GST Invoice PDF.
- **Tier 4 (Real-World Mumbai Scenarios)**:
  - 3BHK Andheri West motorized curtain fit-out.
  - Bandra West heritage villa Chesterfield sofa reupholstery with HD-40 foam.
  - Juhu beachfront penthouse Nilaya wallpaper estimation.
  - Marine Lines penthouse Dr. Ortho / Refresh King mattress and bedding package.
  - Bandra Bandstand sea-facing terrace artificial turf and custom mosquito netting.

---

## 🛡️ Security, Validation & Compliance

1. **Input Validation**: All forms use **Zod** schemas enforcing strict Indian telephone syntax, 6-digit PIN codes, and numeric ranges.
2. **Type Safety**: Built with strict TypeScript configuration — zero `any` declarations in production code.
3. **Session Security**: Authentication tokens and roles are validated at the Edge (`src/middleware.ts`) before routes render.
4. **GST Tax Integrity**: Tax breakdowns compute in integer paise and round down for CGST while allocating the exact remainder to SGST, ensuring 100% mathematical zero-leakage balance.
5. **Graceful Fallbacks**: The AI Visualizer and Firebase data layers detect missing credentials or offline environments and automatically switch to synthetic mock engines to prevent server crashes.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
