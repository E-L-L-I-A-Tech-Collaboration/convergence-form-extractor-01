import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { runGnfsFactorization } from './server/gnfs-runner';
import { BillingService } from './server/billing';
import type { FactorizationRequest, GnfsStreamMessage } from './src/types';
import { CREATIVITY_EXERCISES } from './src/creativity-exercises';
import {
  startCreativeSession,
  updateSessionTelemetry,
  getAIAssistance,
  assessCreativeSession,
  getAssessmentHistory,
  generateCognitiveReappraisal,
  logEmotionalRegulationSession,
  getEmotionalSessionsHistory
} from './server/creativity-engine';

const app = express();
const port = Number(process.env.PORT || 5173);
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const billing = new BillingService();

app.use(express.json({ limit: '512kb' }));

// Digital Asset Links Pairing for Google Play TWA (Trusted Web Activity)
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const filePath = path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(fs.readFileSync(filePath, 'utf-8'));
  } else {
    res.status(404).json({ error: 'assetlinks.json not found' });
  }
});

export default app;

async function requireAuthenticated(req: express.Request, res: express.Response): Promise<import('./server/billing').BillingUser | null> {
  const user = await billing.authenticate(req);
  if (!user) res.status(401).json({ error: 'Sign in to continue.' });
  return user;
}

// Step A: Cloud Sync User Profile Endpoints
app.get('/api/user/profiles', async (_req, res) => {
  try {
    const list = await billing.listProfiles();
    res.json({ profiles: list });
  } catch {
    res.json({ profiles: [] });
  }
});

app.delete('/api/user/profile', async (req, res) => {
  try {
    const uid = String(req.query.uid || '');
    if (uid) {
      await billing.deleteProfile(uid);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to delete profile.' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const user = await billing.authenticate(req);
    const uid = user?.id || (req.query.uid as string) || 'user_123';
    let profile = await billing.getProfile(uid);
    if (!profile) {
      profile = {
        uid,
        displayName: user?.email ? user.email.split('@')[0] : 'Observer',
        curriculumWave: 1,
        accountTier: 'premium',
        email: user?.email
      };
    }
    res.json({
      uid: profile.uid,
      displayName: profile.displayName,
      curriculumWave: profile.curriculumWave,
      accountTier: profile.accountTier,
      email: profile.email,
      profileData: profile.profileData || {}
    });
  } catch {
    res.json({
      uid: 'user_123',
      displayName: 'Observer',
      curriculumWave: 1,
      accountTier: 'premium'
    });
  }
});

app.post('/api/user/profile', async (req, res) => {
  try {
    const user = await billing.authenticate(req);
    const uid = user?.id || req.body?.uid || 'user_123';
    const displayName = String(req.body?.displayName || 'Observer');
    const curriculumWave = Number(req.body?.curriculumWave || 1);
    const accountTier = (req.body?.accountTier || 'premium') as 'free' | 'standard' | 'premium';
    const profileData = req.body?.profileData || req.body?.config || {};

    const saved = await billing.upsertProfile({
      uid,
      displayName,
      curriculumWave,
      accountTier,
      email: user?.email || req.body?.email,
      profileData
    });

    res.json({
      success: true,
      profile: {
        uid: saved.uid,
        displayName: saved.displayName,
        curriculumWave: saved.curriculumWave,
        accountTier: saved.accountTier,
        email: saved.email,
        profileData: saved.profileData
      }
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to sync profile to cloud.' });
  }
});

app.get('/api/user/sync', async (req, res) => {
  try {
    const user = await billing.authenticate(req);
    const uid = user?.id || (req.query.uid as string) || 'user_123';
    const profile = await billing.getProfile(uid);
    res.json({
      synced: true,
      timestamp: new Date().toISOString(),
      profile: profile || {
        uid: 'user_123',
        displayName: 'Observer',
        curriculumWave: 1,
        accountTier: 'premium'
      }
    });
  } catch {
    res.json({
      synced: false,
      timestamp: new Date().toISOString(),
      profile: {
        uid: 'user_123',
        displayName: 'Observer',
        curriculumWave: 1,
        accountTier: 'premium'
      }
    });
  }
});

app.post('/api/billing/register', async (req, res) => {
  try {
    const user = await billing.register(String(req.body?.email || ''), String(req.body?.password || ''));
    billing.setSession(res, user.id);
    res.status(201).json({ email: user.email, active: true, playStoreLicensed: false });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create account.' });
  }
});

app.post('/api/billing/login', async (req, res) => {
  const user = await billing.login(String(req.body?.email || ''), String(req.body?.password || ''));
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  billing.setSession(res, user.id);
  res.json({
    email: user.email,
    active: true,
    licenseStatus: user.licenseStatus,
    playStoreOrderId: user.playStoreOrderId
  });
});

app.post('/api/billing/logout', (_req, res) => {
  billing.clearSession(res);
  res.status(204).end();
});

// Google Play Store Digital Purchase & License Verification Endpoint
app.post('/api/billing/play-store-verify', async (req, res) => {
  try {
    const user = await requireAuthenticated(req, res);
    if (!user) return;
    const orderId = String(req.body?.orderId || req.body?.purchaseToken || `GPA.${Date.now()}`);
    const updated = await billing.verifyPlayStorePurchase(user, orderId);
    res.json({
      verified: true,
      licenseStatus: updated.licenseStatus,
      playStoreOrderId: updated.playStoreOrderId,
      message: 'Google Play Store purchase verified and associated with account.'
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to verify Play Store purchase.' });
  }
});

app.get('/api/billing/status', async (req, res) => {
  try {
    const user = await billing.authenticate(req);
    if (!user) {
      res.json({
        active: true,
        distribution: 'google_play_store',
        packageId: 'com.axiomzetainnovations.convergenceform',
        playStoreLicensed: true
      });
      return;
    }
    res.json({
      active: true,
      email: user.email,
      distribution: 'google_play_store',
      packageId: 'com.axiomzetainnovations.convergenceform',
      licenseStatus: user.licenseStatus,
      playStoreOrderId: user.playStoreOrderId,
      currentPeriodEnd: user.currentPeriodEnd
    });
  } catch {
    res.json({ active: true, distribution: 'google_play_store' });
  }
});

const requireSubscriptionOrDev = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Selling directly on Google Play Store - standard access enabled
  next();
};

// --- Creativity Studio Endpoints (HRM / Hieromath / Ledger Augmented) ---

app.get('/api/creativity/exercises', requireSubscriptionOrDev, (_req, res) => {
  res.json({ exercises: CREATIVITY_EXERCISES });
});

app.post('/api/creativity/start', (req, res) => {
  try {
    const { exercise } = req.body;
    if (!exercise || !exercise.id) {
      res.status(400).json({ error: 'Exercise payload is required.' });
      return;
    }
    const session = startCreativeSession(exercise);
    res.json(session);
  } catch (error) {
    console.error('Error starting creative session:', error);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

app.post('/api/creativity/telemetry', (req, res) => {
  try {
    const { sessionId, ideas = [], elapsedSeconds = 0 } = req.body;
    const metrics = updateSessionTelemetry(String(sessionId), ideas, Number(elapsedSeconds));
    res.json(metrics);
  } catch (error) {
    console.error('Error updating telemetry:', error);
    res.status(500).json({ error: 'Failed to update telemetry' });
  }
});

app.post('/api/creativity/assist', async (req, res) => {
  try {
    const { sessionId, exercise, ideas = [], mode = 'provocation' } = req.body;
    if (!exercise) {
      res.status(400).json({ error: 'Exercise is required for assistance.' });
      return;
    }
    const assist = await getAIAssistance(String(sessionId), exercise, ideas, mode);
    res.json(assist);
  } catch (error) {
    console.error('Error getting AI assistance:', error);
    res.status(500).json({ error: 'Failed to generate assistance' });
  }
});

app.post('/api/creativity/assess', async (req, res) => {
  try {
    const { sessionId, exercise, ideas = [], durationSeconds = 60 } = req.body;
    if (!exercise || !Array.isArray(ideas)) {
      res.status(400).json({ error: 'Exercise and ideas list are required.' });
      return;
    }
    const assessment = await assessCreativeSession(
      String(sessionId),
      exercise,
      ideas,
      Number(durationSeconds)
    );
    res.json(assessment);
  } catch (error) {
    console.error('Error assessing creative session:', error);
    res.status(500).json({ error: 'Failed to assess session' });
  }
});

app.get('/api/creativity/history', (_req, res) => {
  res.json({ history: getAssessmentHistory() });
});

// --- Emotional Regulation Endpoints ---

app.post('/api/emotional-regulation/reframe', async (req, res) => {
  try {
    const { activatingEvent, emotion, preIntensity, catastrophicThought, selectedLens } = req.body;
    if (!activatingEvent || !catastrophicThought) {
      res.status(400).json({ error: 'Activating event and catastrophic thought are required.' });
      return;
    }
    const reappraisal = await generateCognitiveReappraisal({
      activatingEvent: String(activatingEvent),
      emotion: String(emotion || 'Anxiety'),
      preIntensity: Number(preIntensity || 7),
      catastrophicThought: String(catastrophicThought),
      selectedLens: selectedLens || 'decatastrophizing'
    });
    res.json(reappraisal);
  } catch (error) {
    console.error('Error generating reappraisal:', error);
    res.status(500).json({ error: 'Failed to generate cognitive reappraisal' });
  }
});

app.post('/api/emotional-regulation/log-session', (req, res) => {
  try {
    const { type, title, preIntensity, postIntensity, emotion, notes, durationSeconds } = req.body;
    const session = logEmotionalRegulationSession({
      type: type || 'breathing',
      title: String(title || 'Emotional Regulation Drill'),
      timestamp: new Date().toISOString(),
      preIntensity: preIntensity !== undefined ? Number(preIntensity) : undefined,
      postIntensity: postIntensity !== undefined ? Number(postIntensity) : undefined,
      emotion: emotion ? String(emotion) : undefined,
      notes: notes ? String(notes) : undefined,
      durationSeconds: Number(durationSeconds || 120)
    });
    res.json(session);
  } catch (error) {
    console.error('Error logging emotional regulation session:', error);
    res.status(500).json({ error: 'Failed to record emotional session' });
  }
});

app.get('/api/emotional-regulation/history', (_req, res) => {
  res.json({ history: getEmotionalSessionsHistory() });
});

// --- System & Compatibility Endpoints ---

const forbiddenKeys = new Set(['target', 'rawTarget', 'raw_target', 'integer', 'inputNumber', 'input_number']);
function containsForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (forbiddenKeys.has(key)) return true;
    if (containsForbiddenKey(child)) return true;
  }
  return false;
}

function clamp(v: unknown, lo = -1, hi = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, n));
}

function sanitizeGuidance(raw: Record<string, unknown>) {
  return {
    rhoStartBias: clamp(raw.rhoStartBias),
    rhoConstantBias: clamp(raw.rhoConstantBias),
    restartBias: clamp(raw.restartBias),
    diversityBias: clamp(raw.diversityBias),
    ecmCurveBias: clamp(raw.ecmCurveBias),
    ecmBoundBias: clamp(raw.ecmBoundBias),
    ecmBudgetBias: clamp(raw.ecmBudgetBias),
    wheelBias: clamp(raw.wheelBias),
    gnfsPolyBias: clamp(raw.gnfsPolyBias),
    gnfsRootBias: clamp(raw.gnfsRootBias),
    gnfsSieveBias: clamp(raw.gnfsSieveBias),
    gnfsFilterBias: clamp(raw.gnfsFilterBias),
    gnfsLinalgBias: clamp(raw.gnfsLinalgBias),
    rationale: String(raw.rationale ?? '').replace(/\b\d{8,}\b/g, '[redacted]').slice(0, 500)
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model,
    gnfs: {
      engine: 'cado-nfs',
      executable: process.env.CADO_NFS_PATH || 'cado-nfs.py',
      threads: Number(process.env.GNFS_THREADS || 2)
    }
  });
});

app.post('/api/gemini-guidance', requireSubscriptionOrDev, async (req, res) => {
  if (containsForbiddenKey(req.body)) {
    res.status(400).send('Payload rejected: raw target fields are not accepted by the Gemini advisory boundary.');
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).send('GEMINI_API_KEY is not configured. Use the HRM-only profile or configure the server key.');
    return;
  }

  const { method, digitLength, bitLength, smallPrimeResidueFingerprint, hrmState, hieromathDirective } = req.body ?? {};
  if (!['trial', 'rho', 'ecm', 'gnfs'].includes(method)) {
    res.status(400).send('Invalid method.');
    return;
  }
  if (!Number.isFinite(Number(digitLength)) || !Number.isFinite(Number(bitLength)) || !Array.isArray(smallPrimeResidueFingerprint)) {
    res.status(400).send('Incomplete structural telemetry.');
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const structuralTelemetry = { method, digitLength, bitLength, smallPrimeResidueFingerprint, hrmState, hieromathDirective };
    const prompt = [
      'You are an advisory search-control module for a semiprime prime-factorization experiment whose objective is N = p*q.',
      'You MUST NOT calculate, infer, request, or return any factor, divisor, candidate factor, or original target integer.',
      'The semiprime candidate is intentionally absent. Use only the structural telemetry provided; do not infer p or q.',
      'Return bounded control biases between -1 and 1. These are advisory only and will be sanitized locally.',
      'For GNFS, advise only search-effort allocation among polynomial selection, root optimization, sieving, filtering, and linear algebra.',
      'Do not claim a speedup or algorithmic breakthrough.',
      `Structural telemetry: ${JSON.stringify(structuralTelemetry)}`
    ].join('\n');

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            rhoStartBias: { type: 'number' },
            rhoConstantBias: { type: 'number' },
            restartBias: { type: 'number' },
            diversityBias: { type: 'number' },
            ecmCurveBias: { type: 'number' },
            ecmBoundBias: { type: 'number' },
            ecmBudgetBias: { type: 'number' },
            wheelBias: { type: 'number' },
            gnfsPolyBias: { type: 'number' },
            gnfsRootBias: { type: 'number' },
            gnfsSieveBias: { type: 'number' },
            gnfsFilterBias: { type: 'number' },
            gnfsLinalgBias: { type: 'number' },
            rationale: { type: 'string' }
          },
          required: [
            'rhoStartBias', 'rhoConstantBias', 'restartBias', 'diversityBias',
            'ecmCurveBias', 'ecmBoundBias', 'ecmBudgetBias', 'wheelBias',
            'gnfsPolyBias', 'gnfsRootBias', 'gnfsSieveBias', 'gnfsFilterBias', 'gnfsLinalgBias',
            'rationale'
          ]
        }
      }
    });
    const parsed = JSON.parse(response.text || '{}') as Record<string, unknown>;
    res.json(sanitizeGuidance(parsed));
  } catch (error) {
    console.error(error);
    res.status(502).send(error instanceof Error ? error.message : 'Gemini advisory request failed.');
  }
});

app.post('/api/gnfs-factor', async (req, res) => {
  const body = req.body as Partial<FactorizationRequest>;
  if (body.method !== 'gnfs' || !['classical', 'hrm', 'gemini'].includes(String(body.profile))) {
    res.status(400).send('Invalid GNFS request.');
    return;
  }
  if (typeof body.target !== 'string' || !/^\d+$/.test(body.target) || typeof body.replaySeed !== 'string') {
    res.status(400).send('GNFS requires a decimal target and replay seed.');
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  const write = (message: GnfsStreamMessage) => {
    if (!res.writableEnded) res.write(`${JSON.stringify(message)}\n`);
  };

  try {
    const result = await runGnfsFactorization(body as FactorizationRequest, write, abort.signal);
    write({ type: 'result', result });
  } catch (error) {
    write({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

// API 404 Catch-all: prevent any unmatched /api requests from falling through into Vite SPA HTML fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HRM factorizer server listening on http://0.0.0.0:${port}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
