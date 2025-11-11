# Vercel Deployment Guide for Inner Leaf Chat

## ✅ Fixed Issues

### 1. Build Output Directory Configuration
- **Problem**: Vercel couldn't find the "build" directory
- **Solution**: Updated `vercel.json` with proper configuration:
  - `outputDirectory`: "build"
  - `buildCommand`: "yarn build"
  - `installCommand`: "yarn install"

### 2. Chunk Size Optimization
- **Problem**: Bundle chunks were larger than 500 KB
- **Solution**: Updated `vite.config.ts` with code splitting:
  - Split React vendors into separate chunk
  - Split Firebase into separate chunk
  - Split UI components into separate chunk
  - Increased warning limit to 1000 KB

## 📋 Deployment Steps for Vercel

### Prerequisites
Your frontend folder must be pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### Step 1: Import Project to Vercel
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select the `frontend` folder as the root directory

### Step 2: Configure Build Settings
Vercel should automatically detect the settings from `vercel.json`, but verify:
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (if your repo has multiple folders)
- **Build Command**: `yarn build`
- **Output Directory**: `build`
- **Install Command**: `yarn install`

### Step 3: Environment Variables
Add these environment variables in Vercel Dashboard:
- `REACT_APP_BACKEND_URL`: Your backend API URL (if using external API)
- Any Firebase configuration variables if needed

### Step 4: Deploy
Click "Deploy" and Vercel will build and deploy your application.

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "yarn build",
  "outputDirectory": "build",
  "devCommand": "yarn dev",
  "installCommand": "yarn install",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### vite.config.ts (Key Build Settings)
```typescript
build: {
  outDir: 'build',
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'firebase': ['firebase/app', 'firebase/auth', 'firebase/database'],
        'ui-components': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-scroll-area'],
      },
    },
  },
}
```

## ✨ Optimizations Applied

1. **Code Splitting**: Large dependencies are now split into separate chunks
2. **Smaller Bundle Sizes**: 
   - React vendor: ~160 KB
   - Firebase: ~346 KB
   - UI Components: ~110 KB
   - Main app: ~472 KB
3. **Better Caching**: Separate chunks allow better browser caching
4. **Faster Initial Load**: Critical code loads first

## 🐛 Troubleshooting

### Build Fails with "No Output Directory"
- Ensure `vercel.json` is in the frontend folder
- Check that `outputDirectory` is set to "build"
- Verify the build command runs successfully locally

### 404 Errors on Route Changes
- The `rewrites` configuration in `vercel.json` handles SPA routing
- All routes redirect to `/index.html` for client-side routing

### Large Bundle Warning
- Already optimized with code splitting
- Warning limit increased to 1000 KB
- Further optimization possible with dynamic imports if needed

## 🎯 Expected Build Output

After successful build, you should see:
```
build/
  ├── assets/
  │   ├── react-vendor-*.js (~160 KB)
  │   ├── firebase-*.js (~346 KB)
  │   ├── ui-components-*.js (~110 KB)
  │   ├── index-*.js (~472 KB)
  │   ├── index-*.css (~62 KB)
  │   └── app-logo-*.png
  ├── index.html
  ├── favicon.ico
  ├── placeholder.svg
  └── robots.txt
```

## 📝 Notes

- The application uses Firebase Realtime Database for backend
- Firebase credentials are hardcoded in the app (consider moving to environment variables for production)
- Supabase is used for file storage (chat-files bucket)
- All routes are client-side and handled by React Router

## 🚀 Production Checklist

Before deploying to production:
- [ ] Move Firebase credentials to environment variables
- [ ] Configure Supabase environment variables
- [ ] Set up proper CORS origins
- [ ] Test all features in production environment
- [ ] Monitor bundle sizes and performance
- [ ] Set up error tracking (optional: Sentry, etc.)

---

Your application is now ready for Vercel deployment! 🎉
