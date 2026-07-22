/**
 * LAYVORA SHOPIFY THEME - KSA MARKETPLACE
 * Interactive JavaScript engine: Cart Drawer, Language/RTL switch, Quick View, Tamara/Tabby calculator, Flash Timer
 */

document.addEventListener('DOMContentLoaded', () => {
  LayvoraTheme.init();
});

const LayvoraTheme = {
  // Theme state
  state: {
    lang: 'ar',
    dir: 'rtl',
    currency: 'SAR',
    cart: [
      {
        id: 1,
        title: 'عطر السمو الملكي - عود وورد طائفي',
        price: 299,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80'
      }
    ],
    wishlist: [1, 3],
    freeShippingThreshold: 200 // 200 SAR free shipping in KSA
  },

  init() {
    this.bindEvents();
    this.updateCartCount();
    this.initCountdownTimer();
  },

  bindEvents() {
    // Language / Direction Switcher
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.toggleLanguage(lang);
      });
    });

    // Cart Drawer Controls
    const cartTriggers = document.querySelectorAll('.cart-drawer-trigger');
    const closeCartBtns = document.querySelectorAll('.close-drawer-btn, .cart-drawer-overlay');
    
    cartTriggers.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openCartDrawer();
    }));

    closeCartBtns.forEach(btn => btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('cart-drawer-overlay') || e.currentTarget.classList.contains('close-drawer-btn')) {
        this.closeCartDrawer();
      }
    }));

    // Add to Cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn')) {
        const btn = e.target.closest('.add-to-cart-btn');
        const productId = parseInt(btn.dataset.id || '1');
        const title = btn.dataset.title || 'منتج فاخر';
        const price = parseFloat(btn.dataset.price || '150');
        const image = btn.dataset.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
        
        this.addToCart({ id: productId, title, price, image, quantity: 1 });
      }

      // Wishlist toggle
      if (e.target.closest('.wishlist-btn')) {
        const btn = e.target.closest('.wishlist-btn');
        btn.classList.toggle('active');
        const countBadge = document.querySelector('.wishlist-badge');
        if (countBadge) {
          let curr = parseInt(countBadge.textContent || '0');
          countBadge.textContent = btn.classList.contains('active') ? curr + 1 : Math.max(0, curr - 1);
        }
      }

      // Quick View Modal
      if (e.target.closest('.quick-view-btn')) {
        const btn = e.target.closest('.quick-view-btn');
        const productData = {
          id: btn.dataset.id,
          title: btn.dataset.title,
          price: btn.dataset.price,
          origPrice: btn.dataset.origPrice,
          image: btn.dataset.image,
          category: btn.dataset.category,
          desc: btn.dataset.desc
        };
        this.openQuickView(productData);
      }
    });

    // Close Modal
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay') || e.target.closest('.close-modal-btn')) {
          this.closeQuickView();
        }
      });
    }
  },

  toggleLanguage(lang) {
    this.state.lang = lang;
    this.state.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', this.state.dir);

    // Update switcher UI
    const activeText = document.querySelector('.current-lang-text');
    if (activeText) {
      activeText.textContent = lang === 'ar' ? 'العربية (ر.س)' : 'English (SAR)';
    }

    // Toggle translations in demo environment
    document.querySelectorAll('[data-ar]').forEach(el => {
      el.textContent = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    });

    this.renderCartItems();
  },

  openCartDrawer() {
    const overlay = document.querySelector('.cart-drawer-overlay');
    if (overlay) {
      this.renderCartItems();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeCartDrawer() {
    const overlay = document.querySelector('.cart-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  addToCart(item) {
    const existing = this.state.cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.state.cart.push(item);
    }
    this.updateCartCount();
    this.openCartDrawer();
  },

  updateQuantity(id, delta) {
    const item = this.state.cart.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.state.cart = this.state.cart.filter(i => i.id !== id);
      }
    }
    this.updateCartCount();
    this.renderCartItems();
  },

  updateCartCount() {
    const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = totalItems;
    });
  },

  renderCartItems() {
    const container = document.querySelector('.cart-drawer-items');
    const subtotalEl = document.querySelector('.cart-subtotal-val');
    const shippingBarFill = document.querySelector('.progress-bar-fill');
    const shippingText = document.querySelector('.free-shipping-text');

    if (!container) return;

    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
          <div style="font-size: 3rem; margin-bottom: 10px;">🛍️</div>
          <p>${this.state.lang === 'ar' ? 'سلة التسوق فارغة حالياً' : 'Your shopping cart is empty'}</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = `0 ${this.state.lang === 'ar' ? 'ر.س' : 'SAR'}`;
      if (shippingBarFill) shippingBarFill.style.width = '0%';
      return;
    }

    let subtotal = 0;
    let html = '';

    this.state.cart.forEach(item => {
      const itemSub = item.price * item.quantity;
      subtotal += itemSub;

      html += `
        <div class="cart-item">
          <img src="${item.image}" class="cart-item-img" alt="${item.title}">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">${item.price} ${this.state.lang === 'ar' ? 'ر.س' : 'SAR'}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="LayvoraTheme.updateQuantity(${item.id}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="LayvoraTheme.updateQuantity(${item.id}, 1)">+</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} ${this.state.lang === 'ar' ? 'ر.س' : 'SAR'}`;

    // Calculate free shipping progress for Saudi Arabia
    const threshold = this.state.freeShippingThreshold;
    const progressPercent = Math.min(100, (subtotal / threshold) * 100);
    if (shippingBarFill) shippingBarFill.style.width = `${progressPercent}%`;

    if (shippingText) {
      if (subtotal >= threshold) {
        shippingText.textContent = this.state.lang === 'ar' 
          ? '🎉 تهانينا! حصلت على شحن مجاني داخل السعودية' 
          : '🎉 Congratulations! You unlocked Free Delivery in KSA';
      } else {
        const remaining = (threshold - subtotal).toFixed(2);
        shippingText.textContent = this.state.lang === 'ar'
          ? `أضف ${remaining} ر.س للحصول على شحن مجاني داخل المملكة`
          : `Add ${remaining} SAR more for Free KSA Shipping`;
      }
    }
  },

  openQuickView(p) {
    const modal = document.querySelector('.modal-overlay');
    if (!modal) return;

    const tamaraInstallment = (parseFloat(p.price || 0) / 4).toFixed(2);

    modal.querySelector('.modal-body').innerHTML = `
      <div class="modal-gallery">
        <img src="${p.image}" style="width:100%; border-radius:12px; aspect-ratio:1; object-fit:cover;" alt="${p.title}">
      </div>
      <div class="modal-info" style="display:flex; flex-direction:column; justify-content:center;">
        <span class="badge badge-primary" style="align-self:flex-start; margin-bottom:10px;">${p.category || 'جديد'}</span>
        <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:10px;">${p.title}</h2>
        <div style="font-size:1.4rem; font-weight:800; color:var(--color-primary); margin-bottom:14px;">
          ${p.price} ${this.state.lang === 'ar' ? 'ر.س' : 'SAR'}
          ${p.origPrice ? `<span style="font-size:0.9rem; text-decoration:line-through; color:#94A3B8; margin-inline-start:8px;">${p.origPrice} ${this.state.lang === 'ar' ? 'ر.س' : 'SAR'}</span>` : ''}
        </div>
        
        <!-- Tamara BNPL Calculator -->
        <div style="background:var(--color-bg-secondary); padding:12px; border-radius:10px; margin-bottom:20px; font-size:0.85rem;">
          <span style="background:#37C392; color:#fff; font-weight:700; padding:2px 6px; border-radius:4px;">تمارا</span>
          قسمها على 4 دفعات بدون فوائد بقيمة <strong>${tamaraInstallment} ر.س</strong> / شهر
        </div>

        <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:24px; line-height:1.6;">
          ${p.desc || 'منتج عالي الجودة ومصمم خصيصاً ليناسب الذوق السعودي الرفيع بأعلى معايير الفخامة والضمان.'}
        </p>

        <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}" data-title="${p.title}" data-price="${p.price}" data-image="${p.image}">
          🛒 ${this.state.lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
        </button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeQuickView() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  initCountdownTimer() {
    let hours = 14, minutes = 32, seconds = 45;
    setInterval(() => {
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
      }
      const hEl = document.querySelector('.timer-h');
      const mEl = document.querySelector('.timer-m');
      const sEl = document.querySelector('.timer-s');

      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }, 1000);
  }
};
