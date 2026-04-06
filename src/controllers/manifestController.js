const { Manifest, ManifestAcceptance, User, sequelize } = require('../models');
const badgeService = require('../services/badgeService');

const manifestController = {
  /**
   * GET /api/manifests/admin
   * List ALL manifests (active + inactive) for admin use.
   */
  listAll: async (_req, res) => {
    try {
      const manifests = await Manifest.findAll({
        order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
        attributes: {
          include: [
            [
              sequelize.literal(
                '(SELECT COUNT(*) FROM "ManifestAcceptances" WHERE "ManifestAcceptances"."manifestId" = "Manifest"."id")'
              ),
              'supportersCount',
            ],
          ],
        },
      });

      return res.status(200).json({
        success: true,
        data: { manifests: manifests.map((m) => ({ ...m.toJSON(), supportersCount: parseInt(m.get('supportersCount'), 10) || 0 })) },
      });
    } catch (error) {
      console.error('List all manifests error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching manifests.' });
    }
  },

  /**
   * GET /api/manifests
   * List all active manifests with supporter counts.
   */
  listActive: async (_req, res) => {
    try {
      const manifests = await Manifest.findAll({
        where: { isActive: true },
        order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
        attributes: {
          include: [
            [
              sequelize.literal(
                '(SELECT COUNT(*) FROM "ManifestAcceptances" WHERE "ManifestAcceptances"."manifestId" = "Manifest"."id")'
              ),
              'supportersCount',
            ],
          ],
        },
      });

      return res.status(200).json({
        success: true,
        data: { manifests: manifests.map((m) => ({ ...m.toJSON(), supportersCount: parseInt(m.get('supportersCount'), 10) || 0 })) },
      });
    } catch (error) {
      console.error('List manifests error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching manifests.' });
    }
  },

  /**
   * GET /api/manifests/my-acceptances
   * Returns slugs of manifests the current user has accepted.
   */
  myAcceptances: async (req, res) => {
    try {
      const acceptances = await ManifestAcceptance.findAll({
        where: { userId: req.user.id },
        include: [{ model: Manifest, as: 'manifest', attributes: ['slug'] }],
        attributes: ['manifestId', 'acceptedAt'],
      });

      const data = acceptances.map((a) => ({
        slug: a.manifest.slug,
        acceptedAt: a.acceptedAt,
      }));

      return res.status(200).json({ success: true, data: { acceptances: data } });
    } catch (error) {
      console.error('My acceptances error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching acceptances.' });
    }
  },

  /**
   * GET /api/manifests/:slug/supporters
   * Paginated supporters for a manifest.
   */
  getSupporters: async (req, res) => {
    try {
      const { slug } = req.params;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const offset = (page - 1) * limit;

      const manifest = await Manifest.findOne({ where: { slug, isActive: true } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      const { count: total, rows } = await ManifestAcceptance.findAndCountAll({
        where: { manifestId: manifest.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor'],
        }],
        order: [['acceptedAt', 'DESC']],
        limit,
        offset,
      });

      const users = rows.map((row) => ({
        id: row.user.id,
        username: row.user.username,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        avatar: row.user.avatar,
        avatarColor: row.user.avatarColor,
        acceptedAt: row.acceptedAt,
      }));

      return res.status(200).json({
        success: true,
        data: { users, total, page, limit },
      });
    } catch (error) {
      console.error('Get supporters error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching supporters.' });
    }
  },

  /**
   * GET /api/manifests/:slug/supporters/random
   * Random sample of supporters for homepage display.
   */
  getRandomSupporters: async (req, res) => {
    try {
      const { slug } = req.params;
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));

      const manifest = await Manifest.findOne({ where: { slug, isActive: true } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      const rows = await ManifestAcceptance.findAll({
        where: { manifestId: manifest.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor'],
        }],
        order: sequelize.random(),
        limit,
      });

      const users = rows.map((row) => ({
        id: row.user.id,
        username: row.user.username,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        avatar: row.user.avatar,
        avatarColor: row.user.avatarColor,
      }));

      return res.status(200).json({ success: true, data: { users } });
    } catch (error) {
      console.error('Get random supporters error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching random supporters.' });
    }
  },

  /**
   * PUT /api/manifests/:slug/accept
   * Accept a manifest.
   */
  accept: async (req, res) => {
    try {
      const { slug } = req.params;

      const manifest = await Manifest.findOne({ where: { slug, isActive: true } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      const [acceptance, created] = await ManifestAcceptance.findOrCreate({
        where: { manifestId: manifest.id, userId: req.user.id },
        defaults: { acceptedAt: new Date() },
      });

      // Fire-and-forget badge evaluation
      badgeService.evaluate(req.user.id).catch(err => console.error('Badge eval error:', err));

      return res.status(200).json({
        success: true,
        data: { acceptedAt: acceptance.acceptedAt, created },
        message: created ? 'Manifest accepted.' : 'Already accepted.',
      });
    } catch (error) {
      console.error('Accept manifest error:', error);
      return res.status(500).json({ success: false, message: 'Error accepting manifest.' });
    }
  },

  /**
   * DELETE /api/manifests/:slug/accept
   * Withdraw acceptance.
   */
  withdraw: async (req, res) => {
    try {
      const { slug } = req.params;

      const manifest = await Manifest.findOne({ where: { slug } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      const deleted = await ManifestAcceptance.destroy({
        where: { manifestId: manifest.id, userId: req.user.id },
      });

      // Fire-and-forget badge evaluation
      badgeService.evaluate(req.user.id).catch(err => console.error('Badge eval error:', err));

      return res.status(200).json({
        success: true,
        data: { removed: deleted > 0 },
        message: deleted > 0 ? 'Acceptance withdrawn.' : 'No acceptance found.',
      });
    } catch (error) {
      console.error('Withdraw manifest error:', error);
      return res.status(500).json({ success: false, message: 'Error withdrawing acceptance.' });
    }
  },

  /**
   * POST /api/manifests (admin)
   * Create a new manifest.
   */
  create: async (req, res) => {
    try {
      const { slug, title, description, articleUrl, isActive, displayOrder } = req.body;

      if (!slug || !title || !articleUrl) {
        return res.status(400).json({ success: false, message: 'slug, title, and articleUrl are required.' });
      }

      const existing = await Manifest.findOne({ where: { slug } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A manifest with this slug already exists.' });
      }

      const manifest = await Manifest.create({
        slug,
        title,
        description: description || null,
        articleUrl,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder !== undefined ? displayOrder : 0,
      });

      return res.status(201).json({
        success: true,
        data: { manifest },
        message: 'Manifest created.',
      });
    } catch (error) {
      console.error('Create manifest error:', error);
      return res.status(500).json({ success: false, message: 'Error creating manifest.' });
    }
  },

  /**
   * PUT /api/manifests/:slug (admin)
   * Update a manifest.
   */
  update: async (req, res) => {
    try {
      const { slug } = req.params;
      const manifest = await Manifest.findOne({ where: { slug } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      const { title, description, articleUrl, isActive, displayOrder, slug: newSlug } = req.body;
      if (title !== undefined) manifest.title = title;
      if (description !== undefined) manifest.description = description;
      if (articleUrl !== undefined) manifest.articleUrl = articleUrl;
      if (isActive !== undefined) manifest.isActive = isActive;
      if (displayOrder !== undefined) manifest.displayOrder = displayOrder;
      if (newSlug !== undefined && newSlug !== slug) {
        const conflict = await Manifest.findOne({ where: { slug: newSlug } });
        if (conflict) {
          return res.status(409).json({ success: false, message: 'A manifest with this slug already exists.' });
        }
        manifest.slug = newSlug;
      }

      await manifest.save();

      return res.status(200).json({
        success: true,
        data: { manifest },
        message: 'Manifest updated.',
      });
    } catch (error) {
      console.error('Update manifest error:', error);
      return res.status(500).json({ success: false, message: 'Error updating manifest.' });
    }
  },

  /**
   * DELETE /api/manifests/:slug (admin)
   * Delete a manifest and cascade delete acceptances.
   */
  remove: async (req, res) => {
    try {
      const { slug } = req.params;
      const manifest = await Manifest.findOne({ where: { slug } });
      if (!manifest) {
        return res.status(404).json({ success: false, message: 'Manifest not found.' });
      }

      await ManifestAcceptance.destroy({ where: { manifestId: manifest.id } });
      await manifest.destroy();

      return res.status(200).json({
        success: true,
        message: 'Manifest deleted.',
      });
    } catch (error) {
      console.error('Delete manifest error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting manifest.' });
    }
  },
};

module.exports = manifestController;
