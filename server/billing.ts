import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const sessionCookieName = 'mind_forge_session';
const activeStatuses = new Set(['active', 'trialing', 'lifetime', 'play_store_verified']);

export interface BillingUser {
  id: string;
  email: string;
  playStoreOrderId: string | null;
  licenseStatus: string | null;
  currentPeriodEnd: Date | null;
}

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  curriculumWave: number;
  accountTier: 'free' | 'standard' | 'premium';
  email?: string;
  profileData?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      billingUser?: BillingUser;
    }
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function passwordHash(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordsMatch(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return candidate.length === hash.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export class BillingService {
  private readonly pool: Pool;
  private initialized: Promise<void> | null = null;

  constructor(pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  })) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.initialized = this.pool.query(`
        CREATE TABLE IF NOT EXISTS billing_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          play_store_order_id TEXT,
          license_status TEXT DEFAULT 'active',
          current_period_end TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS user_profiles (
          uid TEXT PRIMARY KEY,
          display_name TEXT NOT NULL DEFAULT 'Observer',
          curriculum_wave INTEGER NOT NULL DEFAULT 1,
          account_tier TEXT NOT NULL DEFAULT 'premium',
          email TEXT,
          profile_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `).then(() => undefined);
    }
    return this.initialized;
  }

  private rowToUser(row: Record<string, unknown>): BillingUser {
    return {
      id: String(row.id),
      email: String(row.email),
      playStoreOrderId: row.play_store_order_id ? String(row.play_store_order_id) : null,
      licenseStatus: row.license_status ? String(row.license_status) : 'active',
      currentPeriodEnd: row.current_period_end ? new Date(String(row.current_period_end)) : null
    };
  }

  private rowToProfile(row: Record<string, unknown>): UserProfileRecord {
    return {
      uid: String(row.uid),
      displayName: String(row.display_name || 'Observer'),
      curriculumWave: Number(row.curriculum_wave || 1),
      accountTier: (String(row.account_tier || 'premium')) as 'free' | 'standard' | 'premium',
      email: row.email ? String(row.email) : undefined,
      profileData: (row.profile_data && typeof row.profile_data === 'object') ? (row.profile_data as Record<string, unknown>) : {},
      createdAt: row.created_at ? new Date(String(row.created_at)) : undefined,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : undefined
    };
  }

  private async userById(id: string): Promise<BillingUser | null> {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM billing_users WHERE id = $1', [id]);
    return result.rowCount ? this.rowToUser(result.rows[0]) : null;
  }

  private signSession(userId: string): string {
    const secret = process.env.BILLING_COOKIE_SECRET || 'convergence-playstore-secure-salt';
    const signature = crypto.createHmac('sha256', secret).update(userId).digest('base64url');
    return `${userId}.${signature}`;
  }

  setSession(response: Response, userId: string): void {
    response.setHeader('Set-Cookie', `${sessionCookieName}=${encodeURIComponent(this.signSession(userId))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }

  clearSession(response: Response): void {
    response.setHeader('Set-Cookie', `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }

  private sessionUserId(request: Request): string | null {
    const token = cookieValue(request, sessionCookieName);
    const secret = process.env.BILLING_COOKIE_SECRET || 'convergence-playstore-secure-salt';
    if (!token || !secret) return null;
    const separator = token.lastIndexOf('.');
    if (separator < 1) return null;
    const userId = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    const expected = crypto.createHmac('sha256', secret).update(userId).digest('base64url');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return userId;
  }

  async authenticate(request: Request): Promise<BillingUser | null> {
    const userId = this.sessionUserId(request);
    return userId ? this.userById(userId) : null;
  }

  async register(emailInput: string, password: string): Promise<BillingUser> {
    const email = emailInput.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) throw new Error('Use a valid email and a password of at least 12 characters.');
    await this.initialize();
    try {
      const uid = crypto.randomUUID();
      const result = await this.pool.query(
        'INSERT INTO billing_users (id, email, password_hash, license_status) VALUES ($1, $2, $3, $4) RETURNING *',
        [uid, email, passwordHash(password), 'active']
      );
      // Auto-create matching user_profile
      await this.upsertProfile({
        uid,
        displayName: email.split('@')[0] || 'Observer',
        curriculumWave: 1,
        accountTier: 'premium',
        email
      });
      return this.rowToUser(result.rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new Error('An account already exists for this email.');
      throw error;
    }
  }

  async login(emailInput: string, password: string): Promise<BillingUser | null> {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM billing_users WHERE email = $1', [emailInput.trim().toLowerCase()]);
    if (!result.rowCount || !passwordsMatch(password, String(result.rows[0].password_hash))) return null;
    return this.rowToUser(result.rows[0]);
  }

  async verifyPlayStorePurchase(user: BillingUser, orderId: string): Promise<BillingUser> {
    await this.initialize();
    const result = await this.pool.query(
      'UPDATE billing_users SET play_store_order_id = $1, license_status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [orderId, 'play_store_verified', user.id]
    );
    if (!result.rowCount) throw new Error('Unable to update Play Store purchase status.');
    return this.rowToUser(result.rows[0]);
  }

  async getProfile(uid: string): Promise<UserProfileRecord | null> {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM user_profiles WHERE uid = $1', [uid]);
    return result.rowCount ? this.rowToProfile(result.rows[0]) : null;
  }

  async upsertProfile(profile: Partial<UserProfileRecord> & { uid: string }): Promise<UserProfileRecord> {
    await this.initialize();
    const existing = await this.getProfile(profile.uid);
    const displayName = profile.displayName ?? existing?.displayName ?? 'Observer';
    const curriculumWave = profile.curriculumWave ?? existing?.curriculumWave ?? 1;
    const accountTier = profile.accountTier ?? existing?.accountTier ?? 'premium';
    const email = profile.email ?? existing?.email ?? null;
    const profileData = JSON.stringify({ ...(existing?.profileData || {}), ...(profile.profileData || {}) });

    const result = await this.pool.query(`
      INSERT INTO user_profiles (uid, display_name, curriculum_wave, account_tier, email, profile_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (uid) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          curriculum_wave = EXCLUDED.curriculum_wave,
          account_tier = EXCLUDED.account_tier,
          email = COALESCE(EXCLUDED.email, user_profiles.email),
          profile_data = EXCLUDED.profile_data,
          updated_at = NOW()
      RETURNING *;
    `, [profile.uid, displayName, curriculumWave, accountTier, email, profileData]);

    return this.rowToProfile(result.rows[0]);
  }

  async listProfiles(): Promise<UserProfileRecord[]> {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 50');
    return result.rows.map(row => this.rowToProfile(row));
  }

  async deleteProfile(uid: string): Promise<boolean> {
    await this.initialize();
    const result = await this.pool.query('DELETE FROM user_profiles WHERE uid = $1', [uid]);
    return (result.rowCount ?? 0) > 0;
  }

  requireActiveSubscription = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authenticate(request);
      if (!user) {
        this.clearSession(response);
        response.status(401).json({ error: 'Sign in to access your Convergence account.' });
        return;
      }
      if (user.licenseStatus && !activeStatuses.has(user.licenseStatus)) {
        response.status(403).json({ error: 'A valid Google Play Store license or active account is required.' });
        return;
      }
      request.billingUser = user;
      next();
    } catch {
      response.status(503).json({ error: 'License verification is temporarily unavailable.' });
    }
  };
}
