# 🍛 QuikBites — Setup & Deployment Guide

## Overview
This guide walks you through going live with your QuikBites app **step by step**, with no coding required. You'll be using two free services:
- **Firebase** (database + login system) — by Google
- **Vercel** (hosting) — free to use

Estimated time: **30–45 minutes**

---

## STEP 1 — Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `quikbites` → Click Continue
4. Disable Google Analytics (not needed) → Click **Create project**
5. Wait for it to create, then click **Continue**

---

## STEP 2 — Set Up Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left menu
2. Click **"Create database"**
3. Select **"Start in production mode"** → Click Next
4. Choose your region: **asia-southeast1** (closest to Solomon Islands) → Click **Enable**

### Set Security Rules:
1. Click the **"Rules"** tab
2. Replace everything with the content from `firestore.rules` file
3. Click **Publish**

---

## STEP 2B — Set Up Firebase Storage (for photo uploads)

1. In your Firebase project, click **"Storage"** in the left menu
2. Click **"Get started"**
3. Select **"Start in production mode"** → Click Next
4. Choose the same region: **asia-southeast1** → Click **Done**

### Set Storage Security Rules:
1. Click the **"Rules"** tab in Storage
2. Replace everything with:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /menu-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
3. Click **Publish**

---

## STEP 3 — Enable Authentication

1. In Firebase, click **"Authentication"** in the left menu
2. Click **"Get started"**
3. Click **"Email/Password"** → Toggle it **ON** → Save

### Create Admin account:
1. Click the **"Users"** tab
2. Click **"Add user"**
3. Email: `admin@quikbites.com`
4. Password: Choose a strong password (write it down!)
5. Click **Add user**

### Create Kitchen account:
1. Click **"Add user"** again
2. Email: `kitchen@quikbites.com`
3. Password: Choose a password (write it down!)
4. Click **Add user**

---

## STEP 4 — Get Your Firebase Config

1. In Firebase, click the **gear icon ⚙️** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **</>** (web) icon
5. App nickname: `quikbites-web` → Click **Register app**
6. You'll see a code block — copy these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
7. Click **Continue to console**

---

## STEP 5 — Configure Your App

1. Open the file called `.env.local.example` in the quikbites folder
2. **Rename it** to `.env.local` (remove the `.example` part)
3. Fill in the values you copied from Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=paste_your_apiKey_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paste_your_authDomain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=paste_your_projectId_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paste_your_storageBucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=paste_your_messagingSenderId_here
NEXT_PUBLIC_FIREBASE_APP_ID=paste_your_appId_here
```

4. Save the file

---

## STEP 6 — Deploy to Vercel (Go Live!)

1. Go to **https://github.com** and create a free account (if you don't have one)
2. Create a **new repository** called `quikbites`
3. Upload all the project files to this repository

4. Go to **https://vercel.com** and sign up with your GitHub account
5. Click **"New Project"**
6. Select your `quikbites` repository
7. Click **"Environment Variables"** and add all 6 Firebase variables from your `.env.local` file
8. Click **"Deploy"**

9. Vercel will build and deploy your site — takes about 2 minutes
10. You'll get a live URL like: `https://quikbites.vercel.app` 🎉

---

## STEP 7 — First Launch

1. Visit your live URL
2. The database will auto-populate with all 25 menu items on first visit
3. Visit `your-url/login?role=admin` to log in as admin
4. Visit `your-url/login?role=kitchen` for the kitchen dashboard

### Recommended first steps in Admin:
- Go to **Settings** tab → toggle "Kitchen is Open" to ON
- Go to **Delivery** tab → add your delivery areas and fees
- Go to **Menu** tab → add images to your food items (paste image URLs)
- Enable M-SELEN once you have your API credentials

---

## Your Important URLs

| Page | URL |
|------|-----|
| Customer Menu | `your-url/` |
| Admin Panel | `your-url/admin` |
| Kitchen Dashboard | `your-url/kitchen` |
| Admin Login | `your-url/login?role=admin` |
| Kitchen Login | `your-url/login?role=kitchen` |
| Order Tracking | `your-url/track/[order-id]` |

---

## Adding Product Images

To add food photos to menu items:
1. Log in to **Admin Panel** → go to **Menu** tab
2. Click the ✏️ edit button on any item
3. In the edit form, tap **"Tap to upload photo"**
4. Select a photo from your phone gallery or computer
5. The photo uploads automatically and shows a preview
6. Click **Save Item**

You can also paste a direct image URL if you prefer. Photos are stored in Firebase Storage and load instantly for all customers.

---

## M-SELEN Integration

Once you have your M-SELEN API credentials:
1. Go to Admin Panel → Settings → M-SELEN Configuration
2. Toggle it ON
3. Enter your Merchant ID, API Key, and API URL
4. Save settings

---

## Daily Operations

**Opening for the day:**
→ Admin Panel → Settings → Toggle "Kitchen is Open" to ON

**Closing for the day:**
→ Admin Panel → Settings → Toggle "Kitchen is Open" to OFF

**Kitchen receives new orders:**
→ Open `your-url/kitchen` on tablet/phone
→ Orders appear in real-time with sound alert
→ Tap Accept → set timer → confirm

---

## Need Help?

If you get stuck at any step, feel free to ask for assistance!

---

*Built with ❤️ for QuikBites — South Asian Cloud Kitchen, Honiara*
