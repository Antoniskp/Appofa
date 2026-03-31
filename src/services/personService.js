const crypto = require('crypto');
const { Op } = require('sequelize');
const { PublicPersonProfile, CandidateApplication, User, Location } = require('../models');

const CLAIM_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

// ─── Slug utilities ──────────────────────────────────────────────────────────

function generateSlug(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`;
  return fullName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function ensureUniqueSlug(base) {
  const existing = await PublicPersonProfile.findOne({ where: { slug: base } });
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const candidate = `${base}-${counter}`;
    const conflict = await PublicPersonProfile.findOne({ where: { slug: candidate } });
    if (!conflict) return candidate;
    counter++;
  }
}

// ─── Attribute helpers ───────────────────────────────────────────────────────

const PROFILE_INCLUDE = [
  { model: Location, as: 'location', attributes: ['id', 'name', 'slug'] },
  { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] },
  {
    model: User,
    as: 'claimedBy',
    attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
    required: false
  }
];

const SAFE_USER_ATTRS = ['id', 'username', 'firstName', 'lastName', 'avatar', 'email', 'role'];

// ─── Public ──────────────────────────────────────────────────────────────────

async function getCandidates({ page = 1, limit = 12, constituencyId, search, claimStatus, position, activeOnly } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (constituencyId) where.constituencyId = parseInt(constituencyId, 10);
  if (claimStatus) where.claimStatus = claimStatus;
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } }
    ];
  }
  if (activeOnly === 'true') where.isActiveCandidate = true;

  const { count, rows } = await PublicPersonProfile.findAndCountAll({
    where,
    include: PROFILE_INCLUDE,
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return {
    profiles: rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getCandidateBySlug(slug) {
  const profile = await PublicPersonProfile.findOne({
    where: { slug },
    include: PROFILE_INCLUDE
  });
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  return profile;
}

async function getCandidateById(id) {
  const profile = await PublicPersonProfile.findByPk(id, {
    include: [
      ...PROFILE_INCLUDE,
      { model: User, as: 'appointedBy', attributes: ['id', 'username', 'firstName', 'lastName'], required: false }
    ]
  });
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  return profile;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

async function appointAsCandidate(moderatorUserId, moderatorRole, candidateProfileId, data) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can appoint candidates.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');

  if (!data.position || !['mayor', 'prefect', 'parliamentary'].includes(data.position)) {
    throw new ServiceError(400, 'A valid position is required (mayor, prefect, or parliamentary).');
  }

  const updates = {
    isActiveCandidate: true,
    appointedAt: new Date(),
    appointedByUserId: moderatorUserId,
    position: data.position,
    retiredAt: null
  };
  if (data.constituencyId !== undefined) updates.constituencyId = data.constituencyId || null;

  await profile.update(updates);
  return profile;
}

async function retireCandidate(moderatorUserId, moderatorRole, candidateProfileId) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can retire candidates.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  if (!profile.isActiveCandidate) throw new ServiceError(400, 'Profile is not an active candidate.');

  await profile.update({ isActiveCandidate: false, retiredAt: new Date() });
  return profile;
}

// ─── Path A — User Application ───────────────────────────────────────────────

async function submitApplication(applicantUserId, data) {
  const { firstName, lastName, locationId, supportingStatement, constituencyId, bio, contactEmail, socialLinks, politicalPositions, manifesto, position } = data;

  if (!firstName || !firstName.trim()) throw new ServiceError(400, 'First name is required.');
  if (!lastName || !lastName.trim()) throw new ServiceError(400, 'Last name is required.');
  if (!supportingStatement || !supportingStatement.trim()) throw new ServiceError(400, 'Supporting statement is required.');

  const existing = await CandidateApplication.findOne({
    where: {
      applicantUserId,
      status: { [Op.in]: ['pending', 'approved'] }
    }
  });
  if (existing) throw new ServiceError(409, 'You already have a pending or approved application.');

  const application = await CandidateApplication.create({
    applicantUserId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    locationId: locationId || null,
    supportingStatement: supportingStatement.trim(),
    constituencyId: constituencyId || null,
    bio: bio || null,
    contactEmail: contactEmail || null,
    socialLinks: socialLinks || null,
    politicalPositions: politicalPositions || null,
    manifesto: manifesto || null,
    position: position || null,
    status: 'pending'
  });

  return application;
}

async function getMyApplication(userId) {
  const application = await CandidateApplication.findOne({
    where: { applicantUserId: userId },
    order: [['createdAt', 'DESC']],
    include: [
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] },
      { model: PublicPersonProfile, as: 'publicPersonProfile', attributes: ['id', 'slug', 'firstName', 'lastName'] }
    ]
  });
  if (!application) throw new ServiceError(404, 'No application found.');
  return application;
}

async function approveApplication(moderatorUserId, moderatorRole, applicationId) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can approve applications.');
  }

  const application = await CandidateApplication.findByPk(applicationId, {
    include: [{ model: User, as: 'applicant', attributes: SAFE_USER_ATTRS }]
  });
  if (!application) throw new ServiceError(404, 'Application not found.');
  if (application.status !== 'pending') throw new ServiceError(400, 'Application is not pending.');

  const base = generateSlug(application.firstName, application.lastName);
  const slug = await ensureUniqueSlug(base);

  const profile = await PublicPersonProfile.create({
    slug,
    firstName: application.firstName,
    lastName: application.lastName,
    locationId: application.locationId || null,
    constituencyId: application.constituencyId || null,
    bio: application.bio || null,
    contactEmail: application.contactEmail || null,
    socialLinks: application.socialLinks || null,
    politicalPositions: application.politicalPositions || null,
    manifesto: application.manifesto || null,
    position: application.position || null,
    claimStatus: 'claimed',
    claimedByUserId: application.applicantUserId,
    claimVerifiedAt: new Date(),
    claimVerifiedByUserId: moderatorUserId,
    createdByUserId: moderatorUserId,
    source: 'application'
  });

  await application.update({
    status: 'approved',
    reviewedByUserId: moderatorUserId,
    reviewedAt: new Date(),
    publicPersonProfileId: profile.id
  });

  await User.update({ role: 'candidate' }, { where: { id: application.applicantUserId } });

  return { application, profile };
}

async function rejectApplication(moderatorUserId, moderatorRole, applicationId, rejectionReason) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can reject applications.');
  }

  const application = await CandidateApplication.findByPk(applicationId);
  if (!application) throw new ServiceError(404, 'Application not found.');
  if (application.status !== 'pending') throw new ServiceError(400, 'Application is not pending.');

  await application.update({
    status: 'rejected',
    reviewedByUserId: moderatorUserId,
    reviewedAt: new Date(),
    rejectionReason: rejectionReason || null
  });

  return application;
}

// ─── Path B — Moderator Creates / Claim Flow ─────────────────────────────────

async function createProfile(moderatorUserId, moderatorRole, data) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can create candidate profiles.');
  }

  const { firstName, lastName, locationId, constituencyId, bio, photo, contactEmail, socialLinks, politicalPositions, manifesto, position } = data;
  if (!firstName || !firstName.trim()) throw new ServiceError(400, 'First name is required.');
  if (!lastName || !lastName.trim()) throw new ServiceError(400, 'Last name is required.');

  const base = generateSlug(firstName.trim(), lastName.trim());
  const slug = await ensureUniqueSlug(base);

  const profile = await PublicPersonProfile.create({
    slug,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    locationId: locationId || null,
    constituencyId: constituencyId || null,
    bio: bio || null,
    photo: photo || null,
    contactEmail: contactEmail || null,
    socialLinks: socialLinks || null,
    politicalPositions: politicalPositions || null,
    manifesto: manifesto || null,
    position: position || null,
    claimStatus: 'unclaimed',
    createdByUserId: moderatorUserId,
    source: 'moderator'
  });

  return profile;
}

async function submitClaim(userId, candidateProfileId, supportingStatement) {
  if (!supportingStatement || !supportingStatement.trim()) {
    throw new ServiceError(400, 'Supporting statement is required.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  if (profile.claimStatus === 'claimed') throw new ServiceError(400, 'This profile has already been claimed.');
  if (profile.claimStatus === 'pending') throw new ServiceError(409, 'A claim is already pending for this profile.');

  const claimToken = crypto.randomBytes(32).toString('hex');
  const claimTokenExpiresAt = new Date(Date.now() + CLAIM_TOKEN_EXPIRY_MS);

  await profile.update({
    claimStatus: 'pending',
    claimedByUserId: userId,
    claimRequestedAt: new Date(),
    claimToken,
    claimTokenExpiresAt
  });

  return profile;
}

async function approveClaim(moderatorUserId, moderatorRole, candidateProfileId) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can approve claims.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  if (profile.claimStatus !== 'pending') throw new ServiceError(400, 'No pending claim for this profile.');

  await profile.update({
    claimStatus: 'claimed',
    claimVerifiedAt: new Date(),
    claimVerifiedByUserId: moderatorUserId,
    claimToken: null,
    claimTokenExpiresAt: null
  });

  await User.update({ role: 'candidate' }, { where: { id: profile.claimedByUserId } });

  return profile;
}

async function rejectClaim(moderatorUserId, moderatorRole, candidateProfileId, reason) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can reject claims.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');
  if (profile.claimStatus !== 'pending') throw new ServiceError(400, 'No pending claim for this profile.');

  await profile.update({
    claimStatus: 'rejected',
    claimedByUserId: null,
    claimRequestedAt: null,
    claimToken: null,
    claimTokenExpiresAt: null
  });

  return profile;
}

async function updateProfile(requestingUserId, requestingRole, candidateProfileId, data) {
  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');

  const isOwner = profile.claimedByUserId === requestingUserId;
  const isModerator = ['admin', 'moderator'].includes(requestingRole);

  if (!isOwner && !isModerator) {
    throw new ServiceError(403, 'You do not have permission to update this profile.');
  }

  const allowedFields = ['firstName', 'lastName', 'locationId', 'bio', 'photo', 'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto', 'position'];
  if (isModerator) allowedFields.push('constituencyId', 'claimStatus', 'slug', 'isActiveCandidate');

  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  if (isModerator && data.isActiveCandidate === false) {
    updates.retiredAt = new Date();
  } else if (isModerator && data.isActiveCandidate === true) {
    updates.retiredAt = null;
  }

  await profile.update(updates);
  return profile;
}

async function deleteProfile(requestingUserId, requestingRole, candidateProfileId) {
  if (requestingRole !== 'admin') {
    throw new ServiceError(403, 'Only admins can delete candidate profiles.');
  }

  const profile = await PublicPersonProfile.findByPk(candidateProfileId);
  if (!profile) throw new ServiceError(404, 'Candidate profile not found.');

  await profile.destroy();
  return { deleted: true };
}

// ─── Moderator Review ────────────────────────────────────────────────────────

async function getPendingApplications(moderatorUserId, moderatorRole, { page = 1, limit = 20 } = {}) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can view pending applications.');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await CandidateApplication.findAndCountAll({
    where: { status: 'pending' },
    include: [
      { model: User, as: 'applicant', attributes: SAFE_USER_ATTRS },
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] }
    ],
    limit: limitNum,
    offset,
    order: [['createdAt', 'ASC']]
  });

  return {
    applications: rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getApplicationById(moderatorUserId, moderatorRole, applicationId) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can view applications.');
  }

  const application = await CandidateApplication.findByPk(applicationId, {
    include: [
      { model: User, as: 'applicant', attributes: SAFE_USER_ATTRS },
      { model: User, as: 'reviewer', attributes: SAFE_USER_ATTRS },
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] },
      { model: PublicPersonProfile, as: 'publicPersonProfile', attributes: ['id', 'slug', 'firstName', 'lastName'] }
    ]
  });
  if (!application) throw new ServiceError(404, 'Application not found.');
  return application;
}

async function getPendingClaims(moderatorUserId, moderatorRole, { page = 1, limit = 20 } = {}) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can view pending claims.');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await PublicPersonProfile.findAndCountAll({
    where: { claimStatus: 'pending' },
    include: [
      { model: User, as: 'claimedBy', attributes: SAFE_USER_ATTRS },
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] }
    ],
    limit: limitNum,
    offset,
    order: [['claimRequestedAt', 'ASC']]
  });

  return {
    profiles: rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getDashboard(candidateUserId) {
  const profile = await PublicPersonProfile.findOne({
    where: { claimedByUserId: candidateUserId, claimStatus: 'claimed' },
    include: [
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] }
    ]
  });
  if (!profile) throw new ServiceError(404, 'No candidate profile found for this user.');
  return profile;
}

module.exports = {
  getCandidates,
  getCandidateBySlug,
  getCandidateById,
  submitApplication,
  getMyApplication,
  approveApplication,
  rejectApplication,
  createProfile,
  submitClaim,
  approveClaim,
  rejectClaim,
  updateProfile,
  deleteProfile,
  getPendingApplications,
  getApplicationById,
  getPendingClaims,
  getDashboard,
  appointAsCandidate,
  retireCandidate,
  // Export for testing
  generateSlug
};
