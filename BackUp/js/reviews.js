/**
 * Verida — Proof-of-Presence Reviews & Guide Portfolio Ledger (Features #2 & #6)
 * Gated strictly behind verified physical Digital Handshakes.
 */

/**import { store } from "./store.js";

export class ReviewsManager {
  constructor() {
    this.selectedRating = 5;
  }

  // --- Render Guide Profile & Ledger ---
  renderGuideLedger(guideId = null, containerId = "guide-ledger-container") {
    // Check if we are rendering for dual screen or specific container
    // If no guideId is passed, use activeGuide (usually for Driver view)
    const isPassenger = store.currentRole === "traveler";
    const guide = guideId ? store.getGuideById(guideId) : store.activeGuide;
    
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!guide && !isPassenger) {
      container.innerHTML = `<div class="empty-state"><p>No profile found.</p></div>`;
      return;
    }

    const reviews = guide ? store.getReviewsForGuide(guide.id || guide.uid) : [];
    const handshakes = guide ? store.getHandshakes().filter(h => h.guideId === guide.id || h.guideId === guide.uid) : [];
    const hasHandshake = guide ? store.hasHandshakeWithGuide(guide.id || guide.uid) : false;
    
    // Fetch Digital Footprints for chronological ledger
    let footprints = store.getDigitalFootprints() || [];
    if (guide && !isPassenger) {
       footprints = footprints.filter(f => f.vehicleRegNo === guide.vehicleRegNo);
    } else if (isPassenger) {
       footprints = footprints.filter(f => f.passengerName === store.activeUser.name);
    }
    
    // Sort chronologically (newest first)
    footprints.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

    container.innerHTML = `
      <!-- Guide Verified Header Card -->
      <div class="guide-header-card">
        <div class="guide-avatar-wrap">
          <img src="${guide.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}" alt="${guide.name}" class="guide-avatar">
          <div class="verified-tick-badge" title="Government / ASI Verified"><i class="fas fa-check"></i></div>
        </div>
        <div class="guide-info">
          <div class="guide-name-row">
            <h3 class="guide-name">${guide.name}</h3>
            <span class="trust-score-badge"><i class="fas fa-shield-alt"></i> ${guide.trustScore || 98}% Trust Index</span>
          </div>
          <p class="guide-category"><i class="fas fa-id-card"></i> ${guide.category || 'Official Guide'} • <strong>${guide.licenseNo}</strong></p>
          <p class="guide-issuer"><i class="fas fa-university"></i> ${guide.issuer || 'State Tourism Authority'}</p>
          <div class="guide-tags">
            <span class="guide-tag"><i class="fas fa-language"></i> ${(guide.languages || ['English', 'Gujarati', 'Hindi']).join(', ')}</span>
            <span class="guide-tag"><i class="fas fa-clock"></i> ${guide.experienceYears || 8}+ Years Exp</span>
            <span class="guide-tag highlight"><i class="fas fa-handshake"></i> ${guide.encounterCount || 342} Physical Encounters</span>
          </div>
        </div>
      </div>

      <!-- Proof-of-Presence Review Submission Section -->
      <div class="review-submission-box">
        <h4 class="section-subtitle"><i class="fas fa-pen-fancy"></i> Leave a Proof-of-Presence Review</h4>
        
        ${!hasHandshake ? `
          <div class="review-locked-banner">
            <div class="locked-icon"><i class="fas fa-lock"></i></div>
            <div class="locked-info">
              <strong>Review Locked — Physical Handshake Required</strong>
              <p>To eliminate fake online reviews, Verida strictly gates reviews behind a GPS-verified Digital Handshake. Scan this guide's QR code at the monument to unlock review access.</p>
            </div>
          </div>
        ` : `
          <div class="review-unlocked-box animate-fade-in">
            <div class="verified-banner-pill">
              <i class="fas fa-shield-check"></i> GPS Verified Presence Active: ${store.currentLocation.name}
            </div>
            <form id="presence-review-form" class="review-form" onsubmit="event.preventDefault();">
              <div class="rating-stars-row">
                <label>Your Rating:</label>
                <div class="star-picker" id="star-picker">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <button type="button" class="star-btn ${star <= this.selectedRating ? 'active' : ''}" data-star="${star}">
                      <i class="fas fa-star"></i>
                    </button>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <textarea id="review-comment-input" rows="3" placeholder="Share your experience (Guide honesty, fair pricing, historical knowledge)..." required></textarea>
              </div>
              <button type="button" class="btn btn-primary btn-block" id="submit-verified-review-btn">
                <i class="fas fa-paper-plane"></i> Submit Presence-Verified Review
              </button>
            </form>
          </div>
        `}
      </div>

      <!-- Tamper-Evident Verified Ledger Timeline -->
      <div class="ledger-timeline-section">
        <div class="ledger-header">
          <h4 class="section-subtitle"><i class="fas fa-link"></i> Immutable Ledger (${footprints.length} Records)</h4>
          <span class="ledger-badge"><i class="fas fa-lock"></i> Digital Footprints</span>
        </div>

        <div class="timeline-list">
          ${footprints.length === 0 ? '<div class="empty-state" style="padding:16px;text-align:center;">No footprint records found.</div>' : ''}
          ${footprints.map(f => {
            const dateObj = new Date(f.timestamp || f.createdAt || Date.now());
            const dateFormatted = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            const timeFormatted = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
            
            return `
              <div class="timeline-item">
                <div class="timeline-dot verified"></div>
                <div class="timeline-card encounter-card">
                  <div class="timeline-card-header">
                    <span class="encounter-title"><i class="fas fa-route"></i> Trip: ${f.route || 'Local Route'}</span>
                    <span class="timeline-date">${dateFormatted} • ${timeFormatted}</span>
                  </div>
                  <div class="encounter-details" style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                    <span><i class="fas fa-user"></i> <strong>Passenger:</strong> ${f.passengerName}</span>
                    <span><i class="fas fa-taxi"></i> <strong>Driver:</strong> ${f.driverName || 'Unknown'} (${f.vehicleRegNo})</span>
                    <span><i class="fas fa-id-badge"></i> <strong>License:</strong> ${f.rtoLicenseNo || 'N/A'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> <strong>GPS Anchor:</strong> ${f.pickupGps || 'Unavailable'}</span>
                  </div>
                  <div class="crypto-hash-row" style="margin-top:10px;">
                    <span class="token-hash">Footprint ID: ${f.footprintHash}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.attachReviewEvents(guide);
  }

  attachReviewEvents(guide) {
    const starPicker = document.getElementById("star-picker");
    if (starPicker) {
      starPicker.querySelectorAll(".star-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.selectedRating = parseInt(btn.getAttribute("data-star"), 10);
          starPicker.querySelectorAll(".star-btn").forEach(b => {
            const s = parseInt(b.getAttribute("data-star"), 10);
            b.classList.toggle("active", s <= this.selectedRating);
          });
        });
      });
    }

    const submitBtn = document.getElementById("submit-verified-review-btn");
    const commentInput = document.getElementById("review-comment-input");

    if (submitBtn && commentInput) {
      submitBtn.onclick = async () => {
        const comment = commentInput.value.trim();
        if (!comment) {
          alert("Please enter a short review comment.");
          return;
        }

        const newReview = {
          guideId: guide.id || guide.uid,
          travelerName: store.activeUser.name,
          rating: this.selectedRating,
          monumentName: store.currentLocation.name,
          presenceVerified: true,
          comment: comment,
          timestamp: Date.now()
        };

        await store.recordReview(newReview);
        alert("✅ Proof-of-Presence Review submitted! It is now permanently linked to your verified encounter.");
        this.renderGuideLedger(guide.id, "guide-ledger-container");
        this.renderGuideLedger(guide.id, "guide-self-ledger");
      };
    }
  }
}

export const reviewsManager = new ReviewsManager();*/



/**
 * Verida — Proof-of-Presence Reviews & Guide Portfolio Ledger
 */
/**import { store } from "./store.js";

export class ReviewsManager {
  constructor() {
    this.selectedRating = 5;
  }

  // --- Helper: Safely resolve Guide or Driver object ---
  getResolvedGuide(guideId) {
    if (!guideId) return store.activeGuide || store.activeDriver || null;

    // Attempt lookup across available store methods
    let guide = store.getGuideById ? store.getGuideById(guideId) : null;
    if (!guide && store.getDriverById) {
      guide = store.getDriverById(guideId);
    }
    // Fallback search in SEED data / local stores by id, uid, or vehicle number
    if (!guide && store.guides) {
      guide = store.guides.find(
        (g) => g.id === guideId || g.uid === guideId || g.vehicleRegNo === guideId
      );
    }
    if (!guide && store.drivers) {
      guide = store.drivers.find(
        (d) => d.id === guideId || d.uid === guideId || d.vehicleRegNo === guideId
      );
    }

    return guide || store.activeGuide || store.activeDriver || null;
  }

  // --- Render Guide Profile & Ledger ---


renderGuideLedger(guideId = null, containerId = "guide-ledger-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Determine current active role
  const isDriver = store.currentRole === "guide" || store.currentRole === "driver";
  const isPassenger = !isDriver;
  if (isDriver && (containerId === "guide-self-ledger" || containerId === "qr-tab-container")) {
    container.innerHTML = ""; // Leaves only the QR generator card active above it
    return;
  }

  const guide = this.getResolvedGuide(guideId);

  // Fallback safe defaults
  const defaultPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
  const guidePhoto = guide?.photo || defaultPhoto;
  const guideName = guide?.name || "Verified Transport Partner";
  const guideTrust = guide?.trustScore || 98;
  const guideLicense = guide?.rtoLicenseNo || guide?.licenseNo || "GJ-RTO-VERIFIED";
  const guideIssuer = guide?.govtIssuer || guide?.issuer || "Gujarat Tourism Authority";
  const guideLanguages = guide?.languages || ["English", "Gujarati", "Hindi"];
  const guideExp = guide?.experienceYears || 5;
  const resolvedId = guide?.id || guide?.uid || guideId || "default-driver";

  // Fetch reviews and handshakes
  const reviews = store.getReviewsForGuide(resolvedId);
  const handshakes = store.getHandshakes().filter(h => h.guideId === resolvedId);
  
  // Handshake verification status
 // Handshake verification status (Checks handshakes array AND digital footprints)
  const footprints = store.getDigitalFootprints() || [];
  const hasHandshake = 
    store.hasHandshakeWithGuide(resolvedId) ||
    handshakes.length > 0 ||
    footprints.some(f => 
      f.vehicleRegNo === guide?.vehicleRegNo || 
      f.driverName === guideName || 
      f.guideId === resolvedId
    );

  // Filter footprints for the Immutable Trip Ledger
  let relevantFootprints = [...footprints];
  if (isDriver && guide?.vehicleRegNo) {
    relevantFootprints = relevantFootprints.filter(f => f.vehicleRegNo === guide.vehicleRegNo);
  } else if (isPassenger && store.activeUser?.name) {
    relevantFootprints = relevantFootprints.filter(f => f.passengerName === store.activeUser.name);
  }

  relevantFootprints.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  container.innerHTML = `
    <!-- Render Driver Info Header ONLY for Passengers -->
    ${isPassenger ? `
      <div class="guide-header-card">
        <div class="guide-avatar-wrap">
          <img src="${guidePhoto}" alt="${guideName}" class="guide-avatar">
          <div class="verified-tick-badge" title="Government Certified"><i class="fas fa-check"></i></div>
        </div>
        <div class="guide-info">
          <div class="guide-name-row">
            <h3 class="guide-name">${guideName}</h3>
            <span class="trust-score-badge"><i class="fas fa-shield-alt"></i> ${guideTrust}% Trust Index</span>
          </div>
          <p class="guide-category"><i class="fas fa-id-card"></i> Official Partner • <strong>${guideLicense}</strong></p>
          <p class="guide-issuer"><i class="fas fa-university"></i> ${guideIssuer}</p>
          <div class="guide-tags">
            <span class="guide-tag"><i class="fas fa-language"></i> ${guideLanguages.join(", ")}</span>
            <span class="guide-tag"><i class="fas fa-clock"></i> ${guideExp}+ Years Exp</span>
            <span class="guide-tag highlight"><i class="fas fa-handshake"></i> ${handshakes.length || relevantFootprints.length || 1} Verified Encounters</span>
          </div>
        </div>
      </div>

      <!-- Render Review Form ONLY for Passengers -->
      <div class="review-submission-box">
        <h4 class="section-subtitle"><i class="fas fa-pen-fancy"></i> Leave a Proof-of-Presence Review</h4>
        ${!hasHandshake ? `
          <div class="review-locked-banner">
            <div class="locked-icon"><i class="fas fa-lock"></i></div>
            <div class="locked-info">
              <strong>Review Locked — Physical Handshake Required</strong>
              <p>Scan QR code or anchor a trip footprint to unlock review access.</p>
            </div>
          </div>
        ` : `
          <div class="review-unlocked-box animate-fade-in">
            <div class="verified-banner-pill">
              <i class="fas fa-shield-check"></i> GPS Verified Presence Active
            </div>
            <form id="presence-review-form" class="review-form" onsubmit="event.preventDefault();">
              <div class="rating-stars-row">
                <label>Your Rating:</label>
                <div class="star-picker" id="star-picker">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <button type="button" class="star-btn ${star <= this.selectedRating ? "active" : ""}" data-star="${star}">
                      <i class="fas fa-star"></i>
                    </button>
                  `).join("")}
                </div>
              </div>
              <div class="form-group">
                <textarea id="review-comment-input" rows="3" placeholder="Share your experience..." required></textarea>
              </div>
              <button type="button" class="btn btn-primary btn-block" id="submit-verified-review-btn">
                <i class="fas fa-paper-plane"></i> Submit Presence-Verified Review
              </button>
            </form>
          </div>
        `}
      </div>
    ` : ""}

    <!-- Verified Reviews List (Visible to Both) -->
    <div class="reviews-feed-section" style="margin-top: 16px;">
      <h4 class="section-subtitle"><i class="fas fa-comments"></i> Verified Reviews (${reviews.length})</h4>
      <div class="reviews-list">
        ${reviews.length === 0 ? '<div class="empty-state" style="padding:12px;text-align:center;color:var(--slate-500);">No verified reviews yet.</div>' : ""}
        ${reviews.map(r => `
          <div class="review-card" style="background:#fff; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${r.passengerName || "Verified Passenger"}</strong>
              <span style="color:#f59e0b;">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
            </div>
            <p style="margin:6px 0; font-size:13px; color:#334155;">${r.comment}</p>
            <span style="font-size:11px; color:#94a3b8;"><i class="fas fa-clock"></i> ${r.formattedTime || "Recently"}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Immutable Trip Ledger (Preserved Exactly as Requested for Both) -->
    <div class="ledger-timeline-section" style="margin-top:20px;">
      <div class="ledger-header">
        <h4 class="section-subtitle"><i class="fas fa-link"></i> Immutable Trip Ledger (${relevantFootprints.length} Records)</h4>
      </div>
      <div class="timeline-list">
        ${relevantFootprints.length === 0 ? '<div class="empty-state" style="padding:12px;text-align:center;">No footprint records found.</div>' : ""}
        ${relevantFootprints.map(f => `
          <div class="timeline-item" style="padding:10px; border-left:3px solid var(--primary); margin-bottom:8px; background:#f8fafc;">
            <div style="font-size:13px;"><strong>${f.passengerName}</strong> ➔ ${f.route || "City Transit"}</div>
            <div style="font-size:11px; color:#64748b;">Vehicle: ${f.vehicleRegNo} | Time: ${f.formattedTime || "Verified"}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  if (isPassenger) {
    this.bindReviewFormEvents(resolvedId, containerId);
  }
}

  // --- Event Bindings for Review Submission ---
  bindReviewFormEvents(guideId, containerId) {
    // 1. Star Rating Buttons
    const starBtns = document.querySelectorAll("#star-picker .star-btn");
    starBtns.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        this.selectedRating = parseInt(btn.getAttribute("data-star"), 10);
        starBtns.forEach((b) => {
          const starVal = parseInt(b.getAttribute("data-star"), 10);
          b.classList.toggle("active", starVal <= this.selectedRating);
        });
      };
    });

    // 2. Submit Button Handler
    const submitBtn = document.getElementById("submit-verified-review-btn");
    if (submitBtn) {
      submitBtn.onclick = async (e) => {
        e.preventDefault();
        const commentInput = document.getElementById("review-comment-input");
        const commentText = commentInput ? commentInput.value.trim() : "";

        if (!commentText) {
          alert("Please write a comment before submitting.");
          return;
        }

        const activeGuideId =
          guideId || store.activeGuide?.id || store.activeDriver?.id || "default-driver";

        const newReview = {
          id: `rev-${Date.now()}`,
          guideId: activeGuideId,
          passengerName: store.activeUser?.name || "Verified Traveler",
          rating: this.selectedRating,
          comment: commentText,
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        // Persist into Store safely
        if (typeof store.recordReview === "function") {
          await store.recordReview(newReview);
        } else if (typeof store.addReview === "function") {
          await store.addReview(newReview);
        } else {
          if (!store.reviews) store.reviews = [];
          store.reviews.unshift(newReview);
        }

        if (commentInput) commentInput.value = "";

        alert("🎉 Thank you! Your Proof-of-Presence review has been verified and added to the ledger.");

        // Immediately re-render to reflect changes
        this.renderGuideLedger(guideId, containerId);
      };
    }
  }
}

export const reviewsManager = new ReviewsManager();
*/


/**
 * Verida — Proof-of-Presence Reviews & Guide Portfolio Ledger
 */
import { store } from "./store.js";

export class ReviewsManager {
  constructor() {
    this.selectedRating = 5;
  }

  // --- Helper: Safely resolve Guide or Driver object ---
  getResolvedGuide(guideId) {
    if (!guideId) return store.activeGuide || store.activeDriver || null;

    // Attempt lookup across available store methods
    let guide = store.getGuideById ? store.getGuideById(guideId) : null;
    if (!guide && store.getDriverById) {
      guide = store.getDriverById(guideId);
    }
    // Fallback search in SEED data / local stores by id, uid, or vehicle number
    if (!guide && store.guides) {
      guide = store.guides.find(
        (g) => g.id === guideId || g.uid === guideId || g.vehicleRegNo === guideId
      );
    }
    if (!guide && store.drivers) {
      guide = store.drivers.find(
        (d) => d.id === guideId || d.uid === guideId || d.vehicleRegNo === guideId
      );
    }

    return guide || store.activeGuide || store.activeDriver || null;
  }

  // --- Render Guide Profile & Ledger ---
  renderGuideLedger(guideId = null, containerId = "guide-ledger-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Determine current active role
    const isDriver = store.currentRole === "guide" || store.currentRole === "driver";
    const isPassenger = !isDriver;
    if (isDriver && (containerId === "guide-self-ledger" || containerId === "qr-tab-container")) {
      container.innerHTML = ""; // Leaves only the QR generator card active above it
      return;
    }

    const guide = this.getResolvedGuide(guideId);

    // Fallback safe defaults
    const defaultPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
    const guidePhoto = guide?.photo || defaultPhoto;
    const guideName = guide?.name || "Verified Transport Partner";
    const guideTrust = guide?.trustScore || 98;
    const guideLicense = guide?.rtoLicenseNo || guide?.licenseNo || "GJ-RTO-VERIFIED";
    const guideIssuer = guide?.govtIssuer || guide?.issuer || "Gujarat Tourism Authority";
    const guideLanguages = guide?.languages || ["English", "Gujarati", "Hindi"];
    const guideExp = guide?.experienceYears || 5;
    const resolvedId = guide?.id || guide?.uid || guideId || "default-driver";

    // Fetch reviews and handshakes
   // Fetch reviews and handshakes
const reviews = store.getReviewsForGuide(resolvedId);
const handshakes = store.getHandshakes().filter(h => h.guideId === resolvedId || h.vehicleRegNo === guide?.vehicleRegNo);
const footprints = store.getDigitalFootprints() || [];

// Strict Handshake Verification (Only true if explicit records match)
const currentUserName = store.activeUser?.name || store.activeUser?.uid;

const hasHandshake = 
  Boolean(store.hasHandshakeWithGuide && store.hasHandshakeWithGuide(resolvedId)) ||
  handshakes.some(h => 
    h.passengerName === currentUserName || 
    h.travelerId === store.activeUser?.uid || 
    h.userId === store.activeUser?.uid
  ) ||
  footprints.some(f => 
    (f.passengerName === currentUserName || f.userId === store.activeUser?.uid) &&
    (f.vehicleRegNo === guide?.vehicleRegNo || f.driverName === guideName || f.guideId === resolvedId || f.driverId === resolvedId)
  );

// Filter footprints for the Immutable Trip Ledger
let relevantFootprints = [...footprints];
if (isDriver && guide?.vehicleRegNo) {
  relevantFootprints = relevantFootprints.filter(f => f.vehicleRegNo === guide.vehicleRegNo);
} else if (isPassenger && store.activeUser?.name) {
  relevantFootprints = relevantFootprints.filter(f => f.passengerName === store.activeUser.name);
}

relevantFootprints.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

    container.innerHTML = `
      <!-- Render Driver Info Header ONLY for Passengers -->
      ${isPassenger ? `
        <div class="guide-header-card">
          <div class="guide-avatar-wrap">
            <img src="${guidePhoto}" alt="${guideName}" class="guide-avatar">
            <div class="verified-tick-badge" title="Government Certified"><i class="fas fa-check"></i></div>
          </div>
          <div class="guide-info">
            <div class="guide-name-row">
              <h3 class="guide-name">${guideName}</h3>
              <span class="trust-score-badge"><i class="fas fa-shield-alt"></i> ${guideTrust}% Trust Index</span>
            </div>
            <p class="guide-category"><i class="fas fa-id-card"></i> Official Partner • <strong>${guideLicense}</strong></p>
            <p class="guide-issuer"><i class="fas fa-university"></i> ${guideIssuer}</p>
            <div class="guide-tags">
              <span class="guide-tag"><i class="fas fa-language"></i> ${guideLanguages.join(", ")}</span>
              <span class="guide-tag"><i class="fas fa-clock"></i> ${guideExp}+ Years Exp</span>
              <span class="guide-tag highlight"><i class="fas fa-handshake"></i> ${handshakes.length || relevantFootprints.length || 1} Verified Encounters</span>
            </div>
          </div>
        </div>

        <!-- Render Review Section ONLY for Passengers -->
        <div class="review-submission-box">
          <h4 class="section-subtitle"><i class="fas fa-pen-fancy"></i> Leave a Proof-of-Presence Review</h4>
          
          ${!hasHandshake ? `
            <!-- LOCKED STATE: Rendered when NO handshake is detected -->
            <div class="review-locked-card" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin-top: 10px;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i class="fas fa-lock" style="font-size: 20px; color: #64748b;"></i>
                </div>
                <div>
                  <strong style="font-size: 14px; color: #1e293b; display: block;">Review Locked — Physical Handshake Required</strong>
                  <span style="font-size: 12px; color: #64748b;">Scan QR code or anchor a trip footprint to unlock review access.</span>
                </div>
              </div>
            </div>
          ` : `
            <!-- UNLOCKED STATE: Rendered ONLY after Digital Handshake is complete -->
            <div class="review-unlocked-box animate-fade-in" style="margin-top: 10px;">
              <div class="verified-banner-pill" style="background: #ecfdf5; color: #047857; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 12px; display: inline-block;">
                <i class="fas fa-shield-check"></i> GPS Verified Presence Active
              </div>
              <form id="presence-review-form" class="review-form" onsubmit="event.preventDefault();">
                <div class="rating-stars-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <label style="font-size: 13px; font-weight: 600; color: #334155;">Your Rating:</label>
                  <div class="star-picker" id="star-picker">
                    ${[1, 2, 3, 4, 5].map(star => `
                      <button type="button" class="star-btn ${star <= this.selectedRating ? "active" : ""}" data-star="${star}" style="background:none; border:none; color: #f59e0b; font-size: 18px; cursor: pointer; padding: 0 2px;">
                        <i class="fas fa-star"></i>
                      </button>
                    `).join("")}
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                  <textarea id="review-comment-input" rows="3" placeholder="Share your experience..." required style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; outline: none;"></textarea>
                </div>
                <button type="button" class="btn btn-primary btn-block" id="submit-verified-review-btn" style="width: 100%; background: #059669; color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  <i class="fas fa-paper-plane"></i> Submit Presence-Verified Review
                </button>
              </form>
            </div>
          `}
        </div>
      ` : ""}

      <!-- Verified Reviews List (Visible to Both) -->
      <div class="reviews-feed-section" style="margin-top: 16px;">
        <h4 class="section-subtitle"><i class="fas fa-comments"></i> Verified Reviews (${reviews.length})</h4>
        <div class="reviews-list">
          ${reviews.length === 0 ? '<div class="empty-state" style="padding:12px;text-align:center;color:#64748b;">No verified reviews yet.</div>' : ""}
          ${reviews.map(r => `
            <div class="review-card" style="background:#fff; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${r.passengerName || "Verified Passenger"}</strong>
                <span style="color:#f59e0b;">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
              </div>
              <p style="margin:6px 0; font-size:13px; color:#334155;">${r.comment}</p>
              <span style="font-size:11px; color:#94a3b8;"><i class="fas fa-clock"></i> ${r.formattedTime || "Recently"}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Immutable Trip Ledger -->
      <div class="ledger-timeline-section" style="margin-top:20px;">
        <div class="ledger-header">
          <h4 class="section-subtitle"><i class="fas fa-link"></i> Immutable Trip Ledger (${relevantFootprints.length} Records)</h4>
        </div>
        <div class="timeline-list">
          ${relevantFootprints.length === 0 ? '<div class="empty-state" style="padding:12px;text-align:center;">No footprint records found.</div>' : ""}
          ${relevantFootprints.map(f => `
            <div class="timeline-item" style="padding:10px; border-left:3px solid #10b981; margin-bottom:8px; background:#f8fafc;">
              <div style="font-size:13px;"><strong>${f.passengerName}</strong> ➔ ${f.route || "City Transit"}</div>
              <div style="font-size:11px; color:#64748b;">Vehicle: ${f.vehicleRegNo} | Time: ${f.formattedTime || "Verified"}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Bind event handlers if the review form is unlocked
    if (isPassenger && hasHandshake) {
      this.bindReviewFormEvents(resolvedId, containerId);
    }
  }

  // --- Event Bindings for Review Submission ---
  bindReviewFormEvents(guideId, containerId) {
    // 1. Star Rating Buttons
    const starBtns = document.querySelectorAll("#star-picker .star-btn");
    starBtns.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        this.selectedRating = parseInt(btn.getAttribute("data-star"), 10);
        starBtns.forEach((b) => {
          const starVal = parseInt(b.getAttribute("data-star"), 10);
          b.classList.toggle("active", starVal <= this.selectedRating);
        });
      };
    });

    // 2. Submit Button Handler
    const submitBtn = document.getElementById("submit-verified-review-btn");
    if (submitBtn) {
      submitBtn.onclick = async (e) => {
        e.preventDefault();
        const commentInput = document.getElementById("review-comment-input");
        const commentText = commentInput ? commentInput.value.trim() : "";

        if (!commentText) {
          alert("Please write a comment before submitting.");
          return;
        }

        const activeGuideId =
          guideId || store.activeGuide?.id || store.activeDriver?.id || "default-driver";

        const newReview = {
          id: `rev-${Date.now()}`,
          guideId: activeGuideId,
          passengerName: store.activeUser?.name || "Verified Traveler",
          rating: this.selectedRating,
          comment: commentText,
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        // Persist into Store safely
        if (typeof store.recordReview === "function") {
          await store.recordReview(newReview);
        } else if (typeof store.addReview === "function") {
          await store.addReview(newReview);
        } else {
          if (!store.reviews) store.reviews = [];
          store.reviews.unshift(newReview);
        }

        if (commentInput) commentInput.value = "";

        alert("🎉 Thank you! Your Proof-of-Presence review has been verified and added to the ledger.");

        // Immediately re-render to reflect changes
        this.renderGuideLedger(guideId, containerId);
      };
    }
  }
}

export const reviewsManager = new ReviewsManager();