'use strict';

/**
 * Migration: Add claim/person-profile fields to Users table.
 *
 * - Makes email and username nullable (for unclaimed profile users with no real account)
 * - Adds slug (unique, nullable) for profile URLs
 * - Adds person profile fields: photo, contactEmail, politicalPositions, manifesto,
 *   countryCode, constituencyId, source
 * - Changes bio from VARCHAR(280) to TEXT
 * - Adds claim fields: claimStatus, claimedByUserId, claimRequestedAt, claimVerifiedAt,
 *   claimVerifiedByUserId, claimToken, claimTokenExpiresAt, createdByUserId
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tableDescription = await queryInterface.describeTable('Users');

    // ── Make email nullable ───────────────────────────────────────────────────
    if (tableDescription.email) {
      await queryInterface.changeColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }

    // ── Make username nullable ────────────────────────────────────────────────
    if (tableDescription.username) {
      await queryInterface.changeColumn('Users', 'username', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }

    // ── Expand bio from VARCHAR(280) to TEXT ──────────────────────────────────
    if (tableDescription.bio) {
      await queryInterface.changeColumn('Users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // ── Add slug ──────────────────────────────────────────────────────────────
    if (!tableDescription.slug) {
      if (dialect === 'sqlite') {
        await queryInterface.addColumn('Users', 'slug', {
          type: Sequelize.STRING(255),
          allowNull: true,
        });
        try {
          await queryInterface.addIndex('Users', ['slug'], {
            unique: true,
            name: 'users_slug_unique',
          });
        } catch (error) {
          const isDuplicateIndex = error.name === 'SequelizeDatabaseError'
            && (error.original?.code === '42P07'
              || error.message?.includes('already exists')
              || error.message?.includes('UNIQUE'));
          if (!isDuplicateIndex) throw error;
        }
      } else {
        await queryInterface.addColumn('Users', 'slug', {
          type: Sequelize.STRING(255),
          allowNull: true,
          unique: true,
        });
      }
    }

    // ── Add person profile fields ─────────────────────────────────────────────
    if (!tableDescription.photo) {
      await queryInterface.addColumn('Users', 'photo', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!tableDescription.contactEmail) {
      await queryInterface.addColumn('Users', 'contactEmail', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableDescription.politicalPositions) {
      await queryInterface.addColumn('Users', 'politicalPositions', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableDescription.manifesto) {
      await queryInterface.addColumn('Users', 'manifesto', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableDescription.countryCode) {
      await queryInterface.addColumn('Users', 'countryCode', {
        type: Sequelize.STRING(5),
        allowNull: true,
      });
    }

    if (!tableDescription.constituencyId) {
      await queryInterface.addColumn('Users', 'constituencyId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!tableDescription.source) {
      await queryInterface.addColumn('Users', 'source', {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('moderator', 'application', 'self')
          : Sequelize.STRING(20),
        allowNull: true,
      });
    }

    // ── Add claim fields ──────────────────────────────────────────────────────
    if (!tableDescription.claimStatus) {
      await queryInterface.addColumn('Users', 'claimStatus', {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('unclaimed', 'pending', 'claimed', 'rejected')
          : Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDescription.claimedByUserId) {
      await queryInterface.addColumn('Users', 'claimedByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!tableDescription.claimRequestedAt) {
      await queryInterface.addColumn('Users', 'claimRequestedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.claimVerifiedAt) {
      await queryInterface.addColumn('Users', 'claimVerifiedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.claimVerifiedByUserId) {
      await queryInterface.addColumn('Users', 'claimVerifiedByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!tableDescription.claimToken) {
      await queryInterface.addColumn('Users', 'claimToken', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableDescription.claimTokenExpiresAt) {
      await queryInterface.addColumn('Users', 'claimTokenExpiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.createdByUserId) {
      await queryInterface.addColumn('Users', 'createdByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Users');

    if (tableDescription.slug) {
      try {
        await queryInterface.removeIndex('Users', 'users_slug_unique');
      } catch {
        // Index may not exist on all dialects/environments.
      }
    }

    const claimCols = [
      'claimStatus', 'claimedByUserId', 'claimRequestedAt', 'claimVerifiedAt',
      'claimVerifiedByUserId', 'claimToken', 'claimTokenExpiresAt', 'createdByUserId',
    ];
    for (const col of claimCols) {
      if (tableDescription[col]) await queryInterface.removeColumn('Users', col);
    }

    const profileCols = ['slug', 'photo', 'contactEmail', 'politicalPositions', 'manifesto', 'countryCode', 'constituencyId', 'source'];
    for (const col of profileCols) {
      if (tableDescription[col]) await queryInterface.removeColumn('Users', col);
    }
  },
};
