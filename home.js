(function(){
const API_URL=(window.API_URL||'https://urban-spectrum-backend-production.up.railway.app').replace(/\/$/,'');
const GOOGLE_AUTH_URL=(window.GOOGLE_AUTH_URL||'').trim();
const AUTH_TOKEN_KEY='urbanSpectrumAuthToken';
const AUTH_SESSION_KEY='urbanSpectrumCurrentUser';
let landlordIncomeChart;
let landlordDashboardState={properties:[],selectedProperty:null};

function getAuthToken(){return localStorage.getItem(AUTH_TOKEN_KEY)||''}
function setAuthToken(token){if(token){localStorage.setItem(AUTH_TOKEN_KEY,token)}else{localStorage.removeItem(AUTH_TOKEN_KEY)}}
function getCurrentUser(){return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)||'null')}
function setCurrentUser(user){if(user){localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify(user))}else{localStorage.removeItem(AUTH_SESSION_KEY)}}
function normalizeEmail(value){return value.trim().toLowerCase()}
function formatAccountType(value){const text=String(value||'Tenant').toLowerCase();return text.charAt(0).toUpperCase()+text.slice(1)}
function getDisplayName(user){return [user.firstName,user.lastName].filter(Boolean).join(' ').trim()||user.email}
function toggleMenu(){document.getElementById('mobNav').classList.toggle('open')}
function openAuthModal(){document.getElementById('authModal').classList.add('open');document.getElementById('authModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderAuthState()}
function closeAuthModal(){document.getElementById('authModal').classList.remove('open');document.getElementById('authModal').setAttribute('aria-hidden','true');document.body.style.overflow='';clearAuthMessage()}
function clearFieldErrors(){document.querySelectorAll('.auth-field input,.auth-field select').forEach(field=>field.classList.remove('invalid'))}
function showAuthMessage(message,type='error'){const box=document.getElementById('authFeedback');box.textContent=message;box.className='auth-feedback show '+type}
function clearAuthMessage(){const box=document.getElementById('authFeedback');if(box){box.textContent='';box.className='auth-feedback'}}
function showToast(message){const toast=document.getElementById('authToast');toast.textContent=message;toast.classList.add('show');clearTimeout(window.authToastTimer);window.authToastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}
function setFieldError(input,message){if(input)input.classList.add('invalid');showAuthMessage(message,'error')}
function setSession(token,user){setAuthToken(token);setCurrentUser(user)}
function clearSession(){setAuthToken('');setCurrentUser(null)}
function isLandlord(user){return String(user?.accountType||'').toLowerCase()==='landlord'}

async function apiFetch(path,{method='GET',body,auth=false,headers={}}={}){
  const requestHeaders={...headers};
  if(body!==undefined)requestHeaders['Content-Type']='application/json';
  if(auth&&getAuthToken())requestHeaders.Authorization=`Bearer ${getAuthToken()}`;
  const response=await fetch(`${API_URL}${path}`,{
    method,
    headers:requestHeaders,
    body:body!==undefined?JSON.stringify(body):undefined
  });
  const text=await response.text();
  let data={};
  if(text){
    try{data=JSON.parse(text)}catch(error){data={message:text}}
  }
  if(!response.ok){
    throw new Error(data.message||'Something went wrong while contacting the Urban Spectrum API.');
  }
  return data;
}

function switchAuthMode(mode){
  const loginMode=mode==='login';
  document.querySelectorAll('.auth-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===mode));
  document.getElementById('loginForm').classList.toggle('active',loginMode);
  document.getElementById('registerForm').classList.toggle('active',!loginMode);
  document.getElementById('authTitle').textContent=loginMode?'Welcome back':'Create your account';
  document.querySelector('.auth-top p').textContent=loginMode?'Choose a quick sign-in method or continue with your email address.':'Register in seconds with your email, then come back any time from the profile button.';
  clearAuthMessage();
  clearFieldErrors();
}

function prefillUserFacingForms(user){
  if(!user)return;
  const contactForm=document.getElementById('contactForm');
  if(contactForm){
    const firstNameInput=contactForm.querySelector('input[name="firstName"]');
    const lastNameInput=contactForm.querySelector('input[name="lastName"]');
    const emailInput=contactForm.querySelector('input[name="email"]');
    if(firstNameInput)firstNameInput.value=user.firstName||'';
    if(lastNameInput)lastNameInput.value=user.lastName||'';
    if(emailInput)emailInput.value=user.email||'';
  }
  const viewingName=document.getElementById('viewingName');
  const viewingEmail=document.getElementById('viewingEmail');
  if(viewingName)viewingName.value=getDisplayName(user);
  if(viewingEmail)viewingEmail.value=user.email||'';
}

async function renderAuthState(){
  const user=getCurrentUser();
  const trigger=document.getElementById('accountTrigger');
  const userBar=document.getElementById('authUserBar');
  const name=document.getElementById('accountName');
  const userText=document.getElementById('authUserText');
  const dashboard=document.getElementById('landlordDashboard');
  if(user){
    trigger.classList.add('logged-in');
    trigger.setAttribute('aria-label','Open account for '+getDisplayName(user));
    name.textContent=getDisplayName(user);
    userBar.style.display='flex';
    userText.textContent=`${getDisplayName(user)} is signed in as ${formatAccountType(user.accountType)} with ${user.email}`;
    prefillUserFacingForms(user);
    if(isLandlord(user)){
      dashboard.classList.add('active');
      await loadLandlordDashboard();
    }else{
      dashboard.classList.remove('active');
      await hydrateLatestTicket();
    }
  }else{
    trigger.classList.remove('logged-in');
    trigger.setAttribute('aria-label','Open account options');
    name.textContent='Account';
    userBar.style.display='none';
    dashboard.classList.remove('active');
  }
}

function logoutUser(){
  clearSession();
  renderAuthState();
  switchAuthMode('login');
  showToast('You have been logged out.');
}

function getOAuthReturnUrl(){
  return `${window.location.origin}${window.location.pathname}`;
}

async function consumeOAuthCallback(){
  const params=new URLSearchParams(window.location.search);
  const hasOauthParams=params.has('token')||params.has('authToken')||params.has('error')||params.has('oauth');
  if(!hasOauthParams)return;
  const token=params.get('token')||params.get('authToken')||'';
  const error=params.get('error');
  const provider=(params.get('provider')||'Google').trim()||'Google';
  const userPayload=params.get('user');
  if(error){
    showToast(`${provider} sign-in failed. Please try again.`);
    history.replaceState({},document.title,getOAuthReturnUrl());
    return;
  }
  if(token){
    let user=null;
    if(userPayload){
      try{user=JSON.parse(userPayload)}catch(parseError){}
    }
    setSession(token,user);
    await renderAuthState();
    showToast(`${provider} sign-in successful.`);
    history.replaceState({},document.title,getOAuthReturnUrl());
    return;
  }
  history.replaceState({},document.title,getOAuthReturnUrl());
}

function handleSocialAuth(provider){
  if(provider==='Google'){
    if(!GOOGLE_AUTH_URL){
      showAuthMessage('Google sign-in is not configured on the backend yet. Please continue with email/password for now.','error');
      return;
    }
    const oauthUrl=new URL(GOOGLE_AUTH_URL,API_URL);
    const returnUrl=getOAuthReturnUrl();
    oauthUrl.searchParams.set('redirectUri',returnUrl);
    oauthUrl.searchParams.set('redirect',returnUrl);
    window.location.href=oauthUrl.toString();
    return;
  }
  clearAuthMessage();
  showToast(`${provider} sign-in is coming soon.`);
}

async function bootstrapSession(){
  const token=getAuthToken();
  if(!token){
    clearSession();
    renderAuthState();
    return;
  }
  try{
    const data=await apiFetch('/api/auth/me',{auth:true});
    setCurrentUser(data.user);
  }catch(error){
    clearSession();
    showToast('Your session expired. Please sign in again.');
  }
  await renderAuthState();
}

async function handleAuthSubmit(e,label){
  e.preventDefault();
  clearAuthMessage();
  clearFieldErrors();
  const form=e.target;
  const btn=form.querySelector('.auth-submit');
  const original=btn.textContent;
  const data=new FormData(form);
  const email=normalizeEmail((data.get('email')||'').toString());
  const password=(data.get('password')||'').toString();
  btn.disabled=true;
  btn.textContent=label==='Register'?'Creating Account...':'Signing In...';
  try{
    if(label==='Register'){
      const firstName=(data.get('firstName')||'').toString().trim();
      const lastName=(data.get('lastName')||'').toString().trim();
      const accountType=(data.get('accountType')||'').toString().trim();
      const confirmPassword=(data.get('confirmPassword')||'').toString();
      if(password.length<6){throw new Error('Use at least 6 characters for the password.')}
      if(password!==confirmPassword){throw new Error('Passwords do not match yet.')}
      const response=await apiFetch('/api/auth/register',{
        method:'POST',
        body:{firstName,lastName,email,password,accountType}
      });
      setSession(response.token,response.user);
      await renderAuthState();
      showAuthMessage('Your account is ready. You are now signed in.','success');
      showToast('Account created successfully.');
      form.reset();
      closeAuthModal();
      switchAuthMode('login');
      return;
    }
    const response=await apiFetch('/api/auth/login',{
      method:'POST',
      body:{email,password}
    });
    setSession(response.token,response.user);
    await renderAuthState();
    showAuthMessage('Welcome back. Your profile is ready.','success');
    showToast('Signed in successfully.');
    form.reset();
    closeAuthModal();
  }catch(error){
    if(label==='Register'&&String(error.message).toLowerCase().includes('passwords do not match')){
      setFieldError(form.querySelector('input[name="confirmPassword"]'),error.message);
      return;
    }
    if(String(error.message).toLowerCase().includes('password')){
      setFieldError(form.querySelector('input[name="password"]'),error.message);
      return;
    }
    if(String(error.message).toLowerCase().includes('email')||String(error.message).toLowerCase().includes('account')){
      setFieldError(form.querySelector('input[name="email"]'),error.message);
      return;
    }
    showAuthMessage(error.message,'error');
  }finally{
    btn.disabled=false;
    btn.textContent=original;
  }
}

async function requestPasswordReset(){
  clearAuthMessage();
  const emailInput=document.querySelector('#loginForm input[name="email"]');
  const email=normalizeEmail(emailInput?.value||'');
  if(!email){
    setFieldError(emailInput,'Enter your email address first so we can send the reset link.');
    return;
  }
  try{
    const response=await apiFetch('/api/auth/forgot-password',{
      method:'POST',
      body:{email}
    });
    const preview=response.preview?` Dev preview: ${response.preview}`:'';
    showAuthMessage(response.message+preview,'success');
    showToast('Password reset request sent.');
  }catch(error){
    showAuthMessage(error.message,'error');
  }
}

async function handleSubmit(e){
  e.preventDefault();
  const form=e.target;
  const submitBtn=document.getElementById('submitBtn');
  const original=submitBtn.textContent;
  submitBtn.textContent='Sending...';
  submitBtn.disabled=true;
  try{
    const firstName=form.querySelector('input[name="firstName"]').value.trim();
    const lastName=form.querySelector('input[name="lastName"]').value.trim();
    const email=form.querySelector('input[name="email"]').value.trim();
    const phone=form.querySelector('input[name="phone"]').value.trim();
    const enquiryType=form.querySelector('select[name="enquiryType"]').value;
    const propertyAddress=form.querySelector('input[name="propertyAddress"]').value.trim();
    const message=form.querySelector('textarea[name="message"]').value.trim();
    await apiFetch('/api/contact',{
      method:'POST',
      body:{
        name:[firstName,lastName].filter(Boolean).join(' '),
        email,
        phone,
        enquiryType,
        propertyAddress,
        message
      }
    });
    submitBtn.textContent='Enquiry Sent ✓';
    submitBtn.style.background='#2d7a4f';
    showToast('Your enquiry has been sent.');
    form.reset();
    prefillUserFacingForms(getCurrentUser());
  }catch(error){
    showToast(error.message);
  }finally{
    setTimeout(()=>{
      submitBtn.textContent=original;
      submitBtn.style.background='';
      submitBtn.disabled=false;
    },2400);
  }
}
const propertyData=[
  {
    title:'Balham High Road Apartment',
    area:'Balham, SW12',
    beds:'2 Beds',
    baths:'2 Baths',
    price:'£2,450 pcm',
    epc:'B',
    image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    tour:'#'
  },
  {
    title:'Clapham Investment Townhouse',
    area:'Clapham, SW4',
    beds:'4 Beds',
    baths:'3 Baths',
    price:'£4,900 pcm',
    epc:'C',
    image:'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    tour:'#'
  },
  {
    title:'Riverside Canary Wharf Let',
    area:'Canary Wharf, E14',
    beds:'3 Beds',
    baths:'2 Baths',
    price:'£3,850 pcm',
    epc:'B',
    image:'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80',
    tour:'#'
  }
];
function renderPropertyCards(){
  const grid=document.getElementById('portfolioGrid');
  if(!grid)return;
  grid.innerHTML=propertyData.map(property=>`
    <article class="portfolio-card">
      <div class="portfolio-media">
        <img src="${property.image}" alt="${property.title}">
        <div class="portfolio-overlay">
          <div class="portfolio-price">${property.price}</div>
          <div class="epc-badge">EPC ${property.epc}</div>
        </div>
      </div>
      <div class="portfolio-body">
        <h3>${property.title}</h3>
        <p class="tool-note">${property.area} managed by Urban Spectrum with compliance-ready documentation and premium presentation.</p>
        <div class="portfolio-meta">
          <span>${property.beds}</span>
          <span>${property.baths}</span>
          <span>UK Compliant Listing</span>
        </div>
        <div class="portfolio-actions">
          <a class="portfolio-btn secondary" href="${property.tour}">Virtual Tour</a>
          <button class="portfolio-btn primary" type="button" onclick="openViewingModal('${property.title.replace(/'/g,"&#39;")}')">Book Viewing</button>
        </div>
      </div>
    </article>
  `).join('');
}
function formatCurrency(value){
  return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
}
function handleYieldCalculator(e){
  e.preventDefault();
  const monthlyRent=Number(document.getElementById('monthlyRent').value||0);
  const managementFee=Number(document.getElementById('managementFee').value||0);
  const maintenanceCost=Number(document.getElementById('maintenanceCost').value||0);
  const propertyValue=Number(document.getElementById('propertyValue').value||0);
  const grossAnnual=monthlyRent*12;
  const managementAnnual=grossAnnual*(managementFee/100);
  const totalCosts=managementAnnual+maintenanceCost;
  const netAnnual=grossAnnual-totalCosts;
  const netYield=propertyValue>0?(netAnnual/propertyValue)*100:0;
  document.getElementById('grossAnnualRent').textContent=formatCurrency(grossAnnual);
  document.getElementById('annualCosts').textContent=formatCurrency(totalCosts);
  document.getElementById('annualNetIncome').textContent=formatCurrency(netAnnual);
  document.getElementById('netYieldPill').textContent=`${netYield.toFixed(2)}%`;
  document.getElementById('yieldSummary').textContent=`Projected annual net income after a ${managementFee.toFixed(1)}% management fee and ${formatCurrency(maintenanceCost)} maintenance allowance.`;
  document.getElementById('yieldEmptyState').classList.add('hidden');
  const card=document.getElementById('yieldResultCard');
  card.classList.remove('hidden','translate-y-4','opacity-0');
}
function generateTicketId(){
  return `US-${Math.floor(1000+Math.random()*9000)}`;
}
async function hydrateLatestTicket(){
  if(!getAuthToken())return;
  try{
    const response=await apiFetch('/api/maintenance',{auth:true});
    if(response.tickets&&response.tickets.length){
      const latest=response.tickets[0];
      document.getElementById('ticketIdDisplay').textContent=latest.ticketId;
      document.getElementById('ticketStatusText').textContent=`${formatAccountType(latest.urgency)} ${latest.category.toLowerCase()} request logged on ${new Date(latest.createdAt).toLocaleDateString('en-GB')}.`;
    }
  }catch(error){}
}
async function handleMaintenanceRequest(e){
  e.preventDefault();
  if(!getAuthToken()){
    openAuthModal();
    switchAuthMode('login');
    showAuthMessage('Please sign in as a tenant before submitting a maintenance request.','error');
    return;
  }
  const form=e.target;
  const category=document.getElementById('issueCategory').value;
  const urgency=document.getElementById('issueUrgency').value;
  const description=document.getElementById('issueDescription').value.trim();
  try{
    const response=await apiFetch('/api/maintenance',{
      method:'POST',
      auth:true,
      body:{category,urgency,description}
    });
    const ticket=response.ticket?.ticketId||generateTicketId();
    document.getElementById('ticketIdDisplay').textContent=ticket;
    document.getElementById('ticketStatusText').textContent=`${urgency} ${category.toLowerCase()} request received. Reference ${ticket} is ready for your records and contractor coordination.`;
    form.reset();
    showToast(`Maintenance ticket created: ${ticket}`);
  }catch(error){
    showToast(error.message);
  }
}
function openViewingModal(propertyTitle){
  document.getElementById('viewingProperty').value=propertyTitle;
  document.getElementById('viewingMessage').value=`I would like to arrange a viewing for ${propertyTitle}.`;
  prefillUserFacingForms(getCurrentUser());
  document.getElementById('viewingModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeViewingModal(){
  document.getElementById('viewingModal').classList.remove('open');
  if(!document.getElementById('authModal').classList.contains('open'))document.body.style.overflow='';
}
function populatePropertySwitcher(properties,selectedPropertyId){
  const switcher=document.getElementById('dashboardPropertySwitcher');
  switcher.innerHTML=properties.map(property=>`<option value="${property.id}" ${property.id===selectedPropertyId?'selected':''}>${property.title}</option>`).join('');
}
function renderDocumentVault(items){
  const table=document.getElementById('documentVaultTable');
  table.innerHTML=items.map(item=>`
    <tr>
      <td class="px-4 py-4">
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-amber-50 p-2 text-amber-700"><i data-lucide="file-text" class="h-4 w-4"></i></span>
          <span class="font-['DM_Sans'] text-sm text-slate-800">${item.name}</span>
        </div>
      </td>
      <td class="px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">PDF</td>
      <td class="px-4 py-4 text-right">
        <button type="button" class="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700" onclick="downloadDashboardDocument('${item.fileUrl}','${item.name.replace(/'/g,"&#39;")}')">Download</button>
      </td>
    </tr>
  `).join('');
}
async function downloadDashboardDocument(fileUrl,documentName){
  try{
    const response=await fetch(fileUrl,{
      headers:{Authorization:`Bearer ${getAuthToken()}`}
    });
    if(!response.ok)throw new Error('Unable to download that document right now.');
    const blob=await response.blob();
    const objectUrl=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=objectUrl;
    link.download=`${documentName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }catch(error){
    showToast(error.message);
  }
}
function renderLandlordChart(incomeSeries){
  const ctx=document.getElementById('landlordIncomeChart');
  if(!ctx)return;
  const labels=incomeSeries.map(entry=>entry.monthLabel);
  if(landlordIncomeChart)landlordIncomeChart.destroy();
  landlordIncomeChart=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Monthly Rental Income',
        data:incomeSeries.map(entry=>entry.income),
        borderColor:getComputedStyle(document.documentElement).getPropertyValue('--navy').trim(),
        backgroundColor:'rgba(14,30,46,.08)',
        pointBackgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--gold').trim(),
        pointBorderColor:'#fff',
        pointRadius:5,
        pointHoverRadius:6,
        borderWidth:3,
        tension:.35,
        fill:true
      }]
    },
    options:{
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{
          ticks:{callback:value=>`£${value.toLocaleString('en-GB')}`,font:{family:'DM Sans'}},
          grid:{color:'rgba(14,30,46,.08)'}
        },
        x:{
          ticks:{font:{family:'DM Sans'}},
          grid:{display:false}
        }
      }
    }
  });
}
function updateLandlordDashboard(selectedProperty){
  if(!selectedProperty)return;
  document.getElementById('dashboardPortfolioValue').textContent=formatCurrency(selectedProperty.portfolioValue);
  document.getElementById('dashboardOccupancyRate').textContent=`${selectedProperty.occupancyRate}%`;
  document.getElementById('dashboardMaintenanceCount').textContent=`${selectedProperty.activeMaintenance} Open ${selectedProperty.activeMaintenance===1?'Ticket':'Tickets'}`;
  renderDocumentVault(selectedProperty.documents||[]);
  renderLandlordChart(selectedProperty.monthlyIncome||[]);
  if(window.lucide)lucide.createIcons();
}
async function loadLandlordDashboard(propertyId=''){
  if(!getAuthToken())return;
  try{
    const query=propertyId?`?propertyId=${encodeURIComponent(propertyId)}`:'';
    const data=await apiFetch(`/api/dashboard/landlord${query}`,{auth:true});
    landlordDashboardState=data;
    if(!data.properties.length){
      document.getElementById('dashboardPortfolioValue').textContent='£0';
      document.getElementById('dashboardOccupancyRate').textContent='0%';
      document.getElementById('dashboardMaintenanceCount').textContent='0 Open Tickets';
      document.getElementById('documentVaultTable').innerHTML='<tr><td colspan="3" class="px-4 py-5 text-sm text-stone-500">No landlord portfolio data is available yet.</td></tr>';
      if(landlordIncomeChart)landlordIncomeChart.destroy();
      return;
    }
    populatePropertySwitcher(data.properties,data.selectedProperty?.id);
    updateLandlordDashboard(data.selectedProperty);
  }catch(error){
    showToast(error.message);
  }
}
function initializeLandlordDashboard(user){
  const switcher=document.getElementById('dashboardPropertySwitcher');
  const preferred=(user&&user.dashboardProperty)||landlordDashboardState.selectedProperty?.id||switcher.value||'';
  loadLandlordDashboard(preferred);
}
async function handleViewingRequest(e){
  e.preventDefault();
  const propertyTitle=document.getElementById('viewingProperty').value;
  try{
    await apiFetch('/api/viewings',{
      method:'POST',
      body:{
        propertyTitle,
        preferredDate:document.getElementById('viewingDate').value,
        name:document.getElementById('viewingName').value.trim(),
        email:document.getElementById('viewingEmail').value.trim(),
        phone:document.getElementById('viewingPhone').value.trim(),
        message:document.getElementById('viewingMessage').value.trim()
      }
    });
    e.target.reset();
    closeViewingModal();
    showToast(`Viewing request sent for ${propertyTitle}`);
    const contactForm=document.getElementById('contactForm');
    if(contactForm){
      const enquiryType=contactForm.querySelector('select[name="enquiryType"]');
      const propertyAddressField=contactForm.querySelector('input[name="propertyAddress"]');
      const messageField=contactForm.querySelector('textarea[name="message"]');
      if(enquiryType)enquiryType.value='Tenant — looking for a property';
      if(propertyAddressField)propertyAddressField.value=propertyTitle;
      if(messageField)messageField.value=`Viewing request submitted for ${propertyTitle}. Please confirm the next available appointment options.`;
    }
  }catch(error){
    showToast(error.message);
  }
}

  window.toggleMenu = toggleMenu;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthMode = switchAuthMode;
  window.logoutUser = logoutUser;
  window.requestPasswordReset = requestPasswordReset;
  window.handleSubmit = handleSubmit;
  window.openViewingModal = openViewingModal;
  window.closeViewingModal = closeViewingModal;
  window.downloadDashboardDocument = downloadDashboardDocument;

  let homeInitPromise = null;
  let homeBound = false;

  window.initHomePage = function initHomePage() {
    const root = document.querySelector('[data-barba-namespace="home"]');
    if (!root) return;

    renderPropertyCards();

    const authModal = document.getElementById('authModal');
    const yieldForm = document.getElementById('yieldCalculatorForm');
    const maintenanceForm = document.getElementById('maintenanceForm');
    const viewingForm = document.getElementById('viewingForm');
    const accountTrigger = document.getElementById('accountTrigger');

    if (authModal && !authModal.dataset.bound) {
      authModal.addEventListener('click', e => { if(e.target.id==='authModal') closeAuthModal(); });
      authModal.dataset.bound = '1';
    }

    document.querySelectorAll('.auth-social').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', () => handleSocialAuth(btn.textContent.replace('Continue with ','').trim()));
      btn.dataset.bound = '1';
    });

    if (yieldForm && !yieldForm.dataset.bound) {
      yieldForm.addEventListener('submit', handleYieldCalculator);
      yieldForm.dataset.bound = '1';
    }

    if (maintenanceForm && !maintenanceForm.dataset.bound) {
      maintenanceForm.addEventListener('submit', handleMaintenanceRequest);
      maintenanceForm.dataset.bound = '1';
    }

    if (viewingForm && !viewingForm.dataset.bound) {
      viewingForm.addEventListener('submit', handleViewingRequest);
      viewingForm.dataset.bound = '1';
    }

    if (!homeBound) {
      document.addEventListener('keydown', e => { if(e.key==='Escape'){closeAuthModal();closeViewingModal();} });
      window.addEventListener('scroll', () => {
        const bttBtn = document.getElementById('btt');
        if (bttBtn) bttBtn.classList.toggle('show', window.scrollY > 400);
      });
      homeBound = true;
    }

    consumeOAuthCallback();
    if (!homeInitPromise) {
      homeInitPromise = bootstrapSession();
    } else {
      renderAuthState();
    }

    if(sessionStorage.getItem('urbanOpenAuthOnLoad')==='1' && accountTrigger){
      sessionStorage.removeItem('urbanOpenAuthOnLoad');
      setTimeout(() => openAuthModal(), 140);
    }
  };
})();
