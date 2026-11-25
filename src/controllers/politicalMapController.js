const { CandidateRegistration, Location, User } = require('../models');
const districtSlugs = require('../../config/map-data/electoral-district-location-slugs.json');

// This widget is public even for staff. Never return review notes or contacts.
exports.candidates = async (req, res) => {
  const { page = '1', limit = '100' } = req.query;
  if (![page, limit].every(value => typeof value === 'string' && /^[1-9]\d*$/.test(value)
    && Number.isSafeInteger(Number(value))) || Number(limit) > 100) {
    return res.status(400).json({ success: false, message: 'Invalid pagination.' });
  }
  try {
    const [result, districts] = await Promise.all([
      CandidateRegistration.findAndCountAll({
        where: { status: 'approved', positionType: 'parliamentary', source: null },
        attributes: ['id', 'locationId', 'electionCycle', 'partyName', 'isIndependent', 'slogan', 'platform', 'consultationCommitment'],
        include: [
          { model: User, as: 'candidate', required: true,
            where: { profileVisibility: 'public', claimStatus: null },
            attributes: ['id', 'slug', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'photo', 'avatar'] },
          { model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug', 'type'] },
        ],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: Number(limit), offset: (Number(page) - 1) * Number(limit), distinct: true,
      }),
      Location.findAll({ where: { type: 'electoral_district' }, attributes: ['id', 'slug', 'parent_id'], raw: true }),
    ]);
    const registrations = result.rows.map(row => {
      const registration = row.toJSON();
      // A broad registration can only be resolved if it contains one district.
      // Residence alone does not establish where someone is standing for election.
      const children = districts.filter(district => district.parent_id === registration.locationId && districtSlugs[district.slug]);
      const districtId = districtSlugs[registration.location?.slug]
        || (children.length === 1 ? districtSlugs[children[0].slug] : null);
      return { ...registration, districtId };
    });
    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ success: true, data: { registrations,
      pagination: { totalPages: Math.ceil(result.count / Number(limit)) } } });
  } catch (error) {
    console.error('Political map candidates error:', error.message);
    return res.status(500).json({ success: false, message: 'Candidates unavailable.' });
  }
};
