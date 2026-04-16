const { Location, LocationRole, LocationElectionVote, User } = require('../models');
const locationRolesConfig = require('../../config/locationRoles.json');

const MODERATOR_ROLE = {
  key: 'moderator',
  title: 'Συντονιστής',
  titleEn: 'Moderator',
};

async function getDescendantLocationIds(locationId) {
  const ids = [];
  const queue = [locationId];

  while (queue.length > 0) {
    const batch = queue.splice(0, queue.length);
    const children = await Location.findAll({
      where: { parent_id: batch },
      attributes: ['id'],
    });

    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }

  return ids;
}

function getElectionRolesForType(locationType) {
  if (locationType === 'country') {
    return [MODERATOR_ROLE];
  }

  const tierRoles = locationRolesConfig.roles[locationType] || [];
  return [MODERATOR_ROLE, ...tierRoles.map((r) => ({ key: r.key, title: r.title, titleEn: r.titleEn }))];
}

function isRoleValidForLocationType(roleKey, locationType) {
  return getElectionRolesForType(locationType).some((role) => role.key === roleKey);
}

exports.getElections = async (req, res) => {
  try {
    const locationId = Number.parseInt(req.params.locationId, 10);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }

    const location = await Location.findByPk(locationId, {
      attributes: ['id', 'type'],
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const electionRoles = getElectionRolesForType(location.type);
    const roleKeys = electionRoles.map((r) => r.key);
    const descendantIds = await getDescendantLocationIds(locationId);
    const allLocationIds = [locationId, ...descendantIds];

    const candidates = await User.findAll({
      where: { homeLocationId: allLocationIds },
      attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'slug'],
      order: [['username', 'ASC']],
    });

    const candidateById = Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate]));

    const [allVotes, currentHolders, myVotes] = await Promise.all([
      LocationElectionVote.findAll({
        where: { locationId, roleKey: roleKeys },
        attributes: ['roleKey', 'candidateUserId'],
      }),
      LocationRole.findAll({
        where: { locationId, roleKey: roleKeys },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'slug'],
          required: false,
        }],
      }),
      req.user?.id
        ? LocationElectionVote.findAll({
          where: { locationId, voterId: req.user.id, roleKey: roleKeys },
          attributes: ['roleKey', 'candidateUserId'],
        })
        : Promise.resolve([]),
    ]);

    const votesByRole = {};
    for (const roleKey of roleKeys) {
      votesByRole[roleKey] = [];
    }
    for (const vote of allVotes) {
      if (!votesByRole[vote.roleKey]) {
        votesByRole[vote.roleKey] = [];
      }
      votesByRole[vote.roleKey].push(vote);
    }

    const holderByRole = Object.fromEntries(
      currentHolders.map((holder) => [holder.roleKey, holder.user || null])
    );
    const myVoteByRole = Object.fromEntries(
      myVotes.map((vote) => [vote.roleKey, vote])
    );
    const canVote = req.user
      ? allLocationIds.includes(
        (await User.findByPk(req.user.id, { attributes: ['homeLocationId'] }))?.homeLocationId
      )
      : false;

    const elections = electionRoles.map((role) => {
      const roleVotes = votesByRole[role.key] || [];
      const totals = new Map();

      for (const vote of roleVotes) {
        const prev = totals.get(vote.candidateUserId) || 0;
        totals.set(vote.candidateUserId, prev + 1);
      }

      const totalVotes = roleVotes.length;
      const results = candidates.map((candidate) => {
        const votes = totals.get(candidate.id) || 0;
        const percentage = totalVotes > 0
          ? Number(((votes / totalVotes) * 100).toFixed(1))
          : 0;

        return {
          userId: candidate.id,
          username: candidate.username,
          firstNameNative: candidate.firstNameNative,
          lastNameNative: candidate.lastNameNative,
          avatar: candidate.avatar,
          avatarColor: candidate.avatarColor,
          slug: candidate.slug,
          votes,
          percentage,
        };
      }).sort((a, b) => b.votes - a.votes || (a.username || '').localeCompare(b.username || ''));

      const currentHolder = holderByRole[role.key];

      return {
        roleKey: role.key,
        roleTitle: role.title,
        roleTitleEn: role.titleEn,
        currentHolder: currentHolder ? {
          id: currentHolder.id,
          username: currentHolder.username,
          firstNameNative: currentHolder.firstNameNative,
          lastNameNative: currentHolder.lastNameNative,
          avatar: currentHolder.avatar,
          avatarColor: currentHolder.avatarColor,
          slug: currentHolder.slug,
        } : null,
        totalVotes,
        myVote: myVoteByRole[role.key]
          ? { candidateUserId: myVoteByRole[role.key].candidateUserId }
          : null,
        results: results.filter((entry) => candidateById[entry.userId]),
      };
    });

    return res.status(200).json({
      success: true,
      locationType: location.type,
      canVote,
      elections,
    });
  } catch (err) {
    console.error('getElections error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.castVote = async (req, res) => {
  try {
    const locationId = Number.parseInt(req.params.locationId, 10);
    const { roleKey } = req.params;
    const candidateUserId = Number.parseInt(req.body?.candidateUserId, 10);

    if (!Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }
    if (!roleKey || typeof roleKey !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid role key' });
    }
    if (!Number.isInteger(candidateUserId) || candidateUserId <= 0) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρος υποψήφιος.' });
    }

    const [location, voter] = await Promise.all([
      Location.findByPk(locationId, { attributes: ['id', 'type'] }),
      User.findByPk(req.user.id, { attributes: ['id', 'homeLocationId'] }),
    ]);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const descendantIds = await getDescendantLocationIds(locationId);
    const allLocationIds = [locationId, ...descendantIds];

    if (!voter || !allLocationIds.includes(voter.homeLocationId)) {
      return res.status(403).json({
        success: false,
        message: 'Μπορείτε να ψηφίσετε μόνο για την τοποθεσία σας.',
      });
    }

    if (!isRoleValidForLocationType(roleKey, location.type)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρος ρόλος για την τοποθεσία.' });
    }

    const candidate = await User.findOne({
      where: { id: candidateUserId, homeLocationId: allLocationIds },
      attributes: ['id'],
    });

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Ο υποψήφιος δεν ανήκει σε αυτή την τοποθεσία.',
      });
    }

    const [vote, created] = await LocationElectionVote.findOrCreate({
      where: { locationId, roleKey, voterId: voter.id },
      defaults: { locationId, roleKey, voterId: voter.id, candidateUserId },
    });

    if (!created && vote.candidateUserId !== candidateUserId) {
      vote.candidateUserId = candidateUserId;
      await vote.save();
    }

    return res.status(200).json({ success: true, message: 'Η ψήφος σας καταχωρήθηκε.' });
  } catch (err) {
    console.error('castVote error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeVote = async (req, res) => {
  try {
    const locationId = Number.parseInt(req.params.locationId, 10);
    const { roleKey } = req.params;

    if (!Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }
    if (!roleKey || typeof roleKey !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid role key' });
    }

    const [location, voter] = await Promise.all([
      Location.findByPk(locationId, { attributes: ['id', 'type'] }),
      User.findByPk(req.user.id, { attributes: ['id', 'homeLocationId'] }),
    ]);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const descendantIds = await getDescendantLocationIds(locationId);
    const allLocationIds = [locationId, ...descendantIds];

    if (!voter || !allLocationIds.includes(voter.homeLocationId)) {
      return res.status(403).json({
        success: false,
        message: 'Μπορείτε να ψηφίσετε μόνο για την τοποθεσία σας.',
      });
    }

    if (!isRoleValidForLocationType(roleKey, location.type)) {
      return res.status(400).json({ success: false, message: 'Μη έγκυρος ρόλος για την τοποθεσία.' });
    }

    await LocationElectionVote.destroy({
      where: { locationId, roleKey, voterId: voter.id },
    });

    return res.status(200).json({ success: true, message: 'Η ψήφος σας αφαιρέθηκε.' });
  } catch (err) {
    console.error('removeVote error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
