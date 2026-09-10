/*
 * RoXThal Art Design
 * REPARADOR CONSOLIDADO DE HERRAMIENTAS
 *
 * Objetivo:
 * - No elimina módulos existentes.
 * - No modifica Supabase.
 * - No modifica datos.
 * - Evita que los dos módulos de Herramientas
 *   queden abiertos simultáneamente.
 * - Mantiene accesibles las dos implementaciones existentes.
 * - Centraliza la apertura/cierre desde un único punto.
 */

(function () {
  "use strict";

  if (window.__ROXTHAL_REPAIR_CONSOLIDATED__) {
    return;
  }

  window.__ROXTHAL_REPAIR_CONSOLIDATED__ = true;

  const MAIN_ROOT = "#rxToolsRoot";
  const MAIN_OVERLAY = "#rxToolsOverlay";
  const STUDENT_ROOT = "#roxthalTools";

  function getMainOverlay() {
    return document.querySelector(MAIN_OVERLAY);
  }

  function getStudentRoot() {
    return document.querySelector(STUDENT_ROOT);
  }

  function closeMainTools() {
    const overlay = getMainOverlay();

    if (!overlay) return;

    overlay.classList.remove("rx-open");
    overlay.setAttribute("aria-hidden", "true");

    /*
     * Solo restauramos el scroll si ningún otro
     * módulo de herramientas está abierto.
     */
    const student = getStudentRoot();

    if (!student || !student.classList.contains("rt-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeStudentTools() {
    const root = getStudentRoot();

    if (!root) return;

    root.classList.remove("rt-open");
    root.setAttribute("aria-hidden", "true");

    const overlay = getMainOverlay();

    if (!overlay || !overlay.classList.contains("rx-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllTools() {
    closeMainTools();
    closeStudentTools();
  }

  function openMainTools() {
    const overlay = getMainOverlay();

    if (!overlay) {
      console.warn(
        "[RoXThal Repair] No se encontró #rxToolsOverlay."
      );
      return false;
    }

    /*
     * Garantizamos que el módulo educativo no quede
     * abierto simultáneamente.
     */
    closeStudentTools();

    overlay.classList.add("rx-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    return true;
  }

  function openStudentTools() {
    const root = getStudentRoot();

    if (!root) {
      console.warn(
        "[RoXThal Repair] No se encontró #roxthalTools."
      );
      return false;
    }

    /*
     * Garantizamos que el módulo principal no quede
     * abierto simultáneamente.
     */
    closeMainTools();

    root.classList.add("rt-open");
    root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    return true;
  }

  /*
   * API pública consolidada.
   *
   * No sustituimos funciones existentes si ya existen;
   * solamente añadimos una capa segura de control.
   */
  window.RoXThalTools =
    window.RoXThalTools || {};

  window.RoXThalTools.openMain = openMainTools;
  window.RoXThalTools.openStudent = openStudentTools;
  window.RoXThalTools.close = closeAllTools;
  window.RoXThalTools.closeMain = closeMainTools;
  window.RoXThalTools.closeStudent = closeStudentTools;

  /*
   * ESCAPE:
   * cerrar Herramientas sin interferir con otros módulos.
   */
  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Escape") return;

      const overlay = getMainOverlay();
      const student = getStudentRoot();

      const mainOpen =
        overlay &&
        overlay.classList.contains("rx-open");

      const studentOpen =
        student &&
        student.classList.contains("rt-open");

      if (mainOpen || studentOpen) {
        closeAllTools();
      }
    },
    true
  );

  /*
   * NORMALIZACIÓN INICIAL
   *
   * Si por alguna razón ambos módulos aparecen abiertos
   * después de cargar la aplicación, conservamos el principal
   * y cerramos únicamente el secundario.
   */
  function normalizeToolsState() {
    const overlay = getMainOverlay();
    const student = getStudentRoot();

    if (!overlay || !student) return;

    const mainOpen =
      overlay.classList.contains("rx-open");

    const studentOpen =
      student.classList.contains("rt-open");

    if (mainOpen && studentOpen) {
      closeStudentTools();
    }
  }

  /*
   * INTERCEPTOR LIMITADO
   *
   * Solo actuamos sobre controles que estén claramente
   * identificados como Herramientas.
   *
   * No usamos búsqueda global por el texto de todos los
   * botones de la aplicación.
   */
  document.addEventListener(
    "click",
    function (event) {
      const target =
        event.target &&
        event.target.closest
          ? event.target.closest(
              "[data-tools], " +
              "[data-tool], " +
              "[data-module='herramientas'], " +
              "[data-module='tools'], " +
              "#toolsButton, " +
              "#herramientasBtn, " +
              "#btnHerramientas, " +
              "#openTools, " +
              "#openHerramientas, " +
              ".tools-button, " +
              ".herramientas-button, " +
              ".floating-tools, " +
              ".btn-herramientas"
            )
          : null;

      if (!target) return;

      /*
       * Nunca interceptamos botones que estén dentro
       * de los propios módulos de Herramientas.
       */
      if (
        target.closest(MAIN_ROOT) ||
        target.closest(STUDENT_ROOT)
      ) {
        return;
      }

      /*
       * Si ya tiene un comportamiento explícito para
       * Herramientas educativas, dejamos que la aplicación
       * existente lo gestione.
       */
      const studentMarker =
        target.getAttribute("data-tools-student") === "true" ||
        target.getAttribute("data-tool-student") === "true";

      if (studentMarker) {
        event.preventDefault();
        event.stopPropagation();
        openStudentTools();
        return;
      }

      /*
       * Herramientas principal.
       */
      event.preventDefault();
      event.stopPropagation();

      openMainTools();
    },
    true
  );

  /*
   * Si existe un launcher principal inequívoco,
   * lo conectamos directamente.
   *
   * No usamos stopImmediatePropagation aquí para no
   * destruir otros listeners del aplicativo.
   */
  function bindCanonicalLauncher() {
    const launcher =
      document.querySelector("#rxToolsLauncher");

    if (!launcher || launcher.__roxthalRepairBound) {
      return;
    }

    launcher.__roxthalRepairBound = true;

    launcher.addEventListener(
      "click",
      function () {
        openMainTools();
      },
      false
    );
  }

  /*
   * API auxiliar para enlaces internos.
   */
  window.RoXThalTools.open = openMainTools;

  /*
   * Inicialización segura.
   */
  function init() {
    normalizeToolsState();
    bindCanonicalLauncher();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

  console.info(
    "[RoXThal Repair] Capa consolidada de Herramientas activa."
  );

})();
