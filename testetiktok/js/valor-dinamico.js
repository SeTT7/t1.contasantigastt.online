(function () {
  // Gera valor aleatório quebrado entre 700 e 1450
  function gerarValorAleatorio() {
    const inteiro = Math.floor(Math.random() * (1450 - 700 + 1)) + 700;
    const centavos = Math.floor(Math.random() * 99) + 1; // 01 a 99, nunca .00
    return parseFloat(inteiro + "." + centavos.toString().padStart(2, "0"));
  }

  // Formata no padrão brasileiro: 1.322,11
  function formatarBR(valor) {
    return valor
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Salva/lê cookie
  function setCookie(nome, valor, dias) {
    const exp = new Date();
    exp.setTime(exp.getTime() + dias * 24 * 60 * 60 * 1000);
    document.cookie = nome + "=" + valor + ";expires=" + exp.toUTCString() + ";path=/";
  }

  function getCookie(nome) {
    const prefix = nome + "=";
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      c = c.trim();
      if (c.indexOf(prefix) === 0) return c.substring(prefix.length);
    }
    return null;
  }

  // Pega ou cria o valor
  let valorSalvo = getCookie("tiktok_valor");
  if (!valorSalvo) {
    valorSalvo = gerarValorAleatorio().toFixed(2);
    setCookie("tiktok_valor", valorSalvo, 30); // dura 30 dias
  }

  const valor = parseFloat(valorSalvo);
  const valorFormatado = formatarBR(valor);
  const valorStr = "R$ " + valorFormatado;
  const valorStrSemEspaco = "R$" + valorFormatado;

  // Substitui todos os data-amount-target e textos na página
  function aplicarValor() {
    // 1. Atualiza todos os elementos com data-amount-target
    document.querySelectorAll("[data-amount-target]").forEach(function (el) {
      el.setAttribute("data-amount-target", valorSalvo);
    });

    // 2. Atualiza textos estáticos com o valor antigo (R$ 4.596,72 e R$4.596,72)
    const seletores = [
      ".parabens-valor",
      ".confirmation-balance-amount",
      ".display-total",
      ".confirmation-receipt-value.bold",
    ];
    seletores.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.textContent = valorStr;
      });
    });

    // 3. Substitui menções ao valor no texto de descrição da taxa
    document.querySelectorAll(".confirmation-fee-description .bold").forEach(function (el) {
      if (el.textContent.includes("4.596")) {
        el.textContent = valorStr;
      }
    });

    // 4. Substitui no texto do sticky popup (sem data-amount-target)
    document.querySelectorAll(".valor-currency:not([data-amount-target])").forEach(function (el) {
      if (el.textContent.includes("4.596") || el.textContent.includes("4596")) {
        el.textContent = valorStr;
      }
    });

    // 5. Atualiza o botão display-total
    document.querySelectorAll(".display-total").forEach(function (el) {
      el.textContent = valorStrSemEspaco;
    });

    // 6. Texto de liberação no processo (R$ 4.596,72 liberado para saque)
    document.querySelectorAll(".confirmation-requirement-description").forEach(function (el) {
      if (el.textContent.includes("4.596")) {
        el.textContent = valorStr + " liberado para saque";
      }
    });

    // 7. Mensagem de sucesso
    const successMsg = document.getElementById("confirmation-success-message");
    if (successMsg) {
      successMsg.textContent = "✅ Identidade confirmada. Saque de " + valorStr + " liberado.";
    }
  }

  // Roda quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicarValor);
  } else {
    aplicarValor();
  }

  // Expõe o valor globalmente para o animateCurrencyCounter usar
  window.TIKTOK_VALOR = valor;
  window.TIKTOK_VALOR_STR = valorStr;
})();
