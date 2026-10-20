import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Config pública de Firebase (no es secreta: la seguridad la dan las reglas de Firestore).
// Si existen variables VITE_FIREBASE_* en .env o en GitHub Secrets, tienen prioridad.
const env = import.meta.env
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDN4JToi9apRJ6N7U_PK38rQJENSJnYWXI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'peluqueriasystem-3fed6.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'peluqueriasystem-3fed6',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'peluqueriasystem-3fed6.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '194480297498',
  appId: env.VITE_FIREBASE_APP_ID || '1:194480297498:web:e717c996366a5be13be3a3',
}

export const firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId)
export const app = firebaseEnabled ? initializeApp(cfg) : null
export const fdb = app ? getFirestore(app) : null
export const fauth = app ? getAuth(app) : null
