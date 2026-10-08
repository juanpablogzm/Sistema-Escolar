import React, { useState } from 'react'
import { Row, Col, Modal, Form, Button } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import { BsPlus, BsPencil, BsTrash, BsBook, BsPeople, BsSearch } from 'react-icons/bs'

const COLORS = [
  '#E91E86', '#F472B6', '#10B981', '#F59E0B', '#EC4899',
  '#BE185D', '#F9A8D4', '#14B8A6', '#F97316', '#06B6D4'
]
const ICONS = ['🏛️', '🎓', '📚', '🏫', '🏢', '🎯', '⭐', '🌟', '💎', '🔬']

const Universities = () => {
  const { universities, classes, students, addUniversity, updateUniversity, deleteUniversity } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingUni, setEditingUni] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    name: '', abbreviation: '', color: COLORS[0], icon: ICONS[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingUni) {
      updateUniversity(editingUni.id, form)
    } else {
      addUniversity(form)
    }
    handleCloseModal()
  }

  const handleEdit = (uni) => {
    setEditingUni(uni)
    setForm({ name: uni.name, abbreviation: uni.abbreviation, color: uni.color, icon: uni.icon })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowCloseConfirm(false)
    setShowModal(false)
    setEditingUni(null)
    setForm({ name: '', abbreviation: '', color: COLORS[0], icon: ICONS[0] })
  }

  const handleTryClose = () => setShowCloseConfirm(true)

  const handleDelete = (id) => {
    deleteUniversity(id)
    setShowDeleteConfirm(null)
  }

  const getUniStats = (uniId) => {
    const uniClasses = classes.filter(c => c.universityId === uniId)
    const uniStudents = students.filter(s => uniClasses.some(c => c.id === s.classId))
    return { classCount: uniClasses.length, studentCount: uniStudents.length }
  }

  const filteredUniversities = universities.filter(uni => {
    const term = searchTerm.trim().toLocaleLowerCase('es-MX')
    return !term || uni.name?.toLocaleLowerCase('es-MX').includes(term) ||
      uni.abbreviation?.toLocaleLowerCase('es-MX').includes(term)
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Universidades</h2>
          <p>Administra las universidades donde impartes clases</p>
        </div>
        <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
          <BsPlus size={20} /> Agregar Universidad
        </button>
      </div>

      {universities.length > 0 && (
        <div className="filter-bar">
          <div className="search-box" style={{ maxWidth: 320 }}>
            <BsSearch className="search-icon" />
            <input
              type="search"
              className="form-control"
              placeholder="Buscar universidad o siglas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Buscar universidades"
            />
          </div>
        </div>
      )}

      {filteredUniversities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <h5>{searchTerm ? 'No se encontraron universidades' : 'No hay universidades registradas'}</h5>
          <p>{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Comienza agregando las universidades donde impartes tus clases'}</p>
          {!searchTerm && (
            <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
              <BsPlus size={20} /> Agregar Universidad
            </button>
          )}
        </div>
      ) : (
        <Row className="g-3">
          {filteredUniversities.map((uni, i) => {
            const stats = getUniStats(uni.id)
            return (
              <Col key={uni.id} md={6} lg={4}>
                <div className={`university-card fade-in fade-in-delay-${(i % 4) + 1}`}>
                  <div
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: '4px', background: uni.color,
                      borderRadius: 'var(--radius) var(--radius) 0 0'
                    }}
                  />
                  <div className="uni-actions">
                    <button
                      className="btn-sm-icon"
                      onClick={(e) => { e.stopPropagation(); handleEdit(uni) }}
                    >
                      <BsPencil size={14} />
                    </button>
                    <button
                      className="btn-sm-icon danger"
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(uni) }}
                    >
                      <BsTrash size={14} />
                    </button>
                  </div>
                  <div
                    className="uni-icon"
                    style={{ background: uni.color + '15', color: uni.color }}
                  >
                    {uni.icon}
                  </div>
                  <h5>{uni.name}</h5>
                  <div className="uni-abbr">{uni.abbreviation}</div>
                  <div className="uni-stats">
                    <div className="uni-stat">
                      <BsBook size={14} />
                      <strong>{stats.classCount}</strong> clases
                    </div>
                    <div className="uni-stat">
                      <BsPeople size={14} />
                      <strong>{stats.studentCount}</strong> alumnos
                    </div>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleTryClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingUni ? 'Editar Universidad' : 'Agregar Universidad'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Universidad</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Universidad Autónoma de Nuevo León"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Abreviación</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: UANL"
                value={form.abbreviation}
                onChange={e => setForm({ ...form, abbreviation: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <div
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: color, cursor: 'pointer',
                      border: form.color === color
                        ? '3px solid var(--text-primary)'
                        : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ícono</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {ICONS.map(icon => (
                  <div
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: form.icon === icon ? 'var(--bg-main)' : 'transparent',
                      border: form.icon === icon
                        ? '2px solid var(--primary)'
                        : '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleTryClose}>Cancelar</Button>
            <button type="submit" className="btn btn-primary-custom">
              {editingUni ? 'Guardar Cambios' : 'Agregar'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Close Confirmation */}
      <Modal show={showCloseConfirm} onHide={() => setShowCloseConfirm(false)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h5>¿Descartar cambios?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>Los cambios no guardados se perderán.</p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowCloseConfirm(false)}>Seguir editando</Button>
            <Button variant="danger" onClick={handleCloseModal}>Descartar</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation */}
      <Modal show={!!showDeleteConfirm} onHide={() => setShowDeleteConfirm(null)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h5>¿Eliminar universidad?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Se eliminarán también todas las clases, alumnos y períodos de evaluación de{' '}
            <strong>{showDeleteConfirm?.name}</strong>.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm.id)}>Eliminar</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Universities
