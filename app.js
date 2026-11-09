"use strict";

const SCHEMAS = {};
function def(key, category, columns, numeric = "") {
  SCHEMAS[key] = { key, category, file: key + ".csv", columns: columns.split(","), numeric: numeric ? numeric.split(",") : [] };
}
def("productos","inventario","producto_id,sku,nombre,categoria,unidad_medida,costo_unitario_cop,estado","costo_unitario_cop");
def("inventario_erp","inventario","fecha_corte,producto_id,bodega_id,cantidad_erp,fecha_actualizacion","cantidad_erp");
def("inventario_excel","inventario","archivo_id,fecha_corte,producto_id,bodega_id,cantidad_excel,responsable_id,fecha_modificacion","cantidad_excel");
def("conteos_fisicos","inventario","conteo_id,fecha_corte,producto_id,bodega_id,cantidad_fisica,fecha_conteo,responsable_id,aprobado_por","cantidad_fisica");
def("movimientos_inventario","inventario","movimiento_id,fecha_hora,producto_id,bodega_id,tipo_movimiento,cantidad,usuario_id,registrado_erp,documento_soporte_id,aprobado_por","cantidad");
def("operaciones_compras","compras","operacion_id,sesion_id,usuario_id,fecha_hora,tipo_operacion,orden_compra_id,monto_cop,resultado","monto_cop");
def("sesiones","compras","sesion_id,usuario_id,inicio_sesion,fin_sesion,ip_origen,dispositivo,resultado_autenticacion,modulo");
def("presupuesto_iot","proyecto","rubro_id,proyecto_id,concepto,monto_aprobado_usd,fecha_aprobacion,version_presupuesto","monto_aprobado_usd");
def("contratos_iot","proyecto","contrato_id,proyecto_id,proveedor_id,proveedor_nombre,rubro_id,valor_contrato_usd,fecha_firma,fecha_compromiso,estado","valor_contrato_usd");
def("entregables_iot","proyecto","entregable_id,contrato_id,descripcion,fecha_planeada,fecha_entrega_real,porcentaje_avance,estado_entrega,evidencia_entrega_ref","porcentaje_avance");
def("actas_aceptacion","proyecto","acta_id,entregable_id,fecha_acta,responsable_id,resultado_aceptacion,documento_ref");
def("facturas_iot","proyecto","linea_factura_id,numero_factura,contrato_id,entregable_id,fecha_emision,concepto,valor_usd,estado_validacion","valor_usd");
def("pagos_iot","proyecto","pago_id,numero_factura,fecha_pago,monto_pagado_usd,medio_pago,autorizado_por","monto_pagado_usd");
def("empleados","usuarios","empleado_id,nombre_ficticio,area,cargo,fecha_ingreso,fecha_retiro,estado_laboral");
def("usuarios","usuarios","usuario_id,empleado_id,login,estado_cuenta,fecha_creacion,fecha_desactivacion,mfa_habilitado");
def("roles_permisos","usuarios","rol_id,nombre_rol,modulo,accion,permitido");
def("usuarios_roles","usuarios","asignacion_id,usuario_id,rol_id,fecha_asignacion,fecha_revocacion,autorizado_por");
def("eventos_tecnicos","incidentes","evento_id,fecha_hora,sistema,tipo_evento,severidad_tecnica,codigo_evento,descripcion,referencia_log");
def("incidentes","incidentes","incidente_id,evento_id,fecha_reporte,canal_reporte,categoria,severidad_asignada,responsable_id,estado,fecha_cierre,causa_raiz,evidencia_cierre");
def("atenciones_incidentes","incidentes","atencion_id,incidente_id,fecha_hora,responsable_id,accion_realizada,resultado,evidencia_ref");
def("avisos_informales","incidentes","aviso_id,evento_id,fecha_hora,canal,emisor_id,descripcion,incidente_id");

const CATEGORIES = [
  {id:"inventario",name:"Inventarios",detail:"Diferencias entre inventario físico y ERP; ajustes y movimientos."},
  {id:"compras",name:"Compras y proveedores",detail:"Operaciones y sesiones del módulo de compras."},
  {id:"proyecto",name:"Proyecto IoT",detail:"Presupuesto, contratos, facturación, entregables y actas de aceptación."},
  {id:"usuarios",name:"Usuarios y permisos",detail:"Empleados, cuentas, roles y permisos."},
  {id:"incidentes",name:"Incidentes de TI",detail:"Eventos, incidentes, atenciones y avisos informales."},
  {id:"produccion",name:"Producción y trazabilidad",detail:"Aún sin esquema CSV definido."},
  {id:"facturacion",name:"Facturación y contabilidad",detail:"Aún sin esquema CSV definido (las facturas IoT están en Proyecto IoT)."},
  {id:"mantenimiento",name:"Mantenimiento y terceros",detail:"Aún sin esquema CSV definido."}
];
const data = {}, status = {};
const fmtCOP = new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
const fmtNum = new Intl.NumberFormat("es-CO",{maximumFractionDigits:2});
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cellNum = v => v == null || Number.isNaN(v) ? "—" : fmtNum.format(v);
const isYes = v => ["SI","SÍ","S","1","TRUE","YES","Y"].includes(String(v).trim().toUpperCase());

function parseCSV(text) {
  text = text.replace(/^\uFEFF/,"");
  const first = text.split(/\r?\n/,1)[0], counts = {",":0,";":0,"\t":0};
  let quoted = false;
  for (const ch of first) { if(ch === '"') quoted = !quoted; else if(!quoted && ch in counts) counts[ch]++; }
  const delimiter = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[]; let row=[], field="", inQ=false;
  const endRow=()=>{row.push(field);field="";if(row.some(v=>v.trim()!==""))rows.push(row);row=[];};
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(inQ){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')inQ=false;else field+=ch;}
    else if(ch==='"')inQ=true;
    else if(ch===delimiter){row.push(field);field="";}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&text[i+1]==="\n")i++;endRow();}
    else field+=ch;
  }
  if(field!==""||row.length)endRow();
  return rows;
}
const normHeader = h => h.trim().replace(/^\uFEFF/,"").toLowerCase().replace(/\s+/g,"_");
function toNumber(v){
  let s=String(v??"").trim().replace(/[^\d,.\-]/g,""); if(!s)return NaN;
  const c=s.lastIndexOf(","),d=s.lastIndexOf(".");
  if(c>-1&&d>-1)s=c>d?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
  else if(c>-1)s=/,\d{1,2}$/.test(s)?s.replace(",","."):s.replace(/,/g,"");
  return Number(s);
}
function detectSchema(fileName,headers){
  const base=fileName.toLowerCase().replace(/\.[^.]+$/,"").replace(/\s*\(\d+\)$/,"");
  if(SCHEMAS[base])return SCHEMAS[base];
  return Object.values(SCHEMAS).filter(s=>s.columns.every(c=>headers.includes(c))).sort((a,b)=>b.columns.length-a.columns.length)[0]||null;
}
async function ingestFile(file){
  const table=parseCSV(await file.text());
  if(!table.length)return{name:file.name,ok:false,note:"Archivo vacío."};
  const headers=table[0].map(normHeader),schema=detectSchema(file.name,headers);
  if(!schema)return{name:file.name,ok:false,note:"No coincide con ningún esquema conocido."};
  const missing=schema.columns.filter(c=>!headers.includes(c));
  if(missing.length)return{name:file.name,key:schema.key,ok:false,note:`Faltan columnas: ${missing.join(", ")}`};
  const idx=schema.columns.map(c=>headers.indexOf(c)), empties=Object.fromEntries(schema.columns.map(c=>[c,0]));
  let badNums=0;
  const rows=table.slice(1).map(cells=>{
    const o={}; schema.columns.forEach((c,i)=>{o[c]=(cells[idx[i]]??"").trim();if(o[c]==="")empties[c]++;});
    schema.numeric.forEach(c=>{o[c]=toNumber(o[c]);if(Number.isNaN(o[c]))badNums++;});
    return o;
  });
  const emptyList=Object.entries(empties).filter(([c,n])=>n>0&&!schema.numeric.includes(c)).map(([c,n])=>`${c} (${n})`).join(", ");
  const extra=headers.filter(h=>!schema.columns.includes(h)),notes=[];
  if(emptyList)notes.push(`Campos vacíos: ${emptyList}`);
  if(badNums)notes.push(`${badNums} valores numéricos inválidos`);
  if(extra.length)notes.push(`Columnas extra ignoradas: ${extra.join(", ")}`);
  data[schema.key]=rows;
  return{name:file.name,key:schema.key,ok:true,rows:rows.length,note:notes.join(" · ")};
}
async function ingestFiles(files){
  for(const file of files){if(!/\.csv$/i.test(file.name))continue;const res=await ingestFile(file);status[res.key||"?"+res.name]=res;}
  renderUploads();renderInventory();renderUserFindings();renderDashboard();
}
function renderUploads(){
  const grid=$("uploadGrid");grid.innerHTML="";
  CATEGORIES.forEach(cat=>{
    const schemas=Object.values(SCHEMAS).filter(s=>s.category===cat.id),loaded=schemas.filter(s=>status[s.key]?.ok).length;
    const item=document.createElement("article");item.className="upload-item";
    const files=schemas.map(s=>{const st=status[s.key];return !st?`<li class="muted">○ ${s.file}</li>`:st.ok?`<li class="ok">✓ ${s.file} — ${st.rows} filas${st.note?`<br><span class="muted">${esc(st.note)}</span>`:""}</li>`:`<li class="bad">✕ ${s.file}: ${esc(st.note)}</li>`;}).join("");
    item.innerHTML=`<h3>${esc(cat.name)} ${schemas.length?`<span class="muted">(${loaded}/${schemas.length})</span>`:""}</h3><p>${esc(cat.detail)}</p>${schemas.length?`<ul class="file-list">${files}</ul>`:`<span class="tag warn">Sin esquema CSV configurado</span>`}`;
    if(schemas.length){const input=document.createElement("input");input.type="file";input.accept=".csv,text/csv";input.multiple=true;input.setAttribute("aria-label",`Archivos de ${cat.name}`);input.addEventListener("change",()=>ingestFiles([...input.files]));item.appendChild(input);}
    grid.appendChild(item);
  });
  const unknown=Object.entries(status).filter(([k,v])=>!v.ok&&!SCHEMAS[k]);
  if(unknown.length){const item=document.createElement("article");item.className="upload-item";item.innerHTML=`<h3>Archivos no reconocidos</h3><ul class="file-list">${unknown.map(([,v])=>`<li class="bad">✕ ${esc(v.name)}: ${esc(v.note)}</li>`).join("")}</ul>`;grid.appendChild(item);}
}
function kpis(items){return `<div class="kpis">${items.map(([l,v])=>`<div class="kpi"><span>${esc(l)}</span><b>${v}</b></div>`).join("")}</div>`;}
function table(headers,rows,limit=200,emptyMsg="Sin hallazgos."){const body=rows.slice(0,limit).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("");return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body||`<tr><td colspan="${headers.length}">${emptyMsg}</td></tr>`}</tbody></table></div>${rows.length>limit?`<p class="footnote">Mostrando ${limit} de ${rows.length} registros.</p>`:""}`;}

function renderInventory(){
  const box=$("inventoryResults"),d=data;
  if(!(d.productos&&d.inventario_erp&&(d.inventario_excel||d.conteos_fisicos)))return;
  const productos=new Map(d.productos.map(p=>[p.producto_id,p]));
  const empleados=new Map((d.empleados||[]).map(e=>[e.empleado_id,e]));
  const empDeUsuario=new Map((d.usuarios||[]).map(u=>[u.usuario_id,u.empleado_id]));
  const key=r=>`${r.fecha_corte}|${r.producto_id}|${r.bodega_id}`;
  const erp=new Map(d.inventario_erp.map(r=>[key(r),r]));
  const xls=new Map((d.inventario_excel||[]).map(r=>[key(r),r]));
  const fis=new Map((d.conteos_fisicos||[]).map(r=>[key(r),r]));
  const diffs=[];
  new Set([...erp.keys(),...xls.keys(),...fis.keys()]).forEach(k=>{
    const [fecha,pid,bod]=k.split("|"),qErp=erp.get(k)?.cantidad_erp??null;
    const qXls=d.inventario_excel?xls.get(k)?.cantidad_excel??null:undefined;
    const qFis=d.conteos_fisicos?fis.get(k)?.cantidad_fisica??null:undefined;
    const vals=[qErp,qXls,qFis].filter(v=>v!==undefined);
    if(vals.every(v=>v!==null&&v===vals[0]))return;
    const ref=qFis??qXls,diff=ref!=null&&qErp!=null?ref-qErp:null,costo=productos.get(pid)?.costo_unitario_cop;
    diffs.push({fecha,pid,bod,nombre:productos.get(pid)?.nombre??"(no existe en productos)",qErp,qXls,qFis,diff,valor:diff!=null&&Number.isFinite(costo)?diff*costo:null,resp:fis.get(k)?.responsable_id||xls.get(k)?.responsable_id||""});
  });
  diffs.sort((a,b)=>Math.abs(b.valor??0)-Math.abs(a.valor??0));
  const net=diffs.reduce((s,x)=>s+(x.valor??0),0),abs=diffs.reduce((s,x)=>s+Math.abs(x.valor??0),0);
  const movs=[];
  (d.movimientos_inventario||[]).forEach(m=>{
    const r=[];
    if(!isYes(m.registrado_erp))r.push("No registrado en ERP");
    if(!m.documento_soporte_id)r.push("Sin documento soporte");
    if(!m.aprobado_por)r.push(m.tipo_movimiento.startsWith("AJUSTE")?"Ajuste sin aprobación":"Sin aprobación");
    else if(m.aprobado_por===m.usuario_id||m.aprobado_por===empDeUsuario.get(m.usuario_id))r.push("Autoaprobado");
    const retiro=empleados.get(empDeUsuario.get(m.usuario_id))?.fecha_retiro;
    if(retiro&&m.fecha_hora.slice(0,10)>retiro)r.push("Usuario de empleado retirado");
    if(!productos.has(m.producto_id))r.push("Producto inexistente");
    if(r.length)movs.push([esc(m.movimiento_id),esc(m.fecha_hora.replace("T"," ").slice(0,16)),esc(m.producto_id),esc(m.bodega_id),esc(m.tipo_movimiento),cellNum(m.cantidad),esc(m.usuario_id),r.map(x=>`<span class="tag">${esc(x)}</span>`).join(" ")]);
  });
  const conteos=(d.conteos_fisicos||[]).filter(c=>!c.aprobado_por||c.aprobado_por===c.responsable_id).map(c=>[esc(c.conteo_id),esc(c.fecha_corte),esc(c.producto_id),esc(c.bodega_id),esc(c.responsable_id),esc(c.aprobado_por||"—"),`<span class="tag">${c.aprobado_por?"Aprobó quien contó":"Sin aprobación"}</span>`]);
  box.className="results-section";
  box.innerHTML=kpis([["Combinaciones con diferencia",diffs.length],["Impacto neto estimado",fmtCOP.format(net)],["Impacto absoluto",fmtCOP.format(abs)],["Movimientos con alertas",`${movs.length} / ${(d.movimientos_inventario||[]).length}`],["Conteos sin aprobación válida",conteos.length]])+
    `<h3>Diferencias ERP vs. Excel vs. conteo físico</h3>`+table(["Corte","ID producto","Producto","Bodega","ERP","Excel","Físico","Dif. ref. − ERP","Valor COP","Responsable"],diffs.map(x=>[esc(x.fecha),esc(x.pid),esc(x.nombre),esc(x.bod),cellNum(x.qErp),cellNum(x.qXls),cellNum(x.qFis),cellNum(x.diff),x.valor==null?"—":fmtCOP.format(x.valor),esc(x.resp)]))+
    (d.movimientos_inventario?`<h3>Movimientos con alertas</h3>`+table(["Movimiento","Fecha/hora","Producto","Bodega","Tipo","Cantidad","Usuario","Alertas"],movs):"")+
    (d.conteos_fisicos?`<h3>Conteos sin aprobación válida</h3>`+table(["Conteo","Corte","Producto","Bodega","Contó","Aprobó","Alerta"],conteos):"");
}
function renderUserFindings(){
  const box=$("userFindings"),{empleados,usuarios,sesiones}=data;if(!(empleados&&usuarios))return;
  const emp=new Map(empleados.map(e=>[e.empleado_id,e])),userMap=new Map(usuarios.map(u=>[u.usuario_id,u]));
  const retirados=usuarios.filter(u=>u.estado_cuenta==="ACTIVA"&&emp.get(u.empleado_id)?.estado_laboral==="RETIRADO");
  const sinMfa=usuarios.filter(u=>u.estado_cuenta==="ACTIVA"&&!isYes(u.mfa_habilitado));
  const post=(sesiones||[]).filter(s=>{const u=userMap.get(s.usuario_id),limite=[emp.get(u?.empleado_id)?.fecha_retiro,u?.fecha_desactivacion].filter(Boolean).sort()[0];return s.resultado_autenticacion==="EXITOSA"&&limite&&s.inicio_sesion.slice(0,10)>limite;});
  box.className="results-section";
  box.innerHTML=kpis([["Cuentas activas de retirados",retirados.length],["Cuentas activas sin MFA",sinMfa.length],["Sesiones exitosas tras la baja",sesiones?post.length:"—"]])+
    `<h3>Cuentas activas de empleados retirados</h3>`+table(["Usuario","Login","Empleado","Fecha de retiro","Estado cuenta","MFA"],retirados.map(u=>[esc(u.usuario_id),esc(u.login),esc(u.empleado_id),esc(emp.get(u.empleado_id)?.fecha_retiro),`<span class="tag">${esc(u.estado_cuenta)}</span>`,esc(u.mfa_habilitado)]))+
    `<h3>Cuentas activas sin MFA</h3>`+table(["Usuario","Login","Empleado","Estado cuenta","MFA"],sinMfa.map(u=>[esc(u.usuario_id),esc(u.login),esc(u.empleado_id),esc(u.estado_cuenta),`<span class="tag">Sin MFA</span>`]))+
    (sesiones?`<h3>Sesiones exitosas posteriores a la baja</h3>`+table(["Sesión","Usuario","Inicio","IP","Dispositivo"],post.map(s=>[esc(s.sesion_id),esc(s.usuario_id),esc(s.inicio_sesion.replace("T"," ").slice(0,16)),esc(s.ip_origen),esc(s.dispositivo)])):"");
}
function renderDashboard(){
  const loaded=Object.values(status).filter(s=>s.ok),errors=Object.values(status).filter(s=>!s.ok);
  $("kpiFiles").textContent=loaded.length;$("kpiRows").textContent=loaded.reduce((n,s)=>n+(s.rows||0),0).toLocaleString("es-CO");
  $("kpiErrors").textContent=errors.length;
  const areas=CATEGORIES.filter(c=>Object.values(SCHEMAS).some(s=>s.category===c.id));
  const ready=areas.filter(c=>Object.values(SCHEMAS).some(s=>s.category===c.id&&status[s.key]?.ok)).length;
  $("kpiAreas").textContent=ready;
  $("kpiFilesSub").textContent=`de ${Object.keys(SCHEMAS).length} esquemas disponibles`;
  $("areaOverview").innerHTML=areas.map(c=>{const all=Object.values(SCHEMAS).filter(s=>s.category===c.id),n=all.filter(s=>status[s.key]?.ok).length,pct=all.length?n/all.length*100:0;return `<div class="area-row"><span>${esc(c.name)}</span><div class="progress"><span style="width:${pct}%"></span></div><b>${n}/${all.length}</b></div>`;}).join("");
}
function addAccessRow(record){
  const tr=document.createElement("tr");
  record.forEach((value,i)=>{const td=document.createElement("td");if(i===5){const tag=document.createElement("span");tag.className=value==="Alto"?"tag":"tag warn";tag.textContent=value;td.appendChild(tag);}else td.textContent=value;tr.appendChild(td);});
  $("accessRows").appendChild(tr);$("evidenceCount").textContent=`${$("accessRows").children.length} registros`;
}
[
 ["jperez","Exempleado","Cuenta aún activa","2027-02-03 19:42","181.52.10.24","Alto"],
 ["mrojas","Exempleada","Cuenta aún activa","2027-02-05 08:15","190.25.4.18","Alto"],
 ["agarcia","Exempleado","Cuenta aún activa","2027-02-07 21:10","181.49.22.91","Alto"],
 ["op planta 04","Operario de planta","Permiso para aprobar órdenes de compra","2027-02-08 10:32","Red corporativa","Alto"],
 ["compras01","Auxiliar de compras","Inicio de sesión fuera de horario","2027-02-09 23:18","201.184.33.70","Medio"]
].forEach(addAccessRow);

function activateTab(id){
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  const names={overview:"Resumen general",uploads:"Carga de información",inventory:"Inventarios",users:"Usuarios y permisos",evidence:"Evidencias de acceso",project:"Proyecto IoT"};
  $("currentSection").textContent=names[id]||"Resumen general";
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.goto)));
$("bulkInput").addEventListener("change",()=>ingestFiles([...$("bulkInput").files]));
const dz=$("dropzone");
["dragover","dragenter"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("over");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("over");}));
dz.addEventListener("drop",e=>ingestFiles([...e.dataTransfer.files].filter(f=>/\.csv$/i.test(f.name))));
$("accessForm").addEventListener("submit",e=>{
  e.preventDefault();const v=id=>$(id).value.trim();
  addAccessRow([v("user"),v("role"),v("event"),v("datetime").replace("T"," "),v("ip")||"No especificado",$("risk").value]);e.target.reset();
});
$("projectForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("projectName").value.trim();
  $("projectMessage").textContent=`Proyecto "${name}" registrado en esta demostración. Los datos no se guardan al recargar la página.`;
  e.target.reset();
});
renderUploads();renderDashboard();
