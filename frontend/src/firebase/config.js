// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsHcttuFxrPlkV-fjDD4INPu2B4AMmdwI",
  authDomain: "replyly-chatbot.firebaseapp.com",
  projectId: "replyly-chatbot",
  storageBucket: "replyly-chatbot.firebasestorage.app",
  messagingSenderId: "615821955324",
  appId: "1:615821955324:web:7d529ae93d7afd5d734779",
  measurementId: "G-L1N84RQQT5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); 

export {auth} ; 