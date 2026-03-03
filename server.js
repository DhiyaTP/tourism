
const User = require("./models/user");
const Trip = require("./models/trip");
const Favorite = require("./models/favorite");
const ChatHistory = require("./models/chatHistory");
const Place = require("./models/place");


require("dotenv").config();
console.log("ENV KEY:", process.env.OPENAI_API_KEY);
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


// 🔑 Combined place list for chatbot & itinerary
// ===== DISTRICTS (DECLARE ONCE) =====
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

// ===== COMBINE ALL PLACES =====
const allPlaces = [
  ...trivandrumPlaces,
  ...kollamPlaces,
  ...alappuzhaPlaces,
  ...pathanamthittaPlaces
];



// ===== GROUP PLACES BY DISTRICT =====
const normalizedPlacesByDistrict = {
  thiruvananthapuram: trivandrumPlaces,
  kollam: kollamPlaces,
  alappuzha: alappuzhaPlaces,
  pathanamthitta: pathanamthittaPlaces,

  // districts not added yet
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


// ===== DEBUG (KEEP THIS) =====





const app = express();
const PORT = 3000;
/* ===============================
   MONGODB CONNECTION
================================ */
mongoose.connect("mongodb://127.0.0.1:27017/keralaTourismDB")
.then(()=>console.log("🟢 MongoDB Connected"))
.catch(err=>console.log(err));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   SESSION LOGIN
================================ */
app.use(session({
  secret: "keralaTourismSecretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/keralaTourismDB"
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
/* DISTRICT LIST FOR TRIP PLANNER */

app.use((req,res,next)=>{
  console.log("REQUEST:", req.method, req.url);
  next();
});
/* ===============================
   HOME (STATIC)
================================ */
// LOGIN PROTECTION MIDDLEWARE
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

  // allow static files
  if (
    req.path.startsWith("/css/") ||
    req.path.startsWith("/js/") ||
    req.path.startsWith("/images/") ||
    req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/)
  ) {
    return next();
  }

  // public routes (no login required)
  const publicRoutes = [
    "/login.html",
    "/signup.html",
    "/login",
    "/signup",
    "/"
  ];

  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // everything else requires login
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
});
// HOME PAGE (after login)
app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
// BLOCK DIRECT ACCESS TO index.html
app.get("/index.html", (req, res) => {
  return res.redirect("/");
});

  
/* ===============================
   DESTINATIONS (STATIC)
================================ */
app.get("/destinations", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "destinations.html"));
});
app.get("/trip-planner", (req,res)=>{
  res.sendFile(path.join(__dirname,"views","trip-planner.html"));
});
/* ===============================
   SEND ALL DISTRICTS TO FRONTEND
================================ */
app.get("/api/districts", (req, res) => {
  res.json(Object.keys(normalizedPlacesByDistrict));
});

/* ===============================
   DATA – ALL PLACES
================================ */

    
/* ===============================
   DISTRICT PAGE
================================ */
app.get("/district/thiruvananthapuram", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Thiruvananthapuram</title>
<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px}
.card{max-width:900px;margin:25px auto;background:#fff;border-radius:18px;overflow:hidden}
.card img{width:100%;height:260px;object-fit:cover}
.card div{padding:18px}
a{text-decoration:none;color:black}
</style>
</head>
<body>

<button class="back" onclick="history.back()">⬅ Back</button>

${trivandrumPlaces.map(p=>`
<a href="/place/${p.slug}">
<div class="card">
<img src="${p.image}">
<div><h2>${p.name}</h2><p>${p.short}</p></div>
</div>
</a>`).join("")}

</body>
</html>
`);
});

app.get("/place/:slug", (req, res) => {
  const p = [
    ...trivandrumPlaces,
    ...kollamPlaces,
    ...alappuzhaPlaces,
    ...pathanamthittaPlaces
  ].find(x => x.slug === req.params.slug);

  if (!p) return res.send("Place not found");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${p.name}</title>

<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px}
.hero{width:100%;max-height:420px;object-fit:cover}
.section{background:#fff;margin:25px auto;max-width:950px;padding:22px;border-radius:18px}
iframe{width:95%;height:320px;border:none;border-radius:16px;margin:18px auto;display:block}
.tab-buttons{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.tab-buttons button{padding:12px 24px;border:none;border-radius:12px;background:#e9eef3;font-weight:600}
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
    ${p.activities.map(a => `<div class="activity-card">🎯 ${a}</div>`).join("")}
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

<!-- MAP -->
<iframe id="nearbyMap"></iframe>

<!-- ⭐ SAVE PLACE SECTION -->
<div class="section" style="text-align:center">

  <h2>⭐ Save This Place</h2>

  <button onclick="addFavorite()" style="
    background:#ff4d4d;
    color:white;
    padding:12px 24px;
    border:none;
    border-radius:10px;
    margin-right:15px;
    font-weight:bold;
    cursor:pointer;
  ">
    ❤️ Add to Favorites
  </button>

  <button onclick="saveTrip()" style="
    background:#0a6b4e;
    color:white;
    padding:12px 24px;
    border:none;
    border-radius:10px;
    font-weight:bold;
    cursor:pointer;
  ">
    💾 Save Trip
  </button>

</div>

<script>
const reach = ${JSON.stringify(p.reach)};
const data = ${JSON.stringify({
  food: p.food,
  stay: p.stay,
  petrol: p.petrol,
  atm: p.atm,
  hospital: p.hospital
})};

function showReach(t,b){
  document.querySelectorAll('#reachTabs button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  reachBox.innerText = reach[t];
}
showReach('road',document.querySelector('#reachTabs button'));

function showNearby(t,b){
  document.querySelectorAll('#nearbyTabs button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');

  listBox.innerHTML = data[t].map(i => {
    if (typeof i === "string") {
      return '<div class="item">' + i +
        '<button onclick="nearbyMap.src=\\'https://www.google.com/maps?q=' + i + '&output=embed\\'">📍</button>' +
        '</div>';
    }

    return '<div class="item">' + i.name +
      '<div>' +
      '<button onclick="nearbyMap.src=\\'https://www.google.com/maps?q=' + i.name + '&output=embed\\'">📍</button>' +
      '<a href="' + i.bookingUrl + '" target="_blank">' +
      '<button style="background:#0a6b4e;color:white;border:none;padding:6px 14px;border-radius:8px">Book</button>' +
      '</a>' +
      '</div>' +
      '</div>';
  }).join("");

  nearbyMap.src =
    "https://www.google.com/maps?q=" + t + " near ${p.location}&output=embed";
}

showNearby('food', document.querySelector('#nearbyTabs button'));

// ⭐ BUTTON FUNCTIONS
function addFavorite() {

  fetch("/api/favorite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      placeName: "${p.name}"
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });

}

function saveTrip() {
  alert("Trip Saved 💾");
}
</script>

</body>
</html>
`);
});

/* ===============================
   DISTRICT PAGE – KOLLAM (PATCH 2)
================================ */
app.get("/district/kollam", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Kollam</title>
<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px}
.card{max-width:900px;margin:25px auto;background:#fff;border-radius:18px;overflow:hidden}
.card img{width:100%;height:260px;object-fit:cover}
.card div{padding:18px}
a{text-decoration:none;color:black}
</style>
</head>
<body>

<button class="back" onclick="history.back()">⬅ Back</button>

${kollamPlaces.map(p=>`
<a href="/place/${p.slug}">
<div class="card">
  <img src="${p.image}">
  <div>
    <h2>${p.name}</h2>
    <p>${p.short}</p>
  </div>
</div>
</a>
`).join("")}

</body>
</html>
`);
});
/* ===============================
   DISTRICT PAGE – ALAPPUZHA
================================ */
app.get("/district/alappuzha", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Alappuzha</title>
<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px}
.card{max-width:900px;margin:25px auto;background:#fff;border-radius:18px;overflow:hidden}
.card img{width:100%;height:260px;object-fit:cover}
.card div{padding:18px}
a{text-decoration:none;color:black}
</style>
</head>
<body>

<button class="back" onclick="history.back()">⬅ Back</button>

${alappuzhaPlaces.map(p => `
<a href="/place/${p.slug}">
  <div class="card">
    <img src="${p.image}">
    <div>
      <h2>${p.name}</h2>
      <p>${p.short}</p>
    </div>
  </div>
</a>
`).join("")}

</body>
</html>
`);
});


/* ===============================
   DISTRICT PAGE – PATHANAMTHITTA
================================ */
app.get("/district/pathanamthitta", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Pathanamthitta</title>
<style>
body{font-family:Arial;background:#f8f4ef;margin:0}
.back{margin:20px;padding:10px 18px;background:#0a6b4e;color:#fff;border:none;border-radius:20px}
.card{max-width:900px;margin:25px auto;background:#fff;border-radius:18px;overflow:hidden}
.card img{width:100%;height:260px;object-fit:cover}
.card div{padding:18px}
a{text-decoration:none;color:black}
</style>
</head>
<body>

<button class="back" onclick="history.back()">⬅ Back</button>

${pathanamthittaPlaces.map(p=>`
<a href="/place/${p.slug}">
<div class="card">
  <img src="${p.image}">
  <div>
    <h2>${p.name}</h2>
    <p>${p.short}</p>
  </div>
</div>
</a>
`).join("")}

</body>
</html>
`);
});
/* ===============================
   SIGN UP
================================ */
app.post("/signup", async (req, res) => {
  try {

    let { name, email, password } = req.body;

    // FIX: normalize email
    email = email.trim().toLowerCase();

    // check existing user
    const existing = await User.findOne({ email });
    if(existing){
      return res.send("Email already registered");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.redirect("/login.html");

  } catch(err){
    console.log(err);
    res.send("Signup error");
  }
});

/* ===============================
   LOGIN
================================ */
app.post("/login", async (req, res) => {

  let { email, password } = req.body;

  // FIX: normalize email
  email = email.trim().toLowerCase();

  const user = await User.findOne({ email });

  if(!user){
    return res.send("User not found");
  }

  const match = await bcrypt.compare(password, user.password);

  if(!match){
    return res.send("Incorrect password");
  }

  req.session.user = user;

  res.redirect("/home");
});
/* ===============================
   CHATBOT API
================================ */
<<<<<<< HEAD
=======
app.get("/logout", (req,res)=>{
  req.session.destroy(()=>{
    res.redirect("/login.html");
  });
});
>>>>>>> aa489df4e5e754e3a30c1e293f4e12a0fe7d295a
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

    // ⭐ SAVE CHAT TO DATABASE HERE ⭐
    const chat = new ChatHistory({
      userId: req.session.user ? req.session.user._id : null,
      message: userMessage,
      reply: aiReply
    });

    await chat.save();

    // Send reply to frontend
    res.json({
      reply: aiReply
    });

  } catch (error) {
    console.log(error);
    res.json({ reply: "AI server error" });
  }
});
/* ===============================
   ITINERARY GENERATOR
================================ */
app.post("/api/itinerary", (req, res) => {

  const { district, days, interest } = req.body;

  const selectedDistrict = district.toLowerCase().trim();
  const totalDays = parseInt(days);

  const places = normalizedPlacesByDistrict[selectedDistrict] || [];

  if (places.length === 0) {
    return res.json({ plan: [] });
  }

  let index = 0;
  let plan = [];

  for (let d = 1; d <= totalDays; d++) {

    let activities = [];

    for (let i = 0; i < 3; i++) {
      if (places[index]) {
        activities.push("Visit " + places[index].name);
        index++;
      }
    }

    plan.push({
      day: d,
      activities: activities.join(", ")
    });
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
});

<<<<<<< HEAD


app.get("/add-nilambur", async (req, res) => {

  const place = new Place({
    name: "Nilambur Teak Museum",
    district: "Malappuram",
    description: "World's first teak museum showcasing the history of teak plantations.",
    location: "Nilambur",
    activities: [
      "Museum visit",
      "Teak plantation tour",
      "Photography",
      "Educational exhibits"
    ]
  });


  /* ===============================
   ADD FAVORITE PLACE
================================ */
app.post("/api/favorite", async (req, res) => {

  if (!req.session.user) {
    return res.json({ message: "Please login first" });
  }

  try {
    const { placeName } = req.body;

    const favorite = new Favorite({
      userId: req.session.user._id,
      placeName: placeName
    });

    await favorite.save();

    res.json({ message: "Added to favorites ❤️" });

  } catch (err) {
    console.log(err);
    res.json({ message: "Error saving favorite" });
  }
});

  await place.save();

  res.send("Nilambur Teak Museum added");
});

/* ===============================
   GET ALL PLACES FROM DATABASE
================================ */

app.get("/api/places", async (req, res) => {
  const places = await Place.find();
  res.json(places);
});


=======
>>>>>>> aa489df4e5e754e3a30c1e293f4e12a0fe7d295a
/* ===============================
   START SERVER
================================ */

app.get("/import-all-places", async (req, res) => {
  try {

    const allStaticPlaces = [
      ...trivandrumPlaces,
      ...kollamPlaces,
      ...alappuzhaPlaces,
      ...pathanamthittaPlaces
    ];

    for (let p of allStaticPlaces) {
      await Place.create({
        name: p.name,
        district: p.district || "Unknown",
        description: p.description,
        location: p.location,
        activities: p.activities,
        image: p.image
      });
    }

    res.send("✅ All places imported to database");

  } catch (err) {
    console.log(err);
    res.send("Import error");
  }
});



app.listen(PORT, () => {
  console.log("✅ Server running at http://localhost:3000");
});



