# Verida — On-the-Spot Tourism Trust & Presence Protocol

> *"Every existing platform protects you if you booked through them. We protect you when you didn't — because that's when almost every real scam in India actually happens: unbooked, in-person, in cash. Our trust layer runs on physical proximity and GPS proof, not on booking IDs."*

---

## 🌟 The Core Problem & The Unique Angle
Major platforms (Viator, GetYourGuide, Klook) are pre-booking marketplaces. But real tout scams happen **on the spot, in cash, with zero booking** at the monument gate or street corner.

**Verida** provides instant, 5-second on-the-spot verification, proof-of-presence reviews, live price intelligence, and computer vision to safeguard unbooked interactions.

---

## 🚀 Key Features

| Feature | What It Does | Why It's Unique |
| :--- | :--- | :--- |
| **1. Digital Handshake** | Rotating dynamic QR on guide's phone + sub-second camera scan & GPS proximity check. | Establishes a verified encounter record on the spot in <5s. 15s token rotation prevents screenshot reuse. |
| **2. Proof-of-Presence Reviews** | Reviews are cryptographically gated behind an actual verified handshake at that physical coordinate. | Impossible to fake online reviews or astroturf without physical presence proof. |
| **3. Live Price Pulse** | 3-second post-handshake prompt feeds a rolling real-time ticker of what travelers recently paid. | Real-time crowdsourced fair market rates instead of outdated static price boards. |
| **4. Point-and-Check Price Camera** | Snaps a photo of handwritten chits, menus, or quotes and runs client-side OCR (Tesseract.js). | Instant **Red / Yellow / Green** safety verdict + negotiation counter-offer coaching. |
| **5. Scam Hotspot Radar** | Interactive Leaflet map with geofenced alert zones ("Waze for touts"). | Pushes proactive warning banners to tourists before they get approached in tout hubs. |
| **6. Guide Portfolio Ledger** | Chronological timeline of GPS-verified encounters with verified ASI/State Tourism license badges. | Replaces easily faked star ratings with an immutable physical encounter record. |
| **7. Tourist Police Evidence Packet** | 1-Tap SOS compiles GPS, timestamp, scanned guide license, and photo evidence into a certified dossier. | Instant dispatch to Tourist Police Helpline (**1363 / 112**) or printable PDF dossier for police desks. |

---

## 📍 Vadodara, Gujarat Focus & Seed Coverage

Verida includes comprehensive seed data and fair price intelligence for **Vadodara, Gujarat**:

- **Heritage Landmarks**:
  - *Laxmi Vilas Palace* (Grand Indo-Saracenic royal residence, 4× size of Buckingham Palace)
  - *Kirti Mandir* (Maharaja Sayajirao Gaekwad III memorial)
  - *Mandvi Gate* & Old Textile Bazaars
  - *Nyaya Mandir* (Byzantine-Gothic architectural landmark)
  - *Maharaja Fateh Singh Museum* (Raja Ravi Varma paintings)
  - *Baroda Museum & Picture Gallery* (Sayaji Baug)
- **Gardens & Lakes**:
  - *Sayaji Baug (Kamati Baug)* (Zoo, planetarium, floral clock)
  - *Sursagar Lake* (Central lake with 120ft golden Shiva statue)
  - *Ajwa Lake, Musical Gardens & Water Park*
  - *Vishwamitri Riverfront & Narmada Canal Garden*
- **Temples & Spiritual Sites**:
  - *EME Temple (Dakshinamurti)* (Geodesic aluminum dome managed by Indian Army)
  - *ISKCON Temple Vadodara*
  - *Pavagadh Hill & Kalika Mata Temple*
- **Cultural & Food Hubs**:
  - *MS University Faculty of Fine Arts*
  - *United Way & Akota Stadium Navratri Garba Grounds*
  - *Raopura & Lehripura* (Shree Mahakali Sev Usal, Pyarelal Bhakarwadi)
- **Day Trips**:
  - *Champaner-Pavagadh Archaeological Park* (UNESCO World Heritage Site)
  - *Statue of Unity & Kevadia* (World's tallest statue, 90 km away)
  - *Jambughoda Wildlife Sanctuary*

*Also includes national seeds for Agra (Taj Mahal, Agra Fort), Delhi (Red Fort, Qutub Minar), and Jaipur (Hawa Mahal).*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Clean Vanilla HTML5 + Modern CSS3 Design System (Emerald Trust & Deep Slate Palette) + ES6 Modules.
- **Computer Vision / OCR**: `Tesseract.js` running in-browser via WebWorkers (zero server round-trips).
- **QR Engine**: `html5-qrcode` camera scanner + Canvas dynamic rotating QR generator with SHA-256 token hashing.
- **Mapping & Geofencing**: `Leaflet.js` & OpenStreetMap with Haversine distance geofence calculations.
- **Database & Hosting**: **Google Firebase (Firestore + Authentication + Firebase Hosting)** with local IndexedDB/LocalStorage hybrid offline resilience.

---

## ⚡ Getting Started Locally

### 1. Start Local Development Server:
```bash
npm start
# or:
npx -y serve . -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Firebase Deployment Instructions

### Step 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
# or run via npx:
npx -y firebase-tools login
```

### Step 2. Login to Firebase
```bash
firebase login
```

### Step 3. Initialize / Select Your Firebase Project
```bash
firebase use --add
# Select your Firebase project ID
```

### Step 4. Deploy Hosting and Security Rules
```bash
# Deploy both Hosting and Firestore Rules
firebase deploy

# Or deploy individually:
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

Once deployed, your app will be live globally on `https://<your-project-id>.web.app` with SSL, fast CDN caching, and Firestore security rules active!

---

## 🎤 3-Minute Hackathon Live Stage Demo Script

1. **The Hook (0:00 - 0:30)**:
   > *"Every existing app protects you when you pre-book online. But 90% of tourist scams in India happen unbooked, in cash, on the street. Verida brings instant trust to the exact moment you meet a stranger."*

2. **The 5-Second Digital Handshake (0:30 - 1:15)**:
   - Switch to **Dual Stage View** at top right.
   - Point out Guide device on right with 15-second rotating QR token.
   - Tap **"Execute Instant Handshake"** on Traveler device.
   - Watch the GPS proximity match (<5m) and verified ASI / Gujarat Tourism credential badge appear with confetti.

3. **3-Second Price Pulse (1:15 - 1:45)**:
   - Tap `₹100 (Standard)` on the post-handshake prompt.
   - Show the Live Price Pulse ticker update immediately.

4. **Point-and-Check Price Camera (1:45 - 2:30)**:
   - Click **"Snap Auto Chit (₹450 Overcharge Alert)"**.
   - Watch Tesseract OCR extract the number and trigger the **🚨 RED FLAG** alert with negotiation coaching.

5. **Tourist Police Evidence Dossier (2:30 - 3:00)**:
   - Tap **SOS** button.
   - Present the certified, tamper-evident Incident Dossier with GPS coordinates, guide license ID, and direct 1363 dialer.


i made a change 