/* ---------- Datos fijos del kit ---------- */

const ONBOARDING_ITEMS = [
  "Reunión de bienvenida con los dueños: visión, expectativas del rol, prioridades inmediatas",
  "Recorrido físico por las instalaciones (vivero, oficina, bodega de equipo)",
  "Presentación con los responsables de cada línea de negocio (E1–E4)",
  "Acceso a herramientas actuales (WhatsApp de negocio, redes sociales, archivos compartidos, correo)",
  "Revisión del organigrama real (quién reporta a quién en la práctica)",
  "Primera ronda de entrevistas agendada",
  "Identificar los 2–3 \"dolores\" más mencionados por los dueños al contratar el puesto",
  "Acordar con los dueños el canal y frecuencia de comunicación",
  "Acordar fecha de la primera Sprint Review de descubrimiento",
  "Enviar el primer reporte de avance antes de que termine la semana"
];

const FIELD_ITEMS = {
  vivero: [
    "Recorrer las áreas de producción e invernaderos",
    "Preguntar por el ciclo de producción de al menos 2 especies clave",
    "Observar cómo se registra el inventario (o si no se registra)",
    "Identificar quién decide qué se siembra y con qué criterio",
    "Anotar mermas o pérdidas visibles y su causa aparente"
  ],
  obra: [
    "Visitar un proyecto en ejecución (si hay alguno activo)",
    "Revisar cómo se documenta el avance (bitácora, fotos, nada)",
    "Hablar con el encargado de cuadrilla sobre cambios de alcance recientes",
    "Identificar qué materiales se compran por proyecto vs. se tienen en stock",
    "Revisar una cotización real para entender el formato actual"
  ],
  mantenimiento: [
    "Acompañar una ruta de mantenimiento (aunque sea parcial)",
    "Revisar el checklist de servicio que usan hoy (si existe)",
    "Preguntar cómo se reporta el servicio al cliente",
    "Verificar cómo se asignan las cuadrillas a cada cliente",
    "Identificar quejas recurrentes de los últimos meses"
  ]
};

const LINEA_LABELS = { vivero: "Vivero", obra: "Obra", mantenimiento: "Mantenimiento" };

const KANBAN_STAGES = [
  { key: "por-hacer", label: "Por hacer" },
  { key: "entrevistando", label: "Entrevistando" },
  { key: "documentando", label: "Documentando hallazgo" },
  { key: "backlog-generado", label: "Backlog generado" },
  { key: "validado", label: "Validado con dueños" }
];

const EPICA_LABELS = {
  E1: "E1 · Producción de plantas",
  E2: "E2 · Diseño y construcción",
  E3: "E3 · Mantenimiento",
  E4: "E4 · Renta/compraventa equipo",
  E5: "E5 · Transversal"
};

const PRIORIDAD_LABELS = { M: "Must have", S: "Should have", C: "Could have", W: "Won't have" };

const DEFAULT_RIESGOS = [
  { riesgo: "Falta de registro de inventario vegetal → pérdidas no cuantificadas", linea: "E1", probabilidad: "Media", impacto: "Alto", mitigacion: "Implementar bitácora simple desde semana 1" },
  { riesgo: "Dependencia de personal clave sin conocimiento documentado", linea: "E5", probabilidad: "Media", impacto: "Alto", mitigacion: "Documentar procesos críticos en Sprint 0–1" },
  { riesgo: "Ventas dependientes de redes sociales sin proceso comercial formal", linea: "E5", probabilidad: "Alta", impacto: "Medio", mitigacion: "Mapear el embudo actual y definir puntos de seguimiento" },
  { riesgo: "Cambios de alcance no controlados en obra", linea: "E2", probabilidad: "Alta", impacto: "Medio", mitigacion: "Formato de control de cambios desde Sprint 1" },
  { riesgo: "Rotación de personal de campo en mantenimiento", linea: "E3", probabilidad: "Media", impacto: "Medio", mitigacion: "Checklist de servicio estandarizado + inducción rápida" },
  { riesgo: "Equipo de renta sin mantenimiento preventivo documentado", linea: "E4", probabilidad: "Media", impacto: "Alto", mitigacion: "Calendario de mantenimiento preventivo" }
];

/* ---------- Estado y persistencia ---------- */

const STORAGE_KEY = "kaavarPM_v1";

function defaultState() {
  return {
    onboarding: {},
    backlog: [],
    visits: [],
    asis: [],
    riesgos: DEFAULT_RIESGOS.map((r) => ({ id: uid(), ...r })),
    reportes: []
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Utilidades UI ---------- */

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function impactoClass(v) {
  if (v === "Alto") return "alto";
  if (v === "Medio") return "medio";
  return "bajo";
}

/* ---------- Navegación de pestañas ---------- */

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

document.querySelectorAll(".subtab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".subpanel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("sub-" + btn.dataset.sub).classList.add("active");
  });
});

/* Menú (exportar / importar / reiniciar) */
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
menuBtn.addEventListener("click", () => {
  const willShow = menuPanel.classList.contains("hidden");
  menuPanel.classList.toggle("hidden");
  menuBtn.setAttribute("aria-expanded", String(willShow));
});
document.addEventListener("click", (e) => {
  if (!menuPanel.contains(e.target) && e.target !== menuBtn) {
    menuPanel.classList.add("hidden");
  }
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kaavar-pm-respaldo-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  menuPanel.classList.add("hidden");
});

document.getElementById("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = Object.assign(defaultState(), parsed);
      saveState();
      renderAll();
      showToast("Respaldo importado");
    } catch (err) {
      showToast("El archivo no es un respaldo válido");
    }
    menuPanel.classList.add("hidden");
    e.target.value = "";
  };
  reader.readAsText(file);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Esto borra todo lo guardado en este dispositivo. ¿Continuar?")) {
    state = defaultState();
    saveState();
    renderAll();
    showToast("Todo se reinició");
  }
  menuPanel.classList.add("hidden");
});

/* ---------- BACKLOG ---------- */

document.getElementById("backlogForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    id: uid(),
    epica: document.getElementById("bEpica").value,
    prioridad: document.getElementById("bPrioridad").value,
    historia: document.getElementById("bHistoria").value.trim(),
    notas: document.getElementById("bNotas").value.trim(),
    estado: "por-hacer",
    createdAt: Date.now()
  };
  if (!item.epica || !item.prioridad || !item.historia) return;
  state.backlog.unshift(item);
  saveState();
  e.target.reset();
  renderBacklog();
  renderKanban();
  showToast("Agregado al backlog");
});

document.getElementById("filterEpica").addEventListener("change", renderBacklog);
document.getElementById("filterPrioridad").addEventListener("change", renderBacklog);

function renderBacklog() {
  const list = document.getElementById("backlogList");
  const fEpica = document.getElementById("filterEpica").value;
  const fPrio = document.getElementById("filterPrioridad").value;
  const items = state.backlog.filter(
    (i) => (!fEpica || i.epica === fEpica) && (!fPrio || i.prioridad === fPrio)
  );

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">Sin historias todavía. Agrega la primera arriba.</div>`;
    return;
  }

  list.innerHTML = items.map((i) => `
    <div class="item-card prio-${i.prioridad}" data-id="${i.id}">
      <div class="item-top">
        <span class="badge epica">${EPICA_LABELS[i.epica]}</span>
        <span class="badge">${PRIORIDAD_LABELS[i.prioridad]}</span>
      </div>
      <div class="item-historia">${escapeHtml(i.historia)}</div>
      ${i.notas ? `<div class="item-notas">${escapeHtml(i.notas)}</div>` : ""}
      <div class="item-notas">Estado: ${KANBAN_STAGES.find((s) => s.key === i.estado).label}</div>
      <div class="item-actions">
        <button class="delete" data-action="delete-backlog" data-id="${i.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("backlogList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='delete-backlog']");
  if (!btn) return;
  state.backlog = state.backlog.filter((i) => i.id !== btn.dataset.id);
  saveState();
  renderBacklog();
  renderKanban();
});

/* ---------- KANBAN ---------- */

function renderKanban() {
  const board = document.getElementById("kanbanBoard");
  board.innerHTML = KANBAN_STAGES.map((stage, idx) => {
    const cards = state.backlog.filter((i) => i.estado === stage.key);
    return `
      <div class="kanban-col">
        <h2>${stage.label} <span class="count">${cards.length}</span></h2>
        ${cards.length === 0
          ? `<div class="empty-state">Sin historias aquí</div>`
          : cards.map((c) => `
            <div class="kanban-card">
              <span class="badge epica">${EPICA_LABELS[c.epica]}</span>
              <div class="item-historia">${escapeHtml(c.historia)}</div>
              <div class="kanban-move">
                <button data-action="move" data-id="${c.id}" data-dir="-1" ${idx === 0 ? "disabled" : ""}>← Atrás</button>
                <button data-action="move" data-id="${c.id}" data-dir="1" ${idx === KANBAN_STAGES.length - 1 ? "disabled" : ""}>Avanzar →</button>
              </div>
            </div>
          `).join("")}
      </div>
    `;
  }).join("");
}

document.getElementById("kanbanBoard").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='move']");
  if (!btn) return;
  const item = state.backlog.find((i) => i.id === btn.dataset.id);
  if (!item) return;
  const idx = KANBAN_STAGES.findIndex((s) => s.key === item.estado);
  const newIdx = idx + Number(btn.dataset.dir);
  if (newIdx < 0 || newIdx >= KANBAN_STAGES.length) return;
  item.estado = KANBAN_STAGES[newIdx].key;
  saveState();
  renderKanban();
  renderBacklog();
});

/* ---------- CHECKLIST · PRIMERA SEMANA ---------- */

function renderOnboarding() {
  const box = document.getElementById("onboardingChecklist");
  box.innerHTML = ONBOARDING_ITEMS.map((text, idx) => `
    <label class="check-item ${state.onboarding[idx] ? "done" : ""}">
      <input type="checkbox" data-idx="${idx}" ${state.onboarding[idx] ? "checked" : ""}>
      <span>${escapeHtml(text)}</span>
    </label>
  `).join("");
}

document.getElementById("onboardingChecklist").addEventListener("change", (e) => {
  const cb = e.target;
  if (cb.type !== "checkbox") return;
  state.onboarding[cb.dataset.idx] = cb.checked;
  saveState();
  renderOnboarding();
});

/* ---------- CHECKLIST · VISITA DE CAMPO ---------- */

let currentVisitChecks = {};

function renderVisitChecklist() {
  const linea = document.getElementById("visitLinea").value;
  const box = document.getElementById("visitChecklist");
  box.innerHTML = FIELD_ITEMS[linea].map((text, idx) => `
    <label class="check-item ${currentVisitChecks[idx] ? "done" : ""}">
      <input type="checkbox" data-idx="${idx}" ${currentVisitChecks[idx] ? "checked" : ""}>
      <span>${escapeHtml(text)}</span>
    </label>
  `).join("");
}

document.getElementById("visitLinea").addEventListener("change", () => {
  currentVisitChecks = {};
  renderVisitChecklist();
});

document.getElementById("visitChecklist").addEventListener("change", (e) => {
  const cb = e.target;
  if (cb.type !== "checkbox") return;
  currentVisitChecks[cb.dataset.idx] = cb.checked;
  renderVisitChecklist();
});

document.getElementById("saveVisitBtn").addEventListener("click", () => {
  const linea = document.getElementById("visitLinea").value;
  const fecha = document.getElementById("visitFecha").value || todayISO();
  const notas = document.getElementById("visitNotas").value.trim();
  const doneCount = Object.values(currentVisitChecks).filter(Boolean).length;

  state.visits.unshift({
    id: uid(), linea, fecha, notas,
    checks: { ...currentVisitChecks },
    total: FIELD_ITEMS[linea].length,
    done: doneCount
  });
  saveState();
  currentVisitChecks = {};
  document.getElementById("visitNotas").value = "";
  renderVisitChecklist();
  renderVisitHistory();
  showToast("Visita guardada");
});

function renderVisitHistory() {
  const box = document.getElementById("visitHistory");
  if (state.visits.length === 0) {
    box.innerHTML = `<div class="empty-state">Aún no registras visitas.</div>`;
    return;
  }
  box.innerHTML = state.visits.map((v) => `
    <div class="visit-entry" data-id="${v.id}">
      <div class="visit-entry-top">
        <span>${LINEA_LABELS[v.linea]} · ${v.fecha}</span>
        <span>${v.done}/${v.total} puntos</span>
      </div>
      ${v.notas ? `<div class="notas">${escapeHtml(v.notas)}</div>` : ""}
      <div class="item-actions">
        <button class="delete" data-action="delete-visit" data-id="${v.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("visitHistory").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='delete-visit']");
  if (!btn) return;
  state.visits = state.visits.filter((v) => v.id !== btn.dataset.id);
  saveState();
  renderVisitHistory();
});

/* ---------- AS-IS ---------- */

document.getElementById("asisForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    id: uid(),
    linea: document.getElementById("aLinea").value,
    etapa: document.getElementById("aEtapa").value.trim(),
    responsable: document.getElementById("aResponsable").value.trim(),
    herramienta: document.getElementById("aHerramienta").value.trim(),
    entrada: document.getElementById("aEntrada").value.trim(),
    salida: document.getElementById("aSalida").value.trim(),
    dolor: document.getElementById("aDolor").value.trim()
  };
  if (!item.linea || !item.etapa) return;
  state.asis.unshift(item);
  saveState();
  e.target.reset();
  renderAsis();
  showToast("Proceso agregado");
});

function renderAsis() {
  const list = document.getElementById("asisList");
  if (state.asis.length === 0) {
    list.innerHTML = `<div class="empty-state">Sin procesos documentados todavía.</div>`;
    return;
  }
  list.innerHTML = state.asis.map((a) => `
    <div class="item-card asis-card" data-id="${a.id}">
      <div class="item-top">
        <span class="badge epica">${EPICA_LABELS[a.linea]}</span>
      </div>
      <div class="item-historia"><strong>${escapeHtml(a.etapa)}</strong></div>
      <div class="grid">
        <div><span>Responsable:</span> ${escapeHtml(a.responsable) || "—"}</div>
        <div><span>Herramienta:</span> ${escapeHtml(a.herramienta) || "—"}</div>
        <div><span>Entrada:</span> ${escapeHtml(a.entrada) || "—"}</div>
        <div><span>Salida:</span> ${escapeHtml(a.salida) || "—"}</div>
      </div>
      ${a.dolor ? `<div class="dolor">⚠ ${escapeHtml(a.dolor)}</div>` : ""}
      <div class="item-actions">
        <button class="delete" data-action="delete-asis" data-id="${a.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("asisList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='delete-asis']");
  if (!btn) return;
  state.asis = state.asis.filter((a) => a.id !== btn.dataset.id);
  saveState();
  renderAsis();
});

/* ---------- RIESGOS ---------- */

document.getElementById("riesgoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    id: uid(),
    riesgo: document.getElementById("rRiesgo").value.trim(),
    linea: document.getElementById("rLinea").value,
    probabilidad: document.getElementById("rProbabilidad").value,
    impacto: document.getElementById("rImpacto").value,
    mitigacion: document.getElementById("rMitigacion").value.trim()
  };
  if (!item.riesgo) return;
  state.riesgos.unshift(item);
  saveState();
  e.target.reset();
  document.getElementById("rLinea").value = "E5";
  renderRiesgos();
  showToast("Riesgo agregado");
});

function renderRiesgos() {
  const list = document.getElementById("riesgoList");
  if (state.riesgos.length === 0) {
    list.innerHTML = `<div class="empty-state">Sin riesgos registrados.</div>`;
    return;
  }
  list.innerHTML = state.riesgos.map((r) => `
    <div class="item-card" data-id="${r.id}">
      <div class="item-top">
        <span class="badge epica">${EPICA_LABELS[r.linea] || r.linea}</span>
        <span class="badge ${impactoClass(r.impacto)}">Impacto ${r.impacto}</span>
      </div>
      <div class="item-historia">${escapeHtml(r.riesgo)}</div>
      <div class="item-notas">Probabilidad: ${r.probabilidad}</div>
      ${r.mitigacion ? `<div class="item-notas">Mitigación: ${escapeHtml(r.mitigacion)}</div>` : ""}
      <div class="item-actions">
        <button class="delete" data-action="delete-riesgo" data-id="${r.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("riesgoList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='delete-riesgo']");
  if (!btn) return;
  state.riesgos = state.riesgos.filter((r) => r.id !== btn.dataset.id);
  saveState();
  renderRiesgos();
});

/* ---------- REPORTE SEMANAL ---------- */

document.getElementById("reporteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    id: uid(),
    semana: document.getElementById("repSemana").value.trim(),
    fecha: document.getElementById("repFecha").value,
    avances: document.getElementById("repAvances").value.trim(),
    hallazgos: document.getElementById("repHallazgos").value.trim(),
    bloqueos: document.getElementById("repBloqueos").value.trim(),
    decisiones: document.getElementById("repDecisiones").value.trim(),
    siguiente: document.getElementById("repSiguiente").value.trim()
  };
  if (!item.semana || !item.fecha) return;
  state.reportes.unshift(item);
  saveState();
  e.target.reset();
  renderReportes();
  showToast("Reporte guardado");
});

function reportToText(r) {
  return `Reporte semanal — Semana ${r.semana} — ${r.fecha}\n\n` +
    `Avances de la semana:\n${r.avances || "—"}\n\n` +
    `Hallazgos relevantes:\n${r.hallazgos || "—"}\n\n` +
    `Bloqueos o pendientes:\n${r.bloqueos || "—"}\n\n` +
    `Decisiones que requiero de los dueños:\n${r.decisiones || "—"}\n\n` +
    `La próxima semana me enfocaré en:\n${r.siguiente || "—"}`;
}

function renderReportes() {
  const list = document.getElementById("reporteList");
  if (state.reportes.length === 0) {
    list.innerHTML = `<div class="empty-state">Sin reportes guardados.</div>`;
    return;
  }
  list.innerHTML = state.reportes.map((r) => `
    <div class="item-card" data-id="${r.id}">
      <div class="item-top">
        <span class="badge epica">Semana ${escapeHtml(r.semana)}</span>
        <span class="badge">${r.fecha}</span>
      </div>
      ${r.avances ? `<div class="item-notas"><strong>Avances:</strong> ${escapeHtml(r.avances)}</div>` : ""}
      <div class="item-actions">
        <button data-action="copy-reporte" data-id="${r.id}">Copiar texto</button>
        <button class="delete" data-action="delete-reporte" data-id="${r.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("reporteList").addEventListener("click", (e) => {
  const copyBtn = e.target.closest("button[data-action='copy-reporte']");
  const delBtn = e.target.closest("button[data-action='delete-reporte']");
  if (copyBtn) {
    const r = state.reportes.find((x) => x.id === copyBtn.dataset.id);
    const text = reportToText(r);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast("Reporte copiado — listo para pegar"),
        () => showToast("No se pudo copiar, selecciona el texto manualmente")
      );
    }
  }
  if (delBtn) {
    state.reportes = state.reportes.filter((r) => r.id !== delBtn.dataset.id);
    saveState();
    renderReportes();
  }
});

/* ---------- Inicio ---------- */

function renderAll() {
  renderBacklog();
  renderKanban();
  renderOnboarding();
  renderVisitChecklist();
  renderVisitHistory();
  renderAsis();
  renderRiesgos();
  renderReportes();
}

document.getElementById("visitFecha").value = todayISO();
document.getElementById("repFecha").value = todayISO();
renderAll();
