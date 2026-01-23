import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1i4BwPd3lfrcETKklByg8zx7jR9S_stU",
  authDomain: "naratube.firebaseapp.com",
  projectId: "naratube",
  storageBucket: "naratube.firebasestorage.app",
  messagingSenderId: "1016139853716",
  appId: "1:1016139853716:web:6da5db7bb83ceed08c6981",
  measurementId: "G-3JVB92W19M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
