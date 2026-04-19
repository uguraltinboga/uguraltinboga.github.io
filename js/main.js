// ════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════
const GOOGLE_API_KEY = 'AIzaSyBX7V7hh7sYh3SiZQAmV0NB7KfQ_y9IwR8';
const ANKARA = { lat:39.9334, lng:32.8597 };
const MAX_SAVED = 5;

// ════════════════════════════════════════════════════
//  MODLAR
// ════════════════════════════════════════════════════
const MODES = {
  mosque: {
    key: 'mosque',
    logo: '🕌',
    title: 'Cami Bulucu',
    sub: 'Türkiye\'nin en beğenilen camileri',
    nearbyHeading: 'Yakındaki Camiler',
    routeHeading: 'Güzergahtaki Camiler',
    emptyIco: '🕌',
    emptyText: 'Konumumu Bul butonuna tıklayarak yakındaki en beğenilen camileri keşfedin.',
    types: ['mosque'],
    markerColor: '#1565c0',
    polyColor: '#c9a84c',
    circleColor: '#52b788',
    cacheNearby: 'mosqueNearbyCache',
    cacheCorridor: 'mosqueCorridorCache',
    savedKey: 'mosqueRoutes',
    css: {
      '--pri':        '#1a472a',
      '--pri-mid':    '#2d6a4f',
      '--pri-light':  '#52b788',
      '--acc':        '#c9a84c',
      '--acc-light':  '#e9c46a',
      '--bg-panel':   '#eaf2ec',
      '--dark':       '#0d1f14',
      '--text':       '#1c2b20',
      '--text-mid':   '#4a6650',
      '--text-light': '#7a9480',
      '--border':     '#cdddd2',
    },
  },
  food: {
    key: 'food',
    logo: '🍽️',
    title: 'Yeme-İçme Bulucu',
    sub: 'Restoranlar, kafeler ve daha fazlası',
    nearbyHeading: 'Yakındaki Mekanlar',
    routeHeading: 'Güzergahtaki Mekanlar',
    emptyIco: '🍴',
    emptyText: 'Konumumu Bul butonuna tıklayarak yakındaki en beğenilen yeme-içme mekanlarını keşfedin.',
    types: ['restaurant','cafe','bar','fast_food_restaurant','bakery'],
    markerColor: '#e53935',
    polyColor: '#e67e22',
    circleColor: '#e67e22',
    cacheNearby: 'foodNearbyCache',
    cacheCorridor: 'foodCorridorCache',
    savedKey: 'foodRoutes',
    css: {
      '--pri':        '#7b2d00',
      '--pri-mid':    '#c0392b',
      '--pri-light':  '#e67e22',
      '--acc':        '#f39c12',
      '--acc-light':  '#f9ca6a',
      '--bg-panel':   '#faeee0',
      '--dark':       '#1c0a00',
      '--text':       '#2c1a0e',
      '--text-mid':   '#6b4226',
      '--text-light': '#a07850',
      '--border':     '#e8d5c0',
    },
  },
  culture: {
    key: 'culture',
    logo: '🏛️',
    title: 'Kültür & Gezi Rehberi',
    sub: 'Müzeler, anıtlar ve tarihi mekânlar',
    nearbyHeading: 'Yakındaki Mekânlar',
    routeHeading: 'Güzergahtaki Mekânlar',
    emptyIco: '🗺️',
    emptyText: 'Konumumu Bul butonuna tıklayarak yakındaki kültürel ve tarihi mekânları keşfedin.',
    types: ['tourist_attraction','museum','art_gallery','historical_landmark','monument','cultural_landmark','church','palace','castle','national_park'],
    markerColor: '#6c3483',
    polyColor: '#8e44ad',
    circleColor: '#9b59b6',
    cacheNearby: 'cultureNearbyCache',
    cacheCorridor: 'cultureCorridor Cache',
    savedKey: 'cultureRoutes',
    css: {
      '--pri':        '#2c1654',
      '--pri-mid':    '#4a2580',
      '--pri-light':  '#7b52b9',
      '--acc':        '#c9a84c',
      '--acc-light':  '#e9c46a',
      '--bg-panel':   '#ede8f5',
      '--dark':       '#16092e',
      '--text':       '#1e1030',
      '--text-mid':   '#5a3e7a',
      '--text-light': '#9070b0',
      '--border':     '#ddd0ee',
    },
  },
};

let currentMode = null;

function selectMode(modeKey) {
  const prev = currentMode;
  currentMode = MODES[modeKey];
  applyTheme(currentMode);

  // Mod butonlarını güncelle
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('modeBtn-' + modeKey);
  if (btn) btn.classList.add('active');

  // Welcome → mainContent geçişi (ilk açılışta)
  const welcome = document.getElementById('welcomePanel');
  const main    = document.getElementById('mainContent');
  if (welcome) welcome.style.display = 'none';
  if (main)    main.classList.remove('hidden');

  if (!mapLoaded) {
    initMap(ANKARA).then(() => {
      addCityMarker(ANKARA);
      loadSavedRoutesUI();
    }).catch(e => console.error(e));
  } else {
    // Mod gerçekten değiştiyse state temizle
    if (prev && prev.key !== modeKey) {
      hardClearAll();
      updateCityMarker();
    }
    loadSavedRoutesUI();
  }
}

function applyTheme(mode) {
  const root = document.documentElement;
  Object.entries(mode.css).forEach(([k, v]) => root.style.setProperty(k, v));

  document.getElementById('appLogo').textContent  = mode.logo;
  document.getElementById('appTitle').textContent = mode.title;
  document.getElementById('appSub').textContent   = mode.sub;
  document.getElementById('nearbyHeading').textContent = mode.nearbyHeading;
  document.getElementById('routeHeading').textContent  = mode.routeHeading;
  document.getElementById('nearbyEmptyIco').textContent  = mode.emptyIco;
  document.getElementById('nearbyEmptyText').textContent = mode.emptyText;
  document.title = mode.title;
}

// V4'te goBack yok — boş stub (HTML'de kullanılmıyor)
function goBack() {}

// ════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════
let map, infoWindow, geocoder;
let AdvancedMarkerElement = null;
let mapLoaded    = false;
let userLocation = null;

let nearbyMarkers  = [];
let routeMarkers   = [];
let epMarkers      = [];
let pickDotMarkers = {};

let nearbyRawAll  = [];
let nearbyFetched = { radius: 0, center: null };
let routeRawAll   = [];
let nearbyPlaces  = [];
let routePlaces   = [];

let lastRoutePath = null;
const placeCache  = new Map();
let routePolyline = null;
let pickingMode   = null;
let stopCount     = 0;
let cityCircle    = null;

// ════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════
function toast(msg, dur=3200){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),dur);
}
function fmt(n){if(!n)return'0';return n>=1000?(n/1000).toFixed(1)+'k':String(n)}
function starsHtml(r){
  if(!r)return'';
  const f=Math.round(r);
  return Array.from({length:5},(_,i)=>`<span class="star ${i<f?'':'e'}">&#9733;</span>`).join('');
}
function spin(sz=22){return`<span class="spinner" style="width:${sz}px;height:${sz}px;border-width:${sz>18?3:2}px"></span>`}
function popScore(p){return(p.rating||0)*Math.log10((p.user_ratings_total||1)+1)}

function getNQ(){return{minR:parseFloat(document.getElementById('minRating').value),minRev:parseInt(document.getElementById('minReviews').value)}}
function getRQ(){return{minR:parseFloat(document.getElementById('minRatingR').value),minRev:parseInt(document.getElementById('minReviewsR').value)}}
function passQ(p,minR,minRev){return(p.rating||0)>=minR&&(p.user_ratings_total||0)>=minRev}

// ════════════════════════════════════════════════════
//  SESSION CACHE — per mode
// ════════════════════════════════════════════════════
function getCacheKeyNearby()  { return currentMode ? currentMode.cacheNearby   : 'nearbyCache'; }
function getCacheKeyCorridor(){ return currentMode ? currentMode.cacheCorridor  : 'corridorCache'; }

function placeToJSON(p){
  return { place_id:p.place_id, name:p.name, rating:p.rating,
           user_ratings_total:p.user_ratings_total, vicinity:p.vicinity,
           _lat:p.geometry.location._lat, _lng:p.geometry.location._lng };
}
function placeFromJSON(o){
  const lat=o._lat, lng=o._lng;
  return { place_id:o.place_id, name:o.name, rating:o.rating,
           user_ratings_total:o.user_ratings_total, vicinity:o.vicinity,
           geometry:{ location:{ _lat:lat, _lng:lng, lat:()=>lat, lng:()=>lng } },
           _latLng: new google.maps.LatLng(lat,lng) };
}
function saveNearbyCache(center, radius, places){
  try{ sessionStorage.setItem(getCacheKeyNearby(), JSON.stringify({ center, radius, places:places.map(placeToJSON), ts:Date.now() })); }catch(e){}
}
function loadNearbyCache(){
  try{
    const raw=sessionStorage.getItem(getCacheKeyNearby()); if(!raw)return null;
    const c=JSON.parse(raw);
    if(Date.now()-c.ts>30*60*1000){ sessionStorage.removeItem(getCacheKeyNearby()); return null; }
    return { center:c.center, radius:c.radius, places:c.places.map(placeFromJSON) };
  }catch{ return null; }
}
function saveCorridorCache(key, places){
  try{
    const existing=loadCorridorCache()||{};
    existing[key]={ places:places.map(placeToJSON), ts:Date.now() };
    sessionStorage.setItem(getCacheKeyCorridor(), JSON.stringify(existing));
  }catch(e){}
}
function loadCorridorCache(){
  try{ const raw=sessionStorage.getItem(getCacheKeyCorridor()); return raw?JSON.parse(raw):null; }catch{ return null; }
}
function getCorridorCached(key){
  const all=loadCorridorCache(); if(!all||!all[key])return null;
  const entry=all[key];
  if(Date.now()-entry.ts>30*60*1000) return null;
  return entry.places.map(placeFromJSON);
}

function switchTab(t){
  ['nearby','route'].forEach(x=>{
    document.getElementById('tab-'+x).classList.toggle('active',x===t);
    document.getElementById('panel-'+x).classList.toggle('active',x===t);
  });
  if(t!=='route')cancelPicking();
}

// ════════════════════════════════════════════════════
//  LOAD MAPS
// ════════════════════════════════════════════════════
async function loadGoogleMaps(){
  if(window.google&&window.google.maps)return;
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=weekly&libraries=places,geometry,marker`;
    s.async=true; s.defer=true; s.onload=res;
    s.onerror=()=>rej(new Error('Google Maps yüklenemedi.'));
    document.head.appendChild(s);
  });
}
async function initMap(center){
  await loadGoogleMaps();
  AdvancedMarkerElement=google.maps.marker.AdvancedMarkerElement;
  map=new google.maps.Map(document.getElementById('map'),{
    center, zoom:12, mapId:'kesfet-rehberi-v1',
    mapTypeControl:false, streetViewControl:false, fullscreenControl:true,
  });
  infoWindow=new google.maps.InfoWindow();
  geocoder=new google.maps.Geocoder();
  map.addListener('click',e=>{
    if(!pickingMode)return;
    const lat=e.latLng.lat(), lng=e.latLng.lng();
    reverseGeocode(lat,lng,addr=>applyPick(lat,lng,addr||`${lat.toFixed(5)},${lng.toFixed(5)}`));
  });
  mapLoaded=true;
}

// ════════════════════════════════════════════════════
//  MARKERS
// ════════════════════════════════════════════════════
function makePinEl(color, scale=1){
  const el=document.createElement('div');
  el.style.cssText=`width:${26*scale}px;height:${26*scale}px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);`;
  return el;
}
function makeAdvMarker(pos, color, scale, title){
  const el=makePinEl(color,scale);
  return new AdvancedMarkerElement({position:pos,map,content:el,title:title||''});
}
function clearMarkerArr(arr){ arr.forEach(m=>{if(m)m.map=null}); arr.length=0; }
function clearAllMarkers(){
  clearMarkerArr(nearbyMarkers); clearMarkerArr(routeMarkers); clearMarkerArr(epMarkers);
  Object.values(pickDotMarkers).forEach(m=>{if(m)m.map=null}); pickDotMarkers={};
}

// ════════════════════════════════════════════════════
//  PICKING
// ════════════════════════════════════════════════════
function startPicking(target){
  if(!mapLoaded){toast('Önce haritayı yükleyin.');return}
  pickingMode=target;
  document.getElementById('map').classList.add('pick-mode');
  document.getElementById('pickHint').classList.add('active');
  document.querySelectorAll('.btn-pick').forEach(b=>b.classList.remove('active'));
  const id=target==='start'?'pickStartBtn':target==='end'?'pickEndBtn':'pickStop-'+target.split('-')[1];
  const btn=document.getElementById(id); if(btn)btn.classList.add('active');
}
function cancelPicking(){
  pickingMode=null;
  document.getElementById('map').classList.remove('pick-mode');
  document.getElementById('pickHint').classList.remove('active');
  document.querySelectorAll('.btn-pick').forEach(b=>b.classList.remove('active'));
}
function applyPick(lat,lng,label){
  const coord=`${lat.toFixed(6)},${lng.toFixed(6)}`;
  const dotColor=pickingMode==='start'?'#2d6a4f':pickingMode==='end'?'#c0392b':'#e67e22';
  if(pickingMode==='start'){
    const inp=document.getElementById('originInput');
    inp.value=label; inp.dataset.coord=coord; inp.dataset.useGPS='';
  } else if(pickingMode==='end'){
    const inp=document.getElementById('destInput');
    inp.value=label; inp.dataset.coord=coord;
  } else if(pickingMode&&pickingMode.startsWith('stop-')){
    const idx=pickingMode.split('-')[1];
    const inp=document.getElementById('stopInp-'+idx);
    if(inp){inp.value=label;inp.dataset.coord=coord;}
  }
  const modeKey=pickingMode;
  if(pickDotMarkers[modeKey]) pickDotMarkers[modeKey].map=null;
  pickDotMarkers[modeKey]=makeAdvMarker({lat,lng},dotColor,0.8,label);
  cancelPicking();
  toast('Nokta seçildi: '+label.slice(0,40));
}
function reverseGeocode(lat,lng,cb){
  if(!geocoder){cb(null);return}
  geocoder.geocode({location:{lat,lng}},(r,s)=>cb(s==='OK'&&r[0]?r[0].formatted_address:null));
}

// ════════════════════════════════════════════════════
//  STOPS
// ════════════════════════════════════════════════════
function addStop(val='',coord=''){
  stopCount++; const idx=stopCount;
  const row=document.createElement('div');
  row.className='stop-row'; row.id='stop-row-'+idx;
  row.innerHTML=`
    <div class="rpoint">
      <div class="rdot rdot-stop"></div>
      <input type="text" id="stopInp-${idx}" placeholder="Ara durak ${idx}" value="${val}" data-coord="${coord}">
      <button class="btn-pick" id="pickStop-${idx}" onclick="startPicking('stop-${idx}')" title="Haritadan seç">📌</button>
    </div>
    <button class="btn-rm" onclick="removeStop(${idx})" title="Kaldır">×</button>`;
  document.getElementById('stopsContainer').appendChild(row);
  document.getElementById('stopInp-'+idx).addEventListener('input',function(){this.dataset.coord='';});
}
function removeStop(idx){
  const r=document.getElementById('stop-row-'+idx); if(r)r.remove();
  if(pickDotMarkers['stop-'+idx])pickDotMarkers['stop-'+idx].map=null;
  delete pickDotMarkers['stop-'+idx];
}
function swapStartEnd(){
  const oi=document.getElementById('originInput'), di=document.getElementById('destInput');
  const tv=oi.value, tc=oi.dataset.coord||'';
  oi.value=di.value; oi.dataset.coord=di.dataset.coord||''; oi.dataset.useGPS='';
  di.value=tv; di.dataset.coord=tc;
  const ps=pickDotMarkers['start'], pe=pickDotMarkers['end'];
  if(ps)ps.map=null; if(pe)pe.map=null;
  delete pickDotMarkers['start']; delete pickDotMarkers['end'];
}

// ════════════════════════════════════════════════════
//  GEOCODE
// ════════════════════════════════════════════════════
function resolveLocation(inp){
  return new Promise((res,rej)=>{
    if(!inp){if(userLocation){res(userLocation);return}rej(new Error('Konum alınamadı.'));return}
    const coord=inp.dataset.coord;
    if(coord&&coord.includes(',')){ const[la,ln]=coord.split(',').map(Number); if(!isNaN(la)){res({lat:la,lng:ln});return} }
    const val=(inp.value||'').trim();
    if(!val){rej(new Error('Boş adres.'));return}
    geocoder.geocode({address:val,region:'tr'},(r,s)=>{
      if(s==='OK'&&r[0]){const l=r[0].geometry.location;res({lat:l.lat(),lng:l.lng()})}
      else rej(new Error(`"${val}" bulunamadı.`));
    });
  });
}

// ════════════════════════════════════════════════════
//  CITY MARKER
// ════════════════════════════════════════════════════
function addCityMarker(pos){
  const c=currentMode ? currentMode.circleColor : '#52b788';
  cityCircle=new google.maps.Circle({map,center:pos,radius:500,fillColor:c,fillOpacity:.12,strokeColor:c,strokeOpacity:.3,strokeWeight:1});
}
function updateCityMarker(){
  if(cityCircle) cityCircle.setMap(null);
  addCityMarker(userLocation||ANKARA);
}

// ════════════════════════════════════════════════════
//  PLACES API
// ════════════════════════════════════════════════════
async function searchNearbyREST(lat, lng, radiusM){
  const types = currentMode ? currentMode.types : ['mosque'];
  const body={
    includedTypes: types, maxResultCount:20,
    locationRestriction:{ circle:{ center:{latitude:lat,longitude:lng}, radius:Math.min(radiusM,50000) } }
  };
  const res=await fetch('https://places.googleapis.com/v1/places:searchNearby',{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'X-Goog-Api-Key':GOOGLE_API_KEY,
              'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.formattedAddress' },
    body:JSON.stringify(body),
  });
  if(!res.ok) throw new Error(await res.text());
  const data=await res.json();
  return (data.places||[]).map(p=>normPlace(p));
}
function normPlace(p){
  let lat,lng,name,rating,reviews,address,id;
  if(p.location&&p.location.latitude!==undefined){
    lat=p.location.latitude; lng=p.location.longitude;
    name=p.displayName&&p.displayName.text||p.displayName||'';
    rating=p.rating||0; reviews=p.userRatingCount||0;
    address=p.formattedAddress||''; id=p.id||p.name||'';
  } else {
    lat=p.location.lat(); lng=p.location.lng();
    name=p.displayName||''; rating=p.rating||0; reviews=p.userRatingCount||0;
    address=p.formattedAddress||''; id=p.id||'';
  }
  return { place_id:id, name, rating, user_ratings_total:reviews, vicinity:address,
           geometry:{ location:{ _lat:lat,_lng:lng,lat:()=>lat,lng:()=>lng } },
           _latLng:new google.maps.LatLng(lat,lng) };
}
async function searchNearbyNew(center, radiusM){ return searchNearbyREST(center.lat,center.lng,radiusM); }
async function searchNearbyForPoint(latLng, radiusM){ return searchNearbyREST(latLng.lat(),latLng.lng(),radiusM); }

// ════════════════════════════════════════════════════
//  NEARBY FLOW
// ════════════════════════════════════════════════════
async function startNearby(){
  const btn=document.getElementById('btnLocate');
  btn.disabled=true; btn.innerHTML=spin(13)+' Konum alınıyor...';
  try{
    if(!mapLoaded) await initMap(ANKARA);
    clearAllMarkers();
    if(routePolyline){routePolyline.setMap(null);routePolyline=null;}
    routeRawAll=[]; routePlaces=[];
    document.getElementById('routeCount').textContent='0';
    document.getElementById('routeList').innerHTML=`<div class="smsg"><div class="ico">🗺️</div><h3>Güzergah Girin</h3><p>Başlangıç ve varış noktasını girin ya da haritadan seçin.</p></div>`;

    const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:10000}));
    userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};
    map.panTo(userLocation); map.setZoom(13);
    placeUserPin(userLocation);
    updateCityMarker();

    const oi=document.getElementById('originInput');
    if(!oi.value||oi.dataset.useGPS==='1'||oi.value==='Konumunuz'){
      oi.value='Konumunuz'; oi.dataset.coord=`${userLocation.lat},${userLocation.lng}`; oi.dataset.useGPS='1';
    }
    await fetchNearby(userLocation, parseInt(document.getElementById('radiusSelect').value));
    toast('Konum alındı!');
  }catch(e){
    toast('Hata: '+(e.code===1?'Konum izni reddedildi.':(e.message||'Konum alınamadı.')));
  }finally{btn.disabled=false;btn.textContent='Konumumu Bul';}
}
async function fetchNearby(center, radius){
  showLoading('nearbyList');
  clearMarkerArr(nearbyMarkers);
  const dist=nearbyFetched.center
    ? google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(center.lat,center.lng),new google.maps.LatLng(nearbyFetched.center.lat,nearbyFetched.center.lng))
    : Infinity;
  if(dist<50&&radius<=nearbyFetched.radius&&nearbyRawAll.length){ finalizeNearby(nearbyRawAll,radius,center); return; }
  const cached=loadNearbyCache();
  if(cached){
    const cd=google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(center.lat,center.lng),new google.maps.LatLng(cached.center.lat,cached.center.lng));
    if(cd<50&&radius<=cached.radius){ nearbyRawAll=cached.places; nearbyFetched={radius:cached.radius,center:cached.center}; finalizeNearby(nearbyRawAll,radius,center); toast('Önceki sonuçlar yüklendi.'); return; }
  }
  try{
    const results=await searchNearbyNew(center,radius);
    nearbyRawAll=results; nearbyFetched={radius,center};
    saveNearbyCache(center,radius,results); finalizeNearby(results,radius,center);
  }catch(e){ showEmpty('nearbyList','Arama hatası: '+e.message); }
}
function finalizeNearby(all, radius, center){
  clearMarkerArr(nearbyMarkers);
  const {minR,minRev}=getNQ();
  const centerLL=center?new google.maps.LatLng(center.lat,center.lng):null;
  nearbyPlaces=all.filter(p=>{
    if(!passQ(p,minR,minRev))return false;
    if(centerLL&&p._latLng){
      const pLL=typeof p._latLng.lat==='function'?p._latLng:new google.maps.LatLng(p._latLng.lat,p._latLng.lng);
      return google.maps.geometry.spherical.computeDistanceBetween(centerLL,pLL)<=radius;
    }
    return true;
  }).sort((a,b)=>popScore(b)-popScore(a)).slice(0,20);
  document.getElementById('nearbyCount').textContent=nearbyPlaces.length;
  if(!nearbyPlaces.length){ showEmpty('nearbyList',`${getNQ().minR}+ yıldız ve ${fmt(getNQ().minRev)}+ yorumlu mekan bulunamadı.`); return; }
  renderList('nearbyList',nearbyPlaces,'nearby');
  nearbyPlaces.forEach((m,i)=>nearbyMarkers.push(makePlaceMarker(m,i,'nearby')));
}
function onNearbyQChange(){ if(nearbyRawAll.length) finalizeNearby(nearbyRawAll,parseInt(document.getElementById('radiusSelect').value),nearbyFetched.center); }
async function onRadiusChange(){ if(!mapLoaded||!userLocation)return; await fetchNearby(userLocation,parseInt(document.getElementById('radiusSelect').value)); }

// ════════════════════════════════════════════════════
//  ROUTES API
// ════════════════════════════════════════════════════
async function computeRoute(origin, destination, waypoints){
  const body={
    origin:{location:{latLng:{latitude:origin.lat,longitude:origin.lng}}},
    destination:{location:{latLng:{latitude:destination.lat,longitude:destination.lng}}},
    intermediates:waypoints.map(ll=>({location:{latLng:{latitude:ll.lat,longitude:ll.lng}}})),
    travelMode:'DRIVE', routingPreference:'TRAFFIC_UNAWARE',
    polylineQuality:'HIGH_QUALITY', computeAlternativeRoutes:false,
  };
  const res=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'X-Goog-Api-Key':GOOGLE_API_KEY,
              'X-Goog-FieldMask':'routes.polyline.encodedPolyline,routes.legs,routes.distanceMeters,routes.duration' },
    body:JSON.stringify(body),
  });
  if(!res.ok)throw new Error('Routes API hatası: '+res.status+' '+await res.text());
  const data=await res.json();
  if(!data.routes||!data.routes[0])throw new Error('Güzergah bulunamadı.');
  return data.routes[0];
}
function decodePolyline(encoded){
  const pts=[]; let idx=0,lat=0,lng=0;
  while(idx<encoded.length){
    let b,shift=0,result=0;
    do{b=encoded.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5}while(b>=0x20);
    lat+=(result&1)?~(result>>1):(result>>1); shift=0; result=0;
    do{b=encoded.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5}while(b>=0x20);
    lng+=(result&1)?~(result>>1):(result>>1);
    pts.push(new google.maps.LatLng(lat/1e5,lng/1e5));
  }
  return pts;
}
function drawRoutePolyline(path){
  if(routePolyline)routePolyline.setMap(null);
  const color=currentMode?currentMode.polyColor:'#c9a84c';
  routePolyline=new google.maps.Polyline({path,map,strokeColor:color,strokeWeight:5,strokeOpacity:.85});
}

// ════════════════════════════════════════════════════
//  ROUTE FLOW
// ════════════════════════════════════════════════════
async function startRoute(){
  const destInp=document.getElementById('destInput');
  if(!(destInp.value||'').trim()){toast('Varış noktası girin.');return}
  const btn=document.getElementById('btnRoute');
  btn.disabled=true; btn.innerHTML=spin(13)+' Hesaplanıyor...';
  try{
    if(!mapLoaded)await initMap(ANKARA);
    clearMarkerArr(nearbyMarkers); clearMarkerArr(routeMarkers); clearMarkerArr(epMarkers);
    if(routePolyline){routePolyline.setMap(null);routePolyline=null;}
    const originInp=document.getElementById('originInput');
    let originLL;
    if(originInp.dataset.coord&&!originInp.dataset.useGPS){
      const[la,ln]=originInp.dataset.coord.split(',').map(Number); originLL={lat:la,lng:ln};
    } else if(!originInp.value.trim()||originInp.dataset.useGPS==='1'){
      if(!userLocation){
        const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
        userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude}; placeUserPin(userLocation);
      }
      originLL=userLocation;
    } else { originLL=await resolveLocation(originInp); }
    const destLL=await resolveLocation(destInp);
    const stopLLs=[];
    for(const row of document.querySelectorAll('#stopsContainer .stop-row')){
      const inp=row.querySelector('input');
      if(!inp||!(inp.value||'').trim())continue;
      try{stopLLs.push(await resolveLocation(inp))}catch{}
    }
    const route=await computeRoute(originLL,destLL,stopLLs);
    const path=decodePolyline(route.polyline.encodedPolyline);
    lastRoutePath=path; drawRoutePolyline(path);
    const bounds=new google.maps.LatLngBounds();
    path.forEach(p=>bounds.extend(p)); map.fitBounds(bounds,{padding:80});
    epMarkers.push(makeAdvMarker(originLL,'#2d6a4f',1.1,'Başlangıç'));
    epMarkers.push(makeAdvMarker(destLL,'#c0392b',1.1,'Varış'));
    stopLLs.forEach((ll,i)=>epMarkers.push(makeAdvMarker(ll,'#e67e22',1.0,'Durak '+(i+1))));
    await searchCorridor(path,originLL,destLL);
    toast('Güzergah hazır!');
  }catch(e){ toast('Hata: '+e.message); }
  finally{ btn.disabled=false; btn.textContent='Güzergahı Göster'; }
}

// ════════════════════════════════════════════════════
//  CORRIDOR
// ════════════════════════════════════════════════════
async function searchCorridor(path, originLL, destLL){
  showLoading('routeList'); clearMarkerArr(routeMarkers);
  const corridor=parseInt(document.getElementById('corridorWidth').value);
  const cacheKey=[originLL.lat.toFixed(3),originLL.lng.toFixed(3),destLL.lat.toFixed(3),destLL.lng.toFixed(3),corridor].join('|');
  const cached=getCorridorCached(cacheKey);
  if(cached){ routeRawAll=cached; applyRouteFilter(); toast('Önceki aramadan yüklendi.'); return; }
  const searchR=Math.max(corridor,5000), stepM=searchR*1.5;
  const samplePoints=[path[0]]; let cumDist=0,nextDist=0;
  for(let i=1;i<path.length;i++){
    cumDist+=google.maps.geometry.spherical.computeDistanceBetween(path[i-1],path[i]);
    if(cumDist>=nextDist+stepM){ samplePoints.push(path[i]); nextDist=cumDist; }
  }
  samplePoints.push(path[path.length-1]);
  const seen=new Map();
  await Promise.all(samplePoints.map(async wp=>{
    try{ (await searchNearbyForPoint(wp,searchR)).forEach(r=>{ if(!seen.has(r.place_id)){seen.set(r.place_id,r);placeCache.set(r.place_id,r)} }); }catch{}
  }));
  routeRawAll=Array.from(seen.values()).filter(m=>{
    const loc=m.geometry&&m.geometry.location; if(!loc)return false;
    const lat=typeof loc.lat==='function'?loc._lat:loc.lat;
    const lng=typeof loc.lng==='function'?loc._lng:loc.lng;
    const ll=new google.maps.LatLng(lat,lng);
    return path.some(pt=>google.maps.geometry.spherical.computeDistanceBetween(pt,ll)<=corridor);
  });
  saveCorridorCache(cacheKey,routeRawAll); applyRouteFilter();
}
function applyRouteFilter(){
  clearMarkerArr(routeMarkers);
  const{minR,minRev}=getRQ();
  routePlaces=routeRawAll.filter(m=>passQ(m,minR,minRev)).sort((a,b)=>popScore(b)-popScore(a)).slice(0,40);
  document.getElementById('routeCount').textContent=routePlaces.length;
  if(!routePlaces.length){ showEmpty('routeList',`${minR}+ yıldız ve ${fmt(minRev)}+ yorumlu mekan bulunamadı.`); return; }
  renderList('routeList',routePlaces,'route');
  routePlaces.forEach((m,i)=>routeMarkers.push(makePlaceMarker(m,i,'route')));
}
function onRouteQChange(){ if(routeRawAll.length)applyRouteFilter(); }

// ════════════════════════════════════════════════════
//  CLEAR
// ════════════════════════════════════════════════════
function clearAll(){
  if(routePolyline){routePolyline.setMap(null);routePolyline=null;}
  clearAllMarkers();
  nearbyPlaces=[]; routePlaces=[]; nearbyRawAll=[]; routeRawAll=[];
  nearbyFetched={radius:0,center:null}; lastRoutePath=null;
  document.getElementById('nearbyCount').textContent='0';
  document.getElementById('routeCount').textContent='0';
  const ico = currentMode ? currentMode.emptyIco : '🕌';
  document.getElementById('nearbyList').innerHTML=`<div class="smsg"><div class="ico">${ico}</div><h3>Temizlendi</h3><p>Yeni arama yapabilirsiniz.</p></div>`;
  document.getElementById('routeList').innerHTML=`<div class="smsg"><div class="ico">🗺️</div><h3>Temizlendi</h3><p>Yeni güzergah girebilirsiniz.</p></div>`;
  document.getElementById('originInput').value=userLocation?'Konumunuz':'';
  document.getElementById('originInput').dataset.coord=userLocation?`${userLocation.lat},${userLocation.lng}`:'';
  document.getElementById('originInput').dataset.useGPS=userLocation?'1':'';
  document.getElementById('destInput').value=''; document.getElementById('destInput').dataset.coord='';
  document.getElementById('stopsContainer').innerHTML=''; stopCount=0; cancelPicking();
}
function hardClearAll(){
  clearAll();
  nearbyFetched={radius:0,center:null};
  document.getElementById('originInput').value=''; document.getElementById('originInput').dataset.coord=''; document.getElementById('originInput').dataset.useGPS='';
}

// ════════════════════════════════════════════════════
//  SAVED ROUTES
// ════════════════════════════════════════════════════
function getSavedRoutes(){ try{return JSON.parse(localStorage.getItem(currentMode.savedKey)||'[]')}catch{return[]} }
function setSavedRoutes(arr){ localStorage.setItem(currentMode.savedKey,JSON.stringify(arr)); }
function loadSavedRoutesUI(){
  const sel=document.getElementById('savedRoutesSel'), routes=getSavedRoutes();
  sel.innerHTML='<option value="">-- Kayıtlı rota seç --</option>';
  routes.forEach((r,i)=>sel.add(new Option(r.name,i)));
}
function saveRoute(){
  const origin=document.getElementById('originInput').value.trim(), dest=document.getElementById('destInput').value.trim();
  if(!dest){toast('Varış noktası olmadan rota kaydedilemez.');return}
  const routes=getSavedRoutes();
  if(routes.length>=MAX_SAVED){toast(`En fazla ${MAX_SAVED} rota kaydedilebilir.`);return}
  const stops=[];
  document.querySelectorAll('#stopsContainer .stop-row input').forEach(inp=>{ if(inp.value.trim())stops.push({value:inp.value,coord:inp.dataset.coord||''}); });
  routes.push({ name:`${routes.length+1}. Kaydedilen Rota`,
    origin:{value:origin,coord:document.getElementById('originInput').dataset.coord||'',useGPS:document.getElementById('originInput').dataset.useGPS||''},
    dest:{value:dest,coord:document.getElementById('destInput').dataset.coord||''},
    stops, corridor:document.getElementById('corridorWidth').value });
  setSavedRoutes(routes); loadSavedRoutesUI(); toast('Rota kaydedildi!');
}
function loadSavedRoute(){
  const sel=document.getElementById('savedRoutesSel'), idx=parseInt(sel.value);
  if(isNaN(idx))return;
  const r=getSavedRoutes()[idx]; if(!r)return;
  const oi=document.getElementById('originInput');
  oi.value=r.origin.value; oi.dataset.coord=r.origin.coord; oi.dataset.useGPS=r.origin.useGPS||'';
  document.getElementById('destInput').value=r.dest.value;
  document.getElementById('destInput').dataset.coord=r.dest.coord||'';
  document.getElementById('stopsContainer').innerHTML=''; stopCount=0;
  r.stops.forEach(s=>addStop(s.value,s.coord));
  document.getElementById('corridorWidth').value=r.corridor||'1000';
  toast('Rota yüklendi: '+r.name);
}
function deleteSavedRoute(){
  const sel=document.getElementById('savedRoutesSel'), idx=parseInt(sel.value);
  if(isNaN(idx)){toast('Silinecek rotayı seçin.');return}
  const routes=getSavedRoutes(); routes.splice(idx,1);
  routes.forEach((r,i)=>r.name=`${i+1}. Kaydedilen Rota`);
  setSavedRoutes(routes); loadSavedRoutesUI(); toast('Rota silindi.');
}

// ════════════════════════════════════════════════════
//  MARKER FACTORY
// ════════════════════════════════════════════════════
function getLatLng(place){
  const loc=place.geometry&&place.geometry.location; if(!loc) return {lat:0,lng:0};
  return {
    lat:loc._lat!==undefined?loc._lat:(typeof loc.lat==='function'?loc.lat():loc.lat),
    lng:loc._lng!==undefined?loc._lng:(typeof loc.lng==='function'?loc.lng():loc.lng),
  };
}
let _userPinMarker=null, _userPinCircle=null;
function placeUserPin(loc){
  if(_userPinMarker){_userPinMarker.map=null;_userPinMarker=null;}
  if(_userPinCircle){_userPinCircle.setMap(null);_userPinCircle=null;}
  const el=document.createElement('div');
  el.style.cssText=`width:14px;height:14px;border-radius:50%;background:#2d6a4f;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)`;
  _userPinMarker=new AdvancedMarkerElement({position:loc,map,content:el,title:'Konumunuz'});
  const c=currentMode?currentMode.circleColor:'#52b788';
  _userPinCircle=new google.maps.Circle({map,center:loc,radius:120,fillColor:c,fillOpacity:.15,strokeColor:c,strokeOpacity:.4,strokeWeight:1});
}
function makePlaceMarker(place, index, type){
  const {lat,lng}=getLatLng(place); if(!lat&&!lng)return null;
  const color=currentMode?currentMode.markerColor:'#1565c0';
  const m=makeAdvMarker({lat,lng},color,1.0,place.name);
  m.addListener('gmp-click',()=>openInfo(place,m,index,type));
  return m;
}

// ════════════════════════════════════════════════════
//  INFO WINDOW
// ════════════════════════════════════════════════════
function openInfo(place, marker, index, type){
  const {lat,lng}=getLatLng(place);
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`;
  const routeUrl=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  infoWindow.setContent(`
    <div class="iw">
      <div class="iw-name">${index+1}. ${place.name}</div>
      <div class="iw-addr">${place.vicinity||''}</div>
      <div class="iw-stats">
        <span>&#9733; <strong>${place.rating?place.rating.toFixed(1):'—'}</strong></span>
        <span>&#128172; <strong>${fmt(place.user_ratings_total)}</strong> yorum</span>
      </div>
      <div class="iw-btns">
        <a class="iw-btn iw-maps" href="${mapsUrl}" target="_blank" rel="noopener">Maps'te Gör</a>
        <a class="iw-btn iw-rota" href="${routeUrl}" target="_blank" rel="noopener">Rota Oluştur</a>
      </div>
    </div>`);
  infoWindow.open({map,anchor:marker});
  highlightCard(index,type);
}

// ════════════════════════════════════════════════════
//  LIST RENDERING
// ════════════════════════════════════════════════════
function renderList(listId, places, type){
  document.getElementById(listId).innerHTML=places.map((m,i)=>`
    <div class="mcard ${i===0?'active':''} ${type==='route'?'on-route':''}"
         id="${type}-card-${i}" onclick="selectPlace(${i},'${type}')">
      <div class="ctop">
        <div class="mname">${m.name}</div>
        <div class="rnk ${type==='route'?'rnk-r':'rnk-n'}">#${i+1}</div>
      </div>
      <div class="maddr">${m.vicinity||''}</div>
      <div class="mstats">
        <div class="stat"><span>&#128172;</span><span class="sv">${fmt(m.user_ratings_total)}</span><span class="sl"> yorum</span></div>
        <div class="stat"><span>&#9733;</span><span class="sv">${m.rating?m.rating.toFixed(1):'—'}</span></div>
        <div class="stars">${starsHtml(m.rating)}</div>
      </div>
    </div>`).join('');
}
function selectPlace(index, type){
  const list=type==='nearby'?nearbyPlaces:routePlaces;
  const pins=type==='nearby'?nearbyMarkers:routeMarkers;
  const m=list[index]; if(!m)return;
  const {lat,lng}=getLatLng(m);
  map.panTo({lat,lng}); map.setZoom(16);
  openInfo(m,pins[index],index,type);
}
function highlightCard(index, type){
  const prefix=type+'-card-';
  document.querySelectorAll(`[id^="${prefix}"]`).forEach((c,i)=>c.classList.toggle('active',i===index));
  document.getElementById(prefix+index)?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ════════════════════════════════════════════════════
//  STATE UI
// ════════════════════════════════════════════════════
function showLoading(id){document.getElementById(id).innerHTML=`<div class="smsg">${spin(30)}<h3>Aranıyor...</h3><p>Mekanlar filtreleniyor...</p></div>`}
function showEmpty(id,msg){document.getElementById(id).innerHTML=`<div class="smsg"><div class="ico">🔍</div><h3>Sonuç Bulunamadı</h3><p>${msg}</p></div>`}

// ════════════════════════════════════════════════════
//  EVENTS
// ════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('originInput').addEventListener('keydown',e=>{if(e.key==='Enter')startRoute()});
  document.getElementById('destInput').addEventListener('keydown',  e=>{if(e.key==='Enter')startRoute()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelPicking()});
  document.getElementById('originInput').addEventListener('input',function(){this.dataset.coord='';this.dataset.useGPS='';});
  document.getElementById('destInput').addEventListener('input',function(){this.dataset.coord='';});
});
