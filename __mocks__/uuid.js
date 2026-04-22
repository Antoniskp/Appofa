const { randomUUID } = require('crypto');

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validate = (value) => UUID_REGEX.test(value);
const version = (value) => {
  if (!validate(value)) return 0;
  return Number.parseInt(value[14], 16);
};

const v1 = () => randomUUID();
const v3 = () => randomUUID();
const v4 = () => randomUUID();
const v5 = () => randomUUID();
const v6 = () => randomUUID();
const v7 = () => randomUUID();
const v1ToV6 = (value) => value;
const v6ToV1 = (value) => value;

const parse = (value) => {
  if (!validate(value)) throw new TypeError('Invalid UUID');
  const clean = value.replace(/-/g, '');
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const stringify = (arr, offset = 0) => {
  if (!arr || arr.length < offset + 16) {
    throw new TypeError('UUID byte array is out of bounds');
  }
  const hex = Array.from(arr.slice(offset, offset + 16), (n) => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

module.exports = {
  MAX,
  NIL,
  parse,
  stringify,
  v1,
  v1ToV6,
  v3,
  v4,
  v5,
  v6,
  v6ToV1,
  v7,
  validate,
  version,
};
