// Select all district cards
const cards = document.querySelectorAll(".district-card");

cards.forEach(card => {
  card.addEventListener("click", () => {
    const district = card.dataset.district;

    // Convert name to URL-friendly format
    const urlDistrict = district.toLowerCase().replace(/\s+/g, "");

    // Redirect to district page
    window.location.href = `/district/${urlDistrict}`;
  });
});
