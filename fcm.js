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