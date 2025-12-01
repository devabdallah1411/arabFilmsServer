const nodemailer = require('nodemailer');

/**
 * Send email utility - supports two modes:
 * 1. Password Reset: sendEmail(to, subject, html)
 * 2. Contact Form: sendEmail({ name, email, phone, message })
 */
const sendEmail = async (...args) => {
  // Development mode - just log the email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📧 EMAIL (Development Mode - Not Sent):\n');

    if (typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      const { name, email, phone, message } = args[0];
      console.log('Type: Contact Form');
      console.log('To:', process.env.EMAIL_TO || process.env.EMAIL_USER);
      console.log('From:', email);
      console.log('Name:', name);
      console.log('Phone:', phone || 'Not provided');
      console.log('Message:', message);
    } else {
      const [to, subject, html] = args;
      console.log('Type: Password Reset / Custom Email');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
    }

    console.log('\n✅ Email logged (not sent in development mode)\n');
    return;
  }

  // Production mode - send actual email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "arabfilmdb.com",
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE !== 'false', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add these for better compatibility
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    });

    let mailOptions;

    // Check if first argument is an object (Contact Form mode)
    if (typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      const { name, email, phone, message } = args[0];

      // Contact Form Email
      mailOptions = {
        from: `"Arab Film DB - Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: email, // Allow replying directly to the user
        subject: "New Contact Form Submission",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">New Contact Message</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <hr style="border: 1px solid #ddd; margin: 20px 0;">
              <p><strong>Message:</strong></p>
              <p style="background-color: white; padding: 15px; border-left: 4px solid #4CAF50;">${message}</p>
            </div>
          </div>
        `,
      };
    } else {
      // Password Reset Email (or any custom email)
      const [to, subject, html] = args;

      mailOptions = {
        from: `"Arab Film DB" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };
    }

    console.log('📧 Attempting to send email...');
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

    return info;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    throw error;
  }
};

module.exports = sendEmail;
