
/* ==============================================
   CROP MODAL ENGINE
   Dipanggil oleh file input profil cover photo
   ============================================== */
(function initCropEngine() {

  // Jangan init ulang kalau sudah pernah
  if (window._cropEngineReady) return;
  window._cropEngineReady = true;

  const LS_KEY = 'ttn_cover_photo';

  /* ── State ── */
  const state = {
    imgRect : { x: 0, y: 0, w: 0, h: 0 }, // area render gambar di workspace
    box     : { x: 0, y: 0, w: 0, h: 0 }, // posisi crop box di workspace
    drag    : null,                          // info drag aktif
  };

  /* ── Hitung posisi gambar aktual dalam workspace (object-fit contain) ── */
  function getImgRect() {
    const ws  = document.getElementById('cropWorkspace');
    const img = document.getElementById('cropImg');
    if (!ws || !img) return state.imgRect;

    const cw = ws.offsetWidth;
    const ch = ws.offsetHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return { x: 0, y: 0, w: cw, h: ch };

    const cRatio = cw / ch;
    const iRatio = iw / ih;
    let rw, rh, rx, ry;

    if (iRatio > cRatio) {
      rw = cw; rh = cw / iRatio;
      rx = 0;  ry = (ch - rh) / 2;
    } else {
      rh = ch; rw = ch * iRatio;
      ry = 0;  rx = (cw - rw) / 2;
    }
    return { x: rx, y: ry, w: rw, h: rh };
  }

  /* ── Terapkan posisi crop box ke DOM ── */
  function applyBox() {
    const el = document.getElementById('cropBox');
    if (!el) return;
    el.style.left   = state.box.x + 'px';
    el.style.top    = state.box.y + 'px';
    el.style.width  = state.box.w + 'px';
    el.style.height = state.box.h + 'px';

    // Info ukuran asli
    const img = document.getElementById('cropImg');
    if (img && img.naturalWidth) {
      const ir     = state.imgRect;
      const scaleX = img.naturalWidth  / ir.w;
      const scaleY = img.naturalHeight / ir.h;
      const realW  = Math.round(state.box.w * scaleX);
      const realH  = Math.round(state.box.h * scaleY);
      const info   = document.getElementById('cropSizeInfo');
      if (info) info.textContent = `${realW} × ${realH} px`;
    }
  }

  /* ── Clamp box supaya tidak keluar imgRect ── */
  function clampBox(b, ir) {
    const MIN = 40;
    let { x, y, w, h } = b;
    w = Math.max(MIN, w);
    h = Math.max(MIN, h);
    x = Math.max(ir.x, Math.min(x, ir.x + ir.w - w));
    y = Math.max(ir.y, Math.min(y, ir.y + ir.h - h));
    if (x + w > ir.x + ir.w) w = ir.x + ir.w - x;
    if (y + h > ir.y + ir.h) h = ir.y + ir.h - y;
    return { x, y, w, h };
  }

  /* ── Ambil koordinat dari pointer/touch ── */
  function getLocal(e) {
    const ws   = document.getElementById('cropWorkspace');
    const rect = ws.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  }

  /* ── Pointer Down ── */
  function onDown(e) {
    e.preventDefault();
    const { x, y }  = getLocal(e);
    const handle     = e.target.dataset?.handle;
    const onBox      = e.target.id === 'cropBox' || e.target.closest?.('#cropBox');

    if (handle) {
      // Resize dari corner handle
      state.drag = { type: 'resize', handle, sx: x, sy: y, sb: { ...state.box } };
    } else if (onBox) {
      // Pindahkan seluruh box
      state.drag = { type: 'move', sx: x, sy: y, sb: { ...state.box } };
    } else {
      // Gambar crop box baru dari scratch
      const ir = state.imgRect;
      const cx = Math.max(ir.x, Math.min(x, ir.x + ir.w));
      const cy = Math.max(ir.y, Math.min(y, ir.y + ir.h));
      state.box  = { x: cx, y: cy, w: 1, h: 1 };
      state.drag = { type: 'new', sx: cx, sy: cy };
      applyBox();
    }
  }

  /* ── Pointer Move ── */
  function onMove(e) {
    if (!state.drag) return;
    e.preventDefault();
    const { x, y } = getLocal(e);
    const ir = state.imgRect;
    const sb = state.drag.sb;
    const dx = x - state.drag.sx;
    const dy = y - state.drag.sy;
    const MIN = 40;
    let nb;

    if (state.drag.type === 'move') {
      nb = clampBox({ x: sb.x + dx, y: sb.y + dy, w: sb.w, h: sb.h }, ir);

    } else if (state.drag.type === 'resize') {
      const h = state.drag.handle;
      let { x: bx, y: by, w: bw, h: bh } = sb;

      if (h === 'br') { bw = Math.max(MIN, bw + dx); bh = Math.max(MIN, bh + dy); }
      if (h === 'bl') { const nw = Math.max(MIN, bw - dx); bx = bx + bw - nw; bw = nw; bh = Math.max(MIN, bh + dy); }
      if (h === 'tr') { bw = Math.max(MIN, bw + dx); const nh = Math.max(MIN, bh - dy); by = by + bh - nh; bh = nh; }
      if (h === 'tl') { const nw = Math.max(MIN, bw - dx); bx = bx + bw - nw; bw = nw; const nh = Math.max(MIN, bh - dy); by = by + bh - nh; bh = nh; }

      nb = clampBox({ x: bx, y: by, w: bw, h: bh }, ir);

    } else if (state.drag.type === 'new') {
      const x1 = Math.max(ir.x, Math.min(state.drag.sx, ir.x + ir.w));
      const y1 = Math.max(ir.y, Math.min(state.drag.sy, ir.y + ir.h));
      const x2 = Math.max(ir.x, Math.min(x, ir.x + ir.w));
      const y2 = Math.max(ir.y, Math.min(y, ir.y + ir.h));
      nb = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 1, h: Math.abs(y2 - y1) || 1 };
    }

    if (nb) { state.box = nb; applyBox(); }
  }

  /* ── Pointer Up ── */
  function onUp() { state.drag = null; }

  /* ── Buka modal ── */
  window.openCropModal = function(dataUrl) {
    const overlay = document.getElementById('cropOverlay');
    const img     = document.getElementById('cropImg');
    if (!overlay || !img) return;

    overlay.classList.add('open');
    img.src = dataUrl;

    img.onload = () => {
      // Hitung posisi gambar, init crop box = full gambar
      state.imgRect = getImgRect();
      state.box     = { ...state.imgRect };
      applyBox();

      // Pasang event (sekali)
      const ws = document.getElementById('cropWorkspace');
      ws.onmousedown  = onDown;
      ws.ontouchstart = onDown;
      document.onmousemove  = onMove;
      document.ontouchmove  = onMove;
      document.onmouseup    = onUp;
      document.ontouchend   = onUp;
    };
  };

  /* ── Konfirmasi crop ── */
  function doConfirm() {
    const img = document.getElementById('cropImg');
    if (!img) return;

    const ir     = state.imgRect;
    const box    = state.box;
    const scaleX = img.naturalWidth  / ir.w;
    const scaleY = img.naturalHeight / ir.h;

    // Koordinat crop di gambar asli
    const sx = (box.x - ir.x) * scaleX;
    const sy = (box.y - ir.y) * scaleY;
    const sw = box.w * scaleX;
    const sh = box.h * scaleY;

    // Output max 1200px lebar
    const MAX_W  = 1200;
    const outW   = Math.min(Math.round(sw), MAX_W);
    const outH   = Math.round(sh * (outW / sw));

    const canvas = document.createElement('canvas');
    canvas.width  = outW;
    canvas.height = outH;
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    const compressed = canvas.toDataURL('image/jpeg', 0.78);

    // Log ukuran
    const before = Math.round(img.src.length / 1024);
    const after  = Math.round(compressed.length / 1024);
    console.log(`✂️ Crop: ${outW}×${outH}px | ${before}KB → ${after}KB`);

    // Simpan localStorage
    try {
      localStorage.setItem(LS_KEY, compressed);
    } catch (err) {
      alert('Gambar terlalu besar. Coba area crop lebih kecil.');
      return;
    }

    // Update hero background
    const heroBg = document.getElementById('profilHeroBg');
    if (heroBg) {
      heroBg.style.background     = `url(${compressed}) center/cover no-repeat`;
      heroBg.style.backgroundSize = 'cover';
    }

    closeModal();
  }

  /* ── Tutup modal ── */
  function closeModal() {
    const overlay = document.getElementById('cropOverlay');
    if (overlay) overlay.classList.remove('open');
    // Bersihkan event
    document.onmousemove = document.ontouchmove = null;
    document.onmouseup   = document.ontouchend  = null;
  }

  /* ── Binding tombol (pakai event delegation, sekali saja) ── */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#cropConfirm'))              doConfirm();
    if (e.target.closest('#cropCancel'))               closeModal();
    if (e.target.closest('#cropClose'))                closeModal();
    // Klik overlay hitam di luar modal
    if (e.target.id === 'cropOverlay')                 closeModal();
  });

})(); // langsung jalan saat script diparse
window.initProfilView = async function() {
  console.log("👤 Profil View");
  const user = window.currentUser;
  if (!user) return;
  // ── COVER PHOTO ──
  const LS_KEY        = 'ttn_cover_photo';
  const heroBg        = document.getElementById('profilHeroBg');
  const btnEditCover  = document.getElementById('btnEditCover');
  const coverDropdown = document.getElementById('coverDropdown');
  const btnGanti      = document.getElementById('btnGantiCover');
  const btnHapus      = document.getElementById('btnHapusCover');
  const inputFile     = document.getElementById('inputFotoCover');

  // Load foto tersimpan dari localStorage
  const savedPhoto = localStorage.getItem(LS_KEY);
  if (savedPhoto && heroBg) {
    heroBg.style.background     = `url(${savedPhoto}) center/cover no-repeat`;
    heroBg.style.backgroundSize = 'cover';
  }

  // Toggle dropdown
  if (btnEditCover && !btnEditCover.dataset.listener) {
    btnEditCover.dataset.listener = 'true';
    btnEditCover.addEventListener('click', (e) => {
      e.stopPropagation();
      coverDropdown.classList.toggle('open');
    });
  }

  // Tutup dropdown kalau klik di luar
  document.addEventListener('click', (e) => {
    if (!document.getElementById('coverEditWrap')?.contains(e.target)) {
      coverDropdown?.classList.remove('open');
    }
  });

  // Ganti foto → buka file picker
  if (btnGanti && !btnGanti.dataset.listener) {
    btnGanti.dataset.listener = 'true';
    btnGanti.addEventListener('click', () => {
      coverDropdown.classList.remove('open');
      inputFile.click();
    });
  }

  // File dipilih → buka crop modal dulu
  if (inputFile && !inputFile.dataset.listener) {
    inputFile.dataset.listener = 'true';
    inputFile.addEventListener('change', () => {
      const file = inputFile.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        openCropModal(e.target.result);
      };
      reader.readAsDataURL(file);
      inputFile.value = '';
    });
  }

  // Hapus foto
  if (btnHapus && !btnHapus.dataset.listener) {
    btnHapus.dataset.listener = 'true';
    btnHapus.addEventListener('click', () => {
      coverDropdown.classList.remove('open');
      localStorage.removeItem(LS_KEY);
      // Kembalikan ke gradient awal
      if (heroBg) {
        heroBg.style.background = '';
      }
    });
  }
  // ── END COVER PHOTO ──

  const initial = (user.nama || "A").charAt(0).toUpperCase();

  // Helper set text aman
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setText("profilAvatar",      initial);
  setText("profilName",        user.nama || "-");
  setText("profilEmail",       user.email || "-");
  setText("profilBadge",       user.role || "-");
  setText("profilNamaDetail",  user.nama || "-");
  setText("profilEmailDetail", user.email || "-");
  setText("profilTelpon",      user.noTelpon || "-");
  setText("profilJabatan",     user.role || "-");
  setText("profilCabang",      user.kantorCabang || "-");

  // =========================
  // STORAGE USAGE
  // =========================
  await loadStorageInfo();

  // Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout && !btnLogout.dataset.listener) {
    btnLogout.dataset.listener = "true";
    btnLogout.addEventListener("click", () => {
      const confirmLogout = confirm("Logout dari aplikasi?");
      if (confirmLogout) window.logout();
    });
  }

  // Bersihkan — placeholder dulu
  const btnBersihkan = document.getElementById("btnBersihkanStorage");
  if (btnBersihkan && !btnBersihkan.dataset.listener) {
    btnBersihkan.dataset.listener = "true";
    btnBersihkan.addEventListener("click", () => {
      alert("Fitur bersihkan akan segera hadir.");
    });
  }
};

async function loadStorageInfo() {
  const pemakaianEl = document.getElementById("storagePemakaian");
  const kuotaEl     = document.getElementById("storageKuota");
  const barFillEl   = document.getElementById("storageBarFill");
  const detailEl    = document.getElementById("storageDetail");

  try {
    const storeNames = [
      "customerHarianDB",
      "usersDB",
      "kantorDB",
      "customerBaruDB",
      "dataHarianDB",
      "laporanMarketingDB"
    ];

    const db = await window.openAppDB();
    let totalRecords = 0;
    const storeDetails = [];

    for (const storeName of storeNames) {
      const count = await new Promise(resolve => {
        try {
          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror  = () => resolve(0);
        } catch(e) {
          resolve(0);
        }
      });
      totalRecords += count;
      if (count > 0) storeDetails.push(`${storeName.replace("DB", "")}: ${count}`);
    }

    let usedMB  = "-";
    let quotaMB = "-";
    let persen  = 0;

    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      const used  = estimate.usage  || 0;
      const quota = estimate.quota  || 0;
      usedMB  = (used  / 1024 / 1024).toFixed(2) + " MB";
      quotaMB = (quota / 1024 / 1024).toFixed(0)  + " MB";
      persen  = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;
    }

    if (pemakaianEl) pemakaianEl.innerText    = usedMB;
    if (kuotaEl)     kuotaEl.innerText        = quotaMB;
    if (barFillEl)   barFillEl.style.width    = `${persen.toFixed(1)}%`;
    if (detailEl)    detailEl.innerText       = `${totalRecords} record total · ${storeDetails.join(", ") || "-"}`;

  } catch(e) {
    console.log("loadStorageInfo error:", e);
    if (pemakaianEl) pemakaianEl.innerText = "Tidak tersedia";
  }
}
// Tombol pengaturan
document.querySelectorAll(".profil-menu-item").forEach(item => {
  const label = item.querySelector(".profil-menu-left span")?.innerText?.trim();
  if (label === "Tentang Aplikasi") {
    item.addEventListener("click", () => {
      window.showView("tentang");
    });
  }
});
document.querySelectorAll(".profil-menu-item").forEach(item => {
    const label = item.querySelector(".profil-menu-left span")?.innerText?.trim();
    if (label === "Keamanan Akun") {
      item.addEventListener("click", () => {
        window.showView("keamanan");
      });
    }
  });
document.querySelectorAll(".profil-menu-item").forEach(item => {
    const label = item.querySelector(".profil-menu-left span")?.innerText?.trim();
    if (label === "Perjanjian Kerja") {
      item.addEventListener("click", () => {
        window.showView("perjanjian");
      });
    }
  });
document.querySelectorAll(".profil-menu-item").forEach(item => {
    const label = item.querySelector(".profil-menu-left span")?.innerText?.trim();
      if (label === "Slip Gaji") {
        item.addEventListener("click", () => {
          window.showView("slip");
          setTimeout(() => {
            window.initSlipView?.();
          }, 50);
        });
      }
  });
document.querySelectorAll(".profil-menu-item").forEach(item => {
    const label = item.querySelector(".profil-menu-left span")?.innerText?.trim();
    if (label === "Rolling Customer") {
      item.addEventListener("click", () => {
        window.showView("rollingcustomer");
      });
    }
  });
window.initKeamananView = async function() {
  const user = window.currentUser;
  const authUser = window.auth.currentUser;
  if (!user || !authUser) return;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  // UID
  setText("keamananUID", authUser.uid);

  // Email
  setText("keamananEmail", authUser.email || "-");

  // Verifikasi email
  setText("keamananVerifikasi", authUser.emailVerified ? "✓ Email Terverifikasi" : "Terverifikasi");

  // Last login
  const lastSignIn = authUser.metadata?.lastSignInTime;
  if (lastSignIn) {
    const d = new Date(lastSignIn);
    setText("keamananLastLogin", d.toLocaleString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }));
  } else {
    setText("keamananLastLogin", "Tidak diketahui");
  }

  // Device info
  const ua = navigator.userAgent;
  let device = "Perangkat Mobile";
  if (ua.includes("Android")) device = "Android · " + (ua.match(/Android ([0-9.]+)/)?.[1] || "");
  else if (ua.includes("iPhone")) device = "iPhone · iOS";
  setText("keamananDevice", device);

  // Sync status
  setText("keamananSyncStatus", navigator.onLine ? "Online" : "Offline");

  // Data lokal — hitung record
  try {
    const db = await window.openAppDB();
    const storeNames = ["customerHarianDB","usersDB","kantorDB","customerBaruDB","dataHarianDB","laporanMarketingDB"];
    let total = 0;
    for (const name of storeNames) {
      const count = await new Promise(resolve => {
        try {
          const tx = db.transaction(name, "readonly");
          const req = tx.objectStore(name).count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror  = () => resolve(0);
        } catch { resolve(0); }
      });
      total += count;
    }
    setText("keamananDataLokal", `${total} record`);
  } catch(e) {
    setText("keamananDataLokal", "-");
  }

  // Copy UID
  const btnCopy = document.getElementById("btnCopyUID");
  if (btnCopy && !btnCopy.dataset.listener) {
    btnCopy.dataset.listener = "true";
    btnCopy.addEventListener("click", () => {
      navigator.clipboard?.writeText(authUser.uid).then(() => {
        btnCopy.innerHTML = `<i class="fa-solid fa-check"></i>`;
        btnCopy.style.background = "#f0fdf4";
        btnCopy.style.color = "#16a34a";
        setTimeout(() => {
          btnCopy.innerHTML = `<i class="fa-regular fa-copy"></i>`;
          btnCopy.style.background = "";
          btnCopy.style.color = "";
        }, 1500);
      });
    });
  }

  // Refresh token
  const btnRefresh = document.getElementById("btnKeamananRefreshToken");
  if (btnRefresh && !btnRefresh.dataset.listener) {
    btnRefresh.dataset.listener = "true";
    btnRefresh.addEventListener("click", async () => {
      try {
        await authUser.getIdToken(true);
        const icon = btnRefresh.querySelector(".keamanan-card-icon");
        if (icon) {
          icon.style.background = "#f0fdf4";
          icon.style.color = "#16a34a";
          setTimeout(() => {
            icon.style.background = "";
            icon.style.color = "";
          }, 1500);
        }
      } catch(e) {
        console.log("Refresh token gagal:", e);
      }
    });
  }

  // Logout paksa
  const btnLogoutAll = document.getElementById("btnKeamananLogoutAll");
  if (btnLogoutAll && !btnLogoutAll.dataset.listener) {
    btnLogoutAll.dataset.listener = "true";
    btnLogoutAll.addEventListener("click", () => {
      const confirm = window.confirm("Yakin ingin logout dari semua sesi?");
      if (confirm) window.logout();
    });
  }
};
window.initPerjanjianView = function(){

  console.log("📄 Perjanjian View");

  const user = window.currentUser;

  if(!user){
    return;
  }

  // nanti isi data perjanjian disini
  // contoh:
  //
  // document.getElementById(
  //   "perjanjianNomor"
  // ).innerText = "AGR-001-2025";

};
