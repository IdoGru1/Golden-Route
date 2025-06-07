require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

// חישוב מרחק בין שתי נקודות קואורדינטה בק"מ
function calculateDistance(coord1, coord2) {
  const R = 6371; // רדיוס כדור הארץ בק"מ
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateClosureTime(drone, flight) {
  const toRad = deg => deg * Math.PI / 180;

  // הפרש בק"מ → נהפוך למטרים
  const dx = (drone.longitude - flight.longitude) * 111320 * Math.cos(toRad((drone.latitude + flight.latitude) / 2));
  const dy = (drone.latitude - flight.latitude) * 110540;

  const distMeters = Math.sqrt(dx * dx + dy * dy); // במטרים

  const droneSpeed = drone.speed / 3.6; // כטב"ם: קמ"ש → מ/ש
  const droneAngle = Math.atan2(-dy, -dx); // כיוון מהכטב"ם אל המטוס

  const flightAngle = toRad(flight.true_track || 0); // כיוון טיסה במעלות
  const flightVx = flight.velocity * Math.cos(flightAngle); // מ/ש
  const flightVy = flight.velocity * Math.sin(flightAngle); // מ/ש

  const droneVx = droneSpeed * Math.cos(droneAngle);
  const droneVy = droneSpeed * Math.sin(droneAngle);

  const relVx = flightVx + droneVx;
  const relVy = flightVy + droneVy;

  const relativeSpeed = Math.sqrt(relVx * relVx + relVy * relVy); // מ/ש

  if (relativeSpeed < 0.01) return Infinity; // תנועה זהה או כמעט אפסית → אין זמן סגירה

  const timeSeconds = distMeters / relativeSpeed;
  return timeSeconds / 60; // זמן בדקות
}




// בקשת Access Token ל-OpenSky
async function getOpenSkyAccessToken() {
  const tokenUrl = 'https://identity.opensky-network.org/oauth/token';
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.OPENSKY_CLIENT_ID,
    client_secret: process.env.OPENSKY_CLIENT_SECRET
  });

  try {
    const res = await axios.post(tokenUrl, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return res.data.access_token;
  } catch (err) {
    console.error("❌ שגיאה בקבלת Access Token מ־OpenSky:", err.response?.data || err.message);
    return null;
  }
}

// קבלת טיסות מה־API של OpenSky
async function fetchFlightsFromOpenSky(token) {
  const res = await axios.get('https://api.opensky-network.org/api/states/all', {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data.states.map(s => ({
    icao24: s[0],
    callsign: s[1]?.trim(),
    originCountry: s[2],
    longitude: s[5],
    latitude: s[6],
    altitude: s[7],
    velocity: s[9],
    true_track: 0 // כיוון צפונה
  })).filter(f => f.latitude && f.longitude && f.callsign?.startsWith("ELY")); // טיסות ישראליות לדוגמה
}

// נקודת בדיקה
app.post('/check-threat-live', async (req, res) => {
  const droneCoords = {
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    radius: req.body.radius,
    speed: req.body.speed
  };

  let usedFlight = null;
  let usingMock = false;

  try {
    const token = await getOpenSkyAccessToken();

    if (!token) throw new Error("No token");

    const flights = await fetchFlightsFromOpenSky(token);

    if (!flights.length) throw new Error("No flights");

    let closestFlight = null;
    let minDistance = Infinity;

    for (const flight of flights) {
      const dist = calculateDistance(droneCoords, flight);
      if (dist < minDistance) {
        closestFlight = flight;
        minDistance = dist;
      }
    }

    usedFlight = closestFlight;
  } catch (err) {
    console.warn("⚠️ לא ניתן לפנות ל-OpenSky, משתמש בטיסות בדיקה.");

    usedFlight = {
  callsign: 'TEST123',
  latitude: 32.011,
  longitude: 34.774,
  altitude: 9500,
  velocity: 210,     // קמ"ש
  true_track: 180    // טס דרומה (כלומר לכיוון הכטב"ם)
};

    usingMock = true;
  }

  const distance = calculateDistance(droneCoords, usedFlight);
  const closureTime = calculateClosureTime(droneCoords, usedFlight);
  

  res.json({
    threat: distance <= droneCoords.radius,
    closestFlight: usedFlight,
    distance,
    closureTime,
    usingMockFlight: usingMock
  });
});

// שמירת בדיקה
// שמירת בדיקה
app.post('/checks/save', async (req, res) => {
  try {
    await prisma.droneCheck.create({
      data: {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        radius: req.body.radius,
        speed: req.body.speed,
        threat: req.body.threat,
        flightCallsign: req.body.flightCallsign,
        distance: req.body.distance,
        closureTime: req.body.closureTime,
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ שגיאה בשמירה למסד:", err);
    res.status(500).json({ success: false });
  }
});


// היסטוריית בדיקות
app.get('/checks/history', async (req, res) => {
  try {
    const history = await prisma.droneCheck.findMany({ orderBy: { id: 'desc' }, take: 30 });
    res.json({ history });
  } catch (err) {
    console.error("שגיאה בשליפת היסטוריה:", err);
    res.status(500).json({ history: [] });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 שרת פעיל בכתובת http://localhost:${PORT}`);
});
