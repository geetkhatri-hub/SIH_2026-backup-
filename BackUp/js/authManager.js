/**
 * Verida — Auth & Registration Manager
 * Handles Passenger & Driver onboarding, localStorage persistence,
 * modal bindings, and live profile sync to UI.
 */

import { store } from "./store.js";

const AUTH_KEY_PASSENGER = "verida_user_profile"; // Must match the key store.js uses to load
const AUTH_KEY_DRIVER = "verida_guide_profile"; // Must match the key store.js uses to load

class AuthManager {
  constructor() {
    this.activeAuthTab = "passenger";
  }

  /* ============================================================
   *  INIT — call once on app boot
   * ============================================================ */
  init() {
    this._loadSavedProfiles();
    this._bindModal();
    this._bindAuthForms();
    this._bindProfileButton();
    console.log("[Verida Auth] AuthManager initialized.");
  }

  /* ============================================================
   *  MODAL OPEN / CLOSE
   * ============================================================ */
  openAuthModal(defaultRole = "passenger") {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    this._switchAuthTab(defaultRole);
    modal.classList.add("active");
  }

  closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
  }

  /* ============================================================
   *  INTERNAL BINDERS
   * ============================================================ */
  _bindModal() {
    // Close button inside modal
    const closeBtn = document.getElementById("close-auth-modal-btn");
    if (closeBtn) closeBtn.onclick = () => this.closeAuthModal();

    // Click outside to close
    const backdrop = document.getElementById("auth-modal");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeAuthModal();
      });
    }

    // Tab switcher buttons
    document.querySelectorAll(".auth-tab-btn").forEach(btn => {
      btn.onclick = () => {
        const tab = btn.getAttribute("data-tab");
        if (tab) this._switchAuthTab(tab);
      };
    });
  }

  _switchAuthTab(tabName) {
    this.activeAuthTab = tabName;
    document.querySelectorAll(".auth-tab-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
    });
    const passengerPanel = document.getElementById("auth-panel-passenger");
    const driverPanel = document.getElementById("auth-panel-driver");
    if (passengerPanel) passengerPanel.classList.toggle("hidden", tabName !== "passenger");
    if (driverPanel) driverPanel.classList.toggle("hidden", tabName !== "driver");
  }

  _bindProfileButton() {
    const btn = document.getElementById("header-profile-btn");
    if (btn) {
      btn.onclick = () => this.openAuthModal("passenger");
    }
  }

  _bindAuthForms() {
    // Passenger form submit
    const passengerForm = document.getElementById("passenger-auth-form");
    if (passengerForm) {
      passengerForm.onsubmit = (e) => {
        e.preventDefault();
        this._savePassengerProfile();
      };
    }

    // Driver form submit
    const driverForm = document.getElementById("driver-auth-form");
    if (driverForm) {
      driverForm.onsubmit = (e) => {
        e.preventDefault();
        this._saveDriverProfile();
      };
    }
  }

  /* ============================================================
   *  SAVE PROFILES
   * ============================================================ */
  _savePassengerProfile() {
    const name = document.getElementById("reg-passenger-name")?.value.trim();
    const phone = document.getElementById("reg-passenger-phone")?.value.trim();
    const origin = document.getElementById("reg-passenger-origin")?.value.trim();
    const emergency = document.getElementById("reg-passenger-emergency")?.value.trim();

    if (!name) {
      this._flashError("reg-passenger-name", "Please enter your full name.");
      return;
    }

    const profile = { name, phone, origin, emergency, createdAt: new Date().toISOString() };

    // Use store.registerPassenger so it persists to the correct localStorage key
    store.registerPassenger(profile);

    this._syncNamesToUI();
    this.closeAuthModal();

    // Re-render profile tab if active
    setTimeout(() => {
      if (window.veridaApp) {
        window.veridaApp.renderProfileTab();
      }
    }, 100);

    this._showSuccessToast(`✅ Passenger profile saved — Welcome, ${name}!`, "green");
    console.log("[Verida Auth] Passenger profile saved:", profile);
  }

  _saveDriverProfile() {
    const name = document.getElementById("reg-driver-name")?.value.trim();
    const phone = document.getElementById("reg-driver-phone")?.value.trim();
    const plate = document.getElementById("reg-driver-plate")?.value.trim().toUpperCase();
    const lic = document.getElementById("reg-driver-lic")?.value.trim();
    const vehicleType = document.getElementById("reg-driver-type")?.value;
    const aadharNo = document.getElementById("reg-adhar-no")?.value.trim();

    if (!name) {
      this._flashError("reg-driver-name", "Please enter driver name.");
      return;
    }
    if (!plate) {
      this._flashError("reg-driver-plate", "Vehicle registration number is required.");
      return;
    }

    const profile = {
      name,
      phone,
      vehicleRegNo: plate,
      licenseNo: lic,
      vehicleType,
      aadharNo,
      createdAt: new Date().toISOString()
    };

    // Use store.registerDriver so it persists to the correct localStorage key
    store.registerDriver(profile);

    this._syncNamesToUI();
    this.closeAuthModal();

    // Re-render the QR with updated guide data and sync profile tab
    setTimeout(() => {
      if (window.digitalHandshake) {
        window.digitalHandshake.stopGuideQrRotation();
        window.digitalHandshake.startGuideQrRotation("guide-qr-canvas", "qr-countdown-badge");
      }
      if (window.veridaApp) {
        window.veridaApp.renderProfileTab();
        if (store.currentRole === "guide") {
          window.reviewsManager?.renderGuideLedger(store.activeGuide.id, "guide-self-ledger");
        }
      }
    }, 150);

    this._showSuccessToast(`✅ Driver profile saved — ${name} (${plate})`, "blue");
    console.log("[Verida Auth] Driver profile saved:", profile);
  }

  /* ============================================================
   *  LOAD SAVED PROFILES
   * ============================================================ */
  _loadSavedProfiles() {
    // Load passenger
    const savedPassenger = localStorage.getItem(AUTH_KEY_PASSENGER);
    if (savedPassenger) {
      try {
        const p = JSON.parse(savedPassenger);
        store.activeUser = { ...store.activeUser, ...p };
        console.log("[Verida Auth] Passenger profile loaded:", p.name);
      } catch (err) {
        console.warn("[Verida Auth] Could not parse passenger profile.");
      }
    }

    // Load driver
    const savedDriver = localStorage.getItem(AUTH_KEY_DRIVER);
    if (savedDriver) {
      try {
        const d = JSON.parse(savedDriver);
        store.activeGuide = { ...store.activeGuide, ...d };
        console.log("[Verida Auth] Driver profile loaded:", d.name);
        // Pre-fill driver form fields
        this._prefillDriverForm(d);
      } catch (err) {
        console.warn("[Verida Auth] Could not parse driver profile.");
      }
    }

    // Pre-fill passenger form
    if (savedPassenger) {
      try {
        this._prefillPassengerForm(JSON.parse(savedPassenger));
      } catch (_) {}
    }
  }

  _prefillPassengerForm(p) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set("reg-passenger-name", p.name);
    set("reg-passenger-phone", p.phone);
    set("reg-passenger-origin", p.origin);
    set("reg-passenger-emergency", p.emergency);
  }

  _prefillDriverForm(d) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set("reg-driver-name", d.name);
    set("reg-driver-phone", d.phone);
    set("reg-driver-plate", d.vehicleRegNo);
    set("reg-driver-lic", d.licenseNo);
    set("reg-driver-type", d.vehicleType);
    set("reg-adhar-no", d.aadharNo);
  }

  /* ============================================================
   *  SYNC NAMES ACROSS ALL UI ELEMENTS
   * ============================================================ */
  _syncNamesToUI() {
    const passengerName = store.activeUser?.name || "Passenger";
    const driverName = store.activeGuide?.name || "Driver";
    const driverPlate = store.activeGuide?.vehicleRegNo || "GJ-00-XX-0000";
    const driverVehicle = store.activeGuide?.vehicleType || "Auto-Rickshaw";

    this._setEl("header-user-display-name", passengerName);
    this._setEl("dual-passenger-name", passengerName);
    this._setEl("dual-driver-name", driverName);
    this._setEl("driver-card-name", driverName);
    this._setEl("driver-card-lic", `${driverPlate} • ${driverVehicle}`);
    this._setEl("driver-card-name-dual", driverName);
    this._setEl("driver-card-lic-dual", `${driverPlate} • ${driverVehicle}`);

    // Also update app.js sync method if accessible
    if (window.veridaApp?.syncProfileDisplayNames) {
      window.veridaApp.syncProfileDisplayNames();
    }
  }

  /* ============================================================
   *  HELPERS
   * ============================================================ */
  _setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  _flashError(inputId, message) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.style.border = "1.5px solid var(--danger)";
    el.focus();
    setTimeout(() => { el.style.border = ""; }, 2000);

    // Show inline error
    let errEl = el.parentElement.querySelector(".auth-field-error");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "auth-field-error";
      errEl.style.cssText = "color:var(--danger);font-size:11px;display:block;margin-top:2px;";
      el.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
    setTimeout(() => errEl.remove(), 3000);
  }

  _showSuccessToast(message, color = "green") {
    const colorMap = { green: "#059669", blue: "#2563eb", orange: "#d97706" };
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(20px);
      background: ${colorMap[color] || colorMap.green}; color: #fff;
      padding: 12px 24px; border-radius: 50px; font-size: 13px; font-weight: 700;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 9999;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1); opacity: 0;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  /* Public accessor for profile */
  getPassengerProfile() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY_PASSENGER)) || null; } catch { return null; }
  }

  getDriverProfile() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY_DRIVER)) || null; } catch { return null; }
  }
}

export const authManager = new AuthManager();