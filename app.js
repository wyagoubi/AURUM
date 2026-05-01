// src/app.js
'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { pool } = require('./db');

const authRouter     = require('./routes/auth');
const hotelsRouter   = require('./routes/hotels');
const bookingsRouter = require('./routes/bookings');
const ownerRouter    = require('./routes/owner');
const aiRouter       = require('./routes/ai');

const app = express();

// ── Trust proxy (Render, Railway, etc.)
app.set('trust proxy', 1);

// ── CORS — allow any origin with credentials (frontend on GitHub Pages)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : true; // true = reflect any origin (fine for development)

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Sessions (stored in PostgreSQL)
const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: true }),
    name: 'aurum.sid',
    secret: process.env.SESSION_SECRET || 'aurum-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'none',        // required for cross-origin (GitHub Pages ↔ Render)
      secure: true,            // required with sameSite:'none'
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

// ── Routes under /api
app.use('/api', authRouter);
app.use('/api', hotelsRouter);
app.use('/api', bookingsRouter);
app.use('/api', ownerRouter);
app.use('/api', aiRouter);

// Health check
app.get('/api/healthz', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/', (_req, res) => res.json({ service: 'AURUM API', status: 'running' }));

// 404 catch-all
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));

module.exports = app;
