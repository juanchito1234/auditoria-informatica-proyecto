// js/schemas.js - Definición de esquemas y metadatos
(function(window) {
  "use strict";

  const SCHEMAS = {};

  function def(key, category, columns, numeric = "") {
    SCHEMAS[key] = {
      key,
      category,
      file: key + ".csv",
      columns: columns.split(","),
      numeric: numeric ? numeric.split(",") : []
    };
  }

  // Inventario
  def("productos", "inventario", "producto_id,sku,nombre,categoria,unidad_medida,costo_unitario_cop,estado", "costo_unitario_cop");
  def("bodegas", "inventario", "bodega_id,nombre,ubicacion,capacidad_m2,responsable,estado");
  def("inventario_erp", "inventario", "fecha_corte,producto_id,bodega_id,cantidad_erp,fecha_actualizacion", "cantidad_erp");
  def("inventario_excel", "inventario", "archivo_id,fecha_corte,producto_id,bodega_id,cantidad_excel,responsable_id,fecha_modificacion", "cantidad_excel");
  def("conteos_fisicos", "inventario", "conteo_id,fecha_corte,producto_id,bodega_id,cantidad_fisica,fecha_conteo,responsable_id,aprobado_por", "cantidad_fisica");
  def("movimientos_inventario", "inventario", "movimiento_id,fecha_hora,producto_id,bodega_id,tipo_movimiento,cantidad,usuario_id,registrado_erp,documento_soporte_id,aprobado_por", "cantidad");

  // Compras
  def("operaciones_compras", "compras", "operacion_id,sesion_id,usuario_id,fecha_hora,tipo_operacion,orden_compra_id,monto_cop,resultado", "monto_cop");
  def("sesiones", "compras", "sesion_id,usuario_id,inicio_sesion,fin_sesion,ip_origen,dispositivo,resultado_autenticacion,modulo");

  // Proyecto IoT
  def("presupuesto_iot", "proyecto", "rubro_id,proyecto_id,concepto,monto_aprobado_usd,fecha_aprobacion,version_presupuesto", "monto_aprobado_usd");
  def("contratos_iot", "proyecto", "contrato_id,proyecto_id,proveedor_id,proveedor_nombre,rubro_id,valor_contrato_usd,fecha_firma,fecha_compromiso,estado", "valor_contrato_usd");
  def("entregables_iot", "proyecto", "entregable_id,contrato_id,descripcion,fecha_planeada,fecha_entrega_real,porcentaje_avance,estado_entrega,evidencia_entrega_ref", "porcentaje_avance");
  def("actas_aceptacion", "proyecto", "acta_id,entregable_id,fecha_acta,responsable_id,resultado_aceptacion,documento_ref");
  def("facturas_iot", "proyecto", "linea_factura_id,numero_factura,contrato_id,entregable_id,fecha_emision,concepto,valor_usd,estado_validacion", "valor_usd");
  def("pagos_iot", "proyecto", "pago_id,numero_factura,fecha_pago,monto_pagado_usd,medio_pago,autorizado_por", "monto_pagado_usd");

  // Usuarios y permisos
  def("empleados", "usuarios", "empleado_id,nombre_ficticio,area,cargo,fecha_ingreso,fecha_retiro,estado_laboral");
  def("usuarios", "usuarios", "usuario_id,empleado_id,login,estado_cuenta,fecha_creacion,fecha_desactivacion,mfa_habilitado");
  def("roles_permisos", "usuarios", "rol_id,nombre_rol,modulo,accion,permitido");
  def("usuarios_roles", "usuarios", "asignacion_id,usuario_id,rol_id,fecha_asignacion,fecha_revocacion,autorizado_por");

  // Incidentes de TI
  def("eventos_tecnicos", "incidentes", "evento_id,fecha_hora,sistema,tipo_evento,severidad_tecnica,codigo_evento,descripcion,referencia_log");
  def("incidentes", "incidentes", "incidente_id,evento_id,fecha_reporte,canal_reporte,categoria,severidad_asignada,responsable_id,estado,fecha_cierre,causa_raiz,evidencia_cierre");
  def("atenciones_incidentes", "incidentes", "atencion_id,incidente_id,fecha_hora,responsable_id,accion_realizada,resultado,evidencia_ref");
  def("avisos_informales", "incidentes", "aviso_id,evento_id,fecha_hora,canal,emisor_id,descripcion,incidente_id");

  const CATEGORIES = [
    { id: "inventario", name: "Inventarios", detail: "Diferencias entre inventario físico y ERP; ajustes y movimientos." },
    { id: "compras", name: "Compras y proveedores", detail: "Operaciones y sesiones del módulo de compras." },
    { id: "proyecto", name: "Proyecto IoT", detail: "Presupuesto, contratos, facturación, entregables y actas de aceptación." },
    { id: "usuarios", name: "Usuarios y permisos", detail: "Empleados, cuentas, roles y permisos." },
    { id: "incidentes", name: "Incidentes de TI", detail: "Eventos, incidentes, atenciones y avisos informales." },
    { id: "produccion", name: "Producción y trazabilidad", detail: "Aún sin esquema CSV definido." },
    { id: "facturacion", name: "Facturación y contabilidad", detail: "Aún sin esquema CSV definido (las facturas IoT están en Proyecto IoT)." },
    { id: "mantenimiento", name: "Mantenimiento y terceros", detail: "Aún sin esquema CSV definido." }
  ];

  window.AppSchemas = { SCHEMAS, CATEGORIES, def };
})(window);
