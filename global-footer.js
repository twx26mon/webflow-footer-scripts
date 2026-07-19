/* ============================================================
   Tillageworx — Global Site Script
   Repo: twx26mon/webflow-footer-scripts
   Load via Webflow Site Settings → Custom Code → Before </body>
   OR via an external script tag pointing to the raw GitHub URL.

   Contains:
   0. CUSTOMER ACCOUNT — price gating  
   1. CSS injection  — injects tillageworx.css at runtime
     2. Quote Cart     — cart state, machine wizard, add-to-quote buttons
     3. Quote Review   — renders cart table + summary on /quote-review
     4. Quote Form     — collects form fields, submits directly to Zoho Flow
                         webhook via fetch(). No native Webflow form required.
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
     #qr-empty-msg                            — shown when cart is empty
     #qr-form-section                         — contact form wrapper
     #qr-flex-row / #qr-right-col             — layout containers on /quote-review
     #qr-first-name, #qr-last-name            — name inputs inside form
     #qr-email, #qr-phone                     — contact inputs
     #qr-business                             — business name input
     #qr-notes                                — additional notes textarea
     #qr-submit-btn                           — form submit button (is an <a> tag)
   ============================================================ */

/* ── 0. CUSTOMER ACCOUNT — price gating ──────────────────── */
(function () {
  const SUPABASE_URL = "https://srgndcoiobilpwbliwgn.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_6KrJ0rECybfj3_Pj-nz7yA_K2jaXjnU";
  const PORTAL_URL = "https://customers.tillageworx.com.au";
  const GATING_ENABLED = true;

  // After login the portal redirects back with #twx_session=... in the hash.
  // Write it to localStorage so getSession() works on this domain, then clean the URL.
  (function () {
    try {
      var m = window.location.hash.match(/[#&]twx_session=([^&]*)/);
      if (m) {
        var s = JSON.parse(decodeURIComponent(m[1]));
        if (s && s.access_token) {
          localStorage.setItem("sb-srgndcoiobilpwbliwgn-auth-token", JSON.stringify(s));
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    } catch (e) {}
  })();

  function getSession() {
    try {
      const raw = localStorage.getItem("sb-srgndcoiobilpwbliwgn-auth-token");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.access_token) return null;
      if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at)
        return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function injectGateStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .twx-price-gate {
        display: flex;
        gap: 10px;
        margin-top: 4px;
        width: 100%;
      }
      .twx-view-price-btn {
        flex: 1;
        padding: 8px 10px;
        background: #c9a84c;
        color: #1a1a1a;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: opacity 0.15s;
      }
      .twx-view-price-btn:hover { opacity: 0.85; }
      .twx-contact-btn {
        flex: 1;
        padding: 8px 10px;
        background: transparent;
        color: #888;
        border: 1px solid #333;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s, color 0.15s;
      }
      .twx-contact-btn:hover { border-color: #666; color: #ccc; }
      .twx-lock-icon {
        font-size: 11px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;
      }
      /* Parts template — larger buttons (horizontal, matching native Webflow button) */
      .quote-button-container .twx-price-gate-wrap {
        width: 100%;
        margin-bottom: 4px;
      }
      .quote-button-container .twx-price-gate {
        gap: 8px;
        margin-top: 8px;
      }
      .quote-button-container .twx-view-price-btn,
      .quote-button-container .twx-contact-btn {
        padding: 13px 20px;
        font-size: 14px;
        border-radius: 4px;
        letter-spacing: 0.5px;
        font-family: Arial, sans-serif;
      }
      .quote-button-container .twx-lock-icon {
        font-size: 12px;
        margin-bottom: 8px;
        margin-top: 4px;
      }
      /* Override any Webflow hover rule on .add-to-quote-btn inside the gate */
      .twx-price-gate .add-to-quote-btn:hover {
        background: transparent !important;
        background-color: transparent !important;
        border-color: #666 !important;
        color: #ccc !important;
      }
      /* Brands template fallback — gate injected into raw parent with no padding */
      .twx-gate-flush {
        padding: 4px 12px 12px;
      }
      /* Info bar — Go to Dashboard pill button (mirrors portal Return to Website) */
      .twx-nav-dashboard-btn {
        font-size: 12px;
        color: #fff;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-decoration: none;
        font-family: Arial, sans-serif;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        padding: 5px 14px;
        border-radius: 3px;
        transition: border-color 0.15s, color 0.15s;
        white-space: nowrap;
      }
      .twx-nav-dashboard-btn:hover { border-color: #666; color: #c2934a; }
      /* Info bar auth links */
      .twx-nav-login {
        color: #aaa;
        font-size: 12px;
        font-family: Arial, sans-serif;
        text-decoration: none;
        letter-spacing: 0.3px;
        transition: color 0.15s;
      }
      .twx-nav-login:hover { color: #fff; }
      .twx-nav-signup {
        color: #c2934a;
        font-size: 12px;
        font-family: Arial, sans-serif;
        font-weight: 700;
        text-decoration: none;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        border: 1px solid rgba(194, 147, 74, 0.35);
        border-radius: 4px;
        padding: 5px 12px;
        transition: background 0.15s, border-color 0.15s;
      }
      .twx-nav-signup:hover {
        background: rgba(194, 147, 74, 0.1);
        border-color: #c2934a;
      }
      /* Member "Add to Order" button on parts template — gold fill */
      .twx-member-add {
        background: #c9a84c !important;
        color: #1a1a1a !important;
        border: none !important;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .twx-member-add:hover { opacity: 0.85 !important; }
      /* Modal scrollbars */
      #twx-gq-modal > div::-webkit-scrollbar,
      #twx-mo-modal > div::-webkit-scrollbar { width: 4px; }
      #twx-gq-modal > div::-webkit-scrollbar-track,
      #twx-mo-modal > div::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 4px; }
      #twx-gq-modal > div::-webkit-scrollbar-thumb,
      #twx-mo-modal > div::-webkit-scrollbar-thumb { background: #c2934a; border-radius: 4px; }
      #twx-gq-modal > div::-webkit-scrollbar-thumb:hover,
      #twx-mo-modal > div::-webkit-scrollbar-thumb:hover { background: #d4a55e; }
      /* Machine wizard add-to-quote button */
      .wiz-add-btn {
        background: transparent;
        color: #c2934a;
        border: 1px solid #c2934a;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .wiz-add-btn:hover {
        background: rgba(194, 147, 74, 0.12);
      }
      /* Clear cart button — gold, darker on hover */
      #cart-clearall { color: #c2934a !important; transition: filter 0.15s; }
      #cart-clearall:hover { filter: brightness(0.65); }
      /* Sign out button */
      #twx-signout-btn { color: #aaa !important; transition: color 0.15s; }
      #twx-signout-btn:hover { color: #fff !important; }
      /* ABOUT dropdown — styled to match nav */
      .dropdown-list-about.w-dropdown-list {
        background: #0e0e0e;
        border: 1px solid #2a2a2a;
        border-radius: 6px;
        padding: 6px;
        min-width: 160px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .dropdown-list-about .menu-sublink {
        display: block;
        color: #bbb;
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
      }
      .dropdown-list-about .menu-sublink:hover,
      .dropdown-list-about .menu-sublink.w--current {
        color: #c2934a;
        background: rgba(194, 147, 74, 0.08);
      }
    `;
    document.head.appendChild(style);
  }

  function gateProductCards() {
    if (!GATING_ENABLED) return;
    const session = getSession();
    const returnUrl = encodeURIComponent(window.location.href);

    const cartBtn = document.getElementById("open-quote-cart-btn");
    if (cartBtn) cartBtn.style.display = "flex";

    document.querySelectorAll(".brands-card-price").forEach((priceEl) => {
      // Card is the .w-dyn-item; body is .brands-card-body (parent of priceEl)
      const card = priceEl.closest(".w-dyn-item, .brands-card-item");
      const body = priceEl.parentNode;
      if (!card || !body) return;

      // .brands-card-add sits OUTSIDE .brands-card-body — search at card level
      const addBtn = card.querySelector(".brands-card-add");
      const stkEl = card.querySelector(".brands-card-stk");

      if (session) {
        // Member: show price + stk, restore add btn, remove any injected gate
        priceEl.style.display = "";
        if (stkEl) stkEl.style.display = "";
        body.querySelectorAll(".twx-price-gate-wrap").forEach((g) => g.remove());
        if (addBtn) {
          addBtn.style.display = "";
          // Don't overwrite innerHTML — keep Webflow's cart icon as-is
        }
      } else {
        // Guest: hide price, stk, and native add btn
        priceEl.style.display = "none";
        if (stkEl) stkEl.style.display = "none";
        if (addBtn) addBtn.style.display = "none";

        // Idempotency — skip if gate already injected inside body
        if (body.querySelector(".twx-price-gate-wrap")) return;

        // Read product data directly from the .brands-card-add element
        const esc = (v) => (v || "").replace(/"/g, "&quot;");
        const pName = esc(addBtn?.dataset?.name || addBtn?.dataset?.addToQuote || "");
        const pId   = esc(addBtn?.dataset?.id || "");
        const pCode = esc(addBtn?.dataset?.code || "");
        const pPrice = esc(addBtn?.dataset?.price || "");
        const pSalePrice = esc(addBtn?.dataset?.salePrice || "");
        const pOnSale = esc(addBtn?.dataset?.onSale || "");
        const pImage = esc(addBtn?.dataset?.image || "");
        const pZohoId = esc(addBtn?.dataset?.zohoId || "");

        const wrap = document.createElement("div");
        wrap.className = "twx-price-gate-wrap";
        wrap.innerHTML = `
          <div class="twx-lock-icon">🔒 Sign in to view price</div>
          <div class="twx-price-gate">
            <a href="${PORTAL_URL}/login?return=${returnUrl}" class="twx-view-price-btn">View Price</a>
            <button type="button"
              class="twx-contact-btn"
              data-add-to-quote="${pName}"
              data-name="${pName}"
              data-id="${pId}"
              data-code="${pCode}"
              data-price="${pPrice}"
              data-sale-price="${pSalePrice}"
              data-on-sale="${pOnSale}"
              data-image="${pImage}"
              data-zoho-id="${pZohoId}">
              Add to Quote
            </button>
          </div>
        `;
        body.insertBefore(wrap, priceEl.nextSibling);
      }
    });
  }

  function gatePartsTemplate() {
    if (!GATING_ENABLED) return;
    const session = getSession();
    const returnUrl = encodeURIComponent(window.location.href);

    // Show/hide price elements
    document.querySelectorAll(".product-price-stk, .product-price").forEach((el) => {
      el.style.display = session ? "" : "none";
    });

    document.querySelectorAll(".add-to-quote-btn").forEach((btn) => {
      // Skip brands card add buttons — handled by gateProductCards, not here
      if (btn.classList.contains("brands-card-add")) return;
      // Skip buttons inside the cart or wizard
      if (btn.closest("#quote-cart, #machine-wizard-container")) return;

      if (session) {
        // Member: unwrap from any gate, update text and apply gold styling
        const wrap = btn.closest(".twx-price-gate-wrap");
        const gate = btn.closest(".twx-price-gate");
        const container = wrap || gate;
        if (container) {
          container.parentNode.insertBefore(btn, container);
          container.remove();
        }
        btn.style.display = "";
        btn.textContent = "Add to Order";
        btn.classList.remove("twx-contact-btn");
        btn.classList.add("twx-member-add");
      } else {
        // Guest: already wrapped? skip
        if (btn.closest(".twx-price-gate-wrap, .twx-price-gate")) return;

        btn.style.display = "";
        btn.textContent = "Add to Quote";
        if (!btn.dataset.addToQuote) btn.dataset.addToQuote = btn.dataset.name || "";
        // Swap Webflow's .w-button styles out for our gate button styles
        btn.classList.remove("w-button");
        btn.classList.add("twx-contact-btn");

        // Wrap btn + login link + lock header in a gate
        const wrap = document.createElement("div");
        wrap.className = "twx-price-gate-wrap";

        const lockIcon = document.createElement("div");
        lockIcon.className = "twx-lock-icon";
        lockIcon.textContent = "🔒 Sign in to view price";

        const gate = document.createElement("div");
        gate.className = "twx-price-gate";

        const loginLink = document.createElement("a");
        loginLink.href = `${PORTAL_URL}/login?return=${returnUrl}`;
        loginLink.className = "twx-view-price-btn";
        loginLink.textContent = "View Price";

        wrap.appendChild(lockIcon);
        wrap.appendChild(gate);
        gate.appendChild(loginLink);
        // Insert wrap into DOM BEFORE moving btn, so btn.parentNode is still valid
        btn.parentNode.insertBefore(wrap, btn);
        gate.appendChild(btn);
      }
    });
  }

  // Local copy — this IIFE (Section 0) is a separate scope from the one(s)
  // that already define escapeHtml() further down the file, so it isn't
  // visible here. Do not remove thinking it's a duplicate.
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function injectInfoBarAuth() {
    const session = getSession();
    const returnUrl = encodeURIComponent(window.location.href);

    // ── Desktop info bar ──────────────────────────────────────
    const socialEl = document.querySelector(".social-icon-container");
    if (socialEl && socialEl.parentNode) {
      const existing = document.getElementById("twx-nav-auth");
      if (existing) existing.remove();

      const el = document.createElement("div");
      el.id = "twx-nav-auth";
      el.style.cssText =
        "display:flex;align-items:center;gap:16px;margin-right:4px;";

      if (session) {
        const firstName = escapeHtml(session.user?.user_metadata?.first_name || "");
        el.innerHTML = `
          <span style="color:#c2934a;font-size:12px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:0.3px;">
            G'day, ${firstName}
          </span>
          <a href="${PORTAL_URL}/dashboard" class="twx-nav-dashboard-btn">← Go to Dashboard</a>
          <button id="twx-signout-btn"
                  style="background:none;border:none;color:#686868;font-size:12px;font-family:Arial,sans-serif;cursor:pointer;padding:0;letter-spacing:0.3px;">
            Sign out
          </button>
        `;
        socialEl.parentNode.insertBefore(el, socialEl);
        document.getElementById("twx-signout-btn").addEventListener("click", function () {
          localStorage.removeItem("sb-srgndcoiobilpwbliwgn-auth-token");
          window.location.reload();
        });
      } else {
        el.innerHTML = `
          <a href="${PORTAL_URL}/login?return=${returnUrl}" class="twx-nav-login">Customer login</a>
          <a href="${PORTAL_URL}/signup?return=${returnUrl}" class="twx-nav-signup">Create account</a>
        `;
        socialEl.parentNode.insertBefore(el, socialEl);
      }
    }

    // ── Mobile nav panel ──────────────────────────────────────
    const navMenu = document.querySelector(".nav-menu-mobile");
    if (navMenu) {
      const existingMobile = document.getElementById("twx-nav-auth-mobile");
      if (existingMobile) existingMobile.remove();

      const mobileEl = document.createElement("div");
      mobileEl.id = "twx-nav-auth-mobile";
      mobileEl.className = "twx-mobile-auth";

      if (session) {
        const firstName = escapeHtml(session.user?.user_metadata?.first_name || "");
        mobileEl.innerHTML = `
          <div class="twx-mobile-auth-greeting">G'day, <strong>${firstName}</strong></div>
          <a href="${PORTAL_URL}/dashboard" class="twx-mobile-auth-link">My Account</a>
          <button id="twx-signout-btn-mobile" class="twx-mobile-signout">Sign out</button>
        `;
        navMenu.appendChild(mobileEl);
        document.getElementById("twx-signout-btn-mobile").addEventListener("click", function () {
          localStorage.removeItem("sb-srgndcoiobilpwbliwgn-auth-token");
          window.location.reload();
        });
      } else {
        mobileEl.innerHTML = `
          <a href="${PORTAL_URL}/login?return=${returnUrl}" class="twx-mobile-auth-link">Customer login</a>
          <a href="${PORTAL_URL}/signup?return=${returnUrl}" class="twx-mobile-auth-signup">Create account</a>
        `;
        navMenu.appendChild(mobileEl);
      }

      // Move ORDER/QUOTE button to after auth block
      const orderBtn = navMenu.querySelector(".open-quote-cart.mobile");
      if (orderBtn) navMenu.appendChild(orderBtn);
    }
  }

  function activatePartsNav() {
    const path = window.location.pathname;
    if (!path.startsWith("/brands/") && !path.startsWith("/parts/")) return;
    // Use twx-active instead of w--current — Webflow strips w--current from
    // anchor links whose href doesn't match the current URL
    document.querySelectorAll("section.navbar .nav-link").forEach(function (el) {
      if (
        el.getAttribute("href") === "/parts" ||
        el.textContent.trim().toUpperCase() === "PARTS"
      ) {
        el.classList.add("twx-active");
      }
    });
  }

  // Webflow adds w--current to sub-links inside dropdowns, not the toggle itself.
  // This bubbles that active state up so our CSS can underline the toggle.
  function activateDropdownNav() {
    document.querySelectorAll("section.navbar .w-dropdown").forEach(function (dropdown) {
      const toggle = dropdown.querySelector(".w-dropdown-toggle.nav-link");
      const activeChild = dropdown.querySelector(".w-dropdown-list .w--current");
      if (toggle && activeChild) {
        toggle.classList.add("w--current");
      }
    });
  }

  function updateMobileOrderBtn() {
    const mobileBtn = document.querySelector(".open-quote-cart.mobile");
    if (mobileBtn) mobileBtn.textContent = getSession() ? "PLACE ORDER" : "GET A QUOTE";

    // Update the nav bar button text (desktop nav combo class open-quote-cart nav-bar)
    const navBtn = document.querySelector(".open-quote-cart.nav-bar");
    if (navBtn) navBtn.textContent = getSession() ? "ORDER" : "GET A QUOTE";
  }

  function moveCartBtnIntoNavbar() {
    if (window.innerWidth > 991) return;
    const btn = document.querySelector(".open-quote-cart-btn");
    const navbar = document.querySelector("section.navbar");
    if (!btn || !navbar) return;
    const hamburger = navbar.querySelector(".mobile-menu-icon");
    if (hamburger) {
      navbar.insertBefore(btn, hamburger);
    } else {
      navbar.appendChild(btn);
    }
  }

  function initMobileNavToggle() {
    const hamburger = document.querySelector(".mobile-menu-icon");
    if (!hamburger) return;
    const closeBtn = document.querySelector(".nav-close-btn");

    hamburger.addEventListener("click", function () {
      hamburger.classList.add("twx-menu-open");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        hamburger.classList.remove("twx-menu-open");
      });
    }

    // Also close when tapping a nav link
    document.querySelectorAll(".nav-menu-mobile a, .nav-menu-mobile .menu-sublink").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("twx-menu-open");
      });
    });
  }

  function injectMobileNavSocials() {
    const navMenu = document.querySelector(".nav-menu-mobile");
    if (!navMenu || document.getElementById("twx-mobile-nav-footer")) return;
    const footer = document.createElement("div");
    footer.id = "twx-mobile-nav-footer";
    footer.className = "twx-mobile-nav-footer";
    footer.innerHTML = `
      <a href="https://www.facebook.com/tillageworx" target="_blank" rel="noopener" class="twx-mobile-social-link" aria-label="Facebook">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7h-2.54v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7c4.78-.75 8.44-4.9 8.44-9.9C22 6.53 17.5 2.04 12 2.04z" fill="currentColor"/></svg>
      </a>
      <a href="https://www.instagram.com/tillageworx/" target="_blank" rel="noopener" class="twx-mobile-social-link" aria-label="Instagram">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2a3.6 3.6 0 0 0-3.6 3.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zM17.25 5.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="currentColor"/></svg>
      </a>
      <a href="/find-a-dealer" class="twx-mobile-social-link" aria-label="Find a Dealer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>
      </a>
    `;
    navMenu.appendChild(footer);
  }

  function initContactPage() {
    if (!window.location.pathname.includes('/contact')) return;

    // Add class to paired field rows so CSS can remove row-gap when they stack on mobile
    document.querySelectorAll(
      '#email-form > .input-outer-container, #email-form > div[style*="flex-wrap"]'
    ).forEach(function (el) {
      el.classList.add('twx-form-row');
    });

    // Wrap the middle hero paragraph in a hideable span (hidden on mobile via CSS)
    // Collects all DOM nodes between </strong> and the "Fill out" text node
    var heroText = document.querySelector('p.hero-text');
    if (!heroText) return;
    var strong = heroText.querySelector('strong');
    if (!strong) return;
    var span = document.createElement('span');
    span.className = 'hero-para-2';
    var nodesToWrap = [];
    var sibling = strong.nextSibling;
    while (sibling) {
      var next = sibling.nextSibling;
      if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent.includes('Fill out')) break;
      nodesToWrap.push(sibling);
      sibling = next;
    }
    if (nodesToWrap.length > 0) {
      heroText.insertBefore(span, nodesToWrap[0]);
      nodesToWrap.forEach(function (n) { span.appendChild(n); });
    }

    // On mobile, swap hero-para-3 text to a shorter version with phone number
    if (window.innerWidth <= 767) {
      var heroPara3 = document.querySelector('.hero-para-3');
      if (heroPara3) {
        heroPara3.textContent = 'Fill out the form below, or give us a call on 08 6185 1944 to chat to someone from the Tillageworx Team.';
      }
    }
  }

  // Contact page form — POST via the Worker instead of Webflow's native
  // form handling. The sitewide honeypot (Section 9) already injects
  // .twx-global-honeypot into every <form> and blocks bot submissions on
  // the capture phase before this listener ever runs; a real submission
  // still forwards the (empty) honeypot value server-side as defense in
  // depth. Field names are read generically from the form so this doesn't
  // need updating if the Webflow form fields are edited later.
  function initContactFormSubmit() {
    if (!window.location.pathname.includes('/contact')) return;
    var form = document.getElementById('email-form');
    if (!form || form.dataset.twxWorkerSubmit) return;
    form.dataset.twxWorkerSubmit = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = new FormData(form);
      var fields = {};
      var honeypot = '';
      formData.forEach(function (value, key) {
        if (key === 'company_website_url') { honeypot = value; return; }
        fields[key] = value;
      });

      var submitBtn = form.querySelector('[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.value : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        if ('value' in submitBtn) submitBtn.value = 'Sending...';
      }

      var formBlock = form.closest('.w-form');

      fetch('https://twx-zoho-proxy.monica-6b5.workers.dev/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ honeypot: honeypot, fields: fields }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Contact form submission failed');
          form.style.display = 'none';
          var success = formBlock && formBlock.querySelector('.w-form-done');
          if (success) success.style.display = 'block';
        })
        .catch(function () {
          var errorEl = formBlock && formBlock.querySelector('.w-form-fail');
          if (errorEl) errorEl.style.display = 'block';
          if (submitBtn) {
            submitBtn.disabled = false;
            if ('value' in submitBtn) submitBtn.value = originalLabel;
          }
        });
    });
  }

  // Run after DOM is ready and after Webflow collection renders
  function init() {
    injectGateStyles();
    gateProductCards();
    gatePartsTemplate();
    injectInfoBarAuth();
    updateMobileOrderBtn();
    injectMobileNavSocials();
    moveCartBtnIntoNavbar();
    initMobileNavToggle();
    activatePartsNav();
    activateDropdownNav();
    initContactPage();
    initContactFormSubmit();

    // Re-run after Webflow collection list renders (it's async)
    const observer = new MutationObserver(() => {
      // Anchor on price elements — present whether or not custom add-btn class exists
      const prices = document.querySelectorAll(".brands-card-price");
      if (prices.length > 0) {
        observer.disconnect();
        gateProductCards();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }

  // Pre-hide prices immediately (synchronous — before DOMContentLoaded)
  // so the CMS collection never flashes prices before the gate runs
  if (GATING_ENABLED && !getSession()) {
    const preHide = document.createElement("style");
    preHide.id = "twx-gate-prehide";
    preHide.textContent = `
      .brands-card-price { display: none !important; }
      .product-price-stk, .product-price { display: none !important; }
    `;
    document.head.appendChild(preHide);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ── 1. CSS INJECTION REMOVED ──────────────────────────────── */
/* CSS is now loaded via <link> tag in Webflow Head Code */

/* ── 2. QUOTE CART + MACHINE WIZARD ──────────────────────── */
(function () {
  "use strict";

  function getSession() {
    try {
      const raw = localStorage.getItem("sb-srgndcoiobilpwbliwgn-auth-token");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.access_token) return null;
      if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /* ── Sale price styles ── */
  (function injectSaleStyles() {
    if (document.getElementById("twx-sale-styles")) return;
    const s = document.createElement("style");
    s.id = "twx-sale-styles";
    s.textContent = `
      .twx-price-was {
        text-decoration: line-through;
        opacity: 0.45;
        margin-right: 6px;
        font-size: 0.85em;
      }
      .twx-price-sale {
        color: #c2934a;
        font-weight: 700;
        margin-right: 6px;
      }
      .twx-sale-badge {
        display: inline-block;
        border: 1px solid #c2934a;
        color: #c2934a;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.12em;
        padding: 2px 6px;
        border-radius: 3px;
        text-transform: uppercase;
        vertical-align: middle;
        position: relative;
        top: -1px;
      }
    `;
    document.head.appendChild(s);
  })();

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
        salePrice: (payload.dataset.salePrice || "").trim(),
        onSale: payload.dataset.onSale === "true",
        code: payloadCode || domCode || btnData.code || "",
        zoho_id: (payload.dataset.zohoId || "").trim(),
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
        salePrice: partData.salePrice || "",
        onSale: partData.onSale || false,
        qty: Math.min(CONFIG.MAX_CART_ITEMS, parseInt(partData.qty) || 1),
        machineContext: partData.machineContext || "",
        zoho_id: partData.zoho_id || "",
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

  /* ── Guest quote modal ── */
  function openGuestQuoteModal() {
    const existing = document.getElementById("twx-gq-modal");
    if (existing) existing.remove();

    const cartSummaryHtml = state.cart
      .map((item) => {
        const qty = Math.max(1, item.qty || 1);
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid #1e1e1e;font-size:12px;font-family:Arial,sans-serif;">
          <span style="color:#ccc;flex:1;padding-right:8px;line-height:1.4;">${escapeHtml(item.name)}</span>
          <span style="color:#686868;flex-shrink:0;">× ${qty}</span>
        </div>`;
      })
      .join("");

    const modal = document.createElement("div");
    modal.id = "twx-gq-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;";

    modal.innerHTML = `
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;width:100%;max-width:480px;padding:28px 24px;position:relative;max-height:90vh;overflow-y:auto;">
        <button id="twx-gq-close" type="button" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#555;font-size:26px;cursor:pointer;line-height:1;padding:0;font-family:Arial,sans-serif;">×</button>

        <div style="font-family:'Oswald',Arial,sans-serif;color:#c2934a;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Submit Your Quote</div>
        <div style="font-family:Arial,sans-serif;color:#686868;font-size:13px;margin-bottom:20px;line-height:1.5;">We'll email you a quote with freight included as soon as possible.</div>

        <div style="margin-bottom:16px;background:#0e0e0e;border:1px solid #1e1e1e;border-radius:8px;padding:12px 14px;">
          <div style="font-family:'Oswald',Arial,sans-serif;font-size:10px;color:#c2934a;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">YOUR QUOTE (${state.cart.length} item${state.cart.length !== 1 ? "s" : ""})</div>
          ${cartSummaryHtml}
        </div>

        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <div style="flex:1;">
            <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">First Name *</label>
            <input id="twx-gq-first" type="text" placeholder="First name" style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;">
          </div>
          <div style="flex:1;">
            <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Last Name</label>
            <input id="twx-gq-last" type="text" placeholder="Last name" style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;">
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Email Address *</label>
          <input id="twx-gq-email" type="email" placeholder="your@email.com" style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;">
        </div>

        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <div style="flex:1;">
            <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Phone Number</label>
            <input id="twx-gq-phone" type="tel" placeholder="04xx xxx xxx" style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;">
          </div>
          <div style="flex:1;">
            <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Delivery Postcode *</label>
            <input id="twx-gq-postcode" type="text" placeholder="e.g. 6430" maxlength="4" style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;">
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Comments / Special Instructions</label>
          <textarea id="twx-gq-comments" rows="3" placeholder="Any special instructions or questions..." style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;resize:vertical;line-height:1.5;"></textarea>
        </div>

        <input id="twx-gq-honeypot" type="text" name="company_website_url" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;">

        <div id="twx-gq-error" style="display:none;color:#e74c3c;font-size:12px;margin-bottom:12px;padding:10px 12px;background:rgba(231,76,60,0.1);border-radius:4px;font-family:Arial,sans-serif;line-height:1.5;"></div>

        <button id="twx-gq-submit" type="button" style="display:block;width:100%;background:#c2934a;border:none;border-radius:6px;color:#111;text-align:center;font-weight:700;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 24px;cursor:pointer;transition:background 0.15s;box-sizing:border-box;">SUBMIT QUOTE →</button>

        <div style="text-align:center;margin-top:14px;font-family:Arial,sans-serif;font-size:12px;color:#444;">
          Already have an account? <a href="/login?return=${encodeURIComponent(window.location.href)}" style="color:#c2934a;text-decoration:none;font-weight:700;">Sign in</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => document.getElementById("twx-gq-first")?.focus(), 100);

    function closeModal() {
      document.getElementById("twx-gq-modal")?.remove();
    }

    document.getElementById("twx-gq-close").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    document.getElementById("twx-gq-submit").addEventListener("click", async function () {
      const firstNameVal = document.getElementById("twx-gq-first")?.value?.trim() || "";
      const lastNameVal = document.getElementById("twx-gq-last")?.value?.trim() || "";
      const emailVal = document.getElementById("twx-gq-email")?.value?.trim() || "";
      const phoneVal = document.getElementById("twx-gq-phone")?.value?.trim() || "";
      const postcodeVal = document.getElementById("twx-gq-postcode")?.value?.trim() || "";
      const commentsVal = document.getElementById("twx-gq-comments")?.value?.trim() || "";
      const errorEl = document.getElementById("twx-gq-error");

      function showErr(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      }

      if (!firstNameVal) { showErr("Please enter your first name."); return; }
      if (!emailVal || !emailVal.includes("@")) { showErr("Please enter a valid email address."); return; }
      if (!postcodeVal || postcodeVal.length < 4) { showErr("Please enter your 4-digit delivery postcode."); return; }

      errorEl.style.display = "none";
      const submitBtn = document.getElementById("twx-gq-submit");
      submitBtn.style.opacity = "0.6";
      submitBtn.style.pointerEvents = "none";
      submitBtn.textContent = "SUBMITTING...";

      const cartJson = JSON.stringify(
        state.cart.map((item) => ({
          SKU: item.code || item.id,
          Name: item.name,
          Quantity: Math.max(1, item.qty || 1),
          ZohoItemID: item.zoho_id || "",
        }))
      );

      const payload = {
        honeypot: document.getElementById("twx-gq-honeypot")?.value || "",
        customer_email: emailVal,
        customer_first_name: firstNameVal,
        customer_last_name: lastNameVal,
        customer_name: [firstNameVal, lastNameVal].filter(Boolean).join(" "),
        customer_phone: phoneVal,
        invoice_postcode: postcodeVal,
        delivery_postcode: postcodeVal,
        notes: commentsVal,
        cart_json: cartJson,
        snapshot: "WEBFLOW",
      };

      try {
        const resp = await fetch("https://twx-zoho-proxy.monica-6b5.workers.dev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          localStorage.removeItem(CONFIG.CART_KEY);
          state.cart = [];
          renderCart();

          const modalInner = modal.querySelector("div");
          modalInner.innerHTML = `
            <div style="text-align:center;padding:20px 0;">
              <div style="font-size:48px;margin-bottom:16px;">✅</div>
              <div style="font-family:'Oswald',Arial,sans-serif;color:#c2934a;font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Quote Submitted!</div>
              <p style="font-family:Arial,sans-serif;color:#ccc;font-size:14px;line-height:1.7;margin-bottom:8px;">
                Thanks ${escapeHtml(firstNameVal)}! We'll email a quote with freight included ASAP.
              </p>
              <p style="font-family:Arial,sans-serif;color:#686868;font-size:13px;margin-bottom:24px;">
                Check your inbox at ${escapeHtml(emailVal)}
              </p>
              <p style="font-family:Arial,sans-serif;color:#888;font-size:13px;margin-bottom:20px;">Questions? Call us on <a href="tel:0861851944" style="color:#c2934a;font-weight:700;">08 6185 1944</a></p>
              <button type="button" id="twx-gq-done" style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:6px;color:#aaa;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;padding:12px 32px;cursor:pointer;">Close</button>
            </div>
          `;
          document.getElementById("twx-gq-done")?.addEventListener("click", closeModal);
        } else {
          throw new Error("Submission failed");
        }
      } catch (err) {
        submitBtn.style.opacity = "";
        submitBtn.style.pointerEvents = "";
        submitBtn.textContent = "SUBMIT QUOTE →";
        showErr("Something went wrong. Please try again or call us on 08 6185 1944.");
      }
    });
  }

  /* ── Member order modal ── */
  function openMemberOrderModal() {
    const session = getSession();
    if (!session) { window.location.href = "/login?return=" + encodeURIComponent(window.location.href); return; }

    const existing = document.getElementById("twx-mo-modal");
    if (existing) existing.remove();

    const cartCount = state.cart.length;
    const cartSummaryHtml = state.cart
      .map((item) => {
        const qty = Math.max(1, item.qty || 1);
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid #1e1e1e;font-size:12px;font-family:Arial,sans-serif;">
          <span style="color:#ccc;flex:1;padding-right:8px;line-height:1.4;">${escapeHtml(item.name)}</span>
          <span style="color:#686868;flex-shrink:0;">× ${qty}</span>
        </div>`;
      })
      .join("");

    const modal = document.createElement("div");
    modal.id = "twx-mo-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;";

    modal.innerHTML = `
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;width:100%;max-width:460px;padding:28px 24px;position:relative;max-height:90vh;overflow-y:auto;">
        <button id="twx-mo-close" type="button" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#555;font-size:26px;cursor:pointer;line-height:1;padding:0;font-family:Arial,sans-serif;">×</button>

        <div style="font-family:'Oswald',Arial,sans-serif;color:#c2934a;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Place Your Order</div>
        <div style="font-family:Arial,sans-serif;color:#686868;font-size:13px;margin-bottom:20px;line-height:1.5;">Once we receive your order request, we'll send you a sales order, including freight, for you to accept. We will always do our best to source the most affordable, reliable freight option.</div>

        <div style="margin-bottom:16px;background:#0e0e0e;border:1px solid #1e1e1e;border-radius:8px;padding:12px 14px;">
          <div style="font-family:'Oswald',Arial,sans-serif;font-size:10px;color:#c2934a;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">YOUR ORDER (${cartCount} item${cartCount !== 1 ? "s" : ""})</div>
          ${cartSummaryHtml}
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#888;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Notes / Special Instructions <span style="color:#444;font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
          <textarea id="twx-mo-notes" rows="3" placeholder="Any special delivery instructions, machine details, or questions..." style="width:100%;padding:9px 11px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;color:#fff;font-size:13px;box-sizing:border-box;font-family:Arial,sans-serif;resize:vertical;line-height:1.5;"></textarea>
        </div>

        <input id="twx-mo-honeypot" type="text" name="company_website_url" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;">

        <div id="twx-mo-error" style="display:none;color:#e74c3c;font-size:12px;margin-bottom:12px;padding:10px 12px;background:rgba(231,76,60,0.1);border-radius:4px;font-family:Arial,sans-serif;line-height:1.5;"></div>

        <div style="display:flex;gap:10px;">
          <button id="twx-mo-cancel" type="button" style="flex:1;background:transparent;border:1px solid #2a2a2a;border-radius:6px;color:#666;font-family:Arial,sans-serif;font-size:13px;padding:13px 16px;cursor:pointer;">Cancel</button>
          <button id="twx-mo-submit" type="button" style="flex:2;background:#c2934a;border:none;border-radius:6px;color:#111;font-weight:700;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:13px 16px;cursor:pointer;">PLACE ORDER →</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => document.getElementById("twx-mo-notes")?.focus(), 100);

    function closeModal() {
      document.getElementById("twx-mo-modal")?.remove();
    }

    document.getElementById("twx-mo-close").addEventListener("click", closeModal);
    document.getElementById("twx-mo-cancel").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    document.getElementById("twx-mo-submit").addEventListener("click", async function () {
      const sess = getSession();
      if (!sess) { window.location.href = "/login?return=" + encodeURIComponent(window.location.href); return; }

      const meta = sess.user?.user_metadata || {};
      const notesVal = document.getElementById("twx-mo-notes")?.value?.trim() || "";
      const errorEl = document.getElementById("twx-mo-error");
      const submitBtn = document.getElementById("twx-mo-submit");

      submitBtn.style.opacity = "0.6";
      submitBtn.style.pointerEvents = "none";
      submitBtn.textContent = "PLACING ORDER...";

      const firstName = meta.first_name || "";
      const lastName = meta.last_name || "";
      const billingStreet = meta.billing_street || "";
      const billingTown = meta.billing_town || "";
      const billingState = meta.billing_state || "";
      const billingPostcode = meta.billing_postcode || "";
      const isSameAddr = meta.same_as_billing !== false;
      const deliveryStreet = isSameAddr ? billingStreet : (meta.delivery_street || billingStreet);
      const deliveryTown = isSameAddr ? billingTown : (meta.delivery_town || billingTown);
      const deliveryState = isSameAddr ? billingState : (meta.delivery_state || billingState);
      const deliveryPostcode = isSameAddr ? billingPostcode : (meta.delivery_postcode || billingPostcode);
      const deliveryAddress = [deliveryStreet, deliveryTown, deliveryState, deliveryPostcode].filter(Boolean).join(", ");

      const cartJson = JSON.stringify(
        state.cart.map((item) => ({
          SKU: item.code || item.id,
          Name: item.name,
          Quantity: Math.max(1, item.qty || 1),
          ZohoItemID: item.zoho_id || "",
        }))
      );

      const payload = {
        honeypot: document.getElementById("twx-mo-honeypot")?.value || "",
        customer_email: sess.user.email || "",
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_name: [firstName, lastName].filter(Boolean).join(" "),
        customer_phone: meta.mobile || "",
        business_name: meta.business_name || "",
        invoice_street: billingStreet,
        invoice_town: billingTown,
        invoice_state: billingState,
        invoice_postcode: billingPostcode,
        delivery_street: deliveryStreet,
        delivery_town: deliveryTown,
        delivery_state: deliveryState,
        delivery_postcode: deliveryPostcode,
        delivery_address: deliveryAddress,
        notes: notesVal,
        cart_json: cartJson,
        snapshot: "PORTAL",
      };

      try {
        const resp = await fetch("https://twx-zoho-proxy.monica-6b5.workers.dev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          const submittedCart = [...state.cart];
          localStorage.removeItem(CONFIG.CART_KEY);
          state.cart = [];
          renderCart();

          // Calculate subtotal from submitted cart
          let subtotal = 0;
          submittedCart.forEach((item) => {
            const qty = Math.max(1, item.qty || 1);
            const onSale = item.onSale === "true" || item.onSale === true;
            const raw = String(onSale ? (item.salePrice || item.price || "") : (item.price || ""));
            subtotal += (parseFloat(raw.replace(/[^0-9.]/g, "")) || 0) * qty;
          });
          const subtotalStr = subtotal > 0 ? `$${subtotal.toFixed(2)}` : "TBA";

          const itemsHtml = submittedCart.map((item) => {
            const qty = Math.max(1, item.qty || 1);
            const onSale = item.onSale === "true" || item.onSale === true;
            const raw = String(onSale ? (item.salePrice || item.price || "") : (item.price || ""));
            const unitPrice = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
            const linePrice = unitPrice ? `$${(unitPrice * qty).toFixed(2)}` : "";
            const imgTag = item.image
              ? `<img src="${escapeHtml(item.image)}" style="width:44px;height:44px;object-fit:cover;border-radius:4px;background:#0e0e0e;flex-shrink:0;" />`
              : `<div style="width:44px;height:44px;background:#1a1a1a;border-radius:4px;flex-shrink:0;"></div>`;
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e1e1e;">
              ${imgTag}
              <span style="color:#ccc;flex:1;font-size:12px;font-family:Arial,sans-serif;line-height:1.4;">${escapeHtml(item.name)}</span>
              <span style="color:#686868;font-size:12px;font-family:Arial,sans-serif;flex-shrink:0;">× ${qty}</span>
              ${linePrice ? `<span style="color:#fff;font-size:12px;font-family:Arial,sans-serif;min-width:60px;text-align:right;">${linePrice}</span>` : ""}
            </div>`;
          }).join("");

          const modalInner = modal.querySelector("div");
          modalInner.innerHTML = `
            <button id="twx-mo-success-close" type="button" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#555;font-size:26px;cursor:pointer;line-height:1;padding:0;font-family:Arial,sans-serif;">×</button>
            <div style="font-family:'Oswald',Arial,sans-serif;color:#c2934a;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Order Submitted!</div>
            <p style="font-family:Arial,sans-serif;color:#686868;font-size:13px;margin-bottom:20px;line-height:1.6;">
              Once we receive your order request, we'll send you a sales order, including freight, for you to accept. We will always do our best to source the most affordable, reliable freight option.
            </p>
            <div style="margin-bottom:12px;background:#0e0e0e;border:1px solid #1e1e1e;border-radius:8px;padding:12px 14px;">
              <div style="font-family:'Oswald',Arial,sans-serif;font-size:10px;color:#c2934a;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">YOUR ORDER (${submittedCart.length} ITEM${submittedCart.length !== 1 ? "S" : ""})</div>
              ${itemsHtml}
            </div>
            <div style="background:#0e0e0e;border:1px solid #1e1e1e;border-radius:8px;padding:12px 14px;margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-family:Arial,sans-serif;font-size:12px;color:#888;">
                <span>Subtotal (ex. GST &amp; freight)</span>
                <span style="color:#fff;">${subtotalStr}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-family:Arial,sans-serif;font-size:12px;color:#888;border-top:1px solid #1e1e1e;margin-top:4px;">
                <span>Freight</span>
                <span style="color:#c2934a;">TBA</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0 2px;font-family:'Oswald',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;border-top:1px solid #2a2a2a;margin-top:4px;">
                <span style="color:#fff;">TOTAL (INCL. GST)</span>
                <span style="color:#c2934a;">TBA</span>
              </div>
            </div>
            <button id="twx-mo-done" type="button" style="width:100%;background:#1e1e1e;border:1px solid #2a2a2a;border-radius:6px;color:#aaa;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 32px;cursor:pointer;">Close</button>
          `;
          document.getElementById("twx-mo-success-close").addEventListener("click", closeModal);
          document.getElementById("twx-mo-done").addEventListener("click", closeModal);
        } else {
          throw new Error("Submission failed");
        }
      } catch (err) {
        errorEl.textContent = "Something went wrong. Please try again or call us on 08 6185 1944.";
        errorEl.style.display = "block";
        submitBtn.style.opacity = "";
        submitBtn.style.pointerEvents = "";
        submitBtn.textContent = "PLACE ORDER →";
      }
    });
  }

  /* ── Cart render ── */
  function renderCart() {
    if (!DOM.cartItems) return;

    // Update header and info text every render
    const cartSectionHeader = DOM.cart?.querySelector(".cart-section-header");
    if (cartSectionHeader) cartSectionHeader.textContent = getSession() ? "Your Order" : "Your Quote";

    const cartInfoEl = DOM.cart?.querySelector(".quote-cart-info");

    const hasItems = state.cart.length > 0;
    DOM.cartItems.style.display = hasItems ? "block" : "none";
    if (DOM.clearBtn) DOM.clearBtn.style.display = hasItems ? "block" : "none";

    if (!hasItems) {
      DOM.cartItems.innerHTML = `<div style="text-align:center;padding:24px 0 8px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#444;letter-spacing:1.5px;text-transform:uppercase;">Your cart is empty</div>`;
      DOM.cartItems.style.display = "block";
      const existing = document.getElementById("cart-pricing-summary");
      if (existing) existing.remove();
      const existingBtn = document.getElementById("cart-proceed-btn");
      if (existingBtn) existingBtn.remove();
      if (cartInfoEl) cartInfoEl.innerHTML = "";
      updateButtons();
      return;
    }

    if (cartInfoEl) cartInfoEl.innerHTML = getSession()
      ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#686868;margin:8px 0 0;line-height:1.5;">Click proceed to confirm your quote.</p>`
      : `<p style="font-family:Arial,sans-serif;font-size:12px;color:#686868;margin:8px 0 0;line-height:1.5;">Click proceed to submit a Sales Order request.</p>`;

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
      const unitSalePrice = item.onSale ? parsePrice(item.salePrice) : null;
      const effectiveUnitPrice =
        unitSalePrice !== null ? unitSalePrice : unitPrice;
      const lineTotal =
        effectiveUnitPrice !== null ? effectiveUnitPrice * safeQty : null;

      if (lineTotal !== null) {
        subtotal += lineTotal;
      } else {
        allPriced = false;
      }

      let priceHtml;
      if (!getSession()) {
        priceHtml = "";
      } else if (effectiveUnitPrice !== null) {
        if (unitSalePrice !== null && unitPrice !== null) {
          priceHtml = `<div class="cart-item-pricing">
             <span class="cart-item-unit-price">
               <span class="twx-price-was">$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
               <span class="twx-price-sale">$${unitSalePrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea</span>
               <span class="twx-sale-badge">SALE</span>
             </span>
             <span class="cart-item-line-total">$${lineTotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>`;
        } else {
          priceHtml = `<div class="cart-item-pricing">
             <span class="cart-item-unit-price">$${effectiveUnitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea</span>
             <span class="cart-item-line-total">$${lineTotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>`;
        }
      } else {
        priceHtml = `<div class="cart-item-pricing"><span class="cart-item-no-price">Price on request</span></div>`;
      }

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
<span class="cart-trash" title="Remove item" role="button" tabindex="0" aria-label="Remove item">
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 2.5C4.8 5.1 7.2 7.0 9.1 9.2C11.2 11.5 13.5 13.8 15.5 15.5" stroke="#c2934a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M15.5 2.5C13.1 5.0 10.9 7.1 9.0 9.0C6.9 11.1 4.7 13.5 2.5 15.5" stroke="#c2934a" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
</span>      `;

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

    const session = getSession();

    if (!session) {
      summary.innerHTML = `
        <div class="cart-summary-note" style="text-align:center;padding:14px 0 6px;line-height:1.7;color:#aaa;font-family:Arial,sans-serif;font-size:13px;">
          <a href="https://customers.tillageworx.com.au/login?return=${encodeURIComponent(window.location.href)}" style="color:#c2934a;text-decoration:none;font-weight:700;">Sign in</a>
          or
          <a href="https://customers.tillageworx.com.au/signup?return=${encodeURIComponent(window.location.href)}" style="color:#c2934a;text-decoration:none;font-weight:700;">Create an Account</a>
          to view pricing and place an order.
        </div>
      `;
    } else if (allPriced && subtotal > 0) {
      const gst = subtotal * 0.1,
        total = subtotal + gst;
      summary.innerHTML = `
        <div class="cart-summary-row"><span>Subtotal</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row"><span>Freight</span><span style="color:#686868;">TBA</span></div>
        <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      `;
    } else if (!allPriced && subtotal > 0) {
      const gst = subtotal * 0.1,
        total = subtotal + gst;
      summary.innerHTML = `
        <div class="cart-summary-row"><span>Subtotal (priced items)</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row"><span>Freight</span><span style="color:#686868;">TBA</span></div>
        <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="cart-summary-note">Some items are price on request — full pricing on next step.</div>
      `;
    } else {
      summary.innerHTML = `<div class="cart-summary-note">Pricing will be confirmed on the next step.</div>`;
    }

    // Always recreate to avoid duplicate event listeners on re-renders
    const existingProceedBtn = document.getElementById("cart-proceed-btn");
    if (existingProceedBtn) existingProceedBtn.remove();

    const proceedBtn = document.createElement("button");
    proceedBtn.id = "cart-proceed-btn";
    proceedBtn.type = "button";
    summary.parentNode.insertBefore(proceedBtn, summary.nextSibling);

    if (!session) {
      proceedBtn.textContent = "PROCEED WITH QUOTE";
      proceedBtn.addEventListener("click", openGuestQuoteModal);
    } else {
      proceedBtn.textContent = "PROCEED";
      proceedBtn.addEventListener("click", openMemberOrderModal);
    }

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

    const wizContainer = document.createElement("div");
    wizContainer.id = "machine-wizard-container";
    wizContainer.innerHTML = `<div id="wiz-breadcrumbs"></div><div id="wiz-active-step"></div>`;
    DOM.addBox.insertBefore(wizContainer, DOM.browseBtn?.nextSibling);

    const header = document.createElement("div");
    header.className = "wizard-main-header";
    header.textContent = "Find parts for my machine";
    wizContainer.prepend(header);

    DOM.wizContainer = wizContainer;
    DOM.breadcrumbs = document.getElementById("wiz-breadcrumbs");
    DOM.activeStep = document.getElementById("wiz-active-step");

    const quoteHeader = document.createElement("div");
    quoteHeader.className = "cart-section-header";
    quoteHeader.textContent = "Your Quote";
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
    header.textContent = `Quote Parts for ${activeModel.fullName} ${config.size}`;
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
    addAllBtn.textContent = getSession() ? "Add All Items to Order" : "Add All Items to Quote";
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
      const wizSession = getSession();
      const btnText = inCart ? "Update" : (wizSession ? "Add to Order" : "Add to Quote");
      const btnClass = inCart ? "wiz-add-btn wiz-update-btn" : "wiz-add-btn";

      // Display unit price on the wizard line for logged-in users only
      let unitPrice = null;
      let unitSalePrice = null;
      try {
        const n = parseFloat(String(part.price || "").replace(/[^0-9.]/g, ""));
        unitPrice = isNaN(n) ? null : n;
        if (part.onSale && part.salePrice) {
          const s = parseFloat(String(part.salePrice).replace(/[^0-9.]/g, ""));
          unitSalePrice = isNaN(s) ? null : s;
        }
      } catch (e) {
        unitPrice = null;
      }
      let priceHtml = "";
      if (wizSession) {
        if (unitSalePrice !== null && unitPrice !== null) {
          priceHtml = `<div class="wiz-result-price">
            <span class="twx-price-was">$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="twx-price-sale">$${unitSalePrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea</span>
            <span class="twx-sale-badge">SALE</span>
          </div>`;
        } else if (unitPrice !== null) {
          priceHtml = `<div class="wiz-result-price">$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea</div>`;
        }
      }

      row.innerHTML = `
        ${part.image ? `<img src="${part.image}" class="wiz-result-img" alt="">` : ""}
        <div class="wiz-result-info">
          <span class="wiz-result-name">${escapeHtml(part.name)}</span>
          <div style="font-size:0.7em;color:#888;">Compatible with: ${escapeHtml(activeModel.fullName)}</div>
          ${priceHtml}
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
        '<div style="color:#888;text-align:center;padding:10px;">All parts added to quote!</div>';
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
          salePrice: part.salePrice || "",
          onSale: part.onSale || false,
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
    // ── Personalise cart header with customer's first name ──
    try {
      const raw = localStorage.getItem("sb-srgndcoiobilpwbliwgn-auth-token");
      if (raw) {
        const session = JSON.parse(raw);
        const firstName = session?.user?.user_metadata?.first_name;
        if (firstName) {
          let cartHeader = document.getElementById("twx-cart-header");
          if (!cartHeader) {
            cartHeader = document.createElement("div");
            cartHeader.id = "twx-cart-header";
            cartHeader.style.cssText =
              "padding:16px 16px 0;font-size:13px;font-weight:700;color:#c9a84c;letter-spacing:1px;text-transform:uppercase;";
            DOM.cart.querySelector(".quote-cart-content")?.prepend(cartHeader);
          }
          cartHeader.textContent = `${firstName.toUpperCase()}'S CART`;
        }
      }
    } catch (_e) {}
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
            salePrice: part.salePrice || "",
            onSale: part.onSale || false,
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
    log("Adding to quote:", productName);
    const card = btn.closest(
      ".carousel-item, .product-card, .brands-product-card, .w-dyn-item",
    );

    let imageUrl = btn.getAttribute("data-image");

    // Also check the part-data-payload within the card
    if (!imageUrl && card) {
      const payload = card.querySelector(".part-data-payload");
      if (payload) imageUrl = payload.dataset.image;
    }

    if (!imageUrl && card) {
      const hiddenImg = card.querySelector(".hidden-image-url");
      if (hiddenImg) imageUrl = hiddenImg.textContent.trim();
    }
    if (!imageUrl && card) {
      const img = card.querySelector("img");
      if (img) imageUrl = img.src;
    }

    let productId = btn.getAttribute("data-id");
    let code = btn.getAttribute("data-code") || "";
    let price = btn.getAttribute("data-price") || "";
    let salePrice = btn.getAttribute("data-sale-price") || "";
    let onSale = btn.getAttribute("data-on-sale") === "true";
    let zoho_id = "";

    // Fallback: read onSale and salePrice from hidden embed divs
    // (Switch fields can't be bound directly to data- attributes in Webflow)
    if (!onSale && card) {
      const hiddenOnSale = card.querySelector(".hidden-on-sale");
      if (hiddenOnSale) onSale = hiddenOnSale.textContent.trim() === "true";
    }
    if (!salePrice && card) {
      const hiddenSalePrice = card.querySelector(".hidden-sale-price");
      if (hiddenSalePrice) salePrice = hiddenSalePrice.textContent.trim();
    }

    const canonicalPart = indexes.partsByName.get(productName.toLowerCase());
    if (canonicalPart) {
      productId = canonicalPart.id;
      productName = canonicalPart.name;
      if (!imageUrl) imageUrl = canonicalPart.image;
      if (!code) code = canonicalPart.code || "";
      if (!price) price = canonicalPart.price || "";
      if (!salePrice) salePrice = canonicalPart.salePrice || "";
      if (!onSale) onSale = canonicalPart.onSale || false;
      zoho_id = canonicalPart.zoho_id || "";
    }

    const part = {
      id: productId || productName,
      name: productName,
      code: code,
      price: price,
      salePrice: salePrice,
      onSale: onSale,
      image: imageUrl || "",
      qty: 1,
      zoho_id: zoho_id,
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
      <div class="cart-section-header">Your Quote</div>
      <div id="cart-items" class="quote-cart-items"></div>
      <button id="cart-clearall">Clear Quote</button>
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
    // Auto-open cart if URL contains ?cart=open
    if (new URLSearchParams(window.location.search).get("cart") === "open") {
      setTimeout(showCart, 500);
    }

    log("Initialized in", `${(performance.now() - startTime).toFixed(2)}ms`);
  }

  window.renderCart = renderCart;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ── 3. QUOTE REVIEW — cart table + summary on /quote-review ─ */
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
      if (formSection) formSection.style.display = "none";
      if (flexRow) flexRow.style.display = "none";
      tableContainer.style.display = "none";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    // Layout is handled entirely by CSS — do not set inline flex styles here
    // as they override media queries and break mobile layout.
    if (flexRow) {
      flexRow.style.display = "flex";
    }
    if (formSection) {
      formSection.style.display = "block";
    }
    if (rightCol) {
      rightCol.style.display = ""; // Let CSS control this entirely
    }
    if (heroLeft) {
      heroLeft.style.width = "100%";
      heroLeft.style.maxWidth = "none";
    }

    let subtotal = 0;
    let allPriced = true;
    let rows = "";

    cart.forEach((item) => {
      const safeQty = Math.max(1, item.qty || 1);
      const unitPrice = parsePrice(item.price);
      const unitSalePrice = item.onSale ? parsePrice(item.salePrice) : null;
      const effectiveUnitPrice =
        unitSalePrice !== null ? unitSalePrice : unitPrice;
      const lineTotal =
        effectiveUnitPrice !== null ? effectiveUnitPrice * safeQty : null;

      if (lineTotal !== null) {
        subtotal += lineTotal;
      } else {
        allPriced = false;
      }

      const lineTotalHtml =
        lineTotal !== null
          ? `$${lineTotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `<span style="color:#888;font-style:italic;">TBC</span>`;

      let unitPriceHtml;
      if (unitSalePrice !== null && unitPrice !== null) {
        unitPriceHtml = `
          <span class="twx-price-was">$${unitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="twx-price-sale">$${unitSalePrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="twx-sale-badge">SALE</span>`;
      } else if (effectiveUnitPrice !== null) {
        unitPriceHtml = `$${effectiveUnitPrice.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        unitPriceHtml = `<span style="color:#888">TBC</span>`;
      }

      rows += `
        <tr data-item-id="${escapeHtml(item.id)}">
          <td>
            ${item.image ? `<img src="${escapeHtml(item.image)}" class="qr-item-img" alt="">` : ""}
            <div class="qr-item-name">${escapeHtml(item.name)}</div>
            ${item.code && item.code !== item.id ? `<div class="qr-item-code">Product Code: ${escapeHtml(item.code)}</div>` : ""}
          </td>
          <td>${unitPriceHtml}</td>
          <td>
            <div class="qr-qty-controls">
              <button class="qr-qty-btn qr-qty-minus" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
              <span class="qr-qty-value">${safeQty}</span>
              <button class="qr-qty-btn qr-qty-plus" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
            </div>
          </td>
          <td>${lineTotalHtml}</td>
          <td style="width:32px;text-align:center;padding:14px 8px 14px 4px;">
            <button class="qr-remove-btn" data-id="${escapeHtml(item.id)}" aria-label="Remove item">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 2.5C4.8 5.1 7.2 7.0 9.1 9.2C11.2 11.5 13.5 13.8 15.5 15.5" stroke="#c2934a" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M15.5 2.5C13.1 5.0 10.9 7.1 9.0 9.0C6.9 11.1 4.7 13.5 2.5 15.5" stroke="#c2934a" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </td>
        </tr>`;
    });

    // Prepare totals for the mobile dropdown button
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    const mobileTotalText = allPriced
      ? `$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (TBC)`;

    // ── Mobile toggle button ──
    // Always ensure it's the first child of rightCol, creating it if needed.
    // On re-renders (qty changes etc.) we move it back to first position.
    let toggleBtn = document.getElementById("qr-mobile-toggle");
    if (!toggleBtn && rightCol) {
      toggleBtn = document.createElement("button");
      toggleBtn.id = "qr-mobile-toggle";
      toggleBtn.className = "qr-mobile-toggle";

      toggleBtn.addEventListener("click", () => {
        const currentlyExpanded = toggleBtn.classList.toggle("expanded");
        if (tableContainer)
          tableContainer.classList.toggle("expanded", currentlyExpanded);
        if (summaryContainer)
          summaryContainer.classList.toggle("expanded", currentlyExpanded);
      });
    }

    // Always keep toggle as the first child of rightCol so it sits
    // above the summary content on mobile
    if (toggleBtn && rightCol) {
      if (rightCol.firstChild !== toggleBtn) {
        rightCol.insertBefore(toggleBtn, rightCol.firstChild);
      }
    }

    if (toggleBtn) {
      // Re-apply expanded state to containers in case DOM was re-rendered
      const isExpanded = toggleBtn.classList.contains("expanded");
      if (tableContainer)
        tableContainer.classList.toggle("expanded", isExpanded);
      if (summaryContainer)
        summaryContainer.classList.toggle("expanded", isExpanded);

      toggleBtn.innerHTML = `
        <span style="display:flex;align-items:center;gap:8px;">
          ORDER SUMMARY
          <svg class="qr-mobile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
        <span class="qr-mobile-total">${mobileTotalText}</span>
      `;
    }

    tableContainer.innerHTML = `
      <table class="qr-parts-table">
        <thead>
          <tr><th>Part</th><th>Unit Price</th><th>Qty</th><th>Total</th><th></th></tr>
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
      let summaryHtml = "";

      if (subtotal > 0) {
        summaryHtml = `
          <div class="qr-summary-row"><span>${allPriced ? "Subtotal" : "Subtotal (priced items)"}</span><span>$${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-summary-row"><span>Freight</span><span style="color:#888;font-style:italic;">TBA</span></div>
          <div class="qr-summary-row qr-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="qr-freight-disclaimer">Once we receive your request, we will do our best to source the most affordable, reliable freight option.<br><br>We will then email you a Quote with freight included for you to accept.<br><br><span class="qr-freight-phone">📞 Questions? Call us on 08 6185 1944</span></div>
        `;
        if (!allPriced)
          summaryHtml += `<div class="qr-summary-note" style="margin-top:8px;">Some items are price on request — our team will confirm final pricing before processing your quote.</div>`;
      } else {
        summaryHtml = `<div class="qr-summary-note">Our team will confirm pricing before processing your quote.</div>`;
      }

      summaryContainer.innerHTML = summaryHtml;
    }
  }

  /* ── 4. QUOTE FORM — direct Zoho Flow webhook submission ─── */
  function initQRForm() {
    const sec = document.getElementById("qr-form-section");
    if (!sec || sec.dataset.qrFormInit) return;
    sec.dataset.qrFormInit = "1";

    const g = (id) => document.getElementById(id);
    const gv = (id) => (g(id)?.value || "").trim();

    const firstName = g("qr-first-name");
    const lastName = g("qr-last-name");
    const email = g("qr-email");
    const phone = g("qr-phone");
    const business = g("qr-business");
    const notes = g("qr-notes");
    if (!firstName) return;

    // ── Hide native single-line address field left over from Webflow form ──
    const nativeAddress = g("qr-address");
    if (nativeAddress) {
      const nativeAddrContainer =
        nativeAddress.closest(".input-container") ||
        nativeAddress.parentElement;
      if (nativeAddrContainer) nativeAddrContainer.style.display = "none";
      const nativeAddrLabel = document.querySelector('label[for="qr-address"]');
      if (nativeAddrLabel) nativeAddrLabel.style.display = "none";
    }

    // ── Styled input factory ──
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

    // ── Gold label factory ──
    const mkLabel = (text) => {
      const lbl = document.createElement("label");
      lbl.style.cssText =
        "display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;margin-bottom:5px;margin-top:4px";
      lbl.textContent = text;
      return lbl;
    };

    // ── Wrap existing input in a flex child ──
    const wrapEl = (el) => {
      let container = el.closest(".input-container") || el.parentElement;
      if (!container || container === sec || container.tagName === "FORM")
        container = el;
      const d = document.createElement("div");
      d.style.cssText = "flex:1 1 0%;min-width:0";
      if (container.parentNode) {
        container.parentNode.insertBefore(d, container);
      }
      d.appendChild(container);
      return d;
    };

    // ── Name row (First + Last side by side) ──
    if (firstName) {
      const firstNameContainer =
        firstName.closest(".input-container") || firstName.parentElement;
      if (firstNameContainer && firstNameContainer.parentNode) {
        const nameRow = document.createElement("div");
        nameRow.className = "qr-name-row";
        firstNameContainer.parentNode.insertBefore(nameRow, firstNameContainer);
        nameRow.appendChild(wrapEl(firstName));
        if (lastName) nameRow.appendChild(wrapEl(lastName));
      }
    }

    // ── Contact row (Email + Phone side by side) ──
    if (email) {
      const emailContainer =
        email.closest(".input-container") || email.parentElement;
      if (emailContainer && emailContainer.parentNode) {
        const contactRow = document.createElement("div");
        contactRow.className = "qr-contact-row";
        emailContainer.parentNode.insertBefore(contactRow, emailContainer);
        contactRow.appendChild(wrapEl(email));
        if (phone) contactRow.appendChild(wrapEl(phone));
      }
    }

    // ── Invoicing address block ──
    if (business && business.parentNode) {
      const invBlock = document.createElement("div");
      business.parentNode.insertBefore(invBlock, business.nextSibling);

      invBlock.appendChild(mkLabel("Invoicing Address"));
      invBlock.appendChild(
        mkInput({
          type: "text",
          id: "qr-invoice-street",
          name: "Invoice Street",
          placeholder: "Street Address",
        }),
      );

      const invRow = document.createElement("div");
      invRow.className = "qr-addr-row";
      const invTownWrap = document.createElement("div");
      invTownWrap.className = "qr-addr-town";
      invTownWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-invoice-town",
          name: "Invoice Town",
          placeholder: "Town / City",
        }),
      );
      const invStateWrap = document.createElement("div");
      invStateWrap.className = "qr-addr-state";
      invStateWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-invoice-state",
          name: "Invoice State",
          placeholder: "State",
        }),
      );
      const invPostWrap = document.createElement("div");
      invPostWrap.className = "qr-addr-postcode";
      invPostWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-invoice-postcode",
          name: "Invoice Postcode",
          placeholder: "Postcode",
        }),
      );
      invRow.appendChild(invTownWrap);
      invRow.appendChild(invStateWrap);
      invRow.appendChild(invPostWrap);
      invBlock.appendChild(invRow);

      // ── Delivery address toggle ──
      const addrBlock = document.createElement("div");
      invBlock.parentNode.insertBefore(addrBlock, invBlock.nextSibling);

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

      const delWrapper = document.createElement("div");
      delWrapper.className = "qr-delivery-input-wrapper";
      delWrapper.appendChild(mkLabel("Delivery Address"));
      delWrapper.appendChild(
        mkInput({
          type: "text",
          id: "qr-delivery-street",
          name: "Delivery Street",
          placeholder: "Street Address / Depot Name",
        }),
      );
      const delRow = document.createElement("div");
      delRow.className = "qr-addr-row";
      const delTownWrap = document.createElement("div");
      delTownWrap.className = "qr-addr-town";
      delTownWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-delivery-town",
          name: "Delivery Town",
          placeholder: "Town / City",
        }),
      );
      const delStateWrap = document.createElement("div");
      delStateWrap.className = "qr-addr-state";
      delStateWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-delivery-state",
          name: "Delivery State",
          placeholder: "State",
        }),
      );
      const delPostWrap = document.createElement("div");
      delPostWrap.className = "qr-addr-postcode";
      delPostWrap.appendChild(
        mkInput({
          type: "text",
          id: "qr-delivery-postcode",
          name: "Delivery Postcode",
          placeholder: "Postcode",
        }),
      );
      delRow.appendChild(delTownWrap);
      delRow.appendChild(delStateWrap);
      delRow.appendChild(delPostWrap);
      delWrapper.appendChild(delRow);

      addrBlock.appendChild(sameRow);
      addrBlock.appendChild(delWrapper);

      cb.addEventListener("change", () => {
        delWrapper.classList.toggle("visible", cb.checked);
        if (!cb.checked) {
          [
            "qr-delivery-street",
            "qr-delivery-town",
            "qr-delivery-state",
            "qr-delivery-postcode",
          ].forEach((id) => {
            const el = g(id);
            if (el) el.value = "";
          });
        }
      });
    }

    // ── Space above Notes ──
    if (notes) {
      const notesContainer =
        notes.closest(".input-container") || notes.parentElement;
      if (notesContainer) {
        notesContainer.style.marginTop = "24px";
      }
    }

    // ── Honeypot (invisible to humans, catches bots) ──
    const honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.id = "qr-honeypot";
    honeypot.name = "website";
    honeypot.autocomplete = "off";
    honeypot.tabIndex = -1;
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
    sec.appendChild(honeypot);

    // ── Submit button reference ──
    const submitBtn = g("qr-submit-btn") || sec.querySelector("#qr-submit-btn");
    if (!submitBtn) return;

    // ── T&C checkbox (inserted just before submit button) ──
    const tcRow = document.createElement("div");
    tcRow.className = "qr-tc-row";
    tcRow.style.cssText =
      "display:flex; align-items:center; gap:10px; margin-top:16px; margin-bottom:16px;";

    const tcCb = document.createElement("input");
    tcCb.type = "checkbox";
    tcCb.id = "qr-terms";
    tcCb.style.cssText =
      "margin:0; width:16px; height:16px; flex-shrink:0; cursor:pointer; accent-color:#c2934a;";

    const tcLbl = document.createElement("label");
    tcLbl.setAttribute("for", "qr-terms");
    tcLbl.style.cssText =
      "margin:0; font-size:13px; color:#ccc; cursor:pointer; text-transform:none; letter-spacing:0; font-weight:normal;";
    tcLbl.innerHTML =
      'I agree to the <a href="/terms-and-conditions" target="_blank" style="color:#c2934a;">Terms &amp; Conditions</a>';
    tcRow.appendChild(tcCb);
    tcRow.appendChild(tcLbl);
    submitBtn.parentNode.insertBefore(tcRow, submitBtn);

    // ── Error message helper ──
    const showError = (msg) => {
      let err = sec.querySelector(".qr-submit-error");
      if (!err) {
        err = document.createElement("div");
        err.className = "qr-submit-error";
        err.style.cssText =
          "margin-top:16px;padding:14px 18px;background:rgba(220,50,50,0.1);border-left:3px solid #e05050;border-radius:0 6px 6px 0;color:#e08080;font-size:13px;";
        submitBtn.parentNode.insertBefore(err, submitBtn.nextSibling);
      }
      err.textContent = msg;
      err.style.display = "block";
    };

    const clearError = () => {
      const err = sec.querySelector(".qr-submit-error");
      if (err) err.style.display = "none";
    };

    // ── Submit handler ──
    submitBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      clearError();

      // Honeypot check — silent bot block
      if (g("qr-honeypot")?.value) return;

      // Validation
      const firstNameVal = gv("qr-first-name");
      const emailVal = gv("qr-email");

      if (!firstNameVal) {
        showError("Please enter your first name.");
        g("qr-first-name")?.focus();
        return;
      }
      if (!emailVal) {
        showError("Please enter your email address.");
        g("qr-email")?.focus();
        return;
      }
      if (!g("qr-terms")?.checked) {
        showError("Please agree to the Terms & Conditions to proceed.");
        return;
      }

      // Cart check
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("tillageworx_quote_cart")) || [];
      } catch (err) {}
      if (!cart.length) {
        showError("Your cart is empty.");
        return;
      }

      // Delivery address — mirrors invoice if same
      const diffDelivery = g("qr-diff-delivery")?.checked;
      const deliveryStreet = diffDelivery
        ? gv("qr-delivery-street")
        : gv("qr-invoice-street");
      const deliveryTown = diffDelivery
        ? gv("qr-delivery-town")
        : gv("qr-invoice-town");
      const deliveryState = diffDelivery
        ? gv("qr-delivery-state")
        : gv("qr-invoice-state");
      const deliveryPostcode = diffDelivery
        ? gv("qr-delivery-postcode")
        : gv("qr-invoice-postcode");
      const deliveryAddress = [
        deliveryStreet,
        deliveryTown,
        deliveryState,
        deliveryPostcode,
      ]
        .filter(Boolean)
        .join(", ");

      // Cart JSON for Zoho line items
      const cartJson = JSON.stringify(
        cart.map((item) => ({
          SKU: item.code || item.id,
          Name: item.name,
          Quantity: Math.max(1, item.qty || 1),
          ZohoItemID: item.zoho_id || "",
        })),
      );

      // Snapshot — human-readable quote summary stored on the Quote
      const notesVal = gv("qr-notes");

      // Hardcoded to strictly alphanumeric string per Zoho Inventory custom field restrictions
      const snapshot = "WEBFLOW";

      // ── Build payload — field names must match Zoho Flow exactly ──
      const payload = {
        honeypot: g("qr-honeypot")?.value || "",
        customer_email: emailVal,
        customer_first_name: firstNameVal,
        customer_last_name: gv("qr-last-name"),
        customer_name: [firstNameVal, gv("qr-last-name")]
          .filter(Boolean)
          .join(" "),
        customer_phone: gv("qr-phone"),
        business_name: gv("qr-business"),
        invoice_street: gv("qr-invoice-street"),
        invoice_town: gv("qr-invoice-town"),
        invoice_state: gv("qr-invoice-state"),
        invoice_postcode: gv("qr-invoice-postcode"),
        delivery_street: deliveryStreet,
        delivery_town: deliveryTown,
        delivery_state: deliveryState,
        delivery_postcode: deliveryPostcode,
        delivery_address: deliveryAddress,
        notes: notesVal,
        cart_json: cartJson,
        snapshot: snapshot,
      };

      // Disable button during submit
      submitBtn.style.opacity = "0.6";
      submitBtn.style.pointerEvents = "none";
      submitBtn.textContent = "SUBMITTING...";

      try {
        const response = await fetch(
          "https://twx-zoho-proxy.monica-6b5.workers.dev",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (response.ok) {
          // Clear cart
          localStorage.removeItem("tillageworx_quote_cart");
          if (window.renderCart) window.renderCart();

          // Show success screen
          sec.innerHTML = `
            <div style="padding:40px 24px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">✅</div>
              <h3 style="color:#c2934a;font-size:20px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">
                Quote Requested!
              </h3>
              <p style="color:#ccc;font-size:15px;line-height:1.7;margin-bottom:24px;">
                Thanks ${firstNameVal}, your quote request has been received!<br>
                We'll email you a Quote with freight included ASAP.
              </p>
              <p style="color:#888;font-size:13px;">
                Questions? Call us on <a href="tel:0861851944" style="color:#c2934a;font-weight:700;">08 6185 1944</a>
              </p>
            </div>
          `;
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          throw new Error("Proxy submission failed");
        }
      } catch (err) {
        console.error("[TWX] Submission error:", err);
        submitBtn.style.opacity = "";
        submitBtn.style.pointerEvents = "";
        submitBtn.textContent = "SUBMIT QUOTE";
        showError(
          "Something went wrong. Please try again or call us on 08 6185 1944.",
        );
      }
    });
  }

  const initQuotePage = () => {
    renderQuoteReview();
    try {
      initQRForm();
    } catch (e) {
      console.error("Error initializing quote review form:", e);
    }
    // Reveal the form once all JS styling is successfully applied
    const outerBlock = document.getElementById("quote-form-block");
    if (outerBlock) outerBlock.classList.add("qr-ready");
    const innerSection = document.getElementById("qr-form-section");
    if (innerSection) innerSection.classList.add("qr-ready");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuotePage);
  } else {
    initQuotePage();
  }
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

/* ── 6. MOBILE MENU — close button + auto-open dropdown ───── */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Close button
    var closeBtn = document.querySelector(".nav-close-btn");
    var navMenu = document.querySelector(".nav-menu-mobile");
    var hamburger = document.querySelector(".mobile-menu-icon");

    if (closeBtn && navMenu && hamburger) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        // Webflow controls the menu via inline styles, not classes.
        // Reverse the open state by setting the closed inline styles directly.
        navMenu.style.display = "none";
        navMenu.style.opacity = "0";
        navMenu.style.transform =
          "translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)";
        // Also click the hamburger to keep Webflow's internal open/close
        // state in sync so it toggles correctly next time
        hamburger.click();
      });
    }

    // Auto-open dropdown if active subpage
    if (!navMenu) return;
    var activeSublink = navMenu.querySelector(".menu-sublink.w--current");
    if (!activeSublink) return;
    var dropdown = activeSublink.closest(".w-dropdown");
    if (!dropdown) return;
    var toggle = dropdown.querySelector(".w-dropdown-toggle");
    var list = dropdown.querySelector(".w-dropdown-list");
    if (toggle && list) {
      toggle.classList.add("w--open");
      list.classList.add("w--open");
      dropdown.classList.add("w--open");
    }
  });
})();

/* ── 7. CONTACT FORM STYLING ─────────────────────────────── */
(function () {
  if (!window.location.pathname.includes("/contact")) return;

  function styleContactForm() {
    const form = document.querySelector(".w-form form");
    if (!form) return;

    // Style the form wrapper
    const formBlock = form.closest(".w-form");
    if (formBlock) {
      formBlock.style.cssText =
        "background:#0e0e0e;padding:32px;border-radius:8px;border:1px solid #1c1c1c";
    }

    // Find fields dynamically to handle Webflow ID changes
    const getField = (selectors) => {
      for (let sel of selectors) {
        const el = form.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const fnField = getField([
      "#First-Name",
      "#first-name",
      "#name",
      'input[name*="First"]',
      'input[name*="first"]',
    ]);
    const lnField = getField([
      "#Last-Name",
      "#last-name",
      "#name-2",
      'input[name*="Last"]',
      'input[name*="last"]',
    ]);
    const emField = getField(["#Email", "#email", 'input[type="email"]']);
    const phField = getField([
      "#Phone-Number",
      "#phone",
      "#Phone",
      'input[type="tel"]',
      'input[name*="Phone"]',
      'input[name*="phone"]',
    ]);
    const msgField = getField(["#Message", "#message", "#field", "textarea"]);

    // Add gold labels above each field, hide native labels
    const fieldConfig = [
      { el: fnField, label: "First Name" },
      { el: lnField, label: "Last Name" },
      { el: emField, label: "Email Address" },
      { el: phField, label: "Phone Number" },
      { el: msgField, label: "Message" },
    ];

    fieldConfig.forEach(({ el, label }) => {
      if (!el) return;

      const existingLbl = form.querySelector(`label[for="${el.id}"]`);
      if (existingLbl && !existingLbl.classList.contains("twx-styled-lbl")) {
        existingLbl.style.display = "none";
      }

      const lbl = document.createElement("label");
      lbl.className = "twx-styled-lbl";
      lbl.setAttribute("for", el.id || "");
      lbl.textContent = label;
      lbl.style.cssText =
        "display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;margin-bottom:5px;margin-top:12px";
      el.parentNode.insertBefore(lbl, el);
    });

    // Helper to wrap two fields side-by-side
    const wrapSideBySide = (el1, el2) => {
      if (!el1 || !el2) return;

      // Grab the immediate wrapper (.input-container)
      const wrap1 = el1.closest(".input-container") || el1.parentElement;
      const wrap2 = el2.closest(".input-container") || el2.parentElement;

      if (!wrap1 || !wrap2) return;

      // If Webflow already grouped them in an .input-outer-container (like First/Last Name)
      const sharedOuter = wrap1.parentElement;
      if (
        sharedOuter &&
        sharedOuter === wrap2.parentElement &&
        sharedOuter.classList.contains("input-outer-container")
      ) {
        sharedOuter.style.cssText +=
          ";display:flex;flex-wrap:wrap;gap:16px;width:100%;";
        wrap1.style.cssText += ";flex:1 1 200px;min-width:0;margin-bottom:0;";
        wrap2.style.cssText += ";flex:1 1 200px;min-width:0;margin-bottom:0;";
        return;
      }

      // If they are in separate containers (like Email/Phone), wrap them in a new flex row
      if (wrap1 !== wrap2) {
        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;flex-wrap:wrap;gap:16px;width:100%;margin-bottom:12px;";

        wrap1.style.cssText += ";flex:1 1 200px;min-width:0;margin-bottom:0;";
        wrap2.style.cssText += ";flex:1 1 200px;min-width:0;margin-bottom:0;";

        wrap1.parentNode.insertBefore(row, wrap1);
        row.appendChild(wrap1);
        row.appendChild(wrap2);
      }
    };

    // Wrap First/Last Name and Email/Phone side by side
    wrapSideBySide(fnField, lnField);
    wrapSideBySide(emField, phField);

    // Style all inputs and textarea
    form
      .querySelectorAll(
        "input[type=text], input[type=email], input[type=tel], textarea",
      )
      .forEach((el) => {
        el.style.cssText =
          "width:100%;box-sizing:border-box;background:#1a1a1a;color:#fff;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.4;transition:border-color 0.2s,box-shadow 0.2s;margin-bottom:12px;display:block";
        el.addEventListener("focus", () => {
          el.style.borderColor = "#c2934a";
          el.style.boxShadow = "0 0 0 3px rgba(194,147,74,0.15)";
          el.style.outline = "none";
        });
        el.addEventListener("blur", () => {
          el.style.borderColor = "#3a3a3a";
          el.style.boxShadow = "";
        });
      });

    // Style submit button
    const submit = form.querySelector("input[type=submit]");
    if (submit) {
      submit.style.cssText =
        "width:100%;background:linear-gradient(135deg,#b8833e 0%,#d4a55c 40%,#e8b86d 60%,#c2934a 100%);background-size:200% auto;color:#111;font-size:14px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:none;border-radius:8px;padding:18px 24px;cursor:pointer;margin-top:8px;box-shadow:0 4px 20px rgba(194,147,74,0.4);display:block";
      submit.addEventListener("mouseover", () => {
        submit.style.backgroundPosition = "right center";
        submit.style.boxShadow = "0 6px 28px rgba(194,147,74,0.55)";
        submit.style.transform = "translateY(-1px)";
      });
      submit.addEventListener("mouseout", () => {
        submit.style.backgroundPosition = "";
        submit.style.boxShadow = "0 4px 20px rgba(194,147,74,0.4)";
        submit.style.transform = "";
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", styleContactForm);
  } else {
    styleContactForm();
  }
})();

/* ── 9. GLOBAL SPAM HONEYPOT ─────────────────────────────── */
(function () {
  function initGlobalHoneypot() {
    // Target all Webflow forms (and any other forms) across the site
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      // Don't add if already present
      if (form.querySelector(".twx-global-honeypot")) return;

      // Create the invisible honeypot field
      const honeypot = document.createElement("input");
      honeypot.type = "text";
      honeypot.name = "company_website_url"; // Bait for bots
      honeypot.className = "twx-global-honeypot";
      honeypot.tabIndex = -1;
      honeypot.autocomplete = "off";
      honeypot.setAttribute("aria-hidden", "true");
      honeypot.style.cssText =
        "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

      form.appendChild(honeypot);

      // Intercept the submit event on the capture phase
      form.addEventListener(
        "submit",
        function (e) {
          if (honeypot.value.trim() !== "") {
            // If a bot filled it out, quietly kill the submission
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("[TWX] Blocked automated spam submission.");

            // Show Webflow's native success message to trick the bot
            const formBlock = form.closest(".w-form");
            if (formBlock) {
              form.style.display = "none";
              const success = formBlock.querySelector(".w-form-done");
              if (success) success.style.display = "block";
            }
          }
        },
        true, // Use capture phase to intercept before Webflow's native scripts process it
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalHoneypot);
  } else {
    initGlobalHoneypot();
  }
})();

/* ── 7. ABOUT PAGE — cinematic rebuild ───────────────────── */
(function () {
  if (!window.location.pathname.includes("/about-us")) return;

  // ── Inject styles ──
  const style = document.createElement("style");
  style.textContent = `
    .twx-about { font-family: inherit; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; margin: 24px 1.75rem 48px; }

    /* Hero */
    .twx-about-hero {
      min-height: 70vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 100px 8vw 60px !important;
      position: relative;
      overflow: hidden;
      background: #000;
    }
    .twx-about-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 60% 50%, rgba(194,147,74,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .twx-about-eyebrow {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #c2934a;
      margin-bottom: 16px;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .twx-about-eyebrow.visible { opacity: 1; transform: translateY(0); }
    .twx-about-headline {
      font-size: clamp(2.8rem, 7vw, 6rem);
      font-weight: 900;
      line-height: 1.05;
      color: #fff;
      margin: 0 0 24px;
      max-width: 900px;
    }
    .twx-about-headline .gold { color: #c2934a; }
    .twx-about-headline .word {
      display: inline-block;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .twx-about-headline .word.visible { opacity: 1; transform: translateY(0); }
    .twx-about-hero-sub {
      font-size: clamp(1rem, 2vw, 1.25rem);
      color: #888;
      max-width: 560px;
      line-height: 1.7;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s;
    }
    .twx-about-hero-sub.visible { opacity: 1; transform: translateY(0); }
    .twx-hero-scroll-hint {
      position: absolute;
      bottom: 24px;
      left: 8vw;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #444;
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0;
      animation: twx-fadein 1s ease 1.5s forwards;
    }
    .twx-hero-scroll-hint::after {
      content: '';
      display: block;
      width: 40px;
      height: 1px;
      background: #c2934a;
      animation: twx-expand 1s ease 1.8s both;
    }
    @keyframes twx-expand { from { width: 0 } to { width: 40px } }
    @keyframes twx-fadein { from { opacity: 0 } to { opacity: 1 } }

    /* Sections */
    .twx-about-section {
      padding: 100px 8vw;
      position: relative;
      overflow: hidden;
    }
    .twx-about-section:nth-child(even) { background: #060606; }
    .twx-about-section:nth-child(odd) { background: #000; }

    .twx-section-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 60px;
      align-items: start;
    }
    .twx-section-inner.full { grid-template-columns: 1fr; }
    .twx-section-inner.center { text-align: center; justify-items: center; }

    .twx-section-inner.reversed {
      direction: rtl;
    }
    .twx-section-inner.reversed > * {
      direction: ltr;
    }
    .twx-section-num {
      font-size: clamp(5rem, 12vw, 10rem);
      font-weight: 900;
      color: rgba(194,147,74,0.18);
      line-height: 1;
      margin: 0;
      position: sticky;
      top: 120px;
      user-select: none;
    }
    .twx-section-content {}
    .twx-section-tag {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #c2934a;
      margin-bottom: 16px;
      display: block;
    }
    .twx-section-title {
      font-size: clamp(1.8rem, 4vw, 3rem);
      font-weight: 900;
      color: #fff;
      line-height: 1.1;
      margin: 0 0 28px;
    }
    .twx-section-body {
      font-size: clamp(1rem, 1.5vw, 1.15rem);
      color: #999;
      line-height: 1.8;
      margin: 0 0 20px;
    }
    .twx-section-body strong { color: #e0e0e0; }

    /* Gold line reveal */
    .twx-gold-line {
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #c2934a, transparent);
      margin-bottom: 32px;
      transition: width 1.2s ease;
    }
    .twx-gold-line.visible { width: 120px; }

    /* Fade up animation */
    .twx-fade-up {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .twx-fade-up.visible { opacity: 1; transform: translateY(0); }

    /* Values cards */
    .twx-values-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .twx-value-card {
      background: #0e0e0e;
      border: 1px solid #1a1a1a;
      border-radius: 12px;
      padding: 40px 32px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .twx-value-card.visible { opacity: 1; transform: translateY(0); }
    .twx-value-card:hover {
      border-color: rgba(194,147,74,0.4);
      transform: translateY(-6px);
      box-shadow: 0 20px 60px rgba(194,147,74,0.1);
    }
    .twx-value-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #c2934a, transparent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }
    .twx-value-card:hover::before { transform: scaleX(1); }
    .twx-value-icon {
      font-size: 2rem;
      margin-bottom: 20px;
      display: block;
    }
    .twx-value-title {
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #c2934a;
      margin-bottom: 12px;
    }
    .twx-value-body {
      font-size: 0.95rem;
      color: #888;
      line-height: 1.7;
    }

    /* Timeline */
    .twx-timeline {
      position: relative;
      padding-left: 48px;
      max-width: 700px;
    }
    .twx-timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 0;
      width: 2px;
      background: #1a1a1a;
    }
    .twx-timeline-fill {
      position: absolute;
      left: 0;
      top: 8px;
      width: 2px;
      height: 0;
      background: linear-gradient(180deg, #c2934a, rgba(194,147,74,0.2));
      transition: height 1.5s ease;
    }
    .twx-timeline-fill.visible { height: 100%; }
    .twx-timeline-item {
      position: relative;
      margin-bottom: 48px;
      opacity: 0;
      transform: translateX(-20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .twx-timeline-item.visible { opacity: 1; transform: translateX(0); }
    .twx-timeline-item::before {
      content: '';
      position: absolute;
      left: -54px;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #c2934a;
      border: 2px solid #000;
      box-shadow: 0 0 0 4px rgba(194,147,74,0.15);
    }
    .twx-timeline-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c2934a;
      margin-bottom: 6px;
    }
    .twx-timeline-text {
      font-size: 1rem;
      color: #ccc;
      line-height: 1.7;
    }

    /* Statement section */
    .twx-statement {
      text-align: center;
      padding: 120px 0px;
      background: #000;
      position: relative;
      overflow: hidden;
    }
    .twx-statement::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 50%, rgba(194,147,74,0.06) 0%, transparent 65%);
      pointer-events: none;
    }
    .twx-statement-text {
      font-size: clamp(1.6rem, 3.5vw, 2.5rem);
      font-weight: 900;
      color: #fff;
      line-height: 1.2;
      max-width: 1000px;
      margin: 0 auto 40px;
    }
    .twx-statement-text .gold { color: #c2934a; }
    .twx-statement-sub {
      font-size: 1rem;
      color: #666;
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.7;
    }

    /* Team cards */
    .twx-team-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      max-width: 700px;
      margin: 40px auto 0;
    }
    .twx-team-card {
      background: #0e0e0e;
      border: 1px solid #1a1a1a;
      border-radius: 12px;
      padding: 40px 32px;
      text-align: center;
      transition: border-color 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
    }
    .twx-team-card.visible { opacity: 1; transform: translateY(0); }
    .twx-team-card:hover {
      border-color: rgba(194,147,74,0.3);
      transform: translateY(-4px);
    }
    .twx-team-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
      border: 2px solid #c2934a;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 1.8rem;
      color: #c2934a;
      font-weight: 900;
    }
    .twx-team-name {
      font-size: 1.2rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .twx-team-role {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c2934a;
      margin-bottom: 16px;
    }
    .twx-team-bio {
      font-size: 0.9rem;
      color: #777;
      line-height: 1.6;
    }

    /* CTA strip */
    .twx-about-cta {
      padding: 80px 8vw;
      background: #060606;
      border-top: 1px solid #111;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      flex-wrap: wrap;
    }
    .twx-about-cta-text {
      font-size: clamp(1.3rem, 3vw, 2rem);
      font-weight: 800;
      color: #fff;
    }
    .twx-about-cta-text .gold { color: #c2934a; }
    .twx-about-cta-btn {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #b8833e, #d4a55c, #c2934a);
      color: #111;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      border-radius: 6px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 20px rgba(194,147,74,0.4);
      white-space: nowrap;
    }
    .twx-about-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(194,147,74,0.5);
    }

    /* Mobile */
    @media (max-width: 767px) {
      .twx-about { margin-left: 0; margin-right: 0; border-radius: 0; }
      .twx-about-hero { min-height: 65vh; padding: 80px 1.25rem 48px; }
      .twx-hero-scroll-hint { bottom: 16px; }
      .twx-section-inner { grid-template-columns: 1fr; gap: 16px; }
      .twx-section-num { font-size: 5rem; position: static; }
      .twx-values-grid { grid-template-columns: 1fr; }
      .twx-team-grid { grid-template-columns: 1fr; }
      .twx-about-cta { flex-direction: column; text-align: center; padding: 48px 1.25rem; }
      .twx-about-section { padding: 48px 1.25rem; }
    }
  `;
  document.head.appendChild(style);

  // ── Build the page ──
  function buildAboutPage() {
    const body = document.querySelector("body");

    // Find and hide existing about content
    const existing =
      document.querySelector(".about-mobile-story") ||
      document.querySelector("main") ||
      document.querySelector(".page-wrapper");
    const wrapper = document.createElement("div");
    wrapper.className = "twx-about";

    // ── HERO ──
    wrapper.innerHTML = `
      <section class="twx-about-hero">
        <div class="twx-about-eyebrow">Tillageworx — Est. in the paddock</div>
        <h1 class="twx-about-headline">
          <span class="word">Parts</span> <span class="word">that</span> <span class="word gold">work.</span><br>
          <span class="word">People</span> <span class="word">who</span> <span class="word gold">care.</span>
        </h1>
        <p class="twx-about-hero-sub">A small team with deep roots in Australian farming. Almost 20 years of experience in wearing parts manufacturing, design and sales.</p>
        <div class="twx-hero-scroll-hint">Scroll to explore</div>
      </section>

      <section class="twx-about-section">
        <div class="twx-section-inner">
          <div class="twx-section-num twx-fade-up">01</div>
          <div class="twx-section-content">
            <span class="twx-section-tag twx-fade-up">Who We Are</span>
            <div class="twx-gold-line"></div>
            <h2 class="twx-section-title twx-fade-up">From the paddock.<br>To your machine.</h2>
            <p class="twx-section-body twx-fade-up">We originate from a <strong>family farming partnership</strong> specialising in broadacre cropping and sheep in Central West NSW. That background isn't just part of our story, it shapes every decision we make.</p>
            <p class="twx-section-body twx-fade-up">From design to production, we're involved in every step. We listen, we create, we test, and we deliver. <strong>No egos. No sales pressure.</strong> Just people who actually care.</p>
          </div>
        </div>
      </section>

      <section class="twx-about-section">
        <div class="twx-section-inner reversed">
          <div class="twx-section-num twx-fade-up">02</div>
          <div class="twx-section-content">
            <span class="twx-section-tag twx-fade-up">Why We Started</span>
            <div class="twx-gold-line"></div>
            <h2 class="twx-section-title twx-fade-up">We saw the gap.<br>We closed it.</h2>
            <p class="twx-section-body twx-fade-up"><strong>Limited options, high prices and average parts</strong> — that was the reality for Australian farmers. We set out to change it with a high-performance model focused on reducing your cost per hectare.</p>
            <p class="twx-section-body twx-fade-up">From day one, our objective has been clear: design stronger parts, give better service, and prove that aftermarket gear can not only match OEM performance — <strong>it can be better.</strong></p>
          </div>
        </div>
      </section>

      <section class="twx-about-section" style="padding-top:80px;padding-bottom:80px;">
        <div style="max-width:1100px;margin:0 auto;">
          <span class="twx-section-tag twx-fade-up" style="text-align:center;display:block;margin-bottom:48px;">What We Stand For</span>
          <div class="twx-values-grid">
            <div class="twx-value-card">
              <span class="twx-value-icon">🌾</span>
              <div class="twx-value-title">Paddock to Production</div>
              <div class="twx-value-body">We're involved in every stage — from understanding what farmers actually need in the field, to how the part is designed, tested and manufactured.</div>
            </div>
            <div class="twx-value-card" style="transition-delay:0.15s">
              <span class="twx-value-icon">⚙️</span>
              <div class="twx-value-title">No Corners Cut</div>
              <div class="twx-value-body">We test, refine, and only sell parts we'd use ourselves. If something's not right, we fix it. If it works well, we make it better.</div>
            </div>
            <div class="twx-value-card" style="transition-delay:0.3s">
              <span class="twx-value-icon">🤝</span>
              <div class="twx-value-title">Family, Not Corporate</div>
              <div class="twx-value-body">Nobody's just a number here. We pick up the phone, listen, and build long-term relationships. We're a family business that genuinely cares.</div>
            </div>
          </div>
        </div>
      </section>

      <section class="twx-about-section">
        <div class="twx-section-inner">
          <div class="twx-section-num twx-fade-up">03</div>
          <div class="twx-section-content">
            <span class="twx-section-tag twx-fade-up">How We Work</span>
            <div class="twx-gold-line"></div>
            <h2 class="twx-section-title twx-fade-up">Simple process.<br>Serious results.</h2>
            <div class="twx-timeline">
              <div class="twx-timeline-fill"></div>
              <div class="twx-timeline-item">
                <div class="twx-timeline-label">Listen</div>
                <div class="twx-timeline-text">We talk to farmers. We understand their setup, their challenges, and their goals. Every conversation shapes what we build.</div>
              </div>
              <div class="twx-timeline-item">
                <div class="twx-timeline-label">Design & Test</div>
                <div class="twx-timeline-text">We design for performance, not just price. Every part is tested in real conditions before it carries the Tillageworx name.</div>
              </div>
              <div class="twx-timeline-item">
                <div class="twx-timeline-label">Deliver</div>
                <div class="twx-timeline-text">We're not a massive corporation with ten layers of margin between factory and farmer. There's no boardroom setting our margins — just us, making sure you get a fair deal.</div>
              </div>
              <div class="twx-timeline-item">
                <div class="twx-timeline-label">Improve</div>
                <div class="twx-timeline-text">We don't just copy what's out there — we work with customers to make it better. Continuous refinement is built into everything we do.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="twx-statement">
        <h2 class="twx-statement-text twx-fade-up">Most aftermarket suppliers <span class="gold">cut corners.</span><br>Most OEM gear <span class="gold">costs a fortune.</span><br>We sit in the <span class="gold">sweet spot.</span></h2>
        <p class="twx-statement-sub twx-fade-up">Durable parts. Smart pricing. A better cost per hectare for the end user.</p>
      </div>

      <section class="twx-about-section" style="display: none !important;">
        <div class="twx-section-inner full center">
          <div>
            <span class="twx-section-tag twx-fade-up">The Team</span>
            <div class="twx-gold-line" style="margin:16px auto 0"></div>
            <h2 class="twx-section-title twx-fade-up">Meet Tillageworx</h2>
            <p class="twx-section-body twx-fade-up" style="max-width:560px;margin:0 auto 0">Small team. Deep roots. Big commitment.</p>
            <div class="twx-team-grid">
              <div class="twx-team-card">
                <div class="twx-team-avatar">M</div>
                <div class="twx-team-name">Mon</div>
                <div class="twx-team-role">Founder & Director</div>
                <div class="twx-team-bio">Grew up in Central West NSW on a family farm specialising in broadacre cropping and sheep. Almost 20 years in wearing parts manufacturing and sales.</div>
              </div>
              <div class="twx-team-card" style="transition-delay:0.15s">
                <div class="twx-team-avatar">R</div>
                <div class="twx-team-name">Roch</div>
                <div class="twx-team-role">Co-Founder</div>
                <div class="twx-team-bio">Brings deep technical expertise and a hands-on approach to product development. Closely involved in every stage of design and production.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="twx-about-cta">
        <div class="twx-about-cta-text">Ready to lower your <span class="gold">cost per hectare?</span></div>
        <a href="/browse-brands" class="twx-about-cta-btn">Browse Parts →</a>
      </div>
    `;

    // Insert before footer or at end of body
    const footer =
      document.querySelector("footer") ||
      document.querySelector(".footer") ||
      document.querySelector('[class*="footer"]');
    if (footer) {
      footer.parentNode.insertBefore(wrapper, footer);
    } else {
      document.body.appendChild(wrapper);
    }

    // Hide existing content
    document
      .querySelectorAll(
        '.about-mobile-story, .page-wrapper > *:not(.twx-about):not(.navbar):not(footer):not([class*="footer"])',
      )
      .forEach((el) => {
        if (
          !el.classList.contains("twx-about") &&
          !el.closest("nav") &&
          !el.closest("footer")
        ) {
          el.style.display = "none";
        }
      });

    // ── Animations ──
    // Hero word reveal
    setTimeout(() => {
      const eyebrow = wrapper.querySelector(".twx-about-eyebrow");
      if (eyebrow) eyebrow.classList.add("visible");
      wrapper.querySelectorAll(".twx-about-headline .word").forEach((w, i) => {
        setTimeout(() => w.classList.add("visible"), i * 120);
      });
      setTimeout(() => {
        const sub = wrapper.querySelector(".twx-about-hero-sub");
        if (sub) sub.classList.add("visible");
      }, 800);
    }, 300);

    // Intersection observer for scroll animations
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    wrapper
      .querySelectorAll(
        ".twx-fade-up, .twx-gold-line, .twx-value-card, .twx-timeline-item, .twx-timeline-fill, .twx-team-card",
      )
      .forEach((el) => io.observe(el));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildAboutPage);
  } else {
    buildAboutPage();
  }
})();

/* ── 8. BRANDS NAV MOBILE SCROLL ANIMATION ───────────────── */
(function () {
  function animateNavScroll(navList) {
    const maxScroll = navList.scrollWidth - navList.clientWidth;
    if (maxScroll <= 10) return;

    navList.classList.add("twx-scroll-hint");
    const removeHint = () => navList.classList.remove("twx-scroll-hint");
    navList.addEventListener("scroll", removeHint, {
      passive: true,
      once: true,
    });
    navList.addEventListener("touchstart", removeHint, {
      passive: true,
      once: true,
    });
    setTimeout(removeHint, 2500);

    navList.scrollLeft = maxScroll;

    setTimeout(() => {
      const activePill = navList.querySelector(".w--current");
      const end = activePill
        ? activePill.offsetLeft -
          navList.clientWidth / 2 +
          activePill.offsetWidth / 2
        : 0;
      const start = navList.scrollLeft;
      const distance = Math.abs(end - start);
      const duration = Math.min(600, Math.max(300, distance / 2)); // Adjust duration based on distance
      const startTime = performance.now();

      function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        navList.scrollLeft = start + (end - start) * easeOut;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          navList.classList.add("twx-skid-active");
          setTimeout(() => navList.classList.remove("twx-skid-active"), 450);
        }
      }

      requestAnimationFrame(animateScroll);
    }, 700);
  }

  function centerActiveBrand(navList) {
    const activePill = navList.querySelector(".w--current");
    if (!activePill || typeof activePill.scrollIntoView !== "function") return;
    activePill.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }

  function initNavScroll() {
    const tryInit = () => {
      const navList = document.querySelector(".brands-nav, .brands-nav__list");
      if (!navList) return false;
      if (navList.dataset.scrollInit) return true;
      navList.dataset.scrollInit = "true";
      animateNavScroll(navList);
      return true;
    };

    if (!tryInit()) {
      let attempt = 0;
      const maxAttempts = 20;
      const intervalId = setInterval(() => {
        attempt += 1;
        if (tryInit() || attempt >= maxAttempts) {
          clearInterval(intervalId);
        }
      }, 150);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavScroll);
  } else {
    initNavScroll();
  }
})();
