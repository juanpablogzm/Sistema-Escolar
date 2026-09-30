import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { db } from '../firebase'

// Collection references
const col = (name) => collection(db, name)

// ---------- Generic CRUD ----------

export const subscribeCollection = (collectionName, userId, callback, onError) => {
  const q = userId
    ? query(col(collectionName), where('userId', '==', userId))
    : query(col(collectionName))

  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data, {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites
    })
  }, (err) => {
    console.error(`Error sincronizando ${collectionName}:`, err)
    onError?.(err)
  })
}

export const subscribeAll = (collectionName, callback, onError) => {
  return onSnapshot(col(collectionName), { includeMetadataChanges: true }, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data, {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites
    })
  }, (err) => {
    console.error(`Error sincronizando ${collectionName}:`, err)
    onError?.(err)
  })
}

// Las promesas de Firestore se resuelven al confirmar el servidor. No las
// esperamos aquí: sin señal el cambio ya está aplicado a IndexedDB y la UI debe
// poder continuar. Si el servidor lo rechaza, Firestore revierte el cambio local.
const queueWrite = (operation, label) => {
  operation.catch((err) => console.error(`No se pudo sincronizar ${label}:`, err))
  return Promise.resolve()
}

export const addDocument = async (collectionName, data, userId) => {
  const { id, ...rest } = data
  const docRef = doc(col(collectionName))
  queueWrite(setDoc(docRef, {
    ...rest,
    userId,
    createdAt: serverTimestamp()
  }), `nuevo documento en ${collectionName}`)
  return docRef.id
}

export const updateDocument = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id)
  return queueWrite(updateDoc(docRef, data), `cambios en ${collectionName}`)
}

export const deleteDocument = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id)
  return queueWrite(deleteDoc(docRef), `eliminación en ${collectionName}`)
}

// ---------- Batch delete helpers ----------

export const batchDeleteByField = async (collectionName, fieldName, value, allDocs) => {
  const ids = allDocs.filter(d => d[fieldName] === value).map(d => d.id)
  await batchDeleteDocs(collectionName, ids)
}

export const batchDeleteDocs = async (collectionName, ids) => {
  if (ids.length === 0) return
  const batch = writeBatch(db)
  ids.forEach(id => batch.delete(doc(db, collectionName, id)))
  return queueWrite(batch.commit(), `eliminaciones en ${collectionName}`)
}
