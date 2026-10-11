// A disposable backend using the real routes/services and a process-local database.
// These assignments must precede every application import, regardless of .env.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'e2e-only-local-secret-not-for-production';
process.env.FRONTEND_URL = 'http://127.0.0.1:3101';
process.env.GITHUB_CLIENT_ID = '';
process.env.GOOGLE_CLIENT_ID = '';
process.env.SMTP_HOST = '';
process.env.SMTP_PASS = '';

// Only delivery is stubbed; registration, sessions, permissions and CSRF stay real.
require('../src/services/mailService').sendMail = async () => ({ messageId: 'local-e2e' });
const app = require('../src/index');
const { sequelize, User, Location, LocationLink, Poll, PollOption } = require('../src/models');

async function start() {
  if (sequelize.getDialect() !== 'sqlite' || sequelize.options.storage !== ':memory:') throw new Error('E2E requires an in-memory database');
  await sequelize.sync({ force: true });
  const author = await User.create({ username: 'e2e-author', email: 'author@example.test', password: 'TestPassword123!', role: 'admin' });
  const country = await Location.create({ id: 1, name: 'Greece', slug: 'greece', code: 'GR', type: 'country' });
  const region = await Location.create({ id: 2, name: 'Attica', slug: 'attica', type: 'prefecture', parent_id: country.id });
  const town = await Location.create({ id: 3, name: 'Test Municipality', slug: 'test-municipality', type: 'municipality', parent_id: region.id });
  const poll = await Poll.create({ id: 1, title: 'Improve our local park', creatorId: author.id, locationId: town.id, voteRestriction: 'anyone', visibility: 'public', status: 'active' });
  await PollOption.bulkCreate([{ id: 1, pollId: poll.id, text: 'More trees', order: 0 }, { id: 2, pollId: poll.id, text: 'More benches', order: 1 }]);
  await LocationLink.create({ location_id: town.id, entity_type: 'poll', entity_id: poll.id });
  const server = app.listen(3100, '127.0.0.1', () => console.log('Disposable E2E API ready'));
  const close = () => server.close(() => sequelize.close().finally(() => process.exit(0)));
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
start().catch(error => { console.error(error); process.exit(1); });
