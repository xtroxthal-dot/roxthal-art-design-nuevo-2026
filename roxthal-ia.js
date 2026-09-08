/* =========================================================
   RoXThal IA — conexión independiente
   No contiene ninguna clave secreta.
   ========================================================= */

(() => {
  "use strict";

  const FUNCTION_URL =
    "https://hxtzlrsmjwrpqgjgbzyl.supabase.co/functions/v1/roxthal-ia";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_cv6J952zB8hmDtXSHMbtCQ_xGJZHN1J";
  const input = document.getElementById("aiInput");
  const send = document.getElementById("aiSend");
  const messages = document.getElementById("aiMessages");

  if (!input || !send || !messages) {
    console.warn("RoXThal IA: interfaz no encontrada.");
    return;
  }

  function addMessage(text, type) {
    const item = document.createElement("div");

    item.style.padding = "12px 14px";
    item.style.marginBottom = "10px";
    item.style.border = "1px solid #292929";
    item.style.borderRadius = "12px";
    item.style.lineHeight = "1.5";
    item.style.whiteSpace = "pre-wrap";

    if (type === "user") {
      item.style.background = "#f2c400";
      item.style.color = "#080808";
      item.innerHTML = "<strong>Tú</strong><br>" + escapeHTML(text);
    } else {
      item.style.background = "#181818";
      item.style.color = "#f5f5f5";
      item.innerHTML = "<strong>RoXThal IA</strong><br>" + escapeHTML(text);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;

    return item;
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function askAI() {
    const question = input.value.trim();

    if (!question) return;

    addMessage(question, "user");

    input.value = "";
    input.disabled = true;
    send.disabled = true;

    const loading = addMessage("Pensando…", "ai");

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question
        })
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error("La respuesta del servidor no es válida.");
      }

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo conectar con RoXThal IA."
        );
      }

      loading.remove();

      addMessage(
        data.answer || "No recibí una respuesta.",
        "ai"
      );

    } catch (error) {
      loading.remove();

      addMessage(
        "No pude conectar con RoXThal IA.\n\n" +
        "Error: " +
        error.message,
        "ai"
      );

      console.error("RoXThal IA:", error);

    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  }

  send.addEventListener("click", askAI);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      askAI();
    }
  });

})();
