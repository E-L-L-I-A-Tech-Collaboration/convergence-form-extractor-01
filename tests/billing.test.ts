import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { newDb } from 'pg-mem';

process.env.VERCEL = '1';
process.env.BILLING_COOKIE_SECRET = 'billing-test-secret';

const { BillingService } = await import('../server/billing');

const database = newDb();
const databaseAdapter = database.adapters.createPg();
const billing = new BillingService(new databaseAdapter.Pool() as never);

const responseHeaders: Record<string, string> = {};
const fakeResponse = { setHeader(name: string, value: string) { responseHeaders[name] = value; } } as unknown as express.Response;

console.log('Testing account registration and cross-device restoration...');
const user = await billing.register('member@example.com', 'correct-horse-battery');
billing.setSession(fakeResponse, user.id);
const cookie = responseHeaders['Set-Cookie'].split(';')[0];
const restored = await billing.authenticate({ headers: { cookie } } as express.Request);
assert.equal(restored?.email, 'member@example.com');
assert.equal(await billing.login('member@example.com', 'wrong-password'), null);
assert.equal((await billing.login('member@example.com', 'correct-horse-battery'))?.id, user.id);

console.log('Testing Step A: user_profiles table and Cloud Sync mapping...');
const userProfile = await billing.upsertProfile({
  uid: 'user_123',
  displayName: 'Observer',
  curriculumWave: 1,
  accountTier: 'premium'
});
assert.equal(userProfile.uid, 'user_123');
assert.equal(userProfile.displayName, 'Observer');
assert.equal(userProfile.curriculumWave, 1);
assert.equal(userProfile.accountTier, 'premium');

const fetchedProfile = await billing.getProfile('user_123');
assert.equal(fetchedProfile?.uid, 'user_123');
assert.equal(fetchedProfile?.displayName, 'Observer');
assert.equal(fetchedProfile?.accountTier, 'premium');

console.log('Testing Google Play Store purchase verification and entitlement on billing service...');
const verifiedUser = await billing.verifyPlayStorePurchase(user, 'GPA.3344-5566-7788-99001');
assert.equal(verifiedUser.playStoreOrderId, 'GPA.3344-5566-7788-99001');
assert.equal(verifiedUser.licenseStatus, 'play_store_verified');

let entitlementStatus = 0;
await billing.requireActiveSubscription({ headers: { cookie } } as express.Request, {
  status(code: number) { entitlementStatus = code; return this; },
  json() { return this; },
  setHeader() { return this; }
} as unknown as express.Response, () => { entitlementStatus = 200; });
assert.equal(entitlementStatus, 200);

console.log('Testing Step B: Digital Asset Links Pairing endpoint...');
const { default: app } = await import('../server');
const assetLinksRes = await request(app).get('/.well-known/assetlinks.json').expect(200);
assert.match(assetLinksRes.headers['content-type'], /json/);
assert.equal(Array.isArray(assetLinksRes.body), true);
assert.equal(assetLinksRes.body[0].target.package_name, 'com.axiomzetainnovations.convergenceform');

console.log('Testing Play Store app status endpoint...');
const statusRes = await request(app).get('/api/billing/status').expect(200);
assert.equal(statusRes.body.distribution, 'google_play_store');
assert.equal(statusRes.body.packageId, 'com.axiomzetainnovations.convergenceform');

console.log('Testing unauthenticated Google Play Store verification endpoint protection...');
await request(app).post('/api/billing/play-store-verify').expect(401);

console.log('Testing Step A: Cloud sync API endpoints on Express app...');
const profileRes = await request(app).get('/api/user/profile').expect(200);
assert.equal(profileRes.body.accountTier, 'premium');
assert.equal(profileRes.body.curriculumWave, 1);

console.log('All Steps A, B, and C tests passed successfully.');
process.exit(0);
