
window.initCustomerView = function() {
  console.log("👥 Customer View");

  const hariEl = document.getElementById("customerHari");
  const hariMenu = document.getElementById("hariMenu");
  const searchInput = document.getElementById("searchCustomer");
  const suggestEl = document.getElementById("customerSuggest");
  const btnInputCustomer = document.querySelector(".btn-input-customer");

  if (btnInputCustomer) {
    const now = new Date();
    const jamWIB = now.getUTCHours() + 7;
    const menit = now.getUTCMinutes();
    const sudahTutup = (jamWIB > 20) || (jamWIB === 20 && menit >= 0);
    if (sudahTutup) {
      btnInputCustomer.disabled = true;
      btnInputCustomer.style.opacity = "0.5";
      btnInputCustomer.style.cursor = "not-allowed";
      btnInputCustomer.innerHTML = `<i class="fa-solid fa-lock"></i> Input Ditutup`;
    }
  }

  const hariNama = ["Semua Hari", "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const now = new Date();
  let selectedHari = hariNama[now.getDay() + 1];
  hariEl.innerHTML = `${selectedHari} <i class="fa-solid fa-chevron-down"></i>`;
  let html = "";
  hariNama.forEach(hari => {
    html += `<div class="hari-item" data-hari="${hari}">${hari}</div>`;
  });
  hariMenu.innerHTML = html;
  hariEl.onclick = function(e) {
    e.stopPropagation();
    hariMenu.classList.toggle("active");
  };
  document.querySelectorAll(".hari-item").forEach(item => {
    item.onclick = function() {
      selectedHari = item.dataset.hari;
      hariEl.innerHTML = `${selectedHari} <i class="fa-solid fa-chevron-down"></i>`;
      hariMenu.classList.remove("active");
      console.log("HARI:", selectedHari);
      window.loadCustomerFromIndexDB(selectedHari, searchInput.value);
    };
  });
  window.loadCustomerFromIndexDB(selectedHari, "");
  window.syncPendingCustomer();
  document.addEventListener("click", function(e) {
    if (!e.target.closest("#customerHari") && !e.target.closest("#hariMenu")) {
      hariMenu.classList.remove("active");
    }
  });
  searchInput.addEventListener("input", function() {
    const keyword = this.value.trim();
    window.loadCustomerFromIndexDB(selectedHari, keyword);
    if (!keyword) {
      suggestEl.innerHTML = "";
      suggestEl.classList.remove("active");
      return;
    }
    // SUGGEST
    const items = document.querySelectorAll(".customer-nama");
    let suggestHtml = "";
    items.forEach(item => {
      const nama = item.innerText;
      if (nama.toLowerCase().includes(keyword.toLowerCase())) {
        suggestHtml += `<div class="customer-suggest-item">${nama}</div>`;
      }
    });
    if (!suggestHtml) {
      suggestEl.classList.remove("active");
      return;
    }
    suggestEl.innerHTML = suggestHtml;
    suggestEl.classList.add("active");
    document.querySelectorAll(".customer-suggest-item").forEach(el => {
      el.onclick = function() {
        searchInput.value = this.innerText;
        suggestEl.classList.remove("active");
        window.loadCustomerFromIndexDB(selectedHari, this.innerText);
      };
    });
  });
};

window.renderCustomer = function(hari, keyword = "", dataArray = []) {
  const listEl = document.getElementById("customerList");
  const totalEl = document.getElementById("customerTotal");
  const baruEl = document.getElementById("customerBaru");
  const lamaEl = document.getElementById("customerLama");
  if (!listEl) return;
  if (dataArray.length === 0) {
    totalEl.innerText = 0;
    baruEl.innerText = 0;
    lamaEl.innerText = 0;
    listEl.innerHTML = `<div class="customer-empty">Customer tidak ditemukan</div>`;
    return;
  }
  let html = "";
  dataArray.forEach(data => {
    const fotoSrc = data.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.namaCustomer || 'C');
    const noteBadge = data.catatan?.pesan?.trim()
      ? `<div class="customer-note-badge"><i class="fa-solid fa-bookmark"></i></div>`
      : "";
    const newBadge = data.isNew === true
      ? `<div class="customer-new-badge">NEW</div>`
      : "";

    html += `
      <div class="customer-list-item">
        <div class="customer-left">
          <div class="customer-foto-wrapper">
            <img src="${fotoSrc}" class="customer-foto">
            ${noteBadge}
            ${newBadge}
          </div>
          <div class="customer-info">
            <div class="customer-nama">${data.namaCustomer || "-"}</div>
            <div class="customer-alamat">${data.alamatCustomer || "-"}</div>
            <div class="customer-jarak">${Number(data.jarak || 0).toFixed(2)} km</div>
          </div>
        </div>
        <div class="customer-action">
          <button class="customer-icon-btn"
            onclick='openCatatanCustomer(${JSON.stringify(data)})'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
              <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
            </svg>
          </button>
          <button class="customer-icon-btn"
            onclick="openMapCustomerFromCache('${data.idCustomer}')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `;
  });

  totalEl.innerText = dataArray.length;
  baruEl.innerText = dataArray.filter(x => x.isNew === true).length;
  lamaEl.innerText = dataArray.filter(x => x.isNew !== true).length;
  listEl.innerHTML = html;
};
window.loadCustomerFromIndexDB = async function(hari, keyword = "") {
  const listEl = document.getElementById("customerList");
  if (!listEl) return;

  listEl.innerHTML = `<div class="customer-empty">Memuat...</div>`;

  try {
    const db = await window.openAppDB();
    const tx = db.transaction("customerHarianDB", "readonly");
    const store = tx.objectStore("customerHarianDB");
    const req = store.getAll();
    req.onsuccess = function () {
      const raw = req.result || [];
      let dataArray = [];
      raw.forEach(item => {
        if (item?.data && Array.isArray(item.data)) {
          dataArray.push(...item.data);
        } else {
          dataArray.push(item);
        }
      });

      // DEDUPE berdasarkan idCustomer
      const seen = new Set();
      dataArray = dataArray.filter(x => {
        const cid = x.idCustomer || x.id;
        if (!cid || seen.has(cid)) return false;
        seen.add(cid);
        return true;
      });
      if (hari !== "Semua Hari") {
        dataArray = dataArray.filter(x => x.hari === hari);
      }

      // =========================
      // FILTER SEARCH
      // =========================
      if (keyword) {
        const k = keyword.toLowerCase();
        dataArray = dataArray.filter(x =>
          (x.namaCustomer || "").toLowerCase().includes(k)
        );
      }

      // =========================
      // RENDER
      // =========================
      window.renderCustomer(hari, keyword, dataArray);
    };

    req.onerror = function () {
      console.log("Gagal load IndexedDB customer");
      listEl.innerHTML = `<div class="customer-empty">Gagal memuat</div>`;
    };

  } catch (err) {
    console.log(err);
    listEl.innerHTML = `<div class="customer-empty">Gagal memuat</div>`;
  }
};
window.openMapCustomerFromCache = async function(idCustomer) {
  const data = await window.getCustomerFromIndexDB(idCustomer);
  if (!data) {
    console.log("Customer tidak ditemukan di IndexedDB");
    return;
  }
  const loc = window.normalizeGeoPoint(data.lokasiCustomer);
  if (!loc) {
    console.log("Lokasi tidak valid:", data.lokasiCustomer);
    return;
  }
  const { lat, lng } = loc;
  window.open(
    `https://www.google.com/maps?q=${lat},${lng}`,
    "_blank"
  );
};
window.openCatatanCustomer = function(data) {
  const popup = document.getElementById("popupCatatanCustomer");
  const namaEl = document.getElementById("popupCatatanNama");
  const updateEl = document.getElementById("popupCatatanUpdate");
  const textEl = document.getElementById("popupCatatanText");
  const btn = document.getElementById("btnSimpanCatatan");
  const btnText = document.getElementById("btnSimpanCatatanText");
  let tanggalText = "Belum ada catatan";
  if (data.catatan?.pesan && data.catatan.pesan.trim() !== "") {
    const updateAt = data.catatan.updateAt;
    if (updateAt?.seconds) {
      const tgl = new Date(updateAt.seconds * 1000);
      tanggalText = tgl.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
    } else {
      tanggalText = "Belum ada tanggal";
    }
  }
  namaEl.innerText = data.namaCustomer || "-";
  updateEl.innerText = "Update: " + tanggalText;
  textEl.value = data.catatan?.pesan || "";
  popup.classList.add("active");
  btn.onclick = async function() {
    try {
      btn.disabled = true;
      btn.classList.add("loading");
      btnText.innerText = "Menyimpan...";
      await window.updateDoc(
        window.doc(window.db, "customer", data.id),
        {
          catatan: {
            pesan: textEl.value.trim(),
            updateAt: window.serverTimestamp()
          }
        }
      );
      try {
        const idb = await window.openAppDB();
        const txIdb = idb.transaction("customerHarianDB", "readwrite");
        const storeIdb = txIdb.objectStore("customerHarianDB");
        // Key di customerHarianDB adalah uid_hari
        const uid = window.auth.currentUser?.uid;
        const hari = data.hari || "";
        const key = `${uid}_${hari}`;

        const existing = await new Promise((resolve) => {
          const r = storeIdb.get(key);
          r.onsuccess = () => resolve(r.result || null);
          r.onerror = () => resolve(null);
        });

        if (existing && Array.isArray(existing.data)) {
          const idx = existing.data.findIndex(
            x => (x.idCustomer || x.id) === (data.idCustomer || data.id)
          );
          if (idx !== -1) {
            existing.data[idx] = {
              ...existing.data[idx],
              catatan: {
                pesan: textEl.value.trim(),
                updateAt: Date.now()
              }
            };
            storeIdb.put({
              ...existing,
              updatedAt: Date.now()
            });
          }
        }
      } catch(e) {
        console.log("Update catatan IndexDB error:", e);
      }
      btn.classList.remove("loading");
      btn.classList.add("success");
      btnText.innerText = "Sukses";
      updateEl.innerText = "Update: Baru saja";
      setTimeout(() => {
        btn.classList.remove("success");
        btnText.innerText = "Simpan";
        btn.disabled = false;
      }, 1500);
    } catch(err) {
      console.log(err);
      btn.classList.remove("loading");
      btn.classList.add("error");
      btnText.innerText = "Gagal";
      btn.disabled = false;
      setTimeout(() => {
        btn.classList.remove("error");
        btnText.innerText = "Simpan";
      }, 2000);
    }
  };
};
window.syncPendingCustomer = async function() {
  try {
    if (!navigator.onLine) return;
    const uid = window.auth.currentUser?.uid;
    if (!uid) return;
    console.log("🔄 Sync customer pending...");
    const db = await window.openAppDB();
    const tx = db.transaction("customerHarianDB", "readwrite");
    const store = tx.objectStore("customerHarianDB");
    const req = store.getAll();
    req.onsuccess = async function() {
      const raw = req.result || [];
      for (const item of raw) {
        if (
          !item?.data ||
          !Array.isArray(item.data)
        ) continue;
        let changed = false;
        for (
          let i = 0;
          i < item.data.length;
          i++
        ) {
          const customer = item.data[i];
          if (
            customer.syncStatus
            !== "pending"
          ) continue;
          try {
            const dataFirestore = {
              ...customer,
              lokasiCustomer:
                new window.GeoPoint(
                  customer
                  .lokasiCustomer?.lat || 0,
                  customer
                  .lokasiCustomer?.lng || 0
                )
            };
            delete
            dataFirestore.syncStatus;
            await window.setDoc(
              window.doc(
                window.db,
                "customer",
                customer.idCustomer
              ),
              dataFirestore
            );
            item.data[i].syncStatus = "synced";
            changed = true;
            console.log("✅ Synced:", customer.namaCustomer);
          } catch(err){
            console.log("❌ Sync gagal:", customer.namaCustomer, err);
          }
        }
        if (changed) {
          const db2 = await window.openAppDB();
          const tx2 = db2.transaction("customerHarianDB", "readwrite");
          const store2 = tx2.objectStore("customerHarianDB");
          store2.put({
            ...item,
            updatedAt: Date.now()
          });
        }
      }

      console.log("✅ Sync selesai");
    };
  } catch(err){
    console.log("Sync error:", err);
  }
};

window.addEventListener("online",
  function() {
    console.log("🌐 Online detected");
    window.syncPendingCustomer();
  }
);
window.inputCustomer = function() {
  const popup = document.getElementById("popupCustomer");
  const stokContainer = document.getElementById("stokContainer");
  if (!popup || !stokContainer) return;
  let customerLat = null;
  let customerLng = null;
  let fotoBase64 = "";
  stokContainer.innerHTML = `
    <div class="customer-form">
      <div class="popup-group">
        <label>Alamat</label>
        <input type="text" id="alamatCustomer" placeholder="Blok dan desa">
      </div>
      <button type="button" class="btn-lokasi" id="btnLokasi">
        <span id="btnLokasiText">Ambil Lokasi Sekarang</span>
      </button>
      <div class="foto-wrapper">
        <label class="foto-card" id="fotoCard">
          <input type="file" accept="image/*" capture="environment" id="fotoInput" hidden>
          <div class="foto-placeholder">
            <i class="fa-solid fa-camera"></i>
            <span>Ambil Foto</span>
          </div>
        </label>
      </div>
      <button type="button" class="btn-simpan-customer" id="btnSimpanCustomer">
        <span id="btnSimpanText">Simpan</span>
      </button>
    </div>
  `;
  popup.classList.add("active");
  const popupContent = document.getElementById("popupContent");
  if (popupContent) popupContent.style.transform = "";
  navigator.geolocation.getCurrentPosition((pos) => {
    customerLat = pos.coords.latitude;
    customerLng = pos.coords.longitude;
    console.log("DEFAULT LOKASI:", customerLat, customerLng);
  });
  const btnLokasi = document.getElementById("btnLokasi");
  const btnLokasiText = document.getElementById("btnLokasiText");
  let lokasiSuccess = false;
  btnLokasi.onclick = function() {
    if (lokasiSuccess) return;
    btnLokasi.disabled = true;
    btnLokasi.classList.add("loading");
    btnLokasiText.innerText = "Mengambil Lokasi...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        customerLat = pos.coords.latitude;
        customerLng = pos.coords.longitude;
        lokasiSuccess = true;
        btnLokasi.disabled = false;
        btnLokasi.classList.remove("loading");
        btnLokasi.classList.add("success");
        btnLokasiText.innerText = "Lokasi Sukses";
      },
      () => {
        btnLokasi.disabled = false;
        btnLokasi.classList.remove("loading");
        btnLokasi.classList.add("error");
        btnLokasiText.innerText = "Gagal";

        setTimeout(() => {
          btnLokasi.classList.remove("error");
          btnLokasiText.innerText = "Ambil Lokasi Sekarang";
        }, 2000);
      }
    );
  };
  const fotoInput = document.getElementById("fotoInput");
  const fotoCard = document.getElementById("fotoCard");
  fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      fotoBase64 = ev.target.result;
      fotoCard.innerHTML = `<img src="${fotoBase64}" class="foto-preview">`;
    };
    reader.readAsDataURL(file);
  });
  const btnSimpan = document.getElementById("btnSimpanCustomer");
  const btnSimpanText = document.getElementById("btnSimpanText");
  btnSimpan.onclick = async function() {
    try {
      btnSimpan.disabled = true;
      btnSimpan.classList.add("loading");
      btnSimpanText.innerText = "Menyimpan...";
      const uid = window.auth.currentUser.uid;
      const user = window.currentUser || {};
      const namaCustomer = document.getElementById("inputNamaCustomer")?.value.trim() || "";
      if (!namaCustomer) throw new Error("Nama customer kosong");
      const alamatCustomer = document.getElementById("alamatCustomer")?.value.trim() || "";
      const hariNama = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hari = hariNama[new Date().getDay()];
      let jarak = 0;
      try {
        const idbKantor = await window.openAppDB();
        const txKantor = idbKantor.transaction("kantorDB", "readonly");
        const storeKantor = txKantor.objectStore("kantorDB");
        const kantorData = await new Promise(resolve => {
          const r = storeKantor.get(user.idCabang || "");
          r.onsuccess = () => resolve(r.result?.data || null);
          r.onerror = () => resolve(null);
        });
        if (kantorData) {
          const lokasiCabang = kantorData.lokasiCabang;
          if (lokasiCabang && customerLat && customerLng) {
            const toRad = (v) => v * Math.PI / 180;
            const R = 6371;
            const dLat = toRad(customerLat - lokasiCabang.latitude);
            const dLng = toRad(customerLng - lokasiCabang.longitude);
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lokasiCabang.latitude)) *
              Math.cos(toRad(customerLat)) *
              Math.sin(dLng / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            jarak = Number((R * c).toFixed(2));
          }
        }
      } catch(err) {
        console.log("Gagal hitung jarak:", err);
      }
      const idCustomer = crypto.randomUUID();
      let syncStatus = navigator.onLine ? "synced" : "pending";

      const dataCustomer = {
        idCustomer,
        namaCustomer,
        alamatCustomer,
        hari,
        foto: fotoBase64 || "",
        jarak,
        lokasiCustomer: new window.GeoPoint(customerLat || 0, customerLng || 0),
        idCabang: user.idCabang || "",
        pemilik: uid,
        createdBy: uid,
        createdAt: window.serverTimestamp(),
        isNew: true,
        status: true,
        syncStatus
      };
      if (navigator.onLine) {
        try {
          await window.setDoc(
            window.doc(
              window.db,
              "customer",
              idCustomer
            ),
            dataCustomer
          );
          syncStatus = "synced";
          console.log("☁Firestore saved");
        } catch(err){
          console.log("Firestore gagal → pending", err
          );
        }
      }else{
        console.log("Offline → pending sync");
      }
      const idb = await window.openAppDB();
      const tx = idb.transaction("customerHarianDB", "readwrite");
      const store = tx.objectStore("customerHarianDB");
      const dataToSave = {
        ...dataCustomer,
        syncStatus,
        lokasiCustomer: window.normalizeGeoPoint(dataCustomer.lokasiCustomer),
        createdAt: Date.now()
      };
      const key = uid + "_" + hari;
      const existing = await new Promise(resolve => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      }
    );
      let currentData = existing?.data || [];
      currentData.unshift(dataToSave);
      await new Promise((resolve, reject) => {
        const req = store.put({
          id: key,
          data: currentData,
          updatedAt: Date.now()
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      btnSimpan.classList.remove("loading");
      btnSimpan.classList.add("success");
      btnSimpanText.innerText = "Sukses";
      setTimeout(() => {
        popup.classList.remove("active");
        window.loadCustomerFromIndexDB(hari, "");
      }, 700);
    } catch(err) {
      console.log(err);
      btnSimpan.disabled = false;
      btnSimpan.classList.remove("loading");
      btnSimpan.classList.add("error");
      btnSimpanText.innerText = "Gagal";
      setTimeout(() => {
        btnSimpan.classList.remove("error");
        btnSimpanText.innerText = "Simpan";
      }, 2000);
    }
  };
};
document.addEventListener("click", function(e) {
  const popup = document.getElementById("popupCustomer");
  const content = document.getElementById("popupContent");
  if (popup && popup.classList.contains("active")) {
    if (!content.contains(e.target) && !e.target.closest(".btn-input-customer")) {
      popup.classList.remove("active");
    }
  }
});
(function() {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let canSwipe = false;
  document.addEventListener("touchstart", function(e) {
    const popup = document.getElementById("popupCustomer");
    const content = document.getElementById("popupContent");
    if (!popup || !content) return;
    if (!popup.classList.contains("active")) return;
    if (e.target.closest("input, textarea, select")) {
      canSwipe = false;
      return;
    }
    if (content.scrollTop > 0) {
      canSwipe = false;
      return;
    }
    canSwipe = true;
    isDragging = true;
    startY = e.touches[0].clientY;
    currentY = startY;
    content.style.transition = "none";
  }, { passive: true });

  document.addEventListener("touchmove", function(e) {
    if (!isDragging || !canSwipe) return;
    const content = document.getElementById("popupContent");
    currentY = e.touches[0].clientY;
    const moveY = currentY - startY;
    if (moveY > 0) content.style.transform = `translateY(${moveY}px)`;
  }, { passive: true });
  document.addEventListener("touchend", function() {
    if (!isDragging || !canSwipe) return;
    const popup = document.getElementById("popupCustomer");
    const content = document.getElementById("popupContent");
    const moveY = currentY - startY;
    content.style.transition = "0.3s ease";
    if (moveY > 120) {
      content.style.transform = "translateY(100%)";
      setTimeout(() => {
        popup.classList.remove("active");
        content.style.transform = "";
      }, 250);
    } else {
      content.style.transform = "";
    }
    isDragging = false;
    canSwipe = false;
  });
})();
document.addEventListener("click", function(e) {
  const popup = document.getElementById("popupCatatanCustomer");
  const content = popup?.querySelector(".popup-catatan-content");
  if (popup && popup.classList.contains("active")) {
    if (!content.contains(e.target) && !e.target.closest(".customer-icon-btn")) {
      popup.classList.remove("active");
    }
  }
});
(function() {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let canSwipe = false;
  document.addEventListener("touchstart", function(e) {
    const popup = document.getElementById("popupCatatanCustomer");
    const content = popup?.querySelector(".popup-catatan-content");

    if (!popup || !content) return;
    if (!popup.classList.contains("active")) return;

    // JANGAN SWIPE SAAT INPUT
    if (e.target.closest("input, textarea, select")) {
      canSwipe = false;
      return;
    }

    // HANYA SAAT SCROLL ATAS
    if (content.scrollTop > 0) {
      canSwipe = false;
      return;
    }

    canSwipe = true;
    isDragging = true;
    startY = e.touches[0].clientY;
    currentY = startY;
    content.style.transition = "none";

  }, { passive: true });
  // TOUCH MOVE
  document.addEventListener("touchmove", function(e) {
    if (!isDragging || !canSwipe) return;
    const popup = document.getElementById("popupCatatanCustomer");
    const content = popup?.querySelector(".popup-catatan-content");
    if (!content) return;
    currentY = e.touches[0].clientY;
    const moveY = currentY - startY;
    if (moveY > 0) content.style.transform = `translateY(${moveY}px)`;
  }, { passive: true });
  document.addEventListener("touchend", function() {
    if (!isDragging || !canSwipe) return;
    const popup = document.getElementById("popupCatatanCustomer");
    const content = popup?.querySelector(".popup-catatan-content");
    if (!content) return;
    const moveY = currentY - startY;
    content.style.transition = "0.3s ease";
    if (moveY > 120) {
      content.style.transform = "translateY(100%)";
      setTimeout(() => {
        popup.classList.remove("active");
        content.style.transform = "";
      }, 250);
    } else {
      content.style.transform = "";
    }
    isDragging = false;
    canSwipe = false;
  });
})();
