# ClinicFlow Frontend — Setup & Deployment Guide

## 📦 Package Contents

Your `clinicflow.zip` contains:
```
clinicflow/
├── src/                    # Complete React + TypeScript source code
├── public/                 # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.ts          # Vite bundler configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── .env                    # Environment variables (configure API URL)
├── .gitignore              # Git ignore rules
├── README.md               # Complete documentation
├── FEATURES.md             # Feature checklist and development notes
└── .gitignore              # Git ignore rules
```

---

## ⚡ Quick Start (5 minutes)

### 1. Extract & Install

```bash
# Extract the zip
unzip clinicflow.zip
cd clinicflow

# Install dependencies
npm install

# For faster installation (optional)
npm ci  # uses package-lock.json
```

### 2. Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.11  ready in 245 ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

### 3. Open in Browser

Visit `http://localhost:5174`

### 4. Test Login

```
Email: patient@example.com
Password: Password123!
(Or use the register flow with WhatsApp OTP)
```

---

## 🔧 Configuration

### Environment Variables

Edit `.env` to configure API endpoint:

```bash
# Default (backend on localhost)
VITE_API_URL=http://localhost:5000

# Custom backend URL
VITE_API_URL=http://your-api.com

# Deployed backend
VITE_API_URL=https://api.clinicflow.com
```

**Note**: Backend must have CORS enabled for your frontend domain.

### Backend Requirements

Before running frontend, ensure backend is running:

```bash
# From backend directory
npm install
npm run dev

# Should output:
# Server running on http://localhost:5000
# Database connected
# Socket.io ready
```

---

## 🏗️ Build for Production

### Step 1: Create Production Build

```bash
npm run build

# Output:
# ✓ 1234 modules transformed.
# dist/index.html                    45.23 kB
# dist/assets/main.css               234.56 kB
# dist/assets/main.js                456.78 kB
```

### Step 2: Test Locally

```bash
npm run preview

# Visit http://localhost:4173
```

### Step 3: Deploy

See deployment section below.

---

## 🚀 Deployment Options

### Option A: Vercel (Recommended for Beginners)

#### Prerequisites
- GitHub account (optional)
- Vercel account (free)

#### Steps

**1. Install Vercel CLI**
```bash
npm install -g vercel
```

**2. Deploy**
```bash
cd clinicflow
vercel

# Follow prompts:
# ? Set up and deploy "./clinicflow"? y
# ? Which scope do you want to deploy to? (your username)
# ? Link to existing project? n
# ? What's your project's name? clinicflow
# ? In which directory is your code located? ./
# ? Want to modify these settings? n
```

**3. Set Environment Variables**

After deployment:
```bash
vercel env add VITE_API_URL
# Enter: https://api.your-backend.com
vercel --prod
```

**4. Access Your Site**

Your frontend is now live at `https://clinicflow.vercel.app` (or custom domain).

---

### Option B: Netlify

#### Prerequisites
- GitHub account (optional)
- Netlify account (free)

#### Steps

**1. Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**2. Deploy**
```bash
cd clinicflow
netlify deploy

# Authenticate with your Netlify account
```

**3. Set Environment Variables**

```bash
netlify env:set VITE_API_URL https://api.your-backend.com
netlify deploy --prod --dir=dist
```

---

### Option C: AWS S3 + CloudFront (Advanced)

#### Prerequisites
- AWS account
- AWS CLI installed

#### Steps

**1. Build**
```bash
npm run build
```

**2. Create S3 Bucket**
```bash
aws s3 mb s3://clinicflow-frontend
```

**3. Upload**
```bash
aws s3 sync dist/ s3://clinicflow-frontend --delete
```

**4. Create CloudFront Distribution**
- Origin: S3 bucket
- CNAME: clinicflow.yourdomain.com
- SSL: ACM certificate

**5. Update DNS**
- Point clinicflow.yourdomain.com → CloudFront CNAME

---

### Option D: Docker (For Teams)

#### Step 1: Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Step 2: Build Image

```bash
docker build -t clinicflow-frontend:1.0.0 .
```

#### Step 3: Run Container

```bash
docker run -p 3000:3000 \
  -e VITE_API_URL=https://api.your-backend.com \
  clinicflow-frontend:1.0.0
```

#### Step 4: Push to Registry (Optional)

```bash
docker tag clinicflow-frontend:1.0.0 your-registry/clinicflow-frontend:1.0.0
docker push your-registry/clinicflow-frontend:1.0.0
```

---

## 📋 Pre-Deployment Checklist

Before going live, verify:

- [ ] Backend is deployed and running
- [ ] Backend CORS is configured for your frontend domain
- [ ] Environment variables set correctly
- [ ] SSL/TLS certificate installed (HTTPS)
- [ ] Database backups configured
- [ ] Error tracking (Sentry, LogRocket) integrated
- [ ] Analytics (Google Analytics) added
- [ ] Monitoring alerts configured
- [ ] CDN (CloudFront, Cloudflare) enabled
- [ ] Rate limiting configured on backend
- [ ] Bot protection (reCAPTCHA) enabled for registration

---

## 🔍 Post-Deployment Verification

### 1. Check Connectivity

```bash
# Verify frontend loads
curl https://clinicflow.yourdomain.com

# Verify API call works
curl https://clinicflow.yourdomain.com/api/health
```

### 2. Test in Browser

1. Visit your deployed site
2. Sign in with test credentials
3. Test appointment booking
4. Check real-time queue updates

### 3. Monitor Errors

```bash
# View logs in Vercel/Netlify dashboard
# Or integrate error tracking:
npm install @sentry/react
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Symptoms**: Login fails with network error

**Solutions**:
```bash
# 1. Check backend URL in .env
cat .env

# 2. Verify backend is running
curl http://localhost:5000/api/health

# 3. Check CORS headers
curl -v http://localhost:5000/api/health

# 4. Verify frontend URL is allowed in backend CORS
# Backend code should have:
# cors: { origin: "http://localhost:5174" }
```

### "Blank page / nothing loads"

**Symptoms**: Browser shows blank page, no JavaScript errors

**Solutions**:
```bash
# 1. Check build output
npm run build

# 2. Verify dist/ has index.html and assets/
ls -la dist/

# 3. Test preview build locally
npm run preview

# 4. Check browser console for errors (F12)
```

### "Socket.io not connecting"

**Symptoms**: Real-time features don't work (queue, notifications)

**Solutions**:
```bash
# 1. Verify backend Socket.io is running
# Check backend logs for "Socket.io ready"

# 2. Check CORS for WebSocket
# Backend should allow WebSocket connections

# 3. Check if WebSocket is blocked by firewall
# Try: telnet api.yourdomain.com 443
```

### "TypeScript errors on build"

**Solutions**:
```bash
# 1. Check tsconfig.json paths
# Ensure all @/* paths resolve correctly

# 2. Run type checking
npx tsc --noEmit

# 3. Ensure all node_modules are installed
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Monitoring & Analytics

### Google Analytics Setup

```bash
# 1. Get GA4 property ID from Google
# 2. Install gtag
npm install @react-ga/core

# 3. Initialize in App.tsx
import { useEffect } from 'react'
useEffect(() => {
  window.gtag('config', 'GA_MEASUREMENT_ID')
}, [])
```

### Error Tracking with Sentry

```bash
# 1. Create Sentry project
# 2. Install SDK
npm install @sentry/react @sentry/tracing

# 3. Initialize in main.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "https://[key]@sentry.io/[project]",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 🔐 Security Checklist

- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Cookies marked Secure + HttpOnly
- [ ] CSRF tokens enabled on backend
- [ ] Content Security Policy headers set
- [ ] X-Frame-Options set to DENY
- [ ] Sensitive data not logged
- [ ] Dependencies regularly updated (`npm audit`)
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] No API keys exposed in frontend code

---

## 📞 Support & Help

### Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code (when added)
npm run lint

# Type check
npx tsc --noEmit

# Clear cache
rm -rf node_modules .next dist
npm install
```

### Useful Resources

- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **ClinicFlow Backend**: https://github.com/your-repo/clinicflow-backend

---

## 🎓 Next Steps

1. **Deploy backend** first (follow backend setup guide)
2. **Configure .env** with correct backend URL
3. **Test locally** with `npm run dev`
4. **Build & deploy** using one of the options above
5. **Verify** all features work in production
6. **Monitor** errors and performance

---

## 📝 Version History

- **v1.0.0** — Initial release with all core features
  - Authentication (Login, Register, OTP)
  - Patient Dashboard (Book, Queue, EMR, Prescriptions)
  - Doctor Dashboard (Queue, Consultations, Schedule)
  - Admin Dashboard (Users, Analytics)
  - Real-time Socket.io integration

---

**Questions?** Refer to README.md and FEATURES.md for detailed documentation.

**Happy coding! 🚀**
