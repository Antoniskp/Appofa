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
const { sequelize, User, Location, LocationSection, LocationLink, Poll, PollOption, Organization, OrganizationMember, PolicyCategory, Topic, Suggestion, CivicQuestion } = require('../src/models');

async function start() {
  if (sequelize.getDialect() !== 'sqlite' || sequelize.options.storage !== ':memory:') throw new Error('E2E requires an in-memory database');
  await sequelize.sync({ force: true });
  const author = await User.create({ username: 'e2e-author', email: 'author@example.test', password: 'TestPassword123!', role: 'admin' });
  await User.create({ username: 'e2e-contributor', email: 'contributor@example.test', password: 'TestPassword123!', role: 'viewer', emailVerified: true });
  const policyOrg = await Organization.create({ name: 'Civic Policy Lab', slug: 'civic-policy-lab', type: 'party', createdByUserId: author.id });
  await Organization.create({ name: 'Community Forum', slug: 'community-forum', type: 'party', createdByUserId: author.id });
  await OrganizationMember.create({ organizationId: policyOrg.id, userId: author.id, role: 'owner' });
  await PolicyCategory.create({ name: 'Housing', slug: 'housing' });
  await Topic.create({ name: 'Public housing', slug: 'public-housing' });
  const country = await Location.create({ id: 1, name: 'Greece', slug: 'greece', code: 'GR', type: 'country' });
  const region = await Location.create({ id: 2, name: 'Attica', slug: 'attica', type: 'prefecture', parent_id: country.id });
  const town = await Location.create({ id: 3, name: 'Test Municipality', slug: 'test-municipality', type: 'municipality', parent_id: region.id,
    lat: 37.98, lng: 23.73, boundary_geojson: { type: 'Polygon', coordinates: [[[23.70, 37.96], [23.76, 37.96], [23.76, 38.00], [23.70, 38.00], [23.70, 37.96]]] } });
  await LocationSection.create({ locationId: town.id, type: 'webcams', isPublished: true, content: { webcams: [
    { label: 'Harbour camera', url: 'https://camera.example/harbour', lat: 37.991, lng: 23.751 },
    { label: 'Town square camera', url: 'https://camera.example/square', isWorking: false },
  ] } });
  await Suggestion.bulkCreate([
    { title: 'Broken light on Oak Street', body: 'The street light near the park is not working after sunset.', mapLat: 37.985, mapLng: 23.724, mapIssueType: 'broken_lighting', status: 'open' },
    { title: 'Rubbish beside the square', body: 'Waste has accumulated beside the neighbourhood square.', mapLat: 37.976, mapLng: 23.740, mapIssueType: 'trash', status: 'under_review' },
    { title: 'Pothole repaired on Pine Street', body: 'The road surface has been repaired and inspected.', mapLat: 37.982, mapLng: 23.746, mapIssueType: 'pothole', status: 'implemented' },
  ].map(issue => ({ ...issue, authorId: author.id, locationId: town.id, type: 'problem', visibility: 'public' })));
  const poll = await Poll.create({ id: 1, title: 'Improve our local park', creatorId: author.id, locationId: town.id, voteRestriction: 'anyone', visibility: 'public', status: 'active' });
  await PollOption.bulkCreate([{ id: 1, pollId: poll.id, text: 'More trees', order: 0 }, { id: 2, pollId: poll.id, text: 'More benches', order: 1 }]);
  await LocationLink.create({ location_id: town.id, entity_type: 'poll', entity_id: poll.id });
  await CivicQuestion.bulkCreate([
    { title: 'Συμφωνείτε με τις αλλαγές στην αγορά ηλεκτρικής ενέργειας και την προστασία των καταναλωτών;', category: 'Ενέργεια / Καταναλωτές', sourceStatus: 'Ψηφίστηκε — στοιχεία επίσημης πηγής', simplified: 'Αλλαγές στις συμβάσεις ηλεκτρικής ενέργειας και στην προστασία των καταναλωτών.', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { title: 'Συμφωνείτε με τις φορολογικές και κοινωνικές ρυθμίσεις για εισόδημα, αποταμίευση και επενδύσεις;', category: 'Οικονομία / Φορολογία', sourceStatus: 'Κατατέθηκε — στοιχεία επίσημης πηγής', simplified: 'Πρόταση αλλαγών στη φορολογία εισοδήματος, την αποταμίευση και τις επενδύσεις.' },
    { title: 'Συμφωνείτε με το προηγούμενο προσχέδιο προϋπολογισμού;', category: 'Οικονομία', status: 'closed', simplified: 'Προηγούμενο προσχέδιο προϋπολογισμού.' },
  ].map((topic) => ({ sourceType: 'parliament', visibility: 'public', creatorId: author.id, ...topic })));
  const server = app.listen(3100, '127.0.0.1', () => console.log('Disposable E2E API ready'));
  const close = () => server.close(() => sequelize.close().finally(() => process.exit(0)));
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
start().catch(error => { console.error(error); process.exit(1); });
