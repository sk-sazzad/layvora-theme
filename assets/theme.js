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
    this.initCategoryTabs();
    // Apply initial language state visuals
    this.applyLanguageState(this.state.lang);
  },

  // ─── LANGUAGE / DIRECTION TOGGLE ────────────────────────────────────────────

  toggleLanguage(lang) {
    if (this.state.lang === lang) return; // Already active — skip
    this.state.lang = lang;
    this.state.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.applyLanguageState(lang);
    this.renderCartItems();
  },

  applyLanguageState(lang) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    // 1. Set HTML lang + dir attributes
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);

    // 2. Swap CSS font-family via body class
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-ar', lang === 'ar');

    // 3. Translate elements that have data-ar / data-en (text-only, safe)
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      const arText = el.getAttribute('data-ar');
      const enText = el.getAttribute('data-en');
      if (!arText || !enText) return;

      // Only replace textContent if the element has no important child elements
      const hasChildElements = [...el.children].some(c => !c.classList.contains('tag-hot'));
      if (!hasChildElements) {
        el.textContent = lang === 'ar' ? arText : enText;
        // Preserve tag-hot span if it was stripped
      } else {
        // For elements with children (e.g. nav links with .tag-hot badge), 
        // only update the text node, not child elements
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            // Find the plain text part from data attributes
            const tagHotText = el.querySelector('.tag-hot')?.textContent || '';
            const fullText = lang === 'ar' ? arText : enText;
            node.textContent = fullText.replace(tagHotText, '').trim() + ' ';
          }
        });
      }
    });

    // 4. Translate placeholder attributes
    document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
      el.setAttribute('placeholder', lang === 'ar'
        ? el.getAttribute('data-ar-placeholder')
        : el.getAttribute('data-en-placeholder'));
    });

    // 5. Update language button active states
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('lang-active', btn.dataset.lang === lang);
    });

    // 6. Update current lang display text in all switchers
    document.querySelectorAll('.current-lang-text').forEach(el => {
      el.textContent = lang === 'ar' ? 'العربية (ر.س)' : 'English (SAR)';
    });

    // 7. Flip layout: nav-list direction
    document.querySelectorAll('.nav-list').forEach(el => {
      el.style.flexDirection = dir === 'rtl' ? 'row' : 'row-reverse';
    });

    // 8. Update announcement ticker text directly
    const ticker = document.querySelector('.announcement-ticker > span:not(.highlight)');
    if (ticker) {
      ticker.textContent = lang === 'ar'
        ? 'شحن مجاني لجميع مدن المملكة (الرياض، جدة، الدمام) عند الشراء بقيمة 200 ر.س'
        : 'Free delivery across KSA on orders over 200 SAR';
    }

    // 9. Update search placeholder
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.setAttribute('placeholder', lang === 'ar'
        ? 'ابحث عن عطور، أزياء، إلكترونيات...'
        : 'Search perfumes, fashion, electronics...');
    }

    // 10. Update page title
    document.title = lang === 'ar'
      ? 'متجر لافورا السعودي | Layvora KSA'
      : 'Layvora KSA | Saudi Arabia Premium Store';

    // 11. Update section headings using data-ar / data-en on h2/h1
    document.querySelectorAll('h1[data-ar], h2[data-ar], h3[data-ar], p[data-ar], span[data-ar], button[data-ar], a[data-ar]').forEach(el => {
      const arText = el.getAttribute('data-ar');
      const enText = el.getAttribute('data-en');
      if (arText && enText) {
        el.textContent = lang === 'ar' ? arText : enText;
      }
    });
  },

  // ─── CATEGORY TABS ──────────────────────────────────────────────────────────

  initCategoryTabs() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.tab-pill')) {
        const btn = e.target.closest('.tab-pill');
        const cat = btn.dataset.category;

        document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const products = document.querySelectorAll('.tabbed-products-grid .product-card');
        products.forEach(p => {
          if (cat === 'all' || p.dataset.cat === cat) {
            p.style.display = 'flex';
          } else {
            p.style.display = 'none';
          }
        });
      }
    });
  },

  // ─── EVENTS ─────────────────────────────────────────────────────────────────

  bindEvents() {
    // Language Switcher — use event delegation so all buttons work regardless of position
    document.addEventListener('click', (e) => {
      const langBtn = e.target.closest('.lang-btn');
      if (langBtn) {
        const lang = langBtn.dataset.lang;
        if (lang) this.toggleLanguage(lang);
      }
    });

    // Cart Drawer Open
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cart-drawer-trigger')) {
        e.preventDefault();
        this.openCartDrawer();
      }
    });

    // Cart Drawer Close
    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('.cart-drawer-overlay');
      const closeBtn = e.target.closest('.close-drawer-btn');
      if (overlay && !e.target.closest('.cart-drawer')) {
        this.closeCartDrawer();
      }
      if (closeBtn) {
        this.closeCartDrawer();
      }
    });

    // Add to Cart
    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn')) {
        const btn = e.target.closest('.add-to-cart-btn');
        this.addToCart({
          id: parseInt(btn.dataset.id || '0') || Date.now(),
          title: btn.dataset.title || 'منتج فاخر',
          price: parseFloat(btn.dataset.price || '150'),
          image: btn.dataset.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
          quantity: 1
        });
      }
    });

    // Wishlist toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-btn')) {
        const btn = e.target.closest('.wishlist-btn');
        btn.classList.toggle('active');
        const countBadge = document.querySelector('.wishlist-badge');
        if (countBadge) {
          const curr = parseInt(countBadge.textContent || '0');
          countBadge.textContent = btn.classList.contains('active') ? curr + 1 : Math.max(0, curr - 1);
        }
      }
    });

    // Quick View Modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.quick-view-btn')) {
        const btn = e.target.closest('.quick-view-btn');
        this.openQuickView({
          id: btn.dataset.id,
          title: btn.dataset.title,
          price: btn.dataset.price,
          origPrice: btn.dataset.origPrice,
          image: btn.dataset.image,
          category: btn.dataset.category,
          desc: btn.dataset.desc
        });
      }
    });

    // Close Quick View Modal
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.closest('.close-modal-btn')) {
        this.closeQuickView();
      }
    });
  },

  // ─── CART ────────────────────────────────────────────────────────────────────

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
    const total = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = total;
    });
  },

  renderCartItems() {
    const container = document.querySelector('.cart-drawer-items');
    const subtotalEl = document.querySelector('.cart-subtotal-val');
    const shippingBarFill = document.querySelector('.progress-bar-fill');
    const shippingText = document.querySelector('.free-shipping-text');
    const lang = this.state.lang;
    const cur = lang === 'ar' ? 'ر.س' : 'SAR';

    if (!container) return;

    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--color-text-muted);">
          <div style="font-size:3rem; margin-bottom:10px;">🛍️</div>
          <p>${lang === 'ar' ? 'سلة التسوق فارغة حالياً' : 'Your shopping cart is empty'}</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = `0 ${cur}`;
      if (shippingBarFill) shippingBarFill.style.width = '0%';
      return;
    }

    let subtotal = 0;
    let html = '';

    this.state.cart.forEach(item => {
      subtotal += item.price * item.quantity;
      html += `
        <div class="cart-item">
          <img src="${item.image}" class="cart-item-img" alt="${item.title}">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">${item.price} ${cur}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="LayvoraTheme.updateQuantity(${item.id}, -1)">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="LayvoraTheme.updateQuantity(${item.id}, 1)">+</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} ${cur}`;

    const progressPercent = Math.min(100, (subtotal / this.state.freeShippingThreshold) * 100);
    if (shippingBarFill) shippingBarFill.style.width = `${progressPercent}%`;

    if (shippingText) {
      if (subtotal >= this.state.freeShippingThreshold) {
        shippingText.textContent = lang === 'ar'
          ? '🎉 تهانينا! حصلت على شحن مجاني داخل السعودية'
          : '🎉 Congratulations! You unlocked Free Delivery in KSA';
      } else {
        const remaining = (this.state.freeShippingThreshold - subtotal).toFixed(2);
        shippingText.textContent = lang === 'ar'
          ? `أضف ${remaining} ر.س للحصول على شحن مجاني داخل المملكة`
          : `Add ${remaining} SAR more for Free KSA Shipping`;
      }
    }
  },

  // ─── QUICK VIEW MODAL ────────────────────────────────────────────────────────

  openQuickView(p) {
    const modal = document.querySelector('.modal-overlay');
    if (!modal) return;

    const lang = this.state.lang;
    const cur = lang === 'ar' ? 'ر.س' : 'SAR';
    const installment = (parseFloat(p.price || 0) / 4).toFixed(2);

    modal.querySelector('.modal-body').innerHTML = `
      <div class="modal-gallery">
        <img src="${p.image}" style="width:100%; border-radius:12px; aspect-ratio:1; object-fit:cover;" alt="${p.title}">
      </div>
      <div class="modal-info" style="display:flex; flex-direction:column; justify-content:center;">
        <span class="badge badge-primary" style="align-self:flex-start; margin-bottom:10px;">${p.category || (lang === 'ar' ? 'جديد' : 'New')}</span>
        <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:10px;">${p.title}</h2>
        <div style="font-size:1.4rem; font-weight:800; color:var(--color-primary); margin-bottom:14px;">
          ${p.price} ${cur}
          ${p.origPrice ? `<span style="font-size:0.9rem; text-decoration:line-through; color:#94A3B8; margin-inline-start:8px;">${p.origPrice} ${cur}</span>` : ''}
        </div>

        <div style="background:var(--color-bg-secondary); padding:12px; border-radius:10px; margin-bottom:20px; font-size:0.85rem;">
          <span style="background:#37C392; color:#fff; font-weight:700; padding:2px 6px; border-radius:4px;">${lang === 'ar' ? 'تمارا' : 'Tamara'}</span>
          ${lang === 'ar'
            ? `قسمها على 4 دفعات بدون فوائد بقيمة <strong>${installment} ر.س</strong> / شهر`
            : `Split into 4 payments of <strong>${installment} SAR</strong> / month`}
        </div>

        <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:24px; line-height:1.6;">
          ${p.desc || (lang === 'ar' ? 'منتج عالي الجودة ومصمم خصيصاً ليناسب الذوق السعودي الرفيع.' : 'High-quality product crafted for the discerning Saudi taste.')}
        </p>

        <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}" data-title="${p.title}" data-price="${p.price}" data-image="${p.image}">
          🛒 ${lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
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

  // ─── COUNTDOWN TIMER ─────────────────────────────────────────────────────────

  initCountdownTimer() {
    let hours = 14, minutes = 32, seconds = 45;
    setInterval(() => {
      seconds--;
      if (seconds < 0) { seconds = 59; minutes--; }
      if (minutes < 0) { minutes = 59; hours--; }
      if (hours < 0) { hours = 0; minutes = 0; seconds = 0; }

      const hEl = document.querySelector('.timer-h');
      const mEl = document.querySelector('.timer-m');
      const sEl = document.querySelector('.timer-s');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }, 1000);
  }
};
