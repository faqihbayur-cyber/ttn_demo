// =============================
// FIREBASE
// =============================
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
  addDoc,
  setDoc,
  serverTimestamp,
  GeoPoint,
  query,
  where,
  updateDoc,
  getDocs,
  onSnapshot,
  deleteField
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =============================
// FIREBASE CONFIG
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyCp32H2WeN3A4ZwwWeUWe3Qcjqh0mz_vvQ",
  authDomain: "teh-tarik-nusantara-26371.firebaseapp.com",
  projectId: "teh-tarik-nusantara-26371"
};


// =============================
// INIT FIREBASE
// =============================
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

let currentView = "home";

// GLOBAL
window.auth = auth;
window.db = db;

window.serverTimestamp =
  serverTimestamp;

window.GeoPoint =
  GeoPoint;

window.collection =
  collection;

window.addDoc =
  addDoc;

// TAMBAHAN
window.doc =
  doc;

window.setDoc =
  setDoc;

window.getDoc =
  getDoc;

window.query =
  query;

window.where =
  where;

window.getDocs =
  getDocs;

window.onSnapshot =
  onSnapshot;
  
window.updateDoc =
  updateDoc;

window.deleteField =
  deleteField;

window.currentUser =
  null;

// =============================
// LOCK HEIGHT
// keyboard android
// tidak resize layout
// =============================
function setAppHeight(){

  // pakai tinggi awal layar
  if(!window.initialAppHeight){

    window.initialAppHeight =
      window.innerHeight;
  }

  document
    .documentElement
    .style
    .setProperty(
      "--app-height",
      `${window.initialAppHeight}px`
    );
}

// init
setAppHeight();

// rotate hp
window.addEventListener(
  "orientationchange",
  ()=>{

    setTimeout(()=>{

      window.initialAppHeight =
        window.innerHeight;

      setAppHeight();

    },300);
  }
);

// =============================
// VIEW SWITCHER
// =============================
function showView(viewName){

  currentView = viewName;

  document
  .querySelectorAll(".view")
  .forEach(view=>{
    view.classList.remove("active");
  });

  const target =
    document.getElementById(
      `view-${viewName}`
    );

  if(target){
    target.classList.add("active");
  }


  // =============================
  // NAVBAR SHOW / HIDE
  // =============================
  const navbar =
    document.querySelector(
      ".navbar-bottom"
    );

  // VIEW YANG HIDE NAVBAR
  const hideNavbarViews = [
    "customer",
    "input",
    "analisis"
  ];

  if(
    hideNavbarViews.includes(
      viewName
    )
  ){

    navbar.classList.add(
      "hide"
    );

  }else{

    navbar.classList.remove(
      "hide"
    );
  }


  // =============================
  // INIT VIEW
  // =============================
  switch(viewName){

    case "home":

      window.initHomeView?.();

      break;

    case "input":

      window.initInputView?.();

      break;

    case "customer":

      window.initCustomerView?.();

      break;

    case "analisis":

      window.initAnalisisView?.();

      break;

    case "profil":

      window.initProfilView?.();

      break;
  }
}

window.showView = showView;
// =============================
// CLOSE ACTIVE POPUP
// =============================
function closeActivePopup(){

  const popupIds = [
    "popupInputOverlay",
    "popupInputFdOverlay",
    "popupWarningOverlay",
    "previewFotoOverlay",
    "popupHeaderDetailOverlay",
    "popupCustomer",
    "popupCatatanCustomer"
  ];

  for(const id of popupIds){

    const popup =
      document.getElementById(id);

    if(
      popup &&
      popup.classList.contains(
        "active"
      )
    ){

      popup.classList.remove(
        "active"
      );

      return true;
    }
  }

  return false;
}
// =============================
// ANDROID BACK BUTTON
// =============================

// PUSH DUMMY HISTORY
history.pushState(
  {app:true},
  ""
);

// BACK BUTTON
window.addEventListener(
  "popstate",
  function(){

    // ===================
    // TUTUP POPUP DULU
    // ===================
    if(closeActivePopup()){

      history.pushState(
        {app:true},
        ""
      );

      return;
    }

    // JIKA BUKAN HOME
    if(currentView !== "home"){

      // BALIK KE HOME
      showView("home");

      // AKTIFKAN NAV HOME
      document
      .querySelectorAll(".nav-item")
      .forEach(i=>{
        i.classList.remove("active");
      });

      const homeNav =
        document.querySelector(
          '.nav-item[data-view="home"]'
        );

      homeNav?.classList.add(
        "active"
      );

      // PUSH LAGI HISTORY
      history.pushState(
        {app:true},
        ""
      );

      return;
    }

    // JIKA SUDAH HOME
    // BIARKAN APP KELUAR
    window.close();
  }
);
document.addEventListener(
  "backbutton",
  function(e){

    // ===================
    // TUTUP POPUP DULU
    // ===================
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

// =============================
// NAVBAR
// =============================
function initNavbar(){

  const navItems =
    document.querySelectorAll(".nav-item");

  const navCircle =
    document.getElementById("navCircle");

  navItems.forEach((item, index)=>{

    item.addEventListener("click", ()=>{

      navItems.forEach(i=>{
        i.classList.remove("active");
      });

      item.classList.add("active");

      // PINDAH ACTIVE CIRCLE
      const rect =
        item.getBoundingClientRect();

      const parentRect =
        item.parentElement.getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2 -
        parentRect.left;

      navCircle.style.left =
        `${centerX - navCircle.offsetWidth / 2}px`;

      // SHOW VIEW
      const viewName =
        item.dataset.view;

      showView(viewName);
    });
  });

  // INIT POSISI CIRCLE
  setTimeout(()=>{

    const activeItem =
      document.querySelector(".nav-item.active");

    if(activeItem){

      const rect =
        activeItem.getBoundingClientRect();

      const parentRect =
        activeItem.parentElement.getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2 -
        parentRect.left;

      navCircle.style.left =
        `${centerX - navCircle.offsetWidth / 2}px`;
    }

  },100);
}


// =============================
// AUTH CHECK
// =============================
onAuthStateChanged(auth, async(user)=>{

  if(user){

    try{

      // VALIDASI USER
      const docRef =
        doc(db, "users", user.uid);

      const docSnap =
        await getDoc(docRef);

      if(!docSnap.exists()){

        await signOut(auth);

        window.location.href =
          "login.html";

        return;
      }

      // SIMPAN USER
      window.currentUser = {
        uid: user.uid,
        email: user.email,
        ...docSnap.data()
      };

      console.log(
        "✅ Login valid",
        window.currentUser
      );

      // LOAD APP
      initNavbar();

      showView("home");

    }catch(err){

      console.log(err);

      window.location.href =
        "login.html";
    }

  }else{

    // BELUM LOGIN
    window.location.href =
      "login.html";
  }
});


// =============================
// LOGOUT
// =============================
window.logout = async function(){

  try{

    await signOut(auth);

    localStorage.clear();

    window.location.href =
      "login.html";

  }catch(err){

    console.log(err);
  }
};


// =============================
// DISABLE ZOOM
// =============================
let lastTouchEnd = 0;

document.addEventListener(
  "touchend",
  function(event){

    const now = Date.now();

    if(now - lastTouchEnd <= 300){
      event.preventDefault();
    }

    lastTouchEnd = now;

  },
  false
);

document.addEventListener(
  "gesturestart",
  function(e){
    e.preventDefault();
  }
);