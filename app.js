const API_URL="https://findbiz-api.creflotita.workers.dev";let results=[],high=true;
const $=x=>document.getElementById(x);const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function score(b){return Math.min(99,55+(b.website?0:25)+(b.phone?7:0)+(b.address?5:0)+(b.name?3:0))}
function render(){let a=[...results].sort((x,y)=>high?score(y)-score(x):score(x)-score(y));$("resultsList").innerHTML=a.map((b,i)=>`<article class="lead"><div class="score">${score(b)}</div><div><h3>${esc(b.name||"Unnamed business")} ${!b.website?'<span class="tag">No website listed</span>':''}</h3><p>📍 ${esc(b.display_name||b.address||"Location unavailable")}</p><p>${b.phone?"☎ "+esc(b.phone):""} ${b.website?"🌐 "+esc(b.website):""}</p></div><div class="lead-actions"><button class="secondary" onclick="save()">♡ Save</button><button class="primary" onclick="details(${i})">View details →</button></div></article>`).join("")}
async function search(){let l=$("location").value.trim(),ind=$("industry").value;if(!l){$("status").textContent="Please enter a location.";return}$("status").textContent="Searching live business records…";try{let r=await fetch(`${API_URL}/search?location=${encodeURIComponent(l)}&industry=${encodeURIComponent(ind)}`);if(!r.ok)throw 0;let d=await r.json();results=Array.isArray(d.results)?d.results:[];$("resultTitle").textContent=`${results.length} businesses found`;$("resultSub").textContent=`${ind} in ${l}`;$("status").textContent=results.length?"Potential opportunities are shown first. Verify prospects before contacting them.":"No results returned — try a broader search.";render()}catch(e){$("status").textContent="The live search could not connect right now. Please try again."}}
function save(){alert("Save is ready as a preview. Real saved leads will arrive with accounts.")}
function details(i){let b=results[i];alert(`${b.name||"Business"}\n\n${b.display_name||""}\n${b.phone||"No phone listed"}\n${b.website||"No website listed in this record"}`)}
$("searchBtn").onclick=search;$("location").onkeydown=e=>{if(e.key==="Enter")search()};$("sortBtn").onclick=()=>{high=!high;$("sortBtn").textContent=high?"✦ High opportunity first":"↕ Lower opportunity first";render()};$("exportBtn").onclick=()=>alert(results.length?"Export is a paid-plan feature preview.":"Search first.");

const AUTH_URL=window.FINDBIZ_SUPABASE_URL;
const AUTH_KEY=window.FINDBIZ_SUPABASE_KEY;
const AUTH_READY=typeof window.supabase!=="undefined" && AUTH_URL && AUTH_KEY &&
  !AUTH_URL.includes("PASTE_YOUR") && !AUTH_KEY.includes("PASTE_YOUR");
const sb=AUTH_READY?window.supabase.createClient(AUTH_URL,AUTH_KEY):null;

function showAuthNotice(message, success=false){
  const n=$("authNotice"); n.hidden=!message; n.textContent=message||"";
  n.className="authnotice"+(success?" success":"");
}
function openAuth(mode="signup"){
  $("modal").classList.add("open");
  showAuthNotice("");
  $("signupForm").hidden=mode!=="signup";
  $("loginForm").hidden=mode!=="login";
  $("verifyPanel").hidden=true;
  $("modalTitle").textContent=mode==="login"?"Log in":"Create your free account";
  $("modalText").textContent=mode==="login"?"Log in with your verified email and password.":"Use your email address and create a password. We’ll send a verification email before you can log in.";
  if(!AUTH_READY) showAuthNotice("Account setup is not connected yet. We need to connect the free authentication project first.");
}
function closeAuth(){ $("modal").classList.remove("open"); }
function showVerify(email){
  $("signupForm").hidden=true;$("loginForm").hidden=true;$("verifyPanel").hidden=false;
  $("modalTitle").textContent="Verify your email";
  $("modalText").textContent="One last step before you can log in.";
  $("verifyEmail").textContent=email;
  $("resendBtn").dataset.email=email;
  showAuthNotice("Verification email sent.",true);
}
async function signup(e){
  e.preventDefault();
  if(!AUTH_READY){showAuthNotice("Account setup is not connected yet.");return}
  const email=$("signupEmail").value.trim(), password=$("signupPassword").value, confirm=$("signupConfirm").value;
  if(password.length<8){showAuthNotice("Please use a password with at least 8 characters.");return}
  if(password!==confirm){showAuthNotice("The two passwords do not match.");return}
  $("signupSubmit").disabled=true;$("signupSubmit").textContent="Creating account…";
  const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  $("signupSubmit").disabled=false;$("signupSubmit").textContent="Create account";
  if(error){showAuthNotice(error.message);return}
  if(data.user && !data.session){showVerify(email)}
  else {showAuthNotice("Account created. You are signed in.",true);setTimeout(closeAuth,800)}
}
async function login(e){
  e.preventDefault();
  if(!AUTH_READY){showAuthNotice("Account setup is not connected yet.");return}
  const email=$("loginEmail").value.trim(), password=$("loginPassword").value;
  $("loginSubmit").disabled=true;$("loginSubmit").textContent="Logging in…";
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  $("loginSubmit").disabled=false;$("loginSubmit").textContent="Log in";
  if(error){showAuthNotice(error.message);return}
  if(data.user && !data.user.email_confirmed_at){
    showVerify(email);
    showAuthNotice("Please verify your email before logging in.");
    return;
  }
  showAuthNotice("Welcome back.",true);setTimeout(closeAuth,500);updateAccountUI(data.user);
}
async function resend(){
  if(!AUTH_READY)return;
  const email=$("resendBtn").dataset.email;
  const {error}=await sb.auth.resend({type:"signup",email,options:{emailRedirectTo:location.origin+location.pathname}});
  showAuthNotice(error?error.message:"A new verification email was sent.",!error);
}
function updateAccountUI(user){
  const buttons=document.querySelectorAll('[data-modal]');
  if(user){
    buttons.forEach(b=>{b.removeAttribute("data-modal");b.textContent="Account";b.onclick=()=>{if(confirm("Log out of FindBiz?"))sb.auth.signOut().then(()=>location.reload())}});
  }
}
document.querySelectorAll("[data-modal]").forEach(b=>b.onclick=()=>openAuth(b.dataset.modal));
$("close").onclick=closeAuth;
$("modal").onclick=e=>{if(e.target.id==="modal")closeAuth()};
$("showLogin").onclick=()=>openAuth("login");
$("showSignup").onclick=()=>openAuth("signup");
$("backToLogin").onclick=()=>openAuth("login");
$("signupForm").addEventListener("submit",signup);
$("loginForm").addEventListener("submit",login);
$("resendBtn").onclick=resend;

if(AUTH_READY){
  sb.auth.getUser().then(({data})=>{if(data.user)updateAccountUI(data.user)});
  sb.auth.onAuthStateChange((_event,session)=>{if(session?.user)updateAccountUI(session.user)});
}
