import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company, timestamp, chatHistory } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Create transporter - Configure with your email service
    // For Gmail, you need to use an "App Password" (not your regular password)
    // Go to: Google Account > Security > 2-Step Verification > App passwords
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or 'outlook', 'yahoo', etc.
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your app password
      },
    });

    // Format chat history for email
    const chatHistoryText = chatHistory && chatHistory.length > 0
      ? chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')
      : 'No chat history yet';

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER, // Where to send visitor info
      subject: `🔔 New Visitor Contact: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
            New Visitor Information
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Chat History</h3>
            <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${chatHistoryText}</pre>
          </div>

          <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>This email was automatically sent from Harts Company chatbot</p>
            <p>© ${new Date().getFullYear()} Harts Company Limited</p>
          </div>
        </div>
      `,
      text: `
New Visitor Contact Information

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
Submitted: ${new Date(timestamp).toLocaleString()}

Chat History:
${chatHistoryText}

---
This email was automatically sent from Harts Company chatbot
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Optional: Send confirmation email to visitor
    const visitorMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Harts Company',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Thank You, ${name}!</h2>
          <p>We've received your information and will get back to you soon.</p>
          <p>In the meantime, feel free to continue chatting with our AI assistant or visit our website.</p>
          <br>
          <p>Best regards,<br><strong>Harts Company Limited</strong></p>
          <p style="color: #666; font-size: 12px;">Mutengene, South West Region, Cameroon</p>
        </div>
      `,
    };

    await transporter.sendMail(visitorMailOptions);

    return res.status(200).json({ 
      success: true,
      message: 'Visitor information sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send visitor information',
      details: error.message 
    });
  }
}
