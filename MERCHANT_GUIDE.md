# 🛍️ Layvora Store — Merchant Management Guide (For Fahim)

Welcome Fahim! This guide explains how to manage your **Layvora** Shopify store, add/edit products, customize text and images, and run your COD checkout system without writing any code.

---

## 1. 🏬 How to Manage Products in Shopify Admin

Everything in your store is dynamic and driven by your Shopify Admin catalog!

### Adding a New Product:
1. Log into your Shopify Admin: [layvoraa.myshopify.com/admin](https://layvoraa.myshopify.com/admin).
2. Click **Products** > **Add product**.
3. Fill in:
   - **Title**: e.g., `ساعة ذكية مقاومة للماء | Smart Waterproof Watch`
   - **Description**: Add features, specs, and details.
   - **Media**: Upload clear product photos (1000x1000 square images recommended).
   - **Pricing**: Set Price in **SAR** (e.g. `199`). Fill in **Compare-at price** (e.g. `299`) to show a discount badge automatically (`-33%`).
   - **Variants**: Add sizes, colors, or options if applicable.
4. Under **Organization**:
   - **Product type**: Electronics, Fashion, Beauty, Home & Kitchen, etc.
   - **Vendor**: Brand name or Layvora.
   - **Collections**: Assign to collections like `Electronics`, `Fashion`, `Deals`, `Best Sellers`, etc.
5. Click **Save**. The product will immediately appear on your store!

---

## 2. 🎨 How to Customize Banner Images, Text & Colors

You can change all banners, announcement messages, titles, and colors directly from the Shopify Visual Theme Editor:

1. In Shopify Admin, go to **Online Store** > **Themes**.
2. Next to the **Layvora** theme, click **Customize**.

### Customizing Sections:
- **Announcement Bar**: Click on *Announcement Bar* to change rotating messages or background colors.
- **Header**: Upload your logo, change logo width, or select custom category navigation menus.
- **Hero Banner Slider**: Click on *Hero Banner* > click any *Slide* to change the banner image, video link, headline text in Arabic/English, and CTA button links.
- **Categories Grid**: Add/remove categories or change category emojis and titles.
- **Promotional Banner**: Change the flash sale title, countdown timer end date, and discount details.
- **Theme Settings (Colors & Fonts)**: Click the **Theme Settings** icon (gear icon on the left) to adjust colors (Orange `#FF6B35`, Navy `#1A1A2E`, Gold `#FFD700`), fonts (Cairo / Poppins), button border radius, and WhatsApp number.

---

## 3. 💰 How Cash on Delivery (COD) & Draft Orders Work

Your store features a **Custom 2-Step COD Checkout Drawer**:

### Customer Experience:
1. When a customer clicks **"⚡ Order Now — Cash on Delivery"** or **"Buy Now"**, a popup drawer slides in from the right.
2. **Step 1**: Customer enters Name, Saudi Phone (`+9665XXXXXXXX`), selects City, and types Address.
3. **Step 2**: Customer reviews the summary (Subtotal, Shipping SAR 30 or **Free Shipping over SAR 350**, Discount, and Total).
4. Customer clicks **"Place Order ✓"**.

### Viewing Orders in Shopify Admin:
- Orders submitted via the COD form land directly in your Shopify Admin under **Orders** / **Draft Orders** with the customer's full address, phone number, city, and item details.
- Simply click **Mark as Paid** or **Create Order** when you ship and collect cash upon delivery!

---

## 4. ⚙️ Running the Backend Proxy Server (`backend/server.js`)

If you want to proxy Draft Orders via your Node.js backend:

1. Open terminal in `backend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your credentials (never share or commit your secret key publicly):
   ```env
   SHOPIFY_STORE_DOMAIN=layvoraa.myshopify.com
   SHOPIFY_CLIENT_ID=6cb09598e7a52fc716fe8cb6e1f1723c
   SHOPIFY_CLIENT_SECRET=YOUR_SHOPIFY_CLIENT_SECRET
   SHOPIFY_ADMIN_API_TOKEN=YOUR_ADMIN_API_TOKEN
   PORT=3000
   ```
4. Start the server:
   ```bash
   node server.js
   ```

---

## 5. 📱 Contact & Support
- **Store URL:** [layvoraa.myshopify.com](https://layvoraa.myshopify.com)
- **GitHub Repository:** [sk-sazzad/layvora-theme](https://github.com/sk-sazzad/layvora-theme)
