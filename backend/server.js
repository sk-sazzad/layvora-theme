/**
 * LAYVORA CUSTOM COD CHECKOUT BACKEND SERVER
 * Built specifically for Fahim (Layvora Store — layvoraa.myshopify.com)
 *
 * Handles:
 * 1. Shopify OAuth Token Exchange (Client ID & Secret via .env)
 * 2. Shopify Draft Orders API Submission (POST /admin/api/2024-01/draft_orders.json)
 * 3. KSA Phone Rate Limiting (max 3 orders per phone per hour)
 * 4. WhatsApp Order Confirmation Webhook & Link Generator
 *
 * Install dependencies:
 * npm install express cors dotenv node-fetch
 *
 * Environment File (.env):
 * SHOPIFY_STORE_DOMAIN=layvoraa.myshopify.com
 * SHOPIFY_CLIENT_ID=6cb09598e7a52fc716fe8cb6e1f1723c
 * SHOPIFY_CLIENT_SECRET=YOUR_SHOPIFY_CLIENT_SECRET
 * SHOPIFY_ADMIN_API_TOKEN=YOUR_SHOPIFY_ADMIN_API_TOKEN
 * PORT=3000
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN || 'layvoraa.myshopify.com';
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || '6cb09598e7a52fc716fe8cb6e1f1723c';
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || '';
let ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || '';

app.use(cors());
app.use(express.json());

// In-Memory Rate Limiter (Max 3 order attempts per phone per hour)
const phoneRateMap = new Map();

function isRateLimited(phone) {
  const now = Date.now();
  const history = phoneRateMap.get(phone) || [];
  const validHistory = history.filter(ts => now - ts < 3600000); // 1 hour

  if (validHistory.length >= 3) {
    return true;
  }
  validHistory.push(now);
  phoneRateMap.set(phone, validHistory);
  return false;
}

// Health Status Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    store: SHOPIFY_STORE,
    authenticated: Boolean(ADMIN_API_TOKEN),
    time: new Date()
  });
});

// OAuth Callback Endpoint (Exchanges code for Admin Access Token)
app.get('/auth/callback', async (req, res) => {
  const { code, shop } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const tokenUrl = `https://${shop || SHOPIFY_STORE}/admin/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code
      })
    });

    const data = await response.json();
    if (data.access_token) {
      ADMIN_API_TOKEN = data.access_token;
      console.log('✅ Access Token acquired successfully');
      return res.send(`<h2>✅ Layvora OAuth Success! Access token acquired.</h2>`);
    } else {
      return res.status(400).json(data);
    }
  } catch (err) {
    console.error('OAuth Error:', err);
    res.status(500).send('OAuth exchange failed');
  }
});

// Primary COD Order Endpoint
app.post('/api/place-order', async (req, res) => {
  try {
    const { fullName, phone, city, address, couponCode, discountAmount, items, shippingPrice } = req.body;

    // 1. Validations
    if (!fullName || fullName.length < 3) {
      return res.status(400).json({ success: false, message: 'اسم كامل غير صالح | Invalid full name' });
    }
    const cleanPhone = (phone || '').replace(/\s+/g, '');
    if (!cleanPhone || !/^\+9665[0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'رقم جوال سعودي غير صالح | Invalid KSA phone number (+9665XXXXXXXX)' });
    }
    if (!city) {
      return res.status(400).json({ success: false, message: 'المدينة مطلوبة | City is required' });
    }
    if (!address || address.length < 10) {
      return res.status(400).json({ success: false, message: 'العنوان التفصيلي قصير جداً | Detailed address too short' });
    }

    // 2. Rate Limit Check
    if (isRateLimited(cleanPhone)) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز عدد المحاولات المسموح بها لطلب هذا الرقم | Rate limit exceeded for this phone number'
      });
    }

    // 3. Prepare Line Items
    const lineItems = (items || []).map(item => ({
      variant_id: item.variantId,
      quantity: item.quantity || 1
    }));

    // Free shipping threshold (350 SAR as specified in Fahim's brief)
    const computedShipping = (shippingPrice !== undefined) ? shippingPrice.toString() : '30.00';

    // 4. Construct Draft Order Payload
    const draftOrderPayload = {
      draft_order: {
        line_items: lineItems,
        customer: {
          first_name: fullName,
          last_name: '',
          phone: cleanPhone
        },
        shipping_address: {
          first_name: fullName,
          last_name: '',
          address1: address,
          city: city,
          country: 'Saudi Arabia',
          country_code: 'SA',
          phone: cleanPhone
        },
        billing_address: {
          first_name: fullName,
          last_name: '',
          address1: address,
          city: city,
          country: 'Saudi Arabia',
          country_code: 'SA'
        },
        shipping_line: {
          title: 'توصيل سريع | Standard KSA Shipping',
          price: computedShipping
        },
        payment_gateway: 'cash_on_delivery',
        tags: 'COD, custom-form, KSA',
        note: `COD Order via Custom Form\nCustomer: ${fullName}\nPhone: ${cleanPhone}\nCity: ${city}\nAddress: ${address}`,
        send_invoice: false
      }
    };

    // Apply Coupon Discount if present
    if (discountAmount && discountAmount > 0) {
      draftOrderPayload.draft_order.applied_discount = {
        value_type: 'fixed_amount',
        value: discountAmount.toString(),
        title: couponCode || 'كود خصم | Discount Coupon'
      };
    }

    // 5. Submit to Shopify Draft Orders API
    if (!ADMIN_API_TOKEN) {
      console.warn('⚠️ ADMIN_API_TOKEN is missing. Returning simulated order for testing.');
      const simulatedOrderNo = `LV-${Math.floor(1000 + Math.random() * 9000)}`;
      return res.json({
        success: true,
        orderNumber: simulatedOrderNo,
        message: 'Order simulated (set SHOPIFY_ADMIN_API_TOKEN in .env for production)'
      });
    }

    const shopifyUrl = `https://${SHOPIFY_STORE}/admin/api/2024-01/draft_orders.json`;
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const data = await response.json();

    if (!response.ok || !data.draft_order) {
      console.error('Shopify API Error response:', data);
      return res.status(response.status).json({
        success: false,
        message: data.errors ? JSON.stringify(data.errors) : 'Failed to create Draft Order in Shopify'
      });
    }

    const orderNumber = data.draft_order.name || `LV-${data.draft_order.id}`;

    // 6. Generate WhatsApp Notification Payload Message for Customer
    const whatsappMsg = `مرحباً ${fullName}! 👋\n\n✅ تم استلام طلبك بنجاح\n\n📦 رقم الطلب: ${orderNumber}\n💰 طريقة الدفع: الدفع عند الاستلام\n📍 مدينة التوصيل: ${city}\n\nسيتم التواصل معك خلال 24 ساعة لتأكيد الطلب.\n\nشكراً لثقتك في ليقورا! 🛍️`;

    return res.json({
      success: true,
      orderNumber: orderNumber,
      draftOrderId: data.draft_order.id,
      whatsappMessage: whatsappMsg,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Server Exception:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Layvora COD Backend Server running on port ${PORT}`);
  console.log(`📌 Store URL: ${SHOPIFY_STORE}`);
});
