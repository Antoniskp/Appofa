/**
 * candidateService unit tests
 * Uses Jest mocking to avoid DB interaction.
 */

jest.mock('../../models', () => {
  const mockFindOne = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindAndCountAll = jest.fn();
  const mockFindByPk = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDestroy = jest.fn();
  const mockCount = jest.fn();

  const buildMockModel = (name) => ({
    name,
    findOne: mockFindOne,
    findAll: mockFindAll,
    findAndCountAll: mockFindAndCountAll,
    findByPk: mockFindByPk,
    create: mockCreate,
    update: mockUpdate,
    destroy: mockDestroy,
    count: mockCount,
    _mockFindOne: mockFindOne,
    _mockFindByPk: mockFindByPk,
    _mockCreate: mockCreate,
    _mockUpdate: mockUpdate,
    _mockDestroy: mockDestroy,
    _mockFindAndCountAll: mockFindAndCountAll,
  });

  return {
    CandidateProfile: buildMockModel('CandidateProfile'),
    CandidateApplication: buildMockModel('CandidateApplication'),
    User: buildMockModel('User'),
    Location: buildMockModel('Location'),
    Op: { in: Symbol('in'), like: Symbol('like') }
  };
});

const { CandidateProfile, CandidateApplication, User } = require('../../models');
const service = require('../../services/candidateService');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── generateSlug ──────────────────────────────────────────────────────────

describe('generateSlug', () => {
  it('converts name to lowercase slug', () => {
    expect(service.generateSlug('John Smith')).toBe('john-smith');
  });

  it('removes special characters', () => {
    expect(service.generateSlug('Ioánnis Papadópoulos')).toBe('ionnis-papadpoulos');
  });

  it('collapses multiple spaces', () => {
    expect(service.generateSlug('John   Smith')).toBe('john-smith');
  });

  it('collapses multiple dashes', () => {
    expect(service.generateSlug('John--Smith')).toBe('john-smith');
  });
});

// ─── submitApplication ────────────────────────────────────────────────────

describe('submitApplication', () => {
  it('throws 400 if fullName is missing', async () => {
    await expect(service.submitApplication(1, { supportingStatement: 'x' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 if supportingStatement is missing', async () => {
    await expect(service.submitApplication(1, { fullName: 'John' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('throws 409 if user already has pending application', async () => {
    CandidateApplication.findOne.mockResolvedValueOnce({ id: 1, status: 'pending' });
    await expect(service.submitApplication(1, { fullName: 'John', supportingStatement: 'x' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('creates application with correct fields', async () => {
    CandidateApplication.findOne.mockResolvedValueOnce(null);
    const mockApp = { id: 1, fullName: 'John', status: 'pending' };
    CandidateApplication.create.mockResolvedValueOnce(mockApp);

    const result = await service.submitApplication(1, {
      fullName: 'John',
      supportingStatement: 'I want to serve',
      bio: 'My bio'
    });

    expect(CandidateApplication.create).toHaveBeenCalledWith(expect.objectContaining({
      applicantUserId: 1,
      fullName: 'John',
      supportingStatement: 'I want to serve',
      status: 'pending'
    }));
    expect(result).toBe(mockApp);
  });
});

// ─── approveApplication ──────────────────────────────────────────────────

describe('approveApplication', () => {
  it('throws 403 if called by viewer', async () => {
    await expect(service.approveApplication(1, 'viewer', 5))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 if called by candidate', async () => {
    await expect(service.approveApplication(1, 'candidate', 5))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 404 if application not found', async () => {
    CandidateApplication.findByPk.mockResolvedValueOnce(null);
    await expect(service.approveApplication(1, 'moderator', 99))
      .rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 if application is not pending', async () => {
    CandidateApplication.findByPk.mockResolvedValueOnce({
      id: 1,
      status: 'approved',
      fullName: 'John',
      applicantUserId: 2,
      include: jest.fn()
    });
    await expect(service.approveApplication(1, 'admin', 1))
      .rejects.toMatchObject({ status: 400 });
  });

  it('creates profile, updates user role, links application on approval', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    const mockApp = {
      id: 1,
      status: 'pending',
      fullName: 'John Smith',
      applicantUserId: 2,
      constituencyId: null,
      bio: 'Bio',
      contactEmail: null,
      manifesto: null,
      getDataValue: jest.fn().mockReturnValue(null),
      update: mockUpdate
    };
    CandidateApplication.findByPk.mockResolvedValueOnce(mockApp);
    // ensureUniqueSlug
    CandidateProfile.findOne.mockResolvedValueOnce(null);
    const mockProfile = { id: 10, slug: 'john-smith' };
    CandidateProfile.create.mockResolvedValueOnce(mockProfile);
    User.update.mockResolvedValueOnce([1]);

    const result = await service.approveApplication(1, 'moderator', 1);

    expect(CandidateProfile.create).toHaveBeenCalledWith(expect.objectContaining({
      source: 'application',
      claimStatus: 'claimed',
      claimedByUserId: 2
    }));
    expect(User.update).toHaveBeenCalledWith({ role: 'candidate' }, { where: { id: 2 } });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved',
      candidateProfileId: 10
    }));
    expect(result.profile).toBe(mockProfile);
  });
});

// ─── rejectApplication ──────────────────────────────────────────────────

describe('rejectApplication', () => {
  it('throws 403 if called by viewer', async () => {
    await expect(service.rejectApplication(1, 'viewer', 5, 'reason'))
      .rejects.toMatchObject({ status: 403 });
  });

  it('sets status to rejected with reason', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    CandidateApplication.findByPk.mockResolvedValueOnce({
      id: 1, status: 'pending', update: mockUpdate
    });

    await service.rejectApplication(1, 'moderator', 1, 'Not qualified');

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'rejected',
      rejectionReason: 'Not qualified',
      reviewedByUserId: 1
    }));
  });
});

// ─── createProfile ───────────────────────────────────────────────────────

describe('createProfile', () => {
  it('throws 403 if called by viewer', async () => {
    await expect(service.createProfile(1, 'viewer', { fullName: 'Test' }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 if called by candidate', async () => {
    await expect(service.createProfile(1, 'candidate', { fullName: 'Test' }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 400 if fullName is missing', async () => {
    await expect(service.createProfile(1, 'moderator', {}))
      .rejects.toMatchObject({ status: 400 });
  });

  it('creates profile with source=moderator and claimStatus=unclaimed', async () => {
    CandidateProfile.findOne.mockResolvedValueOnce(null);
    const mockProfile = { id: 1, slug: 'test-candidate' };
    CandidateProfile.create.mockResolvedValueOnce(mockProfile);

    const result = await service.createProfile(1, 'moderator', { fullName: 'Test Candidate' });

    expect(CandidateProfile.create).toHaveBeenCalledWith(expect.objectContaining({
      source: 'moderator',
      claimStatus: 'unclaimed',
      createdByUserId: 1
    }));
    expect(result).toBe(mockProfile);
  });
});

// ─── submitClaim ─────────────────────────────────────────────────────────

describe('submitClaim', () => {
  it('throws 400 if supportingStatement is missing', async () => {
    await expect(service.submitClaim(1, 5, ''))
      .rejects.toMatchObject({ status: 400 });
  });

  it('throws 404 if profile not found', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce(null);
    await expect(service.submitClaim(1, 99, 'statement'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 if profile already claimed', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce({ id: 1, claimStatus: 'claimed' });
    await expect(service.submitClaim(1, 1, 'statement'))
      .rejects.toMatchObject({ status: 400 });
  });

  it('throws 409 if claim already pending', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce({ id: 1, claimStatus: 'pending' });
    await expect(service.submitClaim(1, 1, 'statement'))
      .rejects.toMatchObject({ status: 409 });
  });

  it('generates claimToken and sets claimTokenExpiresAt', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    CandidateProfile.findByPk.mockResolvedValueOnce({
      id: 1, claimStatus: 'unclaimed', update: mockUpdate
    });

    await service.submitClaim(2, 1, 'I am this person');

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      claimStatus: 'pending',
      claimedByUserId: 2,
      claimToken: expect.any(String),
      claimTokenExpiresAt: expect.any(Date)
    }));

    const call = mockUpdate.mock.calls[0][0];
    expect(call.claimToken).toHaveLength(64); // 32 bytes hex = 64 chars
    const now = Date.now();
    expect(call.claimTokenExpiresAt.getTime()).toBeGreaterThan(now);
    expect(call.claimTokenExpiresAt.getTime()).toBeLessThanOrEqual(now + 25 * 60 * 60 * 1000);
  });
});

// ─── approveClaim ────────────────────────────────────────────────────────

describe('approveClaim', () => {
  it('throws 403 if called by viewer', async () => {
    await expect(service.approveClaim(1, 'viewer', 1))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 400 if no pending claim', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce({ id: 1, claimStatus: 'unclaimed' });
    await expect(service.approveClaim(1, 'admin', 1))
      .rejects.toMatchObject({ status: 400 });
  });

  it('sets claimStatus to claimed and promotes user to candidate', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    CandidateProfile.findByPk.mockResolvedValueOnce({
      id: 1, claimStatus: 'pending', claimedByUserId: 5, update: mockUpdate
    });
    User.update.mockResolvedValueOnce([1]);

    await service.approveClaim(10, 'moderator', 1);

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      claimStatus: 'claimed',
      claimVerifiedByUserId: 10,
      claimToken: null
    }));
    expect(User.update).toHaveBeenCalledWith({ role: 'candidate' }, { where: { id: 5 } });
  });
});

// ─── rejectClaim ─────────────────────────────────────────────────────────

describe('rejectClaim', () => {
  it('throws 403 if called by editor', async () => {
    await expect(service.rejectClaim(1, 'editor', 1, 'reason'))
      .rejects.toMatchObject({ status: 403 });
  });

  it('clears claimToken and claimedByUserId on rejection', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    CandidateProfile.findByPk.mockResolvedValueOnce({
      id: 1, claimStatus: 'pending', update: mockUpdate
    });

    await service.rejectClaim(1, 'admin', 1, 'Not verified');

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      claimStatus: 'rejected',
      claimedByUserId: null,
      claimToken: null,
      claimTokenExpiresAt: null
    }));
  });
});

// ─── updateProfile ───────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('throws 404 if profile not found', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce(null);
    await expect(service.updateProfile(1, 'candidate', 99, {}))
      .rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 if candidate tries to update another profile', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce({ id: 1, claimedByUserId: 5 });
    await expect(service.updateProfile(2, 'candidate', 1, { bio: 'new bio' }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('allows owner to update their own profile', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    const mockProfile = { id: 1, claimedByUserId: 3, update: mockUpdate };
    CandidateProfile.findByPk.mockResolvedValueOnce(mockProfile);

    const result = await service.updateProfile(3, 'candidate', 1, { bio: 'updated bio' });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ bio: 'updated bio' }));
  });

  it('allows moderator to update any profile', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    const mockProfile = { id: 1, claimedByUserId: 5, update: mockUpdate };
    CandidateProfile.findByPk.mockResolvedValueOnce(mockProfile);

    await service.updateProfile(1, 'moderator', 1, { bio: 'mod update' });

    expect(mockUpdate).toHaveBeenCalled();
  });
});

// ─── deleteProfile ──────────────────────────────────────────────────────

describe('deleteProfile', () => {
  it('throws 403 if called by moderator', async () => {
    await expect(service.deleteProfile(1, 'moderator', 1))
      .rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 if called by candidate', async () => {
    await expect(service.deleteProfile(1, 'candidate', 1))
      .rejects.toMatchObject({ status: 403 });
  });

  it('deletes profile when called by admin', async () => {
    const mockDestroy = jest.fn().mockResolvedValue(true);
    CandidateProfile.findByPk.mockResolvedValueOnce({ id: 1, destroy: mockDestroy });

    const result = await service.deleteProfile(1, 'admin', 1);

    expect(mockDestroy).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });

  it('throws 404 if profile not found', async () => {
    CandidateProfile.findByPk.mockResolvedValueOnce(null);
    await expect(service.deleteProfile(1, 'admin', 99))
      .rejects.toMatchObject({ status: 404 });
  });
});
