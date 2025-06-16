// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import{getFirestore}from "firebase/firestore"
import { FacebookAuthProvider, getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjunEKfOMUm9ZtgMTmMj5YfaxEAP2sZNo",
  authDomain: "chat-377fa.firebaseapp.com",
  projectId: "chat-377fa",
  storageBucket: "chat-377fa.firebasestorage.app",
  messagingSenderId: "1095586055430",
  appId: "1:1095586055430:web:3d68e8fc110e9de90c4a87",
  measurementId: "G-HV434G1X9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
// const analytics = getAnalytics(app);
const db=getFirestore(app);
const provider=new GoogleAuthProvider();
// const fbProvider=new FacebookAuthProvider();
// const githubProvider = new GithubAuthProvider();
export {db,app,auth,provider}