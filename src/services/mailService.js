'use strict';

const nodemailer = require('nodemailer');

const DEFAULT_FROM = 'Appofa <no-reply@appofasi.gr>';

let smtpTransporter = null;
let smtpConfigSignature = null;

const toBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '', 10);
  const secure = toBoolean(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missingKeys = [];
  if (!host) missingKeys.push('SMTP_HOST');
  if (!Number.isInteger(port)) missingKeys.push('SMTP_PORT');
  if (!user) missingKeys.push('SMTP_USER');
  if (!pass) missingKeys.push('SMTP_PASS');

  if (missingKeys.length > 0) {
    throw new Error(`SMTP configuration is incomplete. Missing/invalid: ${missingKeys.join(', ')}`);
  }

  return { host, port, secure, auth: { user, pass } };
}

function getSmtpTransporter() {
  const config = getSmtpConfig();
  const signature = JSON.stringify(config);
  if (smtpTransporter && smtpConfigSignature === signature) return smtpTransporter;

  smtpTransporter = nodemailer.createTransport(config);
  smtpConfigSignature = signature;
  return smtpTransporter;
}

async function sendMail({ to, subject, html, text, from = process.env.SMTP_FROM || DEFAULT_FROM, ...rest }) {
  const transporter = getSmtpTransporter();

  try {
    return await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      ...rest,
    });
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : 'Unknown SMTP error.';
    throw new Error(`Failed to send email via SMTP: ${message}`);
  }
}

function resetMailTransporterForTests() {
  smtpTransporter = null;
  smtpConfigSignature = null;
}

module.exports = {
  DEFAULT_FROM,
  getSmtpTransporter,
  resetMailTransporterForTests,
  sendMail,
};
