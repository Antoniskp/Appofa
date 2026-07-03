'use strict';

const candidateRegistrationService = require('../services/candidateRegistrationService');

function handleError(res, error, fallbackMessage) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
}

exports.listRegistrations = async (req, res) => {
  try {
    const data = await candidateRegistrationService.listRegistrations({
      ...req.query,
      viewer: req.user || null,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Error fetching candidate registrations.');
  }
};

exports.listMine = async (req, res) => {
  try {
    const data = await candidateRegistrationService.listMine(req.user.id, req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Error fetching your candidate registrations.');
  }
};

exports.createRegistration = async (req, res) => {
  try {
    const registration = await candidateRegistrationService.createRegistration(req.user.id, req.body);
    return res.status(201).json({ success: true, data: { registration } });
  } catch (error) {
    return handleError(res, error, 'Error creating candidate registration.');
  }
};

exports.updateRegistration = async (req, res) => {
  try {
    const registration = await candidateRegistrationService.updateRegistration(
      req.user.id,
      req.user.role,
      parseInt(req.params.id, 10),
      req.body
    );
    return res.json({ success: true, data: { registration } });
  } catch (error) {
    return handleError(res, error, 'Error updating candidate registration.');
  }
};

exports.archiveRegistration = async (req, res) => {
  try {
    const data = await candidateRegistrationService.archiveRegistration(
      req.user.id,
      req.user.role,
      parseInt(req.params.id, 10)
    );
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Error archiving candidate registration.');
  }
};
