import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBLP3vEkqdz8ZrgVB7v7cMJz_y4aRGE52k",
  authDomain: "baduworks-59557.firebaseapp.com",
  databaseURL: "https://baduworks-59557-default-rtdb.firebaseio.com",
  projectId: "baduworks-59557",
  storageBucket: "baduworks-59557.firebasestorage.app",
  messagingSenderId: "34035120563",
  appId: "1:34035120563:web:cf7ff5ede7a94b8930b3c6",
  measurementId: "G-860R6Z2M84"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

export const signInAnonymouslyUser = () => signInAnonymously(auth);
