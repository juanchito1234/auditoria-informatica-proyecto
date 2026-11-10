// js/utils.js - Funciones auxiliares de formateo, sanitización y DOM
(function(window) {
  "use strict";

  const fmtCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });

  const fmtNum = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2
  });

  const $ = id => document.getElementById(id);

  const esc = v =>
    String(v ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const cellNum = v => (v == null || Number.isNaN(v) ? "—" : fmtNum.format(v));

  const isYes = v => ["SI", "SÍ", "S", "1", "TRUE", "YES", "Y"].includes(String(v).trim().toUpperCase());

  function toNumber(v) {
    let s = String(v ?? "").trim().replace(/[^\d,.\-]/g, "");
    if (!s) return NaN;
    const c = s.lastIndexOf(",");
    const d = s.lastIndexOf(".");
    if (c > -1 && d > -1) {
      s = c > d ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else if (c > -1) {
      s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
    }
    return Number(s);
  }

  function kpis(items) {
    return `<div class="kpis">${items
      .map(([l, v]) => `<div class="kpi"><span>${esc(l)}</span><b>${v}</b></div>`)
      .join("")}</div>`;
  }

  function table(headers, rows, limit = 200, emptyMsg = "Sin hallazgos.") {
    const body = rows
      .slice(0, limit)
      .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="table-wrap"><table><thead><tr>${headers
      .map(h => `<th>${h}</th>`)
      .join("")}</tr></thead><tbody>${
      body || `<tr><td colspan="${headers.length}">${emptyMsg}</td></tr>`
    }</tbody></table></div>${
      rows.length > limit ? `<p class="footnote">Mostrando ${limit} de ${rows.length} registros.</p>` : ""
    }`;
  }

  window.AppUtils = { fmtCOP, fmtNum, $, esc, cellNum, isYes, toNumber, kpis, table };
})(window);
