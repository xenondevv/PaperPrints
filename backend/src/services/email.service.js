const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email to the admin to review a new vendor
 */
async function sendNewVendorAlert(vendor, user) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email config missing, skipping sendNewVendorAlert');
    return;
  }

  const subject = 'New Vendor Registration — Review Required';
  
  const textBody = `
New Vendor Registration Alert
==============================
Shop Name:     ${vendor.shop_name || vendor.shopName}
Owner Name:    ${vendor.owner_name || vendor.ownerName}
Email:         ${user.email || vendor.email}
Phone:         ${user.phone || vendor.phone}
Address:       ${vendor.address}
Location:      ${vendor.lat || vendor.location_lat}, ${vendor.lng || vendor.location_lng}
Registered At: ${new Date().toISOString()}

-------------------------------
To approve this vendor, run this curl command:

curl -X PATCH ${process.env.BACKEND_URL || 'http://localhost:3000'}/api/admin/vendors/${vendor.id}/verify \\
  -H "x-admin-secret: ${process.env.ADMIN_SECRET}"

Or run this SQL in your database:

UPDATE vendors SET is_verified = true 
WHERE id = '${vendor.id}';
-------------------------------
PaperPrints Admin System
  `.trim();

  await transporter.sendMail({
    from: `"PaperPrints Admin" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject,
    text: textBody,
  });
}

/**
 * Send an email to the vendor notifying them of approval
 */
async function sendVendorApproved(vendorEmail, shopName, ownerName) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email config missing, skipping sendVendorApproved');
    return;
  }

  const subject = `You're officially onboarded to PaperPrints! 🎉`;
  
  const textBody = `
Dear ${ownerName},

We are delighted to inform you that your shop "${shopName}" has been successfully verified and onboarded to the PaperPrints platform.

After reviewing your application, our team is pleased to welcome you as an official PaperPrints vendor. You can now start receiving and managing print orders directly through your vendor dashboard.

Getting Started
Dashboard URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}
Sign in using the same Google account you registered with.

What you can do on your dashboard:
• View and manage incoming print orders in real time
• Accept or reject orders with estimated completion times
• View customer-uploaded files and print directly from the dashboard
• Update your shop details, pricing, and working hours anytime

If you have any questions or need assistance getting started, feel free to reach out to us at paperprintsofficial@gmail.com and our team will be happy to help.

We look forward to a great partnership and wish you the very best with your shop on PaperPrints.

Warm regards,
The PaperPrints Team
paperprintsofficial@gmail.com

---
This is an automated message from PaperPrints. Please do not reply directly to this email.
  `.trim();

  await transporter.sendMail({
    from: `"PaperPrints" <${process.env.GMAIL_USER}>`,
    to: vendorEmail,
    subject,
    text: textBody,
  });
}

module.exports = {
  sendNewVendorAlert,
  sendVendorApproved,
};
