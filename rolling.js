
window.initRollingView = async function () {
  console.log("Rolling view ready");

  const customerList = document.getElementById("rollingCustomerList");
  const ketList = document.getElementById("rollingKeteranganList");

  // =========================
  // RIGHT PANEL (DUMMY DULU)
  // =========================
  const dummyKet = [
    "Order lancar",
    "Pending pembayaran",
    "Repeat order tinggi",
    "Customer aktif",
    "Follow up hari ini"
  ];

  ketList.innerHTML = dummyKet.map(text => `
    <div class="placeholder">${text}</div>
  `).join("");

  // =========================
  // LEFT PANEL (INDEXEDDB)
  // =========================
  try {
    const db = await window.openAppDB();
    const tx = db.transaction("customerBaruDB", "readonly");
    const store = tx.objectStore("customerBaruDB");

    const data = await new Promise((resolve, reject) => {
      const req = store.getAll();
    
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    
    // =========================
    // DEBUG CUSTOMERBARUDB
    // =========================
    console.log("Semua customerBaruDB:", data);
    
    console.table(data);
    
    data.forEach((item, index) => {
      console.log(`Customer ${index + 1}`, item);
    });

    // kosong
    if (!data.length) {
      customerList.innerHTML = `
        <div class="placeholder">Tidak ada customer</div>
      `;
      return;
    }

    // render list customer
    customerList.innerHTML = data.map(item => {

      const foto =
        item.foto ||
        "https://via.placeholder.com/100";

      const nama =
        item.namaCustomer ||
        "-";

      const jarak =
        item.jarak != null
          ? `${item.jarak} km`
          : "-";

      return `
        <div class="rolling-customer-item" onclick="openRollingCustomerPopup('${item.id}')">
          <img class="rolling-avatar" src="${foto}" />
          
          <div class="rolling-info">
            <div class="rolling-name">
              ${nama}
            </div>
            <div class="rolling-distance">
              ${jarak}
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.log("Rolling view error:", err);

    customerList.innerHTML = `
      <div class="placeholder">
        Gagal load customer
      </div>
    `;
  }
};
window.openRollingCustomerPopup = async function (idCustomer) {
  console.log("Open rolling popup:", idCustomer);

  const popup = document.getElementById("popupRollingCustomer");
  const inputNama = document.getElementById("inputNamaCustomerRolling");
  const inputAlamat = document.getElementById("alamatCustomerRolling");
  const container = document.getElementById("dataAwalContainerRolling");

  if (!popup || !inputNama || !inputAlamat || !container) return;

  try {
    const db = await window.openAppDB();

    // =========================
    // 1. AMBIL CUSTOMER
    // =========================
    const tx = db.transaction("customerBaruDB", "readonly");
    const store = tx.objectStore("customerBaruDB");

    const data = await new Promise((resolve) => {
      const req = store.get(idCustomer);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (!data) return;

    window.rollingEditId = idCustomer;

    inputNama.value = data.namaCustomer || "";
    inputAlamat.value = data.alamatCustomer || "";

    // =========================
    // 2. AMBIL VARIAN MASTER (usersDB)
    // =========================
    const tx2 = db.transaction("usersDB", "readonly");
    const store2 = tx2.objectStore("usersDB");

    const uid = window.auth.currentUser.uid;

    const userData = await new Promise(resolve => {
      const req = store2.get(uid);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });

    const varian = Array.isArray(userData?.varian) ? userData.varian : [];

    // =========================
    // 3. DETECT PAYMENT
    // =========================
    const paymentKey =
      data.konsinyasi ? "konsinyasi" :
      data.cash ? "cash" : null;

    const dataAwal = data[paymentKey] || {};

    // =========================
    // 4. BUILD MAP VALUE
    // =========================
    const valueMap = {};
    Object.entries(dataAwal).forEach(([k, v]) => {
      valueMap[k] = v;
    });

    // =========================
    // 5. RENDER DATA AWAL (WAJIB URUT VARIAN)
    // =========================
    let html = "";

    varian.forEach(item => {
      const key = Object.keys(item)[0];
      if (!key) return;

      const val = valueMap[key] ?? "";

      html += `
        <div class="data-awal-item">
          <input
            type="number"
            class="data-awal-input"
            data-key="${key}"
            value="${val}"
            placeholder="${key}">
        </div>
      `;
    });

    container.innerHTML = html || `
      <div class="customer-empty">Tidak ada data varian</div>
    `;

    // =========================
    // 6. PAYMENT ACTIVE STATE
    // =========================
    document.querySelectorAll(".payment-type-btn").forEach(btn => {
      btn.classList.remove("active");

      if (btn.dataset.value.toLowerCase() === paymentKey) {
        btn.classList.add("active");
      }

      btn.onclick = function () {
        document.querySelectorAll(".payment-type-btn")
          .forEach(b => b.classList.remove("active"));

        this.classList.add("active");
        // Samakan ke lowercase supaya konsisten dengan key IndexedDB
        window.selectedPaymentTypeRolling = this.dataset.value.toLowerCase();
      };
    });

    window.selectedPaymentTypeRolling = paymentKey; // sudah lowercase

    const fotoCard = document.getElementById("fotoCardRolling");
    if (data.foto) {
      fotoCard.innerHTML = `
        <img src="${data.foto}"
          style="width:100%;height:100%;object-fit:cover;border-radius:16px;">
      `;
    } else {
      fotoCard.innerHTML = "";
    }
    
    // Klik foto → buka kamera
    fotoCard.onclick = function () {
      const inputKamera = document.createElement("input");
      inputKamera.type = "file";
      inputKamera.accept = "image/*";
      inputKamera.capture = "environment";
    
      inputKamera.onchange = async function () {
        const file = inputKamera.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function (e) {
        const base64 = e.target.result;
  
        // Simpan sementara di variable, belum ke IndexedDB
        window.rollingFotoBaru = base64;
  
        // Tampilkan preview saja
        fotoCard.innerHTML = `
          <img src="${base64}"
            style="width:100%;height:100%;object-fit:cover;border-radius:16px;">
        `;
      };
    
        reader.readAsDataURL(file);
      };
    
      inputKamera.click();
    };

    popup.classList.add("active");

  } catch (err) {
    console.log("Rolling popup error:", err);
  }
};
document.getElementById("btnUpdateRolling")?.addEventListener("click", async function () {
  const id = window.rollingEditId;
  if (!id) return;

  try {
    // =========================
    // STEP 1: SEMUA READ DULU
    // =========================

    // Read existing customer
    const db = await window.openAppDB();
    const existing = await new Promise(resolve => {
      const tx = db.transaction("customerBaruDB", "readonly");
      const store = tx.objectStore("customerBaruDB");
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || {});
      req.onerror = () => resolve({});
    });

    // Read varianMap dari usersDB
    let varianMap = {};
    try {
      const uid = window.auth.currentUser.uid;
      const db2 = await window.openAppDB();
      const tx2 = db2.transaction("usersDB", "readonly");
      const store2 = tx2.objectStore("usersDB");
      const userData = await new Promise(resolve => {
        const req = store2.get(uid);
        req.onsuccess = () => resolve(req.result?.data || null);
        req.onerror = () => resolve(null);
      });
      (userData?.varian || []).forEach(item => {
        const key = Object.keys(item)[0];
        if (key) varianMap[key] = item[key];
      });
    } catch(e) {
      console.log("Gagal load varianMap:", e);
    }

    // =========================
    // STEP 2: PROSES DATA
    // =========================

    // Update nama & alamat
    existing.namaCustomer = document.getElementById("inputNamaCustomerRolling").value || existing.namaCustomer;
    existing.alamatCustomer = document.getElementById("alamatCustomerRolling").value || existing.alamatCustomer;

    // Update foto kalau ada foto baru
    if (window.rollingFotoBaru) {
      existing.foto = window.rollingFotoBaru;
      window.rollingFotoBaru = null;
    }

    // Update payment type & varian
    const paymentKey = window.selectedPaymentTypeRolling;
    if (paymentKey) {

      // Kumpulkan input varian
      const inputs = document.querySelectorAll("#dataAwalContainerRolling .data-awal-input");
      const varianData = {};
      inputs.forEach(input => {
        const key = input.dataset.key;
        const val = input.value;
        if (key) varianData[key] = val !== "" ? Number(val) : 0;
      });

      // Hitung ulang keterangan
      let hargaPendam = 0;
      let hargaJual = 0;
      let cashback = 0;

      Object.entries(varianData).forEach(([key, qty]) => {
        const v = varianMap[key] || {};
        hargaPendam += qty * Number(v.hargaProduksi || 0);
        hargaJual   += qty * Number(v.hargaKonsumen || 0);
        cashback    += qty * Number(v.hargaKonsumen || 0);
      });

      const keterangan = {};
      if (paymentKey === "konsinyasi") {
        keterangan.modal = { hargaPendam, hargaJual };
      } else if (paymentKey === "cash") {
        keterangan.cashback = cashback;
      }

      // Hapus payment lama, set yang baru
      delete existing.konsinyasi;
      delete existing.cash;
      existing[paymentKey] = varianData;
      existing.keterangan = keterangan;
    }

    // =========================
    // STEP 3: UPDATE FIRESTORE
    // =========================
    const uid = window.auth.currentUser.uid;
    const docRef = window.doc(
      window.db,
      "users", uid,
      "customerBaruHunter", existing.id
    );

    // Hapus field payment lama, set yang baru (sama seperti saat Simpan)
    const updatePayload = {
      namaCustomer: existing.namaCustomer,
      alamatCustomer: existing.alamatCustomer,
      foto: existing.foto || "",
      keterangan: existing.keterangan || {},
      konsinyasi: window.deleteField(),
      cash: window.deleteField(),
      [existing.konsinyasi ? "konsinyasi" : "cash"]:
        existing.konsinyasi || existing.cash,
    };

    await window.updateDoc(docRef, updatePayload);
    console.log("☁️ Firestore update berhasil");

    // =========================
    // STEP 4: WRITE INDEXEDDB
    // =========================
    const dbWrite = await window.openAppDB();
    await new Promise((resolve, reject) => {
      const tx = dbWrite.transaction("customerBaruDB", "readwrite");
      const store = tx.objectStore("customerBaruDB");
      const req = store.put(existing);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    console.log("Update berhasil");

    // Tutup popup & refresh list
    document.getElementById("popupRollingCustomer").classList.remove("active");
    window.initRollingView();

  } catch (err) {
    console.log("Gagal update:", err);
  }
});
document.getElementById("popupRollingCustomer")?.addEventListener("click", function (e) {
    if (e.target.id === "popupRollingCustomer") {
      this.classList.remove("active");
      window.rollingFotoBaru = null;
    }
  });
(function() {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let canSwipe = false;

  document.addEventListener("touchstart", function(e) {
    const popup = document.getElementById("popupRollingCustomer");
    const content = document.getElementById("popupRollingCustomerContent");

    if (!popup || !content) return;
    if (!popup.classList.contains("active")) return;

    // jangan swipe kalau lagi input
    if (e.target.closest("input, textarea, select")) {
      canSwipe = false;
      return;
    }

    // kalau scroll belum di atas
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

    const content = document.getElementById("popupRollingCustomerContent");
    if (!content) return;

    currentY = e.touches[0].clientY;
    const moveY = currentY - startY;

    if (moveY > 0) {
      content.style.transform = `translateY(${moveY}px)`;
    }

  }, { passive: true });

  document.addEventListener("touchend", function() {
    if (!isDragging || !canSwipe) return;

    const popup = document.getElementById("popupRollingCustomer");
    const content = document.getElementById("popupRollingCustomerContent");

    if (!content) return;

    const moveY = currentY - startY;
    content.style.transition = "0.3s ease";

    if (moveY > 120) {
      content.style.transform = "translateY(100%)";

      setTimeout(() => {
        popup.classList.remove("active");
        content.style.transform = "";
        window.rollingFotoBaru = null;
      }, 250);

    } else {
      content.style.transform = "";
    }

    isDragging = false;
    canSwipe = false;
  });
})();