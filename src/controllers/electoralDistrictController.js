'use strict';

const locationService = require('../services/locationService');

/**
 * GET /api/locations/:id/electoral-districts
 * Returns the electoral districts mapped to the given location (municipality).
 * Public — no authentication required.
 */
exports.getMunicipalityDistricts = async (req, res) => {
  const result = await locationService.getMunicipalityDistricts(req.params.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, districts: result.districts });
};

/**
 * GET /api/locations/:id/municipalities
 * Returns the municipalities mapped to the given electoral district.
 * Public — no authentication required.
 */
exports.getDistrictMunicipalities = async (req, res) => {
  const result = await locationService.getDistrictMunicipalities(req.params.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, municipalities: result.municipalities });
};

/**
 * POST /api/locations/:id/electoral-districts
 * Add a mapping between the given location and an electoral district.
 * Admin/Moderator only.
 * Body: { electoralDistrictId: number }
 */
exports.addMapping = async (req, res) => {
  const municipalityId = parseInt(req.params.id, 10);
  const { electoralDistrictId } = req.body;

  if (!electoralDistrictId || !Number.isInteger(parseInt(electoralDistrictId, 10))) {
    return res.status(400).json({ success: false, message: 'electoralDistrictId is required' });
  }

  const result = await locationService.addMunicipalityDistrictMapping(
    municipalityId,
    parseInt(electoralDistrictId, 10)
  );

  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.status(201).json({ success: true, mapping: result.mapping });
};

/**
 * DELETE /api/locations/:id/electoral-districts/:mappingId
 * Remove a specific district mapping by its mapping row ID.
 * Admin/Moderator only.
 */
exports.removeMapping = async (req, res) => {
  const mappingId = parseInt(req.params.mappingId, 10);
  if (!Number.isInteger(mappingId) || mappingId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid mapping ID' });
  }

  const result = await locationService.removeMunicipalityDistrictMapping(mappingId);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, message: 'Mapping removed successfully' });
};
