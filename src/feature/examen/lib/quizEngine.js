// src/feature/examen/lib/quizEngine.js
// 🧠 Motor de Simulación y Calibración en Vivo para BecaWii 2026 (Clayda)
// Código Moderno ES2024 · 0ms Latencia · Cero Dependencias · Offline First

/**
 * Barajador Fisher-Yates seguro
 */
export function barajar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Formatea segundos a HH:MM:SS
 */
export function formatearTiempo(totalSegundos) {
  const seg = Math.max(0, Math.floor(totalSegundos));
  const hrs = Math.floor(seg / 3600);
  const mins = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Clase principal que gestiona el ciclo de vida completo de una sesión de simulacro
 */
export class QuizEngine {
  /**
   * Normaliza una lectura de cualquier fuente (parrafos array, contenido string, o texto)
   */
  normalizarLectura(lec) {
    if (!lec) return null;
    let parrafos = [];
    if (Array.isArray(lec.parrafos)) {
      parrafos = lec.parrafos;
    } else if (typeof lec.contenido === 'string') {
      parrafos = lec.contenido.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    } else if (typeof lec.texto === 'string') {
      parrafos = lec.texto.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    }
    return {
      id: lec.id,
      titulo: lec.titulo || 'Lectura de Comprensión',
      tipo: lec.tipo || lec.tipo_texto || 'Lectura General',
      parrafos: parrafos.length > 0 ? parrafos : ['Texto complementario no disponible.']
    };
  }

  constructor(opciones = {}) {
    this.bancos = opciones.bancos ?? {};
    this.mapaLecturas = new Map();

    // 1. Incorporar mapa de lecturas si fue provisto
    if (opciones.mapaLecturas instanceof Map) {
      for (const [k, v] of opciones.mapaLecturas.entries()) {
        this.mapaLecturas.set(String(k).trim().toUpperCase(), this.normalizarLectura(v));
      }
    } else if (typeof opciones.mapaLecturas === 'object' && opciones.mapaLecturas !== null) {
      for (const [k, v] of Object.entries(opciones.mapaLecturas)) {
        this.mapaLecturas.set(String(k).trim().toUpperCase(), this.normalizarLectura(v));
      }
    }

    // 2. Extraer automáticamente todas las lecturas de todos los bancos disponibles
    for (const banco of Object.values(this.bancos)) {
      if (Array.isArray(banco?.lecturas)) {
        for (const lec of banco.lecturas) {
          if (lec.id) {
            this.mapaLecturas.set(String(lec.id).trim().toUpperCase(), this.normalizarLectura(lec));
          }
        }
      }
    }

    this.modo = opciones.modo ?? 'simulacro-60'; // 'flash-10' | 'entrenador-20' | 'simulacro-60' | 'custom'
    this.coleccion = opciones.coleccion ?? '2026'; // '2026' | 'frecuentes' | '2025' | '2024' | '2023' | 'todas'
    this.modalidad = opciones.modalidad ?? 'simulacro'; // 'simulacro' | 'guiada'
    this.cantidadDeseada = opciones.cantidad ?? 60;
    
    this.preguntas = [];
    this.indiceActual = 0;
    this.respuestas = {}; // { [preguntaId]: 'A' | 'B' | 'C' | 'D' }
    this.marcadasRevision = new Set(); // Set de IDs de preguntas en revisión
    this.tiempoTotalSegundos = 0;
    this.tiempoRestanteSegundos = 0;
    this.tiempoEmpleadoSegundos = 0;
    this.timerId = null;
    this.estado = 'configurando'; // 'configurando' | 'activo' | 'pausado' | 'finalizado'
    
    this.onTick = opciones.onTick ?? null;
    this.onFinish = opciones.onFinish ?? null;
    this.onChange = opciones.onChange ?? null;
  }

  /**
   * Obtiene la lectura asociada por ID con búsqueda robusta
   */
  getLectura(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toUpperCase();
    if (this.mapaLecturas.has(cleanId)) {
      return this.mapaLecturas.get(cleanId);
    }
    // Búsqueda en bancos directamente como respaldo
    for (const banco of Object.values(this.bancos)) {
      if (Array.isArray(banco?.lecturas)) {
        for (const lec of banco.lecturas) {
          if (String(lec.id).trim().toUpperCase() === cleanId) {
            const norm = this.normalizarLectura(lec);
            this.mapaLecturas.set(cleanId, norm);
            return norm;
          }
        }
      }
    }
    // Búsqueda parcial si el ID incluye prefijos
    for (const [k, v] of this.mapaLecturas.entries()) {
      if (cleanId.includes(k) || k.includes(cleanId)) {
        return v;
      }
    }
    return null;
  }

  /**
   * Prepara y genera el set de preguntas según la configuración
   */
  prepararPreguntas() {
    let pool = [];
    if (this.coleccion === 'todas') {
      pool = Object.values(this.bancos).flatMap(b => b.preguntas ?? []);
    } else {
      pool = this.bancos[this.coleccion]?.preguntas ?? this.bancos['2026']?.preguntas ?? [];
    }

    if (!pool.length) {
      // Fallback a cualquier banco disponible
      const bancosArray = Object.values(this.bancos);
      if (bancosArray.length > 0) {
        pool = bancosArray[0].preguntas ?? [];
      }
    }

    let seleccionadas = [];
    const mat = pool.filter(p => p.area === 'matematica');
    const lec = pool.filter(p => p.area === 'lectura');

    if (this.modo === 'flash-10') {
      const mitad = 5;
      const matSel = barajar(mat).slice(0, mitad);
      const lecSel = barajar(lec).slice(0, mitad);
      seleccionadas = [...matSel, ...lecSel];
      this.tiempoTotalSegundos = 15 * 60; // 15 minutos
    } else if (this.modo === 'entrenador-20') {
      const mitad = 10;
      const matSel = barajar(mat).slice(0, mitad);
      const lecSel = barajar(lec).slice(0, mitad);
      seleccionadas = [...matSel, ...lecSel];
      this.tiempoTotalSegundos = 35 * 60; // 35 minutos
    } else if (this.modo === 'simulacro-60') {
      const matSel = barajar(mat).slice(0, 30);
      const lecSel = barajar(lec).slice(0, 30);
      seleccionadas = [...matSel, ...lecSel];
      this.tiempoTotalSegundos = 120 * 60; // 120 minutos (Oficial PRONABEC)
    } else {
      // Modo custom o dinámico
      const cant = Math.max(5, Math.min(pool.length, this.cantidadDeseada || 20));
      const mitad = Math.floor(cant / 2);
      const matSel = barajar(mat).slice(0, mitad);
      const lecSel = barajar(lec).slice(0, cant - mitad);
      seleccionadas = [...matSel, ...lecSel];
      // Tiempo adaptativo: 35 min para 20 preg, 120 min para 60 preg, ~1.75-2 min por pregunta
      if (cant === 60) {
        this.tiempoTotalSegundos = 120 * 60;
      } else if (cant === 20) {
        this.tiempoTotalSegundos = 35 * 60;
      } else if (cant === 10) {
        this.tiempoTotalSegundos = 15 * 60;
      } else {
        this.tiempoTotalSegundos = Math.round(cant * 105);
      }
    }

    // Normalizar preguntas con número de orden 1..N y lectura enriquecida
    this.preguntas = seleccionadas.map((p, idx) => {
      const letras = ['A', 'B', 'C', 'D'];
      let opciones = [];
      if (Array.isArray(p.opciones)) {
        if (typeof p.opciones[0] === 'string') {
          opciones = p.opciones.map((txt, i) => ({ id: letras[i] ?? String(i + 1), texto: String(txt) }));
        } else {
          opciones = p.opciones;
        }
      } else if (typeof p.opciones === 'object' && p.opciones !== null) {
        opciones = Object.entries(p.opciones).map(([k, v]) => ({ id: k.toUpperCase(), texto: String(v) }));
      }

      return {
        id: p.id ?? `Q-${idx + 1}`,
        numeroOrden: idx + 1,
        area: p.area ?? 'matematica',
        tema: p.tema ?? 'General',
        habilidad: p.habilidad ?? '',
        dificultad: p.dificultad ?? 'intermedio',
        enunciado: p.enunciado ?? '',
        formula: p.recurso?.tipo === 'formula' ? p.recurso.contenido : (p.formula ?? null),
        lectura_id: p.lectura_id ?? null,
        lectura: this.getLectura(p.lectura_id),
        opciones,
        respuesta_correcta: (p.respuesta_correcta ?? p.respuesta ?? 'A').trim().toUpperCase(),
        puntos: p.puntos ?? 2,
        explicacion: p.explicacion ?? '',
        pasos: p.pasos ?? [],
        recurso: p.recurso ?? null
      };
    });

    this.tiempoRestanteSegundos = this.tiempoTotalSegundos;
    this.respuestas = {};
    this.marcadasRevision.clear();
    this.indiceActual = 0;
  }

  /**
   * Inicia el temporizador y activa el simulacro
   */
  iniciar() {
    this.prepararPreguntas();
    this.estado = 'activo';
    this.tiempoEmpleadoSegundos = 0;
    
    if (this.timerId) clearInterval(this.timerId);

    if (this.modalidad === 'simulacro') {
      this.timerId = setInterval(() => {
        if (this.tiempoRestanteSegundos > 0) {
          this.tiempoRestanteSegundos--;
          this.tiempoEmpleadoSegundos++;
          if (typeof this.onTick === 'function') {
            this.onTick({
              restante: this.tiempoRestanteSegundos,
              empleado: this.tiempoEmpleadoSegundos,
              formateado: formatearTiempo(this.tiempoRestanteSegundos)
            });
          }
        } else {
          this.finalizar();
        }
      }, 1000);
    } else {
      // Modo guiado: cronómetro ascendente
      this.timerId = setInterval(() => {
        this.tiempoEmpleadoSegundos++;
        if (typeof this.onTick === 'function') {
          this.onTick({
            restante: null,
            empleado: this.tiempoEmpleadoSegundos,
            formateado: formatearTiempo(this.tiempoEmpleadoSegundos)
          });
        }
      }, 1000);
    }

    if (typeof this.onChange === 'function') {
      this.onChange(this.getSnapshot());
    }
  }

  /**
   * Obtiene la pregunta actual
   */
  getPreguntaActual() {
    return this.preguntas[this.indiceActual] ?? null;
  }

  /**
   * Salta a una pregunta por su índice (0 a N-1)
   */
  irAPregunta(index) {
    if (index >= 0 && index < this.preguntas.length) {
      this.indiceActual = index;
      if (typeof this.onChange === 'function') {
        this.onChange(this.getSnapshot());
      }
    }
  }

  siguientePregunta() {
    if (this.indiceActual < this.preguntas.length - 1) {
      this.irAPregunta(this.indiceActual + 1);
    }
  }

  anteriorPregunta() {
    if (this.indiceActual > 0) {
      this.irAPregunta(this.indiceActual - 1);
    }
  }

  /**
   * Registra o cambia la alternativa elegida para la pregunta actual o especificada
   */
  seleccionarOpcion(opcionId, preguntaId = null) {
    const id = preguntaId ?? this.getPreguntaActual()?.id;
    if (!id) return;
    this.respuestas[id] = String(opcionId).toUpperCase();
    if (typeof this.onChange === 'function') {
      this.onChange(this.getSnapshot());
    }
  }

  /**
   * Alterna la marca de revisión para la pregunta actual o especificada
   */
  toggleRevision(preguntaId = null) {
    const id = preguntaId ?? this.getPreguntaActual()?.id;
    if (!id) return false;
    let marcado = false;
    if (this.marcadasRevision.has(id)) {
      this.marcadasRevision.delete(id);
      marcado = false;
    } else {
      this.marcadasRevision.add(id);
      marcado = true;
    }
    if (typeof this.onChange === 'function') {
      this.onChange(this.getSnapshot());
    }
    return marcado;
  }

  /**
   * Estadísticas en tiempo real de avance
   */
  getEstadisticas() {
    const total = this.preguntas.length;
    const respondidas = Object.keys(this.respuestas).length;
    const pendientes = Math.max(0, total - respondidas);
    const enRevision = this.marcadasRevision.size;
    const porcentajeAvance = total > 0 ? Math.round((respondidas / total) * 100) : 0;
    return { total, respondidas, pendientes, enRevision, porcentajeAvance };
  }

  /**
   * Snapshot del estado completo para renderizado reactivo
   */
  getSnapshot() {
    const preguntaActual = this.getPreguntaActual();
    const stats = this.getEstadisticas();
    return {
      estado: this.estado,
      indiceActual: this.indiceActual,
      totalPreguntas: this.preguntas.length,
      preguntaActual,
      respuestaActual: preguntaActual ? (this.respuestas[preguntaActual.id] ?? null) : null,
      estaEnRevision: preguntaActual ? this.marcadasRevision.has(preguntaActual.id) : false,
      respuestas: { ...this.respuestas },
      marcadasRevision: new Set(this.marcadasRevision),
      estadisticas: stats,
      tiempoEmpleadoSegundos: this.tiempoEmpleadoSegundos,
      tiempoRestanteSegundos: this.tiempoRestanteSegundos,
      tiempoFormateado: formatearTiempo(this.modalidad === 'simulacro' ? this.tiempoRestanteSegundos : this.tiempoEmpleadoSegundos)
    };
  }

  /**
   * Finaliza el examen, detiene el cronómetro, califica según la normativa oficial
   * y guarda el resultado en localStorage
   */
  finalizar() {
    if (this.estado === 'finalizado') return this.ultimoResultado;
    this.estado = 'finalizado';
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    let aciertos = 0;
    let errores = 0;
    let enBlanco = 0;

    const desglose = {
      matematica: { total: 0, aciertos: 0, errores: 0, enBlanco: 0, puntaje: 0 },
      lectura: { total: 0, aciertos: 0, errores: 0, enBlanco: 0, puntaje: 0 }
    };

    const detalle = this.preguntas.map((p) => {
      const seleccion = this.respuestas[p.id] ?? null;
      const esCorrecta = seleccion !== null && seleccion === p.respuesta_correcta;
      const esBlanco = seleccion === null;

      const areaKey = p.area === 'matematica' ? 'matematica' : 'lectura';
      if (desglose[areaKey]) {
        desglose[areaKey].total++;
      }

      if (esCorrecta) {
        aciertos++;
        if (desglose[areaKey]) {
          desglose[areaKey].aciertos++;
          desglose[areaKey].puntaje += 2;
        }
      } else if (esBlanco) {
        enBlanco++;
        if (desglose[areaKey]) desglose[areaKey].enBlanco++;
      } else {
        errores++;
        if (desglose[areaKey]) desglose[areaKey].errores++;
      }

      return {
        id: p.id,
        numeroOrden: p.numeroOrden,
        area: p.area,
        tema: p.tema,
        enunciado: p.enunciado,
        formula: p.formula ?? null,
        lectura_id: p.lectura_id,
        lectura: p.lectura || this.getLectura(p.lectura_id),
        opciones: p.opciones,
        respuestaEstudiante: seleccion,
        respuestaCorrecta: p.respuesta_correcta,
        esCorrecta,
        esBlanco,
        puntosGanados: esCorrecta ? 2 : 0,
        explicacion: p.explicacion,
        pasos: p.pasos ?? [],
        recurso: p.recurso ?? null
      };
    });

    const total = this.preguntas.length;
    const puntajePronabec = aciertos * 2;
    const puntajeMaximo = total * 2;
    const porcentaje = total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
    const superoRetoHermanos = porcentaje >= 90.0;

    const resultado = {
      id: `sim_${Date.now()}`,
      fecha: new Date().toISOString(),
      fechaLegible: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      modo: this.modo,
      modalidad: this.modalidad,
      coleccion: this.coleccion,
      totalPreguntas: total,
      respondidas: aciertos + errores,
      aciertos,
      errores,
      enBlanco,
      puntaje: puntajePronabec,
      puntajeMaximo,
      porcentaje,
      tiempoEmpleadoSegundos: this.tiempoEmpleadoSegundos,
      tiempoEmpleadoFormateado: formatearTiempo(this.tiempoEmpleadoSegundos),
      superoRetoHermanos,
      desglose,
      detalle
    };

    this.ultimoResultado = resultado;

    // Guardado en localStorage de forma segura
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // 1. Guardar último simulacro para visualización inmediata en /resultados
        window.localStorage.setItem('ultimo_simulacro_becawii', JSON.stringify(resultado));

        // 2. Agregar al historial 'simulacros_clayda'
        let historial = [];
        const raw = window.localStorage.getItem('simulacros_clayda');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) historial = parsed;
          } catch(e) {}
        }
        historial.push(resultado);
        if (historial.length > 50) historial = historial.slice(-50); // Conservar últimos 50
        window.localStorage.setItem('simulacros_clayda', JSON.stringify(historial));
      }
    } catch (err) {
      console.warn('No se pudo guardar en localStorage:', err);
    }

    if (typeof this.onFinish === 'function') {
      this.onFinish(resultado);
    }

    return resultado;
  }
}
