import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Row, Col, Modal, Form, Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  FiPlus, FiTrash2, FiUserX, FiUserCheck, FiUser, FiMail, FiX, FiCheck, FiAlertTriangle, FiShield, FiSearch
} from 'react-icons/fi'
import { subscribeAll } from '../../services/firestoreService'
import './Users.css'

const Users = () => {
  const { user, isAdmin, createUser, deleteUser, suspendUser, approveUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    const unsub = subscribeAll('users', (data) => {
      setUsers(data.filter(u => u.uid !== user?.uid))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [isAdmin, user])

  const handleOpenModal = (userToEdit = null) => {
    setEditingUser(userToEdit)
    setFormData({
      name: userToEdit?.name || '',
      username: userToEdit?.username || '',
      email: userToEdit?.email || '',
      password: '',
      confirmPassword: ''
    })
    setModalError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setModalError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'username' ? value.toLowerCase().replace(/[^a-z0-9_]/g, '') : value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'El nombre es obligatorio'
    if (!formData.username.trim()) return 'El nombre de usuario es obligatorio'
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) return 'Usuario inválido (3-20 chars, solo letras, números, _)'
    if (!formData.email.trim()) return 'El correo es obligatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Correo inválido'
    if (!editingUser && formData.password.length < 6) return 'Contraseña mínimo 6 caracteres'
    if (!editingUser && formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) {
      setModalError(err)
      return
    }
    setModalLoading(true)
    try {
      if (editingUser) {
        console.log('Edit user:', editingUser.uid, formData)
      } else {
        await createUser(formData.name.trim(), formData.username.trim(), formData.email.trim().toLowerCase(), formData.password)
      }
      handleCloseModal()
    } catch (err) {
      setModalError(err.message || 'Error al guardar')
    } finally {
      setModalLoading(false)
    }
  }

  const openConfirm = (action, userData) => {
    setConfirmAction({ action, userData })
  }

  const closeConfirm = () => {
    setConfirmAction(null)
  }

  const executeConfirm = async () => {
    if (!confirmAction) return
    const { action, userData } = confirmAction
    closeConfirm()

    try {
      if (action === 'approve') {
        await approveUser(userData.uid)
      } else if (action === 'suspend') {
        await suspendUser(userData.uid, userData.status === 'active')
      } else if (action === 'delete') {
        await deleteUser(userData.uid)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSuspend = (uid, currentStatus) => {
    openConfirm('suspend', { uid, status: currentStatus })
  }

  const handleApprove = (uid) => {
    openConfirm('approve', { uid })
  }

  const handleDelete = (uid, userName) => {
    openConfirm('delete', { uid, userName })
  }

  const getConfirmConfig = () => {
    if (!confirmAction) return null
    const { action } = confirmAction
    switch (action) {
      case 'approve':
        return {
          iconClass: 'approve',
          icon: FiCheck,
          iconColor: 'var(--success)',
          iconBg: 'bg-success-soft',
          title: 'Aprobar Usuario',
          message: '¿Estás seguro de que deseas aprobar este usuario? Podrá acceder al sistema inmediatamente.',
          confirmText: 'Sí, Aprobar',
          confirmVariant: 'success',
          cancelText: 'Cancelar'
        }
      case 'suspend':
        const isSuspending = confirmAction.userData.status === 'active'
        return {
          iconClass: isSuspending ? 'suspend' : 'approve',
          icon: FiUserX,
          iconColor: isSuspending ? 'var(--warning)' : 'var(--success)',
          iconBg: isSuspending ? 'bg-warning-soft' : 'bg-success-soft',
          title: isSuspending ? 'Suspender Usuario' : 'Reactivar Usuario',
          message: isSuspending
            ? '¿Estás seguro de suspender a este usuario? No podrá acceder al sistema.'
            : '¿Estás seguro de reactivar a este usuario? Podrá acceder al sistema nuevamente.',
          confirmText: isSuspending ? 'Sí, Suspender' : 'Sí, Reactivar',
          confirmVariant: isSuspending ? 'warning' : 'success',
          cancelText: 'Cancelar'
        }
      case 'delete':
        return {
          iconClass: 'delete',
          icon: FiTrash2,
          iconColor: 'var(--danger)',
          iconBg: 'bg-danger-soft',
          title: 'Eliminar Usuario',
          message: `¿Estás seguro de eliminar a "${confirmAction.userData.userName}"? Esta acción no se puede deshacer.`,
          confirmText: 'Sí, Eliminar',
          confirmVariant: 'danger',
          cancelText: 'Cancelar'
        }
      default:
        return null
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-success-soft text-success',
      suspended: 'bg-warning-soft text-warning',
      pending: 'bg-danger-soft text-danger'
    }
    const labels = { active: 'Activo', suspended: 'Suspendido', pending: 'Pendiente' }
    return (
      <span className={`badge-custom ${badges[status] || 'bg-secondary-soft'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger-soft text-danger',
      user: 'bg-info-soft text-info'
    }
    const labels = { admin: 'Administrador', user: 'Profesor' }
    return (
      <span className={`badge-custom ${badges[role] || 'bg-secondary-soft'}`}>
        {labels[role] || role}
      </span>
    )
  }

  if (!isAdmin) {
    return (
      <div className="fade-in">
        <div className="text-center py-5">
          <FiX size={64} className="text-muted mb-3" />
          <h3>Acceso denegado</h3>
          <p className="text-muted">Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    )
  }

  const confirmConfig = getConfirmConfig()
  const filteredUsers = users.filter(item => {
    const term = searchTerm.trim().toLocaleLowerCase('es-MX')
    return !term || [item.name, item.username, item.email, item.status, item.role]
      .some(value => String(value || '').toLocaleLowerCase('es-MX').includes(term))
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administna el acceso de los profesores al sistema</p>
        </div>
        <Button className="btn-primary-custom" onClick={() => handleOpenModal()}>
          <FiPlus /> Nuevo Usuario
        </Button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 340 }}>
          <FiSearch className="search-icon" />
          <input
            type="search"
            className="form-control"
            placeholder="Buscar nombre, usuario o correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>
      </div>

      <div className="custom-card">
        <div className="card-body-custom p-0">
          {filteredUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <FiUser size={64} className="empty-icon text-muted" />
              <h5>{searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</h5>
              <p className="text-muted">{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Crea el primer usuario profesor'}</p>
            </div>
          ) : (
            <div className="table-responsive table-scroll-container">
              <table className="custom-table mb-0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="student-avatar" style={{ background: u.role === 'admin' ? 'var(--danger)' : 'var(--primary)' }}>
                            {u.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="fw-medium">@{u.username}</span>
                        </div>
                      </td>
                      <td>{u.name}</td>
                      <td>
                        <FiMail className="me-1 text-muted" size={14} />
                        {u.email}
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>{getStatusBadge(u.status)}</td>
                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          {u.status === 'pending' && (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Aprobar</Tooltip>}
                            >
                              <Button
                                variant="outline-success"
                                className="btn-sm-icon"
                                onClick={() => handleApprove(u.uid)}
                              >
                                <FiCheck />
                              </Button>
                            </OverlayTrigger>
                          )}
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{u.status === 'active' ? 'Suspender' : 'Reactivar'}</Tooltip>}
                          >
                            <Button
                              variant="outline-secondary"
                              className="btn-sm-icon"
                              onClick={() => handleSuspend(u.uid, u.status)}
                            >
                              {u.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Eliminar</Tooltip>}
                          >
                            <Button
                              variant="outline-danger"
                              className="btn-sm-icon danger"
                              onClick={() => handleDelete(u.uid, u.name)}
                            >
                              <FiTrash2 />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmConfig && (
        <Modal
          show={!!confirmAction}
          onHide={closeConfirm}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Body className="text-center p-4">
            <div className={`confirm-icon-wrapper ${confirmConfig.iconClass}`}>
              <confirmConfig.icon className="confirm-icon" />
            </div>
            <h4 className="mt-3 mb-2">{confirmConfig.title}</h4>
            <p className="text-muted mb-4">{confirmConfig.message}</p>
            <div className="d-flex justify-content-center gap-2">
              <Button variant="secondary" onClick={closeConfirm} className="px-4">
                {confirmConfig.cancelText}
              </Button>
              <Button
                variant={confirmConfig.confirmVariant}
                onClick={executeConfirm}
                className="px-4"
              >
                {confirmConfig.confirmText}
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* New User Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {modalError && <div className="alert alert-danger py-2 mb-3">{modalError}</div>}
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombre completo</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nombre completo"
                    required
                    disabled={!!editingUser}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombre de usuario</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="usuario"
                    required
                    disabled={!!editingUser}
                    minLength={3}
                    maxLength={20}
                  />
                  <Form.Text>Solo letras, números y guión bajo</Form.Text>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                    required
                    disabled={!!editingUser}
                  />
                </Form.Group>
              </Col>
              {!editingUser && (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Confirmar contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repite la contraseña"
                        required
                      />
                    </Form.Group>
                  </Col>
                </>
              )}
              {editingUser && (
                <Col md={12}>
                  <Form.Text className="text-muted">
                    Para cambiar el correo o contraseña, el usuario debe hacerlo desde su perfil.
                  </Form.Text>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={modalLoading}
          >
            {modalLoading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Users
