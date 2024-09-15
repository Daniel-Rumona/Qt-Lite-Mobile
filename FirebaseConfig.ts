// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAD912ssrrWlPYsZN2ZlJgKugHj68q5Vss",
  authDomain: "quant-app-99d09.firebaseapp.com",
  projectId: "quant-app-99d09",
  storageBucket: "quant-app-99d09.appspot.com",
  messagingSenderId: "823738382213",
  appId: "1:823738382213:web:15fd572fc1298b9d42f6ec"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
