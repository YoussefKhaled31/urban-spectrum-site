(function(){
const API_URL = 'https://urban-spectrum-backend-production.up.railway.app';

const PROPERTIES = [
  {
    id:1, type:'residential', title:'Two Bedroom Apartment', address:'Balham High Road, Balham, SW12', area:'balham',
    price:1950, beds:2, baths:1, reception:1,
    features:['Furnished','Garden Access','Gas Central Heating','Double Glazing'],
    status:'available', isNew:true,
    image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format',
    description:'A bright and spacious two bedroom apartment situated moments from Balham tube station. The property benefits from a modern fitted kitchen, contemporary bathroom and private garden access.',lat:51.4432,lng:-0.1522
  },
  {
    id:2, type:'residential', title:'One Bedroom Garden Flat', address:'Nightingale Lane, Clapham, SW12', area:'clapham',
    price:1650, beds:1, baths:1, reception:1,
    features:['Part Furnished','Private Garden','Bills Negotiable'],
    status:'available', isNew:false,
    image:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    description:'Charming garden flat on a quiet residential street in sought-after Clapham. Features a private rear garden, modern kitchen and spacious double bedroom.',lat:51.4571,lng:-0.1652
  },
  {
    id:3, type:'residential', title:'Three Bedroom Family Home', address:'Tooting Bec Road, Tooting, SW17', area:'tooting',
    price:2800, beds:3, baths:2, reception:2,
    features:['Unfurnished','Garage','EPC Rating B','Garden'],
    status:'available', isNew:true,
    image:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    description:'Substantial three bedroom Victorian terraced house offering generous living space across three floors. Includes a garage, large rear garden and has been fully refurbished to a high standard.',lat:51.4309,lng:-0.1652
  },
  {
    id:4, type:'residential', title:'Studio Apartment', address:'Streatham Hill, Streatham, SW2', area:'streatham',
    price:1150, beds:'studio', baths:1, reception:0,
    features:['Furnished','All Bills Included','Gym Access'],
    status:'available', isNew:false,
    image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    description:'Modern studio apartment in a well-maintained purpose-built block. All utility bills are included in the rent. Ideal for a single professional. Excellent transport links to central London.',lat:51.4419,lng:-0.1269
  },
  {
    id:5, type:'commercial', title:'Ground Floor Retail Unit', address:'Balham High Road, Balham, SW12', area:'balham',
    price:3200, beds:null, baths:null, reception:null,
    features:['A1/A2 Use Class','Prominent Position','Storage Room','WC Facilities'],
    status:'available', isNew:false,
    image:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    description:'Prime ground floor retail unit located on busy Balham High Road with excellent footfall. Comprising approximately 650 sq ft of open plan retail space with storage and WC to the rear.',lat:51.4432,lng:-0.1522
  },
  {
    id:6, type:'residential', title:'Four Bedroom Townhouse', address:'Abbeville Road, Clapham, SW4', area:'clapham',
    price:3800, beds:4, baths:2, reception:2,
    features:['Unfurnished','Roof Terrace','Off-Street Parking','EPC Rating C'],
    status:'available', isNew:true,
    image:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    description:'Exceptional four bedroom townhouse on one of Clapham\'s most desirable roads. Features a stunning roof terrace with views across South London, off-street parking and beautifully appointed throughout.',lat:51.4600,lng:-0.1480
  },
  {
    id:7, type:'commercial', title:'First Floor Office Suite', address:'Tooting Market, Tooting, SW17', area:'tooting',
    price:1800, beds:null, baths:null, reception:null,
    features:['B1 Use Class','Fibre Broadband Ready','Air Conditioning','Shared Reception'],
    status:'available', isNew:false,
    image:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
    description:'Modern first floor office suite within a well-managed commercial building. Approximately 400 sq ft of bright open plan workspace with access to shared reception and meeting room facilities.',lat:51.4276,lng:-0.1681
  },
  {
    id:8, type:'residential', title:'Two Bedroom Maisonette', address:'Cavendish Road, Streatham, SW12', area:'streatham',
    price:2100, beds:2, baths:1, reception:1,
    features:['Part Furnished','Private Entrance','Cellar Storage','Period Features'],
    status:'available', isNew:false,
    image:'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    description:'Charming two bedroom maisonette set within a period Victorian conversion. Retains many original features including high ceilings and sash windows. Benefits from a private entrance and cellar storage.',lat:51.4480,lng:-0.1350
  }
];

let currentProperty = null;

function formatPrice(price, type) {
  if(type === 'commercial') return `£${price.toLocaleString('en-GB')} pcm`;
  return `£${price.toLocaleString('en-GB')} pcm`;
}

function bedsLabel(beds, type) {
  if(type === 'commercial') return null;
  if(beds === 'studio') return 'Studio';
  return `${beds} Bed${beds > 1 ? 's' : ''}`;
}

function renderCard(p) {
  const bedsText = bedsLabel(p.beds, p.type);
  const specs = p.type === 'residential' ? `
    <div class="prop-specs">
      ${bedsText ? `<div class="prop-spec"><svg viewBox="0 0 24 24"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg><span><strong>${bedsText}</strong></span></div>` : ''}
      <div class="prop-spec"><svg viewBox="0 0 24 24"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M10 5 8 7"/><path d="M2 12h15"/><path d="M22 6v4a2 2 0 0 1-2 2h-3"/></svg><span><strong>${p.baths} Bath</strong></span></div>
      ${p.reception ? `<div class="prop-spec"><svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span><strong>${p.reception} Reception</strong></span></div>` : ''}
    </div>` : `
    <div class="prop-specs">
      <div class="prop-spec"><svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><span><strong>Commercial</strong></span></div>
      <div class="prop-spec"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span><strong>${p.features[0]}</strong></span></div>
    </div>`;

  return `
    <div class="prop-card" data-id="${p.id}" data-type="${p.type}" data-beds="${p.beds}" data-price="${p.price}" data-area="${p.area}">
      <div class="prop-media">
        <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format'">
        <div class="prop-badges">
          <span class="prop-badge type">${p.type === 'residential' ? 'Residential' : 'Commercial'}</span>
          ${p.isNew ? '<span class="prop-badge new">New</span>' : ''}
        </div>
        <div class="prop-price-tag">
          <span class="pcm">${formatPrice(p.price, p.type)}</span>
          <span class="pcm-label">Per Calendar Month</span>
        </div>
        <button class="prop-save" onclick="toggleSave(event, ${p.id})" title="Save property">
          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
      <div class="prop-body">
        <div class="prop-type-line">${p.type === 'residential' ? 'To Let — Residential' : 'To Let — Commercial'}</div>
        <h3 class="prop-title">${p.title}</h3>
        <div class="prop-address">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.address}
        </div>
        ${specs}
        <div class="prop-features">
          ${p.features.slice(0,3).map(f => `<span class="prop-feature">${f}</span>`).join('')}
        </div>
        <div class="prop-actions">
          <button class="prop-btn primary" onclick="openViewing('${p.title}', '${p.address}')">Book Viewing</button>
          <button class="prop-btn secondary" onclick="openMap(${p.id})">View on Map</button>
        </div>
      </div>
    </div>`;
}

function renderAll(properties) {
  const grid = document.getElementById('listingsGrid');
  const noResults = document.getElementById('noResults');
  const count = document.getElementById('filterCount');
  if(properties.length === 0) {
    grid.innerHTML = '';
    noResults.classList.add('show');
    count.innerHTML = '<strong>0</strong> properties found';
  } else {
    grid.innerHTML = properties.map(renderCard).join('');
    noResults.classList.remove('show');
    count.innerHTML = `<strong>${properties.length}</strong> propert${properties.length === 1 ? 'y' : 'ies'} found`;
  }
  if(window.lucide) lucide.createIcons();
}

function applyFilters() {
  const type = document.getElementById('filterType').value;
  const beds = document.getElementById('filterBeds').value;
  const price = document.getElementById('filterPrice').value;
  const area = document.getElementById('filterArea').value;
  const baths = document.getElementById('filterBaths').value;
  let filtered = PROPERTIES.filter(p => {
    if(type && p.type !== type) return false;
    if(beds) {
      if(beds === 'studio' && p.beds !== 'studio') return false;
      if(beds !== 'studio') {
        const n = parseInt(beds);
        if(beds === '4' && (p.beds === 'studio' || p.beds < 4)) return false;
        if(beds !== '4' && p.beds !== n) return false;
      }
    }
    if(baths && p.baths !== parseInt(baths)) return false;
    if(price && p.price > parseInt(price)) return false;
    if(area && p.area !== area) return false;
    return true;
  });
  renderAll(filtered);
}

function resetFilters() {
  document.getElementById('filterType').value = '';
  document.getElementById('filterBeds').value = '';
  document.getElementById('filterBaths').value = '';
  document.getElementById('filterPrice').value = '';
  document.getElementById('filterArea').value = '';
  renderAll(PROPERTIES);
}

function toggleSave(e, id) {
  e.stopPropagation();
  const btn = e.currentTarget;
  btn.classList.toggle('saved');
  showToast(btn.classList.contains('saved') ? 'Property saved' : 'Property removed');
}

function openViewing(title, address) {
  currentProperty = title;
  document.getElementById('viewingPropertyName').textContent = `Requesting a viewing for: ${title}, ${address}`;
  document.getElementById('viewingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeViewing() {
  document.getElementById('viewingModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('viewingFeedback').className = 'v-feedback';
  document.getElementById('viewingFeedback').textContent = '';
}

async function submitViewing() {
  const name = document.getElementById('vName').value.trim();
  const lastName = document.getElementById('vLastName').value.trim();
  const email = document.getElementById('vEmail').value.trim();
  const phone = document.getElementById('vPhone').value.trim();
  const date = document.getElementById('vDate').value;
  const message = document.getElementById('vMessage').value.trim();
  const feedback = document.getElementById('viewingFeedback');

  if(!name || !email) {
    feedback.textContent = 'Please fill in your name and email address.';
    feedback.className = 'v-feedback show error';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/viewings`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        propertyTitle: currentProperty,
        name: `${name} ${lastName}`.trim(),
        email,
        phone,
        preferredDate: date,
        message
      })
    });
    if(res.ok) {
      feedback.textContent = '✓ Your viewing request has been submitted. We will be in touch within 24 hours.';
      feedback.className = 'v-feedback show success';
      setTimeout(closeViewing, 3000);
      showToast('Viewing request sent!');
    } else {
      feedback.textContent = 'Something went wrong. Please call us directly on +44 (0)20 8772 9552.';
      feedback.className = 'v-feedback show error';
    }
  } catch(err) {
    feedback.textContent = 'Unable to send request. Please call us directly on +44 (0)20 8772 9552.';
    feedback.className = 'v-feedback show error';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

let mapInstance = null;
let mapMarker = null;

function openMap(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if(!p) return;
  document.getElementById('mapPropertyTitle').textContent = p.title;
  document.getElementById('mapPropertyAddress').textContent = p.address;
  document.getElementById('mapDirectionsLink').href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  document.getElementById('mapModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if(!mapInstance) {
      mapInstance = L.map('propertyMap', {zoomControl:true, scrollWheelZoom:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);
    }
    mapInstance.setView([p.lat, p.lng], 15);
    if(mapMarker) mapMarker.remove();
    const icon = L.divIcon({
      html: `<div style="background:var(--navy);color:#fff;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;white-space:nowrap;box-shadow:0 8px 24px rgba(14,30,46,.25);">£${p.price.toLocaleString('en-GB')} pcm</div>`,
      className: '',
      iconAnchor: [40, 40]
    });
    mapMarker = L.marker([p.lat, p.lng], {icon}).addTo(mapInstance);
    mapInstance.invalidateSize();
  }, 100);
}

function closeMap() {
  document.getElementById('mapModal').classList.remove('open');
  document.body.style.overflow = '';
}


  window.applyFilters = applyFilters;
  window.resetFilters = resetFilters;
  window.toggleSave = toggleSave;
  window.openViewing = openViewing;
  window.closeViewing = closeViewing;
  window.submitViewing = submitViewing;
  window.openMap = openMap;
  window.closeMap = closeMap;
  window.openAuthFromListings = openAuthFromListings;

  let listingsBound = false;

  function bindListingsNav() {
    document.querySelectorAll('a[href^="index.html#"]').forEach(link => {
      if (link.dataset.bound) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href') || '';
        const sectionId = href.split('#')[1];
        if (sectionId) window.UrbanBarba.goToSection(sectionId);
      });
      link.dataset.bound = '1';
    });
  }

  function bindListingsAuthLinks() {
    document.querySelectorAll('[data-open-home-auth]').forEach(button => {
      if (button.dataset.bound) return;
      button.addEventListener('click', (e) => {
        e.preventDefault();
        window.UrbanBarba.openAuthOnHome();
      });
      button.dataset.bound = '1';
    });
  }

  window.initListingsPage = function initListingsPage() {
    const root = document.querySelector('[data-barba-namespace="listings"]');
    if (!root) return;

    renderAll(PROPERTIES);
    bindListingsNav();
    bindListingsAuthLinks();

    if (!listingsBound) {
      document.addEventListener('keydown', e => { if(e.key === 'Escape'){ closeViewing(); closeMap(); } });
      window.addEventListener('scroll', () => {
        const bttBtn = document.getElementById('btt');
        if (bttBtn) bttBtn.classList.toggle('show', window.scrollY > 400);
      });
      listingsBound = true;
    }
  };

  function openAuthFromListings() {
    window.UrbanBarba.openAuthOnHome();
  }
})();
