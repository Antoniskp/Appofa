'use strict';

const { PollAttachment, Poll } = require('../models');
const attachments = require('../services/pollAttachmentService');
const pollService = require('../services/pollService');

const handleError = (error, res) => {
  if (!error.status) console.error('Poll attachment error:', error.message);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Αποτυχία επεξεργασίας συνημμένου.' });
};

module.exports = {
  async upload(req, res) {
    try {
      return res.status(201).json({ success: true, attachment: await attachments.uploadAttachment(req.file, req.user) });
    } catch (error) { return handleError(error, res); }
  },
  async remove(req, res) {
    try {
      await attachments.deleteStagedAttachment(req.params.attachmentId, req.user.id);
      return res.json({ success: true });
    } catch (error) { return handleError(error, res); }
  },
  async file(req, res) {
    // Apply to successful responses and denials alike. Visibility can change.
    res.set('Cache-Control', 'private, no-store');
    res.vary('Cookie');
    res.vary('Authorization');
    try {
      const row = attachments.UUID.test(req.params.attachmentId) ? await PollAttachment.findByPk(req.params.attachmentId) : null;
      if (!row) return res.status(404).json({ success: false, message: 'Attachment not found.' });
      if (row.pollId === null) {
        if (req.user?.id !== row.uploadedByUserId) return res.status(404).json({ success: false, message: 'Attachment not found.' });
      } else {
        const poll = await Poll.findByPk(row.pollId);
        if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
        const denied = await pollService.getPollAccessError(poll, req.user);
        if (denied) return res.status(denied.status).json(denied);
      }
      const thumbnail = req.query.thumbnail === 'true' && row.thumbnailKey;
      res.type(thumbnail ? 'image/webp' : row.mimeType);
      res.set('X-Content-Type-Options', 'nosniff');
      if (row.mimeType === 'application/pdf') res.set('Content-Security-Policy', "sandbox; default-src 'none'");
      const name = row.mimeType === 'application/pdf' ? `${row.title.replace(/\.pdf$/i, '')}.pdf` : `${row.title.replace(/\.[^.]+$/, '')}.webp`;
      res.attachment(name);
      if (req.query.download !== 'true') res.set('Content-Disposition', res.get('Content-Disposition').replace(/^attachment/, 'inline'));
      return res.sendFile(attachments.storagePath(thumbnail || row.storageKey), { cacheControl: false, dotfiles: 'allow' }, error => {
        if (error && !res.headersSent) res.status(error.status === 404 ? 404 : 500).end();
      });
    } catch (error) { return handleError(error, res); }
  },
};
