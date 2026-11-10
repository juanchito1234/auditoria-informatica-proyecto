// js/modules/bodegaManager.js - Lógica y CRUD para Bodegas
(function(window) {
  "use strict";

  const state = window.AppState;
  const { $, esc } = window.AppUtils;

  function renderBodegasCRUD() {
    const container = $("bodegasCrudContainer");
    if (!container) return;

    const bodegas = state.getAll("bodegas");

    container.innerHTML = `
      <div class="content-card form-card">
        <div class="card-heading">
          <div>
            <h3 id="bodegaFormTitle">Registrar nueva bodega</h3>
            <p>Gestión de centros de almacenamiento de metal y reciclaje</p>
          </div>
          <button id="bodegaCancelEditBtn" class="btn btn-secondary" style="display:none;">Cancelar edición</button>
        </div>
        <form id="bodegaForm" class="form-grid">
          <label>Código de Bodega
            <input id="bodega_id" required placeholder="Ej. BOD-05">
          </label>
          <label>Nombre de Bodega
            <input id="bodega_nombre" required placeholder="Ej. Patio de Fundición">
          </label>
          <label>Ubicación / Sector
            <input id="bodega_ubicacion" required placeholder="Ej. Zona Industrial Sur">
          </label>
          <label>Capacidad (m²)
            <input id="bodega_capacidad" type="number" min="0" placeholder="Ej. 1200">
          </label>
          <label>Responsable
            <input id="bodega_responsable" required placeholder="Nombre del encargado">
          </label>
          <label>Estado
            <select id="bodega_estado">
              <option value="ACTIVA" selected>ACTIVA</option>
              <option value="INACTIVA">INACTIVA</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
          </label>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" id="bodegaSubmitBtn">＋ Guardar bodega</button>
          </div>
        </form>
      </div>

      <div class="content-card table-card">
        <div class="card-heading">
          <div>
            <h3>Catálogo de Bodegas</h3>
            <p>Listado de bodegas configuradas para auditoría e inventarios</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="bodegaSearch" type="search" placeholder="Filtrar bodega..." style="padding:6px 10px; border:1px solid var(--line); border-radius:6px; font-size:11px;">
            <span class="count-pill" id="bodegasCount">${bodegas.length} bodegas</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Capacidad</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="bodegasTableBody">
              ${renderBodegaRows(bodegas)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachBodegaEvents();
  }

  function renderBodegaRows(list) {
    if (!list.length) {
      return `<tr><td colspan="7" style="text-align:center; padding:18px;">No hay bodegas registradas.</td></tr>`;
    }
    return list.map(b => `
      <tr data-id="${esc(b.bodega_id)}">
        <td><strong>${esc(b.bodega_id)}</strong></td>
        <td>${esc(b.nombre)}</td>
        <td>${esc(b.ubicacion || "—")}</td>
        <td>${b.capacidad_m2 ? `${esc(b.capacidad_m2)} m²` : "—"}</td>
        <td>${esc(b.responsable || "—")}</td>
        <td><span class="tag ${b.estado === "ACTIVA" ? "" : "warn"}">${esc(b.estado || "ACTIVA")}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm edit-bodega-btn" data-id="${esc(b.bodega_id)}" style="padding:4px 8px; font-size:10px; margin-right:4px;">Editar</button>
          <button class="btn btn-secondary btn-sm delete-bodega-btn" data-id="${esc(b.bodega_id)}" style="padding:4px 8px; font-size:10px; color:#c15c50; border-color:#fadbd8;">Eliminar</button>
        </td>
      </tr>
    `).join("");
  }

  let editingBodegaId = null;

  function attachBodegaEvents() {
    const form = $("bodegaForm");
    const cancelBtn = $("bodegaCancelEditBtn");
    const search = $("bodegaSearch");

    if (search) {
      search.addEventListener("input", e => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = state.getAll("bodegas").filter(b =>
          b.bodega_id.toLowerCase().includes(q) ||
          b.nombre.toLowerCase().includes(q) ||
          (b.ubicacion && b.ubicacion.toLowerCase().includes(q)) ||
          (b.responsable && b.responsable.toLowerCase().includes(q))
        );
        $("bodegasTableBody").innerHTML = renderBodegaRows(filtered);
      });
    }

    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const item = {
          bodega_id: $("bodega_id").value.trim(),
          nombre: $("bodega_nombre").value.trim(),
          ubicacion: $("bodega_ubicacion").value.trim(),
          capacidad_m2: $("bodega_capacidad").value.trim(),
          responsable: $("bodega_responsable").value.trim(),
          estado: $("bodega_estado").value
        };

        try {
          if (editingBodegaId) {
            state.update("bodegas", "bodega_id", editingBodegaId, item);
            resetBodegaForm();
          } else {
            state.create("bodegas", item, "bodega_id");
            form.reset();
          }
          renderBodegasCRUD();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        resetBodegaForm();
        renderBodegasCRUD();
      });
    }

    const tableBody = $("bodegasTableBody");
    if (tableBody) {
      tableBody.addEventListener("click", e => {
        const editBtn = e.target.closest(".edit-bodega-btn");
        const delBtn = e.target.closest(".delete-bodega-btn");

        if (editBtn) {
          const id = editBtn.dataset.id;
          const b = state.getById("bodegas", "bodega_id", id);
          if (b) {
            editingBodegaId = b.bodega_id;
            $("bodega_id").value = b.bodega_id;
            $("bodega_id").disabled = true;
            $("bodega_nombre").value = b.nombre;
            $("bodega_ubicacion").value = b.ubicacion || "";
            $("bodega_capacidad").value = b.capacidad_m2 || "";
            $("bodega_responsable").value = b.responsable || "";
            $("bodega_estado").value = b.estado || "ACTIVA";
            $("bodegaFormTitle").textContent = `Editar Bodega: ${b.bodega_id}`;
            $("bodegaSubmitBtn").textContent = "✓ Actualizar bodega";
            $("bodegaCancelEditBtn").style.display = "inline-block";
            $("bodegaForm").scrollIntoView({ behavior: "smooth" });
          }
        }

        if (delBtn) {
          const id = delBtn.dataset.id;
          if (confirm(`¿Seguro que deseas eliminar la bodega ${id}?`)) {
            state.delete("bodegas", "bodega_id", id);
            renderBodegasCRUD();
          }
        }
      });
    }
  }

  function resetBodegaForm() {
    editingBodegaId = null;
    const idInput = $("bodega_id");
    if (idInput) idInput.disabled = false;
    const title = $("bodegaFormTitle");
    if (title) title.textContent = "Registrar nueva bodega";
    const submitBtn = $("bodegaSubmitBtn");
    if (submitBtn) submitBtn.textContent = "＋ Guardar bodega";
    const cancelBtn = $("bodegaCancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
  }

  window.AppBodegas = { renderBodegasCRUD };
})(window);
