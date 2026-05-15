/* ---------------- LOAD DISTRICTS ---------------- */
async function loadDistricts() {
  const res = await fetch("/api/districts");
  const districts = await res.json();
  const select = document.getElementById("district");
  select.innerHTML = "";
  districts.forEach(d => {
    const option = document.createElement("option");
    option.value = d;
    option.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    select.appendChild(option);
  });
}
loadDistricts();

/* ---------------- SET DEFAULT DATE ---------------- */
window.addEventListener("load", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("startDate").value = today;
});

/* ---------------- GENERATE PLAN ---------------- */
document.getElementById("generate-btn").addEventListener("click", async () => {
  const district = document.getElementById("district").value;
  const days = document.getElementById("days").value;
  const startDate = document.getElementById("startDate").value;

  if (!startDate) {
    alert("Please select a start date");
    return;
  }

  const resultBox = document.getElementById("itinerary-result");
  resultBox.innerHTML = "<p style='text-align:center;padding:30px;color:#666;'>Generating your plan...</p>";

  try {
    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district, days })
    });

    const data = await res.json();
    resultBox.innerHTML = "";

    if (!data.plan || data.plan.length === 0) {
      resultBox.innerHTML = "<p style='text-align:center;padding:30px;color:#666;'>No places found for this district yet.</p>";
      return;
    }

    let baseDate = new Date(startDate);

    data.plan.forEach((day, index) => {
      let currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + index);
      const formattedDate = currentDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const dayCard = document.createElement("div");
      dayCard.className = "day-card";
      dayCard.innerHTML = `<h2>🗓️ Day ${day.day} – ${formattedDate}</h2>`;

      day.places.forEach(place => {
        const placeBlock = document.createElement("div");
        placeBlock.className = "place-block";

        const foodItems = (place.food || []).slice(0, 2).map(f => {
          const name = typeof f === "string" ? f : f.name;
          const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(name)}`;
          return `<li>
            ${name}
            <a href="${mapsUrl}" target="_blank" class="map-icon-link" title="View on map">📍</a>
          </li>`;
        }).join("");

        const stayItems = (place.stay || []).slice(0, 2).map(s => {
          const name = typeof s === "string" ? s : s.name;
          const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(name)}`;
          return `<li>
            ${name}
            <a href="${mapsUrl}" target="_blank" class="map-icon-link" title="View on map">📍</a>
          </li>`;
        }).join("");

        const activityItems = (place.activities || []).slice(0, 3).map(a => `<li>${a}</li>`).join("");

        placeBlock.innerHTML = `
          <h3>📍 ${place.name}</h3>
          <p>${place.short || ""}</p>

          ${activityItems ? `
          <div class="info-section">
            <strong>🎯 Activities:</strong>
            <ul>${activityItems}</ul>
          </div>` : ""}

          ${foodItems ? `
          <div class="info-section">
            <strong>🍽️ Nearby Food:</strong>
            <ul class="icon-list">${foodItems}</ul>
          </div>` : ""}

          ${stayItems ? `
          <div class="info-section">
            <strong>🏨 Stay Options:</strong>
            <ul class="icon-list">${stayItems}</ul>
          </div>` : ""}

          <div class="button-row">
            <button onclick="window.open('https://www.google.com/maps?q=${encodeURIComponent(place.location || place.name)}','_blank')">
              📍 View Map
            </button>
            <button onclick="toggleReach(this)">
              🚗 How to Reach
            </button>
          </div>
          <div class="reach-box" style="display:none;">
            ${place.reach ? `
              <p><strong>🛣️ Road:</strong> ${place.reach.road || "N/A"}</p>
              <p><strong>🚂 Train:</strong> ${place.reach.train || "N/A"}</p>
              <p><strong>✈️ Flight:</strong> ${place.reach.flight || "N/A"}</p>
            ` : "No travel information available"}
          </div>
        `;

        dayCard.appendChild(placeBlock);
      });

      resultBox.appendChild(dayCard);
    });

  } catch (err) {
    console.error("Error:", err);
    resultBox.innerHTML = "<p style='text-align:center;padding:30px;color:red;'>Something went wrong. Please try again.</p>";
  }
});

function toggleReach(btn) {
  const box = btn.parentElement.nextElementSibling;
  box.style.display = box.style.display === "none" ? "block" : "none";
}