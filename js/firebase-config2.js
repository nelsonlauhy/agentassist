// Import the Firebase modules needed
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKTtDro4r4iQ4TwbblBGulGLDTHvp5Pu8",
    authDomain: "agentassist-72f8e.firebaseapp.com",
    databaseURL: "https://agentassist-72f8e-default-rtdb.firebaseio.com",
    projectId: "agentassist-72f8e",
    storageBucket: "agentassist-72f8e.appspot.com",
    messagingSenderId: "353344108954",
    appId: "1:353344108954:web:ee89b147ca641e63b5e223"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);
