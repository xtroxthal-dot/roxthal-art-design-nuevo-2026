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
/* ============================================================
   ROXTHAL — AISLAMIENTO DEL PROGRESO DEL SORTEO V4
   Evita que un contador local antiguo 10/10 se reutilice
   entre sorteos o versiones de la PWA.
   No modifica Supabase ni elimina participaciones.
   ============================================================ */

(function () {
  "use strict";

  if (window.__ROXTHAL_RAFFLE_STORAGE_V4__) return;
  window.__ROXTHAL_RAFFLE_STORAGE_V4__ = true;

  const LEGACY_KEY = "roxthal_raffle_share_count";
  const RAFFLE_ID_KEY = "roxthal_raffle_share_raffle_id";
  const PREFIX = "roxthal_raffle_share_count_v4:";
  const MIGRATED_KEY = "roxthal_raffle_share_migrated_v4";
  const BACKUP_KEY = "roxthal_raffle_share_legacy_backup_v4";

  let activeRaffleId = null;

  function scopedKey() {
    return activeRaffleId
      ? PREFIX + activeRaffleId
      : null;
  }

  function getScopedCount() {
    const key = scopedKey();
    if (!key) return 0;

    const value = Number(localStorage.getItem(key) || 0);

    return Math.max(0, Math.min(10, value));
  }

  function setScopedCount(value) {
    const key = scopedKey();
    if (!key) return 0;

    const count = Math.max(
      0,
      Math.min(10, Number(value) || 0)
    );

    localStorage.setItem(key, String(count));

    return count;
  }

  function migrateLegacyState() {
    if (localStorage.getItem(MIGRATED_KEY) === "1") {
      return;
    }

    const oldValue = localStorage.getItem(LEGACY_KEY);

    if (oldValue !== null) {
      localStorage.setItem(
        BACKUP_KEY,
        oldValue
      );

      /*
       * Eliminamos solamente el contador global antiguo.
       * No se elimina ningún dato de Supabase.
       */
      localStorage.removeItem(LEGACY_KEY);
    }

    localStorage.setItem(
      MIGRATED_KEY,
      "1"
    );
  }

  function installStorageRedirect() {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.getItem = function (key) {
      if (
        this === localStorage &&
        key === LEGACY_KEY &&
        activeRaffleId
      ) {
        return String(getScopedCount());
      }

      return originalGetItem.call(this, key);
    };

    Storage.prototype.setItem = function (key, value) {
      if (
        this === localStorage &&
        key === LEGACY_KEY &&
        activeRaffleId
      ) {
        setScopedCount(value);
        return;
      }

      return originalSetItem.call(
        this,
        key,
        value
      );
    };

    Storage.prototype.removeItem = function (key) {
      if (
        this === localStorage &&
        key === LEGACY_KEY &&
        activeRaffleId
      ) {
        const scoped = scopedKey();

        if (scoped) {
          originalRemoveItem.call(
            this,
            scoped
          );
        }

        return;
      }

      return originalRemoveItem.call(
        this,
        key
      );
    };
  }

  async function resolveActiveRaffle() {
    try {
      const supabaseUrl =
        window.SUPABASE_URL ||
        window.supabaseUrl ||
        "";

      const supabaseKey =
        window.SUPABASE_ANON_KEY ||
        window.SUPABASE_KEY ||
        window.supabaseAnonKey ||
        "";

      if (!supabaseUrl || !supabaseKey) {
        console.warn(
          "[RoXThal Raffle V4] No se pudo localizar configuración Supabase."
        );
        return;
      }

      const response = await fetch(
        supabaseUrl +
          "/rest/v1/raffles?select=id&active=eq.true&limit=1",
        {
          headers: {
            apikey: supabaseKey,
            Authorization:
              "Bearer " + supabaseKey
          }
        }
      );

      if (!response.ok) {
        console.warn(
          "[RoXThal Raffle V4] No se pudo consultar el sorteo activo."
        );
        return;
      }

      const rows = await response.json();

      if (!Array.isArray(rows) || !rows.length) {
        return;
      }

      const raffleId = rows[0].id;

      if (!raffleId) return;

      activeRaffleId = String(raffleId);

      localStorage.setItem(
        RAFFLE_ID_KEY,
        activeRaffleId
      );

      /*
       * Si existe un contador anterior específico
       * para este sorteo, se conserva.
       * Si no existe, comienza en 0.
       */
      if (
        localStorage.getItem(scopedKey()) === null
      ) {
        localStorage.setItem(
          scopedKey(),
          "0"
        );
      }

      /*
       * Forzamos actualización visual si el módulo
       * ya está cargado.
       */
      if (
        typeof window.renderRaffleShareProgress ===
        "function"
      ) {
        try {
          window.renderRaffleShareProgress(
            getScopedCount()
          );
        } catch (error) {
          console.warn(
            "[RoXThal Raffle V4] No se pudo refrescar visualmente.",
            error
          );
        }
      }

      console.info(
        "[RoXThal Raffle V4] Sorteo activo:",
        activeRaffleId,
        "Progreso:",
        getScopedCount() + "/10"
      );

    } catch (error) {
      console.warn(
        "[RoXThal Raffle V4] Error de sincronización:",
        error
      );
    }
  }

  migrateLegacyState();
  installStorageRedirect();

  /*
   * Esperamos a que la aplicación haya cargado
   * antes de resolver el sorteo activo.
   */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      resolveActiveRaffle,
      { once: true }
    );
  } else {
    resolveActiveRaffle();
  }

})();
})();
/* ============================================================
   ROXTHAL — ELIMINAR SOLO ANALÍTICA DUPLICADA ANTIGUA
   Conserva #roxthalAnalyticsV2.
   No modifica Supabase ni datos.
   ============================================================ */

(function () {
  "use strict";

  if (window.__ROXTHAL_ANALYTICS_DUPLICATE_FIX__) return;
  window.__ROXTHAL_ANALYTICS_DUPLICATE_FIX__ = true;

  function removeOldAnalytics() {
    const oldPanel = document.getElementById(
      "roxthal-visit-analytics"
    );

    if (oldPanel) {
      oldPanel.remove();
      console.info(
        "[RoXThal] Analítica antigua duplicada eliminada."
      );
    }
  }

  function initAnalyticsDuplicateFix() {
    removeOldAnalytics();

    const visits = document.getElementById("visits");

    if (!visits) return;

    const observer = new MutationObserver(function () {
      removeOldAnalytics();
    });

    observer.observe(visits, {
      childList: true,
      subtree: true
    });

    /* Limpiezas de seguridad para contenido
       que pueda aparecer con retraso. */
    setTimeout(removeOldAnalytics, 100);
    setTimeout(removeOldAnalytics, 500);
    setTimeout(removeOldAnalytics, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initAnalyticsDuplicateFix,
      { once: true }
    );
  } else {
    initAnalyticsDuplicateFix();
  }
})();
