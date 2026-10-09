import React, { useState } from 'react'
import { Row, Col, Modal, Form, Button } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import { BsPlus, BsPencil, BsTrash, BsTrophy, BsCalendarCheck, BsSliders, BsGlobeAmericas, BsSearch } from 'react-icons/bs'
import { v4 as uuidv4 } from 'uuid'

const CRITERION_COLORS = ['#E91E86', '#F472B6', '#10B981', '#F59E0B', '#EC4899', '#BE185D', '#F9A8D4', '#14B8A6']

const Rubrics = () => {
  const { universities, classes, rubrics, addRubric, updateRubric, deleteRubric } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingRubric, setEditingRubric] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showSubCloseConfirm, setShowSubCloseConfirm] = useState(false)
  const [filterClass, setFilterClass] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    classIds: [],
    name: '',
    isFinal: false,
    criteria: [{ id: uuidv4(), name: '', description: '', maxScore: 10, weight: 100, type: 'custom', subcriteria: [] }]
  })
  const [showSubcriteriaModal, setShowSubcriteriaModal] = useState(false)
  const [editingCriterionForSub, setEditingCriterionForSub] = useState(null)
  const [subLabels, setSubLabels] = useState([])
  const [subcriteriaForm, setSubcriteriaForm] = useState([])

  const getRubricClassIds = (r) => r.classIds || (r.classId ? [r.classId] : [])

  let filteredRubrics = filterClass === 'all'
    ? rubrics
    : rubrics.filter(r => getRubricClassIds(r).includes(filterClass))
  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLocaleLowerCase('es-MX')
    filteredRubrics = filteredRubrics.filter(rubric => {
      const classNames = getRubricClassIds(rubric)
        .map(id => classes.find(cls => cls.id === id)?.name || '')
        .join(' ')
      const criteriaNames = (rubric.criteria || []).map(criterion => criterion.name || '').join(' ')
      return rubric.name?.toLocaleLowerCase('es-MX').includes(term) ||
        classNames.toLocaleLowerCase('es-MX').includes(term) ||
        criteriaNames.toLocaleLowerCase('es-MX').includes(term)
    })
  }

  // Get non-final rubrics that share at least one class with current form (to reference in final rubric)
  const availableParciales = rubrics.filter(r =>
    getRubricClassIds(r).some(id => form.classIds.includes(id)) && !r.isFinal && r.id !== editingRubric?.id
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingRubric) {
      updateRubric(editingRubric.id, form)
    } else {
      addRubric(form)
    }
    handleCloseModal()
  }

  const handleEdit = (rubric) => {
    setEditingRubric(rubric)
    setForm({
      classIds: rubric.classIds || (rubric.classId ? [rubric.classId] : []),
      name: rubric.name,
      isFinal: rubric.isFinal || false,
      criteria: rubric.criteria.map(c => ({ ...c }))
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowCloseConfirm(false)
    setShowModal(false)
    setEditingRubric(null)
    setForm({
      classIds: [],
      name: '',
      isFinal: false,
      criteria: [{ id: uuidv4(), name: '', description: '', maxScore: 10, weight: 100, type: 'custom', subcriteria: [] }]
    })
  }

  const handleTryClose = () => setShowCloseConfirm(true)

  const addCriterion = () => {
    setForm({
      ...form,
      criteria: [...form.criteria, { id: uuidv4(), name: '', description: '', maxScore: 10, weight: 0, type: 'custom', subcriteria: [] }]
    })
  }

  const addRubricReference = (rubricId) => {
    const ref = rubrics.find(r => r.id === rubricId)
    if (!ref) return
    setForm({
      ...form,
      criteria: [...form.criteria, {
        id: uuidv4(),
        name: ref.name,
        description: `Promedio de ${ref.name}`,
        maxScore: 10,
        weight: 0,
        type: 'rubric_ref',
        rubricRefId: rubricId
      }]
    })
  }

  const toggleNatgeo = (id) => {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.map(c =>
        c.id === id ? { ...c, type: c.type === 'natgeo' ? 'custom' : 'natgeo' } : c
      )
    }))
  }

  const removeCriterion = (id) => {
    if (form.criteria.length > 1) {
      setForm({ ...form, criteria: form.criteria.filter(c => c.id !== id) })
    }
  }

  const updateCriterion = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const getMaxPointsForCriterion = (criterion) => {
    if (!criterion.subcriteria?.length || !criterion.subcriteriaLabels?.length) return 0
    const maxLabel = Math.max(0, ...criterion.subcriteriaLabels.map(l => Number(l.points) || 0))
    return maxLabel * criterion.subcriteria.length
  }

  const openSubcriteriaModal = (criterion) => {
    setEditingCriterionForSub(criterion)
    if (criterion.subcriteriaLabels?.length > 0) {
      setSubLabels(criterion.subcriteriaLabels.map(l => ({ ...l })))
      setSubcriteriaForm(criterion.subcriteria.map(s => ({ id: s.id, name: s.name, descriptions: s.descriptions || {} })))
    } else {
      setSubLabels([
        { id: uuidv4(), label: 'Malo', points: 0 },
        { id: uuidv4(), label: 'Regular', points: 3 },
        { id: uuidv4(), label: 'Bueno', points: 7 },
        { id: uuidv4(), label: 'Excelente', points: 10 }
      ])
      setSubcriteriaForm([{ id: uuidv4(), name: '', descriptions: {} }])
    }
    setShowSubcriteriaModal(true)
  }

  const closeSubcriteriaModal = () => {
    setShowSubCloseConfirm(false)
    setShowSubcriteriaModal(false)
    setEditingCriterionForSub(null)
    setSubLabels([])
    setSubcriteriaForm([])
  }

  const handleTryCloseSub = () => setShowSubCloseConfirm(true)

  const saveSubcriteria = () => {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === editingCriterionForSub.id
        ? { ...c, subcriteria: subcriteriaForm, subcriteriaLabels: subLabels }
        : c
      )
    }))
    closeSubcriteriaModal()
  }

  const addSubcriterium = () => {
    setSubcriteriaForm(prev => [...prev, { id: uuidv4(), name: '', descriptions: {} }])
  }

  const removeSubcriterium = (subId) => {
    setSubcriteriaForm(prev => prev.filter(s => s.id !== subId))
  }

  const updateSubcriteriumName = (subId, value) => {
    setSubcriteriaForm(prev => prev.map(s => s.id === subId ? { ...s, name: value } : s))
  }

  const updateSubcriteriumDescription = (subId, labelId, value) => {
    setSubcriteriaForm(prev => prev.map(s =>
      s.id === subId ? { ...s, descriptions: { ...s.descriptions, [labelId]: value } } : s
    ))
  }

  const addGlobalLabel = () => {
    setSubLabels(prev => [...prev, { id: uuidv4(), label: '', points: 0, description: '' }])
  }

  const removeGlobalLabel = (labelId) => {
    if (subLabels.length <= 1) return
    setSubLabels(prev => prev.filter(l => l.id !== labelId))
  }

  const updateGlobalLabelName = (labelId, value) => {
    setSubLabels(prev => prev.map(l => l.id === labelId ? { ...l, label: value } : l))
  }

  const updateGlobalLabelPoints = (labelId, value) => {
    setSubLabels(prev => prev.map(l => l.id === labelId ? { ...l, points: Number(value) } : l))
  }

  const updateGlobalLabelDescription = (labelId, value) => {
    setSubLabels(prev => prev.map(l => l.id === labelId ? { ...l, description: value } : l))
  }

  const subMaxLabelPoints = subLabels.length > 0 ? Math.max(0, ...subLabels.map(l => Number(l.points) || 0)) : 0
  const subTotalMaxPoints = subMaxLabelPoints * subcriteriaForm.length

  const totalWeight = form.criteria
    .filter(criterion => criterion.type !== 'attendance')
    .reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0)

  // Rubric IDs already referenced in current final rubric
  const referencedRubricIds = form.criteria.filter(c => c.type === 'rubric_ref').map(c => c.rubricRefId)
  const unreferencedParciales = availableParciales.filter(r => !referencedRubricIds.includes(r.id))

  const toggleClassId = (classId) => {
    setForm(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }))
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Períodos de evaluación</h2>
          <p>Define los criterios de evaluación para tus clases</p>
        </div>
        <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
          <BsPlus size={20} /> Crear período
        </button>
      </div>

      <div className="filter-bar">
        <Form.Select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={{ maxWidth: 300 }}
        >
          <option value="all">Todas las clases</option>
          {classes.map(cls => {
            const uni = universities.find(u => u.id === cls.universityId)
            return (
              <option key={cls.id} value={cls.id}>
                {uni?.icon} {cls.name} ({cls.code})
              </option>
            )
          })}
        </Form.Select>
        <div className="search-box" style={{ maxWidth: 300 }}>
          <BsSearch className="search-icon" />
          <input
            type="search"
            className="form-control"
            placeholder="Buscar período o criterio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Buscar períodos de evaluación"
          />
        </div>
      </div>

      {filteredRubrics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h5>{searchTerm ? 'No se encontraron períodos de evaluación' : 'No hay períodos de evaluación creados'}</h5>
          <p>{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Crea períodos de evaluación con criterios para calificar a tus alumnos'}</p>
          {!searchTerm && (
            <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
              <BsPlus size={20} /> Crear período
            </button>
          )}
        </div>
      ) : (
        <Row className="g-3">
          {filteredRubrics.map((rubric, i) => {
            const rubricClassIds = rubric.classIds || (rubric.classId ? [rubric.classId] : [])
            const rubricClasses = rubricClassIds.map(id => classes.find(c => c.id === id)).filter(Boolean)
            const total = rubric.criteria.reduce((s, c) => s + (c.weight || 0), 0)
            return (
              <Col key={rubric.id} lg={6}>
                <div className={`rubric-card fade-in fade-in-delay-${(i % 4) + 1}`}>
                  <div className="rubric-header">
                    <div>
                      <div className="d-flex align-items-center gap-2" style={{ marginBottom: 4 }}>
                        <h5 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                          {rubric.name}
                        </h5>
                        {rubric.isFinal && (
                          <span className="badge-custom" style={{ background: '#F59E0B20', color: '#F59E0B', fontSize: 11 }}>
                            <BsTrophy size={12} /> Final
                          </span>
                        )}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {rubricClasses.map(cls => {
                          const uni = universities.find(u => u.id === cls.universityId)
                          return (
                            <span
                              key={cls.id}
                              className="badge-custom"
                              style={{
                                background: (uni?.color || '#E91E86') + '15',
                                color: uni?.color || '#E91E86'
                              }}
                            >
                              {uni?.icon} {cls.name}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn-sm-icon" onClick={() => handleEdit(rubric)}>
                        <BsPencil size={14} />
                      </button>
                      <button
                        className="btn-sm-icon danger"
                        onClick={() => setShowDeleteConfirm(rubric)}
                      >
                        <BsTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="rubric-criteria">
                    {rubric.criteria.map((criterion, ci) => {
                      const color = CRITERION_COLORS[ci % CRITERION_COLORS.length]
                      return (
                        <div key={criterion.id} className="criterion-item">
                          <div
                            className="criterion-weight"
                            style={{ background: color + '15', color }}
                          >
                            {criterion.weight}%
                          </div>
                          <div className="criterion-info">
                            <div className="d-flex align-items-center gap-2">
                              <h6>{criterion.name}</h6>
                              {criterion.type === 'rubric_ref' && (
                                <span style={{ fontSize: 10, background: '#E91E8615', color: '#E91E86', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                  Parcial
                                </span>
                              )}
                              {criterion.type === 'attendance' && (
                                <span style={{ fontSize: 10, background: '#10B98115', color: '#10B981', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                  <BsCalendarCheck size={10} /> Asistencia
                                </span>
                              )}
                              {criterion.type === 'natgeo' && (
                                <span style={{ fontSize: 10, background: '#3B82F615', color: '#3B82F6', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                  <BsGlobeAmericas size={10} /> NatGeo
                                </span>
                              )}
                            </div>
                            <p>{criterion.description}</p>
                            {criterion.subcriteria?.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#E91E86', marginTop: 4 }}>
                                <BsSliders size={11} />
                                {criterion.subcriteria.length} subcriterio{criterion.subcriteria.length !== 1 ? 's' : ''} · Máx: {getMaxPointsForCriterion(criterion)} pts
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Máx.</div>
                            <strong>10</strong>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{
                    padding: '12px 24px',
                    background: 'var(--bg-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {rubric.criteria.length} criterio{rubric.criteria.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      color: total === 100 ? 'var(--success)' : 'var(--danger)'
                    }}>
                      Total: {total}%
                    </span>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleTryClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingRubric ? 'Editar período de evaluación' : 'Crear período de evaluación'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Clases asignadas</Form.Label>
                  {form.classIds.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 6 }}>Selecciona al menos una clase</div>
                  )}
                  {universities.map(uni => {
                    const uniClasses = classes.filter(c => c.universityId === uni.id)
                    if (!uniClasses.length) return null
                    return (
                      <div key={uni.id} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: uni.color || '#E91E86', marginBottom: 6 }}>
                          {uni.icon} {uni.name} — {uni.abbreviation}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {uniClasses.map(cls => {
                            const checked = form.classIds.includes(cls.id)
                            return (
                              <label
                                key={cls.id}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                  padding: '5px 12px', borderRadius: 8,
                                  border: `1.5px solid ${checked ? (uni.color || '#E91E86') : 'var(--border)'}`,
                                  background: checked ? (uni.color || '#E91E86') + '15' : 'transparent',
                                  fontSize: 13, userSelect: 'none', transition: 'all 0.15s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleClassId(cls.id)}
                                  style={{ accentColor: uni.color || '#E91E86' }}
                                />
                                <span style={{ fontWeight: checked ? 600 : 400 }}>{cls.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({cls.code})</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={7}>
                <Form.Group>
                  <Form.Label>Nombre del período de evaluación</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Evaluación Parcial 1"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <div
                onClick={() => setForm({ ...form, isFinal: !form.isFinal })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: form.isFinal ? '2px solid #F59E0B' : '2px solid var(--border)',
                  background: form.isFinal ? '#F59E0B10' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: 20 }}>{form.isFinal ? '🏆' : '○'}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Período final</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Combina parciales y otros criterios para la calificación final
                  </div>
                </div>
              </div>
            </Form.Group>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>
                Criterios de Evaluación
              </h6>
              <div className="d-flex align-items-center gap-3">
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: totalWeight === 100 ? 'var(--success)' : 'var(--danger)'
                }}>
                  Total: {totalWeight}%
                </span>
                <button
                  type="button"
                  className="btn btn-outline-custom"
                  onClick={addCriterion}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  <BsPlus size={16} /> Agregar
                </button>
              </div>
            </div>

            {form.isFinal && form.classIds.length > 0 && unreferencedParciales.length > 0 && (
              <div style={{
                background: '#F59E0B10',
                border: '1px dashed #F59E0B',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                marginBottom: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#F59E0B' }}>
                  <BsTrophy size={14} /> Agregar parcial como criterio:
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {unreferencedParciales.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      className="btn btn-outline-custom"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => addRubricReference(r.id)}
                    >
                      <BsPlus size={14} /> {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.criteria.map((criterion) => (
              <div
                key={criterion.id}
                style={{
                  background: criterion.type === 'rubric_ref' ? '#E91E8608' : criterion.type === 'natgeo' ? '#3B82F608' : 'var(--bg-main)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  marginBottom: 12,
                  border: criterion.type === 'rubric_ref' ? '1px solid #E91E8630' : criterion.type === 'natgeo' ? '1px solid #3B82F640' : '1px solid var(--border)'
                }}
              >
                <div className="d-flex gap-2 mb-2">
                  {criterion.type === 'rubric_ref' ? (
                    <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, background: '#E91E8615', color: '#E91E86', padding: '2px 6px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>
                        Parcial
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{criterion.name}</span>
                    </div>
                  ) : criterion.type === 'attendance' ? (
                    <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, background: '#10B98115', color: '#10B981', padding: '2px 6px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>
                        <BsCalendarCheck size={10} /> Asistencia
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Asistencia (automático)</span>
                    </div>
                  ) : (
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="Nombre del criterio"
                      value={criterion.name}
                      onChange={e => updateCriterion(criterion.id, 'name', e.target.value)}
                      required
                      style={{ fontWeight: 600 }}
                    />
                  )}
                  <Form.Control
                    size="sm"
                    type="number"
                    placeholder="Peso %"
                    min="0"
                    max="100"
                    value={criterion.weight}
                    onChange={e => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                    style={{ width: 90 }}
                    required
                  />
                  {form.criteria.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeCriterion(criterion.id)}
                      style={{ flexShrink: 0 }}
                    >
                      <BsTrash size={14} />
                    </Button>
                  )}
                </div>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Descripción del criterio (opcional)"
                  value={criterion.description}
                  onChange={e => updateCriterion(criterion.id, 'description', e.target.value)}
                />
                {(criterion.type === 'custom' || criterion.type === 'natgeo') && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {criterion.type === 'custom' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openSubcriteriaModal(criterion)}
                          style={{
                            background: criterion.subcriteria?.length > 0 ? '#E91E8615' : 'transparent',
                            border: `1px solid ${criterion.subcriteria?.length > 0 ? '#E91E86' : 'var(--border)'}`,
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            color: criterion.subcriteria?.length > 0 ? '#E91E86' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <BsSliders size={12} /> Subcriterios
                          {criterion.subcriteria?.length > 0 && ` (${criterion.subcriteria.length})`}
                        </button>
                        {criterion.subcriteria?.length > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Total máx: <strong style={{ color: 'var(--text-primary)' }}>{getMaxPointsForCriterion(criterion)} pts</strong>
                          </span>
                        )}
                      </>
                    )}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginLeft: 'auto',
                        fontSize: 12,
                        color: criterion.type === 'natgeo' ? '#3B82F6' : 'var(--text-secondary)',
                        fontWeight: criterion.type === 'natgeo' ? 600 : 400
                      }}
                    >
                      <div
                        onClick={() => toggleNatgeo(criterion.id)}
                        style={{
                          width: 34,
                          height: 18,
                          borderRadius: 9,
                          background: criterion.type === 'natgeo' ? '#3B82F6' : 'var(--border)',
                          position: 'relative',
                          transition: 'background 0.2s',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: criterion.type === 'natgeo' ? 18 : 2,
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <BsGlobeAmericas size={12} /> NatGeo
                    </label>
                  </div>
                )}
              </div>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleTryClose}>Cancelar</Button>
            <button
              type="submit"
              className="btn btn-primary-custom"
              disabled={totalWeight !== 100 || form.classIds.length === 0}
            >
              {form.classIds.length === 0
                ? 'Selecciona al menos una clase'
                : totalWeight !== 100
                  ? `Peso total: ${totalWeight}% (debe ser 100%)`
                  : (editingRubric ? 'Guardar cambios' : 'Crear período')
              }
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
          <h5>¿Eliminar período de evaluación?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Se eliminará <strong>{showDeleteConfirm?.name}</strong> y las calificaciones asociadas.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => { deleteRubric(showDeleteConfirm.id); setShowDeleteConfirm(null) }}
            >
              Eliminar
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Subcriteria Modal */}
      <Modal
        show={showSubcriteriaModal}
        onHide={handleTryCloseSub}
        centered
        size="lg"
        style={{ zIndex: 1070 }}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            <BsSliders size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Subcriterios —{' '}
            <span style={{ color: '#E91E86' }}>{editingCriterionForSub?.name || 'Criterio'}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '68vh', overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{
            fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16,
            borderLeft: '3px solid #E91E86',
            background: '#E91E8608', borderRadius: '0 6px 6px 0', padding: '8px 12px'
          }}>
            Los puntos de cada nivel son libres — el máximo total es la suma de los mejores puntajes de cada subcriterio.
            Calificación del criterio:{' '}
            <strong>(puntos obtenidos ÷ puntos máximos) × {editingCriterionForSub?.weight ?? 0}%</strong>
          </div>

          {/* Sección 1: Niveles de evaluación globales */}
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 14,
            marginBottom: 20
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#E91E86' }}>①</span> Niveles de evaluación
              <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>
                — aplican a todos los subcriterios
              </span>
            </div>
            {/* Column headers */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingRight: 28 }}>
              <div style={{ width: 130, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Etiqueta</div>
              <div style={{ width: 70, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Puntos</div>
            </div>
            {subLabels.map((lbl, li) => (
              <div key={lbl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 16, flexShrink: 0 }}>{li + 1}.</span>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Nombre del nivel"
                  value={lbl.label}
                  onChange={e => updateGlobalLabelName(lbl.id, e.target.value)}
                  style={{ width: 130, fontWeight: 600, flexShrink: 0 }}
                />
                <Form.Control
                  size="sm"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={lbl.points}
                  onChange={e => updateGlobalLabelPoints(lbl.id, e.target.value)}
                  style={{ width: 70, textAlign: 'center', flexShrink: 0 }}
                />
                {subLabels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGlobalLabel(lbl.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '1px 3px', width: 20, flexShrink: 0 }}
                  >
                    <BsTrash size={11} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addGlobalLabel}
              style={{
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              <BsPlus size={14} /> Agregar nivel
            </button>
          </div>

          {/* Sección 2: Subcriterios */}
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E91E86' }}>②</span> Subcriterios
            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>
              — descripción por nivel configurable por subcriterio
            </span>
          </div>

          <div className="table-scroll-container" style={{ marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '0 8px 4px 0', whiteSpace: 'nowrap', minWidth: 160 }}>Subcriterio</th>
                  {subLabels.map(lbl => (
                    <th key={lbl.id} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '0 6px 4px', textAlign: 'center', minWidth: 130 }}>
                      <div style={{ fontWeight: 700 }}>{lbl.label || '—'}</div>
                      <div style={{ fontWeight: 400, fontSize: 10, color: 'var(--text-secondary)' }}>{lbl.points} pts</div>
                    </th>
                  ))}
                  <th style={{ width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {subcriteriaForm.map((sub, si) => (
                  <tr key={sub.id}>
                    <td style={{ verticalAlign: 'top', paddingRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          minWidth: 22, height: 22, borderRadius: '50%',
                          background: '#E91E8620', color: '#E91E86',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0
                        }}>{si + 1}</div>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder={`Subcriterio ${si + 1}`}
                          value={sub.name}
                          onChange={e => updateSubcriteriumName(sub.id, e.target.value)}
                          style={{ fontWeight: 600, fontSize: 12 }}
                        />
                      </div>
                    </td>
                    {subLabels.map(lbl => (
                      <td key={lbl.id} style={{ verticalAlign: 'top', padding: '0 6px' }}>
                        <Form.Control
                          as="textarea"
                          size="sm"
                          rows={2}
                          placeholder="Descripción..."
                          value={sub.descriptions?.[lbl.id] ?? ''}
                          onChange={e => updateSubcriteriumDescription(sub.id, lbl.id, e.target.value)}
                          style={{ fontSize: 11, resize: 'vertical', minHeight: 52 }}
                        />
                      </td>
                    ))}
                    <td style={{ verticalAlign: 'top', paddingTop: 2 }}>
                      {subcriteriaForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubcriterium(sub.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px 4px' }}
                        >
                          <BsTrash size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addSubcriterium}
            style={{
              width: '100%',
              background: 'transparent',
              border: '2px dashed var(--border)',
              borderRadius: 8,
              padding: '9px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginTop: 4
            }}
          >
            <BsPlus size={16} /> Agregar subcriterio
          </button>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'space-between', flexWrap: 'nowrap', gap: 12 }}>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div>
              Puntos máximos totales:{' '}
              <strong style={{ color: '#E91E86', fontSize: 15 }}>{subTotalMaxPoints} pts</strong>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>
                ({subcriteriaForm.length} subcriterio{subcriteriaForm.length !== 1 ? 's' : ''} × {subMaxLabelPoints} pts máx)
              </span>
            </div>
            {subTotalMaxPoints > 0 && editingCriterionForSub?.weight > 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                100% → <strong style={{ color: 'var(--text-primary)' }}>{editingCriterionForSub.weight}%</strong>
                {' '}&nbsp;|&nbsp; 50% → <strong style={{ color: 'var(--text-primary)' }}>{(editingCriterionForSub.weight * 0.5).toFixed(1)}%</strong>
              </div>
            )}
          </div>
          <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
            <Button variant="secondary" onClick={handleTryCloseSub}>Cancelar</Button>
            <button type="button" className="btn btn-primary-custom" onClick={saveSubcriteria}>
              Guardar Subcriterios
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Subcriteria Close Confirmation */}
      <Modal show={showSubCloseConfirm} onHide={() => setShowSubCloseConfirm(false)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h5>¿Descartar subcriterios?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>Los cambios en los subcriterios no guardados se perderán.</p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowSubCloseConfirm(false)}>Seguir editando</Button>
            <Button variant="danger" onClick={closeSubcriteriaModal}>Descartar</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Rubrics
