const API_BASE = "https://findbiz-api.creflotita.workers.dev";

const $ = id => document.getElementById(id);
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
  const tags = item.extratags || {};
  return item.website || item.url || tags.website || tags["contact:website"] || tags["contact:website:url"] || "";
}

function phoneFrom(item) {
  const tags = item.extratags || {};
  return item.phone || tags.phone || tags["contact:phone"] || "";
}

function addressFrom(item) {
  const a = item.address || {};
  return [
    a.house_number,
    a.road,
    a.suburb,
    a.city || a.town || a.village,
    a.postcode,
    a.country
  ].filter(Boolean).join(", ") || item.display_name || "";
}

function cleanName(item) {
  return item.name || item.address?.amenity || item.display_name?.split(",")[0] || "Unnamed business";
}

function isGenericName(name, industry) {
  const n = name.trim().toLowerCase();
  const generic = new Set([
    "restaurant","barber","plumber","electrician","dentist","cafe","bakery",
    "gym","florist","hairdresser","mechanic","car repair"
  ]);
  return generic.has(n) || n === industry.toLowerCase();
}

function leadScore(item, industry) {
  const name = cleanName(item);
  const website = websiteFrom(item);
  const phone = phoneFrom(item);
  let score = 50;

  if (!website) score += 25;
  if (phone) score += 10;
  if (name && !isGenericName(name, industry)) score += 10;
  if (item.address && Object.keys(item.address).length >= 2) score += 5;

  return Math.min(score, 100);
}

function scoreLabel(score, hasWebsite) {
  if (hasWebsite) return "Website listed";
  if (score >= 85) return "Strong potential";
  if (score >= 70) return "Potential web lead";
  return "Worth checking";
}

function renderResults(data) {
  let items = Array.isArray(data.results) ? [...data.results] : [];
  const industry = data.industry || industrySelect.value;

  items.sort((a,b) => leadScore(b, industry) - leadScore(a, industry));

  countBadge.hidden = false;
  countBadge.textContent = `${items.length} found`;

  if (!items.length) {
    summary.textContent = "No matching records were returned.";
    results.innerHTML = `<div class="empty"><strong>No businesses found</strong><span>Try another industry or a broader location.</span></div>`;
    return;
  }

  summary.textContent = `Live records found in ${data.location || locationInput.value}. Highest-potential records are shown first.`;

  results.innerHTML = items.map((item, index) => {
    const name = cleanName(item);
    const address = addressFrom(item);
    const website = websiteFrom(item);
    const phone = phoneFrom(item);
    const score = leadScore(item, industry);
    const label = scoreLabel(score, Boolean(website));
    const noWebsite = !website;

    const mapUrl = (item.lat && item.lon)
      ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(item.lat)}&mlon=${encodeURIComponent(item.lon)}#map=18/${encodeURIComponent(item.lat)}/${encodeURIComponent(item.lon)}`
      : "";

    const phoneLink = phone
      ? `<a href="tel:${esc(phone)}">${esc(phone)}</a>`
      : `<span class="detail">No phone listed</span>`;

    const websiteInfo = website
      ? `<span class="detail">🌐 Website listed</span>`
      : `<span class="detail">🌐 No website listed</span>`;

    return `<article class="card">
      <div class="card-main">
        <div class="name">${esc(name)}</div>
        <div class="address">${esc(address || "Address not listed")}</div>
        <div class="details">
          ${phoneLink}
          ${websiteInfo}
        </div>
        <div class="badges">
          <span class="badge">#${index + 1}</span>
          <span class="badge">${esc(industry)}</span>
          <span class="badge ${noWebsite ? "opportunity" : ""}">${esc(label)}</span>
          ${score >= 85 && noWebsite ? `<span class="badge strong">High priority</span>` : ""}
          ${noWebsite ? `<span class="badge">Score ${score}/100</span>` : ""}
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
  results.innerHTML = `<div class="empty"><strong>Searching…</strong><span>FindBiz is checking the selected location.</span></div>`;
  countBadge.hidden = true;

  try {
    const endpoint = `${API_BASE}/search?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`;
    const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });

    if (!response.ok) throw new Error(`Search gateway returned ${response.status}`);

    const data = await response.json();

    if (!data || data.ok !== true) {
      throw new Error(data?.error || "Invalid search response");
    }

    statusBox.hidden = true;
    renderResults(data);
  } catch (error) {
    console.error(error);
    statusBox.hidden = false;
    statusBox.className = "status error";
    statusBox.textContent = "We couldn't complete the live search. Please try again.";
    results.innerHTML = `<div class="empty"><strong>Search unavailable</strong><span>The live search could not be completed.</span></div>`;
    summary.textContent = "Search failed.";
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Find businesses";
  }
}

searchBtn.addEventListener("click", searchBusinesses);
locationInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchBusinesses();
});
