window.initHomeView = function(){

  console.log("🏠 Home View");

  const user =
    window.currentUser;

  if(!user) return;


  // ELEMENT
  const avatar =
    document.getElementById("homeAvatar");

  const nama =
    document.getElementById("homeNama");

  const motivasi =
    document.getElementById("homeMotivasi");

  const kantor =
    document.getElementById("homeKantor");

  const tanggal =
    document.getElementById("homeTanggal");

  const waktu =
    document.getElementById("homeWaktu");


  // =========================
  // NAMA
  // =========================
  if(nama){

    nama.innerText =
      user.nama || "Marketing";
  }


  // =========================
  // MOTIVASI
  // =========================
  if(motivasi){

    motivasi.innerText =
      user.motivasi ||
      "Selamat bekerja dan semangat hari ini 🚀";
  }


  // =========================
  // KANTOR
  // =========================
  if(kantor){

    kantor.innerHTML = `
      <svg class="kantor-icon"
           viewBox="0 0 24 24">

        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13
        c0-3.87-3.13-7-7-7zm0 9.5
        c-1.38 0-2.5-1.12-2.5-2.5
        S10.62 6.5 12 6.5
        14.5 7.62 14.5 9
        13.38 11.5 12 11.5z"/>

      </svg>

      Kantor:
      ${user.kantorCabang || "-"}
    `;
  }


  // =========================
  // AVATAR
  // =========================
  if(avatar){

    const inisial =
      (user.nama || "A")
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0,2);


    // ADA FOTO
    if(user.fotoURL){

      avatar.classList.add("has-photo");

      avatar.innerHTML = `
        <img
          src="${user.fotoURL}"
          alt="${user.nama}"
        >

        <div class="avatar-inisial">
          ${inisial}
        </div>
      `;


      // FOTO ERROR
      const img =
        avatar.querySelector("img");

      img.onerror = () => {

        avatar.classList.remove(
          "has-photo"
        );

        avatar.innerHTML = `
          <div class="avatar-inisial">
            ${inisial}
          </div>
        `;
      };

    }else{

      // TANPA FOTO
      avatar.classList.remove(
        "has-photo"
      );

      avatar.innerHTML = `
        <div class="avatar-inisial">
          ${inisial}
        </div>
      `;
    }
  }


  // =========================
  // JAM REALTIME
  // =========================
  function updateDateTime(){

    const now =
      new Date();

    const hariNama = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];

    const bulanNama = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ];

    if(tanggal){

      tanggal.innerText =
        `${hariNama[now.getDay()]}, ${now.getDate()} ${bulanNama[now.getMonth()]} ${now.getFullYear()}`;
    }

    if(waktu){

      waktu.innerText =
        now.toLocaleTimeString(
          "id-ID",
          {
            hour:"2-digit",
            minute:"2-digit"
          }
        );
    }
  }

  updateDateTime();

  if(!window.homeClock){

    window.homeClock =
      setInterval(
        updateDateTime,
        1000
      );
  }
};