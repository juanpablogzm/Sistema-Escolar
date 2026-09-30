import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  batchDeleteByField,
  batchDeleteDocs
} from '../services/firestoreService'

const AppContext = createContext()

export const useApp = () => useContext(AppContext)

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const AppProvider = ({ children }) => {
  const { user } = useAuth()
  const [universities, setUniversities] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [rubrics, setRubrics] = useState([])
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [collectionSync, setCollectionSync] = useState({})
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const userId = user?.uid

  useEffect(() => {
    const markOnline = () => setIsOnline(true)
    const markOffline = () => setIsOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  // Firestore emite primero los datos de IndexedDB y después los del servidor.
  // Así la pantalla queda disponible aun si el dispositivo arranca sin señal.
  useEffect(() => {
    if (!userId) {
      setUniversities([])
      setClasses([])
      setStudents([])
      setRubrics([])
      setGrades([])
      setAttendance([])
      setCollectionSync({})
      setLoading(false)
      return
    }

    setLoading(true)
    const loadedCollections = new Set()
    const checkLoaded = () => {
      if (loadedCollections.size >= 6) setLoading(false)
    }

    const collections = [
      'universities', 'classes', 'students', 'rubrics', 'grades', 'attendance'
    ]
    
    const unsubs = collections.map((name) => {
      return subscribeCollection(name, userId, (data, metadata) => {
        if (name === 'universities') setUniversities(data)
        if (name === 'classes') setClasses(data)
        if (name === 'students') setStudents(data)
        if (name === 'rubrics') setRubrics(data)
        if (name === 'grades') setGrades(data)
        if (name === 'attendance') setAttendance(data)
        setCollectionSync(prev => ({ ...prev, [name]: metadata }))
        loadedCollections.add(name)
        checkLoaded()
      }, () => {
        // Un error de red o permisos no debe dejar la aplicación bloqueada.
        loadedCollections.add(name)
        checkLoaded()
      })
    })

    return () => {
      unsubs.forEach(unsub => unsub())
    }
  }, [userId])

  const syncMetadata = Object.values(collectionSync)
  const hasPendingWrites = syncMetadata.some(status => status.hasPendingWrites)
  const usingCache = syncMetadata.length > 0 && syncMetadata.every(status => status.fromCache)
  const syncStatus = !isOnline
    ? 'offline'
    : hasPendingWrites
      ? 'pending'
      : usingCache
        ? 'local'
        : 'synced'

  // University CRUD
  const addUniversity = async (university) => {
    await addDocument('universities', university, userId)
  }

  const updateUniversity = async (id, data) => {
    await updateDocument('universities', id, data)
  }

  const deleteUniversity = async (id) => {
    const classIds = classes.filter(c => c.universityId === id).map(c => c.id)
    const studentIds = students.filter(s => classIds.includes(s.classId)).map(s => s.id)

    // Cascade delete
    if (studentIds.length) {
      const gradeIds = grades.filter(g => studentIds.includes(g.studentId)).map(g => g.id)
      await batchDeleteDocs('grades', gradeIds)
    }
    await batchDeleteDocs('students', students.filter(s => classIds.includes(s.classId)).map(s => s.id))

    // Rubrics: delete if all their classes belong to this university; otherwise remove those classIds
    const rubricsToDelete = rubrics.filter(r => {
      const ids = r.classIds || (r.classId ? [r.classId] : [])
      return ids.every(cid => classIds.includes(cid))
    })
    const rubricsToUpdate = rubrics.filter(r => {
      const ids = r.classIds || (r.classId ? [r.classId] : [])
      return ids.some(cid => classIds.includes(cid)) && !ids.every(cid => classIds.includes(cid))
    })
    await batchDeleteDocs('rubrics', rubricsToDelete.map(r => r.id))
    await Promise.all(rubricsToUpdate.map(r => {
      const remaining = (r.classIds || [r.classId]).filter(cid => !classIds.includes(cid))
      return updateDocument('rubrics', r.id, { classIds: remaining, classId: null })
    }))

    await batchDeleteDocs('classes', classIds)
    await deleteDocument('universities', id)
  }

  // Class CRUD
  const addClass = async (classData) => {
    await addDocument('classes', classData, userId)
  }

  const updateClass = async (id, data) => {
    await updateDocument('classes', id, data)
  }

  const deleteClass = async (id) => {
    const studentIds = students.filter(s => s.classId === id).map(s => s.id)
    const gradeIds = grades.filter(g => studentIds.includes(g.studentId)).map(g => g.id)

    await batchDeleteDocs('grades', gradeIds)
    await batchDeleteDocs('students', studentIds)

    // For rubrics: if only assigned to this class → delete; if multi-class → remove this classId
    const rubricsSolelyThisClass = rubrics.filter(r => {
      const ids = r.classIds || (r.classId ? [r.classId] : [])
      return ids.length === 1 && ids[0] === id
    })
    const rubricsMultiClass = rubrics.filter(r => {
      const ids = r.classIds || (r.classId ? [r.classId] : [])
      return ids.length > 1 && ids.includes(id)
    })
    await batchDeleteDocs('rubrics', rubricsSolelyThisClass.map(r => r.id))
    await Promise.all(rubricsMultiClass.map(r =>
      updateDocument('rubrics', r.id, { classIds: (r.classIds || [r.classId]).filter(cid => cid !== id), classId: null })
    ))
    await deleteDocument('classes', id)
  }

  // Student CRUD
  const addStudent = async (student) => {
    await addDocument('students', student, userId)
  }

  const updateStudent = async (id, data) => {
    await updateDocument('students', id, data)
  }

  const deleteStudent = async (id) => {
    const gradeIds = grades.filter(g => g.studentId === id).map(g => g.id)
    await batchDeleteDocs('grades', gradeIds)
    await deleteDocument('students', id)
  }

  // Rubric CRUD
  const addRubric = async (rubric) => {
    await addDocument('rubrics', rubric, userId)
  }

  const updateRubric = async (id, data) => {
    await updateDocument('rubrics', id, data)
  }

  const deleteRubric = async (id) => {
    const gradeIds = grades.filter(g => g.rubricId === id).map(g => g.id)
    await batchDeleteDocs('grades', gradeIds)
    await deleteDocument('rubrics', id)
  }

  // Grade CRUD
  const addGrade = async (grade) => {
    await addDocument('grades', grade, userId)
  }

  const updateGrade = async (id, data) => {
    await updateDocument('grades', id, data)
  }

  // Attendance CRUD
  const addAttendance = async (session) => {
    await addDocument('attendance', session, userId)
  }

  const updateAttendance = async (id, data) => {
    await updateDocument('attendance', id, data)
  }

  const deleteAttendance = async (id) => {
    await deleteDocument('attendance', id)
  }

  const getRubricClassIds = (r) => r.classIds || (r.classId ? [r.classId] : [])

  // Helpers
  const getClassesByUniversity = (universityId) => classes.filter(c => c.universityId === universityId)
  const getStudentsByClass = (classId) => students.filter(s => s.classId === classId)
  const getRubricsByClass = (classId) => rubrics.filter(r => getRubricClassIds(r).includes(classId))
  const getUniversityById = (id) => universities.find(u => u.id === id)
  const getClassById = (id) => classes.find(c => c.id === id)

  const value = {
    universities, classes, students, rubrics, grades, attendance, loading,
    syncStatus, isOnline, hasPendingWrites,
    theme, toggleTheme,
    addUniversity, updateUniversity, deleteUniversity,
    addClass, updateClass, deleteClass,
    addStudent, updateStudent, deleteStudent,
    addRubric, updateRubric, deleteRubric,
    addGrade, updateGrade,
    addAttendance, updateAttendance, deleteAttendance,
    getClassesByUniversity, getStudentsByClass, getRubricsByClass,
    getUniversityById, getClassById
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
