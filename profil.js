window.initProfilView = function(){

  console.log("👤 Profil View");

  const user =
    window.currentUser;

  if(!user) return;


  // AVATAR
  const avatar =
    document.querySelector(".profil-avatar");

  const name =
    document.querySelector(".profil-name");

  const email =
    document.querySelector(".profil-email");


  // INISIAL
  let initial = "A";

  if(user.nama){

    initial =
      user.nama
      .charAt(0)
      .toUpperCase();
  }


  avatar.innerText = initial;

  name.innerText =
    user.nama || "Marketing";

  email.innerText =
    user.email || "-";


  // LOGOUT
  const btnLogout =
    document.getElementById("btnLogout");

  if(
    btnLogout &&
    !btnLogout.dataset.listener
  ){

    btnLogout.dataset.listener = "true";

    btnLogout.addEventListener(
      "click",
      ()=>{

        const confirmLogout =
          confirm(
            "Logout dari aplikasi?"
          );

        if(confirmLogout){

          window.logout();
        }
      }
    );
  }
};