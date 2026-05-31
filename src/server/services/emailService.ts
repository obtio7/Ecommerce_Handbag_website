import nodemailer from 'nodemailer';

interface OrderEmailData {
  _id: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
  };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[EmailService] SMTP credentials not configured. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[EmailService] Skipping order confirmation email — SMTP not configured.');
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #333;">
          ${item.name}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #666; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #333; text-align: right;">
          ₹${item.price.toLocaleString('en-IN')}
        </td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2ED; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F2ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #5A5A40; padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: 4px; color: #ffffff;">ZAREVIELLE</h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.7); text-transform: uppercase;">Crafted for the everyday extraordinary</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 22px; color: #5A5A40; margin: 0 0 8px;">Order Confirmed</h2>
              <p style="font-size: 14px; color: #666; margin: 0 0 30px;">Thank you for your purchase. Your order has been confirmed and is being prepared.</p>

              <table width="100%" style="background-color: #FDFBF7; border-radius: 8px; padding: 16px; margin-bottom: 30px;" cellpadding="12">
                <tr>
                  <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Order ID</td>
                  <td style="font-size: 14px; color: #333; font-weight: bold; text-align: right;">#${String(order._id).slice(-8).toUpperCase()}</td>
                </tr>
              </table>

              <!-- Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding-bottom: 12px; border-bottom: 2px solid #5A5A40;">Item</th>
                  <th style="text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding-bottom: 12px; border-bottom: 2px solid #5A5A40;">Qty</th>
                  <th style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding-bottom: 12px; border-bottom: 2px solid #5A5A40;">Price</th>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px 0; font-family: Georgia, serif; font-size: 18px; color: #5A5A40; font-weight: bold;">Total</td>
                  <td style="padding: 16px 0; font-family: Georgia, serif; font-size: 18px; color: #5A5A40; font-weight: bold; text-align: right;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 12px;">Shipping Address</h3>
                <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.6;">
                  ${order.shippingAddress.fullName}<br>
                  ${order.shippingAddress.address}<br>
                  ${order.shippingAddress.city} — ${order.shippingAddress.zipCode}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #888; margin: 0;">If you have any questions, reach us at orders@zarevielle.com</p>
              <p style="font-size: 11px; color: #aaa; margin: 12px 0 0;">© 2026 Zarevielle Studio. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Zarevielle" <${process.env.SMTP_USER || 'orders@zarevielle.com'}>`,
    to: order.customerEmail,
    subject: `Order Confirmed — #${String(order._id).slice(-8).toUpperCase()}`,
    html,
  });
}

// Status-specific messages for order updates
const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'Your order has been confirmed and is being prepared.',
  shipped: 'Your order is on its way!',
  'out-for-delivery': 'Your order is out for delivery today.',
  delivered: 'Your order has been delivered.',
  cancelled: 'Your order has been cancelled.',
  processing: 'Your order is being processed.',
  'return-requested': 'Your return request has been received.',
  returned: 'Your return has been processed.',
};

interface OrderStatusEmailData {
  orderNumber?: string;
  _id: string;
  customerEmail: string;
  customerName?: string;
  totalAmount: number;
}

/**
 * Sends an email to the customer when their order status changes.
 */
/**
 * Sends a welcome email to new newsletter subscribers.
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[EmailService] Skipping welcome email — SMTP not configured.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2ED; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F2ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #5A5A40; padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; letter-spacing: 4px; color: #ffffff;">ZAREVIELLE</h1>
              <p style="margin: 12px 0 0; font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,0.7); text-transform: uppercase;">Welcome to the Archive</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 26px; color: #5A5A40; margin: 0 0 20px; font-weight: normal;">
                Hello, <em>${name}</em>
              </h2>
              <p style="font-size: 15px; color: #666; margin: 0 0 25px; line-height: 1.7;">
                Thank you for joining the Zarevielle community. You're now part of an exclusive circle that receives early access to new collections, artisan stories, and special offers.
              </p>
              
              <div style="background-color: #FDFBF7; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #5A5A40; margin: 0 0 15px; font-weight: bold;">What to Expect</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #666; font-size: 14px; line-height: 2;">
                  <li>First look at seasonal arrivals</li>
                  <li>Behind-the-scenes artisan stories</li>
                  <li>Exclusive subscriber-only offers</li>
                  <li>Curated style inspiration</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #888; margin: 30px 0 0; font-style: italic;">
                "We believe in crafting pieces that tell a story — yours."
              </p>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.SITE_URL || 'https://zarevielle.com'}/collection" style="display: inline-block; background-color: #5A5A40; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                  Explore the Collection
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #888; margin: 0;">Follow us for daily inspiration</p>
              <div style="margin: 15px 0;">
                <a href="https://instagram.com/zarevielleofficial" style="display: inline-block; margin: 0 8px; color: #5A5A40; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Instagram</a>
                <span style="color: #ddd;">|</span>
                <a href="https://pinterest.com/zarevielle" style="display: inline-block; margin: 0 8px; color: #5A5A40; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Pinterest</a>
              </div>
              <p style="font-size: 11px; color: #aaa; margin: 15px 0 0;">© 2026 Zarevielle Studio. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Zarevielle" <${process.env.SMTP_USER || 'hello@zarevielle.com'}>`,
    to: email,
    subject: 'Welcome to Zarevielle — You\'re In!',
    html,
  });
}

/**
 * Sends an unsubscribe confirmation email.
 */
export async function sendUnsubscribeConfirmation(email: string): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[EmailService] Skipping unsubscribe confirmation — SMTP not configured.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2ED; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F2ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #5A5A40; padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: 4px; color: #ffffff;">ZAREVIELLE</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #5A5A40; margin: 0 0 20px; font-weight: normal;">
                We're Sorry to See You Go
              </h2>
              <p style="font-size: 15px; color: #666; margin: 0 0 30px; line-height: 1.7;">
                You have been successfully unsubscribed from our newsletter. You will no longer receive emails from us.
              </p>
              <p style="font-size: 14px; color: #888; margin: 0;">
                Changed your mind? You can always resubscribe on our website.
              </p>
              <div style="margin-top: 40px;">
                <a href="${process.env.SITE_URL || 'https://zarevielle.com'}" style="display: inline-block; background-color: #5A5A40; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                  Visit Our Shop
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 25px 40px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Zarevielle Studio. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Zarevielle" <${process.env.SMTP_USER || 'hello@zarevielle.com'}>`,
    to: email,
    subject: 'You\'ve Been Unsubscribed — Zarevielle',
    html,
  });
}

export async function sendOrderStatusUpdate(order: OrderStatusEmailData, newStatus: string): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[EmailService] Skipping status update email — SMTP not configured.');
    return;
  }

  const orderRef = order.orderNumber || `#${String(order._id).slice(-8).toUpperCase()}`;
  const statusLabel = newStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const statusMessage = STATUS_MESSAGES[newStatus] || `Your order status has been updated to: ${statusLabel}.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2ED; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F2ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #5A5A40; padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: 4px; color: #ffffff;">ZAREVIELLE</h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.7); text-transform: uppercase;">Order Status Update</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 22px; color: #5A5A40; margin: 0 0 8px;">Status: ${statusLabel}</h2>
              <p style="font-size: 14px; color: #666; margin: 0 0 30px;">${statusMessage}</p>

              <table width="100%" style="background-color: #FDFBF7; border-radius: 8px; padding: 16px; margin-bottom: 30px;" cellpadding="12">
                <tr>
                  <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Order</td>
                  <td style="font-size: 14px; color: #333; font-weight: bold; text-align: right;">${orderRef}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">New Status</td>
                  <td style="font-size: 14px; color: #333; font-weight: bold; text-align: right;">${statusLabel}</td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #888; margin: 20px 0 0;">
                If you have any questions about your order, please reach out to us at orders@zarevielle.com.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #888; margin: 0;">Thank you for shopping with Zarevielle.</p>
              <p style="font-size: 11px; color: #aaa; margin: 12px 0 0;">© 2026 Zarevielle Studio. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Zarevielle" <${process.env.SMTP_USER || 'orders@zarevielle.com'}>`,
    to: order.customerEmail,
    subject: `Order ${orderRef} — Status Update: ${statusLabel}`,
    html,
  });
}
