/* ============================================================
   Tillageworx — Global Site Script
   Repo: twx26mon/webflow-footer-scripts
   Load via Webflow Site Settings → Custom Code → Before </body>
   OR via an external script tag pointing to the raw GitHub URL.

   Contains:
     1. CSS injection  — injects tillageworx.css at runtime
     2. Quote Cart     — cart state, machine wizard, add-to-quote buttons
     3. Quote Review   — renders cart table + summary on /quote-review
     4. Quote Form     — restructures Webflow form fields (side-by-side rows,
                         delivery address toggle, invoicing address field)
     5. Navbar scroll  — hides navbar on scroll-down, reveals on scroll-up
     6. BROWSE BRANDS  — animated brand filter with live CMS fetch
     
   DOM dependencies (Webflow CMS embeds / elements):
     .wizard-model-item .model-data-payload   — brand/family/variant data
     .config-data-item .config-data-payload   — machine size/qty configs
     .part-data-item .part-data-payload       — part definitions
     .add-to-quote-btn                        — product "Add to Quote" buttons
     #quote-cart                              — slide-in cart panel
     #quote-cart-close-btn                    — close button inside cart
     #cart-clearall                           — clear all button
     #cart-add-parts-btn                      — "browse" CTA inside cart
     #cart-items                              — cart line items container
     #open-quote-cart-btn                     — floating cart open button
     .open-quote-cart / .open-quote-cart-btn  — any element that opens cart
     #qr-parts-container                      — table container on /quote-review
     #qr-summary-container                    — totals block on /quote-review
     #qr-cart-data                            — hidden field (cart payload)
     #qr-empty-msg                            — shown when cart is empty
     #qr-form-section                         — contact form wrapper
     #qr-flex-row / #qr-right-col             — layout containers on /quote-review
     #qr-first-name, #qr-last-name            — name inputs inside form
     #qr-email, #qr-phone                     — contact inputs
     #qr-business                             — business name input
     #qr-address                              — delivery address input
     #qr-submit-btn                           — form submit button (is an <a> tag)
   ============================================================ */

/* ── 1. CSS INJECTION ─────────────────────────────────────── */
(function injectStyles() {
  var css = [
    /* Quote Cart: Qty controls */
    ".qr-qty-controls{display:flex;align-items:center;gap:6px}",
    ".qr-qty-btn{width:28px;height:28px;border:none;background:transparent;border-radius:4px;font-size:18px;font-weight:700;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#c2934a;transition:color 0.15s,transform 0.1s,opacity 0.15s}",
    ".qr-qty-btn:hover{color:#a87a38;opacity:0.85}",
    ".qr-qty-btn:active{transform:scale(0.88);opacity:0.7}",
    ".qr-qty-value{min-width:24px;text-align:center;font-weight:600}",

    /* Quote Cart: Remove button */
    ".qr-remove-btn{display:block;margin:6px auto 0;background:none;border:1px solid #c2934a;color:#c2934a;font-size:10px;font-weight:700;letter-spacing:0.08em;cursor:pointer;padding:3px 7px;border-radius:3px;transition:color 0.15s,background 0.15s,opacity 0.15s;line-height:1.4;white-space:nowrap}",
    ".qr-remove-btn:hover{background:#c2934a;color:#1a1a1a;opacity:1}",
    ".qr-remove-btn:active{opacity:0.7}",
    "#cart-clearall{color:#c2934a!important;font-size:13px!important;font-weight:700!important;letter-spacing:0.08em!important;text-align:right!important;display:block!important;width:100%!important;padding:10px 16px!important;cursor:pointer!important;background:none!important;border:none!important;}",

    /* Quote Cart: Browse button */
    ".qr-browse-row{margin-top:16px}",
    ".qr-browse-btn{display:inline-block;padding:10px 20px;background:transparent;border:none;color:#c2934a;font-size:14px;font-weight:700;text-decoration:none;transition:color 0.15s,transform 0.1s,opacity 0.15s;cursor:pointer}",
    ".qr-browse-btn:hover{color:#a87a38;opacity:0.85}",
    ".qr-browse-btn:active{transform:scale(0.97);opacity:0.7}",

    /* Quote Review Form: Inputs */
    "#qr-form-section .w-form{width:100%}",
    "#qr-form-section .form-input,#qr-form-section input[type=text],#qr-form-section input[type=email],#qr-form-section input[type=tel],#qr-form-section textarea,#qr-form-section select{width:100%;box-sizing:border-box;background:#1a1a1a;color:#fff;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.4;transition:border-color 0.2s,box-shadow 0.2s;appearance:none;-webkit-appearance:none;margin-bottom:12px}",
    "#qr-form-section .form-input::placeholder,#qr-form-section input::placeholder,#qr-form-section textarea::placeholder{color:#666}",
    "#qr-form-section .form-input:focus,#qr-form-section input:focus,#qr-form-section textarea:focus,#qr-form-section select:focus{outline:none;border-color:#c2934a;box-shadow:0 0 0 3px rgba(194,147,74,0.15)}",
    "#qr-form-section label{display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;margin-bottom:5px;margin-top:4px}",
    "#qr-form-section textarea{min-height:100px;resize:vertical}",
    "#qr-form-section select{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c2934a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;color:#fff}",
    "#qr-form-section select option{background:#1a1a1a;color:#fff}",
    "#qr-form-section .w-checkbox{display:flex;align-items:flex-start;gap:10px;margin-top:8px}",
    "#qr-form-section .w-checkbox input[type=checkbox]{margin-top:2px;accent-color:#c2934a;width:16px;height:16px;flex-shrink:0}",

    /* Side-by-side field rows */
    ".qr-name-row,.qr-contact-row,.qr-delivery-row{display:flex!important;gap:16px!important;width:100%!important}",
    ".qr-name-row>*,.qr-contact-row>*,.qr-delivery-row>*{flex:1 1 0%!important;min-width:0!important;width:0!important}",
    ".qr-name-row>*>*,.qr-contact-row>*>*,.qr-name-row input,.qr-name-row .w-input,.qr-name-row .input-container,.qr-name-row .form-field-wrapper{width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}",

    /* Delivery address toggle */
    ".qr-same-address-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;margin-top:-4px}",
    ".qr-same-address-row label{font-size:12px;font-weight:600;color:#aaa;text-transform:none;letter-spacing:0;margin:0;cursor:pointer}",
    ".qr-same-address-row input[type=checkbox]{accent-color:#c2934a;width:15px;height:15px;cursor:pointer;flex-shrink:0}",
    ".qr-delivery-input-wrapper{display:none;margin-top:16px}",
    ".qr-delivery-input-wrapper.visible{display:block}",
    '#qr-address~label,label[for="qr-address"]{display:none!important}',

    /* Form heading */
    "#qr-form-section h3.qr-form-heading{font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c2934a;border-bottom:1px solid #2a2a2a;padding-bottom:12px;margin-bottom:20px}",

    /* Submit button */
    "#qr-submit-btn{width:100%!important;background:linear-gradient(135deg,#b8833e 0%,#d4a55c 40%,#e8b86d 60%,#c2934a 100%)!important;background-size:200% auto!important;color:#111!important;font-size:14px!important;font-weight:800!important;letter-spacing:0.12em!important;text-transform:uppercase!important;border:none!important;border-radius:8px!important;padding:18px 24px!important;cursor:pointer!important;margin-top:16px!important;transition:background-position 0.4s,transform 0.15s,box-shadow 0.2s!important;box-shadow:0 4px 20px rgba(194,147,74,0.4),inset 0 1px 0 rgba(255,255,255,0.15)!important}",
    "#qr-submit-btn:hover{background-position:right center!important;box-shadow:0 6px 28px rgba(194,147,74,0.55),inset 0 1px 0 rgba(255,255,255,0.2)!important;transform:translateY(-1px)!important}",
    "#qr-submit-btn:active{transform:scale(0.98) translateY(0)!important;box-shadow:0 2px 8px rgba(194,147,74,0.3)!important}",

    /* Freight disclaimer */
    ".qr-freight-disclaimer{margin-top:16px;padding:16px 20px;background:rgba(255,255,255,0.06);border-left:3px solid #c2934a;border-radius:0 6px 6px 0;color:#bbb;font-size:13px;line-height:1.7}",
    ".qr-freight-disclaimer .qr-freight-phone{display:inline-block;margin-top:10px;font-weight:700;color:#c2934a;font-size:13px;letter-spacing:0.03em}",

    /* Parts container */
    "#qr-parts-container{padding-top:8px}",

    /* Quote/Order review table */
    ".qr-parts-table{width:100%;border-collapse:collapse;font-size:14px}",
    ".qr-parts-table th{text-align:left;padding:10px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;border-bottom:1px solid #2a2a2a}",
    ".qr-parts-table td{padding:14px 12px;border-bottom:1px solid #1a1a1a;vertical-align:middle;color:#fff}",
    ".qr-item-img{width:56px;height:56px;object-fit:contain;background:transparent;border-radius:4px;margin-bottom:6px;display:block}",
    ".qr-item-name{font-weight:600;font-size:14px;line-height:1.3}",
    ".qr-item-code{font-size:11px;color:#888;margin-top:2px;letter-spacing:0.04em}",
    ".qr-summary-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:14px;color:#ccc}",
    ".qr-summary-total{font-weight:700;font-size:16px;color:#fff;border-bottom:none;padding-top:14px}",
    ".qr-summary-note{font-size:12px;color:#888;margin-top:8px;font-style:italic}",

    /* Mobile: quote-review stacks vertically */
    "@media(max-width:767px){",
    "#qr-flex-row{flex-direction:column!important;gap:24px!important}",
    "#qr-right-col{width:100%!important;flex:none!important}",
    "#qr-form-section{width:100%!important;flex:none!important}",
    ".qr-parts-table th:nth-child(2),.qr-parts-table td:nth-child(2){display:none}",
    ".qr-parts-table{font-size:12px}",
    ".qr-parts-table td,.qr-parts-table th{padding:10px 6px}",
    ".qr-item-img{width:36px!important;height:36px!important;margin-right:8px!important}",
    ".qr-qty-controls{gap:4px}",
    ".qr-qty-btn{width:22px;height:22px;font-size:15px}",
    ".qr-name-row,.qr-contact-row,.qr-delivery-row{flex-direction:column!important;gap:0!important}",
    ".qr-name-row>*,.qr-contact-row>*,.qr-delivery-row>*{flex:none!important;width:100%!important}",
    "}",

    /* Partner cards — always visible, responsive grid */
    ".partner-grid{display:flex!important;flex-wrap:wrap!important;gap:16px!important;justify-content:center!important}",
    ".partner-card-link{display:block!important;visibility:visible!important;opacity:1!important;width:auto!important;flex:1 1 180px!important;max-width:280px!important}",
    "@media(max-width:767px){.partner-grid{gap:16px!important}.partner-card-link{width:100%!important;max-width:none!important}}",

    "/* --- Global Product Card Styles --- */",
    ".twx-card{background:#0e0e0e;border:1px solid #1c1c1c;border-radius:4px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;position:relative;transition:all .3s ease;height:100%}",
    ".twx-card:hover{border-color:#c2934a;transform:translateY(-4px);box-shadow:0 12px 36px rgba(194,147,74,.14)}",
    ".twx-img{width:100%;aspect-ratio:1/1;object-fit:contain;background:#080808;padding:14px;box-sizing:border-box;display:block}",
    ".twx-body{padding:12px 14px 14px;background:#141414;display:flex;flex-direction:column;flex-grow:1}",
    ".twx-code{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2px;color:#c2934a;text-transform:uppercase;margin-bottom:4px}",
    ".twx-name{font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:#fff;line-height:1.25;margin-bottom:5px;text-decoration:none}",
    ".twx-fit{font-size:12px;color:rgba(255,255,255,.38);margin-bottom:8px}",
    ".twx-price{font-family:Oswald,sans-serif;font-size:18px;font-weight:700;color:#c2934a;margin-top:auto;padding-top:10px}",
    ".twx-stk{display:inline-block;font-size:10px;letter-spacing:1px;padding:2px 8px;border-radius:2px;margin-top:6px;align-self:flex-start}",
    ".twx-ins{background:rgba(80,180,80,.1);color:#5db85d;border:1px solid rgba(80,180,80,.2)}",
    ".twx-ord{background:rgba(255,255,255,.06);color:#999;border:1px solid rgba(255,255,255,.15)}",
    ".twx-card-add-btn{position:absolute;bottom:14px;right:14px;width:48px;height:48px;background:rgba(194,147,74,0.9);color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;z-index:5;opacity:0;transform:scale(.8);}",
    ".twx-card:hover .twx-card-add-btn{opacity:1;transform:scale(1)}",
    ".twx-card-add-btn:hover{transform:scale(1.1)!important;background:#c2934a}",
    ".twx-card-add-btn svg{width:24px;height:24px;stroke-width:2.2}",
  ].join("\n");

  var style = document.createElement("style");
  style.id = "twx-global-styles";
  style.textContent = css;
  document.head.appendChild(style);
})();

/* ── 2. ORDER CART + MACHINE WIZARD ──────────────────────── */
(function () {
  "use strict";

  const CONFIG = {
    CART_KEY: "tillageworx_quote_cart",
    DEBUG: false,
    DEBOUNCE_DELAY: 300,
    MAX_CART_ITEMS: 999,
  };

  const state = {
    cart: [],
    wizState: {
      brand: null,
      family: null,
      variant: null,
      size: null,
      filter: null,
    },
    dataLoaded: false,
    saveTimer: null,
  };

  const data = { modelMenu: [], configs: [], parts: [] };

  const indexes = {
    partsById: new Map(),
    partsByName: new Map(),
    configsByModel: new Map(),
    familiesByBrand: new Map(),
    variantsByFamily: new Map(),
    sizesByModel: new Map(),
  };

  const DOM = {};

  function cacheDOM() {
    DOM.cart = document.getElementById("quote-cart");
    DOM.closeBtn = document.getElementById("quote-cart-close-btn");
    DOM.clearBtn = document.getElementById("cart-clearall");
    DOM.browseBtn = document.getElementById("cart-add-parts-btn");
    DOM.cartItems = document.getElementById("cart-items");
    DOM.addBox = document.getElementById("cart-add-parts-box");
    DOM.wizContainer = document.getElementById("machine-wizard-container");
    DOM.breadcrumbs = document.getElementById("wiz-breadcrumbs");
    DOM.activeStep = document.getElementById("wiz-active-step");
    DOM.openBtns = document.querySelectorAll(
      ".open-quote-cart, .open-quote-cart-btn, #open-quote-cart-btn, .quote-main-btn",
    );
  }

  function log(...args) {
    if (CONFIG.DEBUG) console.log("[Tillageworx]", ...args);
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function getUniqueSorted(set) {
    return Array.from(set).filter(Boolean).sort();
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /* ── Data loading from Webflow CMS embeds ── */
  function loadCMSData() {
    data.modelMenu = [];
    data.configs = [];
    data.parts = [];

    indexes.partsById.clear();
    indexes.partsByName.clear();
    indexes.configsByModel.clear();
    indexes.familiesByBrand.clear();
    indexes.variantsByFamily.clear();
    indexes.sizesByModel.clear();

    // Model menu — elements with class .wizard-model-item containing .model-data-payload
    document
      .querySelectorAll(".wizard-model-item .model-data-payload")
      .forEach((item) => {
        const model = {
          brand: (item.dataset.brand || "").trim(),
          family: (item.dataset.family || "").trim(),
          variant: (item.dataset.variant || "").trim(),
          fullName: (item.dataset.name || "").trim(),
        };
        data.modelMenu.push(model);

        if (!indexes.familiesByBrand.has(model.brand))
          indexes.familiesByBrand.set(model.brand, new Set());
        indexes.familiesByBrand.get(model.brand).add(model.family);

        const familyKey = `${model.brand}|${model.family}`;
        if (!indexes.variantsByFamily.has(familyKey))
          indexes.variantsByFamily.set(familyKey, new Set());
        indexes.variantsByFamily.get(familyKey).add(model.variant);
      });

    // Config data — elements with class .config-data-item containing .config-data-payload
    document
      .querySelectorAll(".config-data-item .config-data-payload")
      .forEach((item) => {
        const config = {
          modelName: (item.dataset.modelName || "").trim(),
          size: (item.dataset.size || "").trim(),
          qtyDisc: parseInt(item.dataset.qtyDisc) || 0,
          qtyPoint: parseInt(item.dataset.qtyPoint) || 0,
        };
        data.configs.push(config);

        if (!indexes.configsByModel.has(config.modelName))
          indexes.configsByModel.set(config.modelName, []);
        indexes.configsByModel.get(config.modelName).push(config);

        if (!indexes.sizesByModel.has(config.modelName))
          indexes.sizesByModel.set(config.modelName, new Set());
        indexes.sizesByModel.get(config.modelName).add(config.size);
      });

    // Price lookup from .add-to-quote-btn elements
    const btnPriceById = new Map();
    const btnPriceByName = new Map();
    document.querySelectorAll(".add-to-quote-btn").forEach((btn) => {
      const price = (btn.dataset.price || "").trim();
      const code = (btn.dataset.code || "").trim();
      const id = (btn.dataset.id || "").trim();
      const name = (btn.dataset.name || "").trim().toLowerCase();
      if (id) btnPriceById.set(id, { price, code });
      if (name) btnPriceByName.set(name, { price, code });
    });

    // Parts — elements with class .part-data-item containing .part-data-payload
    document.querySelectorAll(".part-data-item").forEach((item) => {
      const payload = item.querySelector(".part-data-payload");
      if (!payload) return;

      const partId = (payload.dataset.id || "").trim();
      const partName = (payload.dataset.name || "").trim().toLowerCase();
      const btnData =
        btnPriceById.get(partId) || btnPriceByName.get(partName) || {};

      const payloadPrice = (payload.dataset.price || "").trim();
      const payloadCode = (payload.dataset.code || "").trim();
      const domPrice = (
        item.querySelector(".part-data-price")?.textContent || ""
      ).trim();
      const domCode = (
        item.querySelector(".part-data-code")?.textContent || ""
      ).trim();

      const part = {
        name: (payload.dataset.name || "").trim(),
        id: partId,
        type: (payload.dataset.type || "").trim(),
        image: (payload.dataset.image || "").trim(),
        price: payloadPrice || domPrice || btnData.price || "",
        code: payloadCode || domCode || btnData.code || "",
        models: Array.from(item.querySelectorAll(".part-model-ref"))
          .map((span) => span.textContent.trim())
          .filter(Boolean),
      };

      data.parts.push(part);
      indexes.partsById.set(part.id, part);
      indexes.partsByName.set(part.name.toLowerCase(), part);
    });

    state.dataLoaded = true;
  }

  /* ── Cart persistence ── */
  function loadCart() {
    try {
      const stored = localStorage.getItem(CONFIG.CART_KEY);
      state.cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
      state.cart = [];
    }
  }

  const saveCart = debounce(() => {
    try {
      localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(state.cart));
    } catch (e) {
      log("Error saving cart:", e);
    }
  }, CONFIG.DEBOUNCE_DELAY);

  /* ── Cart mutations ── */
  function addPartToCart(partData, showMessage = true) {
    const existingIndex = state.cart.findIndex((i) => i.id === partData.id);
    let wasUpdated = false;

    if (existingIndex >= 0) {
      const existing = state.cart[existingIndex];
      const oldQty = existing.qty;
      existing.qty = Math.min(
        CONFIG.MAX_CART_ITEMS,
        parseInt(partData.qty) || 1,
      );

      if (!existing.price && partData.price) existing.price = partData.price;
      if (
        (!existing.code || existing.code === existing.id) &&
        partData.code &&
        partData.code !== partData.id
      ) {
        existing.code = partData.code;
      }

      if (
        partData.machineContext &&
        existing.machineContext &&
        !existing.machineContext.includes(partData.machineContext)
      ) {
        existing.machineContext += ", " + partData.machineContext;
      } else if (partData.machineContext && !existing.machineContext) {
        existing.machineContext = partData.machineContext;
      }

      wasUpdated = existing.qty !== oldQty;
    } else {
      state.cart.push({
        id: partData.id,
        name: partData.name,
        code: partData.code || partData.id,
        image: partData.image || "",
        price: partData.price || "",
        qty: Math.min(CONFIG.MAX_CART_ITEMS, parseInt(partData.qty) || 1),
        machineContext: partData.machineContext || "",
      });
    }

    saveCart();
    renderCart();

    if (showMessage && wasUpdated && DOM.activeStep) {
      showUpdateMessage(`Updated quantity for ${partData.name}`);
    }

    return wasUpdated;
  }

  function showUpdateMessage(message) {
    if (!DOM.activeStep) return;
    const existingMsg = DOM.activeStep.querySelector(".wiz-update-message");
    if (existingMsg) existingMsg.remove();

    const msg = document.createElement("div");
    msg.className = "wiz-update-message";
    msg.style.cssText =
      "color:#4caf50;font-size:0.85rem;margin-bottom:10px;padding:8px;background:rgba(76,175,80,0.15);border-radius:4px;border-left:3px solid #4caf50;";
    msg.textContent = message;
    DOM.activeStep.insertBefore(msg, DOM.activeStep.firstChild);

    setTimeout(() => {
      msg.style.opacity = "0";
      msg.style.transition = "opacity 0.5s";
      setTimeout(() => msg.remove(), 500);
    }, 3000);
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
    if (state.wizState.size) finishWizard();
  }

  function updateCartQuantity(id, deltaOrValue) {
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;

    if (typeof deltaOrValue === "number" && Math.abs(deltaOrValue) < 100) {
      item.qty = Math.max(
        1,
        Math.min(CONFIG.MAX_CART_ITEMS, item.qty + deltaOrValue),
      );
    } else {
      item.qty = Math.max(
        1,
        Math.min(CONFIG.MAX_CART_ITEMS, parseInt(deltaOrValue) || 1),
      );
    }

    saveCart();
    renderCart();
  }

  function clearCart() {
    state.cart = [];
    saveCart();
    renderCart();
    if (state.wizState.size) finishWizard();
  }

  /* ── Cart render ── */
  function renderCart() {
    if (!DOM.cartItems) return;

    const hasItems = state.cart.length > 0;
    DOM.cartItems.style.display = hasItems ? "block" : "none";
    if (DOM.clearBtn) DOM.clearBtn.style.display = hasItems ? "block" : "none";

    if (!hasItems) {
      DOM.cartItems.innerHTML = "";
      const existing = document.getElementById("cart-pricing-summary");
      if (existing) existing.remove();
      const existingBtn = document.getElementById("cart-proceed-btn");
      if (existingBtn) existingBtn.remove();
      updateButtons();
      return;
    }

    const fragment = document.createDocumentFragment();

    function parsePrice(str) {
      if (!str) return null;
      const n = parseFloat(String(str).replace(/[^0-9.]/g, ""));
      return isNaN(n) ? null : n;
    }

    let subtotal = 0;
    let allPriced = true;

    state.cart.forEach((item) => {
      const div = document.createElement("div");
      div.className = "quote-cart-item";
      div.dataset.id = item.id;

      const safeQty = Math.max(
        1,
        Math.min(CONFIG.MAX_CART_ITEMS, item.qty || 1),
      );
      const unitPrice = parsePrice(item.price);
      const lineTotal = unitPrice !== null ? unitPrice * safeQty : null;

      if (lineTotal !== null) {
        subtotal += lineTotal;
      } else {
        allPriced = false;
      }

      const priceHtml =
        unitPrice !== null
          ? `<div class="cart-item-pricing">
             <span class="cart-item-unit-price">$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea</span>
             <span class="cart-item-line-total">$${lineTotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>`
          : `<div class="cart-item-pricing"><span class="cart-item-no-price">Price on request</span></div>`;

      div.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-right:8px;flex-shrink:0;">` : ""}
        <div style="flex:1;min-width:0;">
          <span class="cart-item-title">${escapeHtml(item.name)}</span>
          ${item.machineContext ? `<div style="font-size:0.75rem;color:#aaa;margin-top:2px;line-height:1.2;">For: ${escapeHtml(item.machineContext)}</div>` : ""}
          ${priceHtml}
        </div>
        <div class="qty-stepper">
          <button type="button" data-action="decrease" aria-label="Decrease quantity">−</button>
          <input type="number" min="1" max="${CONFIG.MAX_CART_ITEMS}" value="${safeQty}"
                 class="quote-cart-item-qty" aria-label="Quantity" data-id="${item.id}">
          <button type="button" data-action="increase" aria-label="Increase quantity">+</button>
        </div>
        <span class="cart-trash" title="Remove item" role="button" tabindex="0" aria-label="Remove item">🗑️</span>
      `;

      fragment.appendChild(div);
    });

    DOM.cartItems.innerHTML = "";
    DOM.cartItems.appendChild(fragment);

    let summary = document.getElementById("cart-pricing-summary");
    if (!summary) {
      summary = document.createElement("div");
      summary.id = "cart-pricing-summary";
      const ref = DOM.clearBtn ? DOM.clearBtn.nextSibling : null;
      DOM.cartItems.parentNode.insertBefore(summary, ref);
    }

    if (allPriced && subtotal > 0) {
      const gst = subtotal * 0.1,
        total = subtotal + gst;
      summary.innerHTML = `
        <div class="cart-summary-row"><span>Subtotal</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      `;
    } else if (!allPriced && subtotal > 0) {
      const gst = subtotal * 0.1,
        total = subtotal + gst;
      summary.innerHTML = `
        <div class="cart-summary-row"><span>Subtotal (priced items)</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-note">Some items are price on request — full pricing on next step.</div>
      `;
    } else {
      summary.innerHTML = `<div class="cart-summary-note">Pricing will be confirmed on the next step.</div>`;
    }

    let proceedBtn = document.getElementById("cart-proceed-btn");
    if (!proceedBtn) {
      proceedBtn = document.createElement("a");
      proceedBtn.id = "cart-proceed-btn";
      proceedBtn.textContent = "PROCEED TO ORDER →";
      summary.parentNode.insertBefore(proceedBtn, summary.nextSibling);
    }
    proceedBtn.href = "/quote-review";

    updateButtons();
  }

  /* ── Machine Wizard ── */
  function initWizard() {
    if (!DOM.addBox || DOM.wizContainer) return;

    if (DOM.browseBtn) {
      DOM.browseBtn.textContent = "BROWSE ALL BRANDS";
      DOM.browseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/browse-brands";
      });
    }

    const header = document.createElement("div");
    header.className = "wizard-main-header";
    header.textContent = "Find parts for my machine";
    DOM.addBox.insertBefore(header, DOM.browseBtn?.nextSibling);

    const wizContainer = document.createElement("div");
    wizContainer.id = "machine-wizard-container";
    wizContainer.innerHTML = `<div id="wiz-breadcrumbs"></div><div id="wiz-active-step"></div>`;
    DOM.addBox.insertBefore(wizContainer, header.nextSibling);

    DOM.wizContainer = wizContainer;
    DOM.breadcrumbs = document.getElementById("wiz-breadcrumbs");
    DOM.activeStep = document.getElementById("wiz-active-step");

    const quoteHeader = document.createElement("div");
    quoteHeader.className = "cart-section-header";
    quoteHeader.textContent = "Your Order";
    const contentArea = document.querySelector(".quote-cart-content");
    if (contentArea && DOM.cartItems)
      contentArea.insertBefore(quoteHeader, DOM.cartItems);

    renderWizard();
  }

  function resetWizard() {
    state.wizState = {
      brand: null,
      family: null,
      variant: null,
      size: null,
      filter: null,
    };
    renderWizard();
  }

  function goBackFrom(step) {
    if (step === "brand")
      state.wizState = {
        brand: null,
        family: null,
        variant: null,
        size: null,
        filter: null,
      };
    else if (step === "family") {
      state.wizState.family = null;
      state.wizState.variant = null;
      state.wizState.size = null;
    } else if (step === "variant") {
      state.wizState.variant = null;
      state.wizState.size = null;
    }
    renderWizard();
  }

  function selectOption(step, value) {
    state.wizState[step] = value;
    renderWizard();
  }

  function renderWizard() {
    if (!DOM.breadcrumbs || !DOM.activeStep) return;
    renderBreadcrumbs();

    let activeStep = null;
    if (!state.wizState.brand) activeStep = "brand";
    else if (!state.wizState.family) activeStep = "family";
    else if (state.wizState.variant === null) activeStep = "variant";
    else if (!state.wizState.size) activeStep = "size";

    if (!activeStep) {
      finishWizard();
      return;
    }
    renderActiveStep(activeStep);
  }

  function renderBreadcrumbs() {
    DOM.breadcrumbs.innerHTML = "";
    ["brand", "family", "variant"].forEach((step) => {
      const value = state.wizState[step];
      if (value && value !== "") {
        const pill = document.createElement("div");
        pill.className = "wiz-pill breadcrumb";
        pill.dataset.step = step;
        pill.innerHTML = `${escapeHtml(value)} <span class="wiz-pill-close" aria-label="Remove">✕</span>`;
        DOM.breadcrumbs.appendChild(pill);
      }
    });
  }

  function renderActiveStep(step) {
    DOM.activeStep.innerHTML = "";
    let options = [],
      titleText = "";

    switch (step) {
      case "brand": {
        options = getUniqueSorted(indexes.familiesByBrand.keys());
        titleText = "Select Brand";
        break;
      }
      case "family": {
        const families =
          indexes.familiesByBrand.get(state.wizState.brand) || new Set();
        options = getUniqueSorted(families);
        if (state.wizState.filter?.families)
          options = options.filter((f) =>
            state.wizState.filter.families.includes(f),
          );
        titleText = "Select Machine";
        break;
      }
      case "variant": {
        const familyKey = `${state.wizState.brand}|${state.wizState.family}`;
        const variants = indexes.variantsByFamily.get(familyKey) || new Set();
        options = getUniqueSorted(variants).filter((v) => v);
        if (options.length === 0) {
          state.wizState.variant = "";
          renderWizard();
          return;
        }
        if (state.wizState.filter?.variants)
          options = options.filter((v) =>
            state.wizState.filter.variants.includes(v),
          );
        titleText = "Select Model Type";
        break;
      }
      case "size": {
        const activeModel = data.modelMenu.find(
          (d) =>
            d.brand === state.wizState.brand &&
            d.family === state.wizState.family &&
            (d.variant || "") === (state.wizState.variant || ""),
        );
        if (activeModel) {
          const sizes =
            indexes.sizesByModel.get(activeModel.fullName) || new Set();
          options = getUniqueSorted(sizes);
        }
        titleText = "Select Working Width";
        break;
      }
    }

    if (options.length === 0 && step !== "size") {
      DOM.activeStep.innerHTML =
        '<div style="color:#888;font-size:0.9em;">No options available.</div>';
      return;
    }

    const title = document.createElement("div");
    title.className = "wizard-step-title";
    title.textContent = titleText;
    DOM.activeStep.appendChild(title);

    const pillsDiv = document.createElement("div");
    pillsDiv.className = "wizard-pills";
    options.forEach((opt) => {
      const pill = document.createElement("div");
      pill.className = "wiz-pill";
      pill.dataset.value = opt;
      pill.textContent = opt;
      pillsDiv.appendChild(pill);
    });
    DOM.activeStep.appendChild(pillsDiv);
  }

  function finishWizard() {
    if (!DOM.activeStep) return;
    DOM.activeStep.innerHTML = "";

    const activeModel = data.modelMenu.find(
      (d) =>
        d.brand === state.wizState.brand &&
        d.family === state.wizState.family &&
        (d.variant || "").trim() === (state.wizState.variant || "").trim(),
    );
    if (!activeModel) {
      DOM.activeStep.innerHTML =
        '<div style="color:#ff5a5f;">Model definition not found.</div>';
      return;
    }

    const configs = indexes.configsByModel.get(activeModel.fullName) || [];
    const config = configs.find(
      (c) => c.size.trim() === state.wizState.size.trim(),
    );
    if (!config) {
      DOM.activeStep.innerHTML =
        '<div style="color:#ff5a5f;">Configuration not found for this size.</div>';
      return;
    }

    const matchingParts = data.parts.filter((p) =>
      p.models.includes(activeModel.fullName),
    );
    if (matchingParts.length === 0) {
      DOM.activeStep.innerHTML =
        '<div style="color:#888;">No parts found for this model.</div>';
      return;
    }

    const header = document.createElement("div");
    header.className = "wizard-step-title";
    header.textContent = `Order Parts for ${activeModel.fullName} ${config.size}`;
    DOM.activeStep.appendChild(header);

    const machineContextStr =
      `${activeModel.brand} ${activeModel.family} ${activeModel.variant || ""} ${config.size}`.trim();

    const disclaimer = document.createElement("div");
    disclaimer.className = "wiz-disclaimer";
    disclaimer.innerHTML =
      "ℹ️ Quantities shown are based on standard OEM machine configurations. Please verify quantities required for your specific machine setup.";
    DOM.activeStep.appendChild(disclaimer);

    const addAllBtn = document.createElement("button");
    addAllBtn.className = "wiz-add-all-btn";
    addAllBtn.textContent = "Add All Items to Order";
    addAllBtn.addEventListener("click", () =>
      addAllPartsToCart(matchingParts, config, machineContextStr),
    );
    DOM.activeStep.appendChild(addAllBtn);

    const listDiv = document.createElement("div");
    listDiv.className = "wiz-results-list";
    let visibleCount = 0;
    const fragment = document.createDocumentFragment();

    matchingParts.forEach((part) => {
      let qtyToAdd = 0;
      if (part.type === "Disc") qtyToAdd = config.qtyDisc;
      else if (part.type === "Point") qtyToAdd = config.qtyPoint;
      else if (part.type === "Hardware") qtyToAdd = config.qtyDisc;
      if (qtyToAdd <= 0) return;

      const inCart = state.cart.find((item) => item.id === part.id);
      if (inCart) return;
      const currentQty = inCart ? inCart.qty : 0;

      visibleCount++;
      const row = document.createElement("div");
      row.className = "wiz-result-item";
      row.dataset.partId = part.id;
      const btnText = inCart ? "Update" : "Add to Order";
      const btnClass = inCart ? "wiz-add-btn wiz-update-btn" : "wiz-add-btn";

      row.innerHTML = `
        ${part.image ? `<img src="${part.image}" class="wiz-result-img" alt="">` : ""}
        <div class="wiz-result-info">
          <span class="wiz-result-name">${escapeHtml(part.name)}</span>
          <div style="font-size:0.7em;color:#888;">Compatible with: ${escapeHtml(activeModel.fullName)}</div>
          ${inCart ? `<div style="font-size:0.7em;color:#4caf50;font-weight:bold;">✓ In cart: ${currentQty}</div>` : ""}
          <div class="wiz-result-actions">
            <input type="number" class="wiz-result-qty" value="${qtyToAdd}" min="1" aria-label="Quantity">
            <button type="button" class="${btnClass}">${btnText}</button>
          </div>
        </div>
      `;
      fragment.appendChild(row);
    });

    listDiv.appendChild(fragment);
    if (visibleCount === 0)
      listDiv.innerHTML =
        '<div style="color:#888;text-align:center;padding:10px;">All parts added to order!</div>';
    DOM.activeStep.appendChild(listDiv);
  }

  function addAllPartsToCart(parts, config, machineContext) {
    let addedCount = 0,
      updatedCount = 0;

    parts.forEach((part) => {
      let qtyToAdd = 0;
      if (part.type === "Disc") qtyToAdd = config.qtyDisc;
      else if (part.type === "Point") qtyToAdd = config.qtyPoint;
      else if (part.type === "Hardware") qtyToAdd = config.qtyDisc;
      if (qtyToAdd <= 0) return;

      const existing = state.cart.find((item) => item.id === part.id);
      if (existing) {
        if (existing.qty !== qtyToAdd) {
          existing.qty = qtyToAdd;
          existing.machineContext = machineContext;
          updatedCount++;
        }
        if (!existing.price && part.price) {
          existing.price = part.price;
          updatedCount = updatedCount || 1;
        }
        if (
          (!existing.code || existing.code === existing.id) &&
          part.code &&
          part.code !== part.id
        )
          existing.code = part.code;
      } else {
        state.cart.push({
          id: part.id,
          name: part.name,
          code: part.code || part.id,
          price: part.price || "",
          image: part.image || "",
          qty: qtyToAdd,
          machineContext,
        });
        addedCount++;
      }
    });

    saveCart();
    renderCart();

    if (addedCount > 0 || updatedCount > 0) {
      let message = "";
      if (addedCount > 0 && updatedCount > 0)
        message = `Added ${addedCount} new item(s) and updated ${updatedCount} item(s) in your cart.`;
      else if (addedCount > 0)
        message = `Added ${addedCount} item(s) to your cart.`;
      else
        message = `Updated quantities for ${updatedCount} item(s) in your cart.`;
      showUpdateMessage(message);
    }

    finishWizard();
  }

  /* ── Reverse wizard (from add-to-quote btn) ── */
  function triggerReverseWizard(partName) {
    log("Triggering Reverse Wizard for:", partName);
    if (!data.parts.length) return false;

    const cleanName = partName.trim().toLowerCase();
    const partDef = indexes.partsByName.get(cleanName);
    if (!partDef?.models?.length) return false;

    const compatibleDefs = data.modelMenu.filter((m) =>
      partDef.models.includes(m.fullName),
    );
    if (!compatibleDefs.length) return false;

    state.wizState.brand = compatibleDefs[0].brand;
    const uniqueFamilies = [...new Set(compatibleDefs.map((d) => d.family))];
    if (!DOM.wizContainer) return false;

    const cartContent = document.querySelector(".quote-cart-content");
    if (cartContent) cartContent.scrollTop = 0;
    showCart();

    if (uniqueFamilies.length > 1) {
      state.wizState.filter = { families: uniqueFamilies };
    } else {
      state.wizState.family = uniqueFamilies[0];
      const uniqueVariants = [...new Set(compatibleDefs.map((d) => d.variant))];
      const hasRealVariants = uniqueVariants.some((v) => v?.trim());
      if (hasRealVariants && uniqueVariants.length > 0) {
        state.wizState.filter = { variants: uniqueVariants };
        if (uniqueVariants.length === 1)
          state.wizState.variant = uniqueVariants[0];
      } else {
        state.wizState.variant = "";
      }
    }

    renderWizard();
    return true;
  }

  /* ── Cart visibility ── */
  function showCart() {
    if (!DOM.cart) return;
    // Re-load CMS data in case collection rendered after init
    loadCMSData();
    setTimeout(loadCMSData, 500);
    DOM.cart.classList.add("open");
    DOM.cart.classList.remove("closed");
    updateButtons();
  }

  function hideCart() {
    if (!DOM.cart) return;
    DOM.cart.classList.remove("open");
    DOM.cart.classList.add("closed");
    updateButtons();
  }

  function updateButtons() {
    const isOpen = DOM.cart?.classList.contains("open");
    DOM.openBtns.forEach((btn) => btn.toggleAttribute("hidden", isOpen));
    if (DOM.closeBtn) DOM.closeBtn.style.display = isOpen ? "flex" : "none";
  }

  /* ── Event binding ── */
  function bindEvents() {
    DOM.openBtns.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showCart();
      }),
    );
    DOM.closeBtn?.addEventListener("click", hideCart);
    DOM.clearBtn?.addEventListener("click", clearCart);
    DOM.cartItems?.addEventListener("click", handleCartItemClick);
    DOM.cartItems?.addEventListener("change", handleCartItemChange);
    DOM.breadcrumbs?.addEventListener("click", handleBreadcrumbClick);
    DOM.activeStep?.addEventListener("click", handleWizardClick);
    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".brand-dropdown"))
        document
          .querySelectorAll(".brand-list")
          .forEach((l) => (l.style.display = "none"));
    });
  }

  function handleCartItemClick(e) {
    const item = e.target.closest(".quote-cart-item");
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.closest(".cart-trash")) removeFromCart(id);
    else if (e.target.dataset.action === "decrease") updateCartQuantity(id, -1);
    else if (e.target.dataset.action === "increase") updateCartQuantity(id, 1);
  }

  function handleCartItemChange(e) {
    if (!e.target.classList.contains("quote-cart-item-qty")) return;
    const item = e.target.closest(".quote-cart-item");
    if (!item) return;
    const value = parseInt(e.target.value);
    updateCartQuantity(item.dataset.id, isNaN(value) ? 1 : value);
  }

  function handleBreadcrumbClick(e) {
    const pill = e.target.closest(".wiz-pill.breadcrumb");
    if (pill) goBackFrom(pill.dataset.step);
  }

  function handleWizardClick(e) {
    const pill = e.target.closest(".wiz-pill:not(.breadcrumb)");
    if (pill && !e.target.closest(".wiz-add-btn")) {
      const value = pill.dataset.value;
      let step = null;
      if (!state.wizState.brand) step = "brand";
      else if (!state.wizState.family) step = "family";
      else if (state.wizState.variant === null) step = "variant";
      else if (!state.wizState.size) step = "size";
      if (step) selectOption(step, value);
      return;
    }

    const addBtn = e.target.closest(".wiz-add-btn");
    if (addBtn) {
      const item = addBtn.closest(".wiz-result-item");
      if (!item) return;
      const partId = item.dataset.partId;
      const qtyInput = item.querySelector(".wiz-result-qty");
      const qty = parseInt(qtyInput?.value) || 1;
      const part = indexes.partsById.get(partId);
      if (part) {
        const activeModel = data.modelMenu.find(
          (d) =>
            d.brand === state.wizState.brand &&
            d.family === state.wizState.family &&
            (d.variant || "") === (state.wizState.variant || ""),
        );
        const machineContext = activeModel
          ? `${activeModel.brand} ${activeModel.family} ${activeModel.variant || ""}`.trim()
          : "";
        const wasUpdated = addPartToCart(
          {
            name: part.name,
            id: part.id,
            code: part.code || "",
            price: part.price || "",
            qty,
            image: part.image,
            machineContext,
          },
          false,
        );
        showUpdateMessage(
          wasUpdated
            ? `Updated quantity for ${part.name}`
            : `${part.name} added to your cart.`,
        );
        item.style.opacity = "0";
        setTimeout(() => {
          item.remove();
          const listDiv = DOM.activeStep?.querySelector(".wiz-results-list");
          if (listDiv && listDiv.children.length === 0)
            listDiv.innerHTML =
              '<div style="color:#888;text-align:center;padding:10px;">All parts added to order!</div>';
        }, 300);
      }
    }
  }

  /* ── Homepage add-to-quote buttons ── */
  function bindHomepageButtons() {
    const buttons = document.querySelectorAll(".add-to-quote-btn");
    buttons.forEach((btn) => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          let productName =
            this.getAttribute("data-name") ||
            this.getAttribute("data-add-to-quote");
          if (!productName) {
            const card = this.closest(
              ".product-card, .brands-product-card, .w-dyn-item, .carousel-item",
            );
            if (card) {
              const titleEl = card.querySelector(
                "h3, h4, .product-title, .product-name",
              );
              if (titleEl) productName = titleEl.textContent.trim();
            }
          }
          if (productName) handleAddToQuote(this, productName);
          return false;
        },
        true,
      );
    });
    log(`Bound ${buttons.length} add-to-quote buttons`);
  }

  /* ── Cart open button icon ── */
  function setOpenButtonIcon() {
    DOM.openBtns.forEach((btn) => {
      if (
        btn.classList.contains("open-quote-cart-btn") ||
        btn.id === "open-quote-cart-btn"
      ) {
        btn.innerHTML =
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
      }
    });
  }

  function handleGlobalClick(e) {
    if (e._tillageworxHandled) return;

    const openCartBtn = e.target.closest(
      ".open-quote-cart, .open-quote-cart-btn, .quote-main-btn",
    );
    if (openCartBtn) {
      e.preventDefault();
      showCart();
      return;
    }

    const dropdownToggle = e.target.closest(".brand-current");
    if (dropdownToggle) {
      const list = dropdownToggle.nextElementSibling;
      if (list?.classList.contains("brand-list")) {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = list.style.display === "block";
        document
          .querySelectorAll(".brand-list")
          .forEach((l) => (l.style.display = "none"));
        list.style.display = isVisible ? "none" : "block";
        return;
      }
    }

    const btn = e.target.closest("[data-add-to-quote]");
    if (!btn) return;

    if (btn.classList.contains("carousel-link")) {
      const href = btn.getAttribute("href");
      const productName = btn.getAttribute("data-add-to-quote");
      if (href === "#open-cart") {
        e.preventDefault();
        showCart();
        return;
      }
      if (href && href !== "#" && href.trim() !== "" && !productName) {
        if (href.startsWith("http") && !href.includes(window.location.hostname))
          window.open(href, "_blank");
        return;
      }
      if (productName) {
        e.preventDefault();
        e.stopPropagation();
        handleAddToQuote(btn, productName);
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
      const productName =
        btn.getAttribute("data-add-to-quote") || btn.getAttribute("data-name");
      if (productName) handleAddToQuote(btn, productName);
    }
  }

  function handleAddToQuote(btn, productName) {
    log("Adding to order:", productName);
    const card = btn.closest(
      ".carousel-item, .product-card, .brands-product-card, .w-dyn-item",
    );

    let imageUrl = btn.getAttribute("data-image");
    if (!imageUrl && card) {
      const hiddenImg = card.querySelector(".hidden-image-url");
      if (hiddenImg) imageUrl = hiddenImg.textContent.trim();
    }
    if (!imageUrl && card) {
      const img = card.querySelector("img");
      if (img) imageUrl = img.src;
    }

    let productId = btn.getAttribute("data-id");
    const canonicalPart = indexes.partsByName.get(productName.toLowerCase());
    if (canonicalPart) {
      productId = canonicalPart.id;
      productName = canonicalPart.name;
      if (!imageUrl) imageUrl = canonicalPart.image;
    }

    const part = {
      id: productId || productName,
      name: productName,
      code: btn.getAttribute("data-code") || "",
      price: btn.getAttribute("data-price") || "",
      image: imageUrl || "",
      qty: 1,
    };
    const existing = state.cart.find((item) => item.id === part.id);
    addPartToCart(part, false);
    if (existing) showUpdateMessage(`Updated quantity for ${part.name}`);
    const wizardOpened = triggerReverseWizard(part.name);
    if (!wizardOpened) showCart();
  }
  /* ── Cart DOM injection (for pages without quote-cart element) ── */
  function injectCartIfMissing() {
    if (document.getElementById("quote-cart")) return; // already exists

    // Inject the quote cart panel
    const cart = document.createElement("div");
    cart.id = "quote-cart";
    cart.className = "quote-cart closed";
    cart.innerHTML = `
    <button id="quote-cart-close-btn" class="quote-cart-close-btn"></button>
    <div class="quote-cart-content">
      <div id="cart-add-parts-box">
        <button id="cart-add-parts-btn"></button>
      </div>
      <div class="cart-section-header">Your Order</div>
      <div id="cart-items" class="quote-cart-items"></div>
      <button id="cart-clearall">Clear Order</button>
      <div class="quote-cart-info"></div>
      <div id="cart-form-slot"></div>
    </div>
  `;
    document.body.appendChild(cart);

    // Inject the floating open button
    if (!document.getElementById("open-quote-cart-btn")) {
      const btn = document.createElement("button");
      btn.id = "open-quote-cart-btn";
      btn.className = "open-quote-cart-btn";
      btn.style.cssText =
        "position:fixed;bottom:50%;right:0;width:56px;height:56px;background:#c2934a;border:none;border-radius:8px 0 0 8px;z-index:10001;box-shadow:0 4px 24px rgba(0,0,0,0.22);cursor:pointer;display:flex;align-items:center;justify-content:center;";
      document.body.appendChild(btn);
    }
  }

  /* ── Init ── */
  function init() {
    injectCartIfMissing();
    const startTime = performance.now();
    cacheDOM();
    loadCart();
    loadCMSData();
    initWizard();
    bindEvents();
    setOpenButtonIcon();
    setTimeout(bindHomepageButtons, 100);
    renderCart();
    updateButtons(); // ensure injected open button is visible on load

    const observer = new MutationObserver(() => {
      const items = document.querySelectorAll(".part-data-item");
      const payloads = document.querySelectorAll(
        ".part-data-payload[data-price]",
      );
      // Only reload if we have payloads with actual price data
      const pricedPayloads = Array.from(payloads).filter(
        (p) => p.dataset.price,
      );
      if (items.length > 0 && pricedPayloads.length > 0) {
        observer.disconnect();
        loadCMSData();
        log(
          "CMS data reloaded after Webflow collection render:",
          items.length,
          "items,",
          pricedPayloads.length,
          "priced",
        );
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
    log("Initialized in", `${(performance.now() - startTime).toFixed(2)}ms`);
  }

  window.renderCart = renderCart;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ── 3. ORDER REVIEW — cart table + summary on /quote-review ─ */
(function () {
  const CART_KEY = "tillageworx_quote_cart";

  function parsePrice(str) {
    if (!str) return null;
    const n = parseFloat(String(str).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text || "");
    return div.innerHTML;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function renderQuoteReview() {
    const cart = getCart();
    const tableContainer = document.getElementById("qr-parts-container");
    const summaryContainer = document.getElementById("qr-summary-container");
    const cartDataField = document.getElementById("qr-cart-data");
    let cartJsonField = document.getElementById("qr-cart-json");
    const emptyMsg = document.getElementById("qr-empty-msg");
    const formSection = document.getElementById("qr-form-section");
    const flexRow = document.getElementById("qr-flex-row");
    const rightCol = document.getElementById("qr-right-col");
    const heroLeft = formSection
      ? formSection.querySelector(".hero-pages-left")
      : null;

    if (!tableContainer) return;

    if (!cart.length) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (formSection) formSection.setAttribute("style", "display:none");
      if (flexRow) flexRow.setAttribute("style", "display:none");
      tableContainer.style.display = "none";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    if (flexRow)
      flexRow.setAttribute(
        "style",
        "display:flex;flex-direction:row;align-items:flex-start;gap:40px;width:100%;flex-wrap:wrap",
      );
    if (formSection)
      formSection.setAttribute(
        "style",
        "flex:1 1 320px;min-width:0;display:block",
      );
    if (rightCol)
      rightCol.setAttribute(
        "style",
        "flex:1 1 280px;min-width:0;display:flex;flex-direction:column;gap:24px",
      );
    if (heroLeft) heroLeft.setAttribute("style", "width:100%;max-width:none");

    let subtotal = 0;
    let allPriced = true;
    let rows = "";

    cart.forEach((item) => {
      const safeQty = Math.max(1, item.qty || 1);
      const unitPrice = parsePrice(item.price);
      const lineTotal = unitPrice !== null ? unitPrice * safeQty : null;

      if (lineTotal !== null) {
        subtotal += lineTotal;
      } else {
        allPriced = false;
      }

      const lineTotalHtml =
        lineTotal !== null
          ? `$${lineTotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `<span style="color:#888;font-style:italic;">TBC</span>`;

      rows += `
        <tr data-item-id="${escapeHtml(item.id)}">
          <td>
            ${item.image ? `<img src="${escapeHtml(item.image)}" class="qr-item-img" alt="">` : ""}
            <div class="qr-item-name">${escapeHtml(item.name)}</div>
            ${item.code && item.code !== item.id ? `<div class="qr-item-code">Product Code: ${escapeHtml(item.code)}</div>` : ""}
          </td>
          <td>${unitPrice !== null ? `$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `<span style="color:#888">TBC</span>`}</td>
          <td>
            <div class="qr-qty-controls">
              <button class="qr-qty-btn qr-qty-minus" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
              <span class="qr-qty-value">${safeQty}</span>
              <button class="qr-qty-btn qr-qty-plus" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
            </div>
            <button class="qr-remove-btn" data-id="${escapeHtml(item.id)}" aria-label="Remove item">REMOVE</button>
          </td>
          <td>${lineTotalHtml}</td>
        </tr>
      `;
    });

    tableContainer.innerHTML = `
      <table class="qr-parts-table">
        <thead>
          <tr><th>Part</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="qr-browse-row">
        <a href="/browse-brands" class="qr-browse-btn">← Keep Browsing</a>
      </div>
    `;

    tableContainer.querySelectorAll(".qr-qty-minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const idx = stored.findIndex((i) => i.id === id);
        if (idx > -1) {
          if (stored[idx].qty > 1) stored[idx].qty--;
          else stored.splice(idx, 1);
          localStorage.setItem(CART_KEY, JSON.stringify(stored));
          renderQuoteReview();
        }
      });
    });

    tableContainer.querySelectorAll(".qr-qty-plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const idx = stored.findIndex((i) => i.id === id);
        if (idx > -1) {
          stored[idx].qty = Math.min(999, (stored[idx].qty || 1) + 1);
          localStorage.setItem(CART_KEY, JSON.stringify(stored));
          renderQuoteReview();
        }
      });
    });

    tableContainer.querySelectorAll(".qr-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const updated = JSON.parse(
          localStorage.getItem(CART_KEY) || "[]",
        ).filter((i) => i.id !== id);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
        renderQuoteReview();
      });
    });

    if (summaryContainer) {
      const gst = subtotal * 0.1;
      const total = subtotal + gst;
      let summaryHtml = "";

      if (subtotal > 0) {
        summaryHtml = `
          <div class="qr-summary-row"><span>${allPriced ? "Subtotal" : "Subtotal (priced items)"}</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-summary-row"><span>Freight</span><span style="color:#888;font-style:italic;">TBA</span></div>
          <div class="qr-summary-row qr-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-freight-disclaimer">Once we receive your order, we will do our best to source the most affordable, reliable freight option.<br><br>We will then email you a Sales Order with freight included for you to accept.<br><br><span class="qr-freight-phone">📞 Questions? Call us on 08 6185 1944</span></div>
        `;
        if (!allPriced)
          summaryHtml += `<div class="qr-summary-note" style="margin-top:8px;">Some items are price on request — our team will confirm final pricing before processing your order.</div>`;
      } else {
        summaryHtml = `<div class="qr-summary-note">Our team will confirm pricing before processing your order.</div>`;
      }

      summaryContainer.innerHTML = summaryHtml;
    }

    if (cartDataField) {
      cartDataField.value = cart
        .map((item) => {
          const qty = Math.max(1, item.qty || 1);
          const unitPrice = parsePrice(item.price);
          const lineTotal =
            unitPrice !== null ? (unitPrice * qty).toFixed(2) : "TBC";
          return `${item.name} (${item.code || item.id}) x${qty} @ ${item.price || "TBC"} = $${lineTotal}`;
        })
        .join("\n");

      // ── Cart JSON field for Zoho Flow integration ──
      if (!cartJsonField) {
        cartJsonField = document.createElement("input");
        cartJsonField.type = "hidden";
        cartJsonField.id = "qr-cart-json";
        cartJsonField.name = "Cart JSON";
        cartDataField.parentNode.appendChild(cartJsonField);
      }
    }

    if (cartJsonField) {
      const cleanCart = cart.map((item) => ({
        SKU: item.code || item.id,
        Name: item.name,
        Quantity: Math.max(1, item.qty || 1),
      }));
      cartJsonField.value = JSON.stringify(cleanCart);
    }
  }

  /* ── 4. ORDER FORM — restructures Webflow form fields ─── */
  function initQRForm() {
    const sec = document.getElementById("qr-form-section");
    if (!sec || sec.dataset.qrFormInit) return;
    sec.dataset.qrFormInit = "1";

    const g = (id) => sec.querySelector("#" + id);
    const firstName = g("qr-first-name");
    const lastName = g("qr-last-name");
    const email = g("qr-email");
    const phone = g("qr-phone");
    const business = g("qr-business");
    const address = g("qr-address");
    if (!firstName) return;

    // Creates a styled input element
    const mkInput = (attrs) => {
      const inp = document.createElement("input");
      Object.entries(attrs).forEach(([k, v]) => inp.setAttribute(k, v));
      inp.style.cssText =
        "width:100%;box-sizing:border-box;background:#1a1a1a;color:#fff;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.4;transition:border-color 0.2s,box-shadow 0.2s;margin-bottom:12px";
      inp.addEventListener("focus", () => {
        inp.style.borderColor = "#c2934a";
        inp.style.boxShadow = "0 0 0 3px rgba(194,147,74,0.15)";
      });
      inp.addEventListener("blur", () => {
        inp.style.borderColor = "#3a3a3a";
        inp.style.boxShadow = "";
      });
      return inp;
    };

    // Creates a gold uppercase label
    const mkLabel = (text) => {
      const lbl = document.createElement("label");
      lbl.style.cssText =
        "display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;margin-bottom:5px;margin-top:4px";
      lbl.textContent = text;
      return lbl;
    };

    // Wraps an existing Webflow input (respects .input-container) in a flex child div
    const wrapEl = (el) => {
      let container = el.closest(".input-container") || el.parentElement;
      if (!container || container === sec || container.tagName === "FORM")
        container = el;
      const d = document.createElement("div");
      d.style.cssText = "flex:1 1 0%;min-width:0";
      container.parentNode.insertBefore(d, container);
      d.appendChild(container);
      return d;
    };

    // First + Last name side by side
    const firstNameContainer =
      firstName.closest(".input-container") || firstName.parentElement;
    const nameRow = document.createElement("div");
    nameRow.className = "qr-name-row";
    firstNameContainer.parentNode.insertBefore(nameRow, firstNameContainer);
    nameRow.appendChild(wrapEl(firstName));
    if (lastName) nameRow.appendChild(wrapEl(lastName));

    // Email + Phone side by side
    const emailContainer =
      email.closest(".input-container") || email.parentElement;
    const contactRow = document.createElement("div");
    contactRow.className = "qr-contact-row";
    emailContainer.parentNode.insertBefore(contactRow, emailContainer);
    contactRow.appendChild(wrapEl(email));
    if (phone) contactRow.appendChild(wrapEl(phone));

    // Invoicing address (injected after business field) + delivery toggle
    if (business) {
      const invBlock = document.createElement("div");
      business.parentNode.insertBefore(invBlock, business.nextSibling);
      invBlock.appendChild(mkLabel("Invoicing Address"));
      invBlock.appendChild(
        mkInput({
          type: "text",
          id: "qr-invoicing-address",
          name: "Invoicing Address",
          placeholder: "Address, Town, State, Postcode",
        }),
      );

      if (address) {
        const addrContainer =
          address.closest(".input-container") || address.parentElement;
        const addrBlock = document.createElement("div");
        addrContainer.parentNode.insertBefore(addrBlock, addrContainer);

        // "Delivery address is different" checkbox row
        const sameRow = document.createElement("div");
        sameRow.className = "qr-same-address-row";
        sameRow.style.marginTop = "4px";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "qr-diff-delivery";
        const cbLbl = document.createElement("label");
        cbLbl.setAttribute("for", "qr-diff-delivery");
        cbLbl.textContent =
          "Delivery address is different from invoicing address";
        sameRow.appendChild(cb);
        sameRow.appendChild(cbLbl);

        const inputWrapper = document.createElement("div");
        inputWrapper.className = "qr-delivery-input-wrapper";
        inputWrapper.appendChild(addrContainer);

        addrBlock.appendChild(sameRow);
        addrBlock.appendChild(inputWrapper);

        address.value = "";
        address.required = false;
        address.placeholder =
          "Please include business name if delivering to local depot";

        cb.addEventListener("change", () => {
          if (cb.checked) {
            inputWrapper.classList.add("visible");
            address.required = true;
          } else {
            inputWrapper.classList.remove("visible");
            address.value = "";
            address.required = false;
          }
        });
      }
    }

    // ── Honeypot field — invisible to humans, bots fill it in ──
    const honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.id = "qr-honeypot";
    honeypot.name = "Website"; // sounds like a legit field to bots
    honeypot.autocomplete = "off";
    honeypot.tabIndex = -1; // keyboard users skip it
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
    sec.appendChild(honeypot);

    const submitBtn =
      sec.querySelector("#qr-submit-btn") ||
      document.getElementById("qr-submit-btn");
    const realForm = document.getElementById("wf-form-Quote-Request-Form");

    if (submitBtn && realForm) {
      submitBtn.addEventListener(
        "click",
        function (e) {
          e.preventDefault();

          // ── Honeypot check ──
          const hp = document.getElementById("qr-honeypot");
          if (hp && hp.value) return false; // Silent bot block

          // ── Copy visible fields → hidden form fields ──
          const g = (id) => document.getElementById(id)?.value || "";

          const firstName = g("qr-first-name");
          const lastName = g("qr-last-name");
          realForm.querySelector("#customer_name").value =
            `${firstName} ${lastName}`.trim();
          realForm.querySelector("#customer_email").value = g("qr-email");
          realForm.querySelector("#customer_phone").value = g("qr-phone");
          realForm.querySelector("#business_name").value = g("qr-business");
          realForm.querySelector("#Delivery_Address").value = g(
            "qr-invoicing-address",
          );
          realForm.querySelector("#Additional-Info").value = g("qr-notes");
          realForm.querySelector("#quote_items").value = g("qr-cart-data");

          // ── Validate required visible fields manually ──
          if (!firstName) {
            document.getElementById("qr-first-name").focus();
            return false;
          }
          if (!g("qr-email")) {
            document.getElementById("qr-email").focus();
            return false;
          }

          // ── Check terms checkbox ──
          const terms = realForm.querySelector("#terms_agreed");
          if (terms) terms.checked = true;

          // ── Submit the real form ──
          realForm.querySelector(".submit-button.w-button").click();
          // ── Watch for Webflow success/fail and show visible confirmation ──
          const successDiv = document.querySelector(
            "#quote-form-block .w-form-done",
          );
          const failDiv = document.querySelector(
            "#quote-form-block .w-form-fail",
          );

          const observer = new MutationObserver(() => {
            const successVisible =
              window.getComputedStyle(successDiv).display !== "none";
            const failVisible =
              window.getComputedStyle(failDiv).display !== "none";

            if (successVisible) {
              observer.disconnect();

              // Scroll to top so user sees confirmation
              window.scrollTo({ top: 0, behavior: "smooth" });

              // Clear the cart before replacing DOM
              localStorage.removeItem("tillageworx_quote_cart");
              if (window.renderCart) window.renderCart();

              // Replace form with success message
              const formSection = document.getElementById("qr-form-section");
              formSection.innerHTML = `
    <div style="padding:40px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h3 style="color:#c2934a;font-size:20px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">
        Order Received!
      </h3>
      <p style="color:#ccc;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Thanks, your order has been received!<br>
        We'll email you a Sales Order including freight cost ASAP.
      </p>
      <p style="color:#888;font-size:13px;">
        Questions? Call us on <a href="tel:0861851944" style="color:#c2934a;font-weight:700;">08 6185 1944</a>
      </p>
    </div>
  `;

              // Clear the cart
              localStorage.removeItem("tillageworx_quote_cart");
              if (window.renderCart) window.renderCart();
            }

            if (failVisible) {
              observer.disconnect();
              const formSection = document.getElementById("qr-form-section");
              const existing = formSection.querySelector(".qr-submit-error");
              if (!existing) {
                const err = document.createElement("div");
                err.className = "qr-submit-error";
                err.style.cssText =
                  "margin-top:16px;padding:14px 18px;background:rgba(220,50,50,0.1);border-left:3px solid #e05050;border-radius:0 6px 6px 0;color:#e08080;font-size:13px;";
                err.textContent =
                  "Something went wrong. Please try again or call us on 08 6185 1944.";
                formSection.appendChild(err);
              }
            }
          });

          if (successDiv && failDiv) {
            observer.observe(successDiv, {
              attributes: true,
              attributeFilter: ["style"],
            });
            observer.observe(failDiv, {
              attributes: true,
              attributeFilter: ["style"],
            });
          }
        },
        true,
      );
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    renderQuoteReview();
    initQRForm();
  });
})();

/* ── 5. NAVBAR SCROLL — hide on down, reveal on up ─────────── */
(function () {
  var nav = document.querySelector(".navbar");
  if (!nav) return;
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var y = window.scrollY,
          delta = y - lastY;
        if (delta < 0) {
          // Scrolling up — show nav
          nav.style.transform = "translateY(0)";
          nav.style.transition = "transform 0.25s ease";
        } else if (delta > 4 && y > 80) {
          // Scrolling down past 80px — hide nav
          nav.style.transform = "translateY(-110%)";
          nav.style.transition = "transform 0.25s ease";
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
