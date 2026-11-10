// js/state.js - Estado centralizado y persistencia local (CRUD y CSVs)
(function(window) {
  "use strict";

  const STORAGE_PREFIX = "metalverde_erp_";

  const INITIAL_BODEGAS = [
    { bodega_id: "BOD-01", nombre: "Bodega Principal Planta", ubicacion: "Sector Industrial Norte", capacidad_m2: "1500", responsable: "Carlos Restrepo", estado: "ACTIVA" },
    { bodega_id: "BOD-02", nombre: "Bodega de Chatarra y Reciclaje", ubicacion: "Patio Sur Lote 3", capacidad_m2: "3200", responsable: "Mauricio Gómez", estado: "ACTIVA" },
    { bodega_id: "BOD-03", nombre: "Bodega Metales Especiales", ubicacion: "Sector Norte Pabellón B", capacidad_m2: "800", responsable: "Luisa Vargas", estado: "ACTIVA" },
    { bodega_id: "BOD-04", nombre: "Bodega Externa Rionegro", ubicacion: "Km 4 Vía Las Palmas", capacidad_m2: "2000", responsable: "Felipe Soto", estado: "INACTIVA" }
  ];

  const INITIAL_PRODUCTOS = [
    { producto_id: "PRD-001", sku: "CO-ALU-001", nombre: "Lingote de Aluminio 99.7%", categoria: "Metales No Ferrosos", unidad_medida: "KG", costo_unitario_cop: 14500, estado: "ACTIVO" },
    { producto_id: "PRD-002", sku: "CO-COB-002", nombre: "Cobre Electrolítico Grado A", categoria: "Metales No Ferrosos", unidad_medida: "KG", costo_unitario_cop: 42000, estado: "ACTIVO" },
    { producto_id: "PRD-003", sku: "CO-ACE-003", nombre: "Chatarra de Acero Inoxidable 304", categoria: "Aceros", unidad_medida: "KG", costo_unitario_cop: 8900, estado: "ACTIVO" },
    { producto_id: "PRD-004", sku: "CO-BRO-004", nombre: "Viruta de Bronce Fosforado", categoria: "Aleaciones", unidad_medida: "KG", costo_unitario_cop: 28500, estado: "ACTIVO" },
    { producto_id: "PRD-005", sku: "CO-PLM-005", nombre: "Plomo Recuperado Baterías", categoria: "Metales Pesados", unidad_medida: "KG", costo_unitario_cop: 6500, estado: "ACTIVO" }
  ];

  const INITIAL_USUARIOS = [
    { usuario_id: "USR-001", empleado_id: "EMP-010", login: "jperez", estado_cuenta: "ACTIVA", fecha_creacion: "2024-03-15", fecha_desactivacion: "", mfa_habilitado: "NO" },
    { usuario_id: "USR-002", empleado_id: "EMP-014", login: "mrojas", estado_cuenta: "ACTIVA", fecha_creacion: "2024-05-10", fecha_desactivacion: "", mfa_habilitado: "NO" },
    { usuario_id: "USR-003", empleado_id: "EMP-021", login: "agarcia", estado_cuenta: "ACTIVA", fecha_creacion: "2024-01-20", fecha_desactivacion: "", mfa_habilitado: "NO" },
    { usuario_id: "USR-004", empleado_id: "EMP-001", login: "admin_audit", estado_cuenta: "ACTIVA", fecha_creacion: "2023-11-01", fecha_desactivacion: "", mfa_habilitado: "SI" },
    { usuario_id: "USR-005", empleado_id: "EMP-008", login: "compras01", estado_cuenta: "ACTIVA", fecha_creacion: "2024-08-01", fecha_desactivacion: "", mfa_habilitado: "NO" }
  ];

  const INITIAL_EMPLEADOS = [
    { empleado_id: "EMP-001", nombre_ficticio: "Andrés Velásquez", area: "Auditoría Interna", cargo: "Auditor Líder", fecha_ingreso: "2023-11-01", fecha_retiro: "", estado_laboral: "ACTIVO" },
    { empleado_id: "EMP-008", nombre_ficticio: "Sandra Morales", area: "Compras", cargo: "Auxiliar de Compras", fecha_ingreso: "2024-08-01", fecha_retiro: "", estado_laboral: "ACTIVO" },
    { empleado_id: "EMP-010", nombre_ficticio: "Juan Pérez", area: "Bodega", cargo: "Jefe de Almacén", fecha_ingreso: "2022-02-15", fecha_retiro: "2027-01-15", estado_laboral: "RETIRADO" },
    { empleado_id: "EMP-014", nombre_ficticio: "María Rojas", area: "Contabilidad", cargo: "Analista de Inventarios", fecha_ingreso: "2022-06-01", fecha_retiro: "2027-01-30", estado_laboral: "RETIRADO" },
    { empleado_id: "EMP-021", nombre_ficticio: "Alberto García", area: "Sistemas", cargo: "Administrador TI", fecha_ingreso: "2021-04-10", fecha_retiro: "2027-02-01", estado_laboral: "RETIRADO" }
  ];

  const INITIAL_INVENTARIO_ERP = [
    { fecha_corte: "2027-01-31", producto_id: "PRD-001", bodega_id: "BOD-01", cantidad_erp: 5400, fecha_actualizacion: "2027-01-31 18:00" },
    { fecha_corte: "2027-01-31", producto_id: "PRD-002", bodega_id: "BOD-01", cantidad_erp: 1200, fecha_actualizacion: "2027-01-31 18:00" },
    { fecha_corte: "2027-01-31", producto_id: "PRD-003", bodega_id: "BOD-02", cantidad_erp: 18500, fecha_actualizacion: "2027-01-31 18:00" },
    { fecha_corte: "2027-01-31", producto_id: "PRD-004", bodega_id: "BOD-03", cantidad_erp: 3400, fecha_actualizacion: "2027-01-31 18:00" }
  ];

  const INITIAL_CONTEOS_FISICOS = [
    { conteo_id: "CNT-001", fecha_corte: "2027-01-31", producto_id: "PRD-001", bodega_id: "BOD-01", cantidad_fisica: 5150, fecha_conteo: "2027-02-01", responsable_id: "EMP-010", aprobado_por: "EMP-010" },
    { conteo_id: "CNT-002", fecha_corte: "2027-01-31", producto_id: "PRD-002", bodega_id: "BOD-01", cantidad_fisica: 1120, fecha_conteo: "2027-02-01", responsable_id: "EMP-008", aprobado_por: "" },
    { conteo_id: "CNT-003", fecha_corte: "2027-01-31", producto_id: "PRD-003", bodega_id: "BOD-02", cantidad_fisica: 18500, fecha_conteo: "2027-02-01", responsable_id: "EMP-008", aprobado_por: "EMP-001" },
    { conteo_id: "CNT-004", fecha_corte: "2027-01-31", producto_id: "PRD-004", bodega_id: "BOD-03", cantidad_fisica: 3200, fecha_conteo: "2027-02-01", responsable_id: "EMP-010", aprobado_por: "EMP-010" }
  ];

  const INITIAL_EVIDENCIAS = [
    ["jperez", "Exempleado", "Cuenta aún activa y con accesos vigentes", "2027-02-03 19:42", "181.52.10.24", "Alto"],
    ["mrojas", "Exempleada", "Cuenta aún activa", "2027-02-05 08:15", "190.25.4.18", "Alto"],
    ["agarcia", "Exempleado", "Cuenta aún activa y sesión abierta", "2027-02-07 21:10", "181.49.22.91", "Alto"],
    ["op planta 04", "Operario de planta", "Permiso para aprobar órdenes de compra", "2027-02-08 10:32", "Red corporativa", "Alto"],
    ["compras01", "Auxiliar de compras", "Inicio de sesión fuera de horario habitual", "2027-02-09 23:18", "201.184.33.70", "Medio"]
  ];

  class StateManager {
    constructor() {
      this.data = {};
      this.status = {};
      this.subscribers = new Set();
      this.init();
    }

    init() {
      this.data.bodegas = this.loadLocal("bodegas", INITIAL_BODEGAS);
      this.data.productos = this.loadLocal("productos", INITIAL_PRODUCTOS);
      this.data.usuarios = this.loadLocal("usuarios", INITIAL_USUARIOS);
      this.data.empleados = this.loadLocal("empleados", INITIAL_EMPLEADOS);
      this.data.inventario_erp = this.loadLocal("inventario_erp", INITIAL_INVENTARIO_ERP);
      this.data.conteos_fisicos = this.loadLocal("conteos_fisicos", INITIAL_CONTEOS_FISICOS);
      this.data.evidencias = this.loadLocal("evidencias", INITIAL_EVIDENCIAS);

      ["bodegas", "productos", "usuarios", "empleados", "inventario_erp", "conteos_fisicos"].forEach(k => {
        if (this.data[k] && this.data[k].length) {
          this.status[k] = { name: `${k}.csv`, key: k, ok: true, rows: this.data[k].length, note: "Datos en memoria/local" };
        }
      });
    }

    loadLocal(key, defaultVal) {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        return stored ? JSON.parse(stored) : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    }

    saveLocal(key) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(this.data[key] || []));
      } catch (e) {}
    }

    subscribe(listener) {
      this.subscribers.add(listener);
      return () => this.subscribers.delete(listener);
    }

    notify(event, payload) {
      this.subscribers.forEach(fn => {
        try { fn(event, payload); } catch (e) { console.error(e); }
      });
    }

    getAll(entity) {
      return this.data[entity] || [];
    }

    getById(entity, idField, idValue) {
      return (this.data[entity] || []).find(item => String(item[idField]) === String(idValue));
    }

    create(entity, item, idField = null) {
      if (!this.data[entity]) this.data[entity] = [];
      if (idField && item[idField]) {
        const exists = this.getById(entity, idField, item[idField]);
        if (exists) {
          throw new Error(`Ya existe un registro con ${idField} = "${item[idField]}"`);
        }
      }
      this.data[entity].unshift(item);
      this.saveLocal(entity);
      this.updateStatus(entity);
      this.notify("create", { entity, item });
      return item;
    }

    update(entity, idField, idValue, updatedFields) {
      if (!this.data[entity]) return null;
      const index = this.data[entity].findIndex(item => String(item[idField]) === String(idValue));
      if (index === -1) throw new Error(`Registro con ${idField} = "${idValue}" no encontrado.`);
      
      this.data[entity][index] = { ...this.data[entity][index], ...updatedFields };
      this.saveLocal(entity);
      this.updateStatus(entity);
      this.notify("update", { entity, item: this.data[entity][index] });
      return this.data[entity][index];
    }

    delete(entity, idField, idValue) {
      if (!this.data[entity]) return false;
      const initialLen = this.data[entity].length;
      this.data[entity] = this.data[entity].filter(item => String(item[idField]) !== String(idValue));
      if (this.data[entity].length !== initialLen) {
        this.saveLocal(entity);
        this.updateStatus(entity);
        this.notify("delete", { entity, idField, idValue });
        return true;
      }
      return false;
    }

    addEvidence(record) {
      if (!this.data.evidencias) this.data.evidencias = [];
      this.data.evidencias.unshift(record);
      this.saveLocal("evidencias");
      this.notify("create", { entity: "evidencias", item: record });
    }

    deleteEvidence(index) {
      if (!this.data.evidencias || index < 0 || index >= this.data.evidencias.length) return false;
      this.data.evidencias.splice(index, 1);
      this.saveLocal("evidencias");
      this.notify("delete", { entity: "evidencias", index });
      return true;
    }

    updateStatus(entity) {
      const rows = this.data[entity] || [];
      this.status[entity] = {
        name: `${entity}.csv`,
        key: entity,
        ok: true,
        rows: rows.length,
        note: "Gestión interactiva / Local"
      };
    }

    resetDefaults() {
      this.data.bodegas = [...INITIAL_BODEGAS];
      this.data.productos = [...INITIAL_PRODUCTOS];
      this.data.usuarios = [...INITIAL_USUARIOS];
      this.data.empleados = [...INITIAL_EMPLEADOS];
      this.data.inventario_erp = [...INITIAL_INVENTARIO_ERP];
      this.data.conteos_fisicos = [...INITIAL_CONTEOS_FISICOS];
      this.data.evidencias = [...INITIAL_EVIDENCIAS];

      ["bodegas", "productos", "usuarios", "empleados", "inventario_erp", "conteos_fisicos", "evidencias"].forEach(k => {
        this.saveLocal(k);
        this.updateStatus(k);
      });
      this.notify("reset", {});
    }
  }

  window.AppState = new StateManager();
})(window);
