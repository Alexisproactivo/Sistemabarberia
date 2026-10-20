import { useEffect, useState } from 'react'
import { firebaseEnabled, fauth } from './firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'

export const DEMO_USER = { email: 'admin@demo.com', password: 'admin123' }
const SKEY = 'peluqueria_admin'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = cargando
  useEffect(() => {
    if (firebaseEnabled) return onAuthStateChanged(fauth, (u) => setUser(u || null))
    let s = null
    try { s = sessionStorage.getItem(SKEY) } catch {}
    setUser(s ? { email: s } : null)
    const h = () => { let v = null; try { v = sessionStorage.getItem(SKEY) } catch {}; setUser(v ? { email: v } : null) }
    window.addEventListener('auth-change', h)
    return () => window.removeEventListener('auth-change', h)
  }, [])
  return user
}

export async function login(email, password) {
  if (firebaseEnabled) return signInWithEmailAndPassword(fauth, email, password)
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    try { sessionStorage.setItem(SKEY, email) } catch {}
    window.dispatchEvent(new Event('auth-change'))
    return
  }
  throw new Error('Credenciales incorrectas')
}

export async function logout() {
  if (firebaseEnabled) return signOut(fauth)
  try { sessionStorage.removeItem(SKEY) } catch {}
  window.dispatchEvent(new Event('auth-change'))
}
