require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("❌ ERROR: EMAIL_USER or EMAIL_PASS not found in .env file.");
    console.log("Please add them to test the email feature.");
    process.exit(1);
  }

  console.log(`⏳ Testing email configuration for: ${process.env.EMAIL_USER}...`);

  try {
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
      from: `"SmartDeal AI Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Sending to yourself for testing
      subject: `🧪 Test Email from SmartDeal AI`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration is Working!</h2>
          <p>If you are seeing this email, your App Password and Email setup are perfectly configured.</p>
          <p>The automated price drop alerts will now be sent to users successfully.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ SUCCESS! Test email sent successfully. Check your inbox.");
  } catch (error) {
    console.log("❌ ERROR: Failed to send email.");
    console.error(error.message);
    if (error.message.includes('Invalid login')) {
      console.log("👉 TIP: Make sure you are using a 16-character Google App Password (not your normal Gmail password), and that you don't have spaces in the password.");
    }
  }
};

testEmail();
