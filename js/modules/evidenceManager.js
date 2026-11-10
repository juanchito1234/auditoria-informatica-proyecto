// js/modules/evidenceManager.js - Lógica y CRUD para Evidencias de Acceso
(function(window) {
  "use strict";

  const state = window.AppState;
  const { $, esc } = window.AppUtils;

  function renderEvidenceCRUD() {
    const container = $("accessRows");
    if (!container) return;

    const list = state.data.evidencias || [];
    container.innerHTML = "";
    $("evidenceCount").textContent = `${list.length} registros`;

    if (!list.length) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px;">Sin evidencias registradas.</td></tr>`;
      return;
    }

    list.forEach((record, index) => {
      const tr = document.createElement("tr");
      const user = record[0] || "";
      const role = record[1] || "";
      const eventDesc = record[2] || "";
      const dt = record[3] || "";
      const ip = record[4] || "";
      const risk = record[5] || "Bajo";

      const riskBadge = `<span class="tag ${risk === "Alto" ? "" : "warn"}">${esc(risk)}</span>`;

      tr.innerHTML = `
        <td><strong>${esc(user)}</strong></td>
        <td>${esc(role)}</td>
        <td>${esc(eventDesc)}</td>
        <td>${esc(dt)}</td>
        <td><code>${esc(ip)}</code></td>
        <td>${riskBadge}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm del-evidence-btn" data-index="${index}" style="padding:4px 8px; font-size:10px; color:#c15c50; border-color:#fadbd8;">Eliminar</button>
        </td>
      `;
      container.appendChild(tr);
    });

    attachEvidenceEvents();
  }

  let eventsAttached = false;
  function attachEvidenceEvents() {
    if (eventsAttached) return;
    eventsAttached = true;

    const form = $("accessForm");
    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const v = id => $(id).value.trim();
        const record = [
          v("user"),
          v("role"),
          v("event"),
          v("datetime").replace("T", " "),
          v("ip") || "No especificado",
          $("risk").value
        ];
        state.addEvidence(record);
        form.reset();
        renderEvidenceCRUD();
      });
    }

    const tableBody = $("accessRows");
    if (tableBody) {
      tableBody.addEventListener("click", e => {
        const delBtn = e.target.closest(".del-evidence-btn");
        if (delBtn) {
          const idx = Number(delBtn.dataset.index);
          if (confirm("¿Deseas eliminar este registro de evidencia?")) {
            state.deleteEvidence(idx);
            renderEvidenceCRUD();
          }
        }
      });
    }
  }

  window.AppEvidence = { renderEvidenceCRUD };
})(window);
