import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// TODO: Reemplaza estos valores con la configuración de tu proyecto de Firebase
// Ve a https://console.firebase.google.com/ → Tu Proyecto → Configuración del proyecto → General → Tu app web
const firebaseConfig = {
  apiKey: "AIzaSyDB7GgiahQKBFi9U0plbxDsZpNXtKc3xQk",
  authDomain: "administracion-escolar-6ab31.firebaseapp.com",
  projectId: "administracion-escolar-6ab31",
  storageBucket: "administracion-escolar-6ab31.firebasestorage.app",
  messagingSenderId: "1063410799503",
  appId: "1:1063410799503:web:99d6719aa51fcd63ceb1fa",
  measurementId: "G-QG4PEJK5V6"
};

const app = initializeApp(firebaseConfig)
// Firestore guarda una copia local del navegador en IndexedDB. Las lecturas
// y escrituras siguen funcionando sin red y Firebase envía la cola pendiente al
// recuperar la conexión. El gestor multi-pestaña evita que abrir la aplicación
// dos veces deje a una de las pestañas sin caché persistente.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})
export const auth = getAuth(app)
