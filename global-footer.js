(function() {
 'use strict';

 const CONFIG = {
 CART_KEY: 'tillageworx_quote_cart',
 DEBUG: false,
 DEBOUNCE_DELAY: 300,
 MAX_CART_ITEMS: 999
 };

 const state = {
 cart: [],
 wizState: { brand: null, family: null, variant: null, size: null, filter: null },
 dataLoaded: false,
 saveTimer: null
 };

 const data = { modelMenu: [], configs: [], parts: [] };

 const indexes = {
 partsById: new Map(),
 partsByName: new Map(),
 configsByModel: new Map(),
 familiesByBrand: new Map(),
 variantsByFamily: new Map(),
 sizesByModel: new Map()
 };

 const DOM = {};

 function cacheDOM() {
 DOM.cart = document.getElementById('quote-cart');
 DOM.closeBtn = document.getElementById('quote-cart-close-btn');
 DOM.clearBtn = document.getElementById('cart-clearall');
 DOM.browseBtn = document.getElementById('cart-add-parts-btn');
 DOM.cartItems = document.getElementById('cart-items');
 DOM.addBox = document.getElementById('cart-add-parts-box');
 DOM.wizContainer = document.getElementById('machine-wizard-container');
 DOM.breadcrumbs = document.getElementById('wiz-breadcrumbs');
 DOM.activeStep = document.getElementById('wiz-active-step');
 DOM.openBtns = document.querySelectorAll('.open-quote-cart, .open-quote-cart-btn, #open-quote-cart-btn, .quote-main-btn');
 }

 function log(...args) {
 if (CONFIG.DEBUG) console.log('[Tillageworx]', ...args);
 }

 function debounce(fn, delay) {
 let timer;
 return function(...args) {
 clearTimeout(timer);
 timer = setTimeout(() => fn.apply(this, args), delay);
 };
 }

 function getUniqueSorted(set) {
 return Array.from(set).filter(Boolean).sort();
 }

 function escapeHtml(text) {
 const div = document.createElement('div');
 div.textContent = text;
 return div.innerHTML;
 }

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

 document.querySelectorAll('.wizard-model-item .model-data-payload').forEach(item => {
 const model = {
 brand: (item.dataset.brand || '').trim(),
 family: (item.dataset.family || '').trim(),
 variant: (item.dataset.variant || '').trim(),
 fullName: (item.dataset.name || '').trim()
 };
 data.modelMenu.push(model);

 if (!indexes.familiesByBrand.has(model.brand)) {
 indexes.familiesByBrand.set(model.brand, new Set());
 }
 indexes.familiesByBrand.get(model.brand).add(model.family);

 const familyKey = `${model.brand}|${model.family}`;
 if (!indexes.variantsByFamily.has(familyKey)) {
 indexes.variantsByFamily.set(familyKey, new Set());
 }
 indexes.variantsByFamily.get(familyKey).add(model.variant);
 });

 document.querySelectorAll('.config-data-item .config-data-payload').forEach(item => {
 const config = {
 modelName: (item.dataset.modelName || '').trim(),
 size: (item.dataset.size || '').trim(),
 qtyDisc: parseInt(item.dataset.qtyDisc) || 0,
 qtyPoint: parseInt(item.dataset.qtyPoint) || 0
 };
 data.configs.push(config);

 if (!indexes.configsByModel.has(config.modelName)) {
 indexes.configsByModel.set(config.modelName, []);
 }
 indexes.configsByModel.get(config.modelName).push(config);

 if (!indexes.sizesByModel.has(config.modelName)) {
 indexes.sizesByModel.set(config.modelName, new Set());
 }
 indexes.sizesByModel.get(config.modelName).add(config.size);
 });

 const btnPriceById = new Map();
 const btnPriceByName = new Map();
 document.querySelectorAll('.add-to-quote-btn').forEach(btn => {
 const price = (btn.dataset.price || '').trim();
 const code = (btn.dataset.code || '').trim();
 const id = (btn.dataset.id || '').trim();
 const name = (btn.dataset.name || '').trim().toLowerCase();
 if (id) btnPriceById.set(id, { price, code });
 if (name) btnPriceByName.set(name, { price, code });
 });

 document.querySelectorAll('.part-data-item').forEach(item => {
 const payload = item.querySelector('.part-data-payload');
 if (!payload) return;

 const partId = (payload.dataset.id || '').trim();
 const partName = (payload.dataset.name || '').trim().toLowerCase();

 const btnData = btnPriceById.get(partId) || btnPriceByName.get(partName) || {};

 const payloadPrice = (payload.dataset.price || '').trim();
 const payloadCode = (payload.dataset.code || '').trim();
 const domPrice = (item.querySelector('.part-data-price')?.textContent || '').trim();
 const domCode = (item.querySelector('.part-data-code')?.textContent || '').trim();

 const part = {
 name: (payload.dataset.name || '').trim(),
 id: partId,
 type: (payload.dataset.type || '').trim(),
 image: (payload.dataset.image || '').trim(),
 price: payloadPrice || domPrice || btnData.price || '',
 code: payloadCode || domCode || btnData.code || '',
 models: Array.from(item.querySelectorAll('.part-model-ref'))
 .map(span => span.textContent.trim())
 .filter(Boolean)
 };

 data.parts.push(part);
 indexes.partsById.set(part.id, part);
 indexes.partsByName.set(part.name.toLowerCase(), part);
 });

 state.dataLoaded = true;
 }

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
 log('Error saving cart:', e);
 }
 }, CONFIG.DEBOUNCE_DELAY);

 function addPartToCart(partData, showMessage = true) {
 const existingIndex = state.cart.findIndex(i => i.id === partData.id);
 let wasUpdated = false;

 if (existingIndex >= 0) {
 const existing = state.cart[existingIndex];
 const oldQty = existing.qty;
 existing.qty = Math.min(CONFIG.MAX_CART_ITEMS, parseInt(partData.qty) || 1);

 if (!existing.price && partData.price) existing.price = partData.price;
 if ((!existing.code || existing.code === existing.id) && partData.code && partData.code !== partData.id) {
 existing.code = partData.code;
 }

 if (partData.machineContext && existing.machineContext &&
 !existing.machineContext.includes(partData.machineContext)) {
 existing.machineContext += ', ' + partData.machineContext;
 } else if (partData.machineContext && !existing.machineContext) {
 existing.machineContext = partData.machineContext;
 }

 wasUpdated = existing.qty !== oldQty;
 } else {
 state.cart.push({
 id: partData.id,
 name: partData.name,
 code: partData.code || partData.id,
 image: partData.image || '',
 price: partData.price || '',
 qty: Math.min(CONFIG.MAX_CART_ITEMS, parseInt(partData.qty) || 1),
 machineContext: partData.machineContext || ''
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

 const existingMsg = DOM.activeStep.querySelector('.wiz-update-message');
 if (existingMsg) existingMsg.remove();

 const msg = document.createElement('div');
 msg.className = 'wiz-update-message';
 msg.style.cssText = 'color:#4caf50;font-size:0.85rem;margin-bottom:10px;padding:8px;background:rgba(76,175,80,0.15);border-radius:4px;border-left:3px solid #4caf50;';
 msg.textContent = message;

 DOM.activeStep.insertBefore(msg, DOM.activeStep.firstChild);

 setTimeout(() => {
 msg.style.opacity = '0';
 msg.style.transition = 'opacity 0.5s';
 setTimeout(() => msg.remove(), 500);
 }, 3000);
 }

 function removeFromCart(id) {
 state.cart = state.cart.filter(i => i.id !== id);
 saveCart();
 renderCart();
 if (state.wizState.size) finishWizard();
 }

 function updateCartQuantity(id, deltaOrValue) {
 const item = state.cart.find(i => i.id === id);
 if (!item) return;

 if (typeof deltaOrValue === 'number' && Math.abs(deltaOrValue) < 100) {
 item.qty = Math.max(1, Math.min(CONFIG.MAX_CART_ITEMS, item.qty + deltaOrValue));
 } else {
 item.qty = Math.max(1, Math.min(CONFIG.MAX_CART_ITEMS, parseInt(deltaOrValue) || 1));
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

function renderCart() {
 if (!DOM.cartItems) return;

 const hasItems = state.cart.length > 0;
 DOM.cartItems.style.display = hasItems ? 'block' : 'none';
 if (DOM.clearBtn) DOM.clearBtn.style.display = hasItems ? 'block' : 'none';

 if (!hasItems) {
 DOM.cartItems.innerHTML = '';

 const existing = document.getElementById('cart-pricing-summary');
 if (existing) existing.remove();
 const existingBtn = document.getElementById('cart-proceed-btn');
 if (existingBtn) existingBtn.remove();
 updateButtons();
 return;
 }

 const fragment = document.createDocumentFragment();

 function parsePrice(str) {
 if (!str) return null;
 const n = parseFloat(String(str).replace(/[^0-9.]/g, ''));
 return isNaN(n) ? null : n;
 }

 let subtotal = 0;
 let allPriced = true;

 state.cart.forEach(item => {
 const div = document.createElement('div');
 div.className = 'quote-cart-item';
 div.dataset.id = item.id;

 const safeQty = Math.max(1, Math.min(CONFIG.MAX_CART_ITEMS, item.qty || 1));
 const unitPrice = parsePrice(item.price);
 const lineTotal = unitPrice !== null ? unitPrice * safeQty : null;

 if (lineTotal !== null) {
 subtotal += lineTotal;
 } else {
 allPriced = false;
 }

 const priceHtml = unitPrice !== null
 ? `<div class="cart-item-pricing">
 <span class="cart-item-unit-price">$${unitPrice.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})} ea</span>
 <span class="cart-item-line-total">$${lineTotal.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
 </div>`
 : `<div class="cart-item-pricing"><span class="cart-item-no-price">Price on request</span></div>`;

 div.innerHTML = `
 ${item.image ? `<img src="${item.image}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-right:8px;flex-shrink:0;">` : ''}
 <div style="flex:1;min-width:0;">
 <span class="cart-item-title">${escapeHtml(item.name)}</span>
 ${item.machineContext ? `<div style="font-size:0.75rem;color:#aaa;margin-top:2px;line-height:1.2;">For: ${escapeHtml(item.machineContext)}</div>` : ''}
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

 DOM.cartItems.innerHTML = '';
 DOM.cartItems.appendChild(fragment);

 let summary = document.getElementById('cart-pricing-summary');
 if (!summary) {
 summary = document.createElement('div');
 summary.id = 'cart-pricing-summary';
 DOM.cartItems.parentNode.insertBefore(summary, DOM.cartItems.nextSibling);
 }

 if (allPriced && subtotal > 0) {
 const gst = subtotal * 0.1;
 const total = subtotal + gst;
 summary.innerHTML = `
 <div class="cart-summary-row"><span>Subtotal</span><span>$${subtotal.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 `;
 } else if (!allPriced && subtotal > 0) {
 const gst = subtotal * 0.1;
 const total = subtotal + gst;
 summary.innerHTML = `
 <div class="cart-summary-row"><span>Subtotal (priced items)</span><span>$${subtotal.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="cart-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="cart-summary-row cart-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="cart-summary-note">Some items are price on request — full pricing on next step.</div>
 `;
 } else {
 summary.innerHTML = `<div class="cart-summary-note">Pricing will be confirmed on the next step.</div>`;
 }

 let proceedBtn = document.getElementById('cart-proceed-btn');
 if (!proceedBtn) {
 proceedBtn = document.createElement('a');
 proceedBtn.id = 'cart-proceed-btn';
 proceedBtn.textContent = 'PROCEED TO QUOTE →';
 summary.parentNode.insertBefore(proceedBtn, summary.nextSibling);
 }
 proceedBtn.href = '/quote-review';

 updateButtons();
}

 function initWizard() {
 if (!DOM.addBox || DOM.wizContainer) return;

 if (DOM.browseBtn) {
 DOM.browseBtn.textContent = 'BROWSE ALL BRANDS';
 DOM.browseBtn.addEventListener('click', (e) => {
 e.preventDefault();
 window.location.href = '/browse-brands';
 });
 }

 const header = document.createElement('div');
 header.className = 'wizard-main-header';
 header.textContent = 'Find parts for my machine';
 DOM.addBox.insertBefore(header, DOM.browseBtn?.nextSibling);

 const wizContainer = document.createElement('div');
 wizContainer.id = 'machine-wizard-container';
 wizContainer.innerHTML = `
 <div id="wiz-breadcrumbs"></div>
 <div id="wiz-active-step"></div>
 `;
 DOM.addBox.insertBefore(wizContainer, header.nextSibling);

 DOM.wizContainer = wizContainer;
 DOM.breadcrumbs = document.getElementById('wiz-breadcrumbs');
 DOM.activeStep = document.getElementById('wiz-active-step');

 const quoteHeader = document.createElement('div');
 quoteHeader.className = 'cart-section-header';
 quoteHeader.textContent = 'Your Order';
 const contentArea = document.querySelector('.quote-cart-content');
 if (contentArea && DOM.cartItems) {
 contentArea.insertBefore(quoteHeader, DOM.cartItems);
 }

 renderWizard();
 }

 function resetWizard() {
 state.wizState = { brand: null, family: null, variant: null, size: null, filter: null };
 renderWizard();
 }

 function goBackFrom(step) {
 if (step === 'brand') {
 state.wizState = { brand: null, family: null, variant: null, size: null, filter: null };
 } else if (step === 'family') {
 state.wizState.family = null;
 state.wizState.variant = null;
 state.wizState.size = null;
 } else if (step === 'variant') {
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
 if (!state.wizState.brand) activeStep = 'brand';
 else if (!state.wizState.family) activeStep = 'family';
 else if (state.wizState.variant === null) activeStep = 'variant';
 else if (!state.wizState.size) activeStep = 'size';

 if (!activeStep) {
 finishWizard();
 return;
 }

 renderActiveStep(activeStep);
 }

 function renderBreadcrumbs() {
 DOM.breadcrumbs.innerHTML = '';
 const steps = ['brand', 'family', 'variant'];

 steps.forEach(step => {
 const value = state.wizState[step];
 if (value && value !== '') {
 const pill = document.createElement('div');
 pill.className = 'wiz-pill breadcrumb';
 pill.dataset.step = step;
 pill.innerHTML = `${escapeHtml(value)} <span class="wiz-pill-close" aria-label="Remove">✕</span>`;
 DOM.breadcrumbs.appendChild(pill);
 }
 });
 }

 function renderActiveStep(step) {
 DOM.activeStep.innerHTML = '';

 let options = [];
 let titleText = '';

 switch (step) {
 case 'brand':
 options = getUniqueSorted(indexes.familiesByBrand.keys());
 titleText = 'Select Brand';
 break;
 case 'family':
 const families = indexes.familiesByBrand.get(state.wizState.brand) || new Set();
 options = getUniqueSorted(families);
 if (state.wizState.filter?.families) {
 options = options.filter(f => state.wizState.filter.families.includes(f));
 }
 titleText = 'Select Machine';
 break;
 case 'variant':
 const familyKey = `${state.wizState.brand}|${state.wizState.family}`;
 const variants = indexes.variantsByFamily.get(familyKey) || new Set();
 options = getUniqueSorted(variants).filter(v => v);

 if (options.length === 0) {
 state.wizState.variant = '';
 renderWizard();
 return;
 }

 if (state.wizState.filter?.variants) {
 options = options.filter(v => state.wizState.filter.variants.includes(v));
 }
 titleText = 'Select Model Type';
 break;
 case 'size':
 const activeModel = data.modelMenu.find(d =>
 d.brand === state.wizState.brand &&
 d.family === state.wizState.family &&
 (d.variant || '') === (state.wizState.variant || '')
 );
 if (activeModel) {
 const sizes = indexes.sizesByModel.get(activeModel.fullName) || new Set();
 options = getUniqueSorted(sizes);
 }
 titleText = 'Select Working Width';
 break;
 }

 if (options.length === 0 && step !== 'size') {
 DOM.activeStep.innerHTML = '<div style="color:#888;font-size:0.9em;">No options available.</div>';
 return;
 }

 const title = document.createElement('div');
 title.className = 'wizard-step-title';
 title.textContent = titleText;
 DOM.activeStep.appendChild(title);

 const pillsDiv = document.createElement('div');
 pillsDiv.className = 'wizard-pills';

 options.forEach(opt => {
 const pill = document.createElement('div');
 pill.className = 'wiz-pill';
 pill.dataset.value = opt;
 pill.textContent = opt;
 pillsDiv.appendChild(pill);
 });

 DOM.activeStep.appendChild(pillsDiv);
 }

 function finishWizard() {
 if (!DOM.activeStep) return;
 DOM.activeStep.innerHTML = '';

 const activeModel = data.modelMenu.find(d =>
 d.brand === state.wizState.brand &&
 d.family === state.wizState.family &&
 (d.variant || '').trim() === (state.wizState.variant || '').trim()
 );

 if (!activeModel) {
 DOM.activeStep.innerHTML = '<div style="color:#ff5a5f;">Model definition not found.</div>';
 return;
 }

 const configs = indexes.configsByModel.get(activeModel.fullName) || [];
 const config = configs.find(c => c.size.trim() === state.wizState.size.trim());

 if (!config) {
 DOM.activeStep.innerHTML = '<div style="color:#ff5a5f;">Configuration not found for this size.</div>';
 return;
 }

 const matchingParts = data.parts.filter(p => p.models.includes(activeModel.fullName));

 if (matchingParts.length === 0) {
 DOM.activeStep.innerHTML = '<div style="color:#888;">No parts found for this model.</div>';
 return;
 }

 const header = document.createElement('div');
 header.className = 'wizard-step-title';
 header.textContent = `Order Parts for ${activeModel.fullName} ${config.size}`;
 DOM.activeStep.appendChild(header);

 const machineContextStr = `${activeModel.brand} ${activeModel.family} ${activeModel.variant || ''} ${config.size}`.trim();

 const addAllBtn = document.createElement('button');
 addAllBtn.className = 'wiz-add-all-btn';
 addAllBtn.textContent = 'Add All Items to Order';
 addAllBtn.addEventListener('click', () => {
 addAllPartsToCart(matchingParts, config, machineContextStr);
 });
 DOM.activeStep.appendChild(addAllBtn);

 const disclaimer = document.createElement('div');
 disclaimer.className = 'wiz-disclaimer';
 disclaimer.innerHTML = 'ℹ️ Quantities shown are based on standard OEM machine configurations. Please verify quantities required for your specific machine setup.';
 DOM.activeStep.appendChild(disclaimer);

 const listDiv = document.createElement('div');
 listDiv.className = 'wiz-results-list';

 let visibleCount = 0;

 const fragment = document.createDocumentFragment();

 matchingParts.forEach(part => {
 let qtyToAdd = 0;
 if (part.type === 'Disc') qtyToAdd = config.qtyDisc;
 else if (part.type === 'Point') qtyToAdd = config.qtyPoint;
 else if (part.type === 'Hardware') qtyToAdd = config.qtyDisc;

 if (qtyToAdd <= 0) return;

 const inCart = state.cart.find(item => item.id === part.id);
 if (inCart) return;
 const currentQty = inCart ? inCart.qty : 0;

 visibleCount++;
 const row = document.createElement('div');
 row.className = 'wiz-result-item';
 row.dataset.partId = part.id;

 const btnText = inCart ? 'Update' : 'Add to Order';
 const btnClass = inCart ? 'wiz-add-btn wiz-update-btn' : 'wiz-add-btn';

 row.innerHTML = `
 ${part.image ? `<img src="${part.image}" class="wiz-result-img" alt="">` : ''}
 <div class="wiz-result-info">
 <span class="wiz-result-name">${escapeHtml(part.name)}</span>
 <div style="font-size:0.7em;color:#888;">Compatible with: ${escapeHtml(activeModel.fullName)}</div>
 ${inCart ? `<div style="font-size:0.7em;color:#4caf50;font-weight:bold;">✓ In cart: ${currentQty}</div>` : ''}
 <div class="wiz-result-actions">
 <input type="number" class="wiz-result-qty" value="${qtyToAdd}" min="1" aria-label="Quantity">
 <button type="button" class="${btnClass}">${btnText}</button>
 </div>
 </div>
 `;
 fragment.appendChild(row);
 });

 listDiv.appendChild(fragment);

 if (visibleCount === 0) {
 listDiv.innerHTML = '<div style="color:#888;text-align:center;padding:10px;">All parts added to order!</div>';
 }

 DOM.activeStep.appendChild(listDiv);
 }

 function addAllPartsToCart(parts, config, machineContext) {
 let addedCount = 0;
 let updatedCount = 0;

 parts.forEach(part => {
 let qtyToAdd = 0;
 if (part.type === 'Disc') qtyToAdd = config.qtyDisc;
 else if (part.type === 'Point') qtyToAdd = config.qtyPoint;
 else if (part.type === 'Hardware') qtyToAdd = config.qtyDisc;

 if (qtyToAdd > 0) {
 const existing = state.cart.find(item => item.id === part.id);
 if (existing) {
 if (existing.qty !== qtyToAdd) {
 existing.qty = qtyToAdd;
 existing.machineContext = machineContext;
 updatedCount++;
 }

 if (!existing.price && part.price) { existing.price = part.price; updatedCount = updatedCount || 1; }
 if ((!existing.code || existing.code === existing.id) && part.code && part.code !== part.id) {
 existing.code = part.code;
 }
 } else {
 state.cart.push({
 id: part.id,
 name: part.name,
 code: part.code || part.id,
 price: part.price || '',
 image: part.image || '',
 qty: qtyToAdd,
 machineContext: machineContext
 });
 addedCount++;
 }
 }
 });

 saveCart();
 renderCart();

 if (addedCount > 0 || updatedCount > 0) {
 let message = '';
 if (addedCount > 0 && updatedCount > 0) {
 message = `Added ${addedCount} new item(s) and updated ${updatedCount} item(s) in your cart.`;
 } else if (addedCount > 0) {
 message = `Added ${addedCount} item(s) to your cart.`;
 } else {
 message = `Updated quantities for ${updatedCount} item(s) in your cart.`;
 }
 showUpdateMessage(message);
 }

 finishWizard();
 }

 function triggerReverseWizard(partName) {
 log('Triggering Reverse Wizard for:', partName);
 if (!data.parts.length) return false;

 const cleanName = partName.trim().toLowerCase();
 const partDef = indexes.partsByName.get(cleanName);

 if (!partDef?.models?.length) return false;

 const compatibleDefs = data.modelMenu.filter(m => partDef.models.includes(m.fullName));
 if (!compatibleDefs.length) return false;

 state.wizState.brand = compatibleDefs[0].brand;
 const uniqueFamilies = [...new Set(compatibleDefs.map(d => d.family))];

 if (!DOM.wizContainer) return false;

 const cartContent = document.querySelector('.quote-cart-content');
 if (cartContent) cartContent.scrollTop = 0;
 showCart();

 if (uniqueFamilies.length > 1) {
 state.wizState.filter = { families: uniqueFamilies };
 } else {
 state.wizState.family = uniqueFamilies[0];
 const uniqueVariants = [...new Set(compatibleDefs.map(d => d.variant))];
 const hasRealVariants = uniqueVariants.some(v => v?.trim());

 if (hasRealVariants && uniqueVariants.length > 0) {
 state.wizState.filter = { variants: uniqueVariants };
 if (uniqueVariants.length === 1) {
 state.wizState.variant = uniqueVariants[0];
 }
 } else {
 state.wizState.variant = '';
 }
 }

 renderWizard();
 return true;
 }

 function showCart() {
 if (!DOM.cart) return;

 loadCMSData();
 DOM.cart.classList.add('open');
 DOM.cart.classList.remove('closed');
 updateButtons();
 }

 function hideCart() {
 if (!DOM.cart) return;
 DOM.cart.classList.remove('open');
 DOM.cart.classList.add('closed');
 updateButtons();
 }

 function updateButtons() {
 const isOpen = DOM.cart?.classList.contains('open');
 DOM.openBtns.forEach(btn => {
 btn.toggleAttribute('hidden', isOpen);
 });
 if (DOM.closeBtn) {
 DOM.closeBtn.style.display = isOpen ? 'flex' : 'none';
 }
 }

 function bindEvents() {

 DOM.openBtns.forEach(btn => {
 btn.addEventListener('click', (e) => {
 e.preventDefault();
 showCart();
 });
 });

 DOM.closeBtn?.addEventListener('click', hideCart);
 DOM.clearBtn?.addEventListener('click', clearCart);

 DOM.cartItems?.addEventListener('click', handleCartItemClick);
 DOM.cartItems?.addEventListener('change', handleCartItemChange);

 DOM.breadcrumbs?.addEventListener('click', handleBreadcrumbClick);
 DOM.activeStep?.addEventListener('click', handleWizardClick);

 document.addEventListener('click', handleGlobalClick);

 document.addEventListener('click', (e) => {
 if (!e.target.closest('.brand-dropdown')) {
 document.querySelectorAll('.brand-list').forEach(l => l.style.display = 'none');
 }
 });
 }

 function handleCartItemClick(e) {
 const item = e.target.closest('.quote-cart-item');
 if (!item) return;

 const id = item.dataset.id;

 if (e.target.closest('.cart-trash')) {
 removeFromCart(id);
 } else if (e.target.dataset.action === 'decrease') {
 updateCartQuantity(id, -1);
 } else if (e.target.dataset.action === 'increase') {
 updateCartQuantity(id, 1);
 }
 }

 function handleCartItemChange(e) {
 if (!e.target.classList.contains('quote-cart-item-qty')) return;

 const item = e.target.closest('.quote-cart-item');
 if (!item) return;

 const id = item.dataset.id;
 const value = parseInt(e.target.value);
 updateCartQuantity(id, isNaN(value) ? 1 : value);
 }

 function handleBreadcrumbClick(e) {
 const pill = e.target.closest('.wiz-pill.breadcrumb');
 if (!pill) return;

 const step = pill.dataset.step;
 goBackFrom(step);
 }

 function handleWizardClick(e) {
 const pill = e.target.closest('.wiz-pill:not(.breadcrumb)');
 if (pill && !e.target.closest('.wiz-add-btn')) {
 const value = pill.dataset.value;
 let step = null;

 if (!state.wizState.brand) step = 'brand';
 else if (!state.wizState.family) step = 'family';
 else if (state.wizState.variant === null) step = 'variant';
 else if (!state.wizState.size) step = 'size';

 if (step) selectOption(step, value);
 return;
 }

 const addBtn = e.target.closest('.wiz-add-btn');
 if (addBtn) {
 const item = addBtn.closest('.wiz-result-item');
 if (!item) return;

 const partId = item.dataset.partId;
 const qtyInput = item.querySelector('.wiz-result-qty');
 const qty = parseInt(qtyInput?.value) || 1;

 const part = indexes.partsById.get(partId);
 if (part) {
 const activeModel = data.modelMenu.find(d =>
 d.brand === state.wizState.brand &&
 d.family === state.wizState.family &&
 (d.variant || '') === (state.wizState.variant || '')
 );

 const machineContext = activeModel ?
 `${activeModel.brand} ${activeModel.family} ${activeModel.variant || ''}`.trim() : '';

 const wasUpdated = addPartToCart({
 name: part.name,
 id: part.id,
 code: part.code || '',
 price: part.price || '',
 qty: qty,
 image: part.image,
 machineContext: machineContext
 }, false);

 const msgText = wasUpdated ?
 `Updated quantity for ${part.name}` :
 `${part.name} added to your cart.`;
 showUpdateMessage(msgText);

 item.style.opacity = '0';
 setTimeout(() => {
 item.remove();
 const listDiv = DOM.activeStep?.querySelector('.wiz-results-list');
 if (listDiv && listDiv.children.length === 0) {
 listDiv.innerHTML = '<div style="color:#888;text-align:center;padding:10px;">All parts added to order!</div>';
 }
 }, 300);
 }
 }
 }

 function bindHomepageButtons() {

 const buttons = document.querySelectorAll('.add-to-quote-btn');

 buttons.forEach(btn => {

 const newBtn = btn.cloneNode(true);
 btn.parentNode.replaceChild(newBtn, btn);

 newBtn.addEventListener('click', function(e) {

 e.preventDefault();
 e.stopPropagation();
 e.stopImmediatePropagation();

 let productName = this.getAttribute('data-name') || this.getAttribute('data-add-to-quote');

 if (!productName) {
 const card = this.closest('.product-card, .brands-product-card, .w-dyn-item, .carousel-item');
 if (card) {
 const titleEl = card.querySelector('h3, h4, .product-title, .product-name');
 if (titleEl) productName = titleEl.textContent.trim();
 }
 }

 if (productName) {
 handleAddToQuote(this, productName);
 }

 return false;
 }, true);
 });

 log(`Bound ${buttons.length} add-to-quote buttons`);
 }

 function setOpenButtonIcon() {
 DOM.openBtns.forEach(btn => {
 if (btn.classList.contains('open-quote-cart-btn') || btn.id === 'open-quote-cart-btn') {
 btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
 btn.style.display = 'flex';
 btn.style.alignItems = 'center';
 btn.style.justifyContent = 'center';
 }
 });
 }

 function handleGlobalClick(e) {

 if (e._tillageworxHandled) return;

const openCartBtn = e.target.closest('.open-quote-cart, .open-quote-cart-btn, .quote-main-btn');
if (openCartBtn) {
 e.preventDefault();
 showCart();
 return;
}

 const dropdownToggle = e.target.closest('.brand-current');
 if (dropdownToggle) {
 const list = dropdownToggle.nextElementSibling;
 if (list?.classList.contains('brand-list')) {
 e.preventDefault();
 e.stopPropagation();
 const isVisible = list.style.display === 'block';
 document.querySelectorAll('.brand-list').forEach(l => l.style.display = 'none');
 list.style.display = isVisible ? 'none' : 'block';
 return;
 }
 }

 const btn = e.target.closest('[data-add-to-quote]:not(.add-to-quote-btn)');
 if (!btn) return;

 if (btn.classList.contains('carousel-link')) {
 const href = btn.getAttribute('href');
 const productName = btn.getAttribute('data-add-to-quote');

 if (href === '#open-cart') {
 e.preventDefault();
 showCart();
 return;
 }

 if (href && href !== '#' && href.trim() !== '' && !productName) {
 if (href.startsWith('http') && !href.includes(window.location.hostname)) {
 window.open(href, '_blank');
 }
 return;
 }

 if (productName) {
 e.preventDefault();
 handleAddToQuote(btn, productName);
 }
 }
 }

 function handleAddToQuote(btn, productName) {
 log('Adding to order:', productName);

 const card = btn.closest('.carousel-item, .product-card, .brands-product-card, .w-dyn-item');

 let imageUrl = btn.getAttribute('data-image');

 if (!imageUrl && card) {
 const hiddenImg = card.querySelector('.hidden-image-url');
 if (hiddenImg) {
 imageUrl = hiddenImg.textContent.trim();
 }
 }

 if (!imageUrl && card) {
 const img = card.querySelector('img');
 if (img) imageUrl = img.src;
 }

 let productId = btn.getAttribute('data-id');

 const canonicalPart = indexes.partsByName.get(productName.toLowerCase());
 if (canonicalPart) {
 productId = canonicalPart.id;
 productName = canonicalPart.name;
 if (!imageUrl) imageUrl = canonicalPart.image;
 }

 const part = {
 id: productId || productName,
 name: productName,
 code: btn.getAttribute('data-code') || '',
 price: btn.getAttribute('data-price') || '',
 image: imageUrl || '',
 qty: 1
 };

 const existing = state.cart.find(item => item.id === part.id);
 addPartToCart(part, false);

 if (existing) {
 showUpdateMessage(`Updated quantity for ${part.name}`);
 }

 triggerReverseWizard(part.name);
 }

 function init() {
 const startTime = performance.now();

 cacheDOM();
 loadCart();
 loadCMSData();
 initWizard();
 bindEvents();
 setOpenButtonIcon();

 setTimeout(bindHomepageButtons, 100);

 renderCart();

 const observer = new MutationObserver(() => {
 const items = document.querySelectorAll('.part-data-item');
 if (items.length > 0) {
 observer.disconnect();
 loadCMSData();
 log('CMS data reloaded after Webflow collection render:', items.length, 'items');
 }
 });
 observer.observe(document.body, { childList: true, subtree: true });

 setTimeout(() => observer.disconnect(), 10000);

 log('Initialized in', `${(performance.now() - startTime).toFixed(2)}ms`);
 }
window.renderCart = renderCart;
 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', init);
 } else {
 init();
 }
})();

(function() {
 const CART_KEY = 'tillageworx_quote_cart';

 function parsePrice(str) {
 if (!str) return null;
 const n = parseFloat(String(str).replace(/[^0-9.]/g, ''));
 return isNaN(n) ? null : n;
 }

 function escapeHtml(text) {
 const div = document.createElement('div');
 div.textContent = String(text || '');
 return div.innerHTML;
 }

 function getCart() {
 try {
 return JSON.parse(localStorage.getItem(CART_KEY)) || [];
 } catch(e) {
 return [];
 }
 }

function renderQuoteReview() {
 const cart = getCart();
 const tableContainer = document.getElementById('qr-parts-container');
 const summaryContainer = document.getElementById('qr-summary-container');
 const cartDataField = document.getElementById('qr-cart-data');
 const emptyMsg = document.getElementById('qr-empty-msg');
 const formSection = document.getElementById('qr-form-section');
 const flexRow = document.getElementById('qr-flex-row');
 const rightCol = document.getElementById('qr-right-col');
 const heroLeft = formSection ? formSection.querySelector('.hero-pages-left') : null;

 if (!tableContainer) return;

 if (!cart.length) {
 if (emptyMsg) emptyMsg.style.display = 'block';
 if (formSection) formSection.setAttribute('style', 'display:none');
 if (flexRow) flexRow.setAttribute('style', 'display:none');
 tableContainer.style.display = 'none';
 return;
 }

 if (emptyMsg) emptyMsg.style.display = 'none';
 if (flexRow) flexRow.setAttribute('style', 'display:flex;flex-direction:row;align-items:flex-start;gap:40px;width:100%;flex-wrap:nowrap');
 if (formSection) formSection.setAttribute('style', 'flex:1 1 0%;min-width:0;display:block');
 if (rightCol) rightCol.setAttribute('style', 'flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:24px');
 if (heroLeft) heroLeft.setAttribute('style', 'width:100%;max-width:none');

 let subtotal = 0;
 let allPriced = true;
 let rows = '';

 cart.forEach(item => {
 const safeQty = Math.max(1, item.qty || 1);
 const unitPrice = parsePrice(item.price);
 const lineTotal = unitPrice !== null ? unitPrice * safeQty : null;

 if (lineTotal !== null) {
 subtotal += lineTotal;
 } else {
 allPriced = false;
 }

 const lineTotalHtml = lineTotal !== null
 ? `$${lineTotal.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}`
 : `<span style="color:#888;font-style:italic;">TBC</span>`;

 rows += `
 <tr data-item-id="${escapeHtml(item.id)}">
 <td>
 ${item.image ? `<img src="${escapeHtml(item.image)}" class="qr-item-img" alt="">` : ''}
 <div class="qr-item-name">${escapeHtml(item.name)}</div>
 ${item.code && item.code !== item.id ? `<div class="qr-item-code">Product Code: ${escapeHtml(item.code)}</div>` : ''}
 </td>
 <td>${unitPrice !== null ? `$${unitPrice.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}` : `<span style="color:#888">TBC</span>`}</td>
 <td>
 <div class="qr-qty-controls">
 <button class="qr-qty-btn qr-qty-minus" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
 <span class="qr-qty-value">${safeQty}</span>
 <button class="qr-qty-btn qr-qty-plus" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
 </div>
 </td>
 <td>${lineTotalHtml}</td>
 <td><button class="qr-remove-btn" data-id="${escapeHtml(item.id)}" aria-label="Remove item">✕</button></td>
 </tr>
 `;
 });

 tableContainer.innerHTML = `
 <table class="qr-parts-table">
 <thead>
 <tr>
 <th>Part</th>
 <th>Unit Price</th>
 <th>Qty</th>
 <th>Total</th>
 <th></th>
 </tr>
 </thead>
 <tbody>${rows}</tbody>
 </table>
 <div class="qr-browse-row">
 <a href="/browse-brands" class="qr-browse-btn">← Keep Browsing</a>
 </div>
 `;

 tableContainer.querySelectorAll('.qr-qty-minus').forEach(btn => {
 btn.addEventListener('click', () => {
 const id = btn.dataset.id;
 const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
 const idx = stored.findIndex(i => i.id === id);
 if (idx > -1) {
 if (stored[idx].qty > 1) {
 stored[idx].qty--;
 } else {
 stored.splice(idx, 1);
 }
 localStorage.setItem(CART_KEY, JSON.stringify(stored));
 renderQuoteReview();
 }
 });
 });

 tableContainer.querySelectorAll('.qr-qty-plus').forEach(btn => {
 btn.addEventListener('click', () => {
 const id = btn.dataset.id;
 const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
 const idx = stored.findIndex(i => i.id === id);
 if (idx > -1) {
 stored[idx].qty = Math.min(999, (stored[idx].qty || 1) + 1);
 localStorage.setItem(CART_KEY, JSON.stringify(stored));
 renderQuoteReview();
 }
 });
 });

 tableContainer.querySelectorAll('.qr-remove-btn').forEach(btn => {
 btn.addEventListener('click', () => {
 const id = btn.dataset.id;
 const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
 const updated = stored.filter(i => i.id !== id);
 localStorage.setItem(CART_KEY, JSON.stringify(updated));
 renderQuoteReview();
 });
 });

 if (summaryContainer) {
 const gst = subtotal * 0.1;
 const total = subtotal + gst;
 let summaryHtml = '';

 if (subtotal > 0) {
 summaryHtml = `
 <div class="qr-summary-row"><span>${allPriced ? 'Subtotal' : 'Subtotal (priced items)'}</span><span>$${subtotal.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="qr-summary-row"><span>GST (10%)</span><span>$${gst.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="qr-summary-row"><span>Freight</span><span style="color:#888;font-style:italic;">TBA</span></div>
 <div class="qr-summary-row qr-summary-total"><span>Total (inc. GST)</span><span>$${total.toLocaleString("en-AU", {minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
 <div class="qr-freight-disclaimer">Once we receive your order, we will do our best to source the most affordable, reliable freight option.<br><br>We will then email you a Sales Order with freight included for you to accept.<br><br><span class="qr-freight-phone">📞 Questions? Call us on 08 6185 1944</span></div>
 `;
 if (!allPriced) {
 summaryHtml += `<div class="qr-summary-note" style="margin-top:8px;">Some items are price on request — our team will confirm final pricing before processing your order.</div>`;
 }
 } else {
 summaryHtml = `<div class="qr-summary-note">Our team will confirm pricing before processing your order.</div>`;
 }

 summaryContainer.innerHTML = summaryHtml;
 }

 if (cartDataField) {
 const cartSummary = cart.map(item => {
 const qty = Math.max(1, item.qty || 1);
 const unitPrice = parsePrice(item.price);
 const lineTotal = unitPrice !== null ? (unitPrice * qty).toFixed(2) : 'TBC';
 return `${item.name} (${item.code || item.id}) x${qty} @ ${item.price || 'TBC'} = $${lineTotal}`;
 }).join('\n');
 cartDataField.value = cartSummary;
 }
 }

 function initQRForm() {
  const sec = document.getElementById('qr-form-section');
  if (!sec || sec.dataset.qrFormInit) return;
  sec.dataset.qrFormInit = '1';

  const g = (id) => sec.querySelector('#' + id);
  const firstName = g('qr-first-name');
  const lastName  = g('qr-last-name');
  const email     = g('qr-email');
  const phone     = g('qr-phone');
  const business  = g('qr-business');
  const address   = g('qr-address');
  if (!firstName) return;

  const mkInput = (attrs) => {
   const inp = document.createElement('input');
   Object.entries(attrs).forEach(([k,v]) => inp.setAttribute(k,v));
   inp.style.cssText = 'width:100%;box-sizing:border-box;background:#1a1a1a;color:#fff;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.4;transition:border-color 0.2s,box-shadow 0.2s;margin-bottom:12px';
   inp.addEventListener('focus', () => { inp.style.borderColor='#c2934a'; inp.style.boxShadow='0 0 0 3px rgba(194,147,74,0.15)'; });
   inp.addEventListener('blur',  () => { inp.style.borderColor='#3a3a3a'; inp.style.boxShadow=''; });
   return inp;
  };

  const mkLabel = (text) => {
   const lbl = document.createElement('label');
   lbl.style.cssText = 'display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2934a;margin-bottom:5px;margin-top:4px';
   lbl.textContent = text;
   return lbl;
  };

  const wrapEl = (el) => {

   let container = el.closest('.input-container') || el.parentElement;

   if (!container || container === sec || container.tagName === 'FORM') container = el;
   const d = document.createElement('div');
   d.style.cssText = 'flex:1 1 0%;min-width:0';
   container.parentNode.insertBefore(d, container);
   d.appendChild(container);
   return d;
  };

  const firstNameContainer = firstName.closest('.input-container') || firstName.parentElement;
  const nameRow = document.createElement('div');
  nameRow.className = 'qr-name-row';
  firstNameContainer.parentNode.insertBefore(nameRow, firstNameContainer);
  nameRow.appendChild(wrapEl(firstName));
  if (lastName) nameRow.appendChild(wrapEl(lastName));

  const emailContainer = email.closest('.input-container') || email.parentElement;
  const contactRow = document.createElement('div');
  contactRow.className = 'qr-contact-row';
  emailContainer.parentNode.insertBefore(contactRow, emailContainer);
  contactRow.appendChild(wrapEl(email));
  if (phone) contactRow.appendChild(wrapEl(phone));

  if (business) {
   const invBlock = document.createElement('div');
   business.parentNode.insertBefore(invBlock, business.nextSibling);
   invBlock.appendChild(mkLabel('Invoicing Address'));
   const invInput = mkInput({ type:'text', id:'qr-invoicing-address', name:'Invoicing Address', placeholder:'Address, Town, State, Postcode' });
   invBlock.appendChild(invInput);

   if (address) {
    const addrContainer = address.closest('.input-container') || address.parentElement;
    const addrBlock = document.createElement('div');
    addrContainer.parentNode.insertBefore(addrBlock, addrContainer);

    const sameRow = document.createElement('div');
    sameRow.className = 'qr-same-address-row';
    sameRow.style.marginTop = '4px';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'qr-diff-delivery';
    const cbLbl = document.createElement('label');
    cbLbl.setAttribute('for', 'qr-diff-delivery');
    cbLbl.textContent = 'Delivery address is different from invoicing address';
    sameRow.appendChild(cb);
    sameRow.appendChild(cbLbl);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'qr-delivery-input-wrapper';
    inputWrapper.appendChild(addrContainer);

    addrBlock.appendChild(sameRow);
    addrBlock.appendChild(inputWrapper);

    address.value = '';
    address.required = false;
    address.placeholder = 'Please include business name if delivering to local depot';

    cb.addEventListener('change', () => {
     if (cb.checked) {
      inputWrapper.classList.add('visible');
      address.required = true;
     } else {
      inputWrapper.classList.remove('visible');
      address.value = '';
      address.required = false;
     }
    });
   }
  }
 }

 document.addEventListener('DOMContentLoaded', () => {
  renderQuoteReview();
  initQRForm();
 });
})();
(function(){
  var nav = document.querySelector('.navbar');
  if (!nav) return;
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        var y = window.scrollY, delta = y - lastY;
        if (delta < 0) {
          nav.style.transform = 'translateY(0)';
          nav.style.transition = 'transform 0.25s ease';
        } else if (delta > 4 && y > 80) {
          nav.style.transform = 'translateY(-110%)';
          nav.style.transition = 'transform 0.25s ease';
        }
        lastY = y; ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
