window.initInputView =
async function(){

  console.log("📝 Input View");


  // =========================
  // ELEMENT
  // =========================
  const hariEl =
    document.getElementById(
      "inputHari"
    );

  const bawaEl =
    document.getElementById(
      "inputBawaBarang"
    );

  const listCustomerEl =
    document.getElementById(
      "listCustomer"
    );
  
  const inputDetailBtn =
    document.getElementById(
      "inputDetailBtn"
    );
  
  const popupHeaderDetailOverlay =
    document.getElementById(
      "popupHeaderDetailOverlay"
    );
  
  const popupHeaderDetailBody =
    document.getElementById(
      "popupHeaderDetailBody"
    );  
  // =========================
  // PROGRESS BAR
  // =========================
  const progressBarEl =
    document.getElementById(
      "inputProgressBar"
    );
  
  const progressToggleEl =
    document.getElementById(
      "inputProgressToggle"
    );
  
  const progressTextEl =
    document.getElementById(
      "inputProgressText"
    );
  
  const progressFillEl =
    document.getElementById(
      "inputProgressFill"
    );
  
  const searchCustomerEl =
    document.getElementById(
      "inputSearchCustomer"
    );
  
  // =========================
  // POPUP CATATAN CUSTOMER
  // =========================
  const popupCatatanOverlay =
    document.getElementById(
      "popupCatatanCustomer"
    );
  
  const popupCatatanNama =
    document.getElementById(
      "popupCatatanNama"
    );
  
  const popupCatatanUpdate =
    document.getElementById(
      "popupCatatanUpdate"
    );
  
  const popupCatatanText =
    document.getElementById(
      "popupCatatanText"
    );
  
  const btnSimpanCatatan =
    document.getElementById(
      "btnSimpanCatatan"
    );  
  // default buka
  let progressClosed =
    false;
    
  // =========================
  // HARI SEKARANG
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

  const now =
    new Date();

  const hariAktif =
    hariNama[now.getDay()];


  // SET HARI
  hariEl.innerText =
    hariAktif;


  try{

    // =========================
    // GET USER
    // =========================
    const uid =
      window.auth.currentUser.uid;

    const userRef =
      window.doc(
        window.db,
        "users",
        uid
      );

    const userSnap =
      await window.getDoc(
        userRef
      );


    // =========================
    // USER TIDAK ADA
    // =========================
    if(!userSnap.exists()){

      bawaEl.innerHTML = `

        <div class="input-bawa-item expired">
          Data user tidak ditemukan
        </div>

      `;

      return;
    }


    // =========================
    // DATA USER
    // =========================
    const userData =
      userSnap.data();

    const bawaBarang =
      userData.bawaBarang || [];
    window.globalBawaBarang =
      bawaBarang;

    // =========================
    // CACHE VARIAN
    // hemat read users
    // =========================
    window.globalVarian =
      userData.varian || [];
      
    // =========================
    // CHECK UPDATE HARI INI
    // =========================
    let isToday = false;

    if(
      userData.bawaBarangUpdate?.seconds
    ){

      const updateDate =
        new Date(
          userData
          .bawaBarangUpdate
          .seconds * 1000
        );

      isToday =
        updateDate.toDateString() ===
        now.toDateString();
    }


    // =========================
    // RENDER
    // =========================
    let html = "";


    bawaBarang.forEach(item=>{

      Object.keys(item)
      .forEach(key=>{

        const data =
          item[key];


        // =========================
        // HANYA YANG AKTIF
        // =========================
        if(
          data?.isAktif === true
        ){

          html += `

            <div class="
              input-bawa-item
              ${!isToday ? 'expired' : ''}
            ">

              ${key}: ${
                data.bawa || 0
              }

            </div>

          `;
        }

      });

    });


    // =========================
    // EMPTY
    // =========================
    if(!html){

      html = `

        <div class="input-bawa-item">
          Belum ada barang aktif
        </div>

      `;
    }
    
    // =========================
    // WARNING BELUM UPDATE
    // =========================
    if(!isToday){
    
      html += `
    
        <div class="input-warning">
    
          ⚠ Bawa barang belum di perbarui,
          hubungi admin
    
        </div>
    
      `;
    }
    
    // =========================
    // RENDER BAWA BARANG
    // =========================
    bawaEl.innerHTML =
      html;
    
    
    // =========================
    // LOAD CUSTOMER
    // =========================
    const customerQuery =
      window.query(
    
        window.collection(
          window.db,
          "customer"
        ),
    
        window.where(
          "pemilik",
          "==",
          uid
        ),
    
        window.where(
          "status",
          "==",
          true
        ),
    
        // =====================
        // HANYA HARI INI
        // contoh:
        // Senin, Selasa, dst
        // =====================
        window.where(
          "hari",
          "==",
          hariAktif
        )
    
      );
    
    const customerSnap =
      await window.getDocs(
        customerQuery
      );
    
    
    // EMPTY
    if(customerSnap.empty){
    
      listCustomerEl.innerHTML = `
    
        <div class="input-customer-empty">
    
          Belum ada customer
    
        </div>
    
      `;
    
      return;
    }
    
    
    // =========================
    // FORMAT TANGGAL HARI INI
    // =========================
    const today =
      new Date()
      .toISOString()
      .split("T")[0];
    
    // =========================
    // UPDATE PROGRESS
    // =========================
    function updateProgress(
      list
    ){
    
      const done =
        list.filter(
          x=>x.sudahInput
        ).length;
    
      const total =
        list.length;
    
      progressTextEl.innerText =
        `${done} / ${total} Toko`;
    
      const percent =
        total === 0
          ? 0
          : (done / total) * 100;
    
      progressFillEl.style.width =
        percent + "%";
    }
    
    // =========================
    // AMBIL CUSTOMER + CHECK
    // SUDAH INPUT ATAU BELUM
    // =========================
    window.inputSummaryData = {
    
      pembayaran: 0,
    
      expired: {},
    
      fee: {},
    
      disable: {}
    };    
    const customerList = [];
    
    for(const docSnap of customerSnap.docs){
    
      const data =
        docSnap.data();
    
      // =====================
      // CHECK DATA HARIAN
      // =====================
      let sudahInput =
        false;
      
      let hasFee =
        false;
      
      let hasDisable =
        false;
      
      let statusBadge =
        "";
    
      try{
    
        const dataRef =
          window.doc(
    
            window.db,
    
            "customer",
    
            data.idCustomer ||
            docSnap.id,
    
            "dataHarian",
    
            today
          );
    
        const dataSnap =
          await window.getDoc(
            dataRef
          );
    
        sudahInput =
          dataSnap.exists();
        
        if(dataSnap.exists()){
        
          const dataHarian =
            dataSnap.data()
            || {};
          // =====================
          // AKUMULASI DETAIL
          // =====================
          window
          .inputSummaryData
          .pembayaran +=
          
            Number(
              dataHarian
              ?.pembayaran
              ?.bayarKonsumen || 0
            );
          
          // expired
          Object.entries(
            dataHarian.expired || {}
          )
          .forEach(([key,val])=>{
          
            window
            .inputSummaryData
            .expired[key] =
          
              (
                window
                .inputSummaryData
                .expired[key] || 0
              ) + Number(val);
          });
          
          // fee
          Object.entries(
            dataHarian.fee || {}
          )
          .forEach(([key,val])=>{
          
            window
            .inputSummaryData
            .fee[key] =
          
              (
                window
                .inputSummaryData
                .fee[key] || 0
              ) + Number(val);
          });
          
          // disable
          Object.entries(
            dataHarian.disable || {}
          )
          .forEach(([key,val])=>{
          
            window
            .inputSummaryData
            .disable[key] =
          
              (
                window
                .inputSummaryData
                .disable[key] || 0
              ) + Number(val);
          });        
          // cek ada isi fee
          hasFee =
            Object.keys(
              dataHarian.fee || {}
            ).length > 0;
        
          // cek ada isi disable
          hasDisable =
            Object.keys(
              dataHarian.disable || {}
            ).length > 0;
          
          // status toko
          const status =
            String(
              dataHarian
              ?.keterangan
              ?.status || ""
            )
            .trim()
            .toLowerCase();
          
          if(status === "pending"){
            statusBadge = "PN";
          }
          else if(status === "tutup"){
            statusBadge = "TP";
          }
          else if(status === "putus"){
            statusBadge = "PT";
          }            
        }
    
      }catch(err){
    
        console.log(
          "check input error",
          err
        );
      }
    
      // =====================
      // DATA KEMARIN
      // PRIORITAS:
      // 1. subcollection
      // 2. root customer
      // =====================
      let dataKemarin = {};
      
      try{
      
        const dataRef =
          window.doc(
      
            window.db,
      
            "customer",
      
            data.idCustomer ||
            docSnap.id,
      
            "dataHarian",
      
            today
          );
      
        const dataSnap =
          await window.getDoc(
            dataRef
          );
      
        // PRIORITAS 1
        if(dataSnap.exists()){
      
          const dataHarian =
            dataSnap.data()
            || {};
      
          if(
            dataHarian.dataKemarin
          ){
      
            dataKemarin =
              dataHarian
              .dataKemarin;
          }
        }
      
        // PRIORITAS 2
        if(
          Object.keys(
            dataKemarin
          ).length === 0
        ){
      
          dataKemarin =
            data.dataKemarin
            || {};
        }
      
      }catch(err){
      
        console.log(
          "load dataKemarin error",
          err
        );
      
        dataKemarin =
          data.dataKemarin
          || {};
      }
      
      customerList.push({
      
        ...data,
      
        id:
          docSnap.id,
      
        sudahInput,
      
        hasFee,
      
        hasDisable,
      
        statusBadge,
      
        dataKemarin,
      
        jarak:
          Number(
            data.jarak || 999999
          )
      });
    }
    updateProgress(
      customerList
    );    
    
    // =========================
    // SORTING
    // 1. BELUM INPUT DULU
    // 2. JARAK TERDEKAT
    // =========================
    customerList.sort(
      (a,b)=>{
    
        // belum input di atas
        if(
          a.sudahInput !==
          b.sudahInput
        ){
    
          return a.sudahInput
            ? 1
            : -1;
        }
    
        // jarak kecil dulu
        return a.jarak -
          b.jarak;
      }
    );
    
    
    // =========================
    // RENDER CUSTOMER
    // =========================
    let customerHtml =
      "";
    // =========================
    // REALTIME BADGE UPDATE
    // hemat read:
    // hanya listen customer
    // yang tampil hari ini
    // =========================
    const customerRealtimeMap =
      {};    
    customerList.forEach(data=>{
    
      const customerId =
        data.idCustomer ||
        data.id;
    
      customerHtml += `
      
        <div
          class="
            input-customer-item
            ${
              data.sudahInput
                ? "done"
                : ""
            }
          "
        
          data-customer-id="${
            customerId
          }"
        
          data-customer='${JSON.stringify(data)
            .replace(
              /'/g,
              "&apos;"
            )}'
        
          onclick='openPopupInputData(
            ${JSON.stringify(data)
              .replace(
                /'/g,
                "&apos;"
              )}
          )'>
      
          <div
            class="input-customer-left">
      
            <div class="
              input-customer-foto-wrapper
            ">
            
              ${
                data.catatan?.pesan?.trim()
                ? `
                  <div
                    class="
                      customer-note-badge
                    "
                    onclick="
                      event.stopPropagation();
                  
                      openPopupCatatanCustomer(
                        '${
                          data.idCustomer ||
                          data.id
                        }',
                        '${
                          (
                            data.namaCustomer ||
                            '-'
                          ).replace(/'/g,"\\'")
                        }'
                      );
                    "
                  >
                  
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style="
                        color:#fff;
                      ">
                  
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  
                    </svg>
                  
                  </div>
                `
                : ''
              }
            
              <img
                src="${
                  data.foto ||
                  'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(
                    data.namaCustomer ||
                    'C'
                  )
                }"
                class="
                  input-customer-foto
                "
              
                onclick="
                  event.stopPropagation();
              
                  openPreviewFoto(
                    '${
                      (
                        data.foto ||
                        'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(
                          data.namaCustomer ||
                          'C'
                        )
                      ).replace(/'/g, "\\'")
                    }'
                  );
                "
              >
            
              ${
                data.isNew === true
                ? `
                  <div class="
                    customer-badge-new
                  ">
                    NEW
                  </div>
                `
                : ''
              }
            
            </div>
      
            <div class="
              input-customer-info
            ">
      
              <div class="
                input-customer-nama-wrapper
              ">
              
                <div class="
                  input-customer-nama
                ">
                
                  ${
                    data.namaCustomer
                    || "-"
                  }
                
                </div>
              
                <div
                  class="
                    input-customer-badge-wrap
                  "
                
                  id="badge-${
                    customerId
                  }"
                >
              
                  ${
                    data.hasFee
                    ? `
                      <div
                        class="
                          customer-badge
                          fee
                        ">
                        F
                      </div>
                    `
                    : ''
                  }
              
                  ${
                    data.hasDisable
                    ? `
                      <div
                        class="
                          customer-badge
                          disable
                        ">
                        D
                      </div>
                    `
                    : ''
                  }
                  ${
                    data.statusBadge
                    ? `
                      <div
                        class="
                          customer-badge
                          ${
                            data.statusBadge === "PN"
                              ? "pending"
                              : data.statusBadge === "TP"
                              ? "tutup"
                              : "putus"
                          }
                        ">
                        ${
                          data.statusBadge
                        }
                      </div>
                    `
                    : ''
                  }              
                </div>
              
              </div>
              
              <!-- DATA KEMARIN -->
              <div class="input-customer-kemarin">
              
                ${
                  (()=>{
              
                    let kemarinHtml = "";
              
                    (
                      window.globalBawaBarang || []
                    ).forEach(item=>{
              
                      Object.keys(item)
                      .forEach(key=>{
              
                        const barang =
                          item[key];
              
                        // hanya aktif
                        if(
                          barang?.isAktif === true
                        ){
              
                          const qty =
                            data
                            ?.dataKemarin?.[
                              key
                            ]?.qty || 0;
              
                          kemarinHtml += `
              
                            <div class="
                              input-customer-kemarin-item
                            ">
              
                              ${key}: ${qty}
              
                            </div>
              
                          `;
                        }
                      });
                    });
              
                    return kemarinHtml;
              
                  })()
                }
              
              </div>
              
              <div class="
                input-customer-jarak
              ">
              
                ${Number(
                  data.jarak || 0
                ).toFixed(2)}
                km
              
              </div>
      
            </div>
      
          </div>
      
          <!-- RIGHT ACTION -->
          <div class="input-action-right">
          
            <!-- CATATAN -->
            <button
              class="input-catatan-btn"
              onclick="
                event.stopPropagation();
          
                openPopupCatatanCustomer(
                  '${
                    data.idCustomer ||
                    data.id
                  }',
                  '${
                    (
                      data.namaCustomer ||
                      '-'
                    ).replace(/'/g,'\\\'')
                  }'
                );
              ">
            
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
            
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            
              </svg>
            
            </button>
          
            <!-- MAP -->
            <button
              class="input-map-btn"
              onclick="
                event.stopPropagation();
          
                window.open(
                  'https://www.google.com/maps?q=${
                    data
                    .lokasiCustomer
                    ?.latitude || 0
                  },${
                    data
                    .lokasiCustomer
                    ?.longitude || 0
                  }',
                  '_blank'
                );
              ">
            
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
            
                <path d="M21 10c0 7-9 13-9 13-9-6-9-13a9 9 0 0 1 18 0z"></path>
            
                <circle
                  cx="12"
                  cy="10"
                  r="3">
                </circle>
            
              </svg>
            
            </button>
          
          </div>
      
        </div>
      
      `;
    });
    
    
    // =========================
    // RENDER
    // =========================
    listCustomerEl.innerHTML =
      customerHtml;
    // =========================
    // REALTIME BADGE
    // FEE / DISABLE
    // hemat read:
    // hanya customer aktif
    // =========================
    customerList.forEach(data=>{
    
      const customerId =
        data.idCustomer ||
        data.id;
    
      const docRef =
        window.doc(
    
          window.db,
    
          "customer",
    
          customerId,
    
          "dataHarian",
    
          today
        );
    
      customerRealtimeMap[
        customerId
      ] =
        window.onSnapshot(
    
          docRef,
    
          snap=>{
    
            const badgeEl =
              document.getElementById(
                `badge-${customerId}`
              );
    
            if(!badgeEl)
              return;
    
            let hasFee =
              false;
            
            let hasDisable =
              false;
            
            let statusBadge =
              "";
            
            let statusClass =
              "";
    
            if(
              snap.exists()
            ){
    
              const dataHarian =
                snap.data()
                || {};
    
              hasFee =
                Object.keys(
                  dataHarian.fee
                  || {}
                ).length > 0;
    
              hasDisable =
                Object.keys(
                  dataHarian.disable
                  || {}
                ).length > 0;
                const status =
                  String(
                    dataHarian
                    ?.keterangan
                    ?.status || ""
                  )
                  .trim()
                  .toLowerCase();
                
                if(status === "pending"){
                  statusBadge = "PN";
                  statusClass = "pending";
                }
                else if(status === "tutup"){
                  statusBadge = "TP";
                  statusClass = "tutup";
                }
                else if(status === "putus"){
                  statusBadge = "PT";
                  statusClass = "putus";
                }                
            }
    
            badgeEl.innerHTML =
              `
                ${
                  hasFee
                  ? `
                    <div
                      class="
                        customer-badge
                        fee
                      "
                    >
                      F
                    </div>
                  `
                  : ""
                }
    
                ${
                  hasDisable
                  ? `
                    <div
                      class="
                        customer-badge
                        disable
                      "
                    >
                      D
                    </div>
                  `
                  : ""
                }
                
                ${
                  statusBadge
                  ? `
                    <div
                      class="
                        customer-badge
                        ${statusClass}
                      "
                    >
                      ${statusBadge}
                    </div>
                  `
                  : ""
                }
              `;
          }
        );
    });      
    // =========================
    // LONG PRESS CUSTOMER
    // =========================
    document
    .querySelectorAll(
      ".input-customer-item"
    )
    .forEach(item=>{
    
      let pressTimer;
    
      item.addEventListener(
        "touchstart",
        function(){
    
          pressTimer =
            setTimeout(()=>{
    
              const data =
                JSON.parse(
                  this.dataset.customer
                  .replace(
                    /&apos;/g,
                    "'"
                  )
                );
    
              openPopupInputFd(
                data
              );
    
            },600);
        }
      );
    
      item.addEventListener(
        "touchend",
        ()=>{
          clearTimeout(
            pressTimer
          );
        }
      );
    
      item.addEventListener(
        "touchmove",
        ()=>{
          clearTimeout(
            pressTimer
          );
        }
      );
    });      
    // =========================
    // SWIPE DOWN CLOSE
    // POPUP INPUT FD
    // =========================
    let fdStartY = 0;
    let fdCurrentY = 0;
    let fdDragging = false;
    
    popupInputFdSheet
    ?.addEventListener(
      "touchstart",
      function(e){
    
        fdStartY =
          e.touches[0]
          .clientY;
    
        fdDragging =
          true;
    
        popupInputFdSheet
          .style.transition =
            "none";
      }
    );
    
    popupInputFdSheet
    ?.addEventListener(
      "touchmove",
      function(e){
    
        if(
          !fdDragging
        ) return;
    
        fdCurrentY =
          e.touches[0]
          .clientY
          -
          fdStartY;
    
        // cuma boleh swipe bawah
        if(
          fdCurrentY > 0
        ){
    
          popupInputFdSheet
            .style.transform =
              `translateY(
                ${fdCurrentY}px
              )`;
        }
      }
    );
    
    popupInputFdSheet
    ?.addEventListener(
      "touchend",
      function(){
    
        fdDragging =
          false;
    
        popupInputFdSheet
          .style.transition =
            "transform .18s ease";
    
        // cukup jauh → close
        if(
          fdCurrentY > 90
        ){
    
          popupInputFdOverlay
            .classList.remove(
              "active"
            );
    
          // reset
          setTimeout(()=>{
    
            popupInputFdSheet
              .style.transform =
                "";
    
          },180);
    
        }else{
    
          // balik lagi
          popupInputFdSheet
            .style.transform =
              "";
        }
    
        fdCurrentY = 0;
      }
    );
    // =========================
    // KEYBOARD FIX ANDROID
    // progress bar naik
    // tanpa resize halaman
    // =========================
    if(window.visualViewport){
    
      const updateKeyboard =
        ()=>{
    
          const viewport =
            window.visualViewport;
    
          const keyboardHeight =
            window.initialAppHeight -
            viewport.height;
    
          // keyboard buka
          if(keyboardHeight > 120){
    
            progressBarEl.style.bottom =
              `${keyboardHeight}px`;
    
          }else{
    
            progressBarEl.style.bottom =
              "0px";
          }
        };
    
      window.visualViewport
        .addEventListener(
          "resize",
          updateKeyboard
        );
    
      updateKeyboard();
    }    
    // =========================
    // SEARCH CUSTOMER
    // =========================
    searchCustomerEl.oninput =
    function(){
    
      const keyword =
        this.value
        .toLowerCase()
        .trim();
    
      const items =
        document.querySelectorAll(
          ".input-customer-item"
        );
    
      items.forEach(item=>{
    
        const nama =
          item.innerText
          .toLowerCase();
    
        item.style.display =
          nama.includes(keyword)
            ? "flex"
            : "none";
      });
    }; 
    
    // =========================
    // RENDER HTML
    // =========================
    bawaEl.innerHTML =
      html;
    
    // =========================
    // TOGGLE PROGRESS BAR
    // =========================
    progressToggleEl.onclick =
    function(){
    
      progressClosed =
        !progressClosed;
    
      progressBarEl
        .classList.toggle(
          "closed",
          progressClosed
        );
    };
    
  }catch(err){

    console.log(err);

    bawaEl.innerHTML = `

      <div class="input-bawa-item expired">
        Gagal memuat data
      </div>

    `;
  }
  
  // =========================
  // PREVIEW FOTO CUSTOMER
  // =========================
  window.openPreviewFoto =
  function(src){
  
    const overlay =
      document.getElementById(
        "previewFotoOverlay"
      );
  
    const img =
      document.getElementById(
        "previewFotoImg"
      );
  
    img.src = src;
  
    overlay.classList.add(
      "active"
    );
  };
  // =========================
  // CLOSE POPUP CATATAN
  // =========================
  popupCatatanOverlay
  ?.addEventListener(
    "click",
    function(e){
  
      if(
        e.target ===
        popupCatatanOverlay
      ){
  
        popupCatatanOverlay
          .classList.remove(
            "active"
          );
  
        // stop realtime
        if(
          window
          .catatanUnsubscribe
        ){
  
          window
            .catatanUnsubscribe();
  
          window
            .catatanUnsubscribe =
              null;
        }
      }
    }
  );  
  // CLOSE
  document.addEventListener(
    "click",
    function(e){
  
      const overlay =
        document.getElementById(
          "previewFotoOverlay"
        );
  
      if(
        e.target === overlay
      ){
  
        overlay.classList.remove(
          "active"
        );
      }
    }
  );
  
  // =========================
  // POPUP CATATAN CUSTOMER
  // REALTIME
  // =========================
  window.catatanUnsubscribe =
    null;
  
  window.openPopupCatatanCustomer =
  function(
    customerId,
    namaCustomer
  ){
  
    // buka popup
    popupCatatanOverlay
      .classList.add(
        "active"
      );
  
    // set nama
    popupCatatanNama.innerText =
      namaCustomer || "-";
  
    popupCatatanText.value =
      "";
  
    popupCatatanUpdate.innerText =
      "Update: -";
  
    // stop listener lama
    if(
      window.catatanUnsubscribe
    ){
      window
        .catatanUnsubscribe();
    }
  
    const customerRef =
      window.doc(
        window.db,
        "customer",
        customerId
      );
  
    // =====================
    // REALTIME LISTENER
    // =====================
    window.catatanUnsubscribe =
      window.onSnapshot(
        customerRef,
        snap=>{
  
          if(
            !snap.exists()
          ) return;
  
          const data =
            snap.data();
  
          const catatan =
            data.catatan || {};
  
          popupCatatanText.value =
            catatan.pesan || "";
  
          // format waktu
          if(
            catatan.updateAt
              ?.seconds
          ){
  
            const date =
              new Date(
                catatan
                .updateAt
                .seconds * 1000
              );
  
            popupCatatanUpdate
              .innerText =
                "Update: " +
                date.toLocaleString(
                  "id-ID"
                );
  
          }else{
  
            popupCatatanUpdate
              .innerText =
                "Update: -";
          }
        }
      );
  
    // =====================
    // SIMPAN
    // =====================
    btnSimpanCatatan.onclick =
    async function(){
  
      try{
  
        btnSimpanCatatan
          .disabled = true;
  
        document
          .getElementById(
            "btnSimpanCatatanText"
          )
          .innerText =
            "Menyimpan...";
  
        await window.updateDoc(
  
          customerRef,
  
          {
            catatan:{
              pesan:
                popupCatatanText
                .value
                .trim(),
  
              updateAt:
                window
                .serverTimestamp()
            }
          }
        );
  
      }catch(err){
  
        console.log(err);
  
        alert(
          "Gagal update catatan"
        );
  
      }finally{
  
        btnSimpanCatatan
          .disabled =
            false;
  
        document
          .getElementById(
            "btnSimpanCatatanText"
          )
          .innerText =
            "Simpan";
      }
    };
  };  
  
  // =========================
  // OPEN POPUP INPUT FD
  // =========================
  window.openPopupInputFd =
  async function(data){
  
    const overlay =
      document.getElementById(
        "popupInputFdOverlay"
      );
  
    const sheet =
      document.getElementById(
        "popupInputFdSheet"
      );
  
    const namaEl =
      document.getElementById(
        "popupInputFdNama"
      );
  
    const bodyEl =
      document.getElementById(
        "popupInputFdBody"
      );
  
    const submitBtn =
      document.getElementById(
        "popupInputFdSubmit"
      );
  
    namaEl.innerText =
      data.namaCustomer || "-";
  
    const today =
      new Date()
      .toISOString()
      .split("T")[0];
  
    // =====================
    // LOAD EXISTING
    // =====================
    let existingData = {};
  
    try{
  
      const docRef =
        window.doc(
          window.db,
          "customer",
          data.idCustomer || data.id,
          "dataHarian",
          today
        );
  
      const snap =
        await window.getDoc(docRef);
  
      if(snap.exists()){
        existingData =
          snap.data() || {};
      }
  
    }catch(err){
      console.log(err);
    }
  
    // =====================
    // RENDER INPUT
    // =====================
    const bawaBarang =
      window.globalBawaBarang || [];
  
    let html = "";
  
    ["Fee","Disable"]
    .forEach(group=>{
  
      const keyGroup =
        group.toLowerCase();
  
      html += `
        <div class="
          popup-group
          ${keyGroup}
        ">
          <div class="
            popup-group-title
          ">
            ${group}
          </div>
          <div class="
            popup-group-list
          ">
      `;
  
      bawaBarang.forEach(item=>{
  
        Object.keys(item)
        .forEach(key=>{
  
          const barang = item[key];
  
          if(barang?.isAktif === true){
  
            const preload =
              existingData?.[
                keyGroup
              ]?.[key];
  
            html += `
              <div class="
                popup-input-item
              ">
                <input
                  type="number"
                  min="0"
                  placeholder="${key}"
                  value="${preload ?? ""}"
                  class="
                    popup-input-number
                    popup-fd-input
                  "
                >
              </div>
            `;
          }
        });
      });
  
      html += `
          </div>
        </div>
      `;
    });
  
    bodyEl.innerHTML = html;
  
    // =====================
    // VALIDASI
    // scope ke bodyEl
    // =====================
    function validate(){
  
      const hasInput =
        [
          ...bodyEl
          .querySelectorAll(
            ".popup-fd-input"
          )
        ]
        .some(
          input =>
            input.value !== ""
        );
  
      submitBtn.disabled =
        !hasInput;
    }
  
    // scope ke bodyEl
    bodyEl
    .querySelectorAll(
      ".popup-fd-input"
    )
    .forEach(input=>{
  
      input.addEventListener(
        "input",
        validate
      );
    });
  
    validate();
  
    // =====================
    // SIMPAN
    // =====================
    submitBtn.onclick =
    async function(){
  
      try{
  
        submitBtn.disabled = true;
        submitBtn.innerText =
          "Menyimpan...";
  
        const fee = {};
        const disable = {};
  
        // scope ke bodyEl
        bodyEl
        .querySelectorAll(
          ".popup-group"
        )
        .forEach(group=>{
  
          const groupName =
            [...group.classList]
            .find(cls=>
              ["fee","disable"]
              .includes(cls)
            );
  
          group
          .querySelectorAll("input")
          .forEach(input=>{
  
            if(input.value !== ""){
  
              const value =
                Number(input.value);
  
              if(groupName === "fee"){
                fee[
                  input.placeholder
                ] = value;
              }
  
              if(groupName === "disable"){
                disable[
                  input.placeholder
                ] = value;
              }
            }
          });
        });
  
        const docRef =
          window.doc(
            window.db,
            "customer",
            data.idCustomer || data.id,
            "dataHarian",
            today
          );
  
        await window.setDoc(
          docRef,
          {
            fee,
            disable,
            updatedAt:
              window.serverTimestamp()
          },
          { merge: true }
        );
  
        overlay.classList
        .remove("active");
  
      }catch(err){
  
        console.log(err);
        alert("Gagal simpan");
  
      }finally{
  
        submitBtn.disabled = false;
        submitBtn.innerText = "Simpan";
      }
    };
  
    // SHOW
    overlay.classList.add("active");
  
    // =====================
    // GHOST CLICK PROTECTION
    // =====================
    let overlayClickReady = false;
  
    setTimeout(()=>{
      overlayClickReady = true;
    }, 350);
  
    // CLOSE
    overlay.onclick =
    function(e){
  
      if(!overlayClickReady) return;
  
      if(e.target === overlay){
        overlay.classList
        .remove("active");
      }
    };
  };
  
  
  // =========================
  // OPEN POPUP INPUT DATA
  // =========================
  window.openPopupInputData =
  async function(data){
  
    const overlay =
      document.getElementById(
        "popupInputOverlay"
      );
  
    const sheet =
      document.getElementById(
        "popupInputSheet"
      );
  
    const namaEl =
      document.getElementById(
        "popupInputNama"
      );
  
    const barangEl =
      document.getElementById(
        "popupInputBarang"
      );
  
    // NAMA
    namaEl.innerText =
      data.namaCustomer || "-";
  
    // =========================
    // BAWA BARANG
    // =========================
    const bawaBarang =
      window.globalBawaBarang || [];
  
    // =========================
    // CHECK DATA HARI INI
    // jika sudah input,
    // preload agar bisa edit
    // =========================
    let existingData = null;
    let isExistingDoc = false;
  
    try{
  
      const today =
        new Date()
        .toISOString()
        .split("T")[0];
  
      const todayRef =
        window.doc(
          window.db,
          "customer",
          data.idCustomer || data.id,
          "dataHarian",
          today
        );
  
      const todaySnap =
        await window.getDoc(todayRef);
  
      if(todaySnap.exists()){
      
        isExistingDoc =
          true;
      
        existingData =
          todaySnap.data();
      
        console.log(
          "✏️ Edit mode:",
          existingData
        );
      }
  
    }catch(err){
  
      console.log(
        "Gagal load data hari ini:",
        err
      );
    }
  
    // =========================
    // DATA KEMARIN
    // PRIORITAS:
    // 1. dataHarian hari ini
    // 2. root customer
    // =========================
    let dataKemarin = {};
  
    try{
  
      const today =
        new Date()
        .toISOString()
        .split("T")[0];
  
      const dataHarianRef =
        window.doc(
          window.db,
          "customer",
          data.idCustomer || data.id,
          "dataHarian",
          today
        );
  
      const dataHarianSnap =
        await window.getDoc(
          dataHarianRef
        );
  
      // PRIORITAS 1 subcollection
      if(dataHarianSnap.exists()){
  
        const dataHarian =
          dataHarianSnap.data() || {};
  
        if(dataHarian.dataKemarin){
          dataKemarin =
            dataHarian.dataKemarin;
        }
      }
  
      // PRIORITAS 2 fallback root
      if(
        Object.keys(dataKemarin)
        .length === 0
      ){
        dataKemarin =
          data.dataKemarin || {};
      }
  
    }catch(err){
  
      console.log(
        "Gagal load dataKemarin:",
        err
      );
  
      dataKemarin =
        data.dataKemarin || {};
    }
  
  
    // =========================
    // HEADER DATA KEMARIN
    // =========================
    let kemarinHtml = "";
  
    bawaBarang.forEach(item=>{
  
      Object.keys(item)
      .forEach(key=>{
  
        const barang = item[key];
  
        if(barang?.isAktif === true){
  
          const qty =
            dataKemarin?.[key]?.qty || 0;
  
          kemarinHtml += `
            <div class="popup-kemarin-item">
              ${key}: ${qty}
            </div>
          `;
        }
      });
    });
  
    const kemarinEl =
      document.getElementById(
        "popupDataKemarin"
      );
  
    kemarinEl.innerHTML = kemarinHtml;
  
  
    // =========================
    // GROUP INPUT
    // =========================
    const tipeList = [
      "Return",
      "Expired",
      "Konsinyasi",
      "Cash",
      "Lainnya"
    ];
  
    let html = "";
  
    tipeList.forEach(tipe=>{
  
      const className =
        tipe.toLowerCase();
  
      html += `
        <div class="
          popup-group
          ${className}
        ">
          <div class="popup-group-title">
            ${tipe}
          </div>
          <div class="popup-group-list">
      `;
  
      bawaBarang.forEach(item=>{
  
        Object.keys(item)
        .forEach(key=>{
  
          const barang = item[key];
  
          if(barang?.isAktif === true){
  
            const qtyKemarin =
              dataKemarin?.[key]?.qty || 0;
  
            const hasKemarin =
              qtyKemarin > 0;
  
            const preloadValue =
              existingData?.[
                tipe.toLowerCase()
              ]?.[key];
  
            html += `
              <div class="popup-input-item">
                <input
                  type="number"
                  min="0"
                  placeholder="${key}"
                  value="${preloadValue ?? ""}"
                  class="
                    popup-input-number
                    ${hasKemarin ? 'active-kemarin' : ''}
                  "
                >
              </div>
            `;
          }
        });
      });
  
      html += `
          </div>
        </div>
      `;
    });
  
  
    barangEl.innerHTML =
      html +
      `
      <!-- FOTO -->
      <div
        class="popup-foto-wrapper"
        id="popupFotoWrapper"
        style="display:none;">
  
        <div
          class="popup-foto-card"
          id="popupFotoCard">
  
          <img
            id="popupFotoPreview"
            class="popup-foto-preview"
          >
  
          <div
            class="popup-foto-placeholder"
            id="popupFotoPlaceholder">
  
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2">
  
              <path d="M23 19V7a2 2 0 0 0-2-2h-3l-2-2H8L6 5H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z"></path>
  
              <circle cx="12" cy="13" r="4"></circle>
  
            </svg>
  
            <div>Tambah Foto Bukti</div>
  
          </div>
  
        </div>
  
        <input
          type="file"
          id="popupCameraInput"
          accept="image/*"
          capture="environment"
          hidden
        >
  
      </div>
  
  
      <!-- STATUS -->
      <div
        class="popup-status-wrapper"
        id="popupStatusWrapper"
        style="display:none;">
  
        <label class="popup-status-item tutup">
          <input
            type="radio"
            name="customerStatus"
            value="tutup"
          >
          <span>Tutup</span>
        </label>
  
        <label class="popup-status-item pending">
          <input
            type="radio"
            name="customerStatus"
            value="pending"
          >
          <span>Pending</span>
        </label>
  
        <label class="popup-status-item putus">
          <input
            type="radio"
            name="customerStatus"
            value="putus"
          >
          <span>Putus</span>
        </label>
  
      </div>
    `;
  
  
    // =========================
    // SEMUA REF ELEMENT
    // scope ke barangEl
    // =========================
  
    // lainnya inputs
    const lainnyaInputs =
      barangEl.querySelectorAll(
        ".popup-group.lainnya .popup-input-number"
      );
  
    const fotoWrapper =
      document.getElementById(
        "popupFotoWrapper"
      );
  
    const fotoCard =
      document.getElementById(
        "popupFotoCard"
      );
  
    const cameraInput =
      document.getElementById(
        "popupCameraInput"
      );
  
    const fotoPreview =
      document.getElementById(
        "popupFotoPreview"
      );
  
    const fotoPlaceholder =
      document.getElementById(
        "popupFotoPlaceholder"
      );
  
    const statusWrapper =
      document.getElementById(
        "popupStatusWrapper"
      );
  
    // scope ke barangEl
    const statusItems =
      barangEl.querySelectorAll(
        ".popup-status-item"
      );
  
    // scope ke barangEl
    const statusRadios =
      barangEl.querySelectorAll(
        'input[name="customerStatus"]'
      );
  
    const submitBtn =
      document.getElementById(
        "popupSubmitBtn"
      );
  
    // scope ke barangEl
    const allInputs =
      barangEl.querySelectorAll(
        ".popup-input-number"
      );
  
  
    // =========================
    // PREVIEW REALTIME
    // =========================
    function updateRealtimePreview(){
  
      const previewPay =
        document.getElementById(
          "previewPay"
        );
  
      const groupData = {
        return:{},
        expired:{},
        konsinyasi:{},
        cash:{},
        lainnya:{}
      };
  
      // scope ke barangEl
      barangEl
      .querySelectorAll(".popup-group")
      .forEach(group=>{
  
        const groupName =
          [...group.classList]
          .find(cls=>
            [
              "return","expired",
              "konsinyasi","cash","lainnya"
            ].includes(cls)
          );
  
        if(!groupName) return;
  
        group
        .querySelectorAll(
          ".popup-input-number"
        )
        .forEach(input=>{
  
          const key = input.placeholder;
          const value =
            Number(input.value || 0);
  
          if(value > 0){
            groupData[groupName][key] =
              value;
          }
        });
      });
  
      const varianMap = {};
  
      (window.globalVarian || [])
      .forEach(item=>{
        Object.keys(item)
        .forEach(key=>{
          varianMap[key] = item[key];
        });
      });
  
      // HITUNG CLOSING
      let totalClosing = 0;
  
      const closingKeys =
        new Set([
          ...Object.keys(
            groupData.konsinyasi
          ),
          ...Object.keys(
            groupData.return
          ),
          ...Object.keys(
            groupData.cash
          )
        ]);
  
      closingKeys.forEach(key=>{
  
        const qty =
          Number(
            groupData.konsinyasi?.[key] || 0
          ) -
          Number(
            groupData.return?.[key] || 0
          ) +
          Number(
            groupData.cash?.[key] || 0
          );
  
        const harga =
          Number(
            varianMap[key]?.hargaProduksi || 0
          );
  
        totalClosing += qty * harga;
      });
  
      // HITUNG PAY
      let totalPay = 0;
  
      const payKeys =
        new Set([
          ...Object.keys(dataKemarin || {}),
          ...Object.keys(groupData.return),
          ...Object.keys(groupData.expired),
          ...Object.keys(groupData.cash),
          ...Object.keys(groupData.lainnya)
        ]);
  
      payKeys.forEach(key=>{
  
        const payQty =
          Number(
            dataKemarin?.[key]?.qty || 0
          ) -
          Number(
            groupData.return?.[key] || 0
          ) -
          Number(
            groupData.expired?.[key] || 0
          ) +
          Number(
            groupData.cash?.[key] || 0
          ) -
          Number(
            groupData.lainnya?.[key] || 0
          );
  
        const harga =
          Number(
            varianMap[key]?.hargaKonsumen || 0
          );
  
        totalPay += payQty * harga;
      });
  
      previewPay.innerText =
        "Rp" +
        totalPay.toLocaleString("id-ID");
    }
  
  
    // =========================
    // COMPRESS FOTO BASE64
    // =========================
    async function compressImage(file){
  
      return new Promise(resolve=>{
  
        const reader = new FileReader();
  
        reader.onload = function(e){
  
          const img = new Image();
  
          img.onload = function(){
  
            const canvas =
              document.createElement("canvas");
  
            const ctx =
              canvas.getContext("2d");
  
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
  
            if(width > height){
              if(width > maxSize){
                height *= maxSize / width;
                width = maxSize;
              }
            }else{
              if(height > maxSize){
                width *= maxSize / height;
                height = maxSize;
              }
            }
  
            canvas.width = width;
            canvas.height = height;
  
            ctx.drawImage(img, 0, 0, width, height);
  
            resolve(
              canvas.toDataURL("image/jpeg", 0.6)
            );
          };
  
          img.src = e.target.result;
        };
  
        reader.readAsDataURL(file);
      });
    }
  
  
    // =========================
    // SIMPAN FIRESTORE
    // =========================
    async function saveToFirestore(groupData){
  
      try{
  
        submitBtn.disabled = true;
        submitBtn.innerText = "Menyimpan...";
  
        const uid =
          window.auth.currentUser.uid;
  
        const userSnap =
          await window.getDoc(
            window.doc(window.db, "users", uid)
          );
  
        const userData =
          userSnap.data() || {};
  
        const today =
          new Date()
          .toISOString()
          .split("T")[0];
          
        const deleteField =
          window.deleteField;
  
        const payload = {
  
          createdAt:
            window.serverTimestamp(),
  
          idCabang:
            userData.idCabang || "",
  
          pemilik: uid,
  
          idCustomer:
            data.idCustomer ||
            data.id ||
            "",
  
          namaCustomer:
            data.namaCustomer || ""
        };
  
        // group data yang ada isi
        Object.keys(groupData)
        .forEach(key=>{
          if(
            Object.keys(
              groupData[key]
            ).length > 0
          ){
            payload[key] = groupData[key];
          }
        });
  
        // =====================
        // CLOSING
        // konsinyasi - return + cash
        // =====================
        payload.closing = {};
  
        const allKeys =
          new Set([
            ...Object.keys(
              groupData.konsinyasi || {}
            ),
            ...Object.keys(
              groupData.return || {}
            ),
            ...Object.keys(
              groupData.cash || {}
            )
          ]);
  
        allKeys.forEach(key=>{
  
          const total =
            Number(
              groupData.konsinyasi?.[key] || 0
            ) -
            Number(
              groupData.return?.[key] || 0
            ) +
            Number(
              groupData.cash?.[key] || 0
            );
  
          payload.closing[key] = total;
        });
  
        // =====================
        // PAY
        // =====================
        payload.pay = {};
  
        const payKeys =
          new Set([
            ...Object.keys(dataKemarin || {}),
            ...Object.keys(groupData.return || {}),
            ...Object.keys(groupData.expired || {}),
            ...Object.keys(groupData.cash || {}),
            ...Object.keys(groupData.lainnya || {})
          ]);
  
        payKeys.forEach(key=>{
  
          const total =
            Number(
              dataKemarin?.[key]?.qty || 0
            ) -
            Number(
              groupData.return?.[key] || 0
            ) -
            Number(
              groupData.expired?.[key] || 0
            ) +
            Number(
              groupData.cash?.[key] || 0
            ) -
            Number(
              groupData.lainnya?.[key] || 0
            );
  
          if(total !== 0){
            payload.pay[key] = total;
          }
        });
  
        if(
          Object.keys(payload.pay).length === 0
        ){
          delete payload.pay;
        }
  
        // =====================
        // PEMBAYARAN
        // =====================
        payload.pembayaran = {
          bayarKonsumen: 0,
          bayarProduksi: 0
        };
  
        const varianMap = {};
  
        (window.globalVarian || [])
        .forEach(item=>{
          Object.keys(item)
          .forEach(key=>{
            varianMap[key] = item[key];
          });
        });
  
        Object.keys(payload.pay || {})
        .forEach(key=>{
  
          payload.pembayaran.bayarKonsumen +=
            Number(payload.pay?.[key] || 0) *
            Number(varianMap?.[key]?.hargaKonsumen || 0);
        });
  
        Object.keys(payload.closing || {})
        .forEach(key=>{
  
          payload.pembayaran.bayarProduksi +=
            Number(payload.closing?.[key] || 0) *
            Number(varianMap?.[key]?.hargaProduksi || 0);
        });
  
        // =====================
        // KETERANGAN
        // hanya jika lainnya
        // ada isi
        // =====================
        const hasLainnya =
          Object.keys(
            groupData.lainnya || {}
          ).length > 0;
        
        if(hasLainnya){
        
          payload.keterangan = {};
        
          if(window.popupStatus){
            payload.keterangan.status =
              window.popupStatus;
          }
        
          if(window.popupFotoLainnya){
        
            // edit mode
            if(
              typeof
              window.popupFotoLainnya
              === "string"
            ){
        
              payload.keterangan.foto =
                window.popupFotoLainnya;
        
            }else{
        
              const compressed =
                await compressImage(
                  window.popupFotoLainnya
                );
        
              payload.keterangan.foto =
                compressed;
            }
          }
        }
  
        // =====================
        // DATA KEMARIN
        // jangan overwrite jika
        // sudah pernah input
        // =====================
        const sudahAdaDataKemarin =
          existingData?.dataKemarin &&
          Object.keys(
            existingData.dataKemarin
          ).length > 0;
  
        if(!sudahAdaDataKemarin){
  
          payload.dataKemarin =
            dataKemarin;
        }
  
        // =====================
        // REF dataHarian
        // =====================
        const docRef =
          window.doc(
            window.db,
            "customer",
            payload.idCustomer,
            "dataHarian",
            today
          );
        
        // =====================
        // BERSIHKAN FIELD LAMA
        // hanya jika document
        // sudah ada (edit mode)
        // =====================
        if(isExistingDoc){
        
          await window.setDoc(
            docRef,
            {
              return: deleteField(),
              expired: deleteField(),
              konsinyasi: deleteField(),
              cash: deleteField(),
              lainnya: deleteField(),
              closing: deleteField(),
              pay: deleteField(),
              pembayaran: deleteField(),
              keterangan: deleteField(),
              dataKemarin: deleteField(),
              updatedAt:
                window.serverTimestamp()
            },
            { merge: true }
          );
        }
        
        // =====================
        // SAVE DATA BARU
        // fee & disable aman
        // karena merge
        // =====================
        await window.setDoc(
          docRef,
          payload,
          { merge: true }
        );
  
        // =====================
        // UPDATE DATA KEMARIN
        // ke root customer
        // qty = konsinyasi + lainnya
        // =====================
        const newDataKemarin = {};
  
        const kemarinKeys =
          new Set([
            ...Object.keys(
              groupData.konsinyasi || {}
            ),
            ...Object.keys(
              groupData.lainnya || {}
            )
          ]);
  
        kemarinKeys.forEach(key=>{
  
          newDataKemarin[key] = {
            qty:
              Number(
                groupData.konsinyasi?.[key] || 0
              ) +
              Number(
                groupData.lainnya?.[key] || 0
              )
          };
        });
  
        const customerRef =
          window.doc(
            window.db,
            "customer",
            payload.idCustomer
          );
  
        await window.updateDoc(
          customerRef,
          { dataKemarin: newDataKemarin }
        );
  
        // =====================
        // UPDATE UI REALTIME
        // =====================
        const customerId =
          payload.idCustomer;
  
        const customerItems =
          document.querySelectorAll(
            ".input-customer-item"
          );
  
        customerItems.forEach(item=>{
  
          const clickAttr =
            item.getAttribute("onclick") || "";
  
          if(clickAttr.includes(customerId)){
  
            item.classList.add("done");
  
            data.sudahInput = true;
  
            listCustomerEl.appendChild(item);
  
            const doneCount =
              document.querySelectorAll(
                ".input-customer-item.done"
              ).length;
  
            const totalCount =
              document.querySelectorAll(
                ".input-customer-item"
              ).length;
  
            progressTextEl.innerText =
              `${doneCount} / ${totalCount} Toko`;
  
            progressFillEl.style.width =
              (doneCount / totalCount) * 100 + "%";
          }
        });
  
        // SUCCESS
        document
        .getElementById("popupInputOverlay")
        .classList.remove("active");
  
      }catch(err){
  
        console.log(err);
        alert("Gagal simpan");
  
      }finally{
  
        submitBtn.disabled = false;
        submitBtn.innerText = "Kirim";
      }
    }
  
  
    // =========================
    // WARNING VALIDATION
    // =========================
    function checkWarningValidation(groupData){
  
      let showWarning = false;
  
      const kemarinData = {};
  
      Object.keys(dataKemarin)
      .forEach(key=>{
  
        const qty =
          dataKemarin[key]?.qty || 0;
  
        if(qty > 0){
          kemarinData[key] = qty;
        }
      });
  
      // RULE 1: cek return
      const kemarinKeys =
        Object.keys(kemarinData);
  
      const returnKeys =
        Object.keys(groupData.return);
  
      if(returnKeys.length > 0){
  
        const sameReturnKey =
          kemarinKeys.length ===
          returnKeys.length &&
  
          kemarinKeys.every(key=>
            returnKeys.includes(key)
          );
  
        if(!sameReturnKey){
          showWarning = true;
        }
      }
  
      // RULE 2: cek konsinyasi
      const konsinyasiKeys =
        Object.keys(groupData.konsinyasi);
  
      if(konsinyasiKeys.length > 0){
  
        const sameKonsinyasi =
          kemarinKeys.length ===
          konsinyasiKeys.length &&
  
          kemarinKeys.every(key=>
            konsinyasiKeys.includes(key) &&
            Number(
              groupData.konsinyasi[key]
            ) ===
            Number(kemarinData[key])
          );
  
        if(!sameKonsinyasi){
          showWarning = true;
        }
      }
  
      return showWarning;
    }
  
  
    // =========================
    // CHECK INPUT LAINNYA
    // =========================
    function checkLainnyaInput(){
  
      let hasValue = false;
  
      lainnyaInputs.forEach(input=>{
        if(input.value !== ""){
          hasValue = true;
        }
      });
  
      fotoWrapper.style.display =
        hasValue ? "flex" : "none";
  
      statusWrapper.style.display =
        hasValue ? "flex" : "none";
  
      if(!hasValue){
          fotoWrapper.style.display =
            "none";
          statusWrapper.style.display =
            "none";  
        window.popupStatus = null;
        window.popupFotoLainnya = null;
  
        fotoPreview.src = "";
        fotoPreview.style.display = "none";
        fotoPlaceholder.style.display = "flex";
        cameraInput.value = "";
  
        statusItems.forEach(item=>
          item.classList.remove("active")
        );
  
        statusRadios.forEach(radio=>{
          radio.checked = false;
        });
      }
  
      validateSubmit();
    }
  
  
    // =========================
    // VALIDASI SUBMIT
    // scope ke barangEl
    // =========================
    function validateSubmit(){
  
      let isValid = true;
  
      const groupData = {
        return:{},
        expired:{},
        konsinyasi:{},
        cash:{},
        lainnya:{}
      };
  
      // scope ke barangEl
      barangEl
      .querySelectorAll(".popup-group")
      .forEach(group=>{
  
        const groupName =
          [...group.classList]
          .find(cls=>
            [
              "return","expired",
              "konsinyasi","cash","lainnya"
            ].includes(cls)
          );
  
        if(!groupName) return;
  
        group
        .querySelectorAll(
          ".popup-input-number"
        )
        .forEach(input=>{
  
          const key = input.placeholder;
          const value = input.value;
  
          if(value !== ""){
            groupData[groupName][key] =
              Number(value);
          }
        });
      });
  
      // RULE 1: harus ada input
      const hasAnyInput =
        Object.values(groupData)
        .some(group=>
          Object.keys(group).length > 0
        );
  
      if(!hasAnyInput) isValid = false;
  
      // RULE 2: return wajib ada
      // konsinyasi/cash/lainnya
      const hasReturn =
        Object.keys(
          groupData.return
        ).length > 0;
  
      if(hasReturn){
  
        if(
          Object.keys(
            groupData.konsinyasi
          ).length === 0 &&
          Object.keys(
            groupData.cash
          ).length === 0 &&
          Object.keys(
            groupData.lainnya
          ).length === 0
        ){
          isValid = false;
        }
      }
  
      // RULE 5: lainnya wajib foto + radio
      const hasLainnya =
        Object.keys(
          groupData.lainnya
        ).length > 0;
  
      if(hasLainnya){
        if(!window.popupFotoLainnya) isValid = false;
        if(!window.popupStatus) isValid = false;
      }
  
      // RULE 6: expired wajib ada
      // konsinyasi/cash/lainnya
      const hasExpired =
        Object.keys(
          groupData.expired
        ).length > 0;
  
      if(hasExpired){
  
        if(
          Object.keys(
            groupData.konsinyasi
          ).length === 0 &&
          Object.keys(
            groupData.cash
          ).length === 0 &&
          Object.keys(
            groupData.lainnya
          ).length === 0
        ){
          isValid = false;
        }
      }
  
      // RULE 7: lainnya + tutup
      // wajib sama dgn data kemarin
      if(hasLainnya){
  
        const status = window.popupStatus;
  
        if(status === "tutup"){
  
          const kemarinData = {};
  
          Object.keys(dataKemarin)
          .forEach(key=>{
  
            const qty =
              dataKemarin[key]?.qty || 0;
  
            if(qty > 0){
              kemarinData[key] = qty;
            }
          });
  
          const lainnyaData =
            groupData.lainnya;
  
          const kKeys =
            Object.keys(kemarinData);
  
          const lKeys =
            Object.keys(lainnyaData);
  
          const sameLength =
            kKeys.length === lKeys.length;
  
          const sameData =
            kKeys.every(key=>
              lKeys.includes(key) &&
              Number(lainnyaData[key]) ===
              Number(kemarinData[key])
            );
  
          if(!sameLength || !sameData){
            isValid = false;
          }
  
        }else if(
          status === "pending" ||
          status === "putus"
        ){
  
          if(
            Object.keys(
              groupData.lainnya
            ).length === 0
          ){
            isValid = false;
          }
        }
      }
  
      submitBtn.disabled = !isValid;
    }
  
  
    // =========================
    // LISTENER INPUT
    // =========================
    lainnyaInputs.forEach(input=>{
      input.addEventListener(
        "input",
        checkLainnyaInput
      );
    });
  
    allInputs.forEach(input=>{
  
      input.addEventListener(
        "input",
        function(){
  
          validateSubmit();
          updateRealtimePreview();
  
          // preload status/foto
          // jika edit mode
          if(existingData?.keterangan){
  
            const savedStatus =
              existingData
              .keterangan
              .status;
  
            if(savedStatus){
  
              const radio =
                barangEl.querySelector(
                  `input[name="customerStatus"][value="${savedStatus}"]`
                );
  
              if(radio){
                radio.checked = true;
                radio.dispatchEvent(
                  new Event("change")
                );
              }
            }
  
            const savedFoto =
              existingData
              .keterangan
              .foto;
  
            if(savedFoto){
  
              fotoWrapper.style.display =
                "flex";
  
              fotoPreview.src = savedFoto;
  
              fotoPreview.style.display =
                "block";
  
              fotoPlaceholder.style.display =
                "none";
              
              window.popupFotoLainnya =
                savedFoto;
            }
          }
  
          validateSubmit();
        }
      );
    });
  
    statusRadios.forEach(radio=>{
  
      radio.addEventListener(
        "change",
        function(){
  
          statusItems.forEach(item=>
            item.classList.remove("active")
          );
  
          this.closest(".popup-status-item")
          .classList.add("active");
  
          window.popupStatus = this.value;
  
          validateSubmit();
        }
      );
    });
  
  
    // =========================
    // OPEN CAMERA
    // =========================
    fotoCard.onclick = function(){
      cameraInput.click();
    };
  
  
    // =========================
    // PREVIEW FOTO
    // =========================
    cameraInput.onchange =
    function(e){
  
      const file = e.target.files[0];
      if(!file) return;
  
      fotoPreview.src =
        URL.createObjectURL(file);
  
      fotoPreview.style.display = "block";
      fotoPlaceholder.style.display = "none";
  
      window.popupFotoLainnya = file;
  
      validateSubmit();
    };
  
  
    // =========================
    // CLICK SUBMIT
    // =========================
    submitBtn.onclick =
    function(){
  
      if(submitBtn.disabled) return;
  
      const groupData = {
        return:{},
        expired:{},
        konsinyasi:{},
        cash:{},
        lainnya:{}
      };
  
      // scope ke barangEl
      barangEl
      .querySelectorAll(".popup-group")
      .forEach(group=>{
  
        const groupName =
          [...group.classList]
          .find(cls=>
            [
              "return","expired",
              "konsinyasi","cash","lainnya"
            ].includes(cls)
          );
  
        if(!groupName) return;
  
        group
        .querySelectorAll(
          ".popup-input-number"
        )
        .forEach(input=>{
  
          const key = input.placeholder;
          const value = input.value;
  
          if(value !== ""){
            groupData[groupName][key] =
              Number(value);
          }
        });
      });
  
      const needWarning =
        checkWarningValidation(groupData);
  
      if(needWarning){
  
        const warningOverlay =
          document.getElementById(
            "popupWarningOverlay"
          );
  
        const btnCancel =
          document.getElementById(
            "popupWarningCancel"
          );
  
        const btnSubmit =
          document.getElementById(
            "popupWarningSubmit"
          );
  
        warningOverlay.classList.add("active");
  
        btnCancel.onclick = function(){
          warningOverlay.classList
          .remove("active");
        };
  
        btnSubmit.onclick = function(){
          warningOverlay.classList
          .remove("active");
          saveToFirestore(groupData);
        };
  
        return;
      }
  
      saveToFirestore(groupData);
    };
  
  
    updateRealtimePreview();
  
  
    // SHOW
    overlay.classList.add("active");
  
    // =====================
    // GHOST CLICK PROTECTION
    // =====================
    let overlayClickReady = false;
  
    setTimeout(()=>{
      overlayClickReady = true;
    }, 350);
  
    // CLOSE OUTSIDE
    overlay.onclick =
    function(e){
  
      if(!overlayClickReady) return;
  
      if(e.target === overlay){
        overlay.classList
        .remove("active");
      }
    };
  
  
    // =========================
    // SWIPE DOWN CLOSE
    // =========================
    let startY = 0;
  
    sheet.addEventListener(
      "touchstart",
      e=>{
        startY = e.touches[0].clientY;
      }
    );
  
    sheet.addEventListener(
      "touchmove",
      e=>{
  
        const diff =
          e.touches[0].clientY - startY;
  
        if(diff > 0){
          sheet.style.transform =
            `translateY(${diff}px)`;
        }
      }
    );
  
    sheet.addEventListener(
      "touchend",
      e=>{
  
        const diff =
          e.changedTouches[0].clientY -
          startY;
  
        if(diff > 120){
  
          overlay.classList
          .remove("active");
  
          sheet.style.transform = "";
  
        }else{
  
          sheet.style.transform = "";
        }
      }
    );
  };
  
  // =========================
  // POPUP DETAIL HEADER
  // =========================
  window.openPopupHeaderDetail =
  function(){
  
    const data =
      window
      .inputSummaryData
      || {};
// =====================
    // AKUMULASI CLOSING
    // closing + fee + disable
    // =====================
    const closingData = {};

    const activeKeys = [];

    (
      window.globalBawaBarang
      || []
    ).forEach(item=>{

      Object.keys(item)
      .forEach(key=>{

        const barang =
          item[key];

        if(
          barang?.isAktif
        ){

          activeKeys.push(
            key
          );
        }
      });
    });

    // =====================
    // AKUMULASI DARI
    // dataHarian.closing
    // =====================
    activeKeys.forEach(key=>{

      closingData[key] = 0;
    });

    (
      window.filteredCustomer
      || window.listCustomerData
      || []
    ).forEach(customer=>{

      const closing =
        customer?.dataHarian
        ?.closing
        || {};

      activeKeys.forEach(key=>{

        closingData[key] +=
          Number(
            closing?.[key]
            || 0
          );
      });
    });

    // =====================
    // TAMBAH FEE
    // =====================
    activeKeys.forEach(key=>{

      closingData[key] +=
        Number(
          data?.fee?.[key]
          || 0
        );
    });

    // =====================
    // TAMBAH DISABLE
    // =====================
    activeKeys.forEach(key=>{

      closingData[key] +=
        Number(
          data?.disable?.[key]
          || 0
        );
    });
// =====================
    // SALDO BARANG
    // bawa - closing
    // =====================
    const saldoBarang = {};

    activeKeys.forEach(key=>{

      let bawa = 0;

      (
        window.globalBawaBarang
        || []
      ).forEach(item=>{

        const barang =
          item?.[key];

        if(
          barang?.isAktif
        ){

          bawa =
            Number(
              barang.bawa
              || 0
            );
        }
      });

      saldoBarang[key] =
        bawa
        -
        Number(
          closingData[key]
          || 0
        );
    });
    let html = "";
  
    // =====================
    // BAWA BARANG
    // =====================
    html += `
      <div class="popup-detail-section">
    
        <div class="
          popup-detail-section-title
        ">
          Bawa Barang
        </div>
    
        <div class="
          popup-detail-inline-list
        ">
    `;
  
    (
      window
      .globalBawaBarang || []
    ).forEach(item=>{
  
      Object.keys(item)
      .forEach(key=>{
  
        const barang =
          item[key];
  
        if(
          barang?.isAktif
        ){
  
          html += `
            <div
              class="
                popup-kemarin-item
              ">
  
              ${key}:
              ${
                barang.bawa || 0
              }
  
            </div>
          `;
        }
      });
    });
  
    html += `
        </div>
      </div>
    `;
  
    // =====================
    // PEMBAYARAN
    // =====================
    html += `
      <div class="
        popup-detail-section
      ">
    
        <div class="
          popup-detail-section-title
        ">
          Jumlah Pembayaran
        </div>
    
        <div class="
          popup-detail-inline-list
        ">
    
          <div
            class="
              popup-detail-chip
              payment
            ">
    
            Rp${Number(
              data.pembayaran || 0
            ).toLocaleString(
              "id-ID"
            )}
    
          </div>
    
        </div>
    
      </div>
    `;
  
    // helper render
    function renderGroup(
      title,
      obj,
      type = ""
    ){
    
      html += `
        <div class="
          popup-detail-section
          ${type}
        ">
    
          <div class="
            popup-detail-section-title
          ">
            ${title}
          </div>
    
          <div class="
            popup-detail-inline-list
          ">
      `;
    
      // =====================
      // AMBIL SEMUA KEY AKTIF
      // =====================
      const activeKeys = [];
    
      (
        window.globalBawaBarang
        || []
      ).forEach(item=>{
    
        Object.keys(item)
        .forEach(key=>{
    
          const barang =
            item[key];
    
          if(
            barang?.isAktif
          ){
    
            activeKeys.push(
              key
            );
          }
        });
      });
    
      // =====================
      // RENDER SEMUA KEY
      // =====================
      activeKeys.forEach(key=>{
    
        const value =
          obj?.[key] || 0;
    
        html += `
          <div
            class="
              popup-detail-chip
              ${type}
            ">
    
            ${key}:
            ${value}
    
          </div>
        `;
      });
    
      html += `
          </div>
        </div>
      `;
    }
  
    renderGroup(
      "Expired",
      data.expired,
      "expired"
    );
    
    renderGroup(
      "Fee",
      data.fee,
      "fee"
    );
    
    renderGroup(
      "Disable",
      data.disable,
      "disable"
    );
    
    renderGroup(
          "Closing",
          closingData,
          "closing"
        );  

    renderGroup(
      "Saldo Barang",
      saldoBarang,
      "saldo"
    );
    
    popupHeaderDetailBody
      .innerHTML =
        html;
  
    popupHeaderDetailOverlay
      .classList.add(
        "active"
      );
  };
  inputDetailBtn.onclick =
  function(){
  
    openPopupHeaderDetail();
  };
  popupHeaderDetailOverlay
  ?.addEventListener(
    "click",
    function(e){
  
      if(
        e.target ===
        popupHeaderDetailOverlay
      ){
  
        popupHeaderDetailOverlay
          .classList.remove(
            "active"
          );
      }
    }
  );
  // =========================
  // SWIPE DOWN CLOSE
  // =========================
  let detailStartY = 0;
  let detailCurrentY = 0;
  let detailDragging = false;
  
  popupHeaderDetailSheet
  ?.addEventListener(
    "touchstart",
    function(e){
  
      detailStartY =
        e.touches[0]
        .clientY;
  
      detailDragging =
        true;
  
      popupHeaderDetailSheet
        .style.transition =
          "none";
    }
  );
  
  popupHeaderDetailSheet
  ?.addEventListener(
    "touchmove",
    function(e){
  
      if(
        !detailDragging
      ) return;
  
      detailCurrentY =
        e.touches[0]
        .clientY
        -
        detailStartY;
  
      if(
        detailCurrentY > 0
      ){
  
        popupHeaderDetailSheet
          .style.transform =
            `translateY(
              ${detailCurrentY}px
            )`;
      }
    }
  );
  
  popupHeaderDetailSheet
  ?.addEventListener(
    "touchend",
    function(){
  
      detailDragging =
        false;
  
      popupHeaderDetailSheet
        .style.transition =
          "transform .18s ease";
  
      // swipe cukup jauh
      if(
        detailCurrentY > 90
      ){
  
        popupHeaderDetailOverlay
          .classList.remove(
            "active"
          );
  
        popupHeaderDetailSheet
          .style.transform =
            "";
  
      }else{
  
        popupHeaderDetailSheet
          .style.transform =
            "";
      }
  
      detailCurrentY = 0;
    }
  );
};
