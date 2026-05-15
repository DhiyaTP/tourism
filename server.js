const User = require("./models/user");
const Trip = require("./models/trip");
const Favorite = require("./models/favorite");
const ChatHistory = require("./models/chatHistory");
const Place = require("./models/place");

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const express = require("express");
const path = require("path");

const Groq = require("groq-sdk");
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const trivandrumPlaces = require("./data/trivandrum");
const kollamPlaces = require("./data/kollam");
const alappuzhaPlaces = require("./data/alappuzha");
const pathanamthittaPlaces = require("./data/pathanamthitta");
const { default: axios } = require("axios");
// Add this near the top, after DISTRICTS array
function normalizeDistrict(raw) {
  if (!raw) return "unknown";
  const lower = raw.toLowerCase();
  return DISTRICTS.find(d => lower.includes(d)) || "unknown";
}
const DISTRICTS = [
  "thiruvananthapuram",
  "kollam",
  "alappuzha",
  "pathanamthitta",
  "kottayam",
  "ernakulam",
  "thrissur",
  "palakkad",
  "malappuram",
  "kozhikode",
  "wayanad",
  "kannur",
  "kasaragod",
  "idukki"
];

const allPlaces = [
  ...trivandrumPlaces,
  ...kollamPlaces,
  ...alappuzhaPlaces,
  ...pathanamthittaPlaces
];

const normalizedPlacesByDistrict = {
  thiruvananthapuram: trivandrumPlaces,
  kollam: kollamPlaces,
  alappuzha: alappuzhaPlaces,
  pathanamthitta: pathanamthittaPlaces,
  kottayam: [],
  ernakulam: [],
  thrissur: [],
  palakkad: [],
  malappuram: [],
  kozhikode: [],
  wayanad: [],
  kannur: [],
  kasaragod: [],
  idukki: []
};

const app = express();
const PORT = 3000;

mongoose.connect("mongodb://127.0.0.1:27017/keralaTourismDB")
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "keralaTourismSecretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/keralaTourismDB"
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// ROOT ROUTE
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.redirect("/login.html");
  }
});

// GLOBAL AUTH PROTECTION
app.use((req, res, next) => {
  if (
    req.path.startsWith("/css/") ||
    req.path.startsWith("/js/") ||
    req.path.startsWith("/images/") ||
    req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/)
  ) {
    return next();
  }

const publicRoutes = ["/login.html", "/signup.html", "/login", "/signup", "/", "/fix-all-districts", "/fix-missing-images"];  if (publicRoutes.includes(req.path)) {
    return next();
  }

  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
});

// HOME PAGE
app.get("/home", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/index.html", (req, res) => {
  return res.redirect("/");
});

app.get("/destinations", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "destinations.html"));
});

// TRIP PLANNER (single route with auth)
app.get("/trip-planner", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "trip-planner.html"));
});

// DISTRICTS API
app.get("/api/districts", (req, res) => {
  res.json(Object.keys(normalizedPlacesByDistrict));
});

// DISTRICT PAGES (single dynamic route)
// DISTRICT PAGES (single dynamic route)
app.get("/district/:name", async (req, res) => {
  const districtName = req.params.name.toLowerCase();

  if (!normalizedPlacesByDistrict.hasOwnProperty(districtName)) {
    return res.status(404).send("District not found");
  }

  const hardcodedPlaces = normalizedPlacesByDistrict[districtName] || [];
  const hardcodedSlugs = hardcodedPlaces.map(p => p.slug);

  let dbPlaces = [];
  try {
    dbPlaces = await Place.find({
      district: { $regex: new RegExp("^" + districtName + "$", "i") },
      slug: { $nin: hardcodedSlugs }
    }).lean();
  } catch (err) {
    console.log("DB fetch error:", err.message);
  }

  const allDistrictPlaces = [...hardcodedPlaces, ...dbPlaces];
  const title = districtName.charAt(0).toUpperCase() + districtName.slice(1);

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${title} - Kerala Tourism</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f8f4ef; }

  .header {
    background: #0a6b4e;
    color: white;
    padding: 18px 30px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header button {
    background: rgba(255,255,255,0.2);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
  }
  .header h1 { font-size: 22px; }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    max-width: 1100px;
    margin: 30px auto;
    padding: 0 20px;
  }

  .card {
    background: white;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: black;
    display: block;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  .card img {
    width: 100%;
    height: 220px;
    object-fit: cover;
  }
  .card-body {
    padding: 18px 20px;
  }
  .card-body h2 {
    font-size: 18px;
    margin-bottom: 8px;
    color: #1a1a1a;
  }
  .card-body p {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
  .badge {
    display: inline-block;
    margin-top: 10px;
    font-size: 12px;
    background: #e8f5f0;
    color: #0a6b4e;
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
  }

  .empty {
    text-align: center;
    padding: 80px 20px;
    color: #999;
    font-size: 18px;
    grid-column: 1 / -1;
  }
  .empty span { display: block; font-size: 48px; margin-bottom: 12px; }
</style>
</head>
<body>

<div class="header">
  <button onclick="history.back()">⬅ Back</button>
  <h1>📍 ${title}</h1>
</div>

<div class="grid">
  ${allDistrictPlaces.length === 0 ? `
    <div class="empty">
      <span>🗺️</span>
      No places found for ${title} yet.<br>
      <small>Search for a place to add it here!</small>
    </div>
  ` : allDistrictPlaces.map(p => `
    <a class="card" href="/place/${p.slug}">
      <img
        src="${p.image}"
        alt="${p.name}"
        onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Kerala_backwaters.jpg/800px-Kerala_backwaters.jpg'"
      >
      <div class="card-body">
        <h2>${p.name}</h2>
        <p>${p.short || p.description || "A beautiful destination in Kerala."}</p>
        <span class="badge">📍 ${title}</span>
      </div>
    </a>
  `).join("")}
</div>

</body>
</html>
`);
});

// PLACE PAGE
app.get("/place/:slug", async (req, res) => {
  try {
    let p = allPlaces.find(x => x.slug === req.params.slug);

    if (!p) {
      p = await Place.findOne({ slug: req.params.slug });
    }

    if (!p) return res.send("Place not found");

    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${p.name}</title>
<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px;cursor:pointer}
.hero{width:100%;max-height:420px;object-fit:cover}
.section{background:#fff;margin:25px auto;max-width:950px;padding:22px;border-radius:18px}
iframe{width:95%;height:320px;border:none;border-radius:16px;margin:18px auto;display:block}
.tab-buttons{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.tab-buttons button{padding:12px 24px;border:none;border-radius:12px;background:#e9eef3;font-weight:600;cursor:pointer}
.tab-buttons .active{background:#ff9800;color:#fff}
.item{display:flex;justify-content:space-between;padding:10px 0}
.activity-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.activity-card{background:#f1f9f7;padding:16px;border-radius:14px;font-weight:600}
</style>
</head>
<body>

<button class="back" onclick="history.back()">⬅ Back</button>
<img class="hero" src="${p.image}">

<div class="section">
  <h1>${p.name}</h1>
  <p>${p.description}</p>
</div>

<iframe src="https://www.google.com/maps?q=${p.location}&output=embed"></iframe>

<div class="section">
  <h3>🚗 How to Reach</h3>
  <div class="tab-buttons" id="reachTabs">
    <button class="active" onclick="showReach('road',this)">Road</button>
    <button onclick="showReach('train',this)">Train</button>
    <button onclick="showReach('flight',this)">Flight</button>
  </div>
  <div id="reachBox"></div>
</div>

<div class="section">
  <h3>🎯 Activities to Do</h3>
  <div class="activity-grid">
    ${(p.activities || []).map(a => `<div class="activity-card">🎯 ${a}</div>`).join("")}
  </div>
</div>

<div class="section">
  <h3>Nearby Essentials</h3>
  <div class="tab-buttons" id="nearbyTabs">
    <button class="active" onclick="showNearby('food',this)">Food</button>
    <button onclick="showNearby('stay',this)">Stay</button>
    <button onclick="showNearby('petrol',this)">Petrol</button>
    <button onclick="showNearby('atm',this)">ATM</button>
    <button onclick="showNearby('hospital',this)">Hospital</button>
  </div>
  <div id="listBox"></div>
</div>

<iframe id="nearbyMap"></iframe>

<div class="section" style="text-align:center">
  <h2>⭐ Save This Place</h2>
  <button onclick="addFavorite()" style="background:#ff4d4d;color:white;padding:12px 24px;border:none;border-radius:10px;margin-right:15px;font-weight:bold;cursor:pointer">
    ❤️ Add to Favorites
  </button>
  <button onclick="saveTrip()" style="background:#0a6b4e;color:white;padding:12px 24px;border:none;border-radius:10px;font-weight:bold;cursor:pointer">
    💾 Save Trip
  </button>
</div>

<script>
const reach = ${JSON.stringify(p.reach || { road: "N/A", train: "N/A", flight: "N/A" })};
const data = ${JSON.stringify({
  food:     p.food     || [],
  stay:     p.stay     || [],
  petrol:   p.petrol   || [],
  atm:      p.atm      || [],
  hospital: p.hospital || []
})};

function showReach(t, b) {
  document.querySelectorAll('#reachTabs button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('reachBox').innerText = reach[t] || "Info not available";
}

function showNearby(t, b) {
  document.querySelectorAll('#nearbyTabs button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');

  const listBox = document.getElementById('listBox');
  const nearbyMap = document.getElementById('nearbyMap');

  listBox.innerHTML = (data[t] || []).map(i => {
    if (typeof i === "string") {
      return '<div class="item">' + i +
        '<button onclick="nearbyMap.src=\\'https://www.google.com/maps?q=' + encodeURIComponent(i) + '&output=embed\\'">📍</button>' +
        '</div>';
    }
    return '<div class="item">' + i.name +
      '<div>' +
      '<button onclick="nearbyMap.src=\\'https://www.google.com/maps?q=' + encodeURIComponent(i.name) + '&output=embed\\'">📍</button>' +
      '<a href="' + i.bookingUrl + '" target="_blank">' +
      '<button style="background:#0a6b4e;color:white;border:none;padding:6px 14px;border-radius:8px;cursor:pointer">Book</button>' +
      '</a></div></div>';
  }).join("");

  nearbyMap.src = "https://www.google.com/maps?q=" + encodeURIComponent(t + " near ${p.location}") + "&output=embed";
}

showReach('road', document.querySelector('#reachTabs button'));
showNearby('food', document.querySelector('#nearbyTabs button'));

function addFavorite() {
  fetch("/api/favorite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeName: "${p.name}" })
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(err => console.error(err));
}

function saveTrip() {
  alert("Trip Saved 💾");
}
</script>

</body>
</html>
`);
  } catch (err) {
    console.log(err);
    res.send("Error loading place");
  }
});

// SIGN UP
app.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) return res.send("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.redirect("/login.html");
  } catch (err) {
    console.log(err);
    res.send("Signup error");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Incorrect password");

    req.session.user = user;
    res.redirect("/home");
  } catch (err) {
    console.log(err);
    res.send("Login error");
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// CHATBOT
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a Kerala Tourism Travel Assistant." },
        { role: "user", content: userMessage }
      ]
    });

    const aiReply = completion.choices[0].message.content;

    const chat = new ChatHistory({
      userId: req.session.user ? req.session.user._id : null,
      message: userMessage,
      reply: aiReply
    });
    await chat.save();

    res.json({ reply: aiReply });
  } catch (error) {
    console.log(error);
    res.json({ reply: "AI server error" });
  }
});

/// ITINERARY GENERATOR
/// ITINERARY GENERATOR
app.post("/api/itinerary", (req, res) => {
  const { district, days } = req.body;
  const selectedDistrict = district.toLowerCase().trim();
  const totalDays = parseInt(days);
  const places = normalizedPlacesByDistrict[selectedDistrict] || [];

  console.log("🗺️ Itinerary request | District:", selectedDistrict, "| Places:", places.length);

  if (places.length === 0) return res.json({ plan: [] });

  let index = 0;
  let plan = [];

  for (let d = 1; d <= totalDays; d++) {
    let dayPlaces = [];
    for (let i = 0; i < 3; i++) {
      if (places[index]) {
        dayPlaces.push({
          name: places[index].name,
          short: places[index].short || places[index].description || "",
          activities: places[index].activities || [],
          food: places[index].food || [],
          stay: places[index].stay || [],
          reach: places[index].reach || {},
          location: places[index].location || places[index].name
        });
        index++;
      }
    }
    plan.push({ day: d, places: dayPlaces });
  }

  res.json({ plan });
});
/* ===============================
   DISTRICT API FOR TRIP PLANNER
================================ */

app.get("/trip-planner", (req,res)=>{
  if(!req.session.user){
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname,"views","trip-planner.html"));
});// ADD FAVORITE
app.post("/api/favorite", async (req, res) => {
  if (!req.session.user) return res.json({ message: "Please login first" });

  try {
    const { placeName } = req.body;
    const favorite = new Favorite({ userId: req.session.user._id, placeName });
    await favorite.save();
    res.json({ message: "Added to favorites ❤️" });
  } catch (err) {
    console.log(err);
    res.json({ message: "Error saving favorite" });
  }
});

// GET ALL PLACES
app.get("/api/places", async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.json([]);
  }
});

// GET FAVORITES
app.get("/api/favorites", async (req, res) => {
  if (!req.session.user) return res.json([]);
  try {
    const favorites = await Favorite.find({ userId: req.session.user._id });
    res.json(favorites);
  } catch (err) {
    res.json([]);
  }
});

// GET TRIPS
app.get("/api/trips", async (req, res) => {
  if (!req.session.user) return res.json([]);
  try {
    const trips = await Trip.find({ userId: req.session.user._id });
    res.json(trips);
  } catch (err) {
    res.json([]);
  }
});

// IMPORT ALL PLACES
app.get("/import-all-places", async (req, res) => {
  try {
    for (let p of allPlaces) {
      const exists = await Place.findOne({ name: p.name });
      if (!exists) {
        await Place.create({
          name: p.name,
          slug: p.slug,
          district: p.district || "Unknown",
          description: p.description,
          location: p.location,
          activities: p.activities,
          image: p.image
        });
      }
    }
    res.send("✅ All places imported");
  } catch (err) {
    console.log(err);
    res.send("Import error");
  }
});


// ─── DISTRICT DETECTION HELPER ───────────────────────────────────────────────
const KERALA_DISTRICTS = [
  "thiruvananthapuram", "kollam", "alappuzha", "pathanamthitta",
  "kottayam", "ernakulam", "thrissur", "palakkad", "malappuram",
  "kozhikode", "wayanad", "kannur", "kasaragod", "idukki"
];

const DISTRICT_ALIASES = {
  "trivandrum": "thiruvananthapuram",
  "calicut": "kozhikode",
  "trichur": "thrissur",
  "alleppey": "alappuzha",
  "quilon": "kollam",
  "palghat": "palakkad",
  "cannanore": "kannur",
  "idukki district": "idukki",
  "ernakulam district": "ernakulam",
  "wayanad district": "wayanad"
};

async function detectDistrict(placeName, osmAddress = null) {
  // Layer 1: Search ALL OSM address fields
  if (osmAddress) {
    const allText = Object.values(osmAddress).join(" ").toLowerCase();
    const found = KERALA_DISTRICTS.find(d => allText.includes(d));
    if (found) {
      console.log("📍 District found via OSM:", found);
      return found;
    }
    const aliasFound = Object.keys(DISTRICT_ALIASES).find(a => allText.includes(a));
    if (aliasFound) {
      console.log("📍 District found via alias:", DISTRICT_ALIASES[aliasFound]);
      return DISTRICT_ALIASES[aliasFound];
    }
  }

  // Layer 2: Ask Groq AI
  console.log("🤖 Asking Groq for district of:", placeName);
  try {
    const aiRes = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a Kerala geography expert. Reply with ONLY the district name in lowercase. Nothing else. No punctuation."
        },
        {
          role: "user",
          content: `Which district of Kerala is "${placeName}" located in? Choose only from: thiruvananthapuram, kollam, alappuzha, pathanamthitta, kottayam, ernakulam, thrissur, palakkad, malappuram, kozhikode, wayanad, kannur, kasaragod, idukki. Reply with just the one district name.`
        }
      ]
    });

    const answer = aiRes.choices[0].message.content.trim().toLowerCase();
    console.log("🤖 Groq district answer:", answer);
    const matched = KERALA_DISTRICTS.find(d => answer.includes(d));
    if (matched) return matched;
  } catch (e) {
    console.log("🤖 Groq district detection failed:", e.message);
  }

  // Layer 3: Default fallback
  return "unknown";
}
// ─────────────────────────────────────────────────────────────────────────────

// SEARCH PLACE

app.get("/api/search-place", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const slug = query.toLowerCase().trim().replace(/\s+/g, "-");

    console.log("🔍 Searching:", query, "| slug:", slug);

    // 1. Check DB first
    let place = await Place.findOne({ slug });
    if (!place) {
      place = await Place.findOne({ name: new RegExp("^" + escaped + "$", "i") });
    }

    // If found but district is Unknown, auto-fix it
    if (place && place.slug) {
      if (!place.district || place.district === "Unknown" || place.district === "unknown") {
        console.log("⚠️ Found in DB but district is Unknown, fixing...");
        const fixedDistrict = await detectDistrict(place.name);
        await Place.updateOne({ _id: place._id }, { $set: { district: fixedDistrict } });
        place.district = fixedDistrict;
        console.log("✅ Fixed district to:", fixedDistrict);
      }
      return res.json({ fromDB: true, place });
    }

    // 2. Fetch from OpenStreetMap
    console.log("🌍 Fetching from OpenStreetMap...");
    const osmResponse = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query + " Kerala India",
          format: "json",
          limit: 1,
          addressdetails: 1
        },
        headers: { "User-Agent": "KeralaTourismGuideApp" }
      }
    );

    if (!osmResponse.data || osmResponse.data.length === 0) {
      return res.json([]);
    }

    const result = osmResponse.data[0];
    const lat = result.lat;
    const lon = result.lon;

    console.log("📍 Full OSM address:", JSON.stringify(result.address));

    // 3. Detect district using helper (OSM → Alias → Groq)
    const matchedDistrict = await detectDistrict(query, result.address);
    console.log("📍 Final district:", matchedDistrict);

    // 4. Get image from Wikipedia
    let imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Kerala_backwaters.jpg/800px-Kerala_backwaters.jpg";
    try {
      const wikiResponse = await axios.get(
        "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query),
        { headers: { "User-Agent": "KeralaTourismGuideApp" } }
      );
      if (wikiResponse.data?.originalimage?.source) {
        imageUrl = wikiResponse.data.originalimage.source;
      } else if (wikiResponse.data?.thumbnail?.source) {
        imageUrl = wikiResponse.data.thumbnail.source;
      } else throw new Error("No Wikipedia image");
    } catch {
      try {
        const commonsResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
          params: {
            action: "query",
            titles: query + " Kerala",
            prop: "pageimages",
            pithumbsize: 800,
            format: "json",
            origin: "*"
          },
          headers: { "User-Agent": "KeralaTourismGuideApp" }
        });
        const pages = commonsResponse.data.query.pages;
        const page = Object.values(pages)[0];
        if (page?.thumbnail?.source) imageUrl = page.thumbnail.source;
      } catch {
        console.log("🖼️ Using default Kerala image");
      }
    }

    // 5. Generate all place data with Groq
    console.log("🤖 Generating place data with Groq...");
    let placeData = {
      short: `A popular tourist destination in ${matchedDistrict}, Kerala.`,
      description: `Explore ${query} — a beautiful destination in ${matchedDistrict}, Kerala.`,
      activities: ["Sightseeing", "Photography", "Explore", "Local Culture"],
      food: [], stay: [], petrol: [], atm: [], hospital: [],
      reach: { road: "N/A", train: "N/A", flight: "N/A" }
    };

    try {
      const aiCompletion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a Kerala tourism data assistant. Respond with valid JSON only. No markdown, no code blocks, no explanation."
          },
          {
            role: "user",
            content: `Generate tourism data for "${query}" in Kerala (district: ${matchedDistrict}).
Return ONLY this JSON:
{
  "short": "One sentence card preview, max 12 words",
  "description": "2-3 sentences about this place for tourists",
  "activities": ["Activity 1", "Activity 2", "Activity 3", "Activity 4", "Activity 5"],
  "food": ["Restaurant 1", "Restaurant 2", "Restaurant 3"],
  "stay": ["Hotel 1", "Hotel 2", "Hotel 3"],
  "petrol": ["Petrol Station 1", "Petrol Station 2"],
  "atm": ["Bank ATM 1", "Bank ATM 2"],
  "hospital": ["Hospital 1", "Hospital 2"],
  "reach": {
    "road": "Road route to ${query} from nearest major city",
    "train": "Nearest railway station and km distance",
    "flight": "Nearest airport and km distance"
  }
}`
          }
        ]
      });

      const aiText = aiCompletion.choices[0].message.content.trim();
      const cleaned = aiText.replace(/```json|```/g, "").trim();
      placeData = { ...placeData, ...JSON.parse(cleaned) };
      console.log("🤖 Groq data generated successfully");
    } catch (aiErr) {
      console.log("🤖 Groq generation failed:", aiErr.message);
    }

    // 6. Save to DB
    const savedPlace = await Place.findOneAndUpdate(
      { slug },
      {
        name: query,
        slug,
        district: matchedDistrict,
        location: lat + "," + lon,
        short:       placeData.short,
        description: placeData.description,
        activities:  placeData.activities,
        image:       imageUrl,
        food:        placeData.food,
        stay:        placeData.stay,
        petrol:      placeData.petrol,
        atm:         placeData.atm,
        hospital:    placeData.hospital,
        reach:       placeData.reach
      },
      { upsert: true, new: true }
    );

    console.log("✅ Saved:", savedPlace.name, "| District:", savedPlace.district);
    return res.json({ fromDB: true, place: savedPlace });

  } catch (err) {
    console.log("❌ Search error:", err.message);
    res.json([]);
  }
});
app.get("/fix-missing-images", async (req, res) => {
  const places = await Place.find({
    $or: [{ image: null }, { image: "" }, { image: { $exists: false } }]
  });

  console.log("🖼️ Places with missing images:", places.length);
  let fixed = 0;

  for (let place of places) {
    try {
      let imageUrl = null;

      try {
        const wikiRes = await axios.get(
          "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(place.name),
          { headers: { "User-Agent": "KeralaTourismGuideApp" } }
        );
        if (wikiRes.data?.originalimage?.source) {
          imageUrl = wikiRes.data.originalimage.source;
        } else if (wikiRes.data?.thumbnail?.source) {
          imageUrl = wikiRes.data.thumbnail.source;
        }
      } catch {}

      if (!imageUrl) {
        try {
          const commonsRes = await axios.get("https://en.wikipedia.org/w/api.php", {
            params: {
              action: "query",
              titles: place.name + " Kerala",
              prop: "pageimages",
              pithumbsize: 800,
              format: "json",
              origin: "*"
            },
            headers: { "User-Agent": "KeralaTourismGuideApp" }
          });
          const pages = commonsRes.data.query.pages;
          const page = Object.values(pages)[0];
          if (page?.thumbnail?.source) imageUrl = page.thumbnail.source;
        } catch {}
      }

      if (!imageUrl) {
        imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Kerala_backwaters.jpg/800px-Kerala_backwaters.jpg";
      }

      await Place.updateOne({ _id: place._id }, { $set: { image: imageUrl } });
      console.log("🖼️ Fixed:", place.name, "→", imageUrl);
      fixed++;

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log("❌ Failed:", place.name, err.message);
    }
  }

  res.send(`✅ Fixed images for ${fixed} out of ${places.length} places.`);
});
 app.get("/fix-all-districts", async (req, res) => {
  // Get ALL places in DB regardless of district status
  const places = await Place.find({});
  console.log("🔧 Total places in DB:", places.length);

  let fixed = 0;
  for (let place of places) {
    try {
      const needsSlug = !place.slug || place.slug.trim() === "";
      const needsDistrict = !place.district || 
                            place.district === "Unknown" || 
                            place.district === "unknown" ||
                            place.district.trim() === "";

      if (!needsSlug && !needsDistrict) {
        console.log("⏭️ Skipping (already ok):", place.name, "→", place.district);
        continue;
      }

      const correctSlug = place.slug && place.slug.trim() !== "" 
        ? place.slug 
        : place.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const correctDistrict = needsDistrict 
        ? await detectDistrict(place.name)
        : place.district;

      await Place.updateOne(
        { _id: place._id },
        { $set: { district: correctDistrict, slug: correctSlug } }
      );

      console.log("✅ Fixed:", place.name, "| slug:", correctSlug, "| district:", correctDistrict);
      fixed++;

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log("❌ Failed:", place.name, err.message);
    }
  }

  res.send(`✅ Fixed ${fixed} out of ${places.length} places. Check terminal for details.`);
});
// DEBUG ROUTE (remove after fixing)
app.get("/api/debug-search", async (req, res) => {
  const query = req.query.q;
  const slug = query.toLowerCase().trim().replace(/\s+/g, "-");

  const byName = await Place.findOne({ name: new RegExp(query, "i") });
  const bySlug = await Place.findOne({ slug: slug });
  const allPlacesInDB = await Place.find({}, { name: 1, slug: 1 });

  res.json({ query, slug, byName, bySlug, allPlacesInDB });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running at http://localhost:3000");
});