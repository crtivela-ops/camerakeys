/**
 * Camera Keys shopping cart.
 *
 * WORKER_URL: the Cloudflare Worker's free workers.dev address
 * (https://camerakeys-checkout.<subdomain>.workers.dev). Never camerakeys.com.
 * While it is empty, the Stripe Payment Link buttons stay and the cart is hidden.
 *
 * CART_LIVE: false = test mode. The cart only appears for someone who opens
 * camerakeys.com/?cart=test (remembered for that browser tab), so shoppers
 * keep the Payment Link buttons while the Worker uses the sk_test_ key.
 * Set to true after the live sk_live_ key is in the Worker.
 */
(function () {
  'use strict';

  var WORKER_URL = 'https://camerakeys-checkout.crtivela.workers.dev';
  var CART_LIVE = false;

  var STORAGE_KEY = 'camerakeys-cart';
  var MAX_QTY = 10;
  var CATALOG = {
    sunny16: { name: 'Sunny 16', price: 2000 },
    dof: { name: 'Depth of Field', price: 2000 },
    action: { name: 'Action', price: 2000 },
    set: { name: 'Full set', price: 4500 }
  };

  function resolveWorkerUrl() {
    var url = WORKER_URL;
    if (!url && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      try {
        var w = new URLSearchParams(location.search).get('worker');
        if (w && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/.test(w)) {
          url = w;
        }
      } catch (e) {}
    }
    return url;
  }

  function cartAllowed() {
    if (CART_LIVE) return true;
    try {
      var flag = new URLSearchParams(location.search).get('cart');
      if (flag === 'test') sessionStorage.setItem('camerakeys-cart-test', '1');
      if (flag === 'off') sessionStorage.removeItem('camerakeys-cart-test');
      return sessionStorage.getItem('camerakeys-cart-test') === '1';
    } catch (e) {
      return false;
    }
  }

  var workerUrl = resolveWorkerUrl();
  if (!workerUrl || !cartAllowed()) return;

  var cart = loadCart();
  var lastFocus = null;

  document.body.classList.add('cart-enabled');

  var toggle = document.querySelector('.cart-toggle');
  var panel = document.getElementById('cart-panel');
  var backdrop = document.querySelector('.cart-backdrop');
  var closeBtn = document.querySelector('.cart-close');
  var itemsEl = document.querySelector('.cart-items');
  var emptyEl = document.querySelector('.cart-empty');
  var countEl = document.querySelector('.cart-count');
  var subtotalEl = document.querySelector('.cart-subtotal-amount');
  var errorEl = document.querySelector('.cart-error');
  var checkoutBtn = document.querySelector('.cart-checkout');

  document.querySelectorAll('.add-to-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addItem(btn.getAttribute('data-id'));
      openCart();
    });
  });

  if (toggle) toggle.addEventListener('click', function () {
    if (document.body.classList.contains('cart-open')) closeCart();
    else openCart();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (backdrop) backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('cart-open')) closeCart();
  });
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

  if (itemsEl) {
    itemsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var row = btn.closest('[data-id]');
      if (!row) return;
      var id = row.getAttribute('data-id');
      if (btn.classList.contains('qty-inc')) changeQty(id, 1);
      else if (btn.classList.contains('qty-dec')) changeQty(id, -1);
      else if (btn.classList.contains('cart-item-remove')) removeItem(id);
    });
  }

  render();

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) return [];
      return data
        .map(function (item) {
          if (!item || !CATALOG[item.id]) return null;
          var qty = parseInt(item.qty, 10);
          if (!qty || qty < 1) return null;
          return { id: item.id, qty: Math.min(MAX_QTY, qty) };
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function addItem(id) {
    if (!CATALOG[id]) return;
    var found = cart.find(function (item) { return item.id === id; });
    if (found) found.qty = Math.min(MAX_QTY, found.qty + 1);
    else cart.push({ id: id, qty: 1 });
    saveCart();
    render();
  }

  function changeQty(id, delta) {
    var found = cart.find(function (item) { return item.id === id; });
    if (!found) return;
    found.qty = Math.min(MAX_QTY, Math.max(0, found.qty + delta));
    if (found.qty < 1) cart = cart.filter(function (item) { return item.id !== id; });
    saveCart();
    render();
  }

  function removeItem(id) {
    cart = cart.filter(function (item) { return item.id !== id; });
    saveCart();
    render();
  }

  function countItems() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function subtotalCents() {
    return cart.reduce(function (sum, item) {
      return sum + CATALOG[item.id].price * item.qty;
    }, 0);
  }

  function formatMoney(cents) {
    var dollars = cents / 100;
    return Number.isInteger(dollars) ? '$' + dollars : '$' + dollars.toFixed(2);
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  }

  function render() {
    var totalCount = countItems();
    if (countEl) countEl.textContent = String(totalCount);
    if (toggle) {
      var label = totalCount === 1 ? 'Open cart, 1 item' : 'Open cart, ' + totalCount + ' items';
      toggle.setAttribute('aria-label', label);
    }
    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotalCents());
    if (checkoutBtn) checkoutBtn.disabled = totalCount === 0;
    if (emptyEl) emptyEl.hidden = totalCount !== 0;
    if (itemsEl) {
      itemsEl.hidden = totalCount === 0;
      itemsEl.innerHTML = cart.map(function (item) {
        var product = CATALOG[item.id];
        var name = escapeHtml(product.name);
        return (
          '<li data-id="' + escapeHtml(item.id) + '">' +
            '<div class="cart-item-info">' +
              '<span class="cart-item-name">' + name + '</span>' +
              '<span class="cart-item-line">' + formatMoney(product.price * item.qty) + '</span>' +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<div class="cart-item-qty">' +
                '<button type="button" class="qty-dec" aria-label="Decrease quantity of ' + name + '">−</button>' +
                '<span class="qty-value" aria-live="polite">' + item.qty + '</span>' +
                '<button type="button" class="qty-inc" aria-label="Increase quantity of ' + name + '">+</button>' +
              '</div>' +
              '<button type="button" class="cart-item-remove" aria-label="Remove ' + name + '">Remove</button>' +
            '</div>' +
          '</li>'
        );
      }).join('');
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openCart() {
    lastFocus = document.activeElement;
    document.body.classList.add('cart-open');
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    showError('');
    var focusTarget = closeBtn || panel;
    if (focusTarget && focusTarget.focus) focusTarget.focus();
  }

  function closeCart() {
    document.body.classList.remove('cart-open');
    if (panel) panel.setAttribute('aria-hidden', 'true');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function checkout() {
    if (!cart.length || !checkoutBtn) return;
    showError('');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Working…';

    fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(function (item) { return { id: item.id, qty: item.qty }; })
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        }).catch(function () {
          return { ok: res.ok, data: null };
        });
      })
      .then(function (result) {
        var url = result.data && result.data.url;
        if (result.ok && url) {
          window.location.assign(url);
          return;
        }
        var message = (result.data && result.data.error) || 'Checkout is temporarily unavailable. Please try again.';
        fail(message);
      })
      .catch(function () {
        fail("Couldn't reach checkout. Please try again.");
      });
  }

  function fail(message) {
    showError(message);
    if (checkoutBtn) {
      checkoutBtn.disabled = cart.length === 0;
      checkoutBtn.textContent = 'Checkout';
    }
  }
})();
