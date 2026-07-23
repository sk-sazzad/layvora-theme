/* ============================================================
   LAYVORA THEME — theme.js
   Frontend JS for AJAX Cart, Wishlist, Toast Alerts,
   Product Gallery Swipe/Zoom, and Responsive Interactivity
   ============================================================ */

(function () {
  'use strict';

  // ── 1. TOAST NOTIFICATION SYSTEM ─────────────────────────
  window.Layvora = window.Layvora || {};

  window.Layvora.showToast = function (message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast';
      document.body.appendChild(container);
    }

    var item = document.createElement('div');
    item.className = 'toast-item ' + type;
    var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    item.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
    container.appendChild(item);

    requestAnimationFrame(function () {
      item.classList.add('is-visible');
    });

    setTimeout(function () {
      item.classList.remove('is-visible');
      setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 400);
    }, 3500);
  };

  // ── 2. AJAX ADD TO CART ──────────────────────────────────
  function updateCartCount(count) {
    var badges = document.querySelectorAll('#cartCount, .mobile-cart-badge');
    badges.forEach(function (badge) {
      badge.textContent = count;
      if (count > 0) {
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
    window.Layvora.itemCount = count;
  }

  function addToCart(variantId, quantity, btnEl) {
    quantity = quantity || 1;
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.dataset.origText = btnEl.innerHTML;
      btnEl.innerHTML = '⏳ ' + (window.Layvora.isRtl ? 'جاري الإضافة...' : 'Adding...');
    }

    fetch(window.Layvora.cartAddUrl + '.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: variantId,
        quantity: quantity
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Add to cart failed');
        return res.json();
      })
      .then(function (item) {
        // Fetch updated cart to get total count
        return fetch(window.Layvora.cartUrl + '.js')
          .then(function (r) { return r.json(); })
          .then(function (cart) {
            updateCartCount(cart.item_count);
            var successMsg = window.Layvora.isRtl
              ? 'تم إضافة "' + item.product_title + '" إلى سلتك بنجاح 🛒'
              : '"' + item.product_title + '" added to your cart 🛒';
            window.Layvora.showToast(successMsg, 'success');
          });
      })
      .catch(function (err) {
        console.error(err);
        var errorMsg = window.Layvora.isRtl ? 'حدث خطأ أثناء الإضافة للسلة' : 'Error adding item to cart';
        window.Layvora.showToast(errorMsg, 'error');
      })
      .finally(function () {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = btnEl.dataset.origText || (window.Layvora.isRtl ? 'أضف إلى السلة' : 'Add to Cart');
        }
      });
  }

  // Delegated click handler for Add to Cart
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-add-to-cart');
    if (btn) {
      e.preventDefault();
      var variantId = btn.getAttribute('data-variant-id');
      if (variantId) {
        addToCart(variantId, 1, btn);
      }
    }
  });

  // Product detail page form submission
  var productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var variantId = document.getElementById('selectedVariantId')?.value;
      var qty = parseInt(document.getElementById('qtyInput')?.value) || 1;
      var atcBtn = document.getElementById('atcBtn');
      if (variantId) {
        addToCart(variantId, qty, atcBtn);
      }
    });
  }

  // ── 3. WISHLIST SYSTEM (LOCALSTORAGE) ──────────────────────
  var WISHLIST_KEY = 'layvora_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setWishlist(list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function updateWishlistButtons() {
    var wishlist = getWishlist();
    var btns = document.querySelectorAll('.js-wishlist-btn');
    btns.forEach(function (btn) {
      var pid = btn.getAttribute('data-product-id');
      if (wishlist.includes(pid)) {
        btn.classList.add('is-active');
        btn.querySelector('svg')?.setAttribute('fill', '#E74C3C');
      } else {
        btn.classList.remove('is-active');
        btn.querySelector('svg')?.setAttribute('fill', 'none');
      }
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-wishlist-btn');
    if (btn) {
      e.preventDefault();
      var pid = btn.getAttribute('data-product-id');
      if (!pid) return;
      var wishlist = getWishlist();
      var idx = wishlist.indexOf(pid);
      if (idx > -1) {
        wishlist.splice(idx, 1);
        window.Layvora.showToast(window.Layvora.isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist', 'warning');
      } else {
        wishlist.push(pid);
        window.Layvora.showToast(window.Layvora.isRtl ? 'تمت الإضافة للمفضلة ❤️' : 'Added to wishlist ❤️', 'success');
      }
      setWishlist(wishlist);
      updateWishlistButtons();
    }
  });

  // Initial wishlist state sync
  updateWishlistButtons();

  // ── 4. CART QUANTITY ADJUSTERS (AJAX) ──────────────────────
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-cart-qty');
    if (btn) {
      e.preventDefault();
      var line = btn.getAttribute('data-line');
      var newQty = btn.getAttribute('data-qty');
      if (line && newQty !== null) {
        fetch(window.Layvora.cartChangeUrl + '.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            line: parseInt(line),
            quantity: parseInt(newQty)
          })
        })
          .then(function () {
            window.location.reload();
          });
      }
    }
  });

  // ── 5. MOBILE STICKY ATC VISIBILITY ────────────────────────
  var mainAtc = document.getElementById('atcBtn');
  var stickyAtc = document.getElementById('stickyAtc');

  if (mainAtc && stickyAtc && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          stickyAtc.style.display = 'none';
        } else {
          if (window.innerWidth <= 768) {
            stickyAtc.style.display = 'flex';
          }
        }
      });
    }, { threshold: 0.1 });
    observer.observe(mainAtc);
  }

  // ── 6. SORT SELECTION ON COLLECTION PAGE ───────────────────
  var sortSelect = document.getElementById('SortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', this.value);
      window.location.href = url.toString();
    });

    // Set current value from URL
    var currentSort = new URL(window.location.href).searchParams.get('sort_by');
    if (currentSort) sortSelect.value = currentSort;
  }

})();
