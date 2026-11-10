// js/modules/inventoryManager.js - Lógica y CRUD para Productos y Análisis de Inventarios
(function(window) {
  "use strict";

  const state = window.AppState;
  const { $, esc, fmtCOP, cellNum, kpis, table, isYes } = window.AppUtils;

  function renderProductCRUD() {
    const container = $("productCrudContainer");
    if (!container) return;

    const productos = state.getAll("productos");

    container.innerHTML = `
      <div class="content-card form-card">
        <div class="card-heading">
          <div>
            <h3 id="productFormTitle">Registrar nuevo producto</h3>
            <p>Catálogo maestro de materiales ferrosos, no ferrosos y aleaciones</p>
          </div>
          <button id="productCancelEditBtn" class="btn btn-secondary" style="display:none;">Cancelar edición</button>
        </div>
        <form id="productForm" class="form-grid">
          <label>ID Producto
            <input id="prd_id" required placeholder="Ej. PRD-006">
          </label>
          <label>Código SKU
            <input id="prd_sku" required placeholder="Ej. CO-MET-006">
          </label>
          <label>Nombre del Material
            <input id="prd_nombre" required placeholder="Ej. Cobre Grado B">
          </label>
          <label>Categoría
            <select id="prd_categoria">
              <option value="Metales No Ferrosos">Metales No Ferrosos</option>
              <option value="Aceros">Aceros</option>
              <option value="Aleaciones">Aleaciones</option>
              <option value="Metales Pesados">Metales Pesados</option>
              <option value="Chatarra General">Chatarra General</option>
            </select>
          </label>
          <label>Unidad de Medida
            <select id="prd_unidad">
              <option value="KG">Kilogramos (KG)</option>
              <option value="TON">Toneladas (TON)</option>
              <option value="UND">Unidades (UND)</option>
              <option value="M3">Metros Cúbicos (M3)</option>
            </select>
          </label>
          <label>Costo Unitario (COP)
            <input id="prd_costo" type="number" min="0" step="1" required placeholder="Ej. 25000">
          </label>
          <label>Estado
            <select id="prd_estado">
              <option value="ACTIVO" selected>ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="OBSOLETO">OBSOLETO</option>
            </select>
          </label>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" id="productSubmitBtn">＋ Guardar producto</button>
          </div>
        </form>
      </div>

      <div class="content-card table-card">
        <div class="card-heading">
          <div>
            <h3>Catálogo Maestro de Productos</h3>
            <p>Productos con su valorización contable para auditoría de inventario</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="productSearch" type="search" placeholder="Filtrar producto..." style="padding:6px 10px; border:1px solid var(--line); border-radius:6px; font-size:11px;">
            <span class="count-pill" id="productCount">${productos.length} productos</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Nombre Material</th>
                <th>Categoría</th>
                <th>U.M.</th>
                <th>Costo Unitario (COP)</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="productsTableBody">
              ${renderProductRows(productos)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachProductEvents();
  }

  function renderProductRows(list) {
    if (!list.length) {
      return `<tr><td colspan="8" style="text-align:center; padding:18px;">No hay productos registrados.</td></tr>`;
    }
    return list.map(p => `
      <tr data-id="${esc(p.producto_id)}">
        <td><strong>${esc(p.producto_id)}</strong></td>
        <td><code>${esc(p.sku)}</code></td>
        <td>${esc(p.nombre)}</td>
        <td>${esc(p.categoria || "—")}</td>
        <td>${esc(p.unidad_medida || "KG")}</td>
        <td>${fmtCOP.format(p.costo_unitario_cop || 0)}</td>
        <td><span class="tag ${p.estado === "ACTIVO" ? "" : "warn"}">${esc(p.estado || "ACTIVO")}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm edit-prd-btn" data-id="${esc(p.producto_id)}" style="padding:4px 8px; font-size:10px; margin-right:4px;">Editar</button>
          <button class="btn btn-secondary btn-sm delete-prd-btn" data-id="${esc(p.producto_id)}" style="padding:4px 8px; font-size:10px; color:#c15c50; border-color:#fadbd8;">Eliminar</button>
        </td>
      </tr>
    `).join("");
  }

  let editingProductId = null;

  function attachProductEvents() {
    const form = $("productForm");
    const cancelBtn = $("productCancelEditBtn");
    const search = $("productSearch");

    if (search) {
      search.addEventListener("input", e => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = state.getAll("productos").filter(p =>
          p.producto_id.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          (p.categoria && p.categoria.toLowerCase().includes(q))
        );
        $("productsTableBody").innerHTML = renderProductRows(filtered);
      });
    }

    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const item = {
          producto_id: $("prd_id").value.trim(),
          sku: $("prd_sku").value.trim(),
          nombre: $("prd_nombre").value.trim(),
          categoria: $("prd_categoria").value,
          unidad_medida: $("prd_unidad").value,
          costo_unitario_cop: Number($("prd_costo").value) || 0,
          estado: $("prd_estado").value
        };

        try {
          if (editingProductId) {
            state.update("productos", "producto_id", editingProductId, item);
            resetProductForm();
          } else {
            state.create("productos", item, "producto_id");
            form.reset();
          }
          renderProductCRUD();
          renderInventoryAnalysis();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        resetProductForm();
        renderProductCRUD();
      });
    }

    const tableBody = $("productsTableBody");
    if (tableBody) {
      tableBody.addEventListener("click", e => {
        const editBtn = e.target.closest(".edit-prd-btn");
        const delBtn = e.target.closest(".delete-prd-btn");

        if (editBtn) {
          const id = editBtn.dataset.id;
          const p = state.getById("productos", "producto_id", id);
          if (p) {
            editingProductId = p.producto_id;
            $("prd_id").value = p.producto_id;
            $("prd_id").disabled = true;
            $("prd_sku").value = p.sku;
            $("prd_nombre").value = p.nombre;
            $("prd_categoria").value = p.categoria || "Metales No Ferrosos";
            $("prd_unidad").value = p.unidad_medida || "KG";
            $("prd_costo").value = p.costo_unitario_cop || 0;
            $("prd_estado").value = p.estado || "ACTIVO";
            
            $("productFormTitle").textContent = `Editar Producto: ${p.producto_id}`;
            $("productSubmitBtn").textContent = "✓ Actualizar producto";
            $("productCancelEditBtn").style.display = "inline-block";
            $("productForm").scrollIntoView({ behavior: "smooth" });
          }
        }

        if (delBtn) {
          const id = delBtn.dataset.id;
          if (confirm(`¿Seguro que deseas eliminar el producto ${id}?`)) {
            state.delete("productos", "producto_id", id);
            renderProductCRUD();
            renderInventoryAnalysis();
          }
        }
      });
    }
  }

  function resetProductForm() {
    editingProductId = null;
    const idInput = $("prd_id");
    if (idInput) idInput.disabled = false;
    const title = $("productFormTitle");
    if (title) title.textContent = "Registrar nuevo producto";
    const submitBtn = $("productSubmitBtn");
    if (submitBtn) submitBtn.textContent = "＋ Guardar producto";
    const cancelBtn = $("productCancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
  }

  function renderInventoryAnalysis() {
    const box = $("inventoryResults");
    if (!box) return;
    const d = state.data;
    
    if (!(d.productos && d.inventario_erp && (d.inventario_excel || d.conteos_fisicos))) {
      box.className = "results-placeholder";
      box.innerHTML = `
        <div class="empty-icon">▤</div>
        <h3>Aún no hay resultados</h3>
        <p>Carga o registra productos, inventario ERP y al menos una fuente de comparación (Excel o conteo físico) para ejecutar el análisis.</p>
        <button class="btn btn-primary" data-goto="uploads">Ir a carga de información</button>
      `;
      return;
    }

    const productos = new Map(d.productos.map(p => [p.producto_id, p]));
    const empleados = new Map((d.empleados || []).map(e => [e.empleado_id, e]));
    const empDeUsuario = new Map((d.usuarios || []).map(u => [u.usuario_id, u.empleado_id]));
    const key = r => `${r.fecha_corte}|${r.producto_id}|${r.bodega_id}`;
    const erp = new Map(d.inventario_erp.map(r => [key(r), r]));
    const xls = new Map((d.inventario_excel || []).map(r => [key(r), r]));
    const fis = new Map((d.conteos_fisicos || []).map(r => [key(r), r]));
    const diffs = [];

    new Set([...erp.keys(), ...xls.keys(), ...fis.keys()]).forEach(k => {
      const [fecha, pid, bod] = k.split("|");
      const qErp = erp.get(k)?.cantidad_erp ?? null;
      const qXls = d.inventario_excel ? xls.get(k)?.cantidad_excel ?? null : undefined;
      const qFis = d.conteos_fisicos ? fis.get(k)?.cantidad_fisica ?? null : undefined;
      const vals = [qErp, qXls, qFis].filter(v => v !== undefined);
      if (vals.every(v => v !== null && v === vals[0])) return;
      
      const ref = qFis ?? qXls;
      const diff = ref != null && qErp != null ? ref - qErp : null;
      const costo = productos.get(pid)?.costo_unitario_cop;
      
      diffs.push({
        fecha,
        pid,
        bod,
        nombre: productos.get(pid)?.nombre ?? "(no existe en productos)",
        qErp,
        qXls,
        qFis,
        diff,
        valor: diff != null && Number.isFinite(costo) ? diff * costo : null,
        resp: fis.get(k)?.responsable_id || xls.get(k)?.responsable_id || ""
      });
    });

    diffs.sort((a, b) => Math.abs(b.valor ?? 0) - Math.abs(a.valor ?? 0));
    const net = diffs.reduce((s, x) => s + (x.valor ?? 0), 0);
    const abs = diffs.reduce((s, x) => s + Math.abs(x.valor ?? 0), 0);
    const movs = [];

    (d.movimientos_inventario || []).forEach(m => {
      const r = [];
      if (!isYes(m.registrado_erp)) r.push("No registrado en ERP");
      if (!m.documento_soporte_id) r.push("Sin documento soporte");
      if (!m.aprobado_por) r.push(m.tipo_movimiento.startsWith("AJUSTE") ? "Ajuste sin aprobación" : "Sin aprobación");
      else if (m.aprobado_por === m.usuario_id || m.aprobado_por === empDeUsuario.get(m.usuario_id)) r.push("Autoaprobado");
      
      const retiro = empleados.get(empDeUsuario.get(m.usuario_id))?.fecha_retiro;
      if (retiro && m.fecha_hora.slice(0, 10) > retiro) r.push("Usuario de empleado retirado");
      if (!productos.has(m.producto_id)) r.push("Producto inexistente");
      if (r.length) {
        movs.push([
          esc(m.movimiento_id),
          esc(m.fecha_hora.replace("T", " ").slice(0, 16)),
          esc(m.producto_id),
          esc(m.bodega_id),
          esc(m.tipo_movimiento),
          cellNum(m.cantidad),
          esc(m.usuario_id),
          r.map(x => `<span class="tag">${esc(x)}</span>`).join(" ")
        ]);
      }
    });

    const conteos = (d.conteos_fisicos || []).filter(c => !c.aprobado_por || c.aprobado_por === c.responsable_id).map(c => [
      esc(c.conteo_id),
      esc(c.fecha_corte),
      esc(c.producto_id),
      esc(c.bodega_id),
      esc(c.responsable_id),
      esc(c.aprobado_por || "—"),
      `<span class="tag">${c.aprobado_por ? "Aprobó quien contó" : "Sin aprobación"}</span>`
    ]);

    box.className = "results-section";
    box.innerHTML = kpis([
      ["Combinaciones con diferencia", diffs.length],
      ["Impacto neto estimado", fmtCOP.format(net)],
      ["Impacto absoluto", fmtCOP.format(abs)],
      ["Movimientos con alertas", `${movs.length} / ${(d.movimientos_inventario || []).length}`],
      ["Conteos sin aprobación válida", conteos.length]
    ]) +
    `<h3>Diferencias ERP vs. Excel vs. conteo físico</h3>` +
    table(
      ["Corte", "ID producto", "Producto", "Bodega", "ERP", "Excel", "Físico", "Dif. ref. − ERP", "Valor COP", "Responsable"],
      diffs.map(x => [
        esc(x.fecha),
        esc(x.pid),
        esc(x.nombre),
        esc(x.bod),
        cellNum(x.qErp),
        cellNum(x.qXls),
        cellNum(x.qFis),
        cellNum(x.diff),
        x.valor == null ? "—" : fmtCOP.format(x.valor),
        esc(x.resp)
      ])
    ) +
    (d.movimientos_inventario ? `<h3>Movimientos con alertas</h3>` + table(["Movimiento", "Fecha/hora", "Producto", "Bodega", "Tipo", "Cantidad", "Usuario", "Alertas"], movs) : "") +
    (d.conteos_fisicos ? `<h3>Conteos sin aprobación válida</h3>` + table(["Conteo", "Corte", "Producto", "Bodega", "Contó", "Aprobó", "Alerta"], conteos) : "");
  }

  window.AppInventory = { renderProductCRUD, renderInventoryAnalysis };
})(window);
