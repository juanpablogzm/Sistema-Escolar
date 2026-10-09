import React, { useState, useMemo } from 'react'
import { Row, Col, Modal, Form, Button, Alert } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import * as XLSX from 'xlsx'
import {
  BsPlus, BsCalendarCheck, BsCheckCircleFill, BsXCircleFill,
  BsClockFill, BsFileEarmarkTextFill, BsTrash, BsPencil, BsDownload, BsSearch
} from 'react-icons/bs'

const STATUS_CONFIG = {
  present: { label: 'Presente', icon: BsCheckCircleFill, color: '#10B981', short: '✓' },
  absent: { label: 'Ausente', icon: BsXCircleFill, color: '#EF4444', short: '✗' },
  late: { label: 'Retardo', icon: BsClockFill, color: '#F59E0B', short: '⏰' },
  justified: { label: 'Justificado', icon: BsFileEarmarkTextFill, color: '#3B82F6', short: 'J' }
}

const sanitizeExcelName = (value, fallback) => {
  const sanitized = String(value || '')
    .replace(/[\\/:*?"<>|\[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return sanitized || fallback
}

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const Attendance = () => {
  const {
    universities, classes, students, rubrics, attendance,
    addAttendance, updateAttendance, deleteAttendance
  } = useApp()

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [filterUni, setFilterUni] = useState('all')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [sessionDate, setSessionDate] = useState('')
  const [sessionRecords, setSessionRecords] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [collapseLegend, setCollapseLegend] = useState(false)
  const [collapseTable, setCollapseTable] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [sessionStudentSearch, setSessionStudentSearch] = useState('')

  const availableClasses = filterUni === 'all'
    ? classes
    : classes.filter(c => c.universityId === filterUni)

  const classStudents = useMemo(() =>
    students.filter(s => s.classId === selectedClassId).sort((a, b) => a.name.localeCompare(b.name)),
    [students, selectedClassId]
  )

  const classPeriods = useMemo(() =>
    rubrics.filter(period => (period.classIds || (period.classId ? [period.classId] : [])).includes(selectedClassId)),
    [rubrics, selectedClassId]
  )

  const classSessions = useMemo(() =>
    attendance
      .filter(a => a.classId === selectedClassId)
      .filter(a => selectedPeriodId === 'unassigned'
        ? !a.rubricId || !rubrics.some(period => period.id === a.rubricId)
        : a.rubricId === selectedPeriodId)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [attendance, rubrics, selectedClassId, selectedPeriodId]
  )

  const filteredClassStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase('es-MX')
    if (!term) return classStudents

    return classStudents.filter(student =>
      student.name?.toLocaleLowerCase('es-MX').includes(term) ||
      String(student.matricula || '').toLocaleLowerCase('es-MX').includes(term)
    )
  }, [classStudents, studentSearch])

  const matchingStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase('es-MX')
    if (!term) return []
    const availableClassIds = new Set(availableClasses.map(item => item.id))

    return students
      .filter(student => availableClassIds.has(student.classId))
      .filter(student =>
        student.name?.toLocaleLowerCase('es-MX').includes(term) ||
        String(student.matricula || '').toLocaleLowerCase('es-MX').includes(term)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [availableClasses, students, studentSearch])

  const filteredSessionRecords = useMemo(() => {
    const term = sessionStudentSearch.trim().toLocaleLowerCase('es-MX')
    if (!term) return sessionRecords

    return sessionRecords.filter(record => {
      const student = classStudents.find(item => item.id === record.studentId)
      return student?.name?.toLocaleLowerCase('es-MX').includes(term) ||
        String(student?.matricula || '').toLocaleLowerCase('es-MX').includes(term)
    })
  }, [classStudents, sessionRecords, sessionStudentSearch])

  // Open modal to create new session
  const handleNewSession = () => {
    const today = new Date().toISOString().split('T')[0]
    setSessionDate(today)
    setEditingSession(null)
    setSessionRecords(
      classStudents.map(s => ({ studentId: s.id, status: 'present' }))
    )
    setSessionStudentSearch('')
    setShowSessionModal(true)
  }

  // Open modal to edit existing session
  const handleEditSession = (session) => {
    setSessionDate(session.date)
    setEditingSession(session)
    // Merge with current students (in case students were added after session)
    const existingMap = {}
    ;(session.records || []).forEach(r => { existingMap[r.studentId] = r.status })
    setSessionRecords(
      classStudents.map(s => ({
        studentId: s.id,
        status: existingMap[s.id] || 'present'
      }))
    )
    setSessionStudentSearch('')
    setShowSessionModal(true)
  }

  const handleCloseModal = () => {
    setShowCloseConfirm(false)
    setShowSessionModal(false)
    setEditingSession(null)
    setSessionRecords([])
    setSessionDate('')
    setSessionStudentSearch('')
  }

  const handleTryClose = () => setShowCloseConfirm(true)

  const toggleStatus = (studentId) => {
    const order = ['present', 'absent', 'late', 'justified']
    setSessionRecords(prev =>
      prev.map(r => {
        if (r.studentId !== studentId) return r
        const idx = order.indexOf(r.status)
        return { ...r, status: order[(idx + 1) % order.length] }
      })
    )
  }

  const setAllStatus = (status) => {
    setSessionRecords(prev => prev.map(r => ({ ...r, status })))
  }

  const handleSaveSession = async () => {
    const data = {
      classId: selectedClassId,
      ...(selectedPeriodId !== 'unassigned' && { rubricId: selectedPeriodId }),
      date: sessionDate,
      takenAt: new Date().toISOString(),
      records: sessionRecords
    }
    if (editingSession) {
      await updateAttendance(editingSession.id, data)
    } else {
      await addAttendance(data)
    }
    handleCloseModal()
  }

  // Stats per student across all sessions
  const studentStats = useMemo(() => {
    const stats = {}
    classStudents.forEach(s => {
      stats[s.id] = { present: 0, absent: 0, late: 0, justified: 0, total: 0 }
    })
    classSessions.forEach(session => {
      (session.records || []).forEach(r => {
        if (stats[r.studentId]) {
          stats[r.studentId][r.status] = (stats[r.studentId][r.status] || 0) + 1
          stats[r.studentId].total++
        }
      })
    })
    return stats
  }, [classStudents, classSessions])

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-')
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  }

  const formatDateTime = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const handleExportExcel = () => {
    if (!selectedClassId) {
      alert('Selecciona una clase para exportar sus asistencias')
      return
    }

    const cls = classes.find(c => c.id === selectedClassId)
    const uni = cls ? universities.find(u => u.id === cls.universityId) : null
    const sortedSessions = classSessions

    if (!cls || sortedSessions.length === 0) {
      alert('La clase seleccionada no tiene asistencias para exportar')
      return
    }

    const schoolAlias = sanitizeExcelName(uni?.abbreviation || uni?.name, 'Escuela')
    const groupName = sanitizeExcelName(cls.name || cls.code, 'Grupo')
    const fileBaseName = `${schoolAlias} - ${groupName}`
    const dateHeaders = sortedSessions.map(session => parseLocalDate(session.date))
    const summaryHeaders = [
      'Presentes', 'Ausencias', 'Retardos', 'Justificados', 'Sin registro', 'Asistencia'
    ]

    const rows = students
      .filter(student => student.classId === selectedClassId)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(student => {
        const counts = { present: 0, absent: 0, late: 0, justified: 0, missing: 0 }
        const statuses = sortedSessions.map(session => {
          const record = (session.records || []).find(item => item.studentId === student.id)
          if (!record || !STATUS_CONFIG[record.status]) {
            counts.missing++
            return 'Sin registro'
          }
          counts[record.status]++
          return STATUS_CONFIG[record.status].label
        })
        const recordedSessions = sortedSessions.length - counts.missing
        const attendanceRate = recordedSessions > 0
          ? (counts.present + counts.justified + counts.late * 0.5) / recordedSessions
          : null

        return [
          student.name || '',
          String(student.matricula || ''),
          ...statuses,
          counts.present,
          counts.absent,
          counts.late,
          counts.justified,
          counts.missing,
          attendanceRate
        ]
      })

    const headerRowIndex = 5
    const wsData = [
      ['Escuela', uni?.name || 'Sin universidad'],
      ['Alias', schoolAlias],
      ['Grupo', groupName],
      ['Clase', cls.name || 'Sin clase'],
      ['Semestre', cls.semester || ''],
      ['Alumno', 'Matrícula', ...dateHeaders, ...summaryHeaders],
      ...rows
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData, { cellDates: true })
    const dateStartColumn = 2
    sortedSessions.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: dateStartColumn + index })
      if (ws[cellAddress]) ws[cellAddress].z = 'dd/mm/yyyy'
    })

    const attendanceColumn = dateStartColumn + sortedSessions.length + summaryHeaders.length - 1
    rows.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex + 1 + index, c: attendanceColumn })
      if (ws[cellAddress]) ws[cellAddress].z = '0%'
    })

    ws['!cols'] = [
      { wch: 28 },
      { wch: 18 },
      ...sortedSessions.map(() => ({ wch: 14 })),
      ...summaryHeaders.map(header => ({ wch: Math.max(12, header.length + 2) }))
    ]
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: headerRowIndex + rows.length, c: attendanceColumn }
      })
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, fileBaseName.slice(0, 31))
    XLSX.writeFile(wb, `${fileBaseName}.xlsx`)
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedUni = selectedClass ? universities.find(u => u.id === selectedClass.universityId) : null

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Asistencia</h2>
          <p>Registra y consulta la asistencia de tus alumnos por período de evaluación</p>
        </div>
        <div className="d-flex gap-2 page-header-actions">
          <button
            className="btn btn-outline-custom"
            onClick={handleExportExcel}
            disabled={!selectedClassId || !selectedPeriodId || classStudents.length === 0 || classSessions.length === 0}
            title={!selectedClassId ? 'Selecciona una clase para exportar' : !selectedPeriodId ? 'Selecciona un período de evaluación para exportar' : undefined}
          >
            <BsDownload size={20} /> Exportar Excel
          </button>
          {selectedClassId && selectedPeriodId && selectedPeriodId !== 'unassigned' && classStudents.length > 0 && (
            <button className="btn btn-primary-custom" onClick={handleNewSession}>
              <BsPlus size={20} /> Nueva Sesión
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <Form.Select
          value={filterUni}
          onChange={e => { setFilterUni(e.target.value); setSelectedClassId(''); setSelectedPeriodId('') }}
          style={{ maxWidth: 250 }}
        >
          <option value="all">Todas las universidades</option>
          {universities.map(uni => (
            <option key={uni.id} value={uni.id}>{uni.icon} {uni.name}</option>
          ))}
        </Form.Select>
        <Form.Select
          value={selectedClassId}
          onChange={e => { setSelectedClassId(e.target.value); setSelectedPeriodId('') }}
          style={{ maxWidth: 300 }}
        >
          <option value="">Seleccionar clase...</option>
          {availableClasses.map(cls => {
            const uni = universities.find(u => u.id === cls.universityId)
            return (
              <option key={cls.id} value={cls.id}>
                {uni?.icon} {cls.name} ({cls.code})
              </option>
            )
          })}
        </Form.Select>
        {selectedClassId && (
          <Form.Select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            style={{ maxWidth: 300 }}
          >
            <option value="">Seleccionar período de evaluación...</option>
            {classPeriods.map(period => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
            <option value="unassigned">Sin período asignado</option>
          </Form.Select>
        )}
        <div className="search-box" style={{ maxWidth: 280 }}>
          <BsSearch className="search-icon" />
          <input
            type="search"
            className="form-control"
            placeholder="Buscar alumno o matrícula..."
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            aria-label="Buscar alumno en asistencia"
          />
        </div>
      </div>

      {!selectedClassId ? (
        studentSearch.trim() ? (
          matchingStudents.length > 0 ? (
            <div className="custom-card">
              <div className="card-body-custom p-0">
                <div className="table-scroll-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Matrícula</th>
                        <th>Clase</th>
                        <th style={{ width: 160 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchingStudents.map(student => {
                        const cls = classes.find(item => item.id === student.classId)
                        return (
                          <tr key={student.id}>
                            <td><strong>{student.name}</strong></td>
                            <td><code>{student.matricula}</code></td>
                            <td>{cls?.name || 'Sin clase'}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-custom" onClick={() => setSelectedClassId(student.classId)}>
                                Ver asistencia
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h5>No se encontraron alumnos</h5>
              <p>Intenta con otro nombre o matrícula.</p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h5>Selecciona una clase o busca un alumno</h5>
            <p>Usa el buscador para localizar la asistencia de un alumno sin elegir primero su grupo.</p>
          </div>
        )
      ) : !selectedPeriodId ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h5>Selecciona un período de evaluación</h5>
          <p>Elige el período al que corresponde la asistencia para consultar o registrar sesiones.</p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h5>No hay alumnos en esta clase</h5>
          <p>Agrega alumnos a la clase para poder tomar asistencia</p>
        </div>
      ) : (
<>
              {/* Class info card - always visible */}
              {selectedClass && (
                <div className="custom-card mb-3">
                  <div className="card-body-custom py-2 px-3 d-flex align-items-center justify-content-between">
                    <div>
                      <strong>{selectedUni?.icon} {selectedClass.name}</strong>
                      <span className="text-muted ms-2">({selectedClass.code})</span>
                      <span className="text-muted ms-2">• {classStudents.length} alumnos • {classSessions.length} sesiones</span>
                      <span className="text-muted ms-2">• {selectedPeriodId === 'unassigned' ? 'Sin período asignado' : classPeriods.find(period => period.id === selectedPeriodId)?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {classSessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h5>No hay sesiones registradas</h5>
                  <p>Crea una nueva sesión para comenzar a tomar asistencia</p>
                  {selectedPeriodId !== 'unassigned' && (
                    <button className="btn btn-primary-custom" onClick={handleNewSession}>
                      <BsPlus size={20} /> Nueva Sesión
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Legend - collapsible on mobile */}
                  <div className="collapsible-section">
                    <button
                      type="button"
                      className={`collapsible-header ${collapseLegend ? 'collapsed' : ''}`}
                      onClick={() => setCollapseLegend(!collapseLegend)}
                      aria-expanded={!collapseLegend}
                      aria-controls="attendance-legend"
                    >
                      <span>📋 Estado de Asistencia</span>
                      <span className="collapse-icon">▼</span>
                    </button>
                    <div id="attendance-legend" className={`collapsible-body ${collapseLegend ? 'hidden' : ''}`} style={{ padding: '8px 16px 16px' }}>
                      <div className="d-flex gap-3 mb-3 flex-wrap legend-bar" style={{ fontSize: 13 }}>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <div key={key} className="d-flex align-items-center gap-1">
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: '50%',
                              background: cfg.color + '20', color: cfg.color, fontSize: 12, fontWeight: 600
                            }}>
                              {cfg.short}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table - collapsible on mobile */}
                  <div className="collapsible-section">
                    <button
                      type="button"
                      className={`collapsible-header ${collapseTable ? 'collapsed' : ''}`}
                      onClick={() => setCollapseTable(!collapseTable)}
                      aria-expanded={!collapseTable}
                      aria-controls="attendance-table"
                    >
                      <span>📊 Tabla de Asistencia</span>
                      <span className="collapse-icon">▼</span>
                    </button>
                    <div id="attendance-table" className={`collapsible-body ${collapseTable ? 'hidden' : ''}`} style={{ padding: 0 }}>
                      <div className="custom-card">
                        <div className="card-body-custom p-0">
                          <div className="table-scroll-container">
                            <table className="custom-table" style={{ minWidth: Math.max(600, 250 + classSessions.length * 80 + 200) }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 200, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2 }}>Alumno</th>
                        {classSessions.map(session => (
                          <th key={session.id} style={{ textAlign: 'center', minWidth: 75, fontSize: 12 }}>
                            <div>{formatDate(session.date)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>
                              {session.takenAt ? formatDateTime(session.takenAt).split(',').pop()?.trim() : ''}
                            </div>
                            <div className="d-flex gap-1 justify-content-center mt-1">
                              <button
                                className="btn-sm-icon"
                                style={{ width: 22, height: 22 }}
                                onClick={() => handleEditSession(session)}
                                title="Editar"
                              >
                                <BsPencil size={10} />
                              </button>
                              <button
                                className="btn-sm-icon danger"
                                style={{ width: 22, height: 22 }}
                                onClick={() => setShowDeleteConfirm(session)}
                                title="Eliminar"
                              >
                                <BsTrash size={10} />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th style={{ textAlign: 'center', minWidth: 180 }}>Resumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassStudents.map(student => {
                        const stats = studentStats[student.id] || { present: 0, absent: 0, late: 0, justified: 0, total: 0 }
                        const pct = stats.total > 0
                          ? Math.round(((stats.present + stats.justified + stats.late * 0.5) / stats.total) * 100)
                          : 0
                        return (
                          <tr key={student.id}>
                            <td style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                              <div>
                                <strong style={{ fontSize: 13 }}>{student.name}</strong>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{student.matricula}</div>
                              </div>
                            </td>
                            {classSessions.map(session => {
                              const rec = (session.records || []).find(r => r.studentId === student.id)
                              const status = rec?.status || 'absent'
                              const cfg = STATUS_CONFIG[status]
                              return (
                                <td key={session.id} style={{ textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: cfg.color + '20',
                                      color: cfg.color,
                                      fontSize: 14,
                                      fontWeight: 600
                                    }}
                                    title={`${cfg.label} - ${session.date}`}
                                  >
                                    {cfg.short}
                                  </span>
                                </td>
                              )
                            })}
                            <td style={{ textAlign: 'center' }}>
                              <div className="d-flex align-items-center justify-content-center gap-2" style={{ fontSize: 12 }}>
                                <span style={{ color: '#10B981' }} title="Presentes">{stats.present}✓</span>
                                <span style={{ color: '#EF4444' }} title="Ausencias">{stats.absent}✗</span>
                                <span style={{ color: '#F59E0B' }} title="Retardos">{stats.late}⏰</span>
                                <span style={{ color: '#3B82F6' }} title="Justificados">{stats.justified}J</span>
                                <span
                                  className="badge-custom"
                                  style={{
                                    background: pct >= 80 ? '#10B98120' : pct >= 60 ? '#F59E0B20' : '#EF444420',
                                    color: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                                    fontWeight: 700,
                                    fontSize: 12
                                  }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredClassStudents.length === 0 && (
                        <tr>
                          <td colSpan={classSessions.length + 2} className="text-center py-4 text-muted">
                            No se encontraron alumnos con esa búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
            </>
          )}
        </>
      )}

      {/* Take / Edit Attendance Modal */}
      <Modal show={showSessionModal} onHide={handleTryClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BsCalendarCheck className="me-2" />
            {editingSession ? 'Editar Asistencia' : 'Tomar Asistencia'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Fecha de la sesión</Form.Label>
            <Form.Control
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              required
            />
          </Form.Group>

          <div className="d-flex gap-2 mb-3">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Marcar todos:</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Button
                key={key}
                size="sm"
                variant="outline-secondary"
                style={{ fontSize: 12 }}
                onClick={() => setAllStatus(key)}
              >
                <span style={{ color: cfg.color }}>{cfg.short}</span> {cfg.label}
              </Button>
            ))}
          </div>

          <div className="search-box mb-3" style={{ maxWidth: 360 }}>
            <BsSearch className="search-icon" />
            <input
              type="search"
              className="form-control"
              placeholder="Buscar alumno o matrícula..."
              value={sessionStudentSearch}
              onChange={e => setSessionStudentSearch(e.target.value)}
              aria-label="Buscar alumno para registrar asistencia"
            />
          </div>

          <div className="table-scroll-container" style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Alumno</th>
                  <th>Matrícula</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessionRecords.map((rec, i) => {
                  const student = classStudents.find(s => s.id === rec.studentId)
                  if (!student) return null
                  const cfg = STATUS_CONFIG[rec.status]
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={rec.studentId}>
                      <td style={{ width: 40, fontSize: 13 }}>{i + 1}</td>
                      <td><strong style={{ fontSize: 13 }}>{student.name}</strong></td>
                      <td><code style={{ fontSize: 12 }}>{student.matricula}</code></td>
                      <td style={{ textAlign: 'center', width: 160 }}>
                        <button
                          type="button"
                          onClick={() => toggleStatus(rec.studentId)}
                          style={{
                            background: cfg.color + '15',
                            color: cfg.color,
                            border: `2px solid ${cfg.color}40`,
                            borderRadius: 8,
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease',
                            minWidth: 130
                          }}
                        >
                          <StatusIcon size={16} /> {cfg.label}
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredSessionRecords.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No se encontraron alumnos con esa búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleTryClose}>Cancelar</Button>
          <button
            className="btn btn-primary-custom"
            onClick={handleSaveSession}
            disabled={!sessionDate || sessionRecords.length === 0}
          >
            {editingSession ? 'Guardar Cambios' : 'Guardar Asistencia'}
          </button>
        </Modal.Footer>
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
          <h5>¿Eliminar sesión?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Se eliminará la asistencia del <strong>{showDeleteConfirm?.date}</strong>.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => { deleteAttendance(showDeleteConfirm.id); setShowDeleteConfirm(null) }}
            >
              Eliminar
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Attendance
