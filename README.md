# 🌟 LUMINA - AI Assistant Platform

## Démarrage rapide

### 1️⃣ Remplir server/.env

```env
MONGODB_URI=ta_connection_string_mongodb
GEMINI_API_KEY=ta_clé_gemini
JWT_SECRET=une_clé_très_longue_et_aléatoire
EMAIL_USER=ton_gmail
EMAIL_PASSWORD=app_password_gmail
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_LITE_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### 2️⃣ Initialiser Git et Push

```bash
git init
git add .
git commit -m "Initial Lumina commit"
git branch -M main
git remote add origin https://github.com/titigot20-byte/lumina-ia.git
git push -u origin main
```

### 3️⃣ Déployer sur Render

1. Va sur https://render.com
2. New Web Service
3. Connecte ton repo GitHub
4. **Settings:**
   - Root Directory: `.` (vide)
   - Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
   - Start Command: `cd server && node server.js`
5. **Environment Variables:** Copie ton .env
6. Deploy!

## Features

✅ **3 Modes:** Chat • English Learning • Recipes
✅ **Authentification OTP:** Code par email
✅ **Mode Guest:** Continue sans compte (avec réponses Gemini vraies!)
✅ **Abonnements:** Free (50q) • Lite 2€ (500q) • Pro 5€ (2000q)
✅ **Gemini API:** Réponses IA
✅ **MongoDB:** Sauvegarde conversations
✅ **Stripe:** Paiements intégrés

## Structure

```
lumina-final/
├── server/         ← Backend (Node.js)
│   ├── server.js
│   ├── package.json
│   └── .env
├── client/         ← Frontend (React)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── .gitignore
```

**Bon déploiement! 🚀**
