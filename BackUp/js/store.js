/**
 * Verida — State Store & Data Repository
 * Coordinates reactive state, city benchmarks, handshakes, price pulses, reviews, and GPS coordinates.
 */

/**import { hybridStore } from "./firebase-config.js";
import {
  SEED_CITIES,
  SEED_MONUMENTS,
  SEED_HOTSPOTS,
  SEED_GUIDES,
  SEED_DRIVERS,
  SEED_ROUTES,
  SEED_PRICE_PULSES,
  SEED_HANDSHAKES,
  SEED_REVIEWS
} from "../data/seedData.js";

class Store {
  constructor() {
    this.currentCityId = "vadodara"; // Default to Vadodara
    this.currentRole = "traveler"; // 'traveler' or 'guide'
    this.currentLocation = {
      lat: 22.2937, // Laxmi Vilas Palace default
      lng: 73.1916,
      name: "Laxmi Vilas Palace, Vadodara",
      accuracy: 5
    };
    this.isSimulatedGps = true;
    this.activeUser = {
      uid: "trv_devanshi_01",
      name: "Devanshi Sharma",
      phone: "+91 98765 43210",
      origin: "Tourist / Vadodara, Gujarat",
      emergencyContact: "Family (+91 98765 11223)",
      role: "traveler",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    };
    this.activeGuide = {
      uid: "driver-vad-001",
      id: "driver-vad-001",
      name: "Mehul Bhai Solanki",
      phone: "+91 94260 55321",
      licenseNo: "GJ-06-2018-009124",
      badgeNo: "VAD-AUTO-772",
      vehicleRegNo: "GJ-06-AU-7892",
      vehicleType: "Green CNG Auto-Rickshaw",
      issuer: "Vadodara RTO & Police Tourist Syndicate",
      category: "Auto-Rickshaw Transit",
      city: "vadodara",
      rating: 4.92,
      encounterCount: 640,
      specialty: "Vadodara City Transit & Gaekwad Heritage",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    };

    this.loadSavedProfiles();
    this.initSeedData();
  }

  loadSavedProfiles() {
    try {
      const savedUser = localStorage.getItem("verida_user_profile");
      if (savedUser) this.activeUser = JSON.parse(savedUser);
      const savedGuide = localStorage.getItem("verida_guide_profile");
      if (savedGuide) this.activeGuide = JSON.parse(savedGuide);
    } catch (e) {
      console.warn("[Verida Store] Profile load error:", e);
    }
  }

  registerPassenger(profile) {
    this.activeUser = {
      ...this.activeUser,
      ...profile,
      uid: `trv_${Date.now()}`
    };
    localStorage.setItem("verida_user_profile", JSON.stringify(this.activeUser));
    return this.activeUser;
  }

  registerDriver(profile) {
    const existingId = this.activeGuide.id || this.activeGuide.uid || `driver_${Date.now()}`;
    this.activeGuide = {
      ...this.activeGuide,
      ...profile,
      uid: existingId,
      id: existingId
    };
    localStorage.setItem("verida_guide_profile", JSON.stringify(this.activeGuide));
    return this.activeGuide;
  }

  initSeedData(forceReset = false) {
    const existingMonuments = hybridStore.getCollection("monuments");
    const existingHotspots = hybridStore.getCollection("hotspots");
    const existingRoutes = hybridStore.getCollection("routes");
    if (forceReset || existingMonuments.length < SEED_MONUMENTS.length || existingHotspots.length < SEED_HOTSPOTS.length || existingRoutes.length === 0) {
      hybridStore.saveCollection("monuments", SEED_MONUMENTS);
      hybridStore.saveCollection("hotspots", SEED_HOTSPOTS);
      hybridStore.saveCollection("guides", SEED_GUIDES);
      hybridStore.saveCollection("drivers", SEED_DRIVERS);
      hybridStore.saveCollection("routes", SEED_ROUTES);
      hybridStore.saveCollection("pricePulse", SEED_PRICE_PULSES);
      hybridStore.saveCollection("handshakes", SEED_HANDSHAKES);
      hybridStore.saveCollection("reviews", SEED_REVIEWS);
      console.log("[Verida Store] Seed data refreshed with routes, drivers, and complete Vadodara datasets.");
    }
  }

  // --- City & Location Accessors ---
  getCities() {
    return SEED_CITIES;
  }

  getCurrentCity() {
    return SEED_CITIES[this.currentCityId] || SEED_CITIES.vadodara;
  }

  setCity(cityId) {
    if (SEED_CITIES[cityId]) {
      this.currentCityId = cityId;
      const city = SEED_CITIES[cityId];
      // Pick first monument in city for default location
      const firstMonument = this.getMonumentsForCity(cityId)[0];
      if (firstMonument) {
        this.currentLocation = {
          lat: firstMonument.lat,
          lng: firstMonument.lng,
          name: `${firstMonument.name}, ${city.name}`,
          accuracy: 5
        };
      } else {
        this.currentLocation = {
          lat: city.center.lat,
          lng: city.center.lng,
          name: `${city.name} City Center`,
          accuracy: 10
        };
      }
      // Update active guide for city
      const cityGuides = this.getGuidesForCity(cityId);
      if (cityGuides.length > 0) {
        this.activeGuide = { ...cityGuides[0], uid: cityGuides[0].id };
      }
    }
  }

  getMonumentsForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("monuments");
    return all.filter(m => m.city === cityId);
  }

  getHotspotsForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("hotspots");
    return all.filter(h => h.city === cityId);
  }

  getGuidesForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("guides");
    return all.filter(g => g.city === cityId);
  }

  getGuideById(guideId) {
    const all = hybridStore.getCollection("guides");
    return all.find(g => g.id === guideId || g.licenseNo === guideId) || null;
  }

  // --- Handshakes Ledger ---
  getHandshakes() {
    return hybridStore.getCollection("handshakes");
  }

  async recordHandshake(handshakeData) {
    const record = await hybridStore.addDocument("handshakes", {
      ...handshakeData,
      status: "verified"
    });

    // Increment guide encounter count
    const guides = hybridStore.getCollection("guides");
    const guideIdx = guides.findIndex(g => g.id === handshakeData.guideId);
    if (guideIdx !== -1) {
      guides[guideIdx].encounterCount = (guides[guideIdx].encounterCount || 0) + 1;
      hybridStore.saveCollection("guides", guides);
    }

    return record;
  }

  hasHandshakeWithGuide(guideId, travelerId = this.activeUser.uid) {
    const handshakes = this.getHandshakes();
    return handshakes.some(h => h.guideId === guideId && (h.travelerId === travelerId || h.travelerId === "trv-demo-01"));
  }

  // --- Price Pulse Engine ---
  getPricePulses(cityId = this.currentCityId) {
    const pulses = hybridStore.getCollection("pricePulse");
    if (!cityId) return pulses;
    return pulses.filter(p => p.city === cityId);
  }

  async recordPricePulse(pulseData) {
    return await hybridStore.addDocument("pricePulse", {
      ...pulseData,
      city: pulseData.city || this.currentCityId,
      createdAt: Date.now()
    });
  }

  getFairRateBenchmark(monumentId, serviceCategory = "Official Guide") {
    const monuments = hybridStore.getCollection("monuments");
    const mon = monuments.find(m => m.id === monumentId);
    if (!mon || !mon.fairRates) {
      return { min: 100, median: 250, max: 500, unit: "standard" };
    }

    // Try matching service name
    for (const [key, rate] of Object.entries(mon.fairRates)) {
      if (key.toLowerCase().includes(serviceCategory.toLowerCase()) || serviceCategory.toLowerCase().includes(key.toLowerCase())) {
        return { key, ...rate };
      }
    }

    // Fallback to first available rate
    const firstKey = Object.keys(mon.fairRates)[0];
    return { key: firstKey, ...mon.fairRates[firstKey] };
  }

  // --- Proof-of-Presence Reviews ---
  getReviewsForGuide(guideId) {
    const all = hybridStore.getCollection("reviews");
    return all.filter(r => r.guideId === guideId);
  }

  async recordReview(reviewData) {
    return await hybridStore.addDocument("reviews", {
      ...reviewData,
      presenceVerified: true,
      createdAt: Date.now()
    });
  }

  // --- Transit Routes & Last 3 Passengers Paid ---
  getRoutesForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("routes");
    const filtered = all.filter(r => r.city === cityId);
    return filtered.length > 0 ? filtered : SEED_ROUTES.filter(r => r.city === "vadodara");
  }

  getDriversForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("drivers");
    const filtered = all.filter(d => d.city === cityId);
    return filtered.length > 0 ? filtered : SEED_DRIVERS;
  }

  async recordDigitalFootprint(footprintData) {
    return await hybridStore.addDocument("digitalFootprints", {
      ...footprintData,
      createdAt: Date.now()
    });
  }

  getDigitalFootprints() {
    return hybridStore.getCollection("digitalFootprints");
  }

  // --- Incidents & SOS ---
  async recordIncident(incidentData) {
    return await hybridStore.addDocument("incidents", {
      ...incidentData,
      timestamp: Date.now(),
      status: "forwarded_to_police"
    });
  }

  getIncidents() {
    return hybridStore.getCollection("incidents");
  }
}

export const store = new Store();
*/

/**
 * Verida — State Store & Data Repository
 * Coordinates reactive state, city benchmarks, handshakes, price pulses, reviews, and GPS coordinates.
 */

import { hybridStore } from "./firebase-config.js";
import {
  SEED_CITIES,
  SEED_MONUMENTS,
  SEED_HOTSPOTS,
  SEED_GUIDES,
  SEED_DRIVERS,
  SEED_ROUTES,
  SEED_PRICE_PULSES,
  SEED_HANDSHAKES,
  SEED_REVIEWS
} from "../data/seedData.js";

class Store {
  constructor() {
    this.currentCityId = "vadodara"; // Default to Vadodara
    this.currentRole = "traveler"; // 'traveler' or 'guide'
    this.currentLocation = {
      lat: 22.2937, // Laxmi Vilas Palace default
      lng: 73.1916,
      name: "Laxmi Vilas Palace, Vadodara",
      fromLocation: "", // Fix: Explicit From location
      toLocation: "",
      accuracy: 5
    };
    this.isSimulatedGps = true;
    this.activeUser = {
      uid: "trv_devanshi_01",
      name: "Devanshi Sharma",
      phone: "+91 98765 43210",
      origin: "Tourist / Vadodara, Gujarat",
      emergencyContact: "Family (+91 98765 11223)",
      role: "traveler",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    };
    this.activeGuide = {
      uid: "driver-vad-001",
      id: "driver-vad-001",
      name: "Mehul Bhai Solanki",
      phone: "+91 94260 55321",
      licenseNo: "GJ-06-2018-009124",
      badgeNo: "VAD-AUTO-772",
      vehicleRegNo: "GJ-06-AU-7892",
      vehicleType: "Green CNG Auto-Rickshaw",
      issuer: "Vadodara RTO & Police Tourist Syndicate",
      category: "Auto-Rickshaw Transit",
      city: "vadodara",
      rating: 4.92,
      encounterCount: 640,
      specialty: "Vadodara City Transit & Gaekwad Heritage",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    };

    this.loadSavedProfiles();
    this.initSeedData();
  }

loadSavedProfiles() {
    try {
      const savedUser = localStorage.getItem("verida_user_profile");
      if (savedUser) this.activeUser = { ...this.activeUser, ...JSON.parse(savedUser) };
      
      const savedGuide = localStorage.getItem("verida_guide_profile");
      if (savedGuide) this.activeGuide = { ...this.activeGuide, ...JSON.parse(savedGuide) };
    } catch (e) {
      console.warn("[Verida Store] Profile load error:", e);
    }
  }
  setFromLocation(fromName, coords = null) {
    this.currentLocation.fromLocation = fromName;
    if (coords) {
      this.currentLocation.lat = coords.lat;
      this.currentLocation.lng = coords.lng;
    }
    console.log("[Verida Store] Explicit From Location updated:", fromName);
    this._notifyLocationChange();
  }

  setToLocation(toName) {
    this.currentLocation.toLocation = toName;
    console.log("[Verida Store] Explicit To Location updated:", toName);
    this._notifyLocationChange();
  }

  setRouteLocations(fromName, toName) {
    this.currentLocation.fromLocation = fromName;
    this.currentLocation.toLocation = toName;
    console.log(`[Verida Store] Explicit Route set: ${fromName} ➔ ${toName}`);
    this._notifyLocationChange();
  }

  _notifyLocationChange() {
    if (typeof window !== "undefined" && window.veridaApp?.renderApp) {
      window.veridaApp.renderApp();
    }
  }

  registerPassenger(profile) {
    this.activeUser = {
      ...this.activeUser,
      ...profile,
      uid: `trv_${Date.now()}`
    };
    localStorage.setItem("verida_user_profile", JSON.stringify(this.activeUser));
    return this.activeUser;
  }

  registerDriver(profile) {
    const existingId = this.activeGuide.id || this.activeGuide.uid || `driver_${Date.now()}`;
    this.activeGuide = {
      ...this.activeGuide,
      ...profile,
      uid: existingId,
      id: existingId
    };
    localStorage.setItem("verida_guide_profile", JSON.stringify(this.activeGuide));
    return this.activeGuide;
  }

  initSeedData(forceReset = false) {
    const existingMonuments = hybridStore.getCollection("monuments");
    const existingHotspots = hybridStore.getCollection("hotspots");
    const existingRoutes = hybridStore.getCollection("routes");
    if (forceReset || existingMonuments.length < SEED_MONUMENTS.length || existingHotspots.length < SEED_HOTSPOTS.length || existingRoutes.length === 0) {
      hybridStore.saveCollection("monuments", SEED_MONUMENTS);
      hybridStore.saveCollection("hotspots", SEED_HOTSPOTS);
      hybridStore.saveCollection("guides", SEED_GUIDES);
      hybridStore.saveCollection("drivers", SEED_DRIVERS);
      hybridStore.saveCollection("routes", SEED_ROUTES);
      hybridStore.saveCollection("pricePulse", SEED_PRICE_PULSES);
      hybridStore.saveCollection("handshakes", SEED_HANDSHAKES);
      hybridStore.saveCollection("reviews", SEED_REVIEWS);
      console.log("[Verida Store] Seed data refreshed with routes, drivers, and complete Vadodara datasets.");
    }
  }

  // --- City & Location Accessors ---
  getCities() {
    return SEED_CITIES;
  }

  getCurrentCity() {
    return SEED_CITIES[this.currentCityId] || SEED_CITIES.vadodara;
  }

setCity(cityId) {
    if (SEED_CITIES[cityId]) {
      this.currentCityId = cityId;
      const city = SEED_CITIES[cityId];
      
      this.currentLocation = {
        ...this.currentLocation,
        lat: city.center.lat,
        lng: city.center.lng,
        name: `${city.name} City Center`
        // Note: fromLocation and toLocation are NOT overwritten automatically here
      };

      const cityGuides = this.getGuidesForCity(cityId);
      if (cityGuides.length > 0) {
        this.activeGuide = {  ...cityGuides[0], uid: cityGuides[0].id };
      }
    }
        
      // Force UI updates if app instance exists
      if (typeof window !== "undefined" && window.veridaApp?.renderApp) {
        window.veridaApp.renderApp();
      }
}
  

  getMonumentsForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("monuments");
    return all.filter(m => m.city === cityId);
  }

  getHotspotsForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("hotspots");
    return all.filter(h => h.city === cityId);
  }

  getGuidesForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("guides");
    return all.filter(g => g.city === cityId);
  }

  // Enhanced Guide Lookup across both guides and drivers
  getGuideById(guideId) {
    if (!guideId) return this.activeGuide;
    const guides = hybridStore.getCollection("guides");
    const drivers = hybridStore.getCollection("drivers");
    const allEntities = [...guides, ...drivers];

    return allEntities.find(g => 
      g.id === guideId || 
      g.uid === guideId || 
      g.licenseNo === guideId || 
      g.vehicleRegNo === guideId
    ) || (this.activeGuide?.id === guideId ? this.activeGuide : null);
  }

  getDriverById(driverId) {
    return this.getGuideById(driverId);
  }

  // --- Handshakes Ledger ---
  getHandshakes() {
    return hybridStore.getCollection("handshakes");
  }

  async recordHandshake(handshakeData) {
    const record = await hybridStore.addDocument("handshakes", {
      ...handshakeData,
      status: "verified"
    });

    // Increment guide encounter count
    const guides = hybridStore.getCollection("guides");
    const guideIdx = guides.findIndex(g => g.id === handshakeData.guideId);
    if (guideIdx !== -1) {
      guides[guideIdx].encounterCount = (guides[guideIdx].encounterCount || 0) + 1;
      hybridStore.saveCollection("guides", guides);
    }

    return record;
  }

hasHandshakeWithGuide(guideId, travelerId = this.activeUser.uid) {
    const handshakes = this.getHandshakes();
    if (!handshakes || handshakes.length === 0) return false;

    const targetGuide = this.getGuideById(guideId);
    const targetName = targetGuide?.name || targetGuide?.guideName || guideId;
    const targetVehicle = targetGuide?.vehicleRegNo;

    return handshakes.some(h => {
      // Match Driver / Guide
      const matchesGuide = 
        h.guideId === guideId ||
        h.guideId === targetGuide?.id ||
        h.guideId === targetGuide?.uid ||
        (targetName && h.guideName === targetName) ||
        (targetVehicle && h.vehicleRegNo === targetVehicle);

      // Match Passenger / User
      const matchesUser = 
        h.travelerId === travelerId ||
        h.travelerId === this.activeUser.uid ||
        h.passengerName === this.activeUser.name ||
        h.travelerName === this.activeUser.name ; // Any completed handshake with this guide unlocks access

      return matchesGuide && matchesUser;
    });
  }

  // --- Price Pulse Engine ---
  getPricePulses(cityId = this.currentCityId) {
    const pulses = hybridStore.getCollection("pricePulse");
    if (!cityId) return pulses;
    return pulses.filter(p => p.city === cityId);
  }

  async recordPricePulse(pulseData) {
    return await hybridStore.addDocument("pricePulse", {
      ...pulseData,
      city: pulseData.city || this.currentCityId,
      createdAt: Date.now()
    });
  }

  getFairRateBenchmark(monumentId, serviceCategory = "Official Guide") {
    const monuments = hybridStore.getCollection("monuments");
    const mon = monuments.find(m => m.id === monumentId);
    if (!mon || !mon.fairRates) {
      return { min: 100, median: 250, max: 500, unit: "standard" };
    }

    for (const [key, rate] of Object.entries(mon.fairRates)) {
      if (key.toLowerCase().includes(serviceCategory.toLowerCase()) || serviceCategory.toLowerCase().includes(key.toLowerCase())) {
        return { key, ...rate };
      }
    }

    const firstKey = Object.keys(mon.fairRates)[0];
    return { key: firstKey, ...mon.fairRates[firstKey] };
  }

  // --- Proof-of-Presence Reviews ---
  getReviewsForGuide(guideId) {
    const all = hybridStore.getCollection("reviews") || [];
    if (!guideId) return all;

    const target = this.getGuideById(guideId);
    const vehicleRegNo = target?.vehicleRegNo;

    return all.filter(r => 
      r.guideId === guideId || 
      r.guideId === target?.id || 
      r.guideId === target?.uid ||
      (vehicleRegNo && r.vehicleRegNo === vehicleRegNo)
    );
  }

  async recordReview(reviewData) {
    const newDoc = await hybridStore.addDocument("reviews", {
      ...reviewData,
      presenceVerified: true,
      createdAt: Date.now()
    });
    return newDoc;
  }

  // Alias helper for reviews.js compatibility
  async addReview(reviewData) {
    return await this.recordReview(reviewData);
  }

  // --- Transit Routes & Last 3 Passengers Paid ---
  getRoutesForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("routes");
    const filtered = all.filter(r => r.city === cityId);
    return filtered.length > 0 ? filtered : SEED_ROUTES.filter(r => r.city === "vadodara");
  }

  getDriversForCity(cityId = this.currentCityId) {
    const all = hybridStore.getCollection("drivers");
    const filtered = all.filter(d => d.city === cityId);
    return filtered.length > 0 ? filtered : SEED_DRIVERS;
  }

 async recordDigitalFootprint(footprintData) {
    const activeDriver = this.activeGuide || this.activeDriver;
    
    const enrichedFootprint = {
      id: `fp_${Date.now()}`,
      passengerName: footprintData.passengerName || this.activeUser.name,
      driverId: footprintData.driverId || activeDriver?.id || activeDriver?.uid,
      driverName: footprintData.driverName || activeDriver?.name,
      vehicleRegNo: footprintData.vehicleRegNo || activeDriver?.vehicleRegNo || "GJ-06-AU-7892",
      route: footprintData.route || "Vadodara Transit Route",
      amountPaid: footprintData.amountPaid || footprintData.fare || 50,
      footprintHash: footprintData.footprintHash || `0x${Math.random().toString(16).substring(2, 10)}`,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      ...footprintData
    };

    return await hybridStore.addDocument("digitalFootprints", enrichedFootprint);
  }

  getDigitalFootprints() {
    return hybridStore.getCollection("digitalFootprints") || [];
  }

  // --- Incidents & SOS ---
  async recordIncident(incidentData) {
    return await hybridStore.addDocument("incidents", {
      ...incidentData,
      timestamp: Date.now(),
      status: "forwarded_to_police"
    });
  }

  getIncidents() {
    return hybridStore.getCollection("incidents") || [];
  }
}

export const store = new Store();