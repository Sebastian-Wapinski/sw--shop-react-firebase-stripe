import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_APP_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
}

export const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
export const auth = getAuth(app)

export const signInWithFirebaseSDK = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const signOutWithFirebaseSDK = () => signOut(auth)
