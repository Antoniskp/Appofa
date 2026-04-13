'use strict';

/**
 * Data migration: copy every PublicPersonProfile row into a new User row,
 * then re-point all FK references (LocationRoles.personId, PersonRemovalRequests.publicPersonProfileId)
 * to the new user ids.
 *
 * Note: Endorsements and DreamTeamVotes already reference Users via
 * endorsedId / candidateUserId (pointing to the placeholder user). Those FKs
 * remain pointing to users; the placeholder users that held these votes are
 * converted into full unclaimed-profile users in this migration.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('PublicPersonProfiles')) {
      console.log('PublicPersonProfiles table does not exist – skipping data migration.');
      return;
    }

    // Fetch all existing profiles
    const profiles = await queryInterface.sequelize.query(
      'SELECT * FROM "PublicPersonProfiles"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (profiles.length === 0) {
      console.log('No PublicPersonProfile rows found – skipping data migration.');
      return;
    }

    // Collect all placeholder user ids so we can update them rather than creating duplicates
    const placeholderUserIds = profiles
      .map((p) => p.placeholderUserId)
      .filter(Boolean);

    // Fetch placeholder users so we can update them
    let placeholderUsers = [];
    if (placeholderUserIds.length > 0) {
      placeholderUsers = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE id IN (${placeholderUserIds.join(',')})`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    const existingPlaceholderIds = new Set(placeholderUsers.map((u) => u.id));

    // Map old profile id → new user id (either updated placeholder or newly created user)
    const profileIdToUserId = {};

    for (const profile of profiles) {
      const claimStatusValue = profile.claimStatus;
      const sourceValue = profile.source || 'moderator';

      if (profile.placeholderUserId && existingPlaceholderIds.has(profile.placeholderUserId)) {
        // Update the existing placeholder user with claim fields and profile data
        const sets = [
          `"claimStatus" = '${claimStatusValue}'`,
          `"slug" = ${profile.slug ? `'${profile.slug.replace(/'/g, "''")}'` : 'NULL'}`,
          `"photo" = ${profile.photo ? `'${profile.photo.replace(/'/g, "''")}'` : 'NULL'}`,
          `"contactEmail" = ${profile.contactEmail ? `'${profile.contactEmail.replace(/'/g, "''")}'` : 'NULL'}`,
          `"politicalPositions" = ${profile.politicalPositions ? `'${profile.politicalPositions.replace(/'/g, "''")}'` : 'NULL'}`,
          `"manifesto" = ${profile.manifesto ? `'${profile.manifesto.replace(/'/g, "''")}'` : 'NULL'}`,
          `"countryCode" = ${profile.countryCode ? `'${profile.countryCode.replace(/'/g, "''")}'` : 'NULL'}`,
          `"source" = '${sourceValue}'`,
          `"createdByUserId" = ${profile.createdByUserId || 'NULL'}`,
          `"claimedByUserId" = ${profile.claimStatus === 'claimed' ? (profile.claimedByUserId || 'NULL') : 'NULL'}`,
          `"claimRequestedAt" = ${profile.claimRequestedAt ? `'${profile.claimRequestedAt}'` : 'NULL'}`,
          `"claimVerifiedAt" = ${profile.claimVerifiedAt ? `'${profile.claimVerifiedAt}'` : 'NULL'}`,
          `"claimVerifiedByUserId" = ${profile.claimVerifiedByUserId || 'NULL'}`,
          `"claimToken" = ${profile.claimToken ? `'${profile.claimToken}'` : 'NULL'}`,
          `"claimTokenExpiresAt" = ${profile.claimTokenExpiresAt ? `'${profile.claimTokenExpiresAt}'` : 'NULL'}`,
          `"searchable" = true`,
          `"isPlaceholder" = false`,
        ];

        // Update name fields if profile has them
        if (profile.firstNameNative) sets.push(`"firstNameNative" = '${profile.firstNameNative.replace(/'/g, "''")}'`);
        if (profile.lastNameNative) sets.push(`"lastNameNative" = '${profile.lastNameNative.replace(/'/g, "''")}'`);
        if (profile.firstNameEn) sets.push(`"firstNameEn" = '${profile.firstNameEn.replace(/'/g, "''")}'`);
        if (profile.lastNameEn) sets.push(`"lastNameEn" = '${profile.lastNameEn.replace(/'/g, "''")}'`);
        if (profile.nickname) sets.push(`"nickname" = '${profile.nickname.replace(/'/g, "''")}'`);
        if (profile.bio) sets.push(`"bio" = '${profile.bio.replace(/'/g, "''")}'`);
        if (profile.nationality) sets.push(`"nationality" = '${profile.nationality}'`);
        if (profile.constituencyId) sets.push(`"constituencyId" = ${profile.constituencyId}`);
        if (profile.expertiseArea) sets.push(`"expertiseArea" = '${profile.expertiseArea.replace(/'/g, "''")}'`);
        if (profile.partyId) sets.push(`"partyId" = '${profile.partyId.replace(/'/g, "''")}'`);
        if (profile.socialLinks) sets.push(`"socialLinks" = '${profile.socialLinks.replace(/'/g, "''")}'`);

        await queryInterface.sequelize.query(
          `UPDATE "Users" SET ${sets.join(', ')} WHERE id = ${profile.placeholderUserId}`
        );

        profileIdToUserId[profile.id] = profile.placeholderUserId;
      } else {
        // No placeholder user found — create a new unclaimed User for this profile
        const slug = profile.slug || `person-${profile.id}`;

        // Make username unique
        let username = `person-${slug}`;
        const existing = await queryInterface.sequelize.query(
          `SELECT id FROM "Users" WHERE username = '${username.replace(/'/g, "''")}'`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        if (existing.length > 0) {
          username = `person-${slug}-${profile.id}`;
        }

        const now = new Date().toISOString();
        const claimedByVal = profile.claimStatus === 'claimed' ? (profile.claimedByUserId || null) : null;

        const insertResult = await queryInterface.sequelize.query(
          `INSERT INTO "Users" (
            username, email, password, role, searchable,
            "firstNameNative", "lastNameNative", "firstNameEn", "lastNameEn", nickname,
            bio, photo, "contactEmail", "politicalPositions", manifesto,
            "expertiseArea", "partyId", nationality, "countryCode", "constituencyId",
            "socialLinks", slug, source,
            "claimStatus", "claimedByUserId", "claimRequestedAt", "claimVerifiedAt",
            "claimVerifiedByUserId", "claimToken", "claimTokenExpiresAt", "createdByUserId",
            "isPlaceholder", "createdAt", "updatedAt"
          ) VALUES (
            '${username.replace(/'/g, "''")}',
            NULL,
            NULL,
            'viewer',
            true,
            ${profile.firstNameNative ? `'${profile.firstNameNative.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.lastNameNative ? `'${profile.lastNameNative.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.firstNameEn ? `'${profile.firstNameEn.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.lastNameEn ? `'${profile.lastNameEn.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.nickname ? `'${profile.nickname.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.bio ? `'${profile.bio.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.photo ? `'${profile.photo.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.contactEmail ? `'${profile.contactEmail.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.politicalPositions ? `'${profile.politicalPositions.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.manifesto ? `'${profile.manifesto.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.expertiseArea ? `'${profile.expertiseArea.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.partyId ? `'${profile.partyId.replace(/'/g, "''")}'` : 'NULL'},
            ${profile.nationality ? `'${profile.nationality}'` : 'NULL'},
            ${profile.countryCode ? `'${profile.countryCode}'` : 'NULL'},
            ${profile.constituencyId || 'NULL'},
            ${profile.socialLinks ? `'${profile.socialLinks.replace(/'/g, "''")}'` : 'NULL'},
            '${slug.replace(/'/g, "''")}',
            '${sourceValue}',
            '${claimStatusValue}',
            ${claimedByVal || 'NULL'},
            ${profile.claimRequestedAt ? `'${profile.claimRequestedAt}'` : 'NULL'},
            ${profile.claimVerifiedAt ? `'${profile.claimVerifiedAt}'` : 'NULL'},
            ${profile.claimVerifiedByUserId || 'NULL'},
            ${profile.claimToken ? `'${profile.claimToken}'` : 'NULL'},
            ${profile.claimTokenExpiresAt ? `'${profile.claimTokenExpiresAt}'` : 'NULL'},
            ${profile.createdByUserId || 'NULL'},
            false,
            '${now}',
            '${now}'
          ) RETURNING id`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        const newUserId = insertResult[0]?.id;
        if (newUserId) {
          profileIdToUserId[profile.id] = newUserId;
        }
      }
    }

    // ── Update LocationRoles.personId → userId ────────────────────────────────
    if (tables.includes('LocationRoles')) {
      const lrCols = await queryInterface.describeTable('LocationRoles');
      if (lrCols.personId) {
        const lrWithPersonId = await queryInterface.sequelize.query(
          'SELECT id, "personId" FROM "LocationRoles" WHERE "personId" IS NOT NULL',
          { type: Sequelize.QueryTypes.SELECT }
        );
        for (const lr of lrWithPersonId) {
          const newUserId = profileIdToUserId[lr.personId];
          if (newUserId) {
            await queryInterface.sequelize.query(
              `UPDATE "LocationRoles" SET "userId" = ${newUserId}, "personId" = NULL WHERE id = ${lr.id} AND ("userId" IS NULL)`
            );
          }
        }
      }
    }

    // ── Update PersonRemovalRequests.publicPersonProfileId → userId ───────────
    if (tables.includes('PersonRemovalRequests')) {
      const prrCols = await queryInterface.describeTable('PersonRemovalRequests');
      if (prrCols.publicPersonProfileId) {
        // We'll rename the column in the next migration; for now just add userId column
        if (!prrCols.userId) {
          await queryInterface.addColumn('PersonRemovalRequests', 'userId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onDelete: 'SET NULL',
          });
        }
        // Copy profile ids to user ids
        const prrs = await queryInterface.sequelize.query(
          'SELECT id, "publicPersonProfileId" FROM "PersonRemovalRequests" WHERE "publicPersonProfileId" IS NOT NULL',
          { type: Sequelize.QueryTypes.SELECT }
        );
        for (const prr of prrs) {
          const newUserId = profileIdToUserId[prr.publicPersonProfileId];
          if (newUserId) {
            await queryInterface.sequelize.query(
              `UPDATE "PersonRemovalRequests" SET "userId" = ${newUserId} WHERE id = ${prr.id}`
            );
          }
        }
      }
    }

    console.log(`Migration complete: ${profiles.length} profiles migrated to Users.`);
  },

  async down(queryInterface) {
    // This migration is not easily reversible (data was moved).
    console.log('Down migration for migrate-public-person-profiles-to-users is a no-op.');
  },
};
