import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const VAPID_KEY = "BO7ialfKuwNOjNt1qIVheqCb06BvV6Z8FDGGN9B5AB4Dp51uQ6FIGuglKUVAWt3R4Ox17E14DZGnbe0TkDUBV0Y";

async function initFCM() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("❌ Izin notifikasi ditolak");
      return;
    }

    const app       = getApp();
    const auth      = getAuth(app);
    const db        = getFirestore(app);
    const messaging = getMessaging(app);

    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) { console.log("❌ FCM token kosong"); return; }
    console.log("✅ FCM Token:", token);

    const user = auth.currentUser;
    console.log("👤 current user:", user?.uid);
    if (!user) { console.log("❌ User belum login"); return; }

    await setDoc(
      doc(db, "users", user.uid),
      { fcmToken: token },
      { merge: true }
    );
    console.log("✅ FCM token tersimpan untuk uid:", user.uid);

  } catch (err) {
    console.error("❌ initFCM:", err);
  }
}

window.initFCM = initFCM;