const authRoutes = require('./authRoutes');
const articleRoutes = require('./articleRoutes');
const adminRoutes = require('./adminRoutes');
const locationRoutes = require('./locationRoutes');
const pollRoutes = require('./pollRoutes');
const bookmarkRoutes = require('./bookmarkRoutes');
const messageRoutes = require('./messageRoutes');
const statsRoutes = require('./statsRoutes');
const followRoutes = require('./followRoutes');
const tagRoutes = require('./tagRoutes');
const commentRoutes = require('./commentRoutes');
const endorsementRoutes = require('./endorsementRoutes');
const suggestionRoutes = require('./suggestionRoutes');
const solutionRoutes = require('./solutionRoutes');
const linkPreviewRoutes = require('./linkPreviewRoutes');
const personRoutes = require('./personRoutes');
const personRemovalRequestRoutes = require('./personRemovalRequestRoutes');
const reportRoutes = require('./reportRoutes');
const dreamTeamRoutes = require('./dreamTeamRoutes');

const routes = [
  { prefix: '/api/auth', router: authRoutes },
  { prefix: '/api/articles', router: articleRoutes },
  { prefix: '/api/admin', router: adminRoutes },
  { prefix: '/api/locations', router: locationRoutes },
  { prefix: '/api/polls', router: pollRoutes },
  { prefix: '/api/bookmarks', router: bookmarkRoutes },
  { prefix: '/api/messages', router: messageRoutes },
  { prefix: '/api/stats', router: statsRoutes },
  { prefix: '/api/users', router: followRoutes },
  { prefix: '/api/tags', router: tagRoutes },
  { prefix: '/api/comments', router: commentRoutes },
  { prefix: '/api/endorsements', router: endorsementRoutes },
  { prefix: '/api/suggestions', router: suggestionRoutes },
  { prefix: '/api/solutions', router: solutionRoutes },
  { prefix: '/api/link-preview', router: linkPreviewRoutes },
  { prefix: '/api/persons', router: personRoutes },
  { prefix: '/api/candidates', router: personRoutes },
  { prefix: '/api/person-removal-requests', router: personRemovalRequestRoutes },
  { prefix: '/api/reports', router: reportRoutes },
  { prefix: '/api/dream-team', router: dreamTeamRoutes },
];

function registerRoutes(app) {
  routes.forEach(({ prefix, router }) => app.use(prefix, router));
}

module.exports = registerRoutes;
