import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "offboardpro-e9a56",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // This part ensures the long private key is read correctly by Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
export { db };