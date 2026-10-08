import React, { useState } from 'react'
import { Row, Col, Modal, Form, Button } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import { BsPlus, BsPencil, BsTrash, BsPeople, BsClock, BsGeoAlt, BsCalendar, BsSearch } from 'react-icons/bs'

const Classes = () => {
  const { universities, classes, students, addClass, updateClass, deleteClass } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [filterUni, setFilterUni] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    universityId: '', name: '', code: '', semester: '', schedule: '', classroom: ''
  })

  let filteredClasses = filterUni === 'all'
    ? classes
    : classes.filter(c => c.universityId === filterUni)
  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLocaleLowerCase('es-MX')
    filteredClasses = filteredClasses.filter(cls =>
      String(cls.name || '').toLocaleLowerCase('es-MX').includes(term) ||
      String(cls.code || '').toLocaleLowerCase('es-MX').includes(term) ||
      String(cls.semester || '').toLocaleLowerCase('es-MX').includes(term) ||
      String(cls.classroom || '').toLocaleLowerCase('es-MX').includes(term)
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingClass) {
      updateClass(editingClass.id, form)
    } else {
      addClass(form)
    }
    handleCloseModal()
  }

  const handleEdit = (cls) => {
    setEditingClass(cls)
    setForm({
      universityId: cls.universityId,
      name: cls.name,
      code: cls.code,
      semester: cls.semester,
      schedule: cls.schedule,
      classroom: cls.classroom
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowCloseConfirm(false)
    setShowModal(false)
    setEditingClass(null)
    setForm({
      universityId: universities[0]?.id || '',
      name: '', code: '', semester: '', schedule: '', classroom: ''
    })
  }

  const handleTryClose = () => setShowCloseConfirm(true)

  const handleOpenAdd = () => {
    setForm({
      universityId: filterUni !== 'all' ? filterUni : (universities[0]?.id || ''),
      name: '', code: '', semester: '', schedule: '', classroom: ''
    })
    setShowModal(true)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Clases</h2>
          <p>Gestiona tus clases por universidad</p>
        </div>
        <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
          <BsPlus size={20} /> Agregar Clase
        </button>
      </div>

      <div className="filter-bar">
        <Form.Select
          value={filterUni}
          onChange={e => setFilterUni(e.target.value)}
          style={{ maxWidth: 300 }}
        >
          <option value="all">Todas las universidades</option>
          {universities.map(uni => (
            <option key={uni.id} value={uni.id}>{uni.icon} {uni.name}</option>
          ))}
        </Form.Select>
        <div className="search-box" style={{ maxWidth: 280 }}>
          <BsSearch className="search-icon" />
          <input
            type="search"
            className="form-control"
            placeholder="Buscar clase, código o salón..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Buscar clases"
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h5>{searchTerm ? 'No se encontraron clases' : 'No hay clases registradas'}</h5>
          <p>{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Agrega las clases que impartes en tus universidades'}</p>
          <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
            <BsPlus size={20} /> Agregar Clase
          </button>
        </div>
      ) : (
        <Row className="g-3">
          {filteredClasses.map((cls, i) => {
            const uni = universities.find(u => u.id === cls.universityId)
            const studentCount = students.filter(s => s.classId === cls.id).length
            return (
              <Col key={cls.id} md={6} lg={4}>
                <div className={`class-card fade-in fade-in-delay-${(i % 4) + 1}`}>
                  <div className="class-header">
                    <span
                      className="class-code"
                      style={{
                        background: (uni?.color || '#E91E86') + '15',
                        color: uni?.color || '#E91E86'
                      }}
                    >
                      {cls.code}
                    </span>
                    <div className="d-flex gap-1">
                      <button className="btn-sm-icon" onClick={() => handleEdit(cls)}>
                        <BsPencil size={14} />
                      </button>
                      <button
                        className="btn-sm-icon danger"
                        onClick={() => setShowDeleteConfirm(cls)}
                      >
                        <BsTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <h6>{cls.name}</h6>
                  <div className="mb-3">
                    <span
                      className="badge-custom"
                      style={{
                        background: (uni?.color || '#E91E86') + '15',
                        color: uni?.color || '#E91E86',
                        fontSize: 11
                      }}
                    >
                      {uni?.icon} {uni?.abbreviation || uni?.name}
                    </span>
                  </div>
                  <div className="class-info">
                    <div className="class-info-item"><BsClock size={14} /> {cls.schedule || '—'}</div>
                    <div className="class-info-item"><BsGeoAlt size={14} /> {cls.classroom || '—'}</div>
                    <div className="class-info-item"><BsCalendar size={14} /> {cls.semester || '—'}</div>
                    <div className="class-info-item"><BsPeople size={14} /> {studentCount} alumnos</div>
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
          <Modal.Title>{editingClass ? 'Editar Clase' : 'Agregar Clase'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Universidad</Form.Label>
              <Form.Select
                value={form.universityId}
                onChange={e => setForm({ ...form, universityId: e.target.value })}
                required
              >
                <option value="">Seleccionar universidad...</option>
                {universities.map(uni => (
                  <option key={uni.id} value={uni.id}>{uni.icon} {uni.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Clase</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Matemáticas Avanzadas"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Código</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: MAT-301"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Semestre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 2026-1"
                    value={form.semester}
                    onChange={e => setForm({ ...form, semester: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Aula</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Aula 205"
                    value={form.classroom}
                    onChange={e => setForm({ ...form, classroom: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Horario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Lun-Mié 10:00-11:30"
                value={form.schedule}
                onChange={e => setForm({ ...form, schedule: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleTryClose}>Cancelar</Button>
            <button type="submit" className="btn btn-primary-custom">
              {editingClass ? 'Guardar Cambios' : 'Agregar'}
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
          <h5>¿Eliminar clase?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Se eliminarán también todos los alumnos y períodos de evaluación de{' '}
            <strong>{showDeleteConfirm?.name}</strong>.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => { deleteClass(showDeleteConfirm.id); setShowDeleteConfirm(null) }}
            >
              Eliminar
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Classes
