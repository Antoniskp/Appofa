const crypto = require('crypto');
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

jest.mock('nodemailer', () => {
  const sendMail = jest.fn();
  return {
    createTransport: jest.fn(() => ({ sendMail })),
    __sendMailMock: sendMail,
  };
});

const nodemailer = require('nodemailer');
const authRoutes = require('../src/routes/authRoutes');
const { sequelize, User } = require('../src/models');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);

const extractTokenFromText = (text) => {
  const match = String(text || '').match(/reset-password\?token=([a-f0-9]+)/i);
  return match?.[1] || null;
};
const extractVerificationTokenFromText = (text) => {
  const match = String(text || '').match(/verify-email\?token=([a-f0-9]+)/i);
  return match?.[1] || null;
};
const csrfHeaderFor = (token) => ({
  Cookie: [`csrf_token=${token}`],
  'x-csrf-token': token,
});
const setCsrfToken = (token, userId) => {
  const { storeCsrfToken } = require('../src/utils/csrf');
  storeCsrfToken(token, userId);
};

describe('Password reset flow', () => {
  const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    process.env.SMTP_FROM = 'Appofa <no-reply@appofasi.gr>';
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '60';

    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    await User.create({
      username: 'resetuser',
      email: 'reset@test.com',
      password: 'password123',
      role: 'viewer',
    });
  });

  beforeEach(async () => {
    nodemailer.__sendMailMock.mockReset();
    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    if (user) {
      user.password = 'password123';
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpires = null;
      user.emailVerified = false;
      user.emailVerifToken = null;
      user.emailVerifExpires = null;
      await user.save();
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('forgot-password request for existing email stores hashed token and sends email', async () => {
    nodemailer.__sendMailMock.mockResolvedValue({ messageId: 'test' });

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: genericMessage });
    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(1);

    const sent = nodemailer.__sendMailMock.mock.calls[0][0];
    expect(sent.text).toContain('reset-password?token=');
    const rawToken = extractTokenFromText(sent.text);
    expect(rawToken).toBeTruthy();

    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    expect(user.resetPasswordTokenHash).toBe(
      crypto.createHash('sha256').update(rawToken).digest('hex')
    );
    expect(user.resetPasswordExpires).toBeTruthy();
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('forgot-password request for unknown email returns the same generic response', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: genericMessage });
    expect(nodemailer.__sendMailMock).not.toHaveBeenCalled();
  });

  test('successful reset with valid token and token fields cleared after use', async () => {
    nodemailer.__sendMailMock.mockResolvedValue({ messageId: 'test' });
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });

    const rawToken = extractTokenFromText(nodemailer.__sendMailMock.mock.calls[0][0].text);
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newPassword123' });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body.success).toBe(true);

    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    expect(user.resetPasswordTokenHash).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.com', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.com', password: 'newPassword123' });
    expect(newLogin.status).toBe(200);
  });

  test('invalid token is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'newPassword123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid/i);
  });

  test('expired token is rejected', async () => {
    nodemailer.__sendMailMock.mockResolvedValue({ messageId: 'test' });
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });
    const rawToken = extractTokenFromText(nodemailer.__sendMailMock.mock.calls[0][0].text);

    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    user.resetPasswordExpires = new Date(Date.now() - 60 * 1000);
    await user.save();

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newPassword123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/expired/i);
  });

  test('only the latest token is valid', async () => {
    nodemailer.__sendMailMock.mockResolvedValue({ messageId: 'test' });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });
    const firstToken = extractTokenFromText(nodemailer.__sendMailMock.mock.calls[0][0].text);

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });
    const secondToken = extractTokenFromText(nodemailer.__sendMailMock.mock.calls[1][0].text);

    const firstTry = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: firstToken, newPassword: 'newPassword123' });
    expect(firstTry.status).toBe(400);

    const secondTry = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: secondToken, newPassword: 'newPassword123' });
    expect(secondTry.status).toBe(200);
  });

  test('forgot-password returns generic success even when SMTP send fails', async () => {
    nodemailer.__sendMailMock.mockRejectedValue(new Error('EAUTH: authentication failed'));

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: genericMessage });
    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(1);

    // Token must be cleared after SMTP failure so no orphaned reset entry lingers in the DB.
    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    expect(user.resetPasswordTokenHash).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
  });

  test('forgot-password requests are rate limited (5 per hour)', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      let response;
      for (let i = 0; i < 6; i += 1) {
        response = await request(app)
          .post('/api/auth/forgot-password')
          .set('X-Forwarded-For', '99.99.99.99')
          .send({ email: 'reset@test.com' });
      }

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/too many password reset requests/i);
      expect(typeof response.body.retryAfter).toBe('number');
      expect(typeof response.body.resetTime).toBe('number');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('reset-password attempts are rate limited', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      let response;
      for (let i = 0; i < 11; i += 1) {
        response = await request(app)
          .post('/api/auth/reset-password')
          .set('X-Forwarded-For', '88.88.88.88')
          .send({ token: 'invalid-token', newPassword: 'newPassword123' });
      }

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/too many password reset attempts/i);
      expect(typeof response.body.retryAfter).toBe('number');
      expect(typeof response.body.resetTime).toBe('number');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('verify-email succeeds with valid token', async () => {
    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    user.emailVerifToken = crypto.createHash('sha256').update('valid-verify-token').digest('hex');
    user.emailVerifExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const response = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: 'valid-verify-token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    await user.reload();
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifToken).toBeNull();
    expect(user.emailVerifExpires).toBeNull();
  });

  test('verify-email returns expiry code for expired token', async () => {
    const user = await User.findOne({ where: { email: 'reset@test.com' } });
    user.emailVerifToken = crypto.createHash('sha256').update('expired-verify-token').digest('hex');
    user.emailVerifExpires = new Date(Date.now() - 60 * 1000);
    await user.save();

    const response = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: 'expired-verify-token' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('EMAIL_VERIF_TOKEN_EXPIRED');
  });

  test('resend-verification sends a fresh email for authenticated unverified users', async () => {
    nodemailer.__sendMailMock.mockResolvedValue({ messageId: 'verify-resend' });
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.com', password: 'password123' });
    const authCookie = loginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    const authToken = authCookie.split(';')[0].replace('auth_token=', '');
    const user = await User.findOne({ where: { email: 'reset@test.com' } });

    const csrf = `csrf-resend-${Date.now()}`;
    setCsrfToken(csrf, user.id);

    const response = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${authToken}`)
      .set(csrfHeaderFor(csrf))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Verification email sent.');
    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(1);

    const sent = nodemailer.__sendMailMock.mock.calls[0][0];
    const rawToken = extractVerificationTokenFromText(sent.text);
    expect(rawToken).toBeTruthy();

    await user.reload();
    expect(user.emailVerifToken).toBe(
      crypto.createHash('sha256').update(rawToken).digest('hex')
    );
    expect(user.emailVerifExpires).toBeTruthy();
  });
});
