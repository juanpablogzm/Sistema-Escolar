import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { deleteDocument, updateDocument } from '../services/firestoreService'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

const ADMIN_EMAILS = ['juanpablovazques544@gmail.com']

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const getUserProfile = async (uid) => {
    try {
      const snapshot = await getDoc(doc(db, 'users', uid))
      if (snapshot.exists()) {
        return { uid, ...snapshot.data() }
      }
      return null
    } catch (err) {
      console.error('Error getting user profile:', err)
      return null
    }
  }

  const isAdmin = () => {
    if (!user) return false
    return ADMIN_EMAILS.includes(user.email) || userProfile?.role === 'admin'
  }

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (name, username, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })

    const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user'
    const profile = {
      uid: cred.user.uid,
      name,
      username,
      email,
      role,
      status: 'pending',
      createdAt: serverTimestamp()
    }
    await setDoc(doc(db, 'users', cred.user.uid), profile)
    setUserProfile(profile)
    return cred.user
  }

  const logout = async () => {
    await signOut(auth)
  }

  // Admin functions
  const createUser = async (name, username, email, password) => {
    if (!isAdmin()) throw new Error('No autorizado')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const profile = {
      uid: cred.user.uid,
      name,
      username,
      email,
      role: 'user',
      status: 'pending',
      createdAt: serverTimestamp()
    }
    await setDoc(doc(db, 'users', cred.user.uid), profile)
    return cred.user
  }

  const deleteUser = async (uid) => {
    if (!isAdmin()) throw new Error('No autorizado')
    if (uid === user.uid) throw new Error('No puedes eliminarte a ti mismo')
    await deleteDocument('users', uid)
    // Note: Firebase Auth user deletion requires Admin SDK (backend)
    // For now we mark as deleted in Firestore
  }

  const suspendUser = async (uid, suspend) => {
    if (!isAdmin()) throw new Error('No autorizado')
    if (uid === user.uid) throw new Error('No puedes suspenderte a ti mismo')
    await updateDocument('users', uid, {
      status: suspend ? 'suspended' : 'active',
      updatedAt: serverTimestamp()
    })
  }

  const approveUser = async (uid) => {
    if (!isAdmin()) throw new Error('No autorizado')
    await updateDocument('users', uid, {
      status: 'active',
      updatedAt: serverTimestamp()
    })
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin: isAdmin(),
    // Admin functions
    createUser,
    deleteUser,
    suspendUser,
    approveUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
