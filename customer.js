
// =========================
// CACHE CUSTOMER
// =========================
window.customerCache = [];

window.initCustomerView = function(){

  console.log("👥 Customer View");


  // =========================
  // ELEMENT
  // =========================
  const hariEl =
    document.getElementById(
      "customerHari"
    );

  const hariMenu =
    document.getElementById(
      "hariMenu"
    );

  const searchInput =
    document.getElementById(
      "searchCustomer"
    );
  
  const suggestEl =
    document.getElementById(
      "customerSuggest"
    );
    
  // =========================
  // ARRAY HARI
  // =========================
  const hariNama = [
    "Semua Hari",
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
  ];


  // =========================
  // DEFAULT HARI
  // =========================
  const now =
    new Date();

  let selectedHari =
    hariNama[now.getDay() + 1];


  // =========================
  // SET DEFAULT
  // =========================
  hariEl.innerHTML = `

    ${selectedHari}

    <i class="fa-solid fa-chevron-down"></i>

  `;


  // =========================
  // RENDER MENU
  // =========================
  let html = "";

  hariNama.forEach(hari=>{

    html += `

      <div
        class="hari-item"
        data-hari="${hari}">

        ${hari}

      </div>

    `;
  });

  hariMenu.innerHTML =
    html;


  // =========================
  // OPEN CLOSE
  // =========================
  hariEl.onclick = function(e){

    e.stopPropagation();

    hariMenu.classList.toggle(
      "active"
    );
  };


  // =========================
  // CLICK ITEM
  // =========================
  document
  .querySelectorAll(".hari-item")
  .forEach(item=>{

    item.onclick = function(){

      selectedHari =
        item.dataset.hari;

      hariEl.innerHTML = `

        ${selectedHari}

        <i class="fa-solid fa-chevron-down"></i>

      `;

      hariMenu.classList.remove(
        "active"
      );

      console.log(
        "HARI:",
        selectedHari
      );
      window.renderCustomer(
        selectedHari,
        searchInput.value
      );
    };
  });
  
  // =========================
  // LOAD DEFAULT
  // =========================
  const uid =
    window.auth.currentUser.uid;
  
  const cacheKey =
    "customerCache_" + uid;
  
  const saved =
    localStorage.getItem(
      cacheKey
    );
  
  // ADA CACHE
  if(saved){
  
    try{
  
      window.customerCache =
        JSON.parse(saved);
  
      window.renderCustomer(
        selectedHari,
        ""
      );
  
      console.log(
        "📦 Load dari cache"
      );
  
    }catch(err){
  
      console.log(err);
  
      window.loadCustomer(
        selectedHari,
        ""
      );
    }
  
  }else{
  
    // PERTAMA KALI
    window.loadCustomer(
      selectedHari,
      ""
    );
  }

  // =========================
  // CLOSE OUTSIDE
  // =========================
  document.addEventListener(
    "click",
    function(e){
  
      if(
        !e.target.closest(
          "#customerHari"
        ) &&
        !e.target.closest(
          "#hariMenu"
        )
      ){
        hariMenu.classList.remove(
          "active"
        );
      }
    }
  );
  // =========================
  // SEARCH CUSTOMER
  // =========================
  searchInput.addEventListener(
    "input",
    function(){
  
      const keyword =
        this.value.trim();
  
      // LOAD CUSTOMER
      window.renderCustomer(
        selectedHari,
        keyword
      );
  
      // EMPTY
      if(!keyword){
  
        suggestEl.innerHTML = "";
        suggestEl.classList.remove(
          "active"
        );
  
        return;
      }
  
      // =========================
      // SUGGEST
      // =========================
      const items =
        document.querySelectorAll(
          ".customer-nama"
        );
  
      let suggestHtml = "";
  
      items.forEach(item=>{
  
        const nama =
          item.innerText;
  
        if(
          nama.toLowerCase()
          .includes(
            keyword.toLowerCase()
          )
        ){
  
          suggestHtml += `
  
            <div
              class="customer-suggest-item">
  
              ${nama}
  
            </div>
  
          `;
        }
      });
  
      // LIMIT EMPTY
      if(!suggestHtml){
  
        suggestEl.classList.remove(
          "active"
        );
  
        return;
      }
  
      suggestEl.innerHTML =
        suggestHtml;
  
      suggestEl.classList.add(
        "active"
      );
  
  
      // CLICK SUGGEST
      document
      .querySelectorAll(
        ".customer-suggest-item"
      )
      .forEach(el=>{
  
        el.onclick = function(){
  
          searchInput.value =
            this.innerText;
  
          suggestEl.classList.remove(
            "active"
          );
  
          window.renderCustomer(
            selectedHari,
            this.innerText
          );
        };
      });
    }
  );
};
// =========================
// RENDER CUSTOMER
// DARI CACHE
// =========================
window.renderCustomer =
function(
  hari,
  keyword = ""
){

  const listEl =
    document.getElementById(
      "customerList"
    );

  const totalEl =
    document.getElementById(
      "customerTotal"
    );

  const baruEl =
    document.getElementById(
      "customerBaru"
    );

  const lamaEl =
    document.getElementById(
      "customerLama"
    );

  if(!listEl) return;

  let dataArray =
    [...window.customerCache];


  // FILTER HARI
  if(
    hari !==
    "Semua Hari"
  ){

    dataArray =
      dataArray.filter(
        x =>
        x.hari === hari
      );
  }


  // FILTER SEARCH
  dataArray =
    dataArray.filter(data=>{

      const nama =
        (
          data.namaCustomer ||
          ""
        ).toLowerCase();

      return nama.includes(
        keyword.toLowerCase()
      );
    });


  // EMPTY
  if(
    dataArray.length === 0
  ){

    totalEl.innerText = 0;
    baruEl.innerText = 0;
    lamaEl.innerText = 0;

    listEl.innerHTML = `
      <div
        class="customer-empty">
        Customer tidak ditemukan
      </div>
    `;

    return;
  }


  let html = "";


  dataArray.forEach(data=>{

    html += `
      <div class="customer-list-item">

        <div class="customer-left">

          <div
            class="customer-foto-wrapper">

            <img
              src="${
                data.foto ||
                'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(
                  data.namaCustomer || 'C'
                )
              }"
              class="customer-foto"
            >

            ${
              data.catatan?.pesan?.trim()
              ? `
              <div
                class="customer-note-badge">

                <i
                  class="fa-solid fa-bookmark">
                </i>

              </div>
              `
              : ""
            }

            ${
              data.isNew === true
              ? `
              <div
                class="customer-new-badge">

                NEW

              </div>
              `
              : ""
            }

          </div>

          <div
            class="customer-info">

            <div
              class="customer-nama">

              ${
                data.namaCustomer
                || "-"
              }

            </div>

            <div
              class="customer-alamat">

              ${
                data.alamatCustomer
                || "-"
              }

            </div>

            <div
              class="customer-jarak">

              ${Number(
                data.jarak || 0
              ).toFixed(2)}
              km

            </div>

          </div>

        </div>

        <div
          class="customer-action">

          <button
            class="customer-icon-btn"
            onclick="
              openMapCustomer(
                ${
                  data
                  .lokasiCustomer
                  ?.latitude || 0
                },
                ${
                  data
                  .lokasiCustomer
                  ?.longitude || 0
                }
              )
            ">

            📍

          </button>

          <button
            class="customer-icon-btn"
            onclick='openCatatanCustomer(
              ${JSON.stringify(data)}
            )'>

            📝

          </button>

        </div>

      </div>
    `;
  });


  const totalBaru =
    dataArray.filter(
      x =>
      x.isNew === true
    ).length;

  const totalLama =
    dataArray.filter(
      x =>
      x.isNew !== true
    ).length;


  totalEl.innerText =
    dataArray.length;

  baruEl.innerText =
    totalBaru;

  lamaEl.innerText =
    totalLama;

  listEl.innerHTML =
    html;
};
// =========================
// LOAD CUSTOMER
// =========================
window.loadCustomer =
async function(
  hari,
  keyword = ""
){

  try{

    const uid =
      window.auth.currentUser.uid;

    const listEl =
      document.getElementById(
        "customerList"
      );

    const totalEl =
      document.getElementById(
        "customerTotal"
      );
    
    const baruEl =
      document.getElementById(
        "customerBaru"
      );
    
    const lamaEl =
      document.getElementById(
        "customerLama"
      );
      
    if(!listEl) return;


    // LOADING
    listEl.innerHTML = `
      <div class="customer-empty">
        Memuat...
      </div>
    `;


    // =========================
    // QUERY FIRESTORE
    // =========================
    const queryArray = [
    
      window.where(
        "pemilik",
        "==",
        uid
      ),
    
      window.where(
        "status",
        "==",
        true
      )
    
    ];
    
    // FILTER HARI
    if(hari !== "Semua Hari"){
    
      queryArray.push(
    
        window.where(
          "hari",
          "==",
          hari
        )
    
      );
    }
    
    const q =
      window.query(
    
        window.collection(
          window.db,
          "customer"
        ),
    
        ...queryArray
      );


    const snapshot =
      await window.getDocs(q);


    // =========================
    // EMPTY
    // =========================
    if(snapshot.empty){

      totalEl.innerText = 0;
      baruEl.innerText = 0;
      lamaEl.innerText = 0;

      listEl.innerHTML = `
        <div class="customer-empty">
          Belum ada customer
        </div>
      `;

      return;
    }


    // =========================
    // RENDER
    // =========================
    let html = "";

    const dataArray = [];
    
    snapshot.forEach(doc=>{
    
      dataArray.push({
        id:doc.id,
        ...doc.data()
      });
    });
    // =========================
    // SAVE CACHE
    // =========================
    window.customerCache =
      dataArray;
    
    localStorage.setItem(
    
      "customerCache_" +
      uid,
    
      JSON.stringify(
        dataArray
      )
    );    
    
    window.renderCustomer(
      hari,
      keyword
    );
    console.log(
      "✅ Customer loaded:",
      dataArray.length
    );
  }catch(err){

    console.log(err);
  }
};
// =========================
// RELOAD CUSTOMER
// =========================
window.reloadCustomerData =
async function(){

  const hari =
    document
    .getElementById(
      "customerHari"
    )
    .innerText
    .trim();

  const keyword =
    document
    .getElementById(
      "searchCustomer"
    )
    .value
    .trim();

  console.log(
    "🔄 Reload customer"
  );

  await window.loadCustomer(
    hari,
    keyword
  );
};
// =========================
// OPEN GOOGLE MAP
// =========================
window.openMapCustomer =
function(lat,lng){

  if(!lat || !lng)
    return;

  const url =
    `https://www.google.com/maps?q=${lat},${lng}`;

  window.open(
    url,
    "_blank"
  );
};

// =========================
// POPUP CATATAN
// =========================
window.openCatatanCustomer =
function(data){

  const popup =
    document.getElementById(
      "popupCatatanCustomer"
    );

  const namaEl =
    document.getElementById(
      "popupCatatanNama"
    );

  const updateEl =
    document.getElementById(
      "popupCatatanUpdate"
    );

  const textEl =
    document.getElementById(
      "popupCatatanText"
    );

  const btn =
    document.getElementById(
      "btnSimpanCatatan"
    );

  const btnText =
    document.getElementById(
      "btnSimpanCatatanText"
    );


  // =========================
  // FORMAT TANGGAL CATATAN
  // =========================
  let tanggalText =
    "Belum ada catatan";
  
  
  // ADA PESAN
  if(
    data.catatan?.pesan &&
    data.catatan.pesan.trim() !== ""
  ){
  
    const updateAt =
      data.catatan.updateAt;
  
    // FIRESTORE TIMESTAMP
    if(
      updateAt?.seconds
    ){
  
      const tgl =
        new Date(
          updateAt.seconds * 1000
        );
  
      tanggalText =
        tgl.toLocaleDateString(
          "id-ID",
          {
            weekday:"long",
            day:"numeric",
            month:"long",
            year:"numeric"
          }
        );
  
    }else{
  
      tanggalText =
        "Belum ada tanggal";
    }
  }


  // =========================
  // SET DATA
  // =========================
  namaEl.innerText =
    data.namaCustomer || "-";

  updateEl.innerText =
    "Update: " + tanggalText;

  textEl.value =
    data.catatan?.pesan || "";


  // SHOW
  popup.classList.add(
    "active"
  );


  // =========================
  // BUTTON SIMPAN
  // =========================
  btn.onclick =
    async function(){

      try{

        btn.disabled = true;

        btn.classList.add(
          "loading"
        );

        btnText.innerText =
          "Menyimpan...";


        // =========================
        // UPDATE FIRESTORE
        // =========================
        await window.updateDoc(
        
          window.doc(
            window.db,
            "customer",
            data.id
          ),
        
          {
            catatan:{
              pesan:
                textEl.value.trim(),
        
              updateAt:
                window.serverTimestamp()
            }
          }
        );


        // SUCCESS
        btn.classList.remove(
          "loading"
        );

        btn.classList.add(
          "success"
        );

        btnText.innerText =
          "Sukses";


        // UPDATE TEXT
        updateEl.innerText =
          "Update: Baru saja";


        setTimeout(()=>{

          btn.classList.remove(
            "success"
          );

          btnText.innerText =
            "Simpan";

          btn.disabled = false;

        },1500);

      }catch(err){

        console.log(err);

        btn.classList.remove(
          "loading"
        );

        btn.classList.add(
          "error"
        );

        btnText.innerText =
          "Gagal";

        btn.disabled = false;


        setTimeout(()=>{

          btn.classList.remove(
            "error"
          );

          btnText.innerText =
            "Simpan";

        },2000);
      }
    };
};

// =========================
// INPUT CUSTOMER
// =========================
window.inputCustomer =
function(){

  const popup =
    document.getElementById(
      "popupCustomer"
    );

  const stokContainer =
    document.getElementById(
      "stokContainer"
    );

  if(!popup || !stokContainer)
    return;


  // =========================
  // DEFAULT
  // =========================
  let customerLat = null;
  let customerLng = null;

  let fotoBase64 = "";


  // =========================
  // FORM
  // =========================
  stokContainer.innerHTML = `

    <div class="customer-form">

      <!-- ALAMAT -->
      <div class="popup-group">

        <label>
          Alamat
        </label>

        <input
          type="text"
          id="alamatCustomer"
          placeholder="Blok dan desa"
        >

      </div>


      <!-- LOKASI -->
      <button
        type="button"
        class="btn-lokasi"
        id="btnLokasi">

        <span id="btnLokasiText">
          Ambil Lokasi Sekarang
        </span>

      </button>


      <!-- FOTO -->
      <div class="foto-wrapper">

        <label
          class="foto-card"
          id="fotoCard">

          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="fotoInput"
            hidden
          >

          <div
            class="foto-placeholder">

            <i class="fa-solid fa-camera"></i>

            <span>
              Ambil Foto
            </span>

          </div>

        </label>

      </div>


      <!-- BUTTON -->
      <button
        type="button"
        class="btn-simpan-customer"
        id="btnSimpanCustomer">

        <span id="btnSimpanText">
          Simpan
        </span>

      </button>

    </div>
  `;


  // SHOW POPUP
  popup.classList.add(
    "active"
  );


  // RESET POSITION
  const popupContent =
    document.getElementById(
      "popupContent"
    );

  if(popupContent){

    popupContent.style.transform =
      "";
  }


  // =========================
  // DEFAULT LOKASI
  // =========================
  navigator.geolocation
  .getCurrentPosition(

    (pos)=>{

      customerLat =
        pos.coords.latitude;

      customerLng =
        pos.coords.longitude;

      console.log(
        "DEFAULT LOKASI:",
        customerLat,
        customerLng
      );
    }
  );


  // =========================
  // BUTTON LOKASI
  // =========================
  const btnLokasi =
    document.getElementById(
      "btnLokasi"
    );

  const btnLokasiText =
    document.getElementById(
      "btnLokasiText"
    );

  let lokasiSuccess =
    false;

  btnLokasi.onclick =
    function(){

      if(lokasiSuccess)
        return;

      btnLokasi.disabled =
        true;

      btnLokasi.classList.add(
        "loading"
      );

      btnLokasiText.innerText =
        "Mengambil Lokasi...";

      navigator.geolocation
      .getCurrentPosition(

        (pos)=>{

          customerLat =
            pos.coords.latitude;

          customerLng =
            pos.coords.longitude;

          lokasiSuccess =
            true;

          btnLokasi.disabled =
            false;

          btnLokasi.classList.remove(
            "loading"
          );

          btnLokasi.classList.add(
            "success"
          );

          btnLokasiText.innerText =
            "Lokasi Sukses";
        },

        ()=>{

          btnLokasi.disabled =
            false;

          btnLokasi.classList.remove(
            "loading"
          );

          btnLokasi.classList.add(
            "error"
          );

          btnLokasiText.innerText =
            "Gagal";

          setTimeout(()=>{

            btnLokasi.classList.remove(
              "error"
            );

            btnLokasiText.innerText =
              "Ambil Lokasi Sekarang";

          },2000);
        }
      );
    };


  // =========================
  // FOTO
  // =========================
  const fotoInput =
    document.getElementById(
      "fotoInput"
    );

  const fotoCard =
    document.getElementById(
      "fotoCard"
    );

  fotoInput.addEventListener(
    "change",
    (e)=>{

      const file =
        e.target.files[0];

      if(!file) return;

      const reader =
        new FileReader();

      reader.onload =
      function(ev){

        fotoBase64 =
          ev.target.result;

        fotoCard.innerHTML = `

          <img
            src="${fotoBase64}"
            class="foto-preview"
          >
        `;
      };

      reader.readAsDataURL(
        file
      );
    }
  );


  // =========================
  // BUTTON SIMPAN
  // =========================
  const btnSimpan =
    document.getElementById(
      "btnSimpanCustomer"
    );

  const btnSimpanText =
    document.getElementById(
      "btnSimpanText"
    );

  btnSimpan.onclick =
  async function(){

    try{

      btnSimpan.disabled =
        true;

      btnSimpan.classList.add(
        "loading"
      );

      btnSimpanText.innerText =
        "Menyimpan...";


      // =========================
      // USER
      // =========================
      const uid =
        window.auth
        .currentUser.uid;

      const user =
        window.currentUser
        || {};


      // =========================
      // NAMA
      // =========================
      const namaCustomer =
        document
        .getElementById(
          "inputNamaCustomer"
        )
        ?.value
        .trim() || "";


      if(!namaCustomer){

        throw new Error(
          "Nama customer kosong"
        );
      }


      // =========================
      // ALAMAT
      // =========================
      const alamatCustomer =
        document
        .getElementById(
          "alamatCustomer"
        )
        ?.value
        .trim() || "";


      // =========================
      // HARI
      // =========================
      const hariNama = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"
      ];

      const hari =
        hariNama[
          new Date()
          .getDay()
        ];


      // =========================
      // HITUNG JARAK
      // =========================
      let jarak = 0;

      try{

        const cabangRef =
          window.doc(
            window.db,
            "kantorCabang",
            user.idCabang
          );

        const cabangSnap =
          await window.getDoc(
            cabangRef
          );

        if(
          cabangSnap.exists()
        ){

          const cabangData =
            cabangSnap.data();

          const lokasiCabang =
            cabangData
            .lokasiCabang;

          if(
            lokasiCabang &&
            customerLat &&
            customerLng
          ){

            const toRad =
              (v)=>
              v *
              Math.PI / 180;

            const R = 6371;

            const dLat =
              toRad(
                customerLat -
                lokasiCabang
                .latitude
              );

            const dLng =
              toRad(
                customerLng -
                lokasiCabang
                .longitude
              );

            const a =
              Math.sin(
                dLat/2
              ) **
              2 +

              Math.cos(
                toRad(
                  lokasiCabang
                  .latitude
                )
              ) *

              Math.cos(
                toRad(
                  customerLat
                )
              ) *

              Math.sin(
                dLng/2
              ) **
              2;

            const c =
              2 *
              Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1-a)
              );

            jarak =
              Number(
                (
                  R * c
                ).toFixed(2)
              );
          }
        }

      }catch(err){

        console.log(
          "Gagal hitung jarak",
          err
        );
      }


      // =========================
      // ID CUSTOMER
      // =========================
      const idCustomer =
        crypto.randomUUID();


      // =========================
      // DATA CUSTOMER
      // =========================
      const dataCustomer = {

        idCustomer:
          idCustomer,

        namaCustomer:
          namaCustomer,

        alamatCustomer:
          alamatCustomer,

        hari:
          hari,

        foto:
          fotoBase64 || "",

        jarak:
          jarak,

        lokasiCustomer:
          new window.GeoPoint(
            customerLat || 0,
            customerLng || 0
          ),

        idCabang:
          user.idCabang || "",

        pemilik:
          uid,

        createdBy:
          uid,

        createdAt:
          window.serverTimestamp(),

        isNew:
          true,

        status:
          true
      };


      // =========================
      // SAVE FIRESTORE
      // =========================
      await window.setDoc(

        window.doc(
          window.db,
          "customer",
          idCustomer
        ),

        dataCustomer
      );


      // SUCCESS
      btnSimpan.classList.remove(
        "loading"
      );

      btnSimpan.classList.add(
        "success"
      );

      btnSimpanText.innerText =
        "Sukses";


      setTimeout(()=>{

        popup.classList.remove(
          "active"
        );

      },700);

    }catch(err){

      console.log(err);

      btnSimpan.disabled =
        false;

      btnSimpan.classList.remove(
        "loading"
      );

      btnSimpan.classList.add(
        "error"
      );

      btnSimpanText.innerText =
        "Gagal";

      setTimeout(()=>{

        btnSimpan.classList.remove(
          "error"
        );

        btnSimpanText.innerText =
          "Simpan";

      },2000);
    }
  };
};


// =========================
// CLOSE POPUP CLICK OUTSIDE
// =========================
document.addEventListener(
  "click",
  function(e){

    const popup =
      document.getElementById(
        "popupCustomer"
      );

    const content =
      document.getElementById(
        "popupContent"
      );

    if(
      popup &&
      popup.classList.contains(
        "active"
      )
    ){

      if(
        !content.contains(e.target)
      &&
        !e.target.closest(
          ".btn-input-customer"
        )
      ){

        popup.classList.remove(
          "active"
        );
      }
    }
  }
);


// =========================
// SWIPE DOWN CLOSE POPUP
// =========================
(function(){

  let startY = 0;

  let currentY = 0;

  let isDragging = false;

  let canSwipe = false;


  // =========================
  // TOUCH START
  // =========================
  document.addEventListener(
    "touchstart",
    function(e){

      const popup =
        document.getElementById(
          "popupCustomer"
        );

      const content =
        document.getElementById(
          "popupContent"
        );

      if(
        !popup ||
        !content
      ) return;

      if(
        !popup.classList.contains(
          "active"
        )
      ) return;


      // INPUT / TEXTAREA / SELECT
      const formElement =
        e.target.closest(
          "input, textarea, select"
        );

      // JANGAN SWIPE SAAT INPUT
      if(formElement){

        canSwipe = false;
        return;
      }


      // HANYA SAAT SCROLL PALING ATAS
      if(content.scrollTop > 0){

        canSwipe = false;
        return;
      }

      canSwipe = true;

      isDragging = true;

      startY =
        e.touches[0].clientY;

      currentY =
        startY;

      content.style.transition =
        "none";

    },
    { passive:true }
  );


  // =========================
  // TOUCH MOVE
  // =========================
  document.addEventListener(
    "touchmove",
    function(e){

      if(
        !isDragging ||
        !canSwipe
      ) return;

      const content =
        document.getElementById(
          "popupContent"
        );

      currentY =
        e.touches[0].clientY;

      let moveY =
        currentY - startY;


      // HANYA KE BAWAH
      if(moveY > 0){

        content.style.transform =
          `translateY(${moveY}px)`;
      }

    },
    { passive:true }
  );


  // =========================
  // TOUCH END
  // =========================
  document.addEventListener(
    "touchend",
    function(){

      if(
        !isDragging ||
        !canSwipe
      ) return;

      const popup =
        document.getElementById(
          "popupCustomer"
        );

      const content =
        document.getElementById(
          "popupContent"
        );

      let moveY =
        currentY - startY;

      content.style.transition =
        "0.3s ease";


      // CLOSE
      if(moveY > 120){

        content.style.transform =
          "translateY(100%)";

        setTimeout(()=>{

          popup.classList.remove(
            "active"
          );

          content.style.transform =
            "";

        },250);

      }else{

        // BALIK NORMAL
        content.style.transform =
          "";
      }

      isDragging = false;

      canSwipe = false;

    }
  );

})();

// =========================
// CLOSE POPUP CATATAN CLICK OUTSIDE
// =========================
document.addEventListener(
  "click",
  function(e){

    const popup =
      document.getElementById(
        "popupCatatanCustomer"
      );

    const content =
      popup?.querySelector(
        ".popup-catatan-content"
      );

    if(
      popup &&
      popup.classList.contains(
        "active"
      )
    ){

      if(
        !content.contains(e.target)
      &&
        !e.target.closest(
          ".customer-icon-btn"
        )
      ){

        popup.classList.remove(
          "active"
        );
      }
    }
  }
);


// =========================
// SWIPE DOWN CLOSE
// POPUP CATATAN
// =========================
(function(){

  let startY = 0;

  let currentY = 0;

  let isDragging = false;

  let canSwipe = false;

  // =========================
  // TOUCH START
  // =========================
  document.addEventListener(
    "touchstart",
    function(e){

      const popup =
        document.getElementById(
          "popupCatatanCustomer"
        );

      const content =
        popup?.querySelector(
          ".popup-catatan-content"
        );

      if(
        !popup ||
        !content
      ) return;

      if(
        !popup.classList.contains(
          "active"
        )
      ) return;

      // INPUT / TEXTAREA
      const formElement =
        e.target.closest(
          "input, textarea, select"
        );

      if(formElement){

        canSwipe = false;
        return;
      }

      // HANYA SAAT SCROLL ATAS
      if(content.scrollTop > 0){

        canSwipe = false;
        return;
      }

      canSwipe = true;

      isDragging = true;

      startY =
        e.touches[0].clientY;

      currentY =
        startY;

      content.style.transition =
        "none";

    },
    { passive:true }
  );


  // =========================
  // TOUCH MOVE
  // =========================
  document.addEventListener(
    "touchmove",
    function(e){

      if(
        !isDragging ||
        !canSwipe
      ) return;

      const popup =
        document.getElementById(
          "popupCatatanCustomer"
        );

      const content =
        popup?.querySelector(
          ".popup-catatan-content"
        );

      if(!content) return;

      currentY =
        e.touches[0].clientY;

      let moveY =
        currentY - startY;

      // HANYA KE BAWAH
      if(moveY > 0){

        content.style.transform =
          `translateY(${moveY}px)`;
      }

    },
    { passive:true }
  );


  // =========================
  // TOUCH END
  // =========================
  document.addEventListener(
    "touchend",
    function(){

      if(
        !isDragging ||
        !canSwipe
      ) return;

      const popup =
        document.getElementById(
          "popupCatatanCustomer"
        );

      const content =
        popup?.querySelector(
          ".popup-catatan-content"
        );

      if(!content) return;

      let moveY =
        currentY - startY;

      content.style.transition =
        "0.3s ease";

      // CLOSE
      if(moveY > 120){

        content.style.transform =
          "translateY(100%)";

        setTimeout(()=>{

          popup.classList.remove(
            "active"
          );

          content.style.transform =
            "";

        },250);

      }else{

        // BALIK NORMAL
        content.style.transform =
          "";
      }

      isDragging = false;

      canSwipe = false;

    }
  );

})();