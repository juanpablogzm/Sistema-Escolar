import React, { useState, useEffect } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { seedFirestore } from '../../services/seedFirestore'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import {
  BsBuildings,
  BsBook,
  BsPeople,
  BsClipboardCheck,
  BsArrowRight,
  BsClock,
  BsPlus,
  BsStars
} from 'react-icons/bs'

const frases = [
  { texto: 'Enseñar es dejar una huella en la vida de alguien para siempre.', autor: 'Henry Adams' },
  { texto: 'La mejor maestra del mundo no es la que sabe más, sino la que hace sentir que aprender vale la pena.', autor: '✨' },
  { texto: 'Tu dedicación cambia vidas, aunque no siempre lo veas. Tus alumnos tienen mucha suerte de tenerte.', autor: '💕' },
  { texto: 'Una buena maestra inspira esperanza, enciende la imaginación y aviva el amor por el aprendizaje.', autor: 'Brad Henry' },
  { texto: 'Lo que haces importa más de lo que crees. Cada clase, cada alumno, cada esfuerzo cuenta.', autor: '🌸' },
  { texto: 'Eres la razón por la que alguien encontrará su camino. Eso es un regalo increíble.', autor: '💖' },
  { texto: 'El impacto de un gran maestro nunca puede ser borrado.', autor: 'Unknown' },
  { texto: 'Estás haciendo un trabajo hermoso. Sé orgullosa de cada paso que das.', autor: '🌷' },
  { texto: 'No cuentas el tiempo que das, das el tiempo que cuenta.', autor: '✨' },
  { texto: 'Eres extraordinaria en lo que haces. Tus alumnos lo saben, yo lo sé. 💕', autor: 'Tu mayor fan' },
]

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const { universities, classes, students, rubrics } = useApp()
  const navigate = useNavigate()
  const [seeding, setSeeding] = useState(false)
  const [fraseIdx] = useState(() => Math.floor(Math.random() * frases.length))

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedFirestore()
    } catch (err) {
      console.error('Error al poblar Firestore:', err)
      alert('Error al subir datos. Revisa la consola.')
    } finally {
      setSeeding(false)
    }
  }

  const stats = [
    { label: 'Universidades', value: universities.length, icon: BsBuildings, bg: 'bg-primary-soft' },
    { label: 'Clases', value: classes.length, icon: BsBook, bg: 'bg-success-soft' },
    { label: 'Alumnos', value: students.length, icon: BsPeople, bg: 'bg-info-soft' },
    { label: 'Períodos de evaluación', value: rubrics.length, icon: BsClipboardCheck, bg: 'bg-warning-soft' }
  ]

  const barData = {
    labels: universities.map(u => u.abbreviation || u.name),
    datasets: [
      {
        label: 'Alumnos',
        data: universities.map(u => {
          const uniClasses = classes.filter(c => c.universityId === u.id)
          return students.filter(s => uniClasses.some(c => c.id === s.classId)).length
        }),
        backgroundColor: universities.map(u => u.color + '99'),
        borderColor: universities.map(u => u.color),
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  const doughnutData = {
    labels: universities.map(u => u.abbreviation || u.name),
    datasets: [
      {
        data: universities.map(u => classes.filter(c => c.universityId === u.id).length),
        backgroundColor: universities.map(u => u.color + 'CC'),
        borderWidth: 0,
        spacing: 4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, usePointStyle: true, font: { size: 13 } }
      }
    },
    cutout: '65%'
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Hola mi bb hermosa 💕, aquí tienes un resumen de tus clases.</p>
        </div>
      </div>

      {/* Frase motivacional */}
      <div
        className="motivational-card mb-4"
        style={{
          background: 'linear-gradient(135deg, #BE185D 0%, #E91E86 60%, #F472B6 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(233, 30, 134, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <BsStars size={36} style={{ flexShrink: 0, opacity: 0.9 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, lineHeight: 1.5 }}>
            "{frases[fraseIdx].texto}"
          </p>
          <span style={{ fontSize: '13px', opacity: 0.85, marginTop: '6px', display: 'block' }}>
            — {frases[fraseIdx].autor}
          </span>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {stats.map((stat, i) => (
          <Col key={i} xs={6} lg={3}>
            <div className={`stat-card fade-in fade-in-delay-${i + 1}`}>
              <div className={`stat-icon ${stat.bg}`}>
                <stat.icon />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <div className="custom-card">
            <div className="card-header-custom">
              <h5>Alumnos por Universidad</h5>
            </div>
            <div className="card-body-custom">
              <div className="chart-container">
                {universities.length > 0 ? (
                  <Bar data={barData} options={chartOptions} />
                ) : (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <p>Agrega universidades para ver el gráfico</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
        <Col lg={4}>
          <div className="custom-card">
            <div className="card-header-custom">
              <h5>Clases por Universidad</h5>
            </div>
            <div className="card-body-custom">
              <div className="chart-container">
                {universities.length > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <p>Agrega universidades para ver el gráfico</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <div className="custom-card">
            <div className="card-header-custom">
              <h5>Clases Recientes</h5>
              <button
                className="btn btn-link text-decoration-none"
                onClick={() => navigate('/clases')}
                style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}
              >
                Ver todas <BsArrowRight />
              </button>
            </div>
            <div className="card-body-custom p-0">
              {classes.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <p>No hay clases registradas</p>
                </div>
              ) : (
                classes.slice(0, 5).map((cls, idx) => {
                  const uni = universities.find(u => u.id === cls.universityId)
                  const studentCount = students.filter(s => s.classId === cls.id).length
                  return (
                    <div
                      key={cls.id}
                      className="d-flex align-items-center justify-content-between p-3 px-4"
                      style={{
                        borderBottom: idx < Math.min(classes.length, 5) - 1 ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="student-avatar"
                          style={{ background: uni?.color || '#E91E86' }}
                        >
                          {cls.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{cls.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {uni?.abbreviation || uni?.name} &bull; {cls.code}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge-custom bg-primary-soft d-none d-md-flex">
                          <BsPeople /> {studentCount}
                        </span>
                        <span
                          className="d-none d-lg-flex align-items-center gap-1"
                          style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                        >
                          <BsClock /> {cls.schedule}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Col>
        <Col lg={4}>
          <div className="custom-card">
            <div className="card-header-custom">
              <h5>Acciones Rápidas</h5>
            </div>
            <div className="card-body-custom">
              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-outline-custom w-100 justify-content-start"
                  onClick={() => navigate('/universidades')}
                >
                  <BsPlus size={20} /> Agregar Universidad
                </button>
                <button
                  className="btn btn-outline-custom w-100 justify-content-start"
                  onClick={() => navigate('/clases')}
                >
                  <BsPlus size={20} /> Agregar Clase
                </button>
                <button
                  className="btn btn-outline-custom w-100 justify-content-start"
                  onClick={() => navigate('/alumnos')}
                >
                  <BsPlus size={20} /> Agregar Alumno
                </button>
                <button
                  className="btn btn-outline-custom w-100 justify-content-start"
                  onClick={() => navigate('/rubricas')}
                >
                  <BsPlus size={20} /> Crear período
                </button>
                {universities.length === 0 && (
                  <button
                    className="btn btn-primary w-100 mt-2"
                    onClick={handleSeed}
                    disabled={seeding}
                  >
                    {seeding ? 'Subiendo datos...' : '🔄 Cargar datos de ejemplo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
