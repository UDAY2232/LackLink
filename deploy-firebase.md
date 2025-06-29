# 🚀 Firebase Hosting Deployment Guide for LackLink

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `lacklink-marketplace`
4. Continue through setup (Analytics optional)

## Step 2: Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 3: Login to Firebase
```bash
firebase login
```

## Step 4: Initialize Firebase in Your Project
```bash
firebase init hosting
```

**Configuration Options:**
- ✅ Use existing project: `lacklink-marketplace`
- ✅ Public directory: `dist`
- ✅ Configure as SPA: `Yes`
- ✅ Set up automatic builds: `No` (for now)
- ❌ Overwrite index.html: `No`

## Step 5: Build Your Project
```bash
npm run build
```

## Step 6: Deploy to Firebase
```bash
firebase deploy
```

## Step 7: Your Live URL
After deployment, you'll get a URL like:
```
https://lacklink-marketplace.web.app
```

## 🔄 Future Deployments
To update your site:
```bash
npm run build
firebase deploy
```

## 🎯 Custom Domain (Optional)
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `lacklink.com`)
4. Follow DNS setup instructions

## 📊 Firebase Features You Can Add Later
- **Authentication**: Firebase Auth integration
- **Database**: Firestore for additional features
- **Analytics**: Track user behavior
- **Performance**: Monitor site performance
- **Functions**: Serverless backend functions

## 🛠️ Troubleshooting
If deployment fails:
1. Check if `dist` folder exists: `ls dist/`
2. Rebuild: `npm run build`
3. Try deploying again: `firebase deploy`

## 🔐 Environment Variables
For production, set your Supabase keys in Firebase:
1. Firebase Console → Project Settings
2. Add environment variables for your Supabase URL and keys