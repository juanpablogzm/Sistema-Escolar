import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Universities from './components/Universities/Universities'
import Classes from './components/Classes/Classes'
import Students from './components/Students/Students'
import Rubrics from './components/Rubrics/Rubrics'
import Grades from './components/Grades/Grades'
import Attendance from './components/Attendance/Attendance'
import Activities from './components/Activities/Activities'
import Users from './components/Users/Users'
import Login from './components/Login/Login'
import Register from './components/Login/Register'
import ProtectedRoute from './components/Login/ProtectedRoute'
import LandingPage from './components/LandingPage/LandingPage'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/universidades" element={<Universities />} />
              <Route path="/clases" element={<Classes />} />
              <Route path="/alumnos" element={<Students />} />
              <Route path="/asistencia" element={<Attendance />} />
              <Route path="/rubricas" element={<Rubrics />} />
              <Route path="/calificaciones" element={<Grades />} />
              <Route path="/actividades" element={<Activities />} />
              <Route path="/usuarios" element={<Users />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
