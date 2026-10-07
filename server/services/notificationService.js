const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

/**
 * Sends a price alert email to a user and writes a notification to the database.
 * @param {object} params
 * @param {string} params.userId - User Mongoose ID
 * @param {string} params.userEmail - User email address
 * @param {string} params.userName - User name
 * @param {object} params.product - Product document object
 * @param {number} params.targetPrice - User's alert target price
 */
const sendPriceAlert = async ({ userId, userEmail, userName, product, targetPrice }) => {
  const title = '🔥 Price Drop Alert!';
  const message = `Excellent news, ${userName}! The product "${product.title}" has reached your target price of ₹${targetPrice}. Current Price is ₹${product.currentPrice}.`;

  try {
    // 1. Save in-app notification to the database
    const notification = new Notification({
      userId,
      title,
      message,
    });
    await notification.save();

    // 2. Attempt to send email
    const smtpConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (smtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"SmartDeal AI" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `🔥 Price Alert - Your Target Price Has Been Reached!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p>Hi ${userName},</p>
            <p>Good news! 🎉</p>
            <p>The product you are tracking has reached your target price.</p>
            <p>
              Product: <strong>${product.title}</strong><br>
              Current Price: <strong>₹${product.currentPrice}</strong><br>
              Target Price: <strong>₹${targetPrice}</strong>
            </p>
            <p>Click below to buy now:<br>
            <a href="${product.url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${product.url}</a></p>
            <p>Happy Shopping!</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP EMAIL SENT] Alert email successfully sent to ${userEmail} for ${product.title}`);
    } else {
      // SMTP configuration is missing, simulate in the logs
      console.log(`
========================================================================
[EMAIL SIMULATION]
To: ${userEmail} (${userName})
Subject: 🔥 Price Drop Alert!
Body: "${product.title}" has reached target price ₹${targetPrice}!
      Current price: ₹${product.currentPrice}
      Buy Link: ${product.url}
========================================================================
      `);
    }
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to deliver alert: ${error.message}`);
  }
};

module.exports = {
  sendPriceAlert,
};
