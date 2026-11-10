// js/app.js - Punto de entrada principal
(function(window) {
  "use strict";

  const state = window.AppState;
  const { $ } = window.AppUtils;
  const { ingestFiles } = window.AppCSV;
  const { renderBodegasCRUD } = window.AppBodegas;
  const { renderUserManagement } = window.AppUsers;
  const { renderProductCRUD, renderInventoryAnalysis } = window.AppInventory;
  const { renderEvidenceCRUD } = window.AppEvidence;
  const { renderUserFindings, renderDashboard, renderUploads } = window.AppReports;

  function renderAll() {
    renderDashboard();
    renderUploads();
    renderBodegasCRUD();
    renderUserManagement();
    renderProductCRUD();
    renderInventoryAnalysis();
    renderEvidenceCRUD();
    renderUserFindings();
  }

  function activateTab(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === id));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    
    const names = {
      overview: "Resumen general",
      uploads: "Carga de información",
      inventory: "Inventarios y Productos",
      bodegas: "Gestión de Bodegas",
      users: "Usuarios y Permisos",
      evidence: "Evidencias de acceso",
      project: "Proyecto IoT"
    };
    
    const currentSection = $("currentSection");
    if (currentSection) currentSection.textContent = names[id] || "Resumen general";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setupSubtabs() {
    document.querySelectorAll(".subtab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".panel");
        if (!parent) return;
        const targetSubtab = btn.dataset.subtab;
        
        parent.querySelectorAll(".subtab-btn").forEach(b => b.classList.toggle("active", b === btn));
        parent.querySelectorAll(".subtab-content").forEach(content => {
          content.classList.toggle("active", content.id === targetSubtab);
        });
      });
    });
  }

  function initNavigation() {
    document.querySelectorAll(".nav-item").forEach(b => {
      b.addEventListener("click", () => activateTab(b.dataset.tab));
    });

    document.querySelectorAll("[data-goto]").forEach(b => {
      b.addEventListener("click", () => activateTab(b.dataset.goto));
    });

    const resetBtn = $("resetDataBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("¿Deseas restablecer los datos de demostración a su estado inicial?")) {
          state.resetDefaults();
        }
      });
    }

    const bulkInput = $("bulkInput");
    if (bulkInput) {
      bulkInput.addEventListener("change", async () => {
        await ingestFiles([...bulkInput.files]);
      });
    }

    const dz = $("dropzone");
    if (dz) {
      ["dragover", "dragenter"].forEach(ev =>
        dz.addEventListener(ev, e => {
          e.preventDefault();
          dz.classList.add("over");
        })
      );
      ["dragleave", "drop"].forEach(ev =>
        dz.addEventListener(ev, e => {
          e.preventDefault();
          dz.classList.remove("over");
        })
      );
      dz.addEventListener("drop", async e => {
        const files = [...e.dataTransfer.files].filter(f => /\.csv$/i.test(f.name));
        await ingestFiles(files);
      });
    }

    const projectForm = $("projectForm");
    if (projectForm) {
      projectForm.addEventListener("submit", e => {
        e.preventDefault();
        const name = $("projectName").value.trim();
        const msg = $("projectMessage");
        if (msg) {
          msg.textContent = `Proyecto "${name}" registrado en la demostración local.`;
        }
        projectForm.reset();
      });
    }
  }

  state.subscribe((event, payload) => {
    renderAll();
  });

  document.addEventListener("DOMContentLoaded", () => {
    setupSubtabs();
    initNavigation();
    renderAll();
  });
})(window);
