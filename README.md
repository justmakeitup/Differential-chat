# Differential — The Sovereign Connection Network

> **"Meet your next meaningful connection."**  
> *A peer-to-peer, zero-knowledge privacy platform crafted for discerning minds, curated photography, and end-to-end encrypted dialogues. No algorithms. No surveillance. No noise.*

---

## 🏛️ Visual Identity & Design Philosophy

**Differential** features a completely original, dark cinematic identity designed from the ground up to feel exclusive, contemplative, and editorial—free from algorithmic dopamine loops, neon-heavy gradients, or dating app tropes.

- **Obsidian & Deep Charcoal Canvas:** `#060709`, `#0B0D12`, `#12151D` with subtle frosted glass panels (`backdrop-blur-xl`) and hairline borders (`rgba(255, 255, 255, 0.08)`).
- **Accents:** Restrained electric-indigo (`#6366F1`) and warm imperial gold (`#D4AF37`, `#F5E4B2`) symbolizing cryptographic precision and artisanal curation.
- **Editorial Typography:** High-contrast serif headlines (*Cinzel* & *Playfair Display*), clean geometric body (*Plus Jakarta Sans*), and technical metadata (*JetBrains Mono*).
- **Tasteful Custom Cursor:** Desktop custom magnetic cursor with a smooth lerp-trailing aura. Automatically disabled on touch devices (`@media (pointer: coarse)`) and respects accessibility settings (`prefers-reduced-motion`).
- **Strictly Image-Only Exhibition:** A deliberate sanctuary for static visual art. Video uploads are explicitly prohibited and blocked at both client and API gateway levels.

---

## 📂 Project Organization & Architecture

The repository is cleanly partitioned into dedicated frontend and backend directories:

```
Chat Clone/
├── backend/                        # Python Flask REST API & WebRTC Signaling Engine
│   ├── app.py                      # Application factory, static upload serving, error handlers
│   ├── config.py                   # Environment configuration, database URLs, verified address
│   ├── models.py                   # SQLAlchemy ORM models (Zero Plaintext Chat Storage)
│   ├── auth_service.py             # Rate limiting, scrypt password hashing, JWT, session guard
│   ├── image_service.py            # Pillow EXIF/GPS scrubbing, WebP compression, video rejection
│   ├── signaling.py                # Authenticated WebRTC Socket.IO signaling relay
│   ├── seed.py                     # Realistic editorial members, sample exhibitions & connections
│   ├── requirements.txt            # Python dependencies
│   ├── migrations/                 # Alembic database migrations
│   ├── uploads/                    # Local object storage for scrubbed WebP images & thumbnails
│   ├── .env.example                # Template for production environment secrets
│   └── .env                        # Local development environment configuration
│
├── frontend/                       # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── config/
│   │   │   └── brandConfig.ts      # 🎯 Central registry for replaceable brand names & images
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Authentication token & crypto identity sync
│   │   │   ├── ToastContext.tsx    # Dark cinematic toast notifications
│   │   │   └── SignalingContext.tsx# WebRTC Socket.IO connection & presence
│   │   ├── services/
│   │   │   ├── api.ts              # Typed API contracts for all endpoints
│   │   │   ├── crypto.ts           # Web Crypto API: ECDH P-256 + AES-GCM 256-bit encryption
│   │   │   ├── webrtc.ts           # WebRTC DataChannel P2P messaging & receipt engine
│   │   │   └── analytics.ts        # Privacy-conscious analytics behind cookie consent
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Responsive navigation, notifications drawer, mobile bar
│   │   │   ├── Footer.tsx          # Verified business address, legal links, cryptographic specs
│   │   │   ├── CustomCursor.tsx    # Desktop custom cursor with touch/reduced-motion detection
│   │   │   ├── PostComposerModal.tsx# Image-only drag-and-drop dropzone with mandatory alt-text
│   │   │   ├── CookieBanner.tsx    # Granular privacy consent banner
│   │   │   ├── SEOHead.tsx         # Dynamic page title, meta tags, and privacy pageview tracking
│   │   │   ├── ConfirmModal.tsx    # Accessible confirmation dialog
│   │   │   ├── Skeleton.tsx        # Loading skeleton placeholders
│   │   │   ├── EmptyState.tsx      # Curated empty states
│   │   │   └── ErrorBoundary.tsx   # React rendering error boundary
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Hero landing page ("Meet your next meaningful connection.")
│   │   │   ├── LoginPage.tsx       # Rate-limited login with demo account quick-fill
│   │   │   ├── SignUpPage.tsx      # Password requirements checklist & charter consent
│   │   │   ├── ForgotPasswordPage.tsx# Zero-knowledge recovery token reset workflow
│   │   │   ├── OnboardingPage.tsx  # 3-step profile sculptor, curated tags, and crypto keys
│   │   │   ├── DiscoverPage.tsx    # Member directory, real-time search, tag filters, invitations
│   │   │   ├── ProfilePage.tsx     # Profile header, verified badge, privacy status & exhibition grid
│   │   │   ├── FeedPage.tsx        # Public vs Connections-only exhibition stream
│   │   │   ├── PostDetailPage.tsx  # Full post canvas, accessible alt-text viewer & reflections
│   │   │   ├── ConnectionsPage.tsx # Established peers, received invitations, sent requests
│   │   │   ├── ChatPage.tsx        # 1-to-1 WebRTC P2P chat with E2EE, emojis, stickers, receipts
│   │   │   ├── SettingsPage.tsx    # Privacy spheres, key manager, active sessions, account purge
│   │   │   ├── ThankYouPage.tsx    # Member gratitude & sovereign covenant statement
│   │   │   ├── NotFoundPage.tsx    # Custom animated 404 page
│   │   │   ├── PrivacyPolicyPage.tsx# Comprehensive zero-knowledge legal privacy charter
│   │   │   └── TermsPage.tsx       # Ethical terms of engagement & 100% artist copyright retention
│   │   ├── App.tsx                 # Main application router
│   │   ├── main.tsx                # React root mount with context providers
│   │   └── index.css               # Tailwind directives, Google Fonts, WCAG focus states
│   ├── public/
│   │   ├── favicon.svg             # Original gold/indigo monogram icon
│   │   ├── og-image.svg            # Branded social preview banner (1200x630)
│   │   ├── robots.txt              # Search engine directives shielding private routes
│   │   └── sitemap.xml             # XML sitemap for public routes
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 🎯 Replaceable Names & Brand Assets Guide

All customizable branding, corporate coordinates, sample photographic imagery, editorial interest taxonomies, and bespoke sticker emojis are centralized in a single configuration file:

📁 **`frontend/src/config/brandConfig.ts`**

| Field | Location | Description |
|---|---|---|
| `brandConfig.name` | `brandConfig.ts` (line 38) | Primary platform title (Default: `"Differential"`) |
| `brandConfig.heroCTA` | `brandConfig.ts` (line 41) | Above-the-fold headline (Default: `"Meet your next meaningful connection."`) |
| `brandConfig.subheading` | `brandConfig.ts` (line 40) | Tagline explaining zero-knowledge and peer-to-peer nature |
| `brandConfig.businessAddress` | `brandConfig.ts` (line 53) | Real verified corporate mailing address, state, postal code, and concierge email |
| `brandConfig.sampleImages` | `brandConfig.ts` (line 65) | Replaceable high-res URLs for default avatar, default banner, exhibition cards, and OG image |
| `brandConfig.editorialInterests` | `brandConfig.ts` (line 75) | Taxonomy tags for onboarding & discovery (e.g. *Architectural Brutalism, Medium Format Film*) |
| `brandConfig.bespokeStickers` | `brandConfig.ts` (line 93) | Custom sticker drawer collection used in encrypted P2P chat |

---

## 🔐 Cryptographic Architecture & WebRTC P2P DataChannels

Differential enforces **true Zero-Knowledge End-to-End Encryption (E2EE)** for all direct dialogues:

1. **Client-Side Key Generation (`services/crypto.ts`):**
   - Uses the browser's native `window.crypto.subtle` (Web Crypto API).
   - Generates an **ECDH (Curve P-256)** keypair upon member onboarding, sealed in the browser's local sandbox.
   - Computes a 16-character alphanumeric safety fingerprint (e.g. `8F2A • 419C • B80E • 77D1`).
2. **Authenticated WebRTC Signaling (`backend/signaling.py`):**
   - The Flask backend accepts WebSocket signaling connections authenticated via signed JWTs.
   - Relays only Session Description Protocol (SDP) Offers, Answers, and Interactive Connectivity Establishment (ICE) candidates between connected peers.
   - **Crucial Security Guarantee:** Message content, text strings, images, stickers, and cryptographic session keys **never pass through or get stored in Flask or PostgreSQL**.
3. **AES-GCM-256 Symmetric Transmission:**
   - Once the WebRTC `RTCDataChannel` opens directly between two peers, both browsers derive a shared 256-bit AES-GCM session key via `crypto.subtle.deriveKey(ECDH)`.
   - Every packet is encrypted with a unique, cryptographically random 96-bit initialization vector (`IV`).
   - Delivery receipts (`sent`, `delivered`, `read`) and live typing flags travel encrypted directly over the DataChannel.

---

## 🛡️ Image Security & Processing Pipeline

Differential implements an image-only pipeline in `backend/image_service.py`:

- **Strict Video Rejection:** Files with video MIME types (`video/mp4`, `video/webm`, etc.) or extensions (`.mp4`, `.mov`, `.avi`, `.mkv`) are immediately rejected at client and server with a clear 400 error.
- **Automated EXIF/GPS Scrubbing:** Every uploaded image is opened with Pillow, oriented according to transpose headers, and recreated on a clean pixel canvas, permanently stripping GPS coordinates, camera serial numbers, and device fingerprints.
- **WebP Optimization & Thumbnails:** Automatically converted to modern WebP format (quality 88) at a maximum resolution of 2048px, while generating an optimized 480px thumbnail for rapid mobile loading.
- **Mandatory Accessibility Alt-Text:** Alt-text is strictly required before an image can be published, ensuring screen-reader accessibility for visually impaired members.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js:** v18+ (tested on v24.20.0) & `npm`
- **Python:** v3.10+ (tested on v3.13.6) & `pip`

---

### Step 1: Backend Setup (Flask & SQLite / PostgreSQL)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
5. Initialize and seed the database with realistic test members, sample photography exhibitions, mutual connections, and notifications:
   ```bash
   python seed.py
   ```
6. Start the Flask Backend & Signaling Server on `http://127.0.0.1:5000`:
   ```bash
   python app.py
   ```

---

### Step 2: Frontend Setup (React + TypeScript + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server on `http://localhost:5173`:
   ```bash
   npm run dev
   ```
4. Open **`http://localhost:5173`** in your browser.

---

## 📱 Native Android Mobile App (Differential for Android)

The web application is fully bundled and integrated as a native Android app powered by Capacitor, with all features intact (Zero-Knowledge E2EE messaging, dark mode, photo exhibition dropzone, privacy settings, active session controls, and biometric/token authentication):

### 1. Build and Sync Assets to Android
Whenever you modify frontend code or assets:
```bash
cd frontend
npm run build:android
```
This runs Vite production compilation and syncs the output bundle and configurations directly into `frontend/android/app/src/main/assets/public/`.

### 2. Open in Android Studio / Build APK
To open the project in Android Studio:
```bash
npm run android:open
```
Or directly open the `frontend/android` directory in Android Studio. From there, select **Run** or **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate the `.apk` package for any emulator or physical phone.

### 3. Server Node Configuration on Mobile
In the mobile app, navigate to **Settings > Mobile App Node & Server**:
- **Android Emulator:** Automatically connects to `http://10.0.2.2:5000` (which routes to your machine's `localhost:5000`).
- **Physical Android Device:** Enter your computer's local Wi-Fi IP address (e.g. `http://192.168.1.50:5000`) or your deployed production server domain.

---

## 🔑 Pre-Seeded Demo Credentials

You can immediately explore the platform using the pre-seeded account or create a brand-new identity:

- **Email:** `demo@differential.network`
- **Username:** `demo_user`
- **Password:** `Cipher@2026`

*Tip: The Login page includes a one-click **"Click to fill verified Demo Member credentials"** button for instant sandbox access.*

Other pre-seeded members available to connect and chat with:
- `elena_v` (`elena@differential.network`) — *Architectural Minimalist (Mutual Connection)*
- `julian_k` (`julian@differential.network`) — *Dark Ambient Composer (Mutual Connection)*
- `soraya_m` (`soraya@differential.network`) — *Curator at Pavilion Noir (Pending Invitation)*
- `kaspar_h` (`kaspar_h@differential.network`) — *Astrophotographer (Connections Only Profile)*
- `claire_chen` (`claire@differential.network`) — *Ceramist & Tea Ceremony Master*

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `FLASK_ENV` | Environment mode (`development` / `production`) | `development` |
| `SECRET_KEY` | Flask cryptographic session key | Random secret string |
| `JWT_SECRET` | Secret key for signing authentication tokens | Random secret string |
| `DATABASE_URL` | Database URI (SQLite for local zero-config, PostgreSQL in prod) | `sqlite:///aetheris.db` |
| `MAX_CONTENT_LENGTH` | Maximum upload size in bytes (8MB) | `8388608` |
| `CORS_ORIGINS` | Permitted origins for API & Socket.IO | `http://localhost:5173,http://127.0.0.1:5173` |
| `BUSINESS_NAME` | Registered corporate name | `Differential Privacy Technologies Inc.` |
| `BUSINESS_ADDRESS_LINE1` | Verified street address | `450 Townsend Street` |
| `BUSINESS_ADDRESS_LINE2` | Suite or unit number | `Suite 300` |
| `BUSINESS_CITY` | City | `San Francisco` |
| `BUSINESS_STATE` | State / Province | `CA` |
| `BUSINESS_POSTAL_CODE` | Postal code | `94107` |
| `BUSINESS_COUNTRY` | Country | `United States` |
| `BUSINESS_EMAIL` | Concierge inquiries email | `concierge@differential.network` |
| `VITE_ANALYTICS_ID` | Privacy-conscious analytics ID (loaded after consent) | `DIFF-PRV-98421` |

---

## 🗄️ Database Migrations (PostgreSQL & SQLite)

The platform supports Alembic migrations out of the box via `Flask-Migrate`.

To generate a new database migration:
```bash
# Set Flask application path
export FLASK_APP=backend/app.py   # Linux / macOS
$env:FLASK_APP="backend\app.py"  # Windows PowerShell

# Generate migration revision
flask db migrate -d backend/migrations -m "Description of changes"

# Apply migrations
flask db upgrade -d backend/migrations
```

### Free PostgreSQL production setup (Supabase)

Use [Supabase](https://supabase.com) for its managed PostgreSQL free tier. Create a project, then copy the **Session Pooler** connection string from **Connect**. Put it in `backend/.env` by copying `backend/.env.example`; add `sslmode=require` if Supabase did not include it. The database password and URL are backend-only secrets—never put either in Vite variables, browser code, Git, screenshots, or the Supabase client SDK.

```powershell
cd backend
Copy-Item .env.example .env
.\venv\Scripts\pip install -r requirements.txt
$env:FLASK_APP = "app.py"
flask db migrate -d migrations -m "secure postgres schema"
flask db upgrade -d migrations
```

Set `CORS_ORIGINS` to the exact HTTPS frontend URL before deploying. Configure the SMTP values in `backend/.env` with a transactional-email provider before enabling production accounts; reset tokens are intentionally not returned in API responses or stored as plaintext.

Security properties now enforced by the app:

- Passwords use Werkzeug's `scrypt` hash; plaintext passwords are never stored.
- Authentication lives in an HTTP-only, Secure production cookie—not `localStorage` or JSON responses.
- Each JWT is tied to a server-side session, so logout, remote session revocation, and password changes invalidate it.
- Recovery tokens are stored only as SHA-256 digests and are invalidated on use.
- PostgreSQL connections use TLS, and CORS allows only configured origins.

Chats currently remain peer-to-peer and encrypted, with a local browser cache; they are deliberately not stored by the server. That preserves the app's existing no-central-plaintext-chat design. If you want cross-device chat history, store only end-to-end encrypted ciphertext and encrypted attachments—never message plaintext or client private keys.

---

## ♿ Accessibility & Production Compliance

- **WCAG Standards:** Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<article>`, `<footer>`, `<dialog>`), visible focus indicators (`:focus-visible`), and color contrast ratios exceeding 4.5:1.
- **Mandatory Alt-Text:** All images must have meaningful descriptive text, viewable directly via the in-app `ALT` badges.
- **Cookie Consent:** Granular privacy cookie banner separating strictly essential security cookies from telemetry.
- **Search Engine Optimization (SEO):**
  - Dynamic page titles & descriptions (`SEOHead.tsx`).
  - OpenGraph & Twitter Card metadata with branded 1200x630 banner (`public/og-image.svg`).
  - Monogram SVG Favicon (`public/favicon.svg`).
  - `public/robots.txt` & `public/sitemap.xml`.
- **Pre-rendering & Production Build:**
  ```bash
  cd frontend
  npm run build
  ```
  Generates an optimized, tree-shaken static bundle in `frontend/dist`.

---

## ⚖️ License & Ethical Commitment

Differential is distributed under the MIT License. Members retain 100% intellectual property rights over their visual creations.
