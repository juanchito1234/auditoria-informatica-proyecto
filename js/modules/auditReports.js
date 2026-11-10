// js/modules/auditReports.js - Hallazgos de usuarios, Dashboard y subida de archivos
(function(window) {
  "use strict";

  const { SCHEMAS, CATEGORIES } = window.AppSchemas;
  const state = window.AppState;
  const { $, esc, kpis, table, isYes } = window.AppUtils;
  const { ingestFiles } = window.AppCSV;

  function renderUserFindings() {
    const box = $("userFindings");
    if (!box) return;

    const { empleados, usuarios, sesiones } = state.data;
    if (!(empleados && usuarios)) {
      box.className = "results-placeholder";
      box.innerHTML = `
        <div class="empty-icon">♙</div>
        <h3>Información pendiente</h3>
        <p>Carga o registra empleados y usuarios para consultar los hallazgos de control de acceso.</p>
      `;
      return;
    }

    const emp = new Map(empleados.map(e => [e.empleado_id, e]));
    const userMap = new Map(usuarios.map(u => [u.usuario_id, u]));
    const retirados = usuarios.filter(u => u.estado_cuenta === "ACTIVA" && emp.get(u.empleado_id)?.estado_laboral === "RETIRADO");
    const sinMfa = usuarios.filter(u => u.estado_cuenta === "ACTIVA" && !isYes(u.mfa_habilitado));
    const post = (sesiones || []).filter(s => {
      const u = userMap.get(s.usuario_id);
      const limite = [emp.get(u?.empleado_id)?.fecha_retiro, u?.fecha_desactivacion].filter(Boolean).sort()[0];
      return s.resultado_autenticacion === "EXITOSA" && limite && s.inicio_sesion.slice(0, 10) > limite;
    });

    box.className = "results-section";
    box.innerHTML =
      kpis([
        ["Cuentas activas de retirados", retirados.length],
        ["Cuentas activas sin MFA", sinMfa.length],
        ["Sesiones exitosas tras la baja", sesiones ? post.length : "—"]
      ]) +
      `<h3>Cuentas activas de empleados retirados (Riesgo Crítico)</h3>` +
      table(
        ["Usuario", "Login", "Empleado", "Fecha de retiro", "Estado cuenta", "MFA"],
        retirados.map(u => [
          esc(u.usuario_id),
          esc(u.login),
          esc(u.empleado_id),
          esc(emp.get(u.empleado_id)?.fecha_retiro),
          `<span class="tag">${esc(u.estado_cuenta)}</span>`,
          esc(u.mfa_habilitado)
        ])
      ) +
      `<h3>Cuentas activas sin MFA</h3>` +
      table(
        ["Usuario", "Login", "Empleado", "Estado cuenta", "MFA"],
        sinMfa.map(u => [
          esc(u.usuario_id),
          esc(u.login),
          esc(u.empleado_id),
          esc(u.estado_cuenta),
          `<span class="tag warn">Sin MFA</span>`
        ])
      ) +
      (sesiones
        ? `<h3>Sesiones exitosas posteriores a la baja</h3>` +
          table(
            ["Sesión", "Usuario", "Inicio", "IP", "Dispositivo"],
            post.map(s => [
              esc(s.sesion_id),
              esc(s.usuario_id),
              esc(s.inicio_sesion.replace("T", " ").slice(0, 16)),
              esc(s.ip_origen),
              esc(s.dispositivo)
            ])
          )
        : "");
  }

  function renderDashboard() {
    const loaded = Object.values(state.status).filter(s => s.ok);
    const errors = Object.values(state.status).filter(s => !s.ok);

    const kpiFiles = $("kpiFiles");
    if (kpiFiles) kpiFiles.textContent = loaded.length;

    const kpiRows = $("kpiRows");
    if (kpiRows) kpiRows.textContent = loaded.reduce((n, s) => n + (s.rows || 0), 0).toLocaleString("es-CO");

    const kpiErrors = $("kpiErrors");
    if (kpiErrors) kpiErrors.textContent = errors.length;

    const areas = CATEGORIES.filter(c => Object.values(SCHEMAS).some(s => s.category === c.id));
    const ready = areas.filter(c => Object.values(SCHEMAS).some(s => s.category === c.id && state.status[s.key]?.ok)).length;

    const kpiAreas = $("kpiAreas");
    if (kpiAreas) kpiAreas.textContent = ready;

    const kpiFilesSub = $("kpiFilesSub");
    if (kpiFilesSub) kpiFilesSub.textContent = `de ${Object.keys(SCHEMAS).length} esquemas disponibles`;

    const areaOverview = $("areaOverview");
    if (areaOverview) {
      areaOverview.innerHTML = areas
        .map(c => {
          const all = Object.values(SCHEMAS).filter(s => s.category === c.id);
          const n = all.filter(s => state.status[s.key]?.ok).length;
          const pct = all.length ? (n / all.length) * 100 : 0;
          return `<div class="area-row"><span>${esc(c.name)}</span><div class="progress"><span style="width:${pct}%"></span></div><b>${n}/${all.length}</b></div>`;
        })
        .join("");
    }
  }

  function renderUploads() {
    const grid = $("uploadGrid");
    if (!grid) return;
    grid.innerHTML = "";

    CATEGORIES.forEach(cat => {
      const schemas = Object.values(SCHEMAS).filter(s => s.category === cat.id);
      const loaded = schemas.filter(s => state.status[s.key]?.ok).length;
      const item = document.createElement("article");
      item.className = "upload-item";
      const files = schemas
        .map(s => {
          const st = state.status[s.key];
          return !st
            ? `<li class="muted">○ ${s.file}</li>`
            : st.ok
            ? `<li class="ok">✓ ${s.file} — ${st.rows} filas${st.note ? `<br><span class="muted">${esc(st.note)}</span>` : ""}</li>`
            : `<li class="bad">✕ ${s.file}: ${esc(st.note)}</li>`;
        })
        .join("");

      item.innerHTML = `<h3>${esc(cat.name)} ${
        schemas.length ? `<span class="muted">(${loaded}/${schemas.length})</span>` : ""
      }</h3><p>${esc(cat.detail)}</p>${
        schemas.length ? `<ul class="file-list">${files}</ul>` : `<span class="tag warn">Sin esquema CSV configurado</span>`
      }`;

      if (schemas.length) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv,text/csv";
        input.multiple = true;
        input.setAttribute("aria-label", `Archivos de ${cat.name}`);
        input.addEventListener("change", async () => {
          await ingestFiles([...input.files]);
        });
        item.appendChild(input);
      }
      grid.appendChild(item);
    });

    const unknown = Object.entries(state.status).filter(([k, v]) => !v.ok && !SCHEMAS[k]);
    if (unknown.length) {
      const item = document.createElement("article");
      item.className = "upload-item";
      item.innerHTML = `<h3>Archivos no reconocidos</h3><ul class="file-list">${unknown
        .map(([, v]) => `<li class="bad">✕ ${esc(v.name)}: ${esc(v.note)}</li>`)
        .join("")}</ul>`;
      grid.appendChild(item);
    }
  }

  window.AppReports = { renderUserFindings, renderDashboard, renderUploads };
})(window);
