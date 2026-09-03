const API_BASE = "https://findbiz-api.creflotita.workers.dev";

const $ = (id) => document.getElementById(id);
const searchBtn = $("searchBtn");
const locationInput = $("location");
const industrySelect = $("industry");
const results = $("results");
const statusBox = $("status");
const summary = $("resultSummary");
const countBadge = $("countBadge");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function websiteFrom(item) {
  return item.website || item.url || item["contact:website"] || item["contact:website:url"] || "";
}

function addressFrom(item) {
  if (item.display_name) return item.display_name;
  const a = item.address || {};
  return [a.house_number, a.road, a.suburb, a.city || a.town || a.village, a.postcode]
    .filter(Boolean).join(", ");
}

function renderResults(data) {
  const items = Array.isArray(data.results) ? data.results : [];
  countBadge.hidden = false;
  countBadge.textContent = `${items.length} found`;

  if (!items.length) {
    summary.textContent = "No matching records were returned.";
    results.innerHTML = `<div class="empty"><strong>No businesses found</strong><span>Try another industry or a broader location.</span></div>`;
    return;
  }

  summary.textContent = `Live OpenStreetMap records for ${data.location || locationInput.value}.`;
  results.innerHTML = items.map((item, index) => {
    const website = websiteFrom(item);
    const address = addressFrom(item);
    const websiteLabel = website ? "Website listed" : "No website listed";
    const opportunity = website ? "" : `<span class="badge opportunity">Potential web lead</span>`;
    const mapUrl = (item.lat && item.lon)
      ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(item.lat)}&mlon=${encodeURIComponent(item.lon)}#map=18/${encodeURIComponent(item.lat)}/${encodeURIComponent(item.lon)}`
      : "";

    return `<article class="card">
      <div class="card-main">
        <div class="name">${esc(item.name || item.display_name || `Business ${index + 1}`)}</div>
        <div class="address">${esc(address || "Address not listed")}</div>
        <div class="badges">
          <span class="badge">${esc(data.industry || industrySelect.value)}</span>
          <span class="badge">${websiteLabel}</span>
          ${opportunity}
        </div>
      </div>
      <div class="card-actions">
        ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener">View map</a>` : ""}
        ${website ? `<a href="${esc(website)}" target="_blank" rel="noopener">Website</a>` : ""}
      </div>
    </article>`;
  }).join("");
}

async function searchBusinesses() {
  const location = locationInput.value.trim();
  const industry = industrySelect.value;

  if (!location) {
    statusBox.hidden = false;
    statusBox.className = "status error";
    statusBox.textContent = "Please enter a location.";
    return;
  }

  searchBtn.disabled = true;
  searchBtn.textContent = "Searching…";
  statusBox.hidden = false;
  statusBox.className = "status";
  statusBox.textContent = "Searching live business records…";
  results.innerHTML = `<div class="empty"><strong>Searching…</strong><span>FindBiz is contacting the search gateway.</span></div>`;
  countBadge.hidden = true;

  try {
    const url = `${API_BASE}/search?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });

    if (!response.ok) {
      throw new Error(`Search gateway returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.ok !== true) {
      throw new Error(data?.error || "The search gateway did not return a valid result.");
    }

    statusBox.hidden = true;
    renderResults(data);
  } catch (error) {
    console.error(error);
    statusBox.hidden = false;
    statusBox.className = "status error";
    statusBox.textContent = "We couldn't complete the live search. Please try again in a moment.";
    results.innerHTML = `<div class="empty"><strong>Search unavailable</strong><span>Check the Cloudflare Worker and try again.</span></div>`;
    summary.textContent = "The live search could not be completed.";
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Find businesses";
  }
}

searchBtn.addEventListener("click", searchBusinesses);
locationInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchBusinesses();
});
