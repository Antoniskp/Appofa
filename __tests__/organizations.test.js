const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, OrganizationMember, OrganizationAnalytics } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Organizations API', () => {
  let adminUser;
  let adminToken;
  let viewerUser;
  let viewerToken;
  let secondViewerUser;
  let secondViewerToken;
  let testLocation;

  const withCsrf = (userId, authToken, csrfToken) => {
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`auth_token=${authToken}`, `csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  const registerAndLogin = async (username, role = 'viewer') => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!',
      });

    const user = await User.findOne({ where: { username } });
    if (role !== 'viewer') {
      await user.update({ role });
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: `${username}@test.com`, password: 'Test1234!' });

    const authCookie = loginRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('auth_token='));

    return {
      user: await User.findByPk(user.id),
      token: authCookie.split(';')[0].replace('auth_token=', ''),
    };
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    ({ user: adminUser, token: adminToken } = await registerAndLogin('organizations_admin', 'admin'));
    ({ user: viewerUser, token: viewerToken } = await registerAndLogin('organizations_viewer', 'viewer'));
    ({ user: secondViewerUser, token: secondViewerToken } = await registerAndLogin('organizations_viewer_second', 'viewer'));

    testLocation = await Location.create({
      name: 'Organizations Test Location',
      slug: 'organizations-test-location',
      type: 'municipality',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates organizations with unique slugs and owner membership', async () => {
    const createOne = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-1'))
      .send({
        name: 'Open Civic Lab',
        type: 'organization',
        description: 'First organization',
        locationId: testLocation.id,
      });

    expect(createOne.status).toBe(201);
    expect(createOne.body.success).toBe(true);
    expect(createOne.body.data.organization.slug).toBe('open-civic-lab');

    const members = await OrganizationMember.findAll({
      where: { organizationId: createOne.body.data.organization.id },
    });
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(adminUser.id);
    expect(members[0].role).toBe('owner');

    const createTwo = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-2'))
      .send({
        name: 'Open Civic Lab',
        type: 'organization',
      });

    expect(createTwo.status).toBe(201);
    expect(createTwo.body.data.organization.slug).toBe('open-civic-lab-2');
  });

  it('lists and fetches organizations by slug', async () => {
    const listRes = await request(app)
      .get('/api/organizations')
      .query({ search: 'Civic', type: 'organization' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.organizations)).toBe(true);
    expect(listRes.body.data.organizations.length).toBeGreaterThan(0);

    const first = listRes.body.data.organizations[0];
    const singleRes = await request(app).get(`/api/organizations/${first.slug}`);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.success).toBe(true);
    expect(singleRes.body.data.organization.createdBy).toBeDefined();
  });

  it('enforces private members endpoint visibility', async () => {
    const privateCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-private'))
      .send({
        name: 'Private Member Club',
        type: 'organization',
        isPublic: false,
      });

    expect(privateCreate.status).toBe(201);
    const privateOrgId = privateCreate.body.data.organization.id;

    const guestMembers = await request(app).get(`/api/organizations/${privateOrgId}/members`);
    expect(guestMembers.status).toBe(403);
    expect(guestMembers.body.success).toBe(false);

    const viewerMembersDenied = await request(app)
      .get(`/api/organizations/${privateOrgId}/members`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(viewerMembersDenied.status).toBe(403);

    await OrganizationMember.create({
      organizationId: privateOrgId,
      userId: viewerUser.id,
      role: 'member',
      status: 'active',
    });

    const viewerMembersAllowed = await request(app)
      .get(`/api/organizations/${privateOrgId}/members`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(viewerMembersAllowed.status).toBe(200);
    expect(viewerMembersAllowed.body.success).toBe(true);
    expect(Array.isArray(viewerMembersAllowed.body.data.members)).toBe(true);
  });

  it('allows admin delete', async () => {
    const createRes = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-delete'))
      .send({
        name: 'Delete Me Organization',
        type: 'organization',
      });

    const deleteRes = await request(app)
      .delete(`/api/organizations/${createRes.body.data.organization.id}`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-delete'));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it('handles join and leave flows with proper restrictions', async () => {
    const publicOrgCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-public-join'))
      .send({
        name: 'Public Membership Organization',
        type: 'organization',
        isPublic: true,
      });

    expect(publicOrgCreate.status).toBe(201);
    const publicOrgId = publicOrgCreate.body.data.organization.id;

    const joinPublic = await request(app)
      .post(`/api/organizations/${publicOrgId}/join`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-join-public'));

    expect(joinPublic.status).toBe(201);
    expect(joinPublic.body.data.membership.status).toBe('active');

    const duplicateJoin = await request(app)
      .post(`/api/organizations/${publicOrgId}/join`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-join-public-duplicate'));
    expect(duplicateJoin.status).toBe(409);

    const leaveRes = await request(app)
      .delete(`/api/organizations/${publicOrgId}/leave`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-leave-public'));
    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.success).toBe(true);

    const ownerLeaveRes = await request(app)
      .delete(`/api/organizations/${publicOrgId}/leave`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-owner-leave-public'));
    expect(ownerLeaveRes.status).toBe(403);

    const privateOrgCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-private-join'))
      .send({
        name: 'Private Membership Organization',
        type: 'organization',
        isPublic: false,
      });

    expect(privateOrgCreate.status).toBe(201);
    const privateOrgId = privateOrgCreate.body.data.organization.id;

    const joinPrivate = await request(app)
      .post(`/api/organizations/${privateOrgId}/join`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-join-private'));
    expect(joinPrivate.status).toBe(201);
    expect(joinPrivate.body.data.membership.status).toBe('pending');
  });

  it('supports member management endpoints for org owner/admin', async () => {
    const createRes = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-manage'))
      .send({
        name: 'Managed Organization',
        type: 'organization',
        isPublic: false,
      });

    expect(createRes.status).toBe(201);
    const organizationId = createRes.body.data.organization.id;

    const viewerJoinPending = await request(app)
      .post(`/api/organizations/${organizationId}/join`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-manage-join-pending'));
    expect(viewerJoinPending.status).toBe(201);
    expect(viewerJoinPending.body.data.membership.status).toBe('pending');

    const pendingByOwner = await request(app)
      .get(`/api/organizations/${organizationId}/members/pending`)
      .set('Cookie', `auth_token=${adminToken}`);
    expect(pendingByOwner.status).toBe(200);
    expect(pendingByOwner.body.success).toBe(true);
    expect(pendingByOwner.body.data.members.some((member) => member.userId === viewerUser.id)).toBe(true);

    const pendingDeniedForViewer = await request(app)
      .get(`/api/organizations/${organizationId}/members/pending`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(pendingDeniedForViewer.status).toBe(403);

    const approvePending = await request(app)
      .patch(`/api/organizations/${organizationId}/members/${viewerUser.id}/approve`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-approve-pending'));
    expect(approvePending.status).toBe(200);
    expect(approvePending.body.data.membership.status).toBe('active');

    const inviteRes = await request(app)
      .post(`/api/organizations/${organizationId}/members/invite`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-invite-member'))
      .send({ userId: secondViewerUser.id });
    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.membership.status).toBe('invited');
    expect(inviteRes.body.data.membership.invitedByUserId).toBe(adminUser.id);
    expect(inviteRes.body.data.membership.inviteToken).toBeTruthy();

    const roleUpdate = await request(app)
      .patch(`/api/organizations/${organizationId}/members/${viewerUser.id}/role`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-update-role'))
      .send({ role: 'admin' });
    expect(roleUpdate.status).toBe(200);
    expect(roleUpdate.body.data.membership.role).toBe('admin');

    const removeInvited = await request(app)
      .delete(`/api/organizations/${organizationId}/members/${secondViewerUser.id}`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-remove-member'));
    expect(removeInvited.status).toBe(200);
    expect(removeInvited.body.data.removed).toBe(true);

    const removeOwnerDenied = await request(app)
      .delete(`/api/organizations/${organizationId}/members/${adminUser.id}`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-remove-owner'));
    expect(removeOwnerDenied.status).toBe(403);

    const inviteDeniedForNonManager = await request(app)
      .post(`/api/organizations/${organizationId}/members/invite`)
      .set(withCsrf(secondViewerUser.id, secondViewerToken, 'csrf-org-invite-denied'))
      .send({ userId: secondViewerUser.id });
    expect(inviteDeniedForNonManager.status).toBe(403);
  });

  it('supports organization polls and suggestions with membership visibility rules', async () => {
    const createOrg = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase3'))
      .send({
        name: 'Phase Three Organization',
        type: 'organization',
        isPublic: true,
      });

    expect(createOrg.status).toBe(201);
    const organizationId = createOrg.body.data.organization.id;

    const nonMemberCreatePoll = await request(app)
      .post(`/api/organizations/${organizationId}/polls`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-create-poll-denied'))
      .send({
        title: 'Internal Poll',
      });
    expect(nonMemberCreatePoll.status).toBe(403);

    const ownerCreatePoll = await request(app)
      .post(`/api/organizations/${organizationId}/polls`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-poll-ok'))
      .send({
        title: 'Internal Poll',
        description: 'Members-only poll body',
      });
    expect(ownerCreatePoll.status).toBe(201);
    expect(ownerCreatePoll.body.data.poll.visibility).toBe('members_only');

    const ownerCreatePublicPoll = await request(app)
      .post(`/api/organizations/${organizationId}/polls`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-public-poll-ok'))
      .send({
        title: 'Public Poll',
        visibility: 'public',
      });
    expect(ownerCreatePublicPoll.status).toBe(201);
    expect(ownerCreatePublicPoll.body.data.poll.visibility).toBe('public');

    const guestPolls = await request(app).get(`/api/organizations/${organizationId}/polls`);
    expect(guestPolls.status).toBe(200);
    expect(guestPolls.body.success).toBe(true);
    expect(guestPolls.body.data.polls).toHaveLength(1);
    expect(guestPolls.body.data.polls[0].visibility).toBe('public');

    const memberPolls = await request(app)
      .get(`/api/organizations/${organizationId}/polls`)
      .set('Cookie', `auth_token=${adminToken}`);
    expect(memberPolls.status).toBe(200);
    expect(memberPolls.body.data.polls.length).toBeGreaterThanOrEqual(2);

    const nonMemberCreateSuggestion = await request(app)
      .post(`/api/organizations/${organizationId}/suggestions`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-create-suggestion-denied'))
      .send({
        title: 'Proposal',
        body: 'This proposal body is long enough.',
      });
    expect(nonMemberCreateSuggestion.status).toBe(403);

    const ownerCreateSuggestion = await request(app)
      .post(`/api/organizations/${organizationId}/suggestions`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-suggestion-ok'))
      .send({
        title: 'Members proposal',
        body: 'This proposal body is definitely long enough.',
      });
    expect(ownerCreateSuggestion.status).toBe(201);
    expect(ownerCreateSuggestion.body.data.suggestion.visibility).toBe('members_only');

    const ownerCreatePublicSuggestion = await request(app)
      .post(`/api/organizations/${organizationId}/suggestions`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-public-suggestion-ok'))
      .send({
        title: 'Public proposal',
        body: 'This public proposal body is long enough.',
        visibility: 'public',
      });
    expect(ownerCreatePublicSuggestion.status).toBe(201);
    expect(ownerCreatePublicSuggestion.body.data.suggestion.visibility).toBe('public');

    const guestSuggestions = await request(app).get(`/api/organizations/${organizationId}/suggestions`);
    expect(guestSuggestions.status).toBe(200);
    expect(guestSuggestions.body.success).toBe(true);
    expect(guestSuggestions.body.data.suggestions).toHaveLength(1);
    expect(guestSuggestions.body.data.suggestions[0].visibility).toBe('public');

    const privateOrg = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase3-private'))
      .send({
        name: 'Phase Three Private Organization',
        type: 'organization',
        isPublic: false,
      });
    expect(privateOrg.status).toBe(201);

    const privateOrgId = privateOrg.body.data.organization.id;
    const privatePollsDenied = await request(app).get(`/api/organizations/${privateOrgId}/polls`);
    expect(privatePollsDenied.status).toBe(403);

    const privateSuggestionsDenied = await request(app).get(`/api/organizations/${privateOrgId}/suggestions`);
    expect(privateSuggestionsDenied.status).toBe(403);
  });

  it('supports official posts, verification endpoints, and public official feed', async () => {
    const createParty = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase4-party'))
      .send({
        name: 'Phase Four Party',
        type: 'party',
        isPublic: true,
      });
    expect(createParty.status).toBe(201);
    const partyOrganizationId = createParty.body.data.organization.id;

    const nonManagerOfficialCreateDenied = await request(app)
      .post(`/api/organizations/${partyOrganizationId}/official-posts`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-create-official-denied'))
      .send({
        contentType: 'suggestion',
        title: 'Official proposal',
        body: 'This official proposal body is long enough.',
      });
    expect(nonManagerOfficialCreateDenied.status).toBe(403);

    const ownerCreatesOfficialSuggestion = await request(app)
      .post(`/api/organizations/${partyOrganizationId}/official-posts`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-official-suggestion'))
      .send({
        contentType: 'suggestion',
        title: 'Official party proposal',
        body: 'This official proposal body is definitely long enough.',
      });
    expect(ownerCreatesOfficialSuggestion.status).toBe(201);
    expect(ownerCreatesOfficialSuggestion.body.success).toBe(true);
    expect(ownerCreatesOfficialSuggestion.body.data.officialPost.isOfficialPost).toBe(true);
    expect(ownerCreatesOfficialSuggestion.body.data.officialPost.contentType).toBe('suggestion');

    const ownerCreatesOfficialPoll = await request(app)
      .post(`/api/organizations/${partyOrganizationId}/official-posts`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-official-poll'))
      .send({
        contentType: 'poll',
        title: 'Official party poll',
        body: 'Official poll description.',
      });
    expect(ownerCreatesOfficialPoll.status).toBe(201);
    expect(ownerCreatesOfficialPoll.body.data.officialPost.contentType).toBe('poll');

    const partyOfficialPosts = await request(app).get(`/api/organizations/${partyOrganizationId}/official-posts`);
    expect(partyOfficialPosts.status).toBe(200);
    expect(Array.isArray(partyOfficialPosts.body.data.officialPosts)).toBe(true);
    expect(partyOfficialPosts.body.data.officialPosts.length).toBe(2);

    const publicOfficialFeed = await request(app).get('/api/official-posts');
    expect(publicOfficialFeed.status).toBe(200);
    expect(publicOfficialFeed.body.success).toBe(true);
    expect(
      publicOfficialFeed.body.data.officialPosts.some((post) => post.organizationId === partyOrganizationId)
    ).toBe(true);

    const verificationStatus = await request(app).get(`/api/organizations/${partyOrganizationId}/verification`);
    expect(verificationStatus.status).toBe(200);
    expect(verificationStatus.body.data.isVerified).toBe(false);

    const viewerSetVerifiedDenied = await request(app)
      .patch(`/api/organizations/${partyOrganizationId}/verify`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-org-verify-denied'))
      .send({ isVerified: true });
    expect(viewerSetVerifiedDenied.status).toBe(403);

    const adminSetVerified = await request(app)
      .patch(`/api/organizations/${partyOrganizationId}/verify`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-verify-ok'))
      .send({ isVerified: true });
    expect(adminSetVerified.status).toBe(200);
    expect(adminSetVerified.body.data.organization.isVerified).toBe(true);

    const createRegularOrg = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase4-regular'))
      .send({
        name: 'Regular Civic Group',
        type: 'organization',
      });
    expect(createRegularOrg.status).toBe(201);

    const regularOrgOfficialPostDenied = await request(app)
      .post(`/api/organizations/${createRegularOrg.body.data.organization.id}/official-posts`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-official-regular-denied'))
      .send({
        contentType: 'suggestion',
        title: 'Should fail',
        body: 'This should fail because organization type is unsupported.',
      });
    expect(regularOrgOfficialPostDenied.status).toBe(400);
  });

  it('supports hierarchy endpoints and analytics access rules', async () => {
    const parentCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase5-parent'))
      .send({
        name: 'Phase Five Parent',
        type: 'organization',
        isPublic: true,
      });
    expect(parentCreate.status).toBe(201);
    const parentId = parentCreate.body.data.organization.id;

    const childCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-phase5-child'))
      .send({
        name: 'Phase Five Child',
        type: 'organization',
        isPublic: true,
      });
    expect(childCreate.status).toBe(201);
    const childId = childCreate.body.data.organization.id;

    const setParentRes = await request(app)
      .patch(`/api/organizations/${childId}/parent`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-set-parent'))
      .send({ parentId });
    expect(setParentRes.status).toBe(200);
    expect(setParentRes.body.data.organization.parentId).toBe(parentId);

    const getChildrenRes = await request(app).get(`/api/organizations/${parentId}/children`);
    expect(getChildrenRes.status).toBe(200);
    expect(getChildrenRes.body.success).toBe(true);
    expect(getChildrenRes.body.data.organizations.some((org) => org.id === childId)).toBe(true);

    const cycleDenied = await request(app)
      .patch(`/api/organizations/${parentId}/parent`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-set-parent-cycle'))
      .send({ parentId: childId });
    expect(cycleDenied.status).toBe(400);

    const clearParentRes = await request(app)
      .patch(`/api/organizations/${childId}/parent`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-clear-parent'))
      .send({ parentId: null });
    expect(clearParentRes.status).toBe(200);
    expect(clearParentRes.body.data.organization.parentId).toBeNull();

    await OrganizationMember.create({
      organizationId: parentId,
      userId: viewerUser.id,
      role: 'admin',
      status: 'active',
    });

    const createPollRes = await request(app)
      .post(`/api/organizations/${parentId}/polls`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-phase5-poll'))
      .send({
        title: 'Phase Five Poll',
        visibility: 'public',
      });
    expect(createPollRes.status).toBe(201);

    const createOfficialRes = await request(app)
      .post(`/api/organizations/${parentId}/official-posts`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-phase5-official'))
      .send({
        contentType: 'suggestion',
        title: 'Phase Five Official',
        body: 'This official proposal body is long enough for analytics.',
      });
    expect(createOfficialRes.status).toBe(400);

    const createSuggestionRes = await request(app)
      .post(`/api/organizations/${parentId}/suggestions`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-phase5-suggestion'))
      .send({
        title: 'Phase Five Suggestion',
        body: 'This suggestion body is long enough for analytics counters.',
        visibility: 'public',
      });
    expect(createSuggestionRes.status).toBe(201);

    const analyticsDeniedForViewer = await request(app)
      .get(`/api/organizations/${parentId}/analytics`)
      .set('Cookie', `auth_token=${secondViewerToken}`);
    expect(analyticsDeniedForViewer.status).toBe(403);

    const analyticsAllowedForOrgAdmin = await request(app)
      .get(`/api/organizations/${parentId}/analytics`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(analyticsAllowedForOrgAdmin.status).toBe(200);
    expect(Array.isArray(analyticsAllowedForOrgAdmin.body.data.analytics)).toBe(true);
    expect(analyticsAllowedForOrgAdmin.body.data.analytics.length).toBeGreaterThan(0);
    expect(analyticsAllowedForOrgAdmin.body.data.analytics[0].organizationId).toBe(parentId);

    const analyticsRow = await OrganizationAnalytics.findOne({
      where: { organizationId: parentId },
      order: [['date', 'DESC']],
    });
    expect(analyticsRow).toBeTruthy();
    expect(analyticsRow.pollCount).toBeGreaterThanOrEqual(1);
    expect(analyticsRow.suggestionCount).toBeGreaterThanOrEqual(1);
  });
});
