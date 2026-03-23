# Project Specification: Chill-Arai (Money Management PWA)

## Project Overview
Chill-Arai is a mobile-first, offline-capable Progressive Web App (PWA) designed for seamless personal finance management. It combines a standard income/expense ledger with dedicated Lending and Borrowing trackers. 

**Core Value Proposition:** A completely serverless, zero-cost, highly secure financial tracker that feels indistinguishable from a native mobile application.

---

## Phase 1: Core Storage Architecture (IndexedDB)
**Objective:** Replace standard `LocalStorage` with asynchronous `IndexedDB` to handle complex queries and larger datasets without blocking the main mobile UI thread.
* **Technology:** Use `Dexie.js` as the IndexedDB wrapper for a streamlined API.
* **Data Schema Requirements:** Every record in the `transactions`, `lending`, and `borrowing` stores MUST include:
  * `id`: Unique UUID.
  * `updated_at`: ISO timestamp (critical for cloud merge logic).
  * `deleted`: Boolean flag (tombstone for syncing deletions).
* **Implementation:** All CRUD operations must be asynchronous. 

---

## Phase 2: Cloud Synchronization (The "Ghost Protocol")
**Objective:** Implement a silent, zero-cost cloud backup and cross-device sync utilizing the user's personal Google Drive.
* **API Target:** Google Drive REST API v3.
* **Storage Location:** Target the hidden `appDataFolder` so the sync file is invisible to the user's standard Drive interface.
* **Conflict Resolution (Timestamp Merge Logic):**
  1. On app launch/network reconnect, fetch the remote JSON blob from Google Drive.
  2. Compare remote records against local Dexie.js records using `updated_at`.
  3. Retain the newest version of any record.
  4. Respect `deleted: true` flags (remove from active UI, keep tombstone for future syncs).
  5. Silently push the merged state back to Drive in the background.

---

## Phase 3: Security & Privacy ("Fort Knox" Standards)
**Objective:** Ensure financial data is strictly private, both locally and in the cloud.
* **Client-Side Encryption:** Implement the Web Crypto API (AES-GCM). The IndexedDB payload MUST be encrypted before being pushed to Google Drive.
* **Biometric Gatekeeper:** Integrate the Web Authentication API (WebAuthn). Trigger a prompt for FaceID, TouchID, or device PIN when the PWA is launched or returns from the background.

---

## Phase 4: Functional Power-Ups
**Objective:** High-utility, client-side only features.
* **OCR Receipt Parsing:** Integrate `Tesseract.js`. Provide a UI flow to capture a receipt image, extract the total amount locally in-browser, and pre-fill the "New Expense" form.
* **"Split-the-Damage" Matrix:** A unified UI to divide a single bill. Automatically generate corresponding records (e.g., splitting a $100 bill 3 ways generates a $33 expense for the user, and two $33 records in the Lending tracker).
* **Local Data Export:** Integrate `PapaParse` (for CSV) or `jspdf` (for PDF). Allow users to generate and download sanitized audit trails directly from the IndexedDB state.

---

## Phase 5: Mobile-Native PWA Optimization
**Objective:** Eliminate all web-browser quirks to achieve a flawless iOS/Android app feel.
* **Web App Manifest (`manifest.json`):**
  * `"display": "standalone"`
  * Implement Maskable Icons.
  * Define App Shortcuts (e.g., "Add Expense", "New Split").
* **Viewport & Safe Areas:**
  * `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`
  * Use CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to clear device notches and swipe bars.
* **Native Touch CSS:**
  * `overscroll-behavior-y: none;` on `body` (disables pull-to-refresh).
  * `-webkit-tap-highlight-color: transparent;` globally.
  * `user-select: none;` globally (except inputs).
* **Inputs:** Use `inputmode="decimal"` on all amount fields to trigger the native mobile number pad.
* **Tactile Feedback:** Trigger `navigator.vibrate(50)` on successful saves, and a double-tap pattern when Drive sync completes.
* **Offline Caching:** Implement Workbox to cache the App Shell (HTML, CSS, JS, Fonts) for instant offline loading.

---

## Phase 6: Multi-User Distribution & Peer-to-Peer (P2P) Handshakes
**Objective:** Enable frictionless onboarding for new users and allow offline data sharing between friends without a centralized server.

**Implementation Directives:**
* **Decentralized Auth Flow:**
  * Build a polished splash screen for first-time users explaining the "Bring Your Own Database" concept.
  * Implement Google OAuth 2.0. Ensure the flow smoothly requests `drive.appdata` scope.
  * After Google Auth, force the user to create a local 4-digit PIN. This PIN is used to derive the AES-GCM encryption key for their local IndexedDB before it syncs to their Drive.
* **Peer-to-Peer QR Codes (Serverless Sharing):**
  * Integrate `qrcode.react` (for generation) and `html5-qrcode` (for scanning).
  * **Flow:** User A creates a split bill -> App generates a QR code containing a JSON payload (Amount, Category, User A's Name, Date) -> User B taps "Scan Code" in their app -> App reads the payload and instantly writes a "Borrowing" record to User B's local Dexie database.
* **Deployment Prep:** Ensure the Vite build process is optimized for static hosting (Vercel/Netlify), with strictly relative asset paths so the PWA manifest resolves correctly on any domain.

---

## Phase 7: UI Design System (Premium Contrast Theme)
**Objective:** Implement a warm, high-contrast gold/charcoal aesthetic supporting both Light and Dark modes.

**Implementation Directives:**
* **Typography:** Clean, geometric sans-serif (e.g., Inter or SF Pro). Restrict weights to 400 (Regular) and 600/700 (Semibold/Bold).
* **Card Styling:** Grid cards should feature prominent rounded corners (e.g., `border-radius: 16px` or `24px`). In Light Mode, apply a very soft shadow for elevation. In Dark Mode, cards should remain flat against the background.
* **Bottom Navigation:** Shift primary navigation to a bottom tab bar for thumb-ergonomics.

**CSS Variables (Tailwind Configuration):**

```css
/* LIGHT MODE VARIABLES */
:root {
  --bg-app: #FDF7EC;          /* Warm cream app background */
  --bg-header: #1B1914;       /* Deep brownish-black for the top dashboard card */
  --bg-surface: #FFFFFF;      /* Pure white for grid cards */
  --bg-icon: #FEF1D5;         /* Very pale gold for icon containers */
  
  --accent-primary: #FCE3A1;  /* Soft gold for main buttons/accents */
  
  --text-primary: #1B1914;    /* High contrast dark text */
  --text-secondary: #A1A1A1;  /* Muted gray for subtitles/labels */
  --text-header-amount: #FFFFFF; /* White text specifically for the dark header card */
}

/* DARK MODE VARIABLES */
[data-theme="dark"] {
  --bg-app: #12110D;          /* Deep warm black background */
  --bg-header: #231A0B;       /* Dark espresso brown for top card */
  --bg-surface: #1C1D21;      /* Dark slate gray for grid cards */
  --bg-icon: #46340B;         /* Dark brownish-gold for icon containers */
  
  --accent-primary: #EBC45D;  /* Vibrant gold for amounts and accents */
  --accent-button: #4C3810;   /* Muted dark gold/brown for primary buttons */
  
  --text-primary: #FFFFFF;    /* Pure white for readability */
  --text-secondary: #A5A5A5;  /* Light muted gray for subtitles */
}