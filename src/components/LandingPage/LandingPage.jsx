import React from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowDown,
  FiArrowRight,
  FiArrowUpRight,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiDownload,
  FiFileText,
  FiLayers,
  FiShuffle,
  FiUpload,
  FiUsers,
  FiWifi
} from 'react-icons/fi'
import './LandingPage.css'

const features = [
  {
    icon: FiLayers,
    number: '01',
    title: 'Todo tu contexto, conectado',
    description: 'Universidades, clases y grupos organizados para que encuentres lo importante sin perseguir archivos.'
  },
  {
    icon: FiCalendar,
    number: '02',
    title: 'Seguimiento sin fricción',
    description: 'Registra asistencia y actividades en el mismo espacio donde ya gestionas tus clases.'
  },
  {
    icon: FiClipboard,
    number: '03',
    title: 'Califica con criterios claros',
    description: 'Diseña rúbricas por clase, define criterios y registra calificaciones con cálculo automático.'
  },
  {
    icon: FiUpload,
    number: '04',
    title: 'Importa tus listas',
    description: 'Agrega alumnos desde Excel o CSV y encuentra registros con búsqueda por nombre o matrícula.'
  },
  {
    icon: FiShuffle,
    number: '05',
    title: 'Activa la participación',
    description: 'Usa el selector aleatorio para elegir quién participa: ruleta para grupos pequeños y tarjetas para grupos grandes.'
  },
  {
    icon: FiAward,
    number: '06',
    title: 'Cierra períodos con contexto',
    description: 'Combina evaluaciones parciales y criterios en una calificación final con seguimiento por alumno.'
  }
]

const scrollToSection = (id) => (event) => {
  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const LandingPage = () => (
  <main className="landing-page">
    <header className="landing-header">
      <a className="landing-brand" href="#inicio" onClick={scrollToSection('inicio')} aria-label="ClassRoom, inicio">
        <span className="landing-brand-mark"><FiBookOpen /></span>
        <span>ClassRoom</span>
      </a>

      <nav className="landing-nav" aria-label="Navegación principal">
        <a href="#impacto" onClick={scrollToSection('impacto')}>El impacto</a>
        <a href="#herramientas" onClick={scrollToSection('herramientas')}>Herramientas</a>
      </nav>

      <div className="landing-header-actions">
        <Link className="landing-login-link" to="/login">Iniciar sesión</Link>
        <Link className="landing-button landing-button-dark landing-header-cta" to="/register">
          Solicitar acceso <FiArrowUpRight />
        </Link>
      </div>
    </header>

    <section className="landing-hero" id="inicio">
      <div className="landing-hero-copy">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow-dot" />
          Gestión académica para quienes enseñan
        </div>
        <h1>Menos pendientes.<br />Más <span>tiempo para enseñar.</span></h1>
        <p className="landing-hero-description">
          La gestión de tus clases no debería llevarse tu día. Organiza alumnos,
          asistencia y evaluaciones en un solo lugar, y vuelve a enfocarte en lo que importa.
        </p>
        <div className="landing-hero-actions">
          <Link className="landing-button landing-button-lime" to="/register">
            Simplifica tu gestión <FiArrowRight />
          </Link>
          <a className="landing-text-link" href="#impacto" onClick={scrollToSection('impacto')}>
            Descubre cómo funciona <FiArrowDown />
          </a>
        </div>
        <div className="landing-trust-note">
          <span className="landing-trust-check"><FiCheck /></span>
          Diseñado para la realidad de la docencia
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="Vista ilustrativa del panel de ClassRoom">
        <div className="landing-orbit landing-orbit-one" />
        <div className="landing-orbit landing-orbit-two" />
        <div className="landing-float-note">
          <span className="landing-float-icon"><FiClock /></span>
          <span><strong>Menos trabajo repetido</strong><small>Más espacio para tus alumnos</small></span>
        </div>
        <div className="landing-dashboard">
          <div className="landing-dashboard-top">
            <span className="landing-dash-brand"><span className="landing-dash-mark"><FiBookOpen /></span> ClassRoom</span>
            <span className="landing-dash-avatar">M</span>
          </div>
          <div className="landing-dashboard-welcome">
            <span>MIÉRCOLES, 24 DE ABRIL</span>
            <h2>Tu espacio de trabajo</h2>
            <p>Todo listo para acompañar a tus grupos.</p>
          </div>
          <div className="landing-dash-stats">
            <div className="landing-dash-stat">
              <span className="landing-dash-stat-icon lilac"><FiBookOpen /></span>
              <span><small>Clases</small><strong>Organizadas</strong></span>
            </div>
            <div className="landing-dash-stat">
              <span className="landing-dash-stat-icon mint"><FiUsers /></span>
              <span><small>Alumnos</small><strong>A tu alcance</strong></span>
            </div>
            <div className="landing-dash-stat">
              <span className="landing-dash-stat-icon peach"><FiClipboard /></span>
              <span><small>Evaluaciones</small><strong>Al día</strong></span>
            </div>
          </div>
          <div className="landing-dash-course">
            <div className="landing-dash-course-heading">
              <span>Vista de tus clases</span><span className="landing-dash-tag">ESTE PERÍODO</span>
            </div>
            <div className="landing-dash-course-row">
              <span className="landing-course-icon course-purple"><FiBookOpen /></span>
              <span className="landing-course-name"><strong>Didáctica general</strong><small>Grupo 2 · Matutino</small></span>
              <span className="landing-course-status"><i /> En seguimiento</span>
            </div>
            <div className="landing-dash-course-row">
              <span className="landing-course-icon course-green"><FiCalendar /></span>
              <span className="landing-course-name"><strong>Planeación educativa</strong><small>Grupo 1 · Vespertino</small></span>
              <span className="landing-course-status"><i /> En seguimiento</span>
            </div>
          </div>
          <div className="landing-dashboard-footer">
            <span><FiCheck /> Información organizada, sin cambiar de herramienta</span>
          </div>
        </div>
        <div className="landing-float-stamp"><span>MENOS ADMINISTRACIÓN</span><strong>Más docencia.</strong></div>
      </div>

      <a className="landing-scroll-cue" href="#impacto" onClick={scrollToSection('impacto')}>
        <span>Conoce el impacto</span><FiArrowDown />
      </a>
    </section>

    <section className="landing-impact" id="impacto">
      <div className="landing-impact-intro">
        <span className="landing-section-kicker">INFORMACIÓN QUE TE AYUDA A DECIDIR</span>
        <h2>No solo guardes datos.<br /><span>Entiende cómo avanzan tus grupos.</span></h2>
        <p>Consulta el panorama de tu trabajo académico y encuentra lo importante sin reconstruirlo entre varias hojas.</p>
      </div>

      <div className="landing-analytics">
        <div className="landing-analytics-header">
          <div>
            <span className="landing-analytics-kicker"><FiBarChart2 /> PANEL DE CONTROL</span>
            <h3>Tu actividad académica, de un vistazo</h3>
          </div>
          <span className="landing-sample-badge">VISTA ILUSTRATIVA · DATOS DE EJEMPLO</span>
        </div>
        <div className="landing-analytics-stats">
          <article className="landing-analytics-stat">
            <span>Universidades</span><strong>04</strong><small><FiLayers /> Espacios organizados</small>
          </article>
          <article className="landing-analytics-stat">
            <span>Clases registradas</span><strong>12</strong><small><FiBookOpen /> En distintos grupos</small>
          </article>
          <article className="landing-analytics-stat">
            <span>Alumnos</span><strong>186</strong><small><FiUsers /> En tus clases</small>
          </article>
          <article className="landing-analytics-stat">
            <span>Períodos de evaluación</span><strong>08</strong><small><FiClipboard /> Para dar seguimiento</small>
          </article>
        </div>
        <div className="landing-analytics-charts">
          <article className="landing-analytics-chart">
            <div className="landing-chart-heading"><span><strong>Alumnos por universidad</strong><small>Distribución de tus grupos</small></span><span className="landing-chart-menu">···</span></div>
            <div className="landing-bar-chart" aria-label="Gráfico ilustrativo de alumnos por universidad">
              <div className="landing-bar-row"><span>Campus Norte</span><div><i style={{ width: '88%' }} /></div><strong>72</strong></div>
              <div className="landing-bar-row"><span>Campus Centro</span><div><i style={{ width: '62%' }} /></div><strong>51</strong></div>
              <div className="landing-bar-row"><span>Campus Sur</span><div><i style={{ width: '45%' }} /></div><strong>37</strong></div>
              <div className="landing-bar-row"><span>En línea</span><div><i style={{ width: '32%' }} /></div><strong>26</strong></div>
            </div>
          </article>
          <article className="landing-analytics-chart landing-course-chart">
            <div className="landing-chart-heading"><span><strong>Clases por universidad</strong><small>Composición de tu carga</small></span><span className="landing-chart-menu">···</span></div>
            <div className="landing-donut-wrap">
              <div className="landing-donut" role="img" aria-label="Gráfico ilustrativo de distribución de clases"><span><strong>12</strong><small>clases</small></span></div>
              <div className="landing-donut-legend">
                <span><i className="legend-pink" /> Campus Norte <strong>5</strong></span>
                <span><i className="legend-rose" /> Campus Centro <strong>3</strong></span>
                <span><i className="legend-soft" /> Otros grupos <strong>4</strong></span>
              </div>
            </div>
          </article>
        </div>
        <p className="landing-analytics-note"><FiCheckCircle /> En tu cuenta, estos indicadores se calculan con tus registros reales de clases, alumnos y períodos.</p>
      </div>

      <div className="landing-outcomes-heading">
        <span className="landing-section-kicker">MENOS TRABAJO ADMINISTRATIVO, MÁS CONTROL</span>
        <h3>Beneficios que se sienten en tu día a día</h3>
      </div>
      <div className="landing-impact-grid">
        <article className="landing-impact-card landing-impact-card-highlight">
          <span className="landing-impact-icon"><FiClock /></span>
          <h3>Recupera tiempo cada semana</h3>
          <p>Evita volver a capturar la misma información en listas, notas y hojas separadas. Administra tus grupos desde un solo espacio.</p>
          <span className="landing-impact-label">MENOS CAPTURA DUPLICADA</span>
        </article>
        <article className="landing-impact-card">
          <span className="landing-impact-icon"><FiBarChart2 /></span>
          <h3>Detecta dónde hace falta atención</h3>
          <p>Consulta asistencia por alumno y resultados por criterio para identificar avances y dar seguimiento oportuno.</p>
          <span className="landing-impact-label">SEGUIMIENTO CON CONTEXTO</span>
        </article>
        <article className="landing-impact-card">
          <span className="landing-impact-icon"><FiFileText /></span>
          <h3>Comparte y conserva tus reportes</h3>
          <p>Exporta asistencias y calificaciones a Excel para revisar resultados, preparar reportes o conservar un respaldo.</p>
          <span className="landing-impact-label">INFORMACIÓN LISTA PARA USAR</span>
        </article>
        <article className="landing-impact-card">
          <span className="landing-impact-icon"><FiWifi /></span>
          <h3>Sigue trabajando si falla internet</h3>
          <p>Consulta la copia local disponible y continúa registrando cambios; se sincronizan cuando vuelve la conexión.</p>
          <span className="landing-impact-label">CONTINUIDAD PARA TU CLASE</span>
        </article>
      </div>
    </section>

    <section className="landing-showcase" aria-labelledby="landing-showcase-title">
      <div className="landing-showcase-heading">
        <span className="landing-section-kicker">HECHA PARA EL TRABAJO DE CADA DÍA</span>
        <h2 id="landing-showcase-title">De pasar lista a evaluar:<br /><span>así se ve todo en un mismo lugar.</span></h2>
        <p>Herramientas concretas para acompañar el ciclo completo de tus clases, sin perderte entre archivos.</p>
      </div>

      <div className="landing-showcase-grid">
        <article className="landing-showcase-card">
          <div className="landing-showcase-card-heading">
            <span className="landing-showcase-icon"><FiUsers /></span>
            <span><strong>Tu grupo, organizado</strong><small>Alumnos y matrícula</small></span>
            <span className="landing-demo-label">VISTA DE EJEMPLO</span>
          </div>
          <div className="landing-student-preview">
            <div className="landing-preview-toolbar"><span>Didáctica general</span><span className="landing-preview-action"><FiUpload /> Importar Excel</span></div>
            <div className="landing-preview-table-head"><span>ALUMNO</span><span>MATRÍCULA</span><span>ESTADO</span></div>
            <div className="landing-preview-student"><span className="landing-preview-avatar">AM</span><strong>Ana Martínez</strong><span>2024-018</span><span className="landing-preview-active"><i /> Activo</span></div>
            <div className="landing-preview-student"><span className="landing-preview-avatar pink">JR</span><strong>José Ramírez</strong><span>2024-026</span><span className="landing-preview-active"><i /> Activo</span></div>
            <div className="landing-preview-student"><span className="landing-preview-avatar peach">LP</span><strong>Lucía Pérez</strong><span>2024-031</span><span className="landing-preview-active"><i /> Activo</span></div>
          </div>
          <p className="landing-showcase-caption"><FiCheckCircle /> Busca por nombre o matrícula e importa listas desde Excel o CSV.</p>
        </article>

        <article className="landing-showcase-card">
          <div className="landing-showcase-card-heading">
            <span className="landing-showcase-icon"><FiCalendar /></span>
            <span><strong>Asistencia al momento</strong><small>Registro por sesión</small></span>
            <span className="landing-demo-label">VISTA DE EJEMPLO</span>
          </div>
          <div className="landing-attendance-preview">
            <div className="landing-preview-toolbar"><span>Grupo 2 · 24 abr</span><span className="landing-preview-session">Sesión 08</span></div>
            <div className="landing-attendance-summary">
              <span><i className="present-dot" /> Presente <strong>24</strong></span>
              <span><i className="late-dot" /> Retardo <strong>2</strong></span>
              <span><i className="absent-dot" /> Ausente <strong>1</strong></span>
            </div>
            <div className="landing-attendance-record"><span>Ana Martínez</span><span className="landing-attendance-status present">✓ Presente</span></div>
            <div className="landing-attendance-record"><span>José Ramírez</span><span className="landing-attendance-status late">◷ Retardo</span></div>
            <div className="landing-attendance-record"><span>Lucía Pérez</span><span className="landing-attendance-status absent">× Ausente</span></div>
            <div className="landing-attendance-export"><FiCalendar /> Historial por período <span><FiDownload /> Exportar Excel</span></div>
          </div>
          <p className="landing-showcase-caption"><FiCheckCircle /> Registra presentes, ausencias, retardos y justificaciones; exporta el historial.</p>
        </article>

        <article className="landing-showcase-card landing-showcase-card-wide">
          <div className="landing-showcase-card-heading">
            <span className="landing-showcase-icon"><FiAward /></span>
            <span><strong>Evaluación con seguimiento</strong><small>Rúbricas, criterios y calificación final</small></span>
            <span className="landing-demo-label">VISTA DE EJEMPLO</span>
          </div>
          <div className="landing-grades-preview">
            <div className="landing-grades-top"><span>Evaluación parcial 1</span><span className="landing-grades-class">Didáctica general</span></div>
            <div className="landing-grades-table">
              <div className="landing-grade-row landing-grade-header"><span>ALUMNO</span><span>PROYECTO <small>40%</small></span><span>PARTICIPACIÓN <small>20%</small></span><span>EXAMEN <small>40%</small></span><span>FINAL</span></div>
              <div className="landing-grade-row"><strong>Ana Martínez</strong><span className="landing-grade-score">9.2</span><span className="landing-grade-score">9.5</span><span className="landing-grade-score">8.8</span><strong className="landing-grade-final">9.1</strong></div>
              <div className="landing-grade-row"><strong>José Ramírez</strong><span className="landing-grade-score">8.5</span><span className="landing-grade-score">9.0</span><span className="landing-grade-score">8.2</span><strong className="landing-grade-final">8.5</strong></div>
            </div>
            <div className="landing-grades-footer"><FiCheckCircle /> Calificaciones de ejemplo · guardado automático al editar</div>
          </div>
          <p className="landing-showcase-caption"><FiCheckCircle /> Define ponderaciones, crea subcriterios y combina parciales para calcular el resultado.</p>
        </article>
      </div>
    </section>

    <section className="landing-tools" id="herramientas">
      <div className="landing-tools-heading">
        <span className="landing-section-kicker">TODO CONECTADO</span>
        <h2>Una plataforma.<br /><span>Menos frentes abiertos.</span></h2>
        <p>Lo cotidiano de la administración docente, reunido y fácil de consultar.</p>
      </div>
      <div className="landing-feature-list">
        {features.map(({ icon: Icon, number, title, description }) => (
          <article className="landing-feature" key={number}>
            <span className="landing-feature-number">{number}</span>
            <span className="landing-feature-icon"><Icon /></span>
            <div className="landing-feature-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <FiArrowUpRight className="landing-feature-arrow" />
          </article>
        ))}
      </div>
    </section>

    <section className="landing-cta">
      <div className="landing-cta-orb" />
      <span className="landing-section-kicker">TU VOCACIÓN, SIN TANTO TRÁMITE</span>
      <h2>Hazle espacio a lo que<br />te trajo a enseñar.</h2>
      <p>Empieza a organizar tu gestión académica con ClassRoom.</p>
      <Link className="landing-button landing-button-lime" to="/register">
        Solicitar acceso <FiArrowRight />
      </Link>
      <small>El registro de nuevas cuentas requiere aprobación.</small>
    </section>

    <footer className="landing-footer">
      <a className="landing-brand" href="#inicio" onClick={scrollToSection('inicio')}>
        <span className="landing-brand-mark"><FiBookOpen /></span>
        <span>ClassRoom</span>
      </a>
      <span>Menos gestión. Más tiempo para enseñar.</span>
      <Link to="/login">Acceso para docentes <FiArrowUpRight /></Link>
    </footer>
  </main>
)

export default LandingPage
