require("dotenv").config();

const express = require("express");
const path = require("path");
const OpenAI = require("openai").default;
const app = express();
const PORT = 3000;
app.use(express.json());

app.use(express.static("public"));

/* ===============================
   HOME (STATIC)
================================ */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

/* ===============================
   DESTINATIONS (STATIC)
================================ */
app.get("/destinations", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "destinations.html"));
});

/* ===============================
   DATA – ALL PLACES
================================ */
const trivandrumPlaces = [
  {
    slug: "kovalam",
    name: "Kovalam Beach",
    image: "/images/kovalam.jpg",
    short: "A world-famous crescent-shaped beach.",
    description: "Kovalam Beach is one of Kerala’s most celebrated coastal destinations.",
    location: "Kovalam Beach Thiruvananthapuram",
    reach: {
      road: "16 km from city by bus or taxi.",
      train: "Thiruvananthapuram Central – 16 km.",
      flight: "Trivandrum International Airport – 15 km."
    },
    activities: [
      "Swimming",
      "Sunset viewing",
      "Ayurvedic spa",
      "Beach photography",
      "Catamaran rides"
    ],
    food: ["German Bakery","Bait Restaurant","Sea Rock Cafe"],
    stay: ["The Leela Kovalam","Uday Samudra","Taj Green Cove","Ideal Ayurvedic Resort","Hotel Neptune"],
    petrol: ["Indian Oil Kovalam","BPCL Kovalam","HP Vizhinjam"],
    atm: ["SBI ATM Kovalam","HDFC ATM Kovalam","Federal Bank ATM"],
    hospital: ["KIMS Hospital","PRS Hospital","Cosmopolitan Hospital"]
  },

  {
    slug: "zoo",
    name: "Thiruvananthapuram Zoo",
    image: "/images/zoo.jpg",
    short: "One of the oldest zoos in India.",
    description: "A major wildlife attraction located in the city centre.",
    location: "Thiruvananthapuram Zoo",
    reach: {
      road: "Well connected by city buses.",
      train: "Thiruvananthapuram Central – 2 km.",
      flight: "Airport – 6 km."
    },
    activities: [
      "Wildlife viewing",
      "Nature walks",
      "Photography",
      "Botanical garden visit"
    ],
    food: ["Indian Coffee House","Aryaas","Zam Zam"],
    stay: ["KTDC Mascot","Hilton Garden Inn","Hycinth Hotel","SP Grand Days","Classic Sarovar"],
    petrol: ["Indian Oil Palayam","BPCL PMG","HP Pettah"],
    atm: ["SBI ATM Palayam","Axis ATM","Canara ATM"],
    hospital: ["General Hospital","SP Fort Hospital","Ananthapuri Hospital"]
  },

  {
    slug: "padmanabhaswamy",
    name: "Padmanabhaswamy Temple",
    image: "/images/padmanabha.jpg",
    short: "Historic spiritual landmark.",
    description: "A famous Vishnu temple known for its architecture and heritage.",
    location: "Padmanabhaswamy Temple Trivandrum",
    reach: {
      road: "Located at East Fort.",
      train: "Thiruvananthapuram Central – 1 km.",
      flight: "Airport – 5 km."
    },
    activities: [
      "Darshan",
      "Architecture viewing",
      "Cultural exploration"
    ],
    food: ["Mothers Veg Plaza","Aryaas","Ananda Bhavan"],
    stay: ["Apollo Dimora","Hycinth Hotel","KTDC Mascot","SP Grand Days","Hotel Horizon"],
    petrol: ["BPCL East Fort","Indian Oil Chalai","HP Vazhuthacaud"],
    atm: ["SBI ATM East Fort","HDFC ATM","Federal ATM"],
    hospital: ["SP Fort Hospital","GG Hospital","PRS Hospital"]
  },

  {
    slug: "varkala",
    name: "Varkala Cliff",
    image: "/images/varkala.jpg",
    short: "India’s only seaside cliff destination.",
    description: "Varkala is famous for cliffs, beaches and yoga centres.",
    location: "Varkala Cliff Kerala",
    reach: {
      road: "45 km from Trivandrum.",
      train: "Varkala Sivagiri – 3 km.",
      flight: "Airport – 45 km."
    },
    activities: [
      "Cliff walking",
      "Beach relaxation",
      "Yoga",
      "Sunset views"
    ],
    food: ["Darjeeling Cafe","Abba Restaurant","Cliff Stories"],
    stay: ["Gateway Varkala","Clafouti Resort","Hindustan Retreat","Skylaris","Nikhil Residency"],
    petrol: ["Indian Oil Varkala","BPCL Maithanam","HP Ayiroor"],
    atm: ["SBI ATM Varkala","Axis ATM","Federal ATM"],
    hospital: ["Varkala Taluk Hospital","Sree Gokulam Hospital","NIMS Clinic"]
  },

  {
    slug: "ponmudi",
    name: "Ponmudi Hills",
    image: "/images/ponmudi.jpg",
    short: "A serene hill station.",
    description: "Ponmudi is known for misty hills and trekking.",
    location: "Ponmudi Hills Kerala",
    reach: {
      road: "60 km via Nedumangad.",
      train: "Thiruvananthapuram Central – 60 km.",
      flight: "Airport – 67 km."
    },
    activities: [
      "Trekking",
      "Nature photography",
      "Bird watching"
    ],
    food: ["Golden Peak Restaurant","Ponmudi Cafe","Tea Stall"],
    stay: ["KTDC Golden Peak","Hill View Homestay","Green Valley","Clouds Resort","Forest Lodge"],
    petrol: ["Indian Oil Nedumangad","BPCL Vithura","HP Palode"],
    atm: ["SBI ATM Nedumangad","Federal ATM","Canara ATM"],
    hospital: ["Taluk Hospital Nedumangad","Vithura CHC","Medical College TVM"]
  }

];
/* ===============================
   DATA – KOLLAM
================================ */
const kollamPlaces = [
  {
    slug: "jatayu",
    name: "Jatayu Earth's Center",
    image: "/images/jatayu.jpg",
    short: "World’s largest bird sculpture and adventure park.",
    description: "A unique hilltop destination with adventure activities.",
    location: "Jatayu Earth's Center Kollam",
    reach: {
      road: "38 km from Kollam town.",
      train: "Kollam Junction – 38 km.",
      flight: "Trivandrum International Airport – 50 km."
    },
    activities: ["Cable car","Rock climbing","Photography","Adventure park"],
    food: ["Jatayu Restaurant","Local Kerala Restaurant","Cafe Jatayu"],
    stay: ["Jatayu Resort","Hill View Homestay","Eco Lodge","Green Valley Stay","Forest Resort"],
    petrol: ["Indian Oil Chadayamangalam","BPCL Kottarakkara","HP Ayoor"],
    atm: ["SBI ATM Chadayamangalam","Federal ATM","Axis ATM"],
    hospital: ["Taluk Hospital Kottarakkara","District Hospital Kollam","Medical College TVM"]
  },

  {
    slug: "munroe",
    name: "Munroe Island",
    image: "/images/munroe.jpg",
    short: "Backwater village paradise.",
    description: "Famous for canoeing and village life.",
    location: "Munroe Island Kollam",
    reach: {
      road: "25 km from Kollam town.",
      train: "Munroe Island Station – 2 km.",
      flight: "Trivandrum Airport – 90 km."
    },
    activities: ["Canoe boating","Village walk","Bird watching"],
    food: ["Local Homestay Food","Village Restaurant","Kerala Meals Spot"],
    stay: ["Munroe Homestay","Canal View Stay","Backwater Retreat","Island Stay","Village Home"],
    petrol: ["Indian Oil Kallada","BPCL Kundara","HP Karunagappally"],
    atm: ["SBI ATM Munroe","Canara ATM","Federal ATM"],
    hospital: ["Taluk Hospital Sasthamkotta","District Hospital Kollam","KIMS Hospital"]
  },

  {
    slug: "thangassery",
    name: "Thangassery Lighthouse",
    image: "/images/thangassery.jpg",
    short: "Historic lighthouse with sea views.",
    description: "Colonial-era lighthouse near the Arabian Sea.",
    location: "Thangassery Lighthouse Kollam",
    reach: {
      road: "5 km from Kollam town.",
      train: "Kollam Junction – 5 km.",
      flight: "Trivandrum Airport – 70 km."
    },
    activities: ["Lighthouse climb","Sunset viewing","Photography"],
    food: ["Seafood Shack","Local Cafe","Kerala Restaurant"],
    stay: ["Sea View Resort","Hotel Allseason","Palm Beach Stay","Tourist Lodge","Beach Resort"],
    petrol: ["Indian Oil Kollam","BPCL Thangassery","HP Anchalummoodu"],
    atm: ["SBI ATM Thangassery","HDFC ATM","Axis ATM"],
    hospital: ["District Hospital Kollam","ESI Hospital","Bishop Benziger Hospital"]
  },

  {
    slug: "kollam-beach",
    name: "Kollam Beach",
    image: "/images/Kollam beach.jpg",
    short: "Popular urban beach.",
    description: "Ideal for evening walks and relaxation.",
    location: "Kollam Beach Kerala",
    reach: {
      road: "Located within Kollam town.",
      train: "Kollam Junction – 3 km.",
      flight: "Trivandrum Airport – 70 km."
    },
    activities: ["Beach walk","Sunset watching","Relaxation"],
    food: ["Beachside Cafe","Local Tea Shop","Seafood Restaurant"],
    stay: ["Hotel Allseason","Hotel Railview","Nani Hotel","Sea Pearl","Tourist Lodge"],
    petrol: ["Indian Oil Kollam","BPCL Beach Road","HP Petrol Pump"],
    atm: ["SBI ATM Beach Road","Axis ATM","Federal ATM"],
    hospital: ["District Hospital Kollam","ESI Hospital","Bishop Benziger Hospital"]
  },

  {
    slug: "ashtamudi",
    name: "Ashtamudi Lake",
    image: "/images/astamudi.jpg",
    short: "Gateway to Kerala backwaters.",
    description: "Famous for houseboat cruises and lake views.",
    location: "Ashtamudi Lake Kollam",
    reach: {
      road: "3 km from Kollam town.",
      train: "Kollam Junction – 4 km.",
      flight: "Trivandrum Airport – 70 km."
    },
    activities: ["Houseboat cruise","Photography","Relaxation"],
    food: ["KTDC Restaurant","Lake View Cafe","Kerala Restaurant"],
    stay: ["Raviz Ashtamudi","Lake Palace","Backwater Retreat","Ashtamudi Villas","Tourist Lodge"],
    petrol: ["Indian Oil Kollam","BPCL Anchalummoodu","HP Petrol Pump"],
    atm: ["SBI ATM Ashtamudi","Canara ATM","Axis ATM"],
    hospital: ["District Hospital Kollam","ESI Hospital","Bishop Benziger Hospital"]
  },

  {
    slug: "palaruvi",
    name: "Palaruvi Waterfalls",
    image: "/images/palaruvi.jpg",
    short: "Scenic forest waterfall.",
    description: "Popular picnic and nature spot.",
    location: "Palaruvi Waterfalls Kollam",
    reach: {
      road: "75 km from Kollam town.",
      train: "Aryankavu – 5 km.",
      flight: "Trivandrum Airport – 85 km."
    },
    activities: ["Waterfall bathing","Picnic","Nature photography"],
    food: ["Forest Canteen","Tea Stall","Local Eatery"],
    stay: ["Forest Lodge","Eco Stay","Hill View Stay","Green Valley Resort","Tourist Lodge"],
    petrol: ["Indian Oil Aryankavu","BPCL Thenmala","HP Petrol Pump"],
    atm: ["SBI ATM Aryankavu","Federal ATM","Canara ATM"],
    hospital: ["Taluk Hospital Aryankavu","Thenmala Hospital","Medical College TVM"]
  },

  {
    slug: "thenmala",
    name: "Thenmala Eco Tourism",
    image: "/images/thenmala.jpg",
    short: "India’s first eco-tourism destination.",
    description: "Known for eco trails and forest activities.",
    location: "Thenmala Eco Tourism Kollam",
    reach: {
      road: "66 km from Kollam town.",
      train: "Thenmala Station – 1 km.",
      flight: "Trivandrum Airport – 75 km."
    },
    activities: ["Eco trails","Boating","Nature walks"],
    food: ["Eco Cafe","Forest Restaurant","Local Eatery"],
    stay: ["KTDC Thenmala","Eco Hut","Forest Guest House","Green Valley Stay","Nature Resort"],
    petrol: ["Indian Oil Thenmala","BPCL Edamon","HP Petrol Pump"],
    atm: ["SBI ATM Thenmala","Canara ATM","Federal ATM"],
    hospital: ["Thenmala CHC","Taluk Hospital","Medical College TVM"]
  }
];

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

/* ===============================
   PLACE DETAIL PAGE (FULL – RESTORED)
================================ */
app.get("/place/:slug", (req, res) => {
  const p = [...trivandrumPlaces, ...kollamPlaces]
  .find(x => x.slug === req.params.slug);

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
${p.activities.map(a=>`<div class="activity-card">🎯 ${a}</div>`).join("")}
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

<script>
const reach = ${JSON.stringify(p.reach)};
const data = ${JSON.stringify({
  food:p.food, stay:p.stay, petrol:p.petrol, atm:p.atm, hospital:p.hospital
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
  listBox.innerHTML = data[t].map(i=>\`<div class="item">\${i}<button onclick="nearbyMap.src='https://www.google.com/maps?q=\${i}&output=embed'">📍</button></div>\`).join("");
  nearbyMap.src = "https://www.google.com/maps?q="+t+" near ${p.location}&output=embed";
}
showNearby('food',document.querySelector('#nearbyTabs button'));
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
   AI CHAT API
================================ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Kerala tourism AI assistant.
Answer in the same language as the user (English or Malayalam).
Be friendly, short, and helpful.
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({
      reply: "ക്ഷമിക്കണം, ഇപ്പോൾ സാങ്കേതിക പ്രശ്നം ഉണ്ട്. Please try again."
    });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("✅ Server running at http://localhost:3000");
});
