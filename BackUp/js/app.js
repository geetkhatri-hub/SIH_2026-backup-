/**
 * Verida — Main Application Controller & View Router
 */
/** 
import { store } from "./store.js";
import { digitalHandshake } from "./handshake.js";
import { hotspotRadar } from "./hotspots.js";
import { reviewsManager } from "./reviews.js";
import { evidencePacketManager } from "./evidencePacket.js";
import { demoSimulator } from "./demoSimulator.js";
import { transitSafety } from "./transitSafety.js";
import { authManager } from "./authManager.js";

class App {
  constructor() {
    this.activeTab = "handshake";
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log("[Verida] Initializing On-The-Spot Tourism & Transit Trust Platform...");

    // Step 1: Populate city dropdown (safe, no side-effects)
    try { this.populateCityDropdown(); } catch (e) { console.warn("[Verida] City dropdown error:", e); }

    // Step 2: Bind all event listeners
    try { this.bindEvents(); } catch (e) { console.warn("[Verida] Event binding error:", e); }

    // Step 3: Load auth manager (reads localStorage, binds forms)
    try { authManager.init(); } catch (e) { console.warn("[Verida] Auth init error:", e); }

    // Step 4: Sync profile names to UI
    try { this.syncProfileDisplayNames(); } catch (e) { console.warn("[Verida] Profile sync error:", e); }

    // Step 5: Switch role (sets body class, shows correct nav items)
    try { this.switchRole(store.currentRole); } catch (e) { console.warn("[Verida] Role switch error:", e); }

    // Step 6: Switch to the default tab — this also calls initRoutePlanner()
    // Do this LAST so all DOM is ready and role class is applied
    try {
      this.switchTab("transit");
    } catch (e) {
      console.warn("[Verida] Initial tab switch error:", e);
      // Fallback: manually show the transit panel
      const transitPanel = document.getElementById("tab-transit");
      if (transitPanel) transitPanel.classList.add("active");
    }

    // Step 7: Pre-render the ledger so it's ready when user navigates there
    try { reviewsManager.renderGuideLedger(); } catch (e) { console.warn("[Verida] Ledger render error:", e); }

    // Step 8: Initialize map with delay (non-critical, deferred)
    setTimeout(() => {
      try { hotspotRadar.initMap(); } catch (e) { console.warn("[Verida] Map init error:", e); }
    }, 300);
  }

  syncProfileDisplayNames() {
    // Sync all name display elements with saved profiles
    const passengerName = store.activeUser.name;
    const driverName = store.activeGuide.name;
    const driverPlate = store.activeGuide.vehicleRegNo || "GJ-06-AU-7892";
    const driverVehicle = store.activeGuide.vehicleType || "Green CNG Auto-Rickshaw";

    const nameEl = document.getElementById("header-user-display-name");
    if (nameEl) nameEl.textContent = passengerName;

    const dualPassName = document.getElementById("dual-passenger-name");
    if (dualPassName) dualPassName.textContent = passengerName;

    const dualDriverName = document.getElementById("dual-driver-name");
    if (dualDriverName) dualDriverName.textContent = driverName;

    // Sync driver card in main view
    const driverCardName = document.getElementById("driver-card-name");
    const driverCardLic = document.getElementById("driver-card-lic");
    if (driverCardName) driverCardName.textContent = driverName;
    if (driverCardLic) driverCardLic.textContent = `${driverPlate} • ${driverVehicle}`;

    // Sync driver card in dual view
    const driverCardNameDual = document.getElementById("driver-card-name-dual");
    const driverCardLicDual = document.getElementById("driver-card-lic-dual");
    if (driverCardNameDual) driverCardNameDual.textContent = driverName;
    if (driverCardLicDual) driverCardLicDual.textContent = `${driverPlate} • ${driverVehicle}`;
  }

  bindEvents() {
    // City Selector
    const citySelector = document.getElementById("header-city-selector");
    if (citySelector) {
      citySelector.onchange = (e) => {
        store.setCity(e.target.value);
        this.onCityChanged();
      };
    }

    // Role Switcher Buttons
    document.querySelectorAll(".role-toggle-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const targetRole = btn.getAttribute("data-role");
        this.switchRole(targetRole);
      };
    });

    // Navigation Tabs (Both Mobile bottom dock and Desktop sidebar/topbar)
    document.querySelectorAll(".nav-tab-btn, .desktop-nav-link").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const tab = btn.getAttribute("data-tab");
        if (tab) this.switchTab(tab);
      };
    });

    // Dual Screen Presenter Toggle
    const dualBtn = document.getElementById("toggle-dual-screen-btn");
    if (dualBtn) {
      dualBtn.onclick = (e) => {
        e.preventDefault();
        demoSimulator.toggleDualScreen();
      };
    }

    // View Mode Toggle (Fluid Laptop vs Mobile Phone Frame)
    const viewModeBtn = document.getElementById("toggle-view-mode-btn");
    if (viewModeBtn) {
      viewModeBtn.onclick = (e) => {
        e.preventDefault();
        document.body.classList.toggle("mobile-mockup-mode");
        const isMockup = document.body.classList.contains("mobile-mockup-mode");
        viewModeBtn.innerHTML = isMockup 
          ? `<i class="fas fa-desktop"></i> Laptop Dashboard View`
          : `<i class="fas fa-mobile-screen"></i> Phone Simulator Frame`;
      };
    }

    // Teleport Selector
    const teleportSelect = document.getElementById("demo-teleport-select");
    if (teleportSelect) {
      teleportSelect.onchange = (e) => {
        if (e.target.value) {
          demoSimulator.teleport(e.target.value);
        }
      };
    }

    // Live Handshake Simulation Button (Traveler View)
    const simScanBtn = document.getElementById("simulate-scan-btn");
    if (simScanBtn) {
      simScanBtn.onclick = (e) => {
        e.preventDefault();
        this.executeHandshakeFlow();
      };
    }

    // Camera Start Scanner Button
    const startScannerBtn = document.getElementById("start-camera-scan-btn");
    if (startScannerBtn) {
      startScannerBtn.onclick = (e) => {
        e.preventDefault();
        document.getElementById("camera-scanner-wrapper")?.classList.remove("hidden");
        digitalHandshake.startTravelerScanner("qr-reader", (record) => {
          // record is already saved to store by processScannedPayload internally
          this.onHandshakeSuccess(record);
          digitalHandshake.stopTravelerScanner();
          document.getElementById("camera-scanner-wrapper")?.classList.add("hidden");
        });
      };
    }

    const closeScannerBtn = document.getElementById("close-camera-scanner-btn");
    if (closeScannerBtn) {
      closeScannerBtn.onclick = (e) => {
        e.preventDefault();
        digitalHandshake.stopTravelerScanner();
        document.getElementById("camera-scanner-wrapper")?.classList.add("hidden");
      };
    }

    // SOS Emergency Button
    const sosBtn = document.getElementById("emergency-sos-floating-btn");
    if (sosBtn) {
      sosBtn.onclick = (e) => {
        e.preventDefault();
        this.triggerSosFlow();
      };
    }

    // Hotspot Directory Search Input
    const hotspotSearchInput = document.getElementById("hotspot-search-input");
    if (hotspotSearchInput) {
      hotspotSearchInput.oninput = (e) => {
        hotspotRadar.searchQuery = e.target.value;
        hotspotRadar.renderHotspotsDirectory();
      };
    }

    // Hotspot Directory Category Pills
    document.querySelectorAll(".hotspot-cat-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll(".hotspot-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        hotspotRadar.activeCategoryFilter = btn.getAttribute("data-cat");
        hotspotRadar.renderHotspotsDirectory();
      };
    });
  }

  populateCityDropdown() {
    const selector = document.getElementById("header-city-selector");
    if (!selector) return;

    const cities = store.getCities();
    selector.innerHTML = Object.values(cities).map(city => `
      <option value="${city.id}" ${city.id === store.currentCityId ? "selected" : ""}>
        📍 ${city.name} (${city.state})
      </option>
    `).join("");
  }

  onCityChanged() {
    const city = store.getCurrentCity();
    const locPill = document.getElementById("current-location-pill");
    if (locPill) locPill.innerHTML = `<span class="gps-live-dot"></span> ${store.currentLocation.name}`;

    transitSafety.initRoutePlanner();
    reviewsManager.renderGuideLedger();
    hotspotRadar.renderMapLayers();
    hotspotRadar.renderHotspotsDirectory();
    hotspotRadar.checkGeofenceProximity();

    if (store.currentRole === "guide") {
      digitalHandshake.startGuideQrRotation();
    }
  }

  switchRole(role) {
    store.currentRole = role;

    document.querySelectorAll(".role-toggle-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-role") === role);
    });

    document.body.classList.toggle("role-guide", role === "guide");

    if (role === "guide") {
      try { digitalHandshake.startGuideQrRotation("guide-qr-canvas", "qr-countdown-badge"); } catch (e) { console.warn("[Verida] QR rotation error:", e); }
      try { reviewsManager.renderGuideLedger(store.activeGuide.id || store.activeGuide.uid, "guide-self-ledger"); } catch (e) { console.warn("[Verida] Guide ledger error:", e); }
      this.switchTab("guide-qr");
    } else {
      try { digitalHandshake.stopGuideQrRotation(); } catch (e) {}
      this.switchTab("transit");
    }
  }

  switchTab(tabKey) {
    this.activeTab = tabKey;

    document.querySelectorAll(".nav-tab-btn, .desktop-nav-link").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-tab") === tabKey);
    });

    document.querySelectorAll(".tab-content-panel").forEach(panel => {
      panel.classList.toggle("active", panel.getAttribute("id") === `tab-${tabKey}`);
    });

    // Lifecycle triggers
    if (tabKey === "radar") {
      hotspotRadar.renderHotspotsDirectory();
      setTimeout(() => {
        try {
          if (!hotspotRadar.map) hotspotRadar.initMap();
          else {
            hotspotRadar.map.invalidateSize();
            hotspotRadar.renderMapLayers();
            hotspotRadar.renderHotspotsDirectory();
          }
        } catch (e) {
          console.warn("[Verida Map Invalidate Warning]:", e);
        }
      }, 150);
    }

    if (tabKey === "transit") {
      try { transitSafety.initRoutePlanner(); } catch (e) { console.warn("[Verida] Transit planner error:", e); }
    } else if (tabKey === "guide-qr") {
      setTimeout(() => {
        try { digitalHandshake.startGuideQrRotation("guide-qr-canvas", "qr-countdown-badge"); } catch (e) { console.warn("[Verida] QR rotation error:", e); }
        try { reviewsManager.renderGuideLedger(store.activeGuide.id || store.activeGuide.uid, "guide-self-ledger"); } catch (e) { console.warn("[Verida] Guide-self ledger error:", e); }
      }, 80);
    } else if (tabKey === "ledger") {
      try {
        if (store.currentRole === "guide") {
          reviewsManager.renderGuideLedger(store.activeGuide.id || store.activeGuide.uid, "guide-ledger-container");
        } else {
          reviewsManager.renderGuideLedger();
        }
      } catch (e) { console.warn("[Verida] Ledger render error:", e); }
    } else if (tabKey === "profile") {
      try { this.renderProfileTab(); } catch (e) { console.warn("[Verida] Profile render error:", e); }
    }
  }

  renderProfileTab() {
    const container = document.getElementById("profile-container");
    if (!container) return;
    const isGuide = store.currentRole === "guide";
    const profile = isGuide ? store.activeGuide : store.activeUser;
    
    container.innerHTML = `
      <div style="padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="font-weight: 800; font-size: 18px; margin-bottom: 12px;"><i class="fas fa-user-circle"></i> ${isGuide ? 'Driver / Guide Profile' : 'Passenger Profile'}</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Name:</strong> ${profile.name || 'N/A'}</div>
          <div><strong>Phone:</strong> ${profile.phone || 'N/A'}</div>
          ${isGuide ? `
            <div><strong>Vehicle No:</strong> ${profile.vehicleRegNo || 'N/A'}</div>
            <div><strong>Aadhaar No:</strong> ${profile.aadharNo || 'Not Provided'}</div>
            <div><strong>License:</strong> ${profile.licenseNo || profile.rtoLicenseNo || 'N/A'}</div>
          ` : `
            <div><strong>Origin:</strong> ${profile.origin || 'N/A'}</div>
            <div><strong>Emergency Contact:</strong> ${profile.emergencyContact || profile.emergency || 'N/A'}</div>
          `}
        </div>
        <button type="button" class="btn btn-outline btn-block" style="margin-top: 16px;" onclick="authManager.openAuthModal('${store.currentRole}')">
          <i class="fas fa-user-edit"></i> Edit Profile Information
        </button>
      </div>
    `;
  }

  // --- Handshake Execution Flow ---
  async executeHandshakeFlow() {
    // processScannedPayload inside simulateLiveHandshake already calls store.recordHandshake
    const record = await digitalHandshake.simulateLiveHandshake();
    if (record) {
      this.onHandshakeSuccess(record);
    }
  }

  onHandshakeSuccess(record) {
    const modal = document.getElementById("handshake-success-modal");
    const content = document.getElementById("handshake-success-content");

    if (modal && content) {
      const aadharVal = store.activeGuide.aadharNo || record.aadharNo || "Not Provided";
      const vehicleVal = store.activeGuide.vehicleRegNo || record.vehicleRegNo || "GJ-06-AU-7892";

      content.innerHTML = `
        <div class="verified-encounter-card animate-bounce-in">
          <div class="badge-shield-wrap">
            <div class="shield-circle"><i class="fas fa-shield-check"></i></div>
            <span class="encounter-verified-text">DIGITAL HANDSHAKE VERIFIED</span>
          </div>

          <div class="verified-guide-profile">
            <img src="${store.activeGuide.photo}" alt="${record.guideName}" class="verified-guide-avatar">
            <div class="verified-guide-text">
              <h3>${record.guideName}</h3>
              <p class="vehicle-badge-pill" style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; display: inline-block; font-family: monospace; font-weight: bold; margin-bottom: 2px;">
                <i class="fas fa-taxi"></i> Vehicle No: ${vehicleVal}
              </p>
              <p class="aadhar-tag" style="font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 500;">
                <i class="fas fa-id-card"></i> Aadhaar No: <strong>${aadharVal}</strong>
              </p>
              <p class="lic-tag" style="font-size: 13px; margin-bottom: 2px;">
                <i class="fas fa-id-badge"></i> RTO License: <strong>${record.guideLicenseNo}</strong>
              </p>
              <p class="issuer-tag" style="font-size: 12px; color: #64748b;">
                <i class="fas fa-university"></i> ${record.guideIssuer}
              </p>
            </div>
          </div>

          <div class="encounter-metrics-grid">
            <div class="metric-item">
              <span class="m-label">Physical Proximity</span>
              <span class="m-val text-success">${record.distanceMeters}m (Verified)</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Govt Verification</span>
              <span class="m-val text-success">ASI / Gujarat Approved</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Verified Encounters</span>
              <span class="m-val">${store.activeGuide.encounterCount + 1} On Record</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Trust Index</span>
              <span class="m-val text-success">98.5% Authenticity</span>
            </div>
          </div>

          <div class="encounter-ledger-proof">
            <i class="fas fa-link"></i> Immutable Ledger Hash: <code>${record.tokenHash}</code>
          </div>

          <button type="button" class="btn btn-primary btn-block btn-lg" id="proceed-to-review-btn">
            <i class="fas fa-arrow-right"></i> Leave a Proof-of-Presence Review
          </button>
        </div>
      `;

      modal.classList.add("active");
     const proceedBtn = document.getElementById("proceed-to-review-btn");
if (proceedBtn) {
  proceedBtn.onclick = (e) => {
    e.preventDefault();
    modal.classList.remove("active");
    const targetGuideId = record.guideId || record.driverId || record.id || store.activeGuide.id;
    reviewsManager.renderGuideLedger(targetGuideId, "guide-ledger-container");
    this.switchTab("ledger");
  };
      }
    }
  }

  // --- SOS Flow ---
  triggerSosFlow() {
    const dossier = evidencePacketManager.compileDossier({
      category: "Extortionate Overcharging & Street Tout Harassment",
      suspectName: store.activeGuide.name,
      suspectLicense: store.activeGuide.licenseNo,
      quotedPrice: 450,
      description: `Unregulated operator approached at ${store.currentLocation.name}. Demanded ₹450 cash for standard ₹100 local route.`
    });
    evidencePacketManager.showEvidenceModal(dossier);
  }
}

// Global Exports
window.veridaApp = new App();
window.digitalHandshake = digitalHandshake;
window.demoSimulator = demoSimulator;
window.hotspotRadar = hotspotRadar;
window.reviewsManager = reviewsManager;
window.evidencePacketManager = evidencePacketManager;
window.transitSafety = transitSafety;
window.authManager = authManager;
window.store = store;

// Immediate or DOMContentLoaded trigger
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.veridaApp.init();
  });
} else {
  window.veridaApp.init();
}
  */



/**
 * Verida — Main Application Controller & View Router
 */

import { store } from "./store.js";
import { digitalHandshake } from "./handshake.js";
import { hotspotRadar } from "./hotspots.js";
import { reviewsManager } from "./reviews.js";
import { evidencePacketManager } from "./evidencePacket.js";
import { demoSimulator } from "./demoSimulator.js";
import { transitSafety } from "./transitSafety.js";
import { authManager } from "./authManager.js";

class App {
  constructor() {
    this.activeTab = "handshake";
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log(
      "[Verida] Initializing On-The-Spot Tourism & Transit Trust Platform..."
    );

    // Step 1: Populate city dropdown
    try {
      this.populateCityDropdown();
    } catch (e) {
      console.warn("[Verida] City dropdown error:", e);
    }

    // Step 2: Bind all event listeners
    try {
      this.bindEvents();
    } catch (e) {
      console.warn("[Verida] Event binding error:", e);
    }

    // Step 3: Load auth manager
    try {
      authManager.init();
    } catch (e) {
      console.warn("[Verida] Auth init error:", e);
    }

    // Step 4: Sync profile names to UI
    try {
      this.syncProfileDisplayNames();
    } catch (e) {
      console.warn("[Verida] Profile sync error:", e);
    }

    // Step 5: Switch role
    try {
      this.switchRole(store.currentRole);
    } catch (e) {
      console.warn("[Verida] Role switch error:", e);
    }

    // Step 6: Switch to default tab
    try {
      this.switchTab("transit");
    } catch (e) {
      console.warn("[Verida] Initial tab switch error:", e);

      const transitPanel = document.getElementById("tab-transit");
      if (transitPanel) {
        transitPanel.classList.add("active");
      }
    }

    // Step 7: Pre-render ledger
    try {
      reviewsManager.renderGuideLedger();
    } catch (e) {
      console.warn("[Verida] Ledger render error:", e);
    }

    // Step 8: Initialize map
    setTimeout(() => {
      try {
        hotspotRadar.initMap();
      } catch (e) {
        console.warn("[Verida] Map init error:", e);
      }
    }, 300);
  }

  syncProfileDisplayNames() {
    const passengerName = store.activeUser.name;
    const driverName = store.activeGuide.name;
    const driverPlate =
      store.activeGuide.vehicleRegNo || "GJ-06-AU-7892";
    const driverVehicle =
      store.activeGuide.vehicleType || "Green CNG Auto-Rickshaw";

    const nameEl = document.getElementById("header-user-display-name");
    if (nameEl) {
      nameEl.textContent = passengerName;
    }

    const dualPassName =
      document.getElementById("dual-passenger-name");

    if (dualPassName) {
      dualPassName.textContent = passengerName;
    }

    const dualDriverName =
      document.getElementById("dual-driver-name");

    if (dualDriverName) {
      dualDriverName.textContent = driverName;
    }

    // Main driver card
    const driverCardName =
      document.getElementById("driver-card-name");

    const driverCardLic =
      document.getElementById("driver-card-lic");

    if (driverCardName) {
      driverCardName.textContent = driverName;
    }

    if (driverCardLic) {
      driverCardLic.textContent =
        `${driverPlate} • ${driverVehicle}`;
    }

    // Dual driver card
    const driverCardNameDual =
      document.getElementById("driver-card-name-dual");

    const driverCardLicDual =
      document.getElementById("driver-card-lic-dual");

    if (driverCardNameDual) {
      driverCardNameDual.textContent = driverName;
    }

    if (driverCardLicDual) {
      driverCardLicDual.textContent =
        `${driverPlate} • ${driverVehicle}`;
    }
  }

  bindEvents() {
    // City Selector
    const citySelector =
      document.getElementById("header-city-selector");

    if (citySelector) {
      citySelector.onchange = (e) => {
        store.setCity(e.target.value);
        this.onCityChanged();
      };
    }

    // Role Switcher
    document.querySelectorAll(".role-toggle-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();

        const targetRole =
          btn.getAttribute("data-role");

        this.switchRole(targetRole);
      };
    });

    // Navigation Tabs
    document
      .querySelectorAll(".nav-tab-btn, .desktop-nav-link")
      .forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();

          const tab =
            btn.getAttribute("data-tab");

          if (tab) {
            this.switchTab(tab);
          }
        };
      });

    // Dual Screen Presenter Toggle
    const dualBtn =
      document.getElementById("toggle-dual-screen-btn");

    if (dualBtn) {
      dualBtn.onclick = (e) => {
        e.preventDefault();
        demoSimulator.toggleDualScreen();
      };
    }

    // View Mode Toggle
    const viewModeBtn =
      document.getElementById("toggle-view-mode-btn");

    if (viewModeBtn) {
      viewModeBtn.onclick = (e) => {
        e.preventDefault();

        document.body.classList.toggle(
          "mobile-mockup-mode"
        );

        const isMockup =
          document.body.classList.contains(
            "mobile-mockup-mode"
          );

        viewModeBtn.innerHTML = isMockup
          ? `<i class="fas fa-desktop"></i> Laptop Dashboard View`
          : `<i class="fas fa-mobile-screen"></i> Phone Simulator Frame`;
      };
    }

    // Teleport Selector
    const teleportSelect =
      document.getElementById("demo-teleport-select");

    if (teleportSelect) {
      teleportSelect.onchange = (e) => {
        if (e.target.value) {
          demoSimulator.teleport(e.target.value);
        }
      };
    }

    // Live Handshake Simulation
    const simScanBtn =
      document.getElementById("simulate-scan-btn");

    if (simScanBtn) {
      simScanBtn.onclick = (e) => {
        e.preventDefault();
        this.executeHandshakeFlow();
      };
    }

    // Camera Start Scanner
    const startScannerBtn =
      document.getElementById("start-camera-scan-btn");

    if (startScannerBtn) {
      startScannerBtn.onclick = (e) => {
        e.preventDefault();

        document
          .getElementById("camera-scanner-wrapper")
          ?.classList.remove("hidden");

        digitalHandshake.startTravelerScanner(
          "qr-reader",
          (record) => {
            this.onHandshakeSuccess(record);

            digitalHandshake.stopTravelerScanner();

            document
              .getElementById("camera-scanner-wrapper")
              ?.classList.add("hidden");
          }
        );
      };
    }

    const closeScannerBtn =
      document.getElementById("close-camera-scanner-btn");

    if (closeScannerBtn) {
      closeScannerBtn.onclick = (e) => {
        e.preventDefault();

        digitalHandshake.stopTravelerScanner();

        document
          .getElementById("camera-scanner-wrapper")
          ?.classList.add("hidden");
      };
    }

    // SOS Emergency Button
    const sosBtn =
      document.getElementById("emergency-sos-floating-btn");

    if (sosBtn) {
      sosBtn.onclick = (e) => {
        e.preventDefault();
        this.triggerSosFlow();
      };
    }

    // Hotspot Search
    const hotspotSearchInput =
      document.getElementById("hotspot-search-input");

    if (hotspotSearchInput) {
      hotspotSearchInput.oninput = (e) => {
        hotspotRadar.searchQuery =
          e.target.value;

        hotspotRadar.renderHotspotsDirectory();
      };
    }

    // Hotspot Categories
    document
      .querySelectorAll(".hotspot-cat-btn")
      .forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();

          document
            .querySelectorAll(".hotspot-cat-btn")
            .forEach((b) =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

          hotspotRadar.activeCategoryFilter =
            btn.getAttribute("data-cat");

          hotspotRadar.renderHotspotsDirectory();
        };
      });
  }

  populateCityDropdown() {
    const selector =
      document.getElementById("header-city-selector");

    if (!selector) return;

    const cities = store.getCities();

    selector.innerHTML = Object.values(cities)
      .map(
        (city) => `
      <option value="${city.id}" ${
          city.id === store.currentCityId
            ? "selected"
            : ""
        }>
        📍 ${city.name} (${city.state})
      </option>
    `
      )
      .join("");
  }

  onCityChanged() {
    store.getCurrentCity();

    const locPill =
      document.getElementById("current-location-pill");

    if (locPill) {
      locPill.innerHTML = `
        <span class="gps-live-dot"></span>
        ${store.currentLocation.name}
      `;
    }

    transitSafety.initRoutePlanner();

    reviewsManager.renderGuideLedger();

    hotspotRadar.renderMapLayers();

    hotspotRadar.renderHotspotsDirectory();

    hotspotRadar.checkGeofenceProximity();

    if (store.currentRole === "guide") {
      digitalHandshake.startGuideQrRotation();
    }
  }

  switchRole(role) {
    store.currentRole = role;

    document
      .querySelectorAll(".role-toggle-btn")
      .forEach((b) => {
        b.classList.toggle(
          "active",
          b.getAttribute("data-role") === role
        );
      });

    document.body.classList.toggle(
      "role-guide",
      role === "guide"
    );

    if (role === "guide") {
      try {
        digitalHandshake.startGuideQrRotation(
          "guide-qr-canvas",
          "qr-countdown-badge"
        );
      } catch (e) {
        console.warn(
          "[Verida] QR rotation error:",
          e
        );
      }

      try {
        reviewsManager.renderGuideLedger(
          store.activeGuide.id ||
            store.activeGuide.uid,
          "guide-self-ledger"
        );
      } catch (e) {
        console.warn(
          "[Verida] Guide ledger error:",
          e
        );
      }

      this.switchTab("guide-qr");
    } else {
      try {
        digitalHandshake.stopGuideQrRotation();
      } catch (e) {}

      this.switchTab("transit");
    }
  }

  switchTab(tabKey) {
    this.activeTab = tabKey;

    document
      .querySelectorAll(
        ".nav-tab-btn, .desktop-nav-link"
      )
      .forEach((b) => {
        b.classList.toggle(
          "active",
          b.getAttribute("data-tab") === tabKey
        );
      });

    document
      .querySelectorAll(".tab-content-panel")
      .forEach((panel) => {
        panel.classList.toggle(
          "active",
          panel.getAttribute("id") ===
            `tab-${tabKey}`
        );
      });

    if (tabKey === "radar") {
      hotspotRadar.renderHotspotsDirectory();

      setTimeout(() => {
        try {
          if (!hotspotRadar.map) {
            hotspotRadar.initMap();
          } else {
            hotspotRadar.map.invalidateSize();
            hotspotRadar.renderMapLayers();
            hotspotRadar.renderHotspotsDirectory();
          }
        } catch (e) {
          console.warn(
            "[Verida Map Invalidate Warning]:",
            e
          );
        }
      }, 150);
    }

    if (tabKey === "transit") {
      try {
        transitSafety.initRoutePlanner();
      } catch (e) {
        console.warn(
          "[Verida] Transit planner error:",
          e
        );
      }
    } else if (tabKey === "guide-qr") {
      setTimeout(() => {
        try {
          digitalHandshake.startGuideQrRotation(
            "guide-qr-canvas",
            "qr-countdown-badge"
          );
        } catch (e) {
          console.warn(
            "[Verida] QR rotation error:",
            e
          );
        }

        try {
          reviewsManager.renderGuideLedger(
            store.activeGuide.id ||
              store.activeGuide.uid,
            "guide-self-ledger"
          );
        } catch (e) {
          console.warn(
            "[Verida] Guide-self ledger error:",
            e
          );
        }
      }, 80);
    } else if (tabKey === "ledger") {
      try {
        if (store.currentRole === "guide") {
          reviewsManager.renderGuideLedger(
            store.activeGuide.id ||
              store.activeGuide.uid,
            "guide-ledger-container"
          );
        } else {
          reviewsManager.renderGuideLedger();
        }
      } catch (e) {
        console.warn(
          "[Verida] Ledger render error:",
          e
        );
      }
    } else if (tabKey === "profile") {
      try {
        this.renderProfileTab();
      } catch (e) {
        console.warn(
          "[Verida] Profile render error:",
          e
        );
      }
    }
  }

  renderProfileTab() {
    const container =
      document.getElementById(
        "profile-container"
      );

    if (!container) return;

    const isGuide =
      store.currentRole === "guide";

    const profile =
      isGuide
        ? store.activeGuide
        : store.activeUser;

    container.innerHTML = `
      <div style="padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="font-weight: 800; font-size: 18px; margin-bottom: 12px;">
          <i class="fas fa-user-circle"></i>
          ${
            isGuide
              ? "Driver / Guide Profile"
              : "Passenger Profile"
          }
        </h3>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <strong>Name:</strong>
            ${profile.name || "N/A"}
          </div>

          <div>
            <strong>Phone:</strong>
            ${profile.phone || "N/A"}
          </div>

          ${
            isGuide
              ? `
            <div>
              <strong>Vehicle No:</strong>
              ${profile.vehicleRegNo || "N/A"}
            </div>

            <div>
              <strong>Aadhaar No:</strong>
              ${profile.aadharNo || "Not Provided"}
            </div>

            <div>
              <strong>License:</strong>
              ${
                profile.licenseNo ||
                profile.rtoLicenseNo ||
                "N/A"
              }
            </div>
          `
              : `
            <div>
              <strong>Origin:</strong>
              ${profile.origin || "N/A"}
            </div>

            <div>
              <strong>Emergency Contact:</strong>
              ${
                profile.emergencyContact ||
                profile.emergency ||
                "N/A"
              }
            </div>
          `
          }
        </div>

        <button
          type="button"
          class="btn btn-outline btn-block"
          style="margin-top: 16px;"
          onclick="authManager.openAuthModal('${store.currentRole}')"
        >
          <i class="fas fa-user-edit"></i>
          Edit Profile Information
        </button>
      </div>
    `;
  }

  // --- Handshake Execution Flow ---
  async executeHandshakeFlow() {
    const record =
      await digitalHandshake.simulateLiveHandshake();

    if (record) {
      this.onHandshakeSuccess(record);
    }
  }

  onHandshakeSuccess(record) {
    const modal =
      document.getElementById(
        "handshake-success-modal"
      );

    const content =
      document.getElementById(
        "handshake-success-content"
      );

    if (!modal || !content) return;

    /*
     * IMPORTANT:
     * Everything below comes from the authenticated/scanned
     * driver QR payload first.
     *
     * The store.activeGuide fallback is used only when the
     * QR payload does not contain that particular field.
     */

    const aadharVal =
      record.guideAadharNo ||
      record.aadharNo ||
      "Not Provided";

    const vehicleVal =
      record.guideVehicleRegNo ||
      record.vehicleRegNo ||
      "Not Provided";

    const driverPhoto =
      record.guidePhoto ||
      record.photo ||
      store.activeGuide.photo ||
      "";

    const driverTrust =
      record.guideTrustScore ??
      record.trustScore ??
      store.activeGuide.trustScore ??
      0;

    const driverEncounters =
      record.guideEncounterCount ??
      record.encounterCount ??
      store.activeGuide.encounterCount ??
      0;

    const driverName =
      record.guideName ||
      record.name ||
      "Unknown Driver";

    const driverPhone =
      record.guidePhone ||
      record.phone ||
      "";

    const driverLicense =
      record.guideLicenseNo ||
      record.licenseNo ||
      record.guideRtoLicenseNo ||
      record.rtoLicenseNo ||
      "Not Provided";

    const driverRtoLicense =
      record.guideRtoLicenseNo ||
      record.rtoLicenseNo ||
      driverLicense;

    const driverIssuer =
      record.guideIssuer ||
      record.issuer ||
      "Not Provided";

    const driverGovtIssuer =
      record.guideGovtIssuer ||
      record.govtIssuer ||
      driverIssuer;

    const driverVehicleType =
      record.guideVehicleType ||
      record.vehicleType ||
      "Not Provided";

    const driverCategory =
      record.guideCategory ||
      record.category ||
      "Not Provided";

    const driverId =
      record.guideId ||
      record.driverId ||
      record.id ||
      null;

    /*
     * CRITICAL FIX:
     * Replace the currently active driver with the driver
     * authenticated by the QR handshake.
     *
     * This means the next safety card will use the scanned
     * driver's actual information instead of always using
     * the default Mehul Bhai profile.
     */
    transitSafety.activeDriver = {
      ...(store.activeGuide || {}),

      id: driverId,
      uid: driverId,

      name: driverName,
      phone: driverPhone,

      photo: driverPhoto,

      vehicleRegNo: vehicleVal,
      vehicleType: driverVehicleType,

      licenseNo: driverLicense,
      rtoLicenseNo: driverRtoLicense,

      issuer: driverIssuer,
      govtIssuer: driverGovtIssuer,

      aadharNo: aadharVal,

      category: driverCategory,

      rating:
        record.guideRating ??
        record.rating ??
        0,

      trustScore: driverTrust,

      encounterCount: driverEncounters
    };

    content.innerHTML = `
      <div class="verified-encounter-card animate-bounce-in">

        <div class="badge-shield-wrap">
          <div class="shield-circle">
            <i class="fas fa-shield-check"></i>
          </div>

          <span class="encounter-verified-text">
            DIGITAL HANDSHAKE VERIFIED
          </span>
        </div>

        <div class="verified-guide-profile">

          <img
            src="${driverPhoto}"
            alt="${driverName}"
            class="verified-guide-avatar"
          >

          <div class="verified-guide-text">

            <h3>${driverName}</h3>

            <p
              class="vehicle-badge-pill"
              style="
                background: #fef3c7;
                color: #92400e;
                padding: 2px 8px;
                border-radius: 4px;
                display: inline-block;
                font-family: monospace;
                font-weight: bold;
                margin-bottom: 2px;
              "
            >
              <i class="fas fa-taxi"></i>
              Vehicle No: ${vehicleVal}
            </p>

            <p
              class="aadhar-tag"
              style="
                font-size: 11px;
                color: #64748b;
                margin-bottom: 6px;
                font-weight: 500;
              "
            >
              <i class="fas fa-id-card"></i>
              Aadhaar No:
              <strong>${aadharVal}</strong>
            </p>

            <p
              class="lic-tag"
              style="
                font-size: 13px;
                margin-bottom: 2px;
              "
            >
              <i class="fas fa-id-badge"></i>
              RTO License:
              <strong>${driverLicense}</strong>
            </p>

            <p
              class="issuer-tag"
              style="
                font-size: 12px;
                color: #64748b;
              "
            >
              <i class="fas fa-university"></i>
              ${driverIssuer}
            </p>

          </div>
        </div>

        <div class="encounter-metrics-grid">

          <div class="metric-item">
            <span class="m-label">
              Physical Proximity
            </span>

            <span class="m-val text-success">
              ${record.distanceMeters}m (Verified)
            </span>
          </div>

          <div class="metric-item">
            <span class="m-label">
              Govt Verification
            </span>

            <span class="m-val text-success">
              ${driverGovtIssuer || "Verified"}
            </span>
          </div>

          <div class="metric-item">
            <span class="m-label">
              Verified Encounters
            </span>

            <span class="m-val">
              ${driverEncounters + 1} On Record
            </span>
          </div>

          <div class="metric-item">
            <span class="m-label">
              Trust Index
            </span>

            <span class="m-val text-success">
              ${driverTrust}% Authenticity
            </span>
          </div>

        </div>

        <div class="encounter-ledger-proof">
          <i class="fas fa-link"></i>
          Immutable Ledger Hash:
          <code>${record.tokenHash}</code>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-block btn-lg"
          id="proceed-to-review-btn"
        >
          <i class="fas fa-arrow-right"></i>
          Leave a Proof-of-Presence Review
        </button>

      </div>
    `;

    modal.classList.add("active");

    const proceedBtn =
      document.getElementById(
        "proceed-to-review-btn"
      );

    if (proceedBtn) {
      proceedBtn.onclick = (e) => {
        e.preventDefault();

        modal.classList.remove("active");

        const targetGuideId =
          driverId ||
          store.activeGuide.id ||
          store.activeGuide.uid;

        reviewsManager.renderGuideLedger(
          targetGuideId,
          "guide-ledger-container"
        );

        this.switchTab("ledger");
      };
    }
  }

  // --- SOS Flow ---
  triggerSosFlow() {
    const dossier =
      evidencePacketManager.compileDossier({
        category:
          "Extortionate Overcharging & Street Tout Harassment",

        suspectName:
          transitSafety.activeDriver?.name ||
          store.activeGuide.name,

        suspectLicense:
          transitSafety.activeDriver?.licenseNo ||
          store.activeGuide.licenseNo,

        quotedPrice: 450,

        description:
          `Unregulated operator approached at ${store.currentLocation.name}. Demanded ₹450 cash for standard ₹100 local route.`
      });

    evidencePacketManager.showEvidenceModal(
      dossier
    );
  }
}

// Global Exports
window.veridaApp = new App();
window.digitalHandshake = digitalHandshake;
window.demoSimulator = demoSimulator;
window.hotspotRadar = hotspotRadar;
window.reviewsManager = reviewsManager;
window.evidencePacketManager = evidencePacketManager;
window.transitSafety = transitSafety;
window.authManager = authManager;
window.store = store;

// Immediate or DOMContentLoaded trigger
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      window.veridaApp.init();
    }
  );
} else {
  window.veridaApp.init();
}