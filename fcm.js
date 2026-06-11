async function saveFcmToken(token) {
  try {
    const app  = getApp();
    const auth = getAuth(app);
    const db   = getFirestore(app);
    const user = auth.currentUser;
    if (!user || !token) return;
    await setDoc(
      doc(db, "users", user.uid),
      { fcmToken: token },
      { merge: true }
    );
    console.log("✅ FCM token tersimpan:", token);
  } catch (err) {
    console.error("❌ saveFcmToken:", err);
  }
}

async function initFCM() {
  // Kalau di WebView Android — pakai native token
  window.onNativeFcmToken = async function(token) {
    console.log("📱 Native FCM token diterima:", token);
    await saveFcmToken(token);
  };

  // Kalau token sudah diinject sebelum initFCM dipanggil
  if (window.nativeFcmToken) {
    await saveFcmToken(window.nativeFcmToken);
    return;
  }

  // Fallback untuk browser biasa (bukan WebView)
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("❌ Izin notifikasi ditolak");
      return;
    }
    const app       = getApp();
    const messaging = getMessaging(app);
    const swReg     = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token     = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) { console.log("❌ FCM token kosong"); return; }
    await saveFcmToken(token);
  } catch (err) {
    console.error("❌ initFCM:", err);
  }
}
window.initFCM = initFCM;