import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Form, Modal, Button } from 'react-bootstrap'
import { useApp } from '../../context/AppContext'
import { BsSave, BsCheckCircle, BsDownload, BsSliders, BsGlobeAmericas, BsUpload, BsSearch } from 'react-icons/bs'
import * as XLSX from 'xlsx'

const Grades = () => {
  const { universities, classes, students, rubrics, grades, attendance, addGrade, updateGrade } = useApp()
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedRubric, setSelectedRubric] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [localGrades, setLocalGrades] = useState({})
  const [localSubSelections, setLocalSubSelections] = useState({})
  const [saved, setSaved] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [subModalStudent, setSubModalStudent] = useState(null)
  const [subModalCriterion, setSubModalCriterion] = useState(null)
  const [subModalSelections, setSubModalSelections] = useState({})
  const [showSubCloseConfirm, setShowSubCloseConfirm] = useState(false)
  const [subModalManualGrade, setSubModalManualGrade] = useState('')
  const [natgeoImportResult, setNatgeoImportResult] = useState(null) // { matched, unmatched, pendingUpdates }
  const [activNatgeoCriterionId, setActivNatgeoCriterionId] = useState(null)
  const natgeoFileInputRef = useRef(null)
  const autoSaveTimers = useRef({})
  const localGradesRef = useRef({})
  const localSubSelectionsRef = useRef({})
  const gradesRef = useRef([])

  // Keep refs in sync with latest state/context to avoid stale closures in debounced saves
  useEffect(() => { localGradesRef.current = localGrades }, [localGrades])
  useEffect(() => { localSubSelectionsRef.current = localSubSelections }, [localSubSelections])
  useEffect(() => { gradesRef.current = grades }, [grades])

  const filteredClasses = useMemo(() => selectedUniversity ? classes.filter(c => c.universityId === selectedUniversity) : [], [classes, selectedUniversity])
  const classObj = useMemo(() => classes.find(c => c.id === selectedClass), [classes, selectedClass])
  const rubricObj = useMemo(() => rubrics.find(r => r.id === selectedRubric), [rubrics, selectedRubric])
  const classStudents = useMemo(() => students.filter(s => s.classId === selectedClass), [students, selectedClass])
  const visibleClassStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase('es-MX')
    if (!term) return classStudents
    return classStudents.filter(student =>
      student.name?.toLocaleLowerCase('es-MX').includes(term) ||
      String(student.matricula || '').toLocaleLowerCase('es-MX').includes(term)
    )
  }, [classStudents, studentSearch])
  const classRubrics = useMemo(() => rubrics.filter(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(selectedClass)), [rubrics, selectedClass])
  const uni = useMemo(() => classObj ? universities.find(u => u.id === classObj.universityId) : null, [universities, classObj])
  const gradingCriteria = useMemo(
    () => rubricObj?.criteria.filter(criterion => criterion.type !== 'attendance') || [],
    [rubricObj]
  )

  useEffect(() => {
    if (!selectedRubric || !rubricObj || classStudents.length === 0) return
    const initial = {}
    const initialSub = {}
    classStudents.forEach(student => {
      const existingGrade = grades.find(
        g => g.studentId === student.id && g.rubricId === selectedRubric
      )
      initial[student.id] = {}
      initialSub[student.id] = {}
      gradingCriteria.forEach(criterion => {
        initial[student.id][criterion.id] = existingGrade?.scores?.[criterion.id] ?? ''
        if (criterion.subcriteria?.length) {
          initialSub[student.id][criterion.id] = existingGrade?.subSelections?.[criterion.id] ?? {}
        }
      })
    })
    setLocalGrades(initial)
    setLocalSubSelections(initialSub)
  }, [selectedRubric, classStudents, grades, gradingCriteria])

  const saveStudentGrade = (studentId) => {
    if (!rubricObj) return
    const currentGrades = localGradesRef.current
    const currentSubSelections = localSubSelectionsRef.current
    const existingGrade = gradesRef.current.find(
      g => g.studentId === studentId && g.rubricId === selectedRubric
    )
    const scores = {}
    const subSel = {}
    gradingCriteria.forEach(criterion => {
      scores[criterion.id] = Number(currentGrades[studentId]?.[criterion.id]) || 0
      if (criterion.subcriteria?.length) {
        subSel[criterion.id] = currentSubSelections[studentId]?.[criterion.id] ?? {}
      }
    })
    if (existingGrade) {
      updateGrade(existingGrade.id, { scores, subSelections: subSel })
    } else {
      addGrade({ studentId, rubricId: selectedRubric, scores, subSelections: subSel })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleScoreChange = (studentId, criterionId, value) => {
    const num = value === '' ? '' : Math.min(Math.max(0, Number(value)), 10)
    setLocalGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [criterionId]: num } }))
    setSaved(false)
    clearTimeout(autoSaveTimers.current[studentId])
    autoSaveTimers.current[studentId] = setTimeout(() => {
      saveStudentGrade(studentId)
    }, 800)
  }

  const getScoreFromSubSelections = (criterion, selections) => {
    if (!criterion.subcriteria?.length || !criterion.subcriteriaLabels?.length) return 0
    const maxLabelPoints = Math.max(0, ...criterion.subcriteriaLabels.map(l => Number(l.points) || 0))
    const totalMax = maxLabelPoints * criterion.subcriteria.length
    if (totalMax === 0) return 0
    const obtained = criterion.subcriteria.reduce((sum, sub) => {
      const selectedLabelId = selections?.[sub.id]
      if (!selectedLabelId) return sum
      const lbl = criterion.subcriteriaLabels.find(l => l.id === selectedLabelId)
      return sum + (Number(lbl?.points) || 0)
    }, 0)
    return Math.round((obtained / totalMax) * 10 * 100) / 100
  }

  const openSubModal = (student, criterion) => {
    setSubModalStudent(student)
    setSubModalCriterion(criterion)
    setSubModalSelections({ ...(localSubSelections[student.id]?.[criterion.id] ?? {}) })
    setSubModalManualGrade('')
    setShowSubModal(true)
  }

  const closeSubModal = () => {
    setShowSubCloseConfirm(false)
    setShowSubModal(false)
    setSubModalStudent(null)
    setSubModalCriterion(null)
    setSubModalSelections({})
    setSubModalManualGrade('')
  }

  const handleTryCloseSubModal = () => setShowSubCloseConfirm(true)

  const saveSubModal = () => {
    const score = subModalManualGrade !== ''
      ? Math.min(Math.max(0, Number(subModalManualGrade)), 10)
      : getScoreFromSubSelections(subModalCriterion, subModalSelections)
    const studentId = subModalStudent.id
    const criterionId = subModalCriterion.id
    const updatedGrades = {
      ...localGrades,
      [studentId]: { ...localGrades[studentId], [criterionId]: score }
    }
    const updatedSubSelections = {
      ...localSubSelections,
      [studentId]: { ...localSubSelections[studentId], [criterionId]: subModalSelections }
    }
    setLocalGrades(updatedGrades)
    setLocalSubSelections(updatedSubSelections)
    // Update refs immediately so saveStudentGrade reads the latest values
    localGradesRef.current = updatedGrades
    localSubSelectionsRef.current = updatedSubSelections
    saveStudentGrade(studentId)
    closeSubModal()
  }

  const getAbsenceCount = (studentId) => attendance
    .filter(session => session.classId === selectedClass && session.rubricId === selectedRubric)
    .reduce(
      (total, session) => total + ((session.records || []).some(record => record.studentId === studentId && record.status === 'absent') ? 1 : 0),
      0
    )

  // Calculate a student's grade for a referenced rubric (parcial)
  const calculateRubricRefGrade = (studentId, rubricRefId) => {
    const refRubric = rubrics.find(r => r.id === rubricRefId)
    if (!refRubric) return 0
    const studentGrade = grades.find(g => g.studentId === studentId && g.rubricId === rubricRefId)
    if (!studentGrade?.scores) return 0
    const criteria = refRubric.criteria.filter(criterion => criterion.type !== 'attendance')
    const totalWeight = criteria.reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0)
    if (totalWeight === 0) return 0
    let total = 0
    criteria.forEach(criterion => {
      const score = Number(studentGrade.scores[criterion.id]) || 0
      const percentage = score / 10
      total += percentage * criterion.weight
    })
    return Math.round((total / totalWeight) * 10 * 100) / 100
  }

  const calculateFinalGrade = (studentId) => {
    if (!rubricObj || !localGrades[studentId]) return 0
    const totalWeight = gradingCriteria.reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0)
    if (totalWeight === 0) return 0
    let total = 0
    gradingCriteria.forEach(criterion => {
      let score
      if (criterion.type === 'rubric_ref') {
        score = calculateRubricRefGrade(studentId, criterion.rubricRefId)
      } else {
        score = Number(localGrades[studentId]?.[criterion.id]) || 0
      }
      const percentage = score / 10
      total += percentage * criterion.weight
    })
    return Math.round((total / totalWeight) * 10 * 100) / 100
  }

  const getGradeColor = (grade) => {
    if (grade >= 9) return 'var(--success)'
    if (grade >= 8) return 'var(--info)'
    if (grade >= 7) return 'var(--warning)'
    return 'var(--danger)'
  }

  const handleSave = () => {
    classStudents.forEach(student => {
      const existingGrade = grades.find(
        g => g.studentId === student.id && g.rubricId === selectedRubric
      )
      const scores = {}
      const subSel = {}
      gradingCriteria.forEach(criterion => {
        scores[criterion.id] = Number(localGrades[student.id]?.[criterion.id]) || 0
        if (criterion.subcriteria?.length) {
          subSel[criterion.id] = localSubSelections[student.id]?.[criterion.id] ?? {}
        }
      })
      if (existingGrade) {
        updateGrade(existingGrade.id, { scores, subSelections: subSel })
      } else {
        addGrade({ studentId: student.id, rubricId: selectedRubric, scores, subSelections: subSel })
      }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExport = () => {
    const rows = classStudents.map(student => {
      const row = {
        'Alumno': student.name,
        'Matrícula': student.matricula || ''
      }
      gradingCriteria.forEach(criterion => {
        if (criterion.type === 'rubric_ref') {
          row[criterion.name] = calculateRubricRefGrade(student.id, criterion.rubricRefId)
        } else {
          row[criterion.name] = Number(localGrades[student.id]?.[criterion.id]) || 0
        }
      })
      row['Inasistencias'] = getAbsenceCount(student.id)
      row['Calificación Final'] = calculateFinalGrade(student.id)
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones')
    const fileName = `${uni?.abbreviation || 'Universidad'} - ${classObj?.name || 'Clase'} - ${rubricObj.name}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // --- NatGeo Excel import ---
  const normalizeName = (str) =>
    str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim()

  const matchStudentByNatGeoName = (natgeoName, studentList) => {
    // NatGeo format: "Vasquez, Ashley" → split by comma
    const normalized = normalizeName(natgeoName)
    const parts = natgeoName.split(',').map(p => normalizeName(p.trim())).filter(Boolean)
    return studentList.find(student => {
      const sn = normalizeName(student.name)
      if (parts.length >= 2) {
        return parts.every(part => sn.includes(part))
      }
      return sn.includes(normalized)
    })
  }

  const parseNatGeoExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

          let headerRowIdx = -1
          let nameColIdx = -1
          let scoreColIdx = -1

          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              const cellVal = String(rows[r][c]).trim()
              if (cellVal === 'Student Name') {
                nameColIdx = c
                headerRowIdx = r
              }
              if (cellVal === 'Average Score') {
                scoreColIdx = c
              }
            }
            if (nameColIdx !== -1 && scoreColIdx !== -1) break
          }

          if (nameColIdx === -1 || scoreColIdx === -1) {
            reject(new Error('No se encontraron las columnas "Student Name" y "Average Score" en el archivo.'))
            return
          }

          const results = []
          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const name = String(rows[r][nameColIdx] || '').trim()
            const scoreRaw = String(rows[r][scoreColIdx] || '').trim()
            if (!name) continue
            let score = null
            if (scoreRaw.endsWith('%')) {
              const pct = parseFloat(scoreRaw)
              if (!isNaN(pct)) score = Math.round(Math.min(Math.max(pct / 10, 0), 10) * 100) / 100
            } else {
              const num = parseFloat(scoreRaw)
              if (!isNaN(num)) {
                // if stored as decimal (e.g. 0.61) vs percentage (61)
                const pct = num > 1 ? num : num * 100
                score = Math.round(Math.min(Math.max(pct / 10, 0), 10) * 100) / 100
              }
            }
            if (name && score !== null) {
              results.push({ name, score })
            }
          }
          resolve(results)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Error leyendo el archivo'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleNatGeoFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !activNatgeoCriterionId) return
    e.target.value = ''
    try {
      const parsed = await parseNatGeoExcel(file)
      const matched = []
      const unmatched = []
      const updates = {}
      parsed.forEach(({ name, score }) => {
        const student = matchStudentByNatGeoName(name, classStudents)
        if (student) {
          matched.push({ studentName: student.name, excelName: name, score })
          updates[student.id] = score
        } else {
          unmatched.push(name)
        }
      })
      // Don't apply yet — show preview first, apply on confirm
      setNatgeoImportResult({ matched, unmatched, pendingUpdates: updates, criterionId: activNatgeoCriterionId })
    } catch (err) {
      setNatgeoImportResult({ error: err.message })
    }
  }

  const triggerNatGeoImport = (criterionId) => {
    setActivNatgeoCriterionId(criterionId)
    setTimeout(() => natgeoFileInputRef.current?.click(), 0)
  }
  // --- end NatGeo ---

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Calificaciones</h2>
          <p>Califica a tus alumnos por período de evaluación</p>
        </div>
        {selectedRubric && classStudents.length > 0 && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-custom" onClick={handleExport}>
              <BsDownload size={18} /> Exportar Excel
            </button>
            <button className="btn btn-primary-custom" onClick={handleSave}>
              {saved
                ? <><BsCheckCircle size={18} /> ¡Guardado!</>
                : <><BsSave size={18} /> Guardar Calificaciones</>
              }
            </button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <Form.Select
          value={selectedUniversity}
          onChange={e => { setSelectedUniversity(e.target.value); setSelectedClass(''); setSelectedRubric('') }}
          style={{ maxWidth: 300 }}
        >
          <option value="">Seleccionar universidad...</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.icon} {u.name}</option>
          ))}
        </Form.Select>
        {selectedUniversity && (
          <Form.Select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedRubric('') }}
            style={{ maxWidth: 300 }}
          >
            <option value="">Seleccionar clase...</option>
            {filteredClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </Form.Select>
        )}
        {selectedClass && (
          <Form.Select
            value={selectedRubric}
            onChange={e => setSelectedRubric(e.target.value)}
            style={{ maxWidth: 300 }}
          >
            <option value="">Seleccionar período de evaluación...</option>
            {classRubrics.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Form.Select>
        )}
        {selectedClass && (
          <div className="search-box" style={{ maxWidth: 280 }}>
            <BsSearch className="search-icon" />
            <input
              type="search"
              className="form-control"
              placeholder="Buscar alumno o matrícula..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              aria-label="Buscar alumno en calificaciones"
            />
          </div>
        )}
      </div>

      {!selectedUniversity ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h5>Selecciona una universidad</h5>
          <p>Elige una universidad para ver sus clases y comenzar a calificar</p>
        </div>
      ) : !selectedClass ? (
        <div className="empty-state">
          <div className="empty-icon">🏫</div>
          <h5>Selecciona una clase</h5>
          <p>Elige una clase y un período de evaluación para comenzar a calificar</p>
        </div>
      ) : !selectedRubric ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h5>Selecciona un período de evaluación</h5>
          <p>
            {classRubrics.length === 0
              ? 'Esta clase no tiene períodos de evaluación. Crea uno primero en la sección de Períodos de evaluación.'
              : 'Elige un período de evaluación para calificar a los alumnos.'
            }
          </p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h5>No hay alumnos en esta clase</h5>
          <p>Agrega alumnos a esta clase para poder calificarlos</p>
        </div>
      ) : (
        <div className="custom-card">
          <div className="card-header-custom">
            <div>
              <h5 style={{ marginBottom: 4 }}>{rubricObj.name}</h5>
              <div className="d-flex gap-2 flex-wrap">
                {uni && (
                  <span
                    className="badge-custom"
                    style={{
                      background: (uni.color || '#E91E86') + '15',
                      color: uni.color || '#E91E86'
                    }}
                  >
                    {uni.icon} {uni.abbreviation}
                  </span>
                )}
                <span className="badge-custom bg-primary-soft">{classObj?.name}</span>
              </div>
            </div>
          </div>
          <div className="card-body-custom p-0 table-scroll-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200, position: 'sticky', left: 0, background: 'var(--bg-main)', zIndex: 1 }}>
                    Alumno
                  </th>
                  {gradingCriteria.map(c => (
                    <th key={c.id} style={{ textAlign: 'center', minWidth: 140 }}>
                      <div>{c.name}</div>
                      <small style={{ fontWeight: 400, textTransform: 'none' }}>
                        ({c.weight}%){c.type === 'rubric_ref' ? ' 📋' : c.type === 'natgeo' ? ' 🌍' : ''}
                      </small>
                      {c.type === 'natgeo' && (
                        <div style={{ marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => triggerNatGeoImport(c.id)}
                            style={{
                              background: '#3B82F6',
                              border: 'none',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: 11,
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600
                            }}
                          >
                            <BsUpload size={10} /> Importar Excel
                          </button>
                        </div>
                      )}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', minWidth: 130 }}>Inasistencias</th>
                  <th style={{ textAlign: 'center', minWidth: 100 }}>Final</th>
                </tr>
              </thead>
              <tbody>
                {visibleClassStudents.map(student => {
                  const finalGrade = calculateFinalGrade(student.id)
                  return (
                    <tr key={student.id}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                        <strong style={{ fontSize: 14 }}>{student.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {student.matricula}
                        </div>
                      </td>
                      {gradingCriteria.map(criterion => (
                        <td key={criterion.id} style={{ textAlign: 'center' }}>
                          {criterion.type === 'rubric_ref' ? (
                            <span style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: getGradeColor(calculateRubricRefGrade(student.id, criterion.rubricRefId)),
                              opacity: 0.9
                            }}>
                              {calculateRubricRefGrade(student.id, criterion.rubricRefId).toFixed(1)}
                            </span>
                          ) : criterion.type === 'natgeo' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <input
                                type="number"
                                className="grade-input"
                                min="0"
                                max={10}
                                value={localGrades[student.id]?.[criterion.id] ?? ''}
                                onChange={e => handleScoreChange(student.id, criterion.id, e.target.value)}
                                placeholder="—"
                              />
                              {localGrades[student.id]?.[criterion.id] !== '' && localGrades[student.id]?.[criterion.id] !== undefined && (
                                <span style={{ fontSize: 10, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <BsGlobeAmericas size={9} /> importado
                                </span>
                              )}
                            </div>
                          ) : criterion.subcriteria?.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openSubModal(student, criterion)}
                              style={{
                                background: localGrades[student.id]?.[criterion.id] !== '' && localGrades[student.id]?.[criterion.id] !== undefined
                                  ? getGradeColor(Number(localGrades[student.id]?.[criterion.id])) + '18'
                                  : 'var(--bg-main)',
                                border: `1.5px solid ${localGrades[student.id]?.[criterion.id] !== '' && localGrades[student.id]?.[criterion.id] !== undefined ? getGradeColor(Number(localGrades[student.id]?.[criterion.id])) : 'var(--border)'}`,
                                borderRadius: 8,
                                padding: '4px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                minWidth: 70,
                                margin: '0 auto'
                              }}
                            >
                              {localGrades[student.id]?.[criterion.id] !== '' && localGrades[student.id]?.[criterion.id] !== undefined ? (
                                <strong style={{ fontSize: 15, color: getGradeColor(Number(localGrades[student.id]?.[criterion.id])) }}>
                                  {Number(localGrades[student.id]?.[criterion.id]).toFixed(1)}
                                </strong>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                              )}
                              <span style={{ fontSize: 10, color: '#E91E86', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BsSliders size={9} /> evaluar
                              </span>
                            </button>
                          ) : (
                            <input
                              type="number"
                              className="grade-input"
                              min="0"
                              max={10}
                              value={localGrades[student.id]?.[criterion.id] ?? ''}
                              onChange={e => handleScoreChange(student.id, criterion.id, e.target.value)}
                              placeholder="—"
                            />
                          )}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {getAbsenceCount(student.id)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: getGradeColor(finalGrade)
                        }}>
                          {finalGrade.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {visibleClassStudents.length === 0 && (
                  <tr>
                    <td colSpan={gradingCriteria.length + 3} className="text-center py-4 text-muted">
                      No se encontraron alumnos con esa búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subcriteria Grading Modal */}
      {subModalCriterion && (() => {
        const labels = subModalCriterion.subcriteriaLabels ?? []
        const subs = subModalCriterion.subcriteria ?? []
        const maxLabelPoints = labels.length > 0 ? Math.max(0, ...labels.map(l => Number(l.points) || 0)) : 0
        const totalMax = maxLabelPoints * subs.length
        const obtainedPoints = subs.reduce((sum, sub) => {
          const selId = subModalSelections[sub.id]
          if (!selId) return sum
          const lbl = labels.find(l => l.id === selId)
          return sum + (Number(lbl?.points) || 0)
        }, 0)
        const computedScore = totalMax > 0 ? Math.round((obtainedPoints / totalMax) * 10 * 100) / 100 : 0
        const allSelected = subs.length > 0 && subs.every(s => subModalSelections[s.id])
        const hasManualGrade = subModalManualGrade !== '' && !isNaN(Number(subModalManualGrade))
        const sortedLabels = [...labels].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
        return (
          <Modal show={showSubModal} onHide={handleTryCloseSubModal} centered size="md">
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: 15 }}>
                <BsSliders size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: '#E91E86' }} />
                {subModalCriterion.name}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  — {subModalStudent?.name}
                </span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '16px 20px' }}>
              <div style={{
                fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16,
                background: '#E91E8608', borderLeft: '3px solid #E91E86',
                borderRadius: '0 6px 6px 0', padding: '8px 12px'
              }}>
                Selecciona el nivel para cada subcriterio.
                Calificación = <strong>(pts obtenidos / {totalMax} pts) × {subModalCriterion.weight}%</strong>
              </div>

              {subs.map((sub, si) => {
                const selected = subModalSelections[sub.id]
                return (
                  <div key={sub.id} style={{
                    marginBottom: 14,
                    padding: '12px 14px',
                    background: 'var(--bg-main)',
                    borderRadius: 8,
                    border: `1px solid ${selected ? '#E91E8640' : 'var(--border)'}`
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        minWidth: 22, height: 22, borderRadius: '50%',
                        background: '#E91E8620', color: '#E91E86',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700
                      }}>{si + 1}</span>
                      {sub.name || `Subcriterio ${si + 1}`}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sortedLabels.map(lbl => {
                        const isSelected = selected === lbl.id
                        return (
                          <button
                            key={lbl.id}
                            type="button"
                            onClick={() => setSubModalSelections(prev => ({ ...prev, [sub.id]: lbl.id }))}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              border: `2px solid ${isSelected ? '#E91E86' : 'var(--border)'}`,
                              background: isSelected ? '#E91E86' : 'transparent',
                              color: isSelected ? '#fff' : 'var(--text-primary)',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: 13,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              textAlign: 'left',
                              maxWidth: 200
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {lbl.label || '—'}
                              <span style={{ fontSize: 11, opacity: isSelected ? 0.85 : 0.6 }}>
                                {lbl.points} pts
                              </span>
                            </div>
                            {(sub.descriptions?.[lbl.id] || lbl.description) && (
                              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: isSelected ? 0.9 : 0.65, lineHeight: 1.3 }}>
                                {sub.descriptions?.[lbl.id] || lbl.description}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </Modal.Body>
            <Modal.Footer style={{ flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'var(--bg-main)',
                borderRadius: 8,
                border: '1px dashed var(--border)'
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  O ingresa calificación manual:
                </span>
                <input
                  type="number"
                  className="grade-input"
                  min="0"
                  max="10"
                  step="0.1"
                  value={subModalManualGrade}
                  onChange={e => setSubModalManualGrade(e.target.value)}
                  placeholder="0 – 10"
                  style={{ width: 80, flexShrink: 0 }}
                />
                {hasManualGrade && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: getGradeColor(Math.min(Math.max(0, Number(subModalManualGrade)), 10)) }}>
                    {Math.min(Math.max(0, Number(subModalManualGrade)), 10).toFixed(1)} / 10
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>
                  {!hasManualGrade && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {obtainedPoints} / {totalMax} pts
                    </span>
                  )}
                  {allSelected && !hasManualGrade && (
                    <span style={{ marginLeft: 10, fontWeight: 700, color: getGradeColor(computedScore), fontSize: 15 }}>
                      → {computedScore.toFixed(1)} / 10
                    </span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Button variant="secondary" onClick={handleTryCloseSubModal}>Cancelar</Button>
                  <button
                    type="button"
                    className="btn btn-primary-custom"
                    onClick={saveSubModal}
                    disabled={!allSelected && !hasManualGrade}
                  >
                    Aplicar Calificación
                  </button>
                </div>
              </div>
            </Modal.Footer>
          </Modal>
        )
      })()}

      {/* Subcriteria Close Confirmation */}
      <Modal show={showSubCloseConfirm} onHide={() => setShowSubCloseConfirm(false)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h5>¿Descartar cambios?</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>Los cambios no guardados se perderán.</p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button variant="secondary" onClick={() => setShowSubCloseConfirm(false)}>Seguir editando</Button>
            <Button variant="danger" onClick={closeSubModal}>Descartar</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Hidden NatGeo file input */}
      <input
        ref={natgeoFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleNatGeoFileChange}
      />

      {/* NatGeo import result modal */}
      <Modal show={!!natgeoImportResult} onHide={() => setNatgeoImportResult(null)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BsGlobeAmericas size={17} style={{ color: '#3B82F6' }} />
            Resultado Importación NatGeo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 24px' }}>
          {natgeoImportResult?.error ? (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#DC2626',
              display: 'flex',
              gap: 8
            }}>
              <span>⚠️</span><span>{natgeoImportResult.error}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* matched */}
              <div style={{
                background: '#10B98108',
                border: '1px solid #10B98130',
                borderRadius: 10,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 14px',
                  background: '#10B98115',
                  borderBottom: '1px solid #10B98125',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ✅ {natgeoImportResult?.matched?.length || 0} alumno{natgeoImportResult?.matched?.length !== 1 ? 's' : ''} importado{natgeoImportResult?.matched?.length !== 1 ? 's' : ''}
                </div>
                {natgeoImportResult?.matched?.length > 0 && (
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {natgeoImportResult.matched.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 14px',
                        borderBottom: i < natgeoImportResult.matched.length - 1 ? '1px solid var(--border)' : 'none',
                        fontSize: 13
                      }}>
                        <span style={{ fontWeight: 500 }}>{m.studentName}</span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: '#3B82F6',
                          background: '#3B82F615',
                          padding: '2px 10px',
                          borderRadius: 6
                        }}>{m.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* unmatched */}
              {natgeoImportResult?.unmatched?.length > 0 && (
                <div style={{
                  background: '#FEF3C708',
                  border: '1px solid #F59E0B40',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '8px 14px',
                    background: '#F59E0B15',
                    borderBottom: '1px solid #F59E0B25',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    ⚠️ {natgeoImportResult.unmatched.length} no encontrado{natgeoImportResult.unmatched.length !== 1 ? 's' : ''} en la clase
                  </div>
                  {natgeoImportResult.unmatched.map((name, i) => (
                    <div key={i} style={{
                      padding: '6px 14px',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      borderBottom: i < natgeoImportResult.unmatched.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>{name}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid var(--border)', padding: '12px 24px' }}>
          <button className="btn btn-outline-custom" onClick={() => setNatgeoImportResult(null)}>
            Cancelar
          </button>
          {!natgeoImportResult?.error && natgeoImportResult?.matched?.length > 0 && (
            <button
              className="btn btn-primary-custom"
              style={{ background: '#3B82F6', borderColor: '#3B82F6' }}
              onClick={() => {
                const { pendingUpdates, criterionId } = natgeoImportResult
                setLocalGrades(prev => {
                  const next = { ...prev }
                  Object.entries(pendingUpdates).forEach(([studentId, score]) => {
                    next[studentId] = { ...next[studentId], [criterionId]: score }
                  })
                  return next
                })
                setSaved(false)
                setNatgeoImportResult(null)
              }}
            >
              <BsGlobeAmericas size={14} style={{ marginRight: 6 }} />
              Aplicar {natgeoImportResult.matched.length} calificación{natgeoImportResult.matched.length !== 1 ? 'es' : ''}
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Grades
