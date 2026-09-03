const WORKER_URL = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";

const industries = {
  plumber: "plumber",
  restaurant: "restaurant",
  electrician: "electrician",
  dentist: "dentist",
  barber: "barber"
};

const searchBtn = document.getElementById("searchBtn");
const locationInput = document.getElementById("location");
const industrySelect = document.getElementById("industry");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const resultNoteEl = document.getElementById("resultNote");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function cleanWebsite(url) {
  if (!url) return "";
  let value = String(url).trim();
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  return value;
}

function resultName(item) {
  return item.name || item.display_name?.split(",")[0] || "Unnamed business";
}

function addressText(item) {
  const a = item.address || {};
  return [
    a.house_number,
    a.road,
    a.suburb,
    a.city || a.town || a.village,
    a.postcode
  ].filter(Boolean).join(", ") || item.display_name || "Address not available";
}

function websiteFrom(item) {
  const e = item.extratags || {};
  return e.website || e["contact:website"] || e["contact:web"] || "";
}

function mapUrl(item) {
  return `https://www.openstreetmap.org/${encodeURIComponent(item.osm_type || "node")}/${encodeURIComponent(item.osm_id)}`;
}

function score(item) {
  // This is a lead-priority score, NOT a claim that the business has no website.
  const website = websiteFrom(item);
  let s = website ? 25 : 80;
  if (item.address?.postcode) s += 5;
  if (item.address?.road) s += 5;
  return Math.min(99, s);
}

function card(item) {
  const website = cleanWebsite(websiteFrom(item));
  const noWebsiteListed = !website;
  const scoreValue = score(item);

  return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(resultName(item))}</h3>
          <p class="address">${escapeHtml(addressText(item))}</p>
        </div>
        <span class="badge ${noWebsiteListed ? "warn" : "good"}">
          ${noWebsiteListed ? "No website listed" : "Website listed"}
        </span>
      </div>
      <div class="meta">
        <span class="pill">Lead score: ${scoreValue}/100</span>
        <span class="pill">${escapeHtml(item.type || item.category || "business")}</span>
      </div>
      <div class="actions">
        ${website ? `<a class="primary-link" href="${escapeHtml(website)}" target="_blank" rel="noopener">Visit website</a>` : ""}
        <a href="${mapUrl(item)}" target="_blank" rel="noopener">View source</a>
      </div>
    </article>
  `;
}

async function searchBusinesses() {
  const location = locationInput.value.trim();
  const industry = industries[industrySelect.value];

  if (!location) {
    statusEl.textContent = "Please enter a location.";
    statusEl.className = "status error";
    return;
  }

  if (!WORKER_URL || WORKER_URL.includes("PASTE_YOUR")) {
    statusEl.textContent = "The real-search connection is not configured yet. We need to connect the free Cloudflare Worker first.";
    statusEl.className = "status error";
    resultsEl.innerHTML = `<div class="empty"><strong>Almost there.</strong><br>The website is ready; the next step is connecting its free search gateway.</div>`;
    return;
  }

  searchBtn.disabled = true;
  statusEl.textContent = "Searching live business records…";
  statusEl.className = "status";
  countEl.textContent = "";
  resultsEl.innerHTML = "";

  try {
    const url = `${WORKER_URL.replace(/\/$/, "")}/search?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Search failed.");
    const items = Array.isArray(data.results) ? data.results : [];

    statusEl.textContent = items.length
      ? "Search complete. Website status is based only on what is listed in OpenStreetMap."
      : "No matching records were returned. Try a larger area or another industry.";
    resultNoteEl.textContent = `Live search for ${industrySelect.options[industrySelect.selectedIndex].text} in ${location}.`;
    countEl.textContent = `${items.length} found`;
    resultsEl.innerHTML = items.length
      ? items.map(card).join("")
      : `<div class="empty">No matching records found for this search.</div>`;
  } catch (error) {
    statusEl.textContent = error.message || "Something went wrong.";
    statusEl.className = "status error";
    resultsEl.innerHTML = `<div class="empty">We could not complete the live search. Please try again in a moment.</div>`;
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", searchBusinesses);
locationInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchBusinesses();
});
