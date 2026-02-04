# Visitor Information Collection Feature

Your AI chatbot now collects visitor information and sends it to your email!

## ✅ What's Been Added

1. **Contact Form in Chatbot**
   - Collects name, email, phone, and company
   - Modal form with a professional design
   - "Share Contact Info" button in quick actions

2. **Email API Endpoint**
   - Sends visitor info to your email
   - Includes chat history
   - Sends confirmation email to visitor
   - Located at: `/api/send-visitor-info.js`

3. **Styled Components**
   - Professional form design
   - Smooth animations
   - Mobile responsive

## 🔧 Setup Instructions

### 1. Configure Email Settings

Copy your `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Get Gmail App Password (Recommended)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Search for **App passwords**
4. Create a new app password for "Mail"
5. Copy the 16-character password

### 3. Update Your .env File

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
RECIPIENT_EMAIL=your-email@gmail.com
```

### 4. Alternative Email Services

#### For Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your_password
```
Update `send-visitor-info.js` line 28: `service: 'outlook'`

#### For Yahoo
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your_password
```
Update `send-visitor-info.js` line 28: `service: 'yahoo'`

## 🚀 How It Works

1. **Visitor Opens Chatbot**
   - Sees "Share Contact Info" button in quick actions

2. **Fills Out Form**
   - Name and email are required
   - Phone and company are optional
   - Can skip the form

3. **Information Sent**
   - Email sent to you with visitor details
   - Includes complete chat history
   - Visitor receives confirmation email

4. **Personalized Experience**
   - Chatbot greets visitor by name
   - Better conversation context

## 📧 Email Format

You'll receive:
- Visitor's contact details
- Complete chat history
- Timestamp
- Formatted HTML email

Visitor receives:
- Thank you message
- Company branding
- Professional confirmation

## 🎨 Customization

### Change Email Template
Edit `api/send-visitor-info.js` lines 45-80 for your email HTML

### Modify Form Fields
Edit `src/components/Chatbot.jsx` lines 20-23 to add/remove fields

### Adjust Styling
Edit `src/components/Chatbot.css` starting at line 207

## 📱 Features

- ✅ Mobile responsive
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Skip option
- ✅ Professional design
- ✅ Confirmation emails

## 🐛 Troubleshooting

**Email not sending?**
- Check your `.env` file is in the root directory
- Verify app password is correct (16 characters, no spaces)
- Ensure 2-Step Verification is enabled on Gmail
- Check Vercel environment variables are set

**Form not appearing?**
- Clear browser cache
- Check browser console for errors
- Verify all files were updated

## 🔐 Security Notes

- Never commit `.env` file to git
- Use App Passwords, not regular passwords
- `.env` is already in `.gitignore`
- Visitor emails are only stored temporarily during send

## 📝 Next Steps

1. Set up your `.env` file with email credentials
2. Test the contact form locally
3. Deploy to Vercel and add environment variables there
4. Monitor your email for visitor inquiries!

---

**Need help?** Check the inline comments in `api/send-visitor-info.js` for configuration options.
