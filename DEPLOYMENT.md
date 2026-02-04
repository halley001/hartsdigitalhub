# Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account with your repository
- Vercel account (sign up at https://vercel.com)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard (Recommended)

1. **Go to https://vercel.com/new**
2. **Import your GitHub repository**
   - Connect your GitHub account
   - Select `hartsdigitalhub` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Vite**
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables** (Important!)
   Click "Environment Variables" and add:
   
   ```
   # Email Configuration (for visitor info collection)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   RECIPIENT_EMAIL=your-email@gmail.com
   
   # Optional: OpenAI API (if you want AI-powered responses)
   OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Step 3: Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

### Step 4: Configure Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Settings → Domains
3. Add your custom domain: `hartsdigitalhub.com` (or your domain)
4. Follow DNS configuration instructions
5. Update CNAME file if needed

### Step 5: Set Up Email Service

For the contact form to work, you need to configure email:

#### Gmail Setup:
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to Vercel Environment Variables:
   - `EMAIL_USER`: your-email@gmail.com
   - `EMAIL_PASSWORD`: your-16-char-app-password
   - `RECIPIENT_EMAIL`: where-to-receive-emails@gmail.com

### Step 6: Verify Deployment

After deployment, test:
- ✅ Homepage loads correctly
- ✅ 3D scene renders properly
- ✅ Chatbot opens and responds
- ✅ Contact form collects information
- ✅ Email notifications are sent
- ✅ All links work

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_USER` | Yes | Email address for sending notifications |
| `EMAIL_PASSWORD` | Yes | App password for email service |
| `RECIPIENT_EMAIL` | Yes | Where to receive visitor contact info |
| `OPENAI_API_KEY` | No | For AI-powered chatbot (currently not used) |

### Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch automatically deploys to production
- Pull requests get preview deployments
- View deployment logs in Vercel Dashboard

### Troubleshooting

**Build fails:**
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally first

**API routes not working:**
- Ensure `api/` folder is in root directory
- Check `vercel.json` configuration
- Verify environment variables are set

**Email not sending:**
- Verify EMAIL_USER and EMAIL_PASSWORD are set
- Check Gmail app password (not regular password)
- Enable "Less secure app access" if using regular Gmail

**3D Scene not loading:**
- Check browser console for errors
- Verify all Three.js dependencies are installed
- Test on different browsers

### Important Files for Deployment

- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `.gitignore` - Excludes node_modules and .env
- ✅ `.vercelignore` - Additional Vercel exclusions
- ✅ `.env.example` - Environment variable template
- ✅ `CNAME` - Custom domain configuration

### Post-Deployment

1. **Test all features**
2. **Monitor performance** in Vercel Analytics
3. **Set up error tracking** (optional)
4. **Configure caching** if needed
5. **Share your live URL!** 🎉

### Useful Commands

```bash
# View deployment info
vercel inspect

# View logs
vercel logs

# Remove a deployment
vercel remove [deployment-url]

# List all deployments
vercel ls
```

### Support

- Vercel Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Status: https://www.vercel-status.com/

---

**Your deployment URL will be:**
- Development: Auto-generated preview URLs
- Production: `https://hartsdigitalhub.vercel.app`
- Custom Domain: `https://hartsdigitalhub.com` (if configured)
