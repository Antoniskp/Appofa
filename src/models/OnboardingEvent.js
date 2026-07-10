'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * OnboardingEvent — compact funnel analytics table.
 *
 * Records server-authoritative milestones during the onboarding journey.
 * Each event includes user ID, event type, optional goal, and a bounded
 * JSON metadata object. No sensitive personal data is stored.
 *
 * Event types are validated server-side; metadata keys are allowlisted.
 * Idempotency: unique per (userId, eventType) for once-per-user events;
 * repeatable events like checklist_progress allow multiple rows.
 */

const ONCE_PER_USER_EVENTS = new Set([
  'registration',
  'goal_selected',
  'onboarding_dismissed',
  'onboarding_completed',
  'moderator_application_submitted',
  'moderator_application_approved',
  'first_contribution_created',
  'candidate_registration_submitted',
  'candidate_registration_approved',
]);

const ALL_EVENT_TYPES = [
  'registration',
  'onboarding_viewed',
  'goal_selected',
  'checklist_progress',
  'onboarding_dismissed',
  'onboarding_resumed',
  'onboarding_completed',
  'moderator_application_submitted',
  'moderator_application_approved',
  'first_contribution_created',
  'candidate_registration_submitted',
  'candidate_registration_approved',
];

const ALLOWED_GOALS = ['moderator', 'creator', 'independent', 'citizen'];

const MAX_METADATA_LENGTH = 1000;

const OnboardingEvent = sequelize.define('OnboardingEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  eventType: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: {
      isIn: [ALL_EVENT_TYPES],
    },
  },
  goal: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      isIn: [[...ALLOWED_GOALS, null]],
    },
  },
  // Bounded JSON metadata — max MAX_METADATA_LENGTH chars when serialized
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('metadata');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set(val) {
      if (val == null) {
        this.setDataValue('metadata', null);
        return;
      }
      const str = JSON.stringify(val);
      this.setDataValue('metadata', str.length <= MAX_METADATA_LENGTH ? str : null);
    },
  },
}, {
  tableName: 'OnboardingEvents',
  timestamps: true,
  updatedAt: false, // events are append-only
  indexes: [
    { fields: ['userId', 'eventType'] },
    { fields: ['eventType', 'createdAt'] },
    { fields: ['goal', 'createdAt'] },
  ],
});

OnboardingEvent.ONCE_PER_USER_EVENTS = ONCE_PER_USER_EVENTS;
OnboardingEvent.ALL_EVENT_TYPES = ALL_EVENT_TYPES;
OnboardingEvent.ALLOWED_GOALS = ALLOWED_GOALS;

module.exports = OnboardingEvent;
