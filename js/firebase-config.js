// firebase-config.js

// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCKTtDro4r4iQ4TwbblBGulGLDTHvp5Pu8",
    authDomain: "agentassist-72f8e.firebaseapp.com",
    databaseURL: "https://agentassist-72f8e-default-rtdb.firebaseio.com",
    projectId: "agentassist-72f8e",
    storageBucket: "agentassist-72f8e.appspot.com",
    messagingSenderId: "353344108954",
    appId: "1:353344108954:web:ee89b147ca641e63b5e223"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
