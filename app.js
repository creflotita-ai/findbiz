const API_URL="https://findbiz-api.creflotita.workers.dev";
const $=id=>document.getElementById(id);
const searchBtn=$("searchBtn"),locationInput=$("location"),industrySelect=$("industry"),resultsEl=$("results"),statusEl=$("status"),summaryEl=$("resultSummary"),countEl=$("countBadge");

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function websiteOf(p){return p.website||p.extratags?.website||p.extratags?.["contact:website"]||""}
function phoneOf(p){return p.phone||p.extratags?.phone||p.extratags?.["contact:phone"]||""}
function addressOf(p){const a=p.address||{};return [p.display_name,[a.house_number,a.road].filter(Boolean).join(" "),a.suburb,a.city,a.town,a.postcode,a.country].filter(Boolean).join(", ")].find(Boolean)||"Address unavailable"}
function opportunity(p){const hasSite=!!websiteOf(p), hasPhone=!!phoneOf(p); if(!hasSite)return {label:"Potential web lead",cls:"hot"}; if(!hasPhone)return {label:"Worth checking",cls:""}; return {label:"Website listed",cls:"good"}}

function showStatus(msg){statusEl.hidden=false;statusEl.textContent=msg}
function render(data){
  resultsEl.innerHTML="";
  const count=Number(data.count||data.results?.length||0);
  countEl.hidden=false; countEl.textContent=`${count} found`;
  summaryEl.textContent=`Live OpenStreetMap records for ${data.location||locationInput.value}.`;
  if(!count){resultsEl.innerHTML='<div class="empty"><strong>No matching businesses found</strong><span>Try another location or industry.</span></div>';return}
  (data.results||[]).forEach(p=>{
    const site=websiteOf(p), phone=phoneOf(p), opp=opportunity(p);
    const map=(p.lat&&p.lon)?`https://www.openstreetmap.org/?mlat=${encodeURIComponent(p.lat)}&mlon=${encodeURIComponent(p.lon)}#map=18/${encodeURIComponent(p.lat)}/${encodeURIComponent(p.lon)}`:"";
    const card=document.createElement("article"); card.className="result-card";
    card.innerHTML=`<div><h3>${esc(p.name||"Unnamed business")}</h3><div class="sub">${esc(addressOf(p))}</div><div class="tags"><span class="tag">${esc(data.industry||"business")}</span><span class="tag ${opp.cls}">${esc(opp.label)}</span>${site?'<span class="tag good">Website listed</span>':'<span class="tag hot">No website listed</span>'}</div>${phone?`<div class="sub">Phone: ${esc(phone)}</div>`:""}</div><div class="actions">${site&&/^https?:\/\//i.test(site)?`<a href="${esc(site)}" target="_blank" rel="noopener">Website</a>`:""}${map?`<a href="${map}" target="_blank" rel="noopener">View map</a>`:""}</div>`;
    resultsEl.appendChild(card);
  });
}

async function searchBusinesses(){
  const location=locationInput.value.trim();
  const industry=industrySelect.value;
  if(!location){showStatus("Please enter a location first.");locationInput.focus();return}
  searchBtn.disabled=true; searchBtn.textContent="Searching…"; resultsEl.innerHTML="";
  showStatus(`Searching ${location} for ${industry} businesses…`);
  try{
    const r=await fetch(`${API_URL}/search?${new URLSearchParams({industry,location})}`);
    if(!r.ok)throw new Error(`Search failed (${r.status})`);
    const data=await r.json();
    if(!data.ok)throw new Error(data.error||"Search failed");
    showStatus(`Found ${data.count||0} live result${data.count===1?"":"s"} in ${data.location||location}.`);
    render(data);
  }catch(err){
    console.error(err); showStatus("The live search is temporarily unavailable. Please try again.");
    resultsEl.innerHTML='<div class="empty"><strong>Search unavailable</strong><span>Please try again in a moment.</span></div>';
  }finally{searchBtn.disabled=false;searchBtn.textContent="Find businesses"}
}
searchBtn.addEventListener("click",searchBusinesses);
locationInput.addEventListener("keydown",e=>{if(e.key==="Enter")searchBusinesses()});

const modal=$("modal");
document.querySelectorAll("[data-modal]").forEach(b=>b.addEventListener("click",()=>{
  modal.hidden=false;
  $("modalEyebrow").textContent=b.dataset.modal==="login"?"WELCOME BACK":"GET STARTED";
  $("modalTitle").textContent=b.dataset.modal==="login"?"Log in to FindBiz":"Create your FindBiz account";
}));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>modal.hidden=true));
