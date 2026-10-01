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
/* ============================================================
   RoXThal — REPARACIÓN ADMIN PEDIDOS TIENDA
   Recepción de aceptación + Entregado + Borrar terminado
   AISLADO — no modifica carrito, productos ni aceptación cliente
   ============================================================ */
(function(){

  'use strict';

  if(window.__ROXTHAL_ADMIN_ORDER_ACCEPTANCE_FIX__) return;
  window.__ROXTHAL_ADMIN_ORDER_ACCEPTANCE_FIX__=true;

  const TABLE='roxthal_store_orders';
  const FUNCTION_URL=
    'https://hxtzlrsmjwrpqgjgbzyl.supabase.co/functions/v1/roxthal-store-orders';

  let selectedOrderId=null;
  let lastAccepted={};

  function adminOK(){
    return typeof requireAdmin==='function' &&
           typeof adminUser!=='undefined' &&
           !!adminUser;
  }

  function toast(msg){
    if(typeof window.toast==='function'){
      window.toast(msg);
      return;
    }

    const old=document.getElementById('rxAdminOrderFixToast');
    if(old) old.remove();

    const t=document.createElement('div');
    t.id='rxAdminOrderFixToast';
    t.textContent=msg;

    t.style.cssText=
      'position:fixed;left:50%;bottom:25px;' +
      'transform:translateX(-50%);z-index:999999;' +
      'background:#111;color:#fff;border:2px solid #d4af37;' +
      'padding:15px 18px;border-radius:12px;' +
      'font-weight:800;text-align:center;' +
      'box-shadow:0 10px 35px #000;max-width:92vw;';

    document.body.appendChild(t);

    setTimeout(function(){
      t.remove();
    },5000);
  }

  function currentOrderId(){
    if(selectedOrderId) return selectedOrderId;

    const active=document.querySelector(
      '[data-roxthal-order].active,' +
      '[data-roxthal-order][aria-selected="true"]'
    );

    return active?.dataset?.roxthalOrder || null;
  }

  function refreshOrders(){
    const b=document.getElementById('roxthalStoreOrdersRefresh');

    if(b){
      b.click();
      return;
    }

    const tab=document.querySelector(
      '[data-admin-tab="storeOrders"]'
    );

    if(tab) tab.click();
  }

  async function getOrder(id){
    if(!id || !adminOK()) return null;

    const {data,error}=await db
      .from(TABLE)
      .select('*')
      .eq('id',id)
      .maybeSingle();

    if(error){
      console.warn('RoXThal pedido:',error);
      return null;
    }

    return data||null;
  }

  async function markDelivered(id){
    if(!id) return;

    const order=await getOrder(id);

    if(!order){
      toast('❌ No se encontró el pedido.');
      return;
    }

    if(order.order_status==='delivered'){
      decorate();
      return;
    }

    if(!confirm(
      '¿Marcar este pedido como ENTREGADO?'
    )) return;

    const {error}=await db
      .from(TABLE)
      .update({
        order_status:'delivered',
        updated_at:new Date().toISOString()
      })
      .eq('id',id);

    if(error){
      console.error(error);
      toast('❌ No se pudo marcar como entregado.');
      return;
    }

    toast('✅ Pedido marcado como ENTREGADO.');

    refreshOrders();

    setTimeout(decorate,700);
  }

  async function deleteOrder(id){
    if(!id) return;

    const order=await getOrder(id);

    if(!order){
      toast('❌ No se encontró el pedido.');
      return;
    }

    if(order.order_status!=='delivered'){
      toast(
        '⚠️ Solo se puede borrar un pedido ENTREGADO.'
      );
      return;
    }

    if(!confirm(
      '¿Borrar definitivamente este pedido terminado?'
    )) return;

    try{

      const sessionResult=
        await db.auth.getSession();

      const token=
        sessionResult?.data?.session?.access_token;

      if(!token){
        toast('❌ Sesión de administrador no disponible.');
        return;
      }

      const response=await fetch(FUNCTION_URL,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body:JSON.stringify({
          action:'delete_order',
          order_id:id
        })
      });

      const result=await response.json().catch(()=>({}));

      if(!response.ok){
        throw new Error(
          result?.error ||
          'No se pudo borrar el pedido.'
        );
      }

      selectedOrderId=null;

      toast('🗑️ Pedido terminado eliminado.');

      refreshOrders();

    }catch(error){

      console.error(
        'RoXThal borrar pedido:',
        error
      );

      toast(
        '❌ '+(
          error?.message ||
          'No se pudo borrar el pedido.'
        )
      );
    }
  }

  function decorate(){

    if(!adminOK()) return;

    const detail=
      document.getElementById(
        'roxthalStoreOrderDetail'
      );

    if(!detail) return;

    const id=
      selectedOrderId ||
      currentOrderId();

    if(!id) return;

    getOrder(id).then(function(order){

      if(!order) return;

      selectedOrderId=order.id;

      let banner=
        document.getElementById(
          'rxOrderAcceptanceBanner'
        );

      if(
        order.delivery_method==='shipping' &&
        order.quote_status==='accepted'
      ){

        if(!banner){

          banner=document.createElement('div');

          banner.id=
            'rxOrderAcceptanceBanner';

          banner.style.cssText=
            'margin:12px 0;padding:16px;' +
            'border:2px solid #d4af37;' +
            'border-radius:12px;' +
            'background:#17120a;color:#fff;' +
            'font-weight:800;text-align:center;';

          detail.prepend(banner);
        }

        banner.innerHTML=
          '✅ PRESUPUESTO DE ENVÍO ACEPTADO POR EL CLIENTE';

      }else if(banner){

        banner.remove();
      }

      let actions=
        document.getElementById(
          'rxOrderAdminActions'
        );

      if(!actions){

        actions=document.createElement('div');

        actions.id='rxOrderAdminActions';

        actions.style.cssText=
          'display:flex;gap:10px;flex-wrap:wrap;' +
          'margin-top:15px;';

        detail.appendChild(actions);
      }

      actions.innerHTML='';

      if(order.order_status!=='delivered'){

        const finish=
          document.createElement('button');

        finish.type='button';
        finish.className='btn btn-primary';
        finish.textContent=
          '📦 Marcar como entregado';

        finish.onclick=function(){
          markDelivered(order.id);
        };

        actions.appendChild(finish);

      }else{

        const delivered=
          document.createElement('div');

        delivered.textContent=
          '✅ PEDIDO ENTREGADO';

        delivered.style.cssText=
          'padding:11px 14px;border-radius:9px;' +
          'background:#17351d;color:#fff;' +
          'font-weight:800;';

        actions.appendChild(delivered);

        const del=
          document.createElement('button');

        del.type='button';
        del.className='btn';
        del.textContent=
          '🗑️ Borrar pedido terminado';

        del.style.cssText=
          'border:1px solid #a33;' +
          'background:#210d0d;color:#fff;';

        del.onclick=function(){
          deleteOrder(order.id);
        };

        actions.appendChild(del);
      }

    });
  }

  /* ------------------------------------------------------------
     RECORDAR PEDIDO SELECCIONADO
     ------------------------------------------------------------ */

  document.addEventListener('click',function(e){

    const row=
      e.target.closest('[data-roxthal-order]');

    if(row){

      selectedOrderId=
        row.dataset.roxthalOrder || null;

      setTimeout(decorate,100);
      setTimeout(decorate,500);

      return;
    }

    if(
      e.target.closest(
        '#roxthalStoreOrdersRefresh'
      )
    ){

      setTimeout(decorate,700);
      setTimeout(decorate,1300);
    }

  },true);

  /* ------------------------------------------------------------
     ACTUALIZACIÓN REALTIME
     ------------------------------------------------------------ */

  function startAcceptanceRealtime(){

    if(!adminOK()) return;

    if(window.__ROXTHAL_ADMIN_ORDER_RT_FIX__) return;

    window.__ROXTHAL_ADMIN_ORDER_RT_FIX__=true;

    try{

      db
        .channel(
          'roxthal-admin-order-acceptance-fix'
        )
        .on(
          'postgres_changes',
          {
            event:'UPDATE',
            schema:'public',
            table:TABLE
          },
          function(payload){

            const fresh=payload?.new;

            if(!fresh?.id) return;

            const old=lastAccepted[fresh.id];

            const acceptedNow=
              fresh.delivery_method==='shipping' &&
              fresh.quote_status==='accepted' &&
              fresh.order_status==='confirmed';

            const wasAccepted=
              old?.quote_status==='accepted' &&
              old?.order_status==='confirmed';

            lastAccepted[fresh.id]={
              quote_status:fresh.quote_status,
              order_status:fresh.order_status
            };

            if(
              acceptedNow &&
              !wasAccepted
            ){

              toast(
                '✅ PRESUPUESTO DE ENVÍO ACEPTADO POR EL CLIENTE'
              );

              try{

                if(
                  'Notification' in window &&
                  Notification.permission==='granted'
                ){

                  new Notification(
                    'RoXThal — Presupuesto aceptado',
                    {
                      body:
                        'El cliente aceptó el presupuesto de envío.'
                    }
                  );

                }

              }catch(_){}

              refreshOrders();

              setTimeout(function(){

                selectedOrderId=fresh.id;

                const row=
                  document.querySelector(
                    '[data-roxthal-order="'+
                    CSS.escape(fresh.id)+
                    '"]'
                  );

                if(row) row.click();

                setTimeout(decorate,300);

              },800);

            }else{

              if(
                selectedOrderId===fresh.id
              ){
                setTimeout(decorate,300);
              }

            }

          }
        )
        .subscribe();

    }catch(error){

      console.warn(
        'RoXThal Realtime aceptación:',
        error
      );

    }
  }

  function boot(){

    if(!adminOK()) return;

    startAcceptanceRealtime();

    setTimeout(decorate,800);
  }

  setTimeout(boot,1500);

  if(db?.auth?.onAuthStateChange){

    db.auth.onAuthStateChange(
      function(_event,session){

        if(
          session?.user?.app_metadata?.role==='admin'
        ){

          setTimeout(
            boot,
            500
          );

        }

      }
    );

  }

})();
/* ============================================================
   ROXTHAL — MI ROXTHAL V1
   Portal personal independiente del alumno.
   ============================================================ */
(function(){
  'use strict';

  if(window.__ROXTHAL_MI_ROXTHAL_V1__) return;
  window.__ROXTHAL_MI_ROXTHAL_V1__=true;

  function esc(v){
    return String(v ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function cleanPhone(v){
    return String(v ?? '').replace(/\D/g,'');
  }

  function dateText(v){
    if(!v) return '—';
    const d=new Date(v);
    if(Number.isNaN(d.getTime())) return esc(v);
    return d.toLocaleDateString('es-AR',{
      day:'2-digit',
      month:'2-digit',
      year:'numeric'
    });
  }

  function money(v){
    if(v===null || v===undefined || v==='') return '—';
    const n=Number(v);
    if(!Number.isFinite(n)) return esc(v);
    return new Intl.NumberFormat('es-AR',{
      style:'currency',
      currency:'ARS'
    }).format(n);
  }

  function ensureUI(){
    if(document.getElementById('rxMiRoxthalOverlay')) return;

    const style=document.createElement('style');

    style.textContent=`
      #rxMiRoxthalOverlay{
        display:none;
        position:fixed;
        inset:0;
        z-index:999990;
        background:rgba(0,0,0,.84);
        backdrop-filter:blur(8px);
        overflow:auto;
        padding:10px;
      }

      #rxMiRoxthalOverlay.rx-open{
        display:block;
      }

      #rxMiRoxthalModal{
        width:min(960px,100%);
        margin:10px auto 30px;
        background:#111;
        color:#fff;
        border:1px solid #333;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 25px 90px #000;
      }

      #rxMiRoxthalHead{
        position:sticky;
        top:0;
        z-index:5;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:14px 16px;
        background:#151515ee;
        border-bottom:1px solid #333;
      }

      #rxMiRoxthalHead strong{
        font-size:18px;
      }

      #rxMiRoxthalClose{
        width:42px;
        height:42px;
        border:0;
        border-radius:11px;
        background:#292929;
        color:#fff;
        font-size:23px;
        cursor:pointer;
      }

      #rxMiRoxthalBody{
        padding:16px;
      }

      .rxMiCard{
        background:#181818;
        border:1px solid #303030;
        border-radius:16px;
        padding:16px;
        margin-bottom:12px;
      }

      .rxMiGrid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
      }

      .rxMiStat{
        background:#101010;
        border:1px solid #292929;
        border-radius:13px;
        padding:14px;
      }

      .rxMiStat b{
        display:block;
        font-size:26px;
        color:#ffd400;
      }

      .rxMiMuted{
        color:#999;
        font-size:13px;
      }

      .rxMiRow{
        padding:10px 0;
        border-bottom:1px solid #292929;
      }

      .rxMiRow:last-child{
        border-bottom:0;
      }

      .rxMiActions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:12px;
      }

      .rxMiBtn{
        border:1px solid #3b3b3b;
        border-radius:11px;
        padding:11px 14px;
        background:#252525;
        color:#fff;
        font-weight:800;
        cursor:pointer;
      }

      .rxMiBtn.primary{
        background:#ffd400;
        color:#080808;
        border-color:#ffd400;
      }

      .rxMiBtn.danger{
        background:#551b1b;
        border-color:#773030;
      }

      .rxMiField{
        display:grid;
        gap:6px;
        margin-bottom:12px;
      }

      .rxMiField label{
        font-size:12px;
        color:#aaa;
        font-weight:800;
      }

      .rxMiField input{
        width:100%;
        box-sizing:border-box;
        background:#0b0b0b;
        color:#fff;
        border:1px solid #383838;
        border-radius:10px;
        padding:12px;
        outline:0;
      }

      .rxMiField input:focus{
        border-color:#ffd400;
      }

      .rxMiNotice{
        padding:12px 14px;
        border-radius:11px;
        background:#191919;
        border:1px solid #333;
        color:#bbb;
        font-size:13px;
        line-height:1.5;
      }

      .rxMiNotice.err{
        border-color:#713232;
        color:#ffb2b2;
      }

      .rxMiNotice.ok{
        border-color:#285c3c;
        color:#b4f3c9;
      }

      @media(max-width:650px){
        #rxMiRoxthalOverlay{
          padding:5px;
        }

        #rxMiRoxthalModal{
          border-radius:17px;
        }

        #rxMiRoxthalBody{
          padding:10px;
        }

        .rxMiGrid{
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(style);

    const overlay=document.createElement('div');

    overlay.id='rxMiRoxthalOverlay';
    overlay.setAttribute('aria-hidden','true');

    overlay.innerHTML=`
      <div id="rxMiRoxthalModal"
           role="dialog"
           aria-modal="true">

        <div id="rxMiRoxthalHead">
          <strong>👤 Mi RoXThal</strong>

          <button
            id="rxMiRoxthalClose"
            type="button"
            aria-label="Cerrar">
            ×
          </button>
        </div>

        <div id="rxMiRoxthalBody"></div>

      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById(
      'rxMiRoxthalClose'
    ).onclick=close;

    overlay.addEventListener('click',function(e){
      if(e.target===overlay){
        close();
      }
    });
  }

  function open(){
    ensureUI();

    const overlay=
      document.getElementById(
        'rxMiRoxthalOverlay'
      );

    overlay.classList.add('rx-open');
    overlay.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.style.overflow='hidden';

    renderLogin();
  }

  function close(){
    const overlay=
      document.getElementById(
        'rxMiRoxthalOverlay'
      );

    if(!overlay) return;

    overlay.classList.remove('rx-open');

    overlay.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.style.overflow='';
  }

  function body(){
    return document.getElementById(
      'rxMiRoxthalBody'
    );
  }

  function saved(){
    try{
      const raw=
        localStorage.getItem(
          'roxthal_mi_roxthal_session_v1'
        );

      return raw ? JSON.parse(raw) : null;

    }catch(_){
      return null;
    }
  }

  function save(email,phone){
    try{
      localStorage.setItem(
        'roxthal_mi_roxthal_session_v1',
        JSON.stringify({
          email:email,
          phone:phone
        })
      );
    }catch(_){}
  }

  function clearSaved(){
    try{
      localStorage.removeItem(
        'roxthal_mi_roxthal_session_v1'
      );
    }catch(_){}
  }

  function renderLogin(message='',type=''){

    const s=saved();

    body().innerHTML=`

      <div class="rxMiCard">
        <h2>Tu espacio personal</h2>

        <p class="rxMiMuted">
          Consultá tu ficha de alumno, formación,
          asistencia y pagos desde un único lugar.
        </p>
      </div>

      <div class="rxMiCard">

        <h3>🔐 Acceso de alumno</h3>

        ${
          message
          ?
          `<div class="rxMiNotice ${type}"
                style="margin-bottom:12px">
             ${esc(message)}
           </div>`
          :
          ''
        }

        <form id="rxMiLoginForm">

          <div class="rxMiField">
            <label>
              Correo electrónico
            </label>

            <input
              id="rxMiEmail"
              type="email"
              autocomplete="email"
              required
              value="${esc(s?.email||'')}"
            >
          </div>

          <div class="rxMiField">
            <label>
              Teléfono registrado
            </label>

            <input
              id="rxMiPhone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              required
              value="${esc(s?.phone||'')}"
            >
          </div>

          <div class="rxMiActions">

            <button
              id="rxMiLoginButton"
              class="rxMiBtn primary"
              type="submit">
              Entrar a Mi RoXThal
            </button>

            <button
              id="rxMiAdminButton"
              class="rxMiBtn"
              type="button">
              🛠️ Administrador
            </button>

          </div>

        </form>

      </div>

      <div class="rxMiNotice">
        El acceso comprueba conjuntamente
        el correo y el teléfono registrados.
      </div>
    `;

    document.getElementById(
      'rxMiLoginForm'
    ).onsubmit=login;

    document.getElementById(
      'rxMiAdminButton'
    ).onclick=openAdmin;
  }

  async function login(e){

    e.preventDefault();

    const email=
      String(
        document.getElementById(
          'rxMiEmail'
        ).value||''
      )
      .trim()
      .toLowerCase();

    const phone=
      cleanPhone(
        document.getElementById(
          'rxMiPhone'
        ).value
      );

    if(!email || !phone){

      renderLogin(
        'Correo y teléfono son obligatorios.',
        'err'
      );

      return;
    }

    const button=
      document.getElementById(
        'rxMiLoginButton'
      );

    button.disabled=true;
    button.textContent='Comprobando…';

    try{

      if(
        !window.db ||
        !window.db.functions ||
        typeof window.db.functions.invoke!=='function'
      ){
        throw new Error(
          'La conexión segura de RoXThal no está disponible.'
        );
      }

      const result=
        await window.db.functions.invoke(
          'mi-roxthal-login',
          {
            body:{
              email:email,
              phone:phone
            }
          }
        );

      if(result.error){
        throw new Error(
          result.error.message ||
          'No se pudo comprobar el acceso.'
        );
      }

      if(!result.data?.student){

        throw new Error(
          result.data?.error ||
          'No encontramos una ficha que coincida con ese correo y teléfono.'
        );
      }

      save(email,phone);

      renderDashboard(
        result.data
      );

    }catch(error){

      renderLogin(
        error?.message ||
        'No se pudo acceder a Mi RoXThal.',
        'err'
      );
    }
  }

  function renderDashboard(payload){

    const s=
      payload.student || {};

    const attendance=
      Array.isArray(payload.attendance)
      ? payload.attendance
      : [];

    const payments=
      Array.isArray(payload.payments)
      ? payload.payments
      : [];

    const course=
      payload.course || null;

    const present=
      attendance.filter(
        x=>x.present===true
      ).length;

    const courseName=
      course?.name ||
      s.course ||
      'Sin curso informado';

    body().innerHTML=`

      <div class="rxMiCard">

        <div class="rxMiMuted">
          MI ROXTHAL
        </div>

        <h2>
          Hola, ${esc(s.name||'Alumno')} 👋
        </h2>

        <p class="rxMiMuted">
          ${esc(courseName)}
          · Estado:
          ${esc(s.status||'—')}
        </p>

        <div class="rxMiActions">

          <button
            id="rxMiRefresh"
            class="rxMiBtn"
            type="button">
            🔄 Actualizar
          </button>

          <button
            id="rxMiCardLink"
            class="rxMiBtn"
            type="button">
            🎓 Ver Carné oficial
          </button>

          <button
            id="rxMiLogout"
            class="rxMiBtn danger"
            type="button">
            Cerrar Mi RoXThal
          </button>

        </div>

      </div>

      <div class="rxMiGrid">

        <div class="rxMiStat">
          <b>${attendance.length}</b>
          <span class="rxMiMuted">
            Registros de asistencia
          </span>
        </div>

        <div class="rxMiStat">
          <b>${present}</b>
          <span class="rxMiMuted">
            Presentes
          </span>
        </div>

        <div class="rxMiStat">
          <b>${payments.length}</b>
          <span class="rxMiMuted">
            Pagos registrados
          </span>
        </div>

        <div class="rxMiStat">
          <b>${esc(s.status||'—')}</b>
          <span class="rxMiMuted">
            Estado del alumno
          </span>
        </div>

      </div>

      <div class="rxMiCard">

        <h3>👤 Mis datos</h3>

        <div class="rxMiRow">
          <b>Nombre</b><br>
          <span class="rxMiMuted">
            ${esc(s.name||'—')}
          </span>
        </div>

        <div class="rxMiRow">
          <b>Correo</b><br>
          <span class="rxMiMuted">
            ${esc(s.email||'—')}
          </span>
        </div>

        <div class="rxMiRow">
          <b>Teléfono</b><br>
          <span class="rxMiMuted">
            ${esc(s.phone||'—')}
          </span>
        </div>

        <div class="rxMiRow">
          <b>Inscripción</b><br>
          <span class="rxMiMuted">
            ${dateText(s.enrollment_date)}
          </span>
        </div>

      </div>

      <div class="rxMiCard">

        <h3>🎨 Mi formación</h3>

        <p class="rxMiMuted">
          ${esc(courseName)}
        </p>

        ${
          course
          ?
          `
          <div class="rxMiRow">
            <b>Descripción</b><br>
            <span class="rxMiMuted">
              ${esc(course.description||'—')}
            </span>
          </div>

          <div class="rxMiRow">
            <b>Duración</b><br>
            <span class="rxMiMuted">
              ${esc(course.duration||'—')}
            </span>
          </div>

          <div class="rxMiRow">
            <b>Horario</b><br>
            <span class="rxMiMuted">
              ${esc(course.schedule||'—')}
            </span>
          </div>

          <div class="rxMiRow">
            <b>Modalidad</b><br>
            <span class="rxMiMuted">
              ${esc(course.modality||'—')}
            </span>
          </div>
          `
          :
          ''
        }

      </div>

      <div class="rxMiCard">

        <h3>📅 Mi asistencia</h3>

        ${
          attendance.length
          ?
          attendance.map(x=>`
            <div class="rxMiRow">
              <b>
                ${dateText(x.attendance_date)}
              </b><br>

              <span class="rxMiMuted">
                ${
                  x.present
                  ? '✅ Presente'
                  : '❌ Ausente'
                }

                ${
                  x.notes
                  ? ' · '+esc(x.notes)
                  : ''
                }
              </span>
            </div>
          `).join('')
          :
          `
          <div class="rxMiNotice">
            Sin registros de asistencia.
          </div>
          `
        }

      </div>

      <div class="rxMiCard">

        <h3>💳 Mi estado de pagos</h3>

        ${
          payments.length
          ?
          payments.map(x=>`
            <div class="rxMiRow">

              <b>
                ${dateText(x.payment_date)}
              </b><br>

              <span class="rxMiMuted">
                ${money(
                  x.amount ??
                  x.payment_amount
                )}

                ·

                ${esc(
                  x.status ??
                  x.payment_status ??
                  'Registrado'
                )}

                ${
                  x.notes
                  ? ' · '+esc(x.notes)
                  : ''
                }

              </span>

            </div>
          `).join('')
          :
          `
          <div class="rxMiNotice">
            Sin pagos registrados.
          </div>
          `
        }

      </div>

      <div class="rxMiNotice">
        Tus datos, asistencia y pagos son administrados
        desde RoXThal. Los cambios aparecerán al actualizar.
      </div>
    `;

    document.getElementById(
      'rxMiRefresh'
    ).onclick=loadSaved;

    document.getElementById(
      'rxMiLogout'
    ).onclick=function(){

      clearSaved();

      renderLogin(
        'Sesión cerrada.',
        'ok'
      );
    };

    document.getElementById(
      'rxMiCardLink'
    ).onclick=openOfficialCard;
  }

  async function loadSaved(){

    const s=saved();

    if(!s?.email || !s?.phone){

      renderLogin();

      return;
    }

    try{

      const result=
        await window.db.functions.invoke(
          'mi-roxthal-login',
          {
            body:{
              email:s.email,
              phone:s.phone
            }
          }
        );

      if(
        result.error ||
        !result.data?.student
      ){

        clearSaved();

        renderLogin(
          result.data?.error ||
          result.error?.message ||
          'No encontramos una ficha que coincida con ese correo y teléfono.',
          'err'
        );

        return;
      }

      renderDashboard(
        result.data
      );

    }catch(error){

      renderLogin(
        error?.message ||
        'No se pudo actualizar Mi RoXThal.',
        'err'
      );
    }
  }

  function openOfficialCard(){

    close();

    const consent=
      document.getElementById(
        'rxConsentLauncher'
      );

    if(consent){

      consent.click();

      setTimeout(function(){

        const card=
          document.getElementById(
            'rxStudentCardOpen'
          );

        if(card) card.click();

      },300);

      return;
    }

    if(
      window.RoXThalStudentCard &&
      typeof window.RoXThalStudentCard.open==='function'
    ){

      window.RoXThalStudentCard.open();

      return;
    }

    if(typeof window.toast==='function'){

      window.toast(
        'Abrí Consentimiento profesional para acceder al Carné de Estudiante.'
      );
    }
  }

  function openAdmin(){

    close();

    const admin=
      document.querySelector(
        '[data-go="admin"]'
      );

    if(admin){

      admin.click();

      return;
    }

    const section=
      document.getElementById('admin');

    if(section){

      document.querySelectorAll(
        '.view'
      ).forEach(
        v=>v.classList.add('hidden')
      );

      section.classList.remove('hidden');
    }
  }

  function installButton(){

    if(
      document.getElementById(
        'rxMiRoxthalFab'
      )
    ) return;

    const atelier=
      document.getElementById(
        'rxStudioFab'
      );

    if(!atelier) return;

    const button=
      document.createElement('button');

    button.id='rxMiRoxthalFab';

    button.type='button';

    button.textContent=
      '👤 Mi RoXThal';

    button.setAttribute(
      'aria-label',
      'Abrir Mi RoXThal'
    );

    button.style.cssText=
      'display:inline-flex;' +
      'align-items:center;' +
      'justify-content:center;' +
      'margin:8px 4px 0;' +
      'border:1px solid #ffd400;' +
      'background:#111;' +
      'color:#ffd400;' +
      'border-radius:999px;' +
      'padding:13px 17px;' +
      'font-weight:900;' +
      'box-shadow:0 10px 35px #0008;' +
      'cursor:pointer;' +
      'font-family:inherit;';

    button.onclick=open;

    atelier.insertAdjacentElement(
      'afterend',
      button
    );
  }

  document.addEventListener(
    'keydown',
    function(e){

      if(
        e.key==='Escape' &&
        document
          .getElementById(
            'rxMiRoxthalOverlay'
          )
          ?.classList
          .contains('rx-open')
      ){

        close();
      }

    },
    true
  );

  window.RoXThalMiRoxthal={
    open:open,
    close:close,
    refresh:loadSaved
  };

  function boot(){
    ensureUI();
    installButton();
  }

  if(
    document.readyState==='loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {once:true}
    );

  }else{

    boot();

  }

  const observer=
    new MutationObserver(
      installButton
    );

  observer.observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );

})();
