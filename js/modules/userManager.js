// js/modules/userManager.js - Lógica y CRUD para Usuarios y Empleados
(function(window) {
  "use strict";

  const state = window.AppState;
  const { $, esc, isYes } = window.AppUtils;

  function renderUserManagement() {
    const container = $("usersCrudContainer");
    if (!container) return;

    const usuarios = state.getAll("usuarios");
    const empleados = state.getAll("empleados");
    const empMap = new Map(empleados.map(e => [e.empleado_id, e]));

    container.innerHTML = `
      <div class="content-card form-card">
        <div class="card-heading">
          <div>
            <h3 id="userFormTitle">Registrar nuevo usuario ERP</h3>
            <p>Asocia una cuenta del sistema con un empleado para control de accesos</p>
          </div>
          <button id="userCancelEditBtn" class="btn btn-secondary" style="display:none;">Cancelar edición</button>
        </div>
        <form id="userForm" class="form-grid">
          <label>ID Usuario
            <input id="usr_id" required placeholder="Ej. USR-006">
          </label>
          <label>Login / Username
            <input id="usr_login" required placeholder="Ej. cjaramillo">
          </label>
          <label>Empleado Asociado
            <select id="usr_empleado_id" required>
              <option value="">-- Seleccionar empleado --</option>
              ${empleados.map(e => `
                <option value="${esc(e.empleado_id)}">
                  ${esc(e.empleado_id)} - ${esc(e.nombre_ficticio)} (${esc(e.cargo)} - ${esc(e.estado_laboral)})
                </option>
              `).join("")}
            </select>
          </label>
          <label>Estado de Cuenta
            <select id="usr_estado_cuenta">
              <option value="ACTIVA" selected>ACTIVA</option>
              <option value="INACTIVA">INACTIVA</option>
              <option value="BLOQUEADA">BLOQUEADA</option>
            </select>
          </label>
          <label>¿MFA Habilitado?
            <select id="usr_mfa">
              <option value="NO" selected>NO (Riesgo)</option>
              <option value="SI">SI (Seguro)</option>
            </select>
          </label>
          <label>Fecha Creación
            <input id="usr_fecha_creacion" type="date">
          </label>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" id="userSubmitBtn">＋ Guardar usuario</button>
          </div>
        </form>
      </div>

      <div class="content-card table-card">
        <div class="card-heading">
          <div>
            <h3>Usuarios del Sistema</h3>
            <p>Listado de credenciales y relación con estado laboral de empleados</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="userSearch" type="search" placeholder="Filtrar por login o ID..." style="padding:6px 10px; border:1px solid var(--line); border-radius:6px; font-size:11px;">
            <span class="count-pill" id="userCount">${usuarios.length} cuentas</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID Usuario</th>
                <th>Login</th>
                <th>Empleado</th>
                <th>Cargo / Área</th>
                <th>Estado Laboral</th>
                <th>Estado Cuenta</th>
                <th>MFA</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${renderUserRows(usuarios, empMap)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const fechaInput = $("usr_fecha_creacion");
    if (fechaInput && !fechaInput.value) {
      fechaInput.value = new Date().toISOString().slice(0, 10);
    }

    attachUserEvents();
  }

  function renderUserRows(list, empMap) {
    if (!list.length) {
      return `<tr><td colspan="8" style="text-align:center; padding:18px;">No hay usuarios registrados.</td></tr>`;
    }

    return list.map(u => {
      const emp = empMap.get(u.empleado_id);
      const isRetirado = emp?.estado_laboral === "RETIRADO" && u.estado_cuenta === "ACTIVA";
      const noMfa = !isYes(u.mfa_habilitado) && u.estado_cuenta === "ACTIVA";

      return `
        <tr data-id="${esc(u.usuario_id)}">
          <td><strong>${esc(u.usuario_id)}</strong></td>
          <td><code>${esc(u.login)}</code></td>
          <td>${esc(emp?.nombre_ficticio || u.empleado_id || "—")}</td>
          <td><small>${esc(emp?.cargo || "—")} (${esc(emp?.area || "—")})</small></td>
          <td>
            <span class="tag ${emp?.estado_laboral === "RETIRADO" ? "tag" : "warn"}">
              ${esc(emp?.estado_laboral || "DESCONOCIDO")}
            </span>
          </td>
          <td>
            <span class="tag ${u.estado_cuenta === "ACTIVA" ? (isRetirado ? "tag" : "") : "warn"}">
              ${esc(u.estado_cuenta)}
            </span>
          </td>
          <td>
            <span class="tag ${noMfa ? "warn" : ""}">
              ${isYes(u.mfa_habilitado) ? "✓ MFA" : "Sin MFA"}
            </span>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm edit-usr-btn" data-id="${esc(u.usuario_id)}" style="padding:4px 8px; font-size:10px; margin-right:4px;">Editar</button>
            <button class="btn btn-secondary btn-sm delete-usr-btn" data-id="${esc(u.usuario_id)}" style="padding:4px 8px; font-size:10px; color:#c15c50; border-color:#fadbd8;">Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  let editingUserId = null;

  function attachUserEvents() {
    const form = $("userForm");
    const cancelBtn = $("userCancelEditBtn");
    const search = $("userSearch");

    if (search) {
      search.addEventListener("input", e => {
        const q = e.target.value.toLowerCase().trim();
        const empMap = new Map(state.getAll("empleados").map(emp => [emp.empleado_id, emp]));
        const filtered = state.getAll("usuarios").filter(u => {
          const emp = empMap.get(u.empleado_id);
          return (
            u.usuario_id.toLowerCase().includes(q) ||
            u.login.toLowerCase().includes(q) ||
            (emp && emp.nombre_ficticio.toLowerCase().includes(q))
          );
        });
        $("usersTableBody").innerHTML = renderUserRows(filtered, empMap);
      });
    }

    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const item = {
          usuario_id: $("usr_id").value.trim(),
          login: $("usr_login").value.trim(),
          empleado_id: $("usr_empleado_id").value.trim(),
          estado_cuenta: $("usr_estado_cuenta").value,
          mfa_habilitado: $("usr_mfa").value,
          fecha_creacion: $("usr_fecha_creacion").value,
          fecha_desactivacion: ""
        };

        try {
          if (editingUserId) {
            state.update("usuarios", "usuario_id", editingUserId, item);
            resetUserForm();
          } else {
            state.create("usuarios", item, "usuario_id");
            form.reset();
          }
          renderUserManagement();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        resetUserForm();
        renderUserManagement();
      });
    }

    const tableBody = $("usersTableBody");
    if (tableBody) {
      tableBody.addEventListener("click", e => {
        const editBtn = e.target.closest(".edit-usr-btn");
        const delBtn = e.target.closest(".delete-usr-btn");

        if (editBtn) {
          const id = editBtn.dataset.id;
          const u = state.getById("usuarios", "usuario_id", id);
          if (u) {
            editingUserId = u.usuario_id;
            $("usr_id").value = u.usuario_id;
            $("usr_id").disabled = true;
            $("usr_login").value = u.login;
            $("usr_empleado_id").value = u.empleado_id;
            $("usr_estado_cuenta").value = u.estado_cuenta || "ACTIVA";
            $("usr_mfa").value = isYes(u.mfa_habilitado) ? "SI" : "NO";
            $("usr_fecha_creacion").value = u.fecha_creacion || "";
            
            $("userFormTitle").textContent = `Editar Usuario: ${u.usuario_id} (${u.login})`;
            $("userSubmitBtn").textContent = "✓ Actualizar usuario";
            $("userCancelEditBtn").style.display = "inline-block";
            $("userForm").scrollIntoView({ behavior: "smooth" });
          }
        }

        if (delBtn) {
          const id = delBtn.dataset.id;
          if (confirm(`¿Seguro que deseas eliminar el usuario ${id}?`)) {
            state.delete("usuarios", "usuario_id", id);
            renderUserManagement();
          }
        }
      });
    }
  }

  function resetUserForm() {
    editingUserId = null;
    const idInput = $("usr_id");
    if (idInput) idInput.disabled = false;
    const title = $("userFormTitle");
    if (title) title.textContent = "Registrar nuevo usuario ERP";
    const submitBtn = $("userSubmitBtn");
    if (submitBtn) submitBtn.textContent = "＋ Guardar usuario";
    const cancelBtn = $("userCancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
  }

  window.AppUsers = { renderUserManagement };
})(window);
