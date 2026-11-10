// js/modules/csvService.js - Parser, detector e ingesta de archivos CSV
(function(window) {
  "use strict";

  const { SCHEMAS } = window.AppSchemas;
  const { toNumber } = window.AppUtils;
  const state = window.AppState;

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/, 1)[0], counts = { ",": 0, ";": 0, "\t": 0 };
    let quoted = false;
    for (const ch of first) {
      if (ch === '"') quoted = !quoted;
      else if (!quoted && ch in counts) counts[ch]++;
    }
    const delimiter = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const rows = [];
    let row = [], field = "", inQ = false;
    const endRow = () => {
      row.push(field);
      field = "";
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
    };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (ch === '"') inQ = false;
        else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delimiter) {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        endRow();
      } else field += ch;
    }
    if (field !== "" || row.length) endRow();
    return rows;
  }

  const normHeader = h => h.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/\s+/g, "_");

  function detectSchema(fileName, headers) {
    const base = fileName.toLowerCase().replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "");
    if (SCHEMAS[base]) return SCHEMAS[base];
    return Object.values(SCHEMAS)
      .filter(s => s.columns.every(c => headers.includes(c)))
      .sort((a, b) => b.columns.length - a.columns.length)[0] || null;
  }

  async function ingestFile(file) {
    const table = parseCSV(await file.text());
    if (!table.length) return { name: file.name, ok: false, note: "Archivo vacío." };
    const headers = table[0].map(normHeader);
    const schema = detectSchema(file.name, headers);
    if (!schema) return { name: file.name, ok: false, note: "No coincide con ningún esquema conocido." };
    const missing = schema.columns.filter(c => !headers.includes(c));
    if (missing.length) return { name: file.name, key: schema.key, ok: false, note: `Faltan columnas: ${missing.join(", ")}` };
    
    const idx = schema.columns.map(c => headers.indexOf(c));
    const empties = Object.fromEntries(schema.columns.map(c => [c, 0]));
    let badNums = 0;
    
    const rows = table.slice(1).map(cells => {
      const o = {};
      schema.columns.forEach((c, i) => {
        o[c] = (cells[idx[i]] ?? "").trim();
        if (o[c] === "") empties[c]++;
      });
      schema.numeric.forEach(c => {
        o[c] = toNumber(o[c]);
        if (Number.isNaN(o[c])) badNums++;
      });
      return o;
    });

    const emptyList = Object.entries(empties).filter(([c, n]) => n > 0 && !schema.numeric.includes(c)).map(([c, n]) => `${c} (${n})`).join(", ");
    const extra = headers.filter(h => !schema.columns.includes(h)), notes = [];
    if (emptyList) notes.push(`Campos vacíos: ${emptyList}`);
    if (badNums) notes.push(`${badNums} valores numéricos inválidos`);
    if (extra.length) notes.push(`Columnas extra ignoradas: ${extra.join(", ")}`);

    state.data[schema.key] = rows;
    state.saveLocal(schema.key);
    const res = { name: file.name, key: schema.key, ok: true, rows: rows.length, note: notes.join(" · ") };
    state.status[schema.key] = res;
    state.notify("ingest", { schema: schema.key, rows });
    return res;
  }

  async function ingestFiles(files) {
    for (const file of files) {
      if (!/\.csv$/i.test(file.name)) continue;
      const res = await ingestFile(file);
      state.status[res.key || "?" + res.name] = res;
    }
  }

  window.AppCSV = { parseCSV, normHeader, detectSchema, ingestFile, ingestFiles };
})(window);
