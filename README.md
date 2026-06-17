# DuDu Space 💕

A couple's personal space web app — timeline, stories, dreams, and whispers.

## Deploy to Vercel (easiest, no coding required)

### Option A: One-click via GitHub
1. Create a GitHub account (if you don't have one) at https://github.com
2. Create a new repository and upload this entire folder
3. Go to https://vercel.com and sign in with GitHub
4. Click "Add New Project" → select your dudu-space repo
5. Click "Deploy" — done!

### Option B: Via Vercel CLI
1. Install Node.js from https://nodejs.org (LTS version)
2. Open Terminal and run:
```bash
cd dudu-space
npm install
npm run build
npx vercel --prod
```
3. Follow the prompts — your app will be live!

## After deploying
- Both you and your boyfriend open the same URL
- All data syncs in real-time via Firebase
- Add to Home Screen on your phones for an app-like experience

## Making changes
- Edit the code, then redeploy with `npx vercel --prod`
- Or if using GitHub, just push changes and Vercel auto-deploys
