/**
 * LAYVORA CHECKOUT POPUP CONTROLLER
 * 4-Step: Order Review → Shipping → Payment → Confirmation
 * KSA Market: Mada, Apple Pay, Tamara, Tabby, Visa, COD
 */

const LayvoraCheckout = {
  currentStep: 1,
  selectedPayment: 'mada',
  selectedDelivery: 'standard',
  deliveryCost: 0,

  // ── Open / Close ────────────────────────────────────────────────────────────

  open() {
    this.currentStep = 1;
    this.renderStep1();
    this.goToStep(1);
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    this.bindCheckoutEvents();
  },

  close() {
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // ── Step Navigation ─────────────────────────────────────────────────────────

  goToStep(step) {
    this.currentStep = step;

    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(el => el.classList.add('hidden'));
    // Show target step
    const target = document.getElementById(`checkout-step-${step}`);
    if (target) target.classList.remove('hidden');

    // Update progress indicators
    for (let i = 1; i <= 4; i++) {
      const indicator = document.getElementById(`step-indicator-${i}`);
      if (!indicator) continue;
      indicator.classList.remove('active', 'completed');
      if (i === step) indicator.classList.add('active');
      if (i < step)  indicator.classList.add('completed');
    }

    // Update progress lines
    document.querySelectorAll('.checkout-step-line').forEach((line, idx) => {
      line.classList.toggle('done', idx < step - 1);
    });

    // Scroll modal to top
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.scrollTop = 0;

    // Step-specific setup
    if (step === 1) this.renderStep1();
    if (step === 3) this.renderStep3();
    if (step === 4) this.renderConfirmation();
  },

  // ── Step 1: Order Review ─────────────────────────────────────────────────────

  renderStep1() {
    const cart  = LayvoraTheme.state.cart;
    const lang  = LayvoraTheme.state.lang;
    const cur   = lang === 'ar' ? 'ر.س' : 'SAR';
    const list  = document.getElementById('checkoutItemsList');

    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--color-text-muted);">
        <div style="font-size:2.5rem;">🛍️</div>
        <p>${lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
      </div>`;
    } else {
      list.innerHTML = cart.map(item => `
        <div class="co-item">
          <img src="${item.image}" class="co-item-img" alt="${item.title}">
          <div class="co-item-info">
            <div class="co-item-title">${item.title}</div>
            <div class="co-item-qty">${lang === 'ar' ? 'الكمية' : 'Qty'}: ${item.quantity}</div>
          </div>
          <div class="co-item-price">${(item.price * item.quantity).toFixed(2)} ${cur}</div>
        </div>
      `).join('');
    }

    this.updateTotals();
  },

  // ── Totals Calculator ────────────────────────────────────────────────────────

  updateTotals() {
    const cart      = LayvoraTheme.state.cart;
    const lang      = LayvoraTheme.state.lang;
    const cur       = lang === 'ar' ? 'ر.س' : 'SAR';
    const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const VAT_RATE  = 0.15;

    // Shipping: free over 200 SAR, express adds 25 SAR
    const baseShipping = subtotal >= 200 ? 0 : 30;
    this.deliveryCost  = this.selectedDelivery === 'express' ? baseShipping + 25 : baseShipping;

    const vat   = subtotal * VAT_RATE;
    const total = subtotal + vat + this.deliveryCost;

    this._setText('co-subtotal', `${subtotal.toFixed(2)} ${cur}`);
    this._setText('co-vat',      `${vat.toFixed(2)} ${cur}`);
    this._setText('co-total',    `${total.toFixed(2)} ${cur}`);
    this._setText('co-total-payment', `${total.toFixed(2)} ${cur}`);

    const shippingEl = document.getElementById('co-shipping');
    if (shippingEl) {
      shippingEl.textContent = this.deliveryCost === 0
        ? (lang === 'ar' ? '🎉 مجاني' : '🎉 Free')
        : `${this.deliveryCost} ${cur}`;
      shippingEl.style.color = this.deliveryCost === 0 ? 'var(--color-primary)' : 'var(--color-text-main)';
    }

    // Update Tamara / Tabby installments
    const installment = (total / 4).toFixed(2);
    this._setText('tamaraInstallmentText', `${installment} ${cur} / ${lang === 'ar' ? 'كل دفعة · بدون فوائد' : 'per payment · 0% interest'}`);
    this._setText('tabbyInstallmentText',  `${installment} ${cur} / ${lang === 'ar' ? 'كل دفعة · بدون فوائد' : 'per payment · 0% interest'}`);
  },

  // ── Step 2: Validate Shipping ────────────────────────────────────────────────

  validateShipping() {
    const name     = document.getElementById('co-name')?.value?.trim();
    const phone    = document.getElementById('co-phone')?.value?.trim();
    const city     = document.getElementById('co-city')?.value;
    const district = document.getElementById('co-district')?.value?.trim();
    const address  = document.getElementById('co-address')?.value?.trim();
    const lang     = LayvoraTheme.state.lang;

    const errors = [];
    if (!name)     errors.push(lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required');
    if (!phone || phone.length < 9) errors.push(lang === 'ar' ? 'رقم جوال سعودي صحيح مطلوب' : 'Valid Saudi mobile number required');
    if (!city)     errors.push(lang === 'ar' ? 'اختر المدينة' : 'Please select a city');
    if (!district) errors.push(lang === 'ar' ? 'الحي / المنطقة مطلوب' : 'District / area is required');
    if (!address)  errors.push(lang === 'ar' ? 'العنوان التفصيلي مطلوب' : 'Detailed address is required');

    if (errors.length > 0) {
      this.showToast(errors[0], 'error');
      return;
    }

    this.updateTotals();
    this.goToStep(3);
  },

  // ── Step 3: Payment Setup ────────────────────────────────────────────────────

  renderStep3() {
    this.updateTotals();
    this.updateCardFieldsVisibility();
  },

  updateCardFieldsVisibility() {
    const cardFields = document.getElementById('cardFields');
    if (!cardFields) return;
    const showCard = ['mada', 'visa'].includes(this.selectedPayment);
    cardFields.classList.toggle('hidden', !showCard);
  },

  // ── Place Order ──────────────────────────────────────────────────────────────

  placeOrder() {
    const lang = LayvoraTheme.state.lang;

    // Validate card if needed
    if (['mada', 'visa'].includes(this.selectedPayment)) {
      const cardNum = document.getElementById('co-card-num')?.value?.replace(/\s/g, '');
      const cardExp = document.getElementById('co-card-exp')?.value;
      const cardCvv = document.getElementById('co-card-cvv')?.value;
      if (!cardNum || cardNum.length < 13) {
        this.showToast(lang === 'ar' ? 'رقم البطاقة غير صحيح' : 'Invalid card number', 'error');
        return;
      }
      if (!cardExp || !cardExp.includes('/')) {
        this.showToast(lang === 'ar' ? 'تاريخ انتهاء البطاقة غير صحيح' : 'Invalid expiry date', 'error');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        this.showToast(lang === 'ar' ? 'رمز CVV غير صحيح' : 'Invalid CVV', 'error');
        return;
      }
    }

    // Simulate processing
    const btn = document.getElementById('placeOrderBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> ${lang === 'ar' ? 'جاري معالجة الدفع...' : 'Processing payment...'}`;
    }

    setTimeout(() => {
      if (btn) btn.disabled = false;
      // Clear cart
      LayvoraTheme.state.cart = [];
      LayvoraTheme.updateCartCount();
      // Go to success
      this.goToStep(4);
    }, 2200);
  },

  // ── Step 4: Confirmation ──────────────────────────────────────────────────────

  renderConfirmation() {
    const lang = LayvoraTheme.state.lang;
    const cur  = lang === 'ar' ? 'ر.س' : 'SAR';

    // Generate order number
    const orderNum = `#LV-${Date.now().toString().slice(-6)}`;
    this._setText('orderNumberDisplay', orderNum);

    // Payment method label
    const paymentLabels = {
      mada:      lang === 'ar' ? 'بطاقة مدى' : 'Mada Card',
      'apple-pay': 'Apple Pay',
      tamara:    lang === 'ar' ? 'تمارا (4 دفعات)' : 'Tamara (4 Payments)',
      tabby:     lang === 'ar' ? 'تابي (4 دفعات)' : 'Tabby (4 Payments)',
      visa:      lang === 'ar' ? 'فيزا / ماستركارد' : 'Visa / Mastercard',
      cod:       lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'
    };
    this._setText('confirmPaymentMethod', paymentLabels[this.selectedPayment] || this.selectedPayment);

    // Total
    const totalEl = document.getElementById('co-total-payment');
    if (totalEl) {
      this._setText('confirmTotalPaid', totalEl.textContent);
    }

    // Delivery date
    const today = new Date();
    const deliveryDays = this.selectedDelivery === 'express' ? 1 : 3;
    today.setDate(today.getDate() + deliveryDays);
    const dateStr = today.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    this._setText('confirmDeliveryDate', dateStr);
  },

  // ── Events ───────────────────────────────────────────────────────────────────

  bindCheckoutEvents() {
    // Close button
    const closeBtn = document.getElementById('checkoutCloseBtn');
    if (closeBtn && !closeBtn._bound) {
      closeBtn.addEventListener('click', () => this.close());
      closeBtn._bound = true;
    }

    // Overlay click to close
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay && !overlay._bound) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
      overlay._bound = true;
    }

    // Payment method selection
    const grid = document.getElementById('paymentMethodsGrid');
    if (grid && !grid._bound) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.payment-method-card');
        if (!card) return;
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedPayment = card.dataset.method;
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.updateCardFieldsVisibility();
      });
      grid._bound = true;
    }

    // Delivery option selection
    document.querySelectorAll('.delivery-card').forEach(card => {
      if (card._bound) return;
      card.addEventListener('click', () => {
        document.querySelectorAll('.delivery-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedDelivery = card.querySelector('input[type="radio"]')?.value || 'standard';
        this.updateTotals();
      });
      card._bound = true;
    });

    // Card number formatting
    const cardNumInput = document.getElementById('co-card-num');
    if (cardNumInput && !cardNumInput._bound) {
      cardNumInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;
      });
      cardNumInput._bound = true;
    }

    // Card expiry formatting
    const cardExpInput = document.getElementById('co-card-exp');
    if (cardExpInput && !cardExpInput._bound) {
      cardExpInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
        e.target.value = val;
      });
      cardExpInput._bound = true;
    }

    // ESC key to close
    if (!document._coEscBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
      document._coEscBound = true;
    }
  },

  // ── Toast notification ────────────────────────────────────────────────────────

  showToast(message, type = 'info') {
    let toast = document.getElementById('layvoraToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'layvoraToast';
      toast.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px);
        background:${type === 'error' ? '#FF5A5F' : 'var(--color-primary)'};
        color:#fff; padding:12px 24px; border-radius:var(--radius-full);
        font-weight:600; font-size:0.9rem; z-index:99999;
        box-shadow:0 8px 24px rgba(0,0,0,0.2);
        transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
        opacity:0; white-space:nowrap; max-width:90vw; text-align:center;
        font-family:var(--font-family);
      `;
      document.body.appendChild(toast);
    }
    toast.style.background = type === 'error' ? '#FF5A5F' : 'var(--color-primary)';
    toast.textContent = message;
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, 3500);
  },

  // ── Utility ───────────────────────────────────────────────────────────────────

  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
};
