
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  collectionGroup,
  addDoc,
  setDoc,
  serverTimestamp,
  GeoPoint,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  getDocs,
  onSnapshot,
  deleteField
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCp32H2WeN3A4ZwwWeUWe3Qcjqh0mz_vvQ",
  authDomain: "teh-tarik-nusantara-26371.firebaseapp.com",
  projectId: "teh-tarik-nusantara-26371"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentView = "home";

window.auth = auth;
window.db = db;
window.serverTimestamp = serverTimestamp;
window.GeoPoint = GeoPoint;
window.collection = collection;
window.addDoc = addDoc;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;
window.getDocs = getDocs;
window.collectionGroup = collectionGroup;
window.onSnapshot = onSnapshot;
window.updateDoc = updateDoc;
window.deleteField = deleteField;
window.currentUser = null;
window.globalUsersCache = [];

window.openAppDB = function () {
  return new Promise( (resolve, reject) => {
    const request = indexedDB.open("appDB", 7);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("customerHarianDB")) {
        db.createObjectStore("customerHarianDB", {keyPath: "id"});
      }
      if (!db.objectStoreNames.contains("usersDB")) {
        db.createObjectStore("usersDB", {keyPath: "id"});
      }
      if (!db.objectStoreNames.contains("kantorDB")) {
        db.createObjectStore("kantorDB", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("customerBaruDB")) {
        db.createObjectStore("customerBaruDB", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("dataHarianDB")) {
        const store = db.createObjectStore("dataHarianDB", { keyPath: "id" }
          );
        store.createIndex("customerId", "customerId",
          { unique: false }
        );
        store.createIndex("tanggal", "tanggal",
          { unique: false }
        );
      }
      if (!db.objectStoreNames.contains("laporanMarketingDB")) {
        const store = db.createObjectStore("laporanMarketingDB", { keyPath: "id" });
        store.createIndex("tanggal", "tanggal", { unique: false });
        store.createIndex("idMarketing", "idMarketing", { unique: false });
      }
      if (!db.objectStoreNames.contains("slipGajiDB")) {
        const store = db.createObjectStore("slipGajiDB", { keyPath: "id" });
        store.createIndex("idUsers", "idUsers", { unique: false });
        store.createIndex("bulanKey", "bulanKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
window.syncOfflineDataHarian = async function(){
  try{
    if(!navigator.onLine){
      return;
    }

    const db = await window.openAppDB();
    const tx = db.transaction("dataHarianDB","readonly");
    const store = tx.objectStore("dataHarianDB");

    const allData = await new Promise((resolve,reject)=>{
      const req = store.getAll();

      req.onsuccess = ()=>{
        resolve(req.result || []);
      };

      req.onerror = ()=>{
        reject(req.error);
      };
    });

    const pendingData = allData.filter(
      item => item?.isSync === false
    );

    console.log(
      "Pending sync dataHarian:",
      pendingData.length
    );

    for(const item of pendingData){
      try{
        const today =
          item.tanggal;

        const customerId =
          item.idCustomer;

        const docRef = window.doc(
          window.db,
          "customer",
          customerId,
          "dataHarian",
          today
        );

        await window.setDoc(
          docRef,
          item.payload,
          { merge:true }
        );

        // update sync status
        const txUpdate =
          db.transaction(
            "dataHarianDB",
            "readwrite"
          );

        const storeUpdate =
          txUpdate.objectStore(
            "dataHarianDB"
          );

        item.isSync = true;
        item.syncedAt = Date.now();

        storeUpdate.put(item);

        console.log(
          "Sync success:",
          customerId
        );
      }catch(syncErr){
        console.log(
          "Sync gagal:",
          syncErr
        );
      }
    }
  }catch(err){
    console.log(
      "syncOfflineDataHarian error",
      err
    );
  }
};
window.syncCustomerHarian = async function(){
  try{
    if(!navigator.onLine){
      console.log("❌ syncCustomerHarian: offline");
      return;
    }

    const uid = window.auth?.currentUser?.uid;
    console.log("🔄 syncCustomerHarian start, uid:", uid);
    if(!uid){
      console.log("❌ syncCustomerHarian: uid kosong");
      return;
    }

    const hariNama  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
    const hariAktif = hariNama[new Date().getDay()];

    const q = window.query(
      window.collection(window.db, "customer"),
      window.where("pemilik", "==", uid),
      window.where("status",  "==", true),
      window.where("hari",    "==", hariAktif)
    );

    const snap = await window.getDocs(q);
    if(snap.empty) return;

    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const db  = await window.openAppDB();
    const tx  = db.transaction("customerHarianDB", "readwrite");
    const store = tx.objectStore("customerHarianDB");

    store.put({ id: uid, data });

    console.log("syncCustomerHarian: tersimpan", data.length, "customer");
  }catch(err){
    console.log("syncCustomerHarian error", err);
  }
};
window.addEventListener(
  "online",
  function(){
    console.log(
      "Internet kembali, sync..."
    );
    window.syncOfflineDataHarian();
    window.syncCustomerHarian?.();
  }
);
window.getCustomerFromIndexDB = async function(idCustomer) {
  const db = await window.openAppDB();
  const tx = db.transaction("customerHarianDB", "readonly");
  const store = tx.objectStore("customerHarianDB");

  return new Promise((resolve) => {
    const req = store.getAll();

    req.onsuccess = function() {
      const raw = req.result || [];

      let all = [];
      raw.forEach(item => {
        if (Array.isArray(item.data)) {
          all.push(...item.data);
        } else {
          all.push(item);
        }
      });

      const found = all.find(x => x.idCustomer === idCustomer || x.id === idCustomer);

      resolve(found || null);
    };

    req.onerror = function() {
      resolve(null);
    };
  });
};

// LOCK HEIGHT keyboard android tidak resize layout
function setAppHeight(){
  if(!window.initialAppHeight){
    window.initialAppHeight = window.innerHeight;
  }
  document.documentElement.style.setProperty(
      "--app-height",
      `${window.initialAppHeight}px`
    );
}
window.addEventListener("orientationchange",
  ()=>{
    setTimeout(()=>{
      window.initialAppHeight = window.innerHeight;
      setAppHeight();
    },300);
  }
);

function showView(viewName){
  currentView = viewName;

  document.querySelectorAll(".view").forEach(view=>{
    view.classList.remove("active");
  });

  const target = document.getElementById(`view-${viewName}`);
  if(target){
    target.classList.add("active");
  }

  const navbar = document.querySelector(".navbar-bottom");

  // 👇 TAMBAH rolling DI SINI
  const hideNavbarViews = [
    "customer",
    "input",
    "analisis",
    "rolling",
    "tentang",
    "keamanan",
    "perjanjian",
    "slip",
    "rollingcustomer",
    "chatAi"
  ];

  if(hideNavbarViews.includes(viewName)){
    navbar.classList.add("hide");
  }else{
    navbar.classList.remove("hide");
  }

 switch(viewName){
    case "home": window.initHomeView?.(); break;
    case "input": window.initInputView?.(); break;
    case "customer": window.initCustomerView?.(); break;
    case "analisis": window.initAnalisisView?.(); break;
    case "profil": window.initProfilView?.(); break;
    case "rolling": window.initRollingView?.(); break;
    case "operasional": window.initOperasionalView?.(); break;
    case "tentang": break;
    case "keamanan": window.initKeamananView?.(); break;
    case "perjanjian": window.initPerjanjianView?.(); break;
    case "slip": window.initSlipDataView?.(); break;
    case "rollingcustomer": window.initRollingCustomerView?.(); break;
    case "chatAi": window.initChatAiView?.(); break;
  }
}
window.showView = showView;
function closeActivePopup(){
  const popupIds = [
    "popupInputOverlay",
    "popupInputFdOverlay",
    "popupWarningOverlay",
    "previewFotoOverlay",
    "popupHeaderDetailOverlay",
    "popupCustomer",
    "popupCatatanCustomer",
    "popupHomeCustomer",
    "analysisDropdown"
  ];

  for(const id of popupIds){
    const popup = document.getElementById(id);
    if( popup && popup.classList.contains("active")){
      popup.classList.remove("active");
      return true;
    }
  }
  return false;
}

// ANDROID BACK BUTTON
history.pushState({app:true},"");
window.addEventListener("popstate",
  function(){
    if(closeActivePopup()){
      history.pushState({app:true}, "");
      return;
    }
    if(currentView !== "home"){
      
      const backToProfilViews = [
        "tentang",
        "keamanan",
        "perjanjian",
        "slip",
        "rollingcustomer"
      ];
    
      if(backToProfilViews.includes(currentView)){
        showView("profil");
      }else{
        showView("home");
      }
    
      document.querySelectorAll(".nav-item").forEach(i=>{
        i.classList.remove("active");
      });
    
      const homeNav = document.querySelector('.nav-item[data-view="home"]');
      homeNav?.classList.add("active");
    
      updateNavIndicator?.();
      history.pushState({app:true}, "");
      return;
    }
    window.close();
  }
);
document.addEventListener("backbutton",
  function(e){
    if(closeActivePopup()){
      e.preventDefault();
      return;
    }
    if(currentView !== "home"){
      e.preventDefault();
      showView("home");
      return;
    }
    navigator.app.exitApp?.();
  },
  false
);

function initNavbar() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      updateNavIndicator();
      showView(item.dataset.view);
    });
  });

  setTimeout(updateNavIndicator, 100);
}

function updateNavIndicator() {
  const indicator = document.getElementById("navIndicator");
  const activeItem = document.querySelector(".nav-item.active");
  if (!indicator || !activeItem) return;

  const rect = activeItem.getBoundingClientRect();
  const parentRect = activeItem.parentElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - parentRect.left;

  indicator.style.left = `${centerX - indicator.offsetWidth / 2}px`;
}
onAuthStateChanged(auth, async(user)=>{
  if(user){
    try{
      const docRef = doc(db,"users",user.uid);
      const docSnap = await getDoc(docRef);
      if(docSnap.exists()){
        const userData =
          docSnap.data();
        window.currentUser = {
          uid: user.uid,
          email: user.email,
          ...userData
        };
        // simpan cache
        localStorage.setItem("userCache", JSON.stringify(window.currentUser)
        );
      }
    }catch(err){
      // OFFLINE MODE
      const cache = localStorage.getItem("userCache");
      if(cache){
        window.currentUser = JSON.parse(cache);
        console.log("Offline login");
      }else{
        window.location.href = "login.html";
        return;
      }
    }
    // Sync customer hari ini ke IndexedDB saat online
    if(navigator.onLine && window.currentUser?.uid){
      window.syncCustomerHarian?.();
    }
    initNavbar();
    showView("home");
  }else{
    window.location.href ="login.html";
  }
});
window.logout = async function(){
  try{
    await signOut(auth);
    localStorage.clear();
    window.location.href = "login.html";
  }catch(err){
    console.log(err);
  }
};

// DISABLE ZOOM
let lastTouchEnd = 0;
document.addEventListener("touchend",
  function(event){
    const now = Date.now();
    if(now - lastTouchEnd <= 300){
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);
document.addEventListener("gesturestart", function(e){
    e.preventDefault();
  });

// helper
window.normalizeGeoPoint = function (geo) {
  if (!geo) return null;

  const lat =
    geo._lat ??
    geo.lat ??
    geo.latitude ??
    null;

  const lng =
    geo._long ??
    geo.lng ??
    geo.longitude ??
    null;

  if (lat == null || lng == null) return null;

  return {
    lat: Number(lat),
    lng: Number(lng)
  };
};
window.fetchUsersByCabang = async function () {
  try {
    const user = window.currentUser;
    if (!user || !user.uid) {
      console.log("❌ fetchUsersByCabang: user belum ready");
      return [];
    }
    const userSnap = await window.getDoc(window.doc(window.db, "users", user.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    const idCabang = userData.idCabang;
    if (!idCabang) {
      console.log("❌ fetchUsersByCabang: idCabang kosong");
      return [];
    }
    const q = window.query(
      window.collection(window.db, "users"),
      window.where("idCabang", "==", idCabang)
    );
    const snap = await window.getDocs(q);
    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    const filtered = data.filter(u =>
      ["kurir", "hunter", "sales"].includes((u.role || "").toLowerCase())
    );
    window.globalUsersCache = filtered;
    console.log("👤 Users filtered:", filtered.length, filtered);
    console.log("👤 Kurir loaded:", data.length, data);
    return data;
  } catch (err) {
    console.log("fetchUsersByCabang error", err);
    window.globalUsersCache = [];
    return [];
  }
};

// REGISTER SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(reg => {
        console.log("✅ Service Worker aktif", reg);
      })
      .catch(err => {
        console.log("❌ Service Worker gagal", err);
      });
  });
}
