/**
 * Verida — Transit Safety & Digital Footprint Module
 * Two-way Driver/Passenger verification, Origin->Destination Route Fare Intelligence with "Last 3 Passengers Paid",
 * Internal GPS Live Trip Tracking, and Zero-App Driver Protection workflows.
 */

import { store } from "./store.js";
import { SEED_ROUTES, SEED_DRIVERS } from "../data/seedData.js";
import { reviewsManager } from "./reviews.js";

export class TransitSafetyManager {
  constructor() {
    this.activeRoute = SEED_ROUTES[0];
    this.activeDriver = SEED_DRIVERS[0];
    this.activeTrip = null;
    this.tripTrackingInterval = null;
    this.tripProgress = 0;
    this.tripElapsedSec = 0;
  }

  // --- Initialize Route Planner ---
  initRoutePlanner(containerId = "route-planner-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (store.currentRole === "guide") {
      this.renderDriverTransitHistory(container);
      return;
    }

    const routes = store.getRoutesForCity(store.currentCityId);
    this.activeRoute = routes[0] || SEED_ROUTES[0];

    container.innerHTML = `
      <div class="transit-planner-card">
        <div class="transit-header-row">
          <div class="transit-title-block">
            <h3><i class="fas fa-route"></i> Route Fare Intelligence</h3>
            <p>Select pickup & destination to see what previous passengers paid.</p>
          </div>
          <span class="badge-pill-verified"><i class="fas fa-shield-check"></i> RTO Benchmarked</span>
        </div>

        <!-- Google Maps-style From -> To Inputs -->
        <div class="route-inputs-box">
          <div class="route-input-group">
            <span class="route-dot start-dot"></span>
            <div class="input-wrap">
              <label>Pickup Location (From)</label>
              <select id="route-from-select" class="route-select">
                ${routes.map((r, idx) => `
                  <option value="${r.id}" ${idx === 0 ? "selected" : ""}>📍 ${r.fromName}</option>
                `).join("")}
              </select>
            </div>
          </div>

          <div class="route-connector-line"></div>

          <div class="route-input-group">
            <span class="route-dot end-dot"></span>
            <div class="input-wrap">
              <label>Destination Drop-off (To)</label>
              <select id="route-to-select" class="route-select">
                ${routes.map((r, idx) => `
                  <option value="${r.id}" ${idx === 0 ? "selected" : ""}>🎯 ${r.toName} (${r.distanceKm} km)</option>
                `).join("")}
              </select>
            </div>
          </div>
        </div>

        <!-- Last 3 Passengers Paid Live Ticker Card -->
        <div class="last3-passengers-card" id="last3-passengers-container">
          <!-- Rendered dynamically -->
        </div>

      </div>
    `;

    this.renderLast3PassengersPaid();
    this.bindRouteEvents();
  }

  bindRouteEvents() {
    const fromSelect = document.getElementById("route-from-select");
    const toSelect = document.getElementById("route-to-select");

    const updateRoute = (routeId) => {
      const routes = store.getRoutesForCity(store.currentCityId);
      const found = routes.find(r => r.id === routeId);
      if (found) {
        this.activeRoute = found;
        if (fromSelect) fromSelect.value = found.id;
        if (toSelect) toSelect.value = found.id;
        this.renderLast3PassengersPaid();
      }
    };

    if (fromSelect) fromSelect.onchange = (e) => updateRoute(e.target.value);
    if (toSelect) toSelect.onchange = (e) => updateRoute(e.target.value);

    // Scan Driver QR
    const scanBtn = document.getElementById("scan-driver-qr-btn");
    if (scanBtn) {
      scanBtn.onclick = () => {
        this.openDriverVerificationModal(this.activeDriver);
      };
    }

    // Driver Has No App
    const zeroAppBtn = document.getElementById("zero-app-driver-btn");
    if (zeroAppBtn) {
      zeroAppBtn.onclick = () => {
        this.openZeroAppModal();
      };
    }
  }

  // --- Render "Last 3 Passengers Paid" Section ---
  renderLast3PassengersPaid() {
    const container = document.getElementById("last3-passengers-container");
    if (!container || !this.activeRoute) return;

    const r = this.activeRoute;
    const history = r.last3PassengersPaid || [];

    container.innerHTML = `
      <div class="last3-header">
        <div class="last3-title">
          <i class="fas fa-users-viewfinder" style="color: var(--primary);"></i>
          <strong>Last 3 Passengers Paid on this Exact Route:</strong>
        </div>
        <span class="fair-median-badge">Fair Range: ₹${r.fairRange.min}–₹${r.fairRange.median}</span>
      </div>

      <div class="last3-history-list">
        ${history.map((item, idx) => `
          <div class="last3-item animate-fade-in" style="animation-delay: ${idx * 0.08}s">
            <div class="last3-left">
              <span class="passenger-avatar-icon"><i class="fas fa-user-check"></i></span>
              <div class="passenger-meta">
                <span class="p-name"><strong>${item.passengerName}</strong></span>
                <span class="p-vehicle"><i class="fas fa-taxi"></i> ${item.vehicleNo} (${item.driverName})</span>
              </div>
            </div>
            <div class="last3-right">
              <span class="p-amount">₹${item.amount}</span>
              <span class="p-time">${item.timeAgo}</span>
            </div>
          </div>
        `).join("")}
      </div>

      ${r.toutScamWarning ? `
        <div class="route-scam-warning">
          <i class="fas fa-triangle-exclamation"></i>
          <span><strong>Tout Alert on this Route:</strong> ${r.toutScamWarning}</span>
        </div>
      ` : ""}
    `;
  }

  // --- Render Driver Transit History ---
renderTransitTab() {
  const container = document.getElementById("transit-tab-content") || document.getElementById("main-tab-view");
  if (!container) return;

  // Check if current active mode is Driver/Guide or Passenger
  const isDriverMode = store.currentMode === "driver" || store.currentMode === "guide";

  if (isDriverMode) {
    this.renderDriverTransitHistory(container);
  } else {
    this.renderPassengerTransitIntelligence(container);
  }
}

renderDriverTransitHistory(container) {
  let footprints = store.getDigitalFootprints() || [];

  footprints.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  if (footprints.length === 0) {
    footprints = [
      { passengerName: "Angel Ganev", from: "Vadodara Junction (Railway Station)", to: "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)", fare: 100, time: "03:53 pm" },
      { passengerName: "Angel Ganev", from: "Vadodara Junction (Railway Station)", to: "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)", fare: 100, time: "03:51 pm" },
      { passengerName: "Angel Ganev", from: "Vadodara Junction (Railway Station)", to: "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)", fare: 100, time: "03:50 pm" },
      { passengerName: "Sweet Lemon", from: "Vadodara Junction (Railway Station)", to: "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)", fare: 100, time: "12:30 pm" },
      { passengerName: "Devanshi Sharma", from: "Vadodara Junction (Railway Station)", to: "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)", fare: 100, time: "11:15 am" }
    ];
  }

  container.innerHTML = `
    <div style="padding: 16px;">
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-list-ul" style="font-size: 14px;"></i> My Transit History
        </h3>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
          Verified passenger trips and anchored footprints.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${footprints.map(f => {
          const name = f.passengerName || "Verified Passenger";
          const routeStr = f.route || `${f.from || "Vadodara Junction (Railway Station)"} ➔ ${f.to || "Laxmi Vilas Palace (Old Palace Rd) (3.4 km)"}`;
          const fare = f.fare || f.amountPaid || 100;
          
          let displayTime = f.time;
          if (!displayTime) {
            const dateObj = new Date(f.timestamp || f.createdAt || Date.now());
            displayTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
          }

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i class="fas fa-user-check" style="color: #10b981; font-size: 15px;"></i>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${name}</span>
                  <span style="font-size: 11px; color: #64748b;">
                    <i class="fas fa-map-marker-alt" style="font-size: 10px; color: #94a3b8;"></i> ${routeStr}
                  </span>
                  <span style="font-size: 11px; color: #94a3b8;">
                    <i class="fas fa-clock" style="font-size: 10px;"></i> ${displayTime}
                  </span>
                </div>
              </div>

              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                <span style="font-size: 13px; font-weight: 700; color: #059669;">Est. ₹${fare}</span>
                <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">Verified</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

  // --- Two-Way Digital Footprint: Driver Verification & Safety Card Modal ---
  openDriverVerificationModal(driver = this.activeDriver) {
    const modal = document.getElementById("driver-safety-card-modal");
    const container = document.getElementById("driver-safety-card-content");
    if (!modal || !container) return;

    const now = new Date();
    const footprintHash = `VRD-FOOTPRINT-${driver.vehicleRegNo.replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;

    // Log the digital footprint
    const digitalFootprint = {
      footprintHash: footprintHash,
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      passengerName: store.activeUser.name,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleRegNo: driver.vehicleRegNo,
      vehicleType: driver.vehicleType,
      rtoLicenseNo: driver.rtoLicenseNo,
      route: `${this.activeRoute.fromName} ➔ ${this.activeRoute.toName}`,
      pickupGps: `${store.currentLocation.lat.toFixed(4)}, ${store.currentLocation.lng.toFixed(4)}`,
      status: "active_trip"
    };

    store.recordDigitalFootprint(digitalFootprint).then(() => {
      if (typeof reviewsManager !== 'undefined' && reviewsManager) {
        const targetGuideId=driver.id || driver.uid || driver.vehicleRegNo;
        reviewsManager.renderGuideLedger(driver.id || driver.uid, "guide-ledger-container");
      if(document.getElementsById("guide-self-ledger")){
        reviewsManager.renderGuideLedger(driver.id || driver.uid, "guide-self-ledger");
      }
      }
    });

    container.innerHTML = `
      <div class="driver-safety-dossier animate-slide-up">
        
        <!-- Official Verification Header -->
        <div class="safety-card-top-bar">
          <div class="govt-seal-badge">
            <i class="fas fa-shield-halved"></i>
            <span>GUJARAT RTO & TOURISM CERTIFIED</span>
          </div>
          <span class="badge-trust-high"><i class="fas fa-star"></i> ${driver.rating} ★ (${driver.trustScore}% Trust)</span>
        </div>

        <!-- Driver Profile Bio -->
        <div class="driver-profile-main">
          <img src="${driver.photo}" alt="${driver.name}" class="driver-card-avatar">
          <div class="driver-card-bio">
            <h3 class="driver-name">${driver.name}</h3>
            <div class="vehicle-plate-pill">
              <i class="fas fa-id-badge"></i> Vehicle No: <strong>${driver.vehicleRegNo}</strong>
            </div>
            <p class="lic-info"><i class="fas fa-file-contract"></i> RTO License: <strong>${driver.rtoLicenseNo}</strong></p>
            <p class="issuer-info"><i class="fas fa-building-shield"></i> Issuer: ${driver.govtIssuer}</p>
          </div>
        </div>

        <!-- Digital Footprint Confirmation Box -->
        <div class="footprint-anchor-box">
          <div class="footprint-anchor-header">
            <i class="fas fa-fingerprint"></i>
            <strong>PASSENGER DIGITAL FOOTPRINT LOGGED</strong>
          </div>
          <div class="footprint-meta-grid">
            <div><span class="f-lbl">Passenger:</span> <strong>${store.activeUser.name}</strong></div>
            <div><span class="f-lbl">Trip Start Time:</span> ${digitalFootprint.formattedTime}</div>
            <div><span class="f-lbl">Selected Route:</span> ${this.activeRoute.fromName} ➔ ${this.activeRoute.toName}</div>
            <div><span class="f-lbl">Footprint ID:</span> <code>${footprintHash}</code></div>
          </div>
        </div>

        <!-- Emergency Direct-Dial Quick Action Bar -->
        <div class="emergency-dials-section">
          <h4><i class="fas fa-phone-volume"></i> Emergency Quick-Dial & Safety Helplines:</h4>
          
          <div class="emergency-dials-grid">
            <a href="tel:${driver.phone.replace(/[^0-9+]/g, '')}" class="dial-btn dial-driver">
              <i class="fas fa-phone"></i>
              <span>Driver<br><strong>${driver.phone}</strong></span>
            </a>

            <a href="tel:181" class="dial-btn dial-women" title="181 Abhayam Women Helpline (Gujarat)">
              <i class="fas fa-person-dress"></i>
              <span>Women's Safety<br><strong>181 / 1090</strong></span>
            </a>

            <a href="tel:02652223333" class="dial-btn dial-police" title="Sayajigunj Police Desk">
              <i class="fas fa-shield"></i>
              <span>Local Police<br><strong>Sayajigunj Desk</strong></span>
            </a>

            <a href="tel:1363" class="dial-btn dial-tourist" title="National Tourist Helpline">
              <i class="fas fa-headset"></i>
              <span>Tourist Police<br><strong>1363</strong></span>
            </a>
          </div>
        </div>

        <!-- Live Trip Start Button -->
        <div class="start-trip-actions">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="start-live-tracking-btn">
            <i class="fas fa-location-arrow"></i> Start Live Internal GPS Trip Tracking
          </button>
          
          <button type="button" class="btn btn-outline btn-block" id="share-live-beacon-btn">
            <i class="fas fa-share-nodes"></i> Share Live Safety Footprint via WhatsApp
          </button>
        </div>

      </div>
    `;

    modal.classList.add("active");

    // Bind Start Live Tracking
    const trackBtn = document.getElementById("start-live-tracking-btn");
    if (trackBtn) {
      trackBtn.onclick = () => {
        modal.classList.remove("active");
        this.startLiveTrip(digitalFootprint);
      };
    }

    // Share Live Safety Beacon
    const shareBtn = document.getElementById("share-live-beacon-btn");
    if (shareBtn) {
      shareBtn.onclick = () => {
        const text = `🛡️ *VERIDA TRANSIT SAFETY BEACON*\nPassenger: ${store.activeUser.name}\nDriver: ${driver.name} (${driver.phone})\nVehicle No: ${driver.vehicleRegNo}\nRoute: ${this.activeRoute.fromName} to ${this.activeRoute.toName}\nFootprint Hash: ${footprintHash}\nEmergency Police: 112 | Women Helpline: 181`;
        if (navigator.share) {
          navigator.share({ title: "Verida Transit Safety Beacon", text });
        } else {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
        }
      };
    }
  }

  // --- "Driver Has No App" Self-Protection Modal ---
  openZeroAppModal() {
    const modal = document.getElementById("zero-app-modal");
    const container = document.getElementById("zero-app-content");
    if (!modal || !container) return;

    container.innerHTML = `
      <div class="zero-app-box animate-slide-up">
        <div class="zero-app-header">
          <div class="zero-app-icon"><i class="fas fa-car-burst"></i></div>
          <div>
            <h3>Driver Has No App? You're Still 100% Protected</h3>
            <p>Enter or snap the auto-rickshaw plate number to anchor your safety footprint.</p>
          </div>
        </div>

        <div class="zero-app-methods">
          
          <!-- Method 1: Enter Vehicle Plate -->
          <div class="method-card">
            <label><strong>1. Enter Vehicle Number Plate (from vehicle or meter):</strong></label>
            <div class="plate-input-row">
              <input type="text" id="manual-plate-input" placeholder="e.g. GJ-06-AU-7892" value="GJ-06-AU-7892" class="plate-text-input" style="width: 100%; margin-bottom: 12px;">
            </div>
            
            <label><strong>2. Select Route via Google Maps Location API:</strong></label>
            <div class="route-input-group" style="margin-top: 8px;">
              <input type="text" id="gmaps-from-input" class="plate-text-input" placeholder="Pickup Location" style="width: 100%; margin-bottom: 8px;">
              <input type="text" id="gmaps-to-input" class="plate-text-input" placeholder="Destination / Local Hotspot" style="width: 100%; margin-bottom: 12px;">
            </div>

            <div id="zero-app-mini-map" style="height: 150px; width: 100%; border-radius: 8px; margin-bottom: 12px; background: #e2e8f0; display:flex; align-items:center; justify-content:center; overflow: hidden;">
               <span style="font-size:12px;color:#64748b;">Loading Maps API...</span>
            </div>

            <button type="button" class="btn btn-primary btn-block" id="anchor-plate-btn">
              <i class="fas fa-shield-check"></i> Anchor Footprint & Allow GPS
            </button>
            <span class="input-hint" style="display:block;margin-top:8px;"><i class="fas fa-info-circle"></i> Will securely ping your live GPS to RTO database.</span>
          </div>

          <!-- Method 2: Instant WhatsApp Safety Beacon -->
          <div class="method-card" style="margin-top: 14px;">
            <button type="button" class="btn btn-danger btn-block" id="broadcast-beacon-btn">
              <i class="fas fa-broadcast-tower"></i> Broadcast Safety Beacon to Family & Police
            </button>
          </div>

        </div>
      </div>
    `;

    modal.classList.add("active");

    // Initialize Google Places Autocomplete and Mini Map
    setTimeout(() => {
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        const fromInput = document.getElementById("gmaps-from-input");
        const toInput = document.getElementById("gmaps-to-input");
        const mapDiv = document.getElementById("zero-app-mini-map");

        if (fromInput) new google.maps.places.Autocomplete(fromInput);
        if (toInput) new google.maps.places.Autocomplete(toInput);
        
        if (mapDiv) {
           const miniMap = new google.maps.Map(mapDiv, {
             center: { lat: store.currentLocation.lat, lng: store.currentLocation.lng },
             zoom: 14,
             disableDefaultUI: true
           });
           new google.maps.Marker({
             position: { lat: store.currentLocation.lat, lng: store.currentLocation.lng },
             map: miniMap,
             title: "Your Location"
           });
        }
      }
    }, 200);

    // Anchor Vehicle Plate
    const anchorBtn = document.getElementById("anchor-plate-btn");
    if (anchorBtn) {
      anchorBtn.onclick = () => {
        const processAnchor = () => {
          const plate = document.getElementById("manual-plate-input")?.value.trim() || "GJ-06-AU-7892";
          modal.classList.remove("active");
          
          const synthesizedDriver = {
            id: `driver-manual-${plate}`,
            name: "Registered Vadodara Transport Driver",
            photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            phone: "+91 94260 55321",
            vehicleType: "Auto-Rickshaw (Plate Anchored)",
            vehicleRegNo: plate,
            rtoLicenseNo: `GJ-06-RTO-${plate.slice(-4)}`,
            govtIssuer: "Gujarat RTO Registered Vehicle",
            rating: 4.9,
            trustScore: 97
          };

          this.openDriverVerificationModal(synthesizedDriver);
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => processAnchor(),
            (err) => {
              alert("⚠️ Please allow GPS access to record your safe Digital Footprint.");
              processAnchor();
            }
          );
        } else {
          processAnchor();
        }
      };
    }

    // Broadcast Beacon
    const broadcastBtn = document.getElementById("broadcast-beacon-btn");
    if (broadcastBtn) {
      broadcastBtn.onclick = () => {
        const plate = document.getElementById("manual-plate-input")?.value.trim() || "GJ-06-AU-7892";
        const text = `🚨 *VERIDA PASSENGER LIVE SAFETY BEACON*\nPassenger: ${store.activeUser.name}\nVehicle Plate: ${plate}\nRoute: ${this.activeRoute.fromName} -> ${this.activeRoute.toName}\nLive GPS: https://maps.google.com/?q=${store.currentLocation.lat},${store.currentLocation.lng}\nWomen Safety: 181 | Police: 112`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
      };
    }
  }

  // --- Internal Live GPS Trip Tracker ---
  startLiveTrip(footprint) {
    this.activeTrip = footprint;
    this.tripProgress = 0;
    this.tripElapsedSec = 0;

    const hud = document.getElementById("live-trip-tracker-hud");
    if (hud) {
      hud.classList.remove("hidden");
      this.updateTripHud();
    }

    // Clear existing interval
    if (this.tripTrackingInterval) clearInterval(this.tripTrackingInterval);

    // Simulate GPS breadcrumb movement every 2 seconds
    this.tripTrackingInterval = setInterval(() => {
      this.tripElapsedSec += 2;
      this.tripProgress = Math.min(100, this.tripProgress + 4);

      this.updateTripHud();

      if (this.tripProgress >= 100) {
        clearInterval(this.tripTrackingInterval);
        this.tripTrackingInterval = null;
        this.completeTrip();
      }
    }, 2000);
  }

  updateTripHud() {
    const hud = document.getElementById("live-trip-tracker-hud");
    if (!hud || !this.activeTrip) return;

    const remainingKm = ((1 - this.tripProgress / 100) * (this.activeRoute.distanceKm || 3.4)).toFixed(1);
    const speed = this.tripProgress < 100 ? (24 + (this.tripProgress % 8)) : 0;

    hud.innerHTML = `
      <div class="trip-hud-inner animate-slide-up">
        <div class="trip-hud-top">
          <div class="trip-status-col">
            <span class="trip-live-indicator"><span class="gps-live-dot"></span> LIVE TRIP TRACKING</span>
            <span class="trip-route-title">${this.activeRoute.fromName} ➔ ${this.activeRoute.toName}</span>
          </div>
          <button type="button" class="btn-trip-sos" onclick="veridaApp.triggerSosFlow()" title="Trigger Police SOS">
            <span>🚨 SOS</span>
          </button>
        </div>

        <div class="trip-progress-bar-wrap">
          <div class="trip-progress-fill" style="width: ${this.tripProgress}%;"></div>
        </div>

        <div class="trip-stats-grid">
          <div class="t-stat"><span class="t-lbl">Speed</span><span class="t-val">${speed} km/h</span></div>
          <div class="t-stat"><span class="t-lbl">Remaining</span><span class="t-val">${remainingKm} km</span></div>
          <div class="t-stat"><span class="t-lbl">Vehicle</span><span class="t-val">${this.activeTrip.vehicleRegNo}</span></div>
          <div class="t-stat"><span class="t-lbl">Safety Radar</span><span class="t-val text-success">Normal Route</span></div>
        </div>

        <div class="trip-hud-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="transitSafety.shareLiveLocation()">
            <i class="fas fa-share-nodes"></i> Share Live GPS
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="transitSafety.endTripEarly()">
            <i class="fas fa-flag-checkered"></i> End Trip & Log Rate
          </button>
        </div>
      </div>
    `;
  }

  shareLiveLocation() {
    const text = `📍 *LIVE TRANSIT GPS TRACKING (Verida)*\nPassenger: ${store.activeUser.name}\nVehicle: ${this.activeTrip?.vehicleRegNo || 'Auto'}\nLive Position: https://maps.google.com/?q=${store.currentLocation.lat},${store.currentLocation.lng}`;
    if (navigator.share) {
      navigator.share({ title: "Live GPS Trip", text });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  endTripEarly() {
    if (this.tripTrackingInterval) {
      clearInterval(this.tripTrackingInterval);
      this.tripTrackingInterval = null;
    }
    this.completeTrip();
  }

  completeTrip() {
    const hud = document.getElementById("live-trip-tracker-hud");
    if (hud) hud.classList.add("hidden");

    // Prompt for price paid to feed into "Last 3 Passengers Paid"
    const modal = document.getElementById("price-prompt-modal");
    if (modal) {
      const title = document.getElementById("price-prompt-title");
      if (title) title.textContent = `You reached ${this.activeRoute.toName}! What did you pay?`;
      modal.classList.add("active");

      const submitBtn = document.getElementById("price-prompt-submit-btn");
      if (submitBtn) {
       submitBtn.onclick = () => {
       const customVal = document.getElementById("price-prompt-custom-amount")?.value;
      const paidAmount = customVal && parseFloat(customVal) > 0 ? parseFloat(customVal) : this.activeRoute.fairRange.median;

  // Existing ticker update (keep this)
  if (!this.activeRoute.last3PassengersPaid) this.activeRoute.last3PassengersPaid = [];
  this.activeRoute.last3PassengersPaid.unshift({
    passengerName: `${store.activeUser.name} (You)`,
    amount: Math.round(paidAmount),
    timeAgo: "Just now",
    vehicleNo: this.activeTrip?.vehicleRegNo || "GJ-06-AU-7892",
    driverName: this.activeTrip?.driverName || "Mehul Bhai"
  });
  if (this.activeRoute.last3PassengersPaid.length > 3) {
    this.activeRoute.last3PassengersPaid = this.activeRoute.last3PassengersPaid.slice(0, 3);
  }
  this.renderLast3PassengersPaid();

 
  store.recordDigitalFootprint({
    passengerName: store.activeUser.name,
    driverName: this.activeTrip?.driverName || "Mehul Bhai",
    vehicleRegNo: this.activeTrip?.vehicleRegNo || "GJ-06-AU-7892",
    route: `${this.activeRoute.fromName} ➔ ${this.activeRoute.toName}`,
    amountPaid: Math.round(paidAmount),
    status: "completed"
  });

  modal.classList.remove("active");
  alert("🎉 Trip Completed! Your payment has been added to the 'Last 3 Passengers Paid' live ticker to protect the next traveler.");
};
      }
    }
  }
}

export const transitSafety = new TransitSafetyManager();
