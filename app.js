const demoLeads = [
  {name:"ABC Restaurant", type:"Italian Restaurant", reviews:187, rating:"4.7", status:"No Website", score:96},
  {name:"Spice Garden", type:"Indian Restaurant", reviews:92, rating:"4.6", status:"Facebook Only", score:91},
  {name:"Joe's Kitchen", type:"Cafe & Restaurant", reviews:64, rating:"4.3", status:"Poor Website", score:82},
  {name:"Golden Wok", type:"Chinese Restaurant", reviews:38, rating:"4.2", status:"No Website", score:78}
];

function searchLeads(){
  const location = document.getElementById('location').value || 'Selected area';
  const type = document.getElementById('type').value;
  const min = Number(document.getElementById('reviews').value || 0);
  const leads = demoLeads.filter(x => x.reviews >= min);
  const results = document.getElementById('results');
  results.innerHTML = `
    <div style="margin-bottom:12px;color:#697286;font-size:13px">
      Demo results for <b>${escapeHtml(type)}</b> in <b>${escapeHtml(location)}</b> with ${min}+ reviews.
    </div>
    ${leads.map(x => `
      <div class="result">
        <div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.type)}</small></div>
        <div>⭐ ${x.rating}<small>${x.reviews} reviews</small></div>
        <div><span class="badge ${x.status==='No Website'?'red':''}">${escapeHtml(x.status)}</span></div>
        <div><span class="score-num">${x.score}</span><small>/100 opportunity</small></div>
      </div>`).join('')}
  `;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
searchLeads();
