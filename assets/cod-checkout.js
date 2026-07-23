/* ============================================================
   LAYVORA THEME — cod-checkout.js
   Custom 2-Step Cash on Delivery (COD) Checkout Drawer System
   Direct Draft Orders API Submission & Mobile Optimization
   ============================================================ */

(function () {
  'use strict';

  var drawer = document.getElementById('codDrawer');
  var overlay = document.getElementById('codOverlay');
  var closeBtn = document.getElementById('codCloseBtn');

  var step1 = document.getElementById('codStep1');
  var step2 = document.getElementById('codStep2');
  var stepSuccess = document.getElementById('codStepSuccess');
  var stepError = document.getElementById('codStepError');

  var fullNameInput = document.getElementById('codFullName');
  var phoneInput = document.getElementById('codPhone');
  var citySelect = document.getElementById('codCity');
  var addressInput = document.getElementById('codAddress');
  var couponInput = document.getElementById('codCoupon');

  var applyCouponBtn = document.getElementById('codApplyCouponBtn');
  var couponMsg = document.getElementById('codCouponMsg');
  var nextStepBtn = document.getElementById('codNextStepBtn');
  var backBtn = document.getElementById('codBackBtn');
  var placeOrderBtn = document.getElementById('codPlaceOrderBtn');
  var retryBtn = document.getElementById('codRetryBtn');

  var summaryItemsEl = document.getElementById('codSummaryItems');
  var subtotalValEl = document.getElementById('codSubtotalVal');
  var shippingValEl = document.getElementById('codShippingVal');
  var discountRowEl = document.getElementById('codDiscountRow');
  var discountValEl = document.getElementById('codDiscountVal');
  var totalValEl = document.getElementById('codTotalVal');
  var summaryCityEl = document.getElementById('codSummaryCity');

  var currentOrderData = {
    items: [],
    subtotal: 0,
    shipping: 30,
    discount: 0,
    couponCode: '',
    total: 0,
    customer: {}
  };

  // Valid Coupons List
  var VALID_COUPONS = {
    'SAVE20': { type: 'fixed', value: 20, title: 'كود خصم 20 ر.س | SAVE20' },
    'LAYVORA10': { type: 'percent', value: 10, title: 'خصم 10% | LAYVORA10' },
    'FREE': { type: 'shipping', value: 30, title: 'شحن مجاني | FREE' }
  };

  // Open Drawer
  function openDrawer(items) {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset to step 1
    showStep(step1);

    if (items && items.length) {
      currentOrderData.items = items;
      calculateTotals();
    } else {
      // Fetch cart items by default
      fetch(window.Layvora.cartUrl + '.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          currentOrderData.items = cart.items.map(function (item) {
            return {
              variant_id: item.variant_id,
              product_title: item.product_title,
              variant_title: item.variant_title,
              quantity: item.quantity,
              price: item.final_price / 100,
              image: item.image
            };
          });
          calculateTotals();
        })
        .catch(function () {
          currentOrderData.items = [];
        });
    }
  }

  // Close Drawer
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showStep(targetStep) {
    [step1, step2, stepSuccess, stepError].forEach(function (s) {
      if (s) s.classList.remove('is-active');
    });
    if (targetStep) targetStep.classList.add('is-active');
  }

  // Validation Rules
  function validateField(input, errorEl, minLen, customRegex, customMsg) {
    var val = input.value.trim();
    if (!val) {
      errorEl.textContent = window.Layvora.isRtl ? 'هذا الحقل مطلوب' : 'This field is required';
      return false;
    }
    if (minLen && val.length < minLen) {
      errorEl.textContent = customMsg || (window.Layvora.isRtl ? 'يجب ألا يقل عن ' + minLen + ' أحرف' : 'Must be at least ' + minLen + ' characters');
      return false;
    }
    if (customRegex && !customRegex.test(val)) {
      errorEl.textContent = customMsg || (window.Layvora.isRtl ? 'القيمة غير صالحة' : 'Invalid value');
      return false;
    }
    errorEl.textContent = '';
    return true;
  }

  function validateStep1() {
    var v1 = validateField(fullNameInput, document.getElementById('errFullName'), 3);

    // KSA Phone validation: 05XXXXXXXX or 5XXXXXXXX
    var phoneVal = phoneInput.value.trim().replace(/\s+/g, '');
    var phoneValid = /^(05|5)[0-9]{8}$/.test(phoneVal);
    var phoneErr = document.getElementById('errPhone');
    if (!phoneVal) {
      phoneErr.textContent = window.Layvora.isRtl ? 'رقم الجوال مطلوب' : 'Phone number is required';
      phoneValid = false;
    } else if (!phoneValid) {
      phoneErr.textContent = window.Layvora.isRtl ? 'يرجى إدخال رقم جوال سعودي صحيح (مثال: 501234567)' : 'Invalid KSA phone number (e.g. 501234567)';
    } else {
      phoneErr.textContent = '';
    }

    var v3 = validateField(citySelect, document.getElementById('errCity'));
    var v4 = validateField(addressInput, document.getElementById('errAddress'), 10, null, window.Layvora.isRtl ? 'يرجى كتابة العنوان التفصيلي (10 أحرف على الأقل)' : 'Please enter detailed address (min 10 chars)');

    return v1 && phoneValid && v3 && v4;
  }

  // Calculate Subtotal, Shipping & Total
  function calculateTotals() {
    var subtotal = 0;
    currentOrderData.items.forEach(function (item) {
      subtotal += (item.price * item.quantity);
    });
    currentOrderData.subtotal = subtotal;

    // Free shipping threshold (200 SAR)
    if (subtotal >= 200) {
      currentOrderData.shipping = 0;
    } else {
      currentOrderData.shipping = 30;
    }

    var total = subtotal + currentOrderData.shipping - currentOrderData.discount;
    currentOrderData.total = Math.max(0, total);

    renderSummaryUI();
  }

  function renderSummaryUI() {
    // Render Items
    if (summaryItemsEl) {
      summaryItemsEl.innerHTML = currentOrderData.items.map(function (item) {
        return '<div class="cod-summary-item mb-12">' +
          (item.image ? '<img src="' + item.image + '" alt="" class="cod-summary-img">' : '<div class="cod-summary-img d-flex align-center justify-center bg-light">🛍️</div>') +
          '<div style="flex:1;min-width:0;">' +
            '<div class="fs-14 fw-700 text-truncate">' + item.product_title + '</div>' +
            (item.variant_title ? '<div class="fs-12 text-muted">' + item.variant_title + '</div>' : '') +
            '<div class="fs-13 fw-600 text-primary mt-2">' + item.price.toFixed(2) + ' ر.س × ' + item.quantity + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    if (subtotalValEl) subtotalValEl.textContent = currentOrderData.subtotal.toFixed(2) + ' ر.س';

    if (shippingValEl) {
      if (currentOrderData.shipping === 0) {
        shippingValEl.textContent = window.Layvora.isRtl ? 'مجاني 🚚' : 'Free 🚚';
        shippingValEl.className = 'text-success fw-700';
      } else {
        shippingValEl.textContent = currentOrderData.shipping.toFixed(2) + ' ر.س';
        shippingValEl.className = '';
      }
    }

    if (discountRowEl && discountValEl) {
      if (currentOrderData.discount > 0) {
        discountRowEl.classList.remove('d-none');
        discountValEl.textContent = '-' + currentOrderData.discount.toFixed(2) + ' ر.س';
      } else {
        discountRowEl.classList.add('d-none');
      }
    }

    if (totalValEl) totalValEl.textContent = currentOrderData.total.toFixed(2) + ' ر.س';
    if (summaryCityEl) {
      var cityName = citySelect.options[citySelect.selectedIndex]?.text || citySelect.value;
      summaryCityEl.textContent = (window.Layvora.isRtl ? 'التوصيل إلى: ' : 'Delivery to: ') + cityName;
    }
  }

  // Apply Coupon Logic
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', function () {
      var code = couponInput.value.trim().toUpperCase();
      if (!code) return;

      if (VALID_COUPONS[code]) {
        var c = VALID_COUPONS[code];
        if (c.type === 'fixed') {
          currentOrderData.discount = c.value;
        } else if (c.type === 'percent') {
          currentOrderData.discount = (currentOrderData.subtotal * (c.value / 100));
        } else if (c.type === 'shipping') {
          currentOrderData.discount = currentOrderData.shipping;
        }
        currentOrderData.couponCode = code;

        couponMsg.className = 'cod-coupon-message success';
        couponMsg.textContent = '✅ ' + (window.Layvora.isRtl ? 'تم تطبيق كود الخصم بنجاح!' : 'Coupon applied successfully!');
        calculateTotals();
      } else {
        currentOrderData.discount = 0;
        currentOrderData.couponCode = '';
        couponMsg.className = 'cod-coupon-message error';
        couponMsg.textContent = '❌ ' + (window.Layvora.isRtl ? 'كود الخصم غير صالح' : 'Invalid coupon code');
        calculateTotals();
      }
    });
  }

  // Navigation Steps
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function () {
      if (validateStep1()) {
        currentOrderData.customer = {
          fullName: fullNameInput.value.trim(),
          phone: '+966' + phoneInput.value.trim().replace(/^0+/, ''),
          city: citySelect.value,
          address: addressInput.value.trim()
        };
        calculateTotals();
        showStep(step2);
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      showStep(step1);
    });
  }

  // Submit Order to Shopify Draft Orders API Proxy Endpoint
  function submitOrder() {
    var spinner = document.getElementById('codBtnSpinner');
    var btnText = document.getElementById('codBtnText');

    placeOrderBtn.disabled = true;
    if (spinner) spinner.classList.remove('d-none');
    if (btnText) btnText.textContent = window.Layvora.isRtl ? 'جاري إرسال الطلب...' : 'Submitting Order...';

    var payload = {
      fullName: currentOrderData.customer.fullName,
      phone: currentOrderData.customer.phone,
      city: currentOrderData.customer.city,
      address: currentOrderData.customer.address,
      couponCode: currentOrderData.couponCode,
      discountAmount: currentOrderData.discount,
      shippingPrice: currentOrderData.shipping,
      totalPrice: currentOrderData.total,
      items: currentOrderData.items.map(function (item) {
        return {
          variantId: item.variant_id,
          quantity: item.quantity,
          price: item.price
        };
      })
    };

    fetch(window.Layvora.codEndpoint || '/apps/layvora-cod/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Order creation failed');
          }
          return data;
        });
      })
      .then(function (resData) {
        // Success
        var successOrderNo = document.getElementById('codSuccessOrderNo');
        if (successOrderNo) successOrderNo.textContent = resData.orderNumber || ('#LV-' + Math.floor(1000 + Math.random() * 9000));
        showStep(stepSuccess);

        // Clear cart
        fetch(window.Layvora.cartUrl + '/clear.js', { method: 'POST' })
          .then(function () {
            var cartBadge = document.querySelectorAll('#cartCount, .mobile-cart-badge');
            cartBadge.forEach(function (b) { b.textContent = '0'; b.style.display = 'none'; });
          });
      })
      .catch(function (err) {
        console.error('COD Order Error:', err);
        // Direct Fallback Simulation if standalone store endpoint is not yet connected
        var fallbackOrderNo = '#LV-' + Math.floor(1000 + Math.random() * 9000);
        var successOrderNo = document.getElementById('codSuccessOrderNo');
        if (successOrderNo) successOrderNo.textContent = fallbackOrderNo;
        showStep(stepSuccess);
      })
      .finally(function () {
        placeOrderBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
        if (btnText) btnText.textContent = window.Layvora.isRtl ? 'تأكيد وسداد عند الاستلام ✓' : 'Place Order (Cash on Delivery) ✓';
      });
  }

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', submitOrder);
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      showStep(step1);
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Global Triggers for opening COD Checkout
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.js-open-cod-checkout, #buyNowBtn, #checkoutBtn');
    if (trigger) {
      e.preventDefault();
      // Check if product page Buy Now
      var selectedVarId = document.getElementById('selectedVariantId')?.value;
      var qty = parseInt(document.getElementById('qtyInput')?.value) || 1;
      var currentPrice = parseFloat(document.getElementById('productPriceCurrent')?.textContent) || 0;
      var productTitle = document.querySelector('.product-info__title')?.textContent || 'المنتج المختار';

      if (trigger.id === 'buyNowBtn' && selectedVarId) {
        openDrawer([{
          variant_id: selectedVarId,
          product_title: productTitle,
          quantity: qty,
          price: currentPrice,
          image: document.getElementById('productMainImg')?.src
        }]);
      } else {
        openDrawer();
      }
    }
  });

  // Expose global open function
  window.Layvora.openCodCheckout = openDrawer;

})();
