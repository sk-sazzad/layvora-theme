/**
 * LAYVORA CUSTOM COD CHECKOUT BACKEND SERVER
 * Express Server for Proxying COD Orders to Shopify Draft Orders API
 *
 * Requirements:
 * npm install express cors dotenv node-fetch
 *
 * Environment variables (.env):
 * SHOPIFY_STORE_DOMAIN=layvoraa.myshopify.com
 * SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * PORT=3000
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN || 'layvoraa.myshopify.com';
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || 'YOUR_ADMIN_API_TOKEN';

app.use(cors());
app.use(express.json());

// Rate Limiter Memory Store (max 3 order attempts per phone per hour)
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

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', store: SHOPIFY_STORE, time: new Date() });
});

// COD Order Endpoint
app.post('/api/place-order', async (req, res) => {
  try {
    const { fullName, phone, city, address, couponCode, discountAmount, items } = req.body;

    // 1. Basic Validation
    if (!fullName || fullName.length < 3) {
      return res.status(400).json({ success: false, message: 'اسم كامل غير صالح | Invalid full name' });
    }
    if (!phone || !/^\+9665[0-9]{8}$/.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, message: 'رقم جوال سعودي غير صالح | Invalid KSA phone' });
    }
    if (!city) {
      return res.status(400).json({ success: false, message: 'يرجى اختيار المدينة | City is required' });
    }
    if (!address || address.length < 10) {
      return res.status(400).json({ success: false, message: 'عنوان تفصيلي غير مكتمل | Address too short' });
    }

    // 2. Rate Limit Check
    if (isRateLimited(phone)) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز عدد المحاولات المسموح بها لهذا الرقم، يرجى الانتظار والمحاولة لاحقاً | Rate limit exceeded'
      });
    }

    // 3. Prepare Line Items for Shopify Draft Order
    const lineItems = items.map(item => ({
      variant_id: item.variantId,
      quantity: item.quantity || 1
    }));

    // 4. Construct Shopify Draft Order Payload
    const draftOrderPayload = {
      draft_order: {
        line_items: lineItems,
        customer: {
          first_name: fullName,
          last_name: '',
          phone: phone
        },
        shipping_address: {
          first_name: fullName,
          last_name: '',
          address1: address,
          city: city,
          country: 'Saudi Arabia',
          country_code: 'SA',
          phone: phone
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
          title: 'توصيل سريع | Standard KSA Delivery',
          price: (req.body.shippingPrice !== undefined) ? req.body.shippingPrice.toString() : '30.00'
        },
        payment_gateway: 'cash_on_delivery',
        tags: 'COD, custom-checkout-drawer, KSA',
        note: 'طلب الدفع عند الاستلام عبر النموذج السريع | COD Order via Custom Drawer Form',
        send_invoice: false
      }
    };

    // Apply Coupon Discount if applicable
    if (discountAmount && discountAmount > 0) {
      draftOrderPayload.draft_order.applied_discount = {
        value_type: 'fixed_amount',
        value: discountAmount.toString(),
        title: couponCode || 'كود خصم | Discount Coupon'
      };
    }

    // 5. Call Shopify Draft Orders Admin API
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
      console.error('Shopify API Error:', data);
      return res.status(response.status).json({
        success: false,
        message: (data.errors ? JSON.stringify(data.errors) : 'Shopify order creation failed')
      });
    }

    // Optional: Send Draft Order completion call or return Draft Order Name
    const orderNumber = data.draft_order.name || `LV-${data.draft_order.id}`;

    return res.json({
      success: true,
      orderNumber: orderNumber,
      draftOrderId: data.draft_order.id,
      message: 'تم إرسال الطلب بنجاح | Order placed successfully'
    });

  } catch (error) {
    console.error('Server Exception:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في السيرفر الداخلي | Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Layvora COD Backend Proxy listening on port ${PORT}`);
});
