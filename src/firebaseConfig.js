import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
apiKey: "AIzaSyCHGvpy8I2vZdgYsmp-sEBNH1IuVG0BdCo",

  authDomain: "resume-d884a.firebaseapp.com",

  projectId: "resume-d884a",

  storageBucket: "resume-d884a.firebasestorage.app",

  messagingSenderId: "321259633436",

  appId: "1:321259633436:web:a627d107ec7ecb754d18d9",

  measurementId: "G-F3TWXQXZWC"

}



const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
