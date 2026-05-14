const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { WorkerToken } = require('../models');

const TOKEN_MIN_LENGTH = 24;
const TOKEN_MAX_LENGTH = 255;
const TOKEN_FORMAT_REGEX = /^[\x21-\x7E]+$/;
const GENERATED_TOKEN_PREFIX = 'appofa_wt_';

const isValidWorkerTokenFormat = (token) => (
  typeof token === 'string'
  && token.length >= TOKEN_MIN_LENGTH
  && token.length <= TOKEN_MAX_LENGTH
  && TOKEN_FORMAT_REGEX.test(token)
);

const serializeTokenMetadata = (tokenRecord) => ({
  id: tokenRecord.id,
  name: tokenRecord.name,
  created_at: tokenRecord.created_at,
  last_used_at: tokenRecord.last_used_at,
  revoked_at: tokenRecord.revoked_at,
  created_by: tokenRecord.created_by,
});

const generatePlaintextToken = () => `${GENERATED_TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;

const createWorkerToken = async ({ name, createdBy }) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || trimmedName.length > 120) {
    throw new Error('Token name is required and must be 120 characters or fewer.');
  }
  if (!Number.isInteger(createdBy)) {
    throw new Error('A valid admin user id is required.');
  }

  const plaintextToken = generatePlaintextToken();
  if (!isValidWorkerTokenFormat(plaintextToken)) {
    throw new Error('Generated worker token has invalid format.');
  }

  const token_hash = await bcrypt.hash(plaintextToken, 12);
  const createdToken = await WorkerToken.create({
    name: trimmedName,
    token_hash,
    created_by: createdBy,
  });

  return {
    token: plaintextToken,
    metadata: serializeTokenMetadata(createdToken),
  };
};

const listWorkerTokens = async () => {
  const tokens = await WorkerToken.findAll({
    attributes: ['id', 'name', 'created_at', 'last_used_at', 'revoked_at', 'created_by'],
    order: [['created_at', 'DESC']],
  });
  return tokens.map(serializeTokenMetadata);
};

const revokeWorkerToken = async (id) => {
  const token = await WorkerToken.findByPk(id);
  if (!token) return null;
  if (!token.revoked_at) {
    token.revoked_at = new Date();
    await token.save();
  }
  return serializeTokenMetadata(token);
};

const validateWorkerToken = async (plaintextToken) => {
  if (!isValidWorkerTokenFormat(plaintextToken)) {
    return { valid: false, reason: 'invalid_format' };
  }

  const activeTokens = await WorkerToken.findAll({
    where: {
      revoked_at: { [Op.is]: null },
    },
    attributes: ['id', 'token_hash'],
  });

  for (const tokenRecord of activeTokens) {
    const isMatch = await bcrypt.compare(plaintextToken, tokenRecord.token_hash);
    if (isMatch) {
      await WorkerToken.update(
        { last_used_at: new Date() },
        { where: { id: tokenRecord.id } }
      );
      return { valid: true, source: 'database', tokenId: tokenRecord.id };
    }
  }

  return { valid: false, reason: 'not_found' };
};

module.exports = {
  isValidWorkerTokenFormat,
  createWorkerToken,
  listWorkerTokens,
  revokeWorkerToken,
  validateWorkerToken,
};
