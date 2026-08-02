/* ============================================
   LUMINA - Backend Complet (server.js)
   Node.js + Express + MongoDB + Gemini + Stripe
   AVEC ROUTE GUEST POUR CHAT SANS CONNEXION
   ============================================ */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Servir le frontend statique
app.use(express.static(path.join(__dirname, '../client/dist')));

// ============ DATABASE - SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  tier: { type: String, enum: ['free', 'lite', 'pro'], default: 'free' },
  questionsUsed: { type: Number, default: 0 },
  questionLimit: { type: Number, default: 50 },
  monthResetDate: { type: Date, default: () => new Date() },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['chat', 'english', 'recipes'], default: 'chat' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  title: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

// ============ CONNECT MONGODB ============
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ MongoDB connecté');
}).catch(err => console.log('❌ MongoDB error:', err));

// ============ SERVICES ============

// Service OTP Email
const sendOTP = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🌟 Your Lumina Authentication Code',
    html: `
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a8c 100%); padding: 40px; border-radius: 8px; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <h1 style="margin-top: 0; font-size: 28px;">Welcome to Lumina ✨</h1>
        <p style="font-size: 16px; margin: 20px 0;">Your authentication code is:</p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 6px; text-align: center; margin: 30px 0;">
          <code style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #f59e0b;">${code}</code>
        </div>
        <p style="font-size: 14px; opacity: 0.8;">This code expires in 10 minutes.</p>
      </div>
    `
  });
};

// Service Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const callGemini = async (messages, mode) => {
  const systemPrompts = {
    chat: "You are Lumina, a friendly and intelligent AI assistant. Be helpful, engaging, and conversational. Respond in the language the user uses.",
    english: "You are Lumina's English Learning Coach. Help users improve their English. Correct mistakes gently, explain grammar, provide examples. Be encouraging!",
    recipes: "You are Lumina's Chef Assistant. Help users find recipes, suggest ingredients, give cooking tips. Be creative and share food knowledge enthusiastically."
  };

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const conversation = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const response = await model.generateContent({
    contents: conversation,
    systemInstruction: systemPrompts[mode]
  });

  return response.response.text();
};

// ============ MIDDLEWARE AUTH ============

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ ROUTES ============

// ✅ LOGIN - Envoyer OTP
app.post('/api/auth/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    const code = Math.random().toString().slice(2, 8);
    const codeHash = require('crypto').createHash('sha256').update(code).digest('hex');
    
    await sendOTP(email, code);
    
    // Stocker temporairement
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = {
      hash: codeHash,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    
    res.json({ message: 'Code envoyé à ' + email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
});

// ✅ LOGIN - Vérifier OTP et créer token
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const crypto = require('crypto');
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const stored = global.otpStore?.[email];
    if (!stored || Date.now() > stored.expiresAt || stored.hash !== codeHash) {
      return res.status(401).json({ error: 'Code invalide ou expiré' });
    }
    
    // Créer ou récupérer user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, tier: 'free', questionLimit: 50 });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    delete global.otpStore[email];
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur vérification' });
  }
});

// ✅ GET USER INFO
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Réinitialiser count si mois changé
    const now = new Date();
    const resetDate = new Date(user.monthResetDate);
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      user.questionsUsed = 0;
      user.monthResetDate = now;
      await user.save();
    }
    
    res.json({
      ...user.toObject(),
      questionsRemaining: user.questionLimit - user.questionsUsed
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ✅ CHAT - Envoyer message et obtenir réponse (avec authentification)
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message, mode = 'chat', conversationId } = req.body;
    
    const user = await User.findById(req.userId);
    
    // Vérifier limite
    if (user.questionsUsed >= user.questionLimit) {
      return res.status(429).json({ 
        error: 'Limite atteinte',
        message: 'Vous avez atteint votre limite de questions. Mettez à jour votre abonnement.' 
      });
    }
    
    // Récupérer ou créer conversation
    let conversation = conversationId 
      ? await Conversation.findById(conversationId)
      : new Conversation({ userId: req.userId, mode });
    
    // Ajouter message user
    conversation.messages.push({ role: 'user', content: message });
    
    // Appeler Gemini
    const response = await callGemini(conversation.messages, mode);
    
    // Ajouter réponse
    conversation.messages.push({ role: 'assistant', content: response });
    conversation.updatedAt = new Date();
    if (!conversation.title && conversation.messages.length === 2) {
      conversation.title = message.slice(0, 50) + '...';
    }
    
    await conversation.save();
    
    // Incrémenter count
    user.questionsUsed += 1;
    await user.save();
    
    res.json({ response, conversationId: conversation._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur API Gemini' });
  }
});

// ✅ CHAT GUEST - Pour les utilisateurs non connectés
app.post('/api/chat-guest', async (req, res) => {
  try {
    const { message, mode = 'chat' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide' });
    }

    // Appeler Gemini directement (pas de sauvegarde)
    const response = await callGemini([{ role: 'user', content: message }], mode);
    
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur API Gemini' });
  }
});

// ✅ GET CONVERSATIONS
app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('_id title mode createdAt updatedAt');
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ✅ GET SINGLE CONVERSATION
app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!conversation) return res.status(404).json({ error: 'Non trouvé' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ✅ STRIPE - Créer session checkout
app.post('/api/subscribe', authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findById(req.userId);
    
    const prices = {
      lite: process.env.STRIPE_LITE_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID
    };
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: prices[tier],
        quantity: 1
      }],
      customer_email: user.email,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: req.userId.toString(), tier }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur Stripe' });
  }
});

// ✅ STRIPE - Webhook
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const tier = session.metadata.tier;
      
      const tierLimits = { lite: 500, pro: 2000 };
      
      await User.findByIdAndUpdate(userId, {
        tier,
        questionLimit: tierLimits[tier],
        questionsUsed: 0,
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer
      });
    }
    
    res.json({received: true});
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ============ SERVE REACT FRONTEND ============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ============ SERVER START ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌟 Lumina Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
