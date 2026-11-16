const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../src/models');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use('/api/auth', authRoutes);

describe('Public contact people', () => {
  beforeAll(async () => {
    if (sequelize.getDialect() !== 'sqlite' || sequelize.options.storage !== ':memory:') {
      throw new Error('Contact profile tests require an in-memory database');
    }
    await sequelize.sync({ force: true });
    await User.bulkCreate([
      { username: 'current-admin', role: 'admin', profileVisibility: 'public' },
      { username: 'private-admin', role: 'admin', profileVisibility: 'hidden' },
      { username: 'registered-admin', role: 'admin', profileVisibility: 'registered' },
      { username: 'public-moderator', role: 'moderator', profileVisibility: 'public' },
      { username: 'person-admin', role: 'admin', profileVisibility: 'public', claimStatus: 'unclaimed' },
      { username: null, role: 'admin', profileVisibility: 'public' },
      // Deliberately insert acknowledgements in a different order and with private data.
      { username: 'Panos', profileVisibility: 'public', email: 'panos@example.test', mobileTel: '+30123456789' },
      { username: 'mariosliviri', profileVisibility: 'public' },
      { username: 'Simeon', profileVisibility: 'public', role: 'viewer' },
    ]);
  });

  afterAll(() => sequelize.close());

  test('guests see current public admins and the confirmed early members with Simeon first', async () => {
    const response = await request(app).get('/api/auth/users/contact-people').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.admins.map(user => user.username)).toEqual(['current-admin']);
    expect(response.body.data.earlyMembers.map(user => user.username)).toEqual(['Simeon', 'mariosliviri', 'Panos']);
    for (const user of [...response.body.data.admins, ...response.body.data.earlyMembers]) {
      expect(Object.keys(user).sort()).toEqual([
        'id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn',
        'avatar', 'avatarColor', 'createdAt', 'isVerified',
      ].sort());
    }
  });

  test('visibility changes, role changes, and deleted accounts are reflected immediately', async () => {
    await User.update({ profileVisibility: 'registered' }, { where: { username: 'Simeon' } });
    await User.update({ role: 'viewer' }, { where: { username: 'current-admin' } });
    await User.destroy({ where: { username: 'Panos' } });
    const response = await request(app).get('/api/auth/users/contact-people').expect(200);
    expect(response.body.data.admins).toEqual([]);
    expect(response.body.data.earlyMembers.map(user => user.username)).toEqual(['mariosliviri']);
  });
});
