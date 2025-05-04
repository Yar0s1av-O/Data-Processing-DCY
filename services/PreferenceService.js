const express = require('express');
const js2xmlparser = require('js2xmlparser');
const { validateCreatePreference } = require('../validators/PreferenceValidator');
const PreferenceRepository = require('../repositories/PreferenceRepository');

function formatResponse(req, res, data, status = 200) {
  const format = req.query.format;
  if (format === 'xml') {
    res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
  } else {
    res.status(status).json(data);
  }
}

class PreferenceService {
  constructor(db) {
    this.db = db;
    this.repo = new PreferenceRepository(db);
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/create', this.createPreferenceRecord.bind(this));
    this.router.get('/:profile_id', this.getPreferencesByProfileId.bind(this));
    this.router.delete('/:profile_id/:genre_id', this.deletePreferenceRecordById.bind(this));
  }

  async createPreferenceRecord(req, res) {
    const { error, value } = validateCreatePreference(req.body);
    if (error) {
      return formatResponse(req, res, { message: error.details.map(d => d.message) }, 400);
    }

    try {
      await this.repo.insertPreference(value.profile_id, value.genre_id);
      formatResponse(req, res, { message: 'Preference record created successfully!' }, 201);
    } catch (err) {
      console.error('Error creating preference record:', err.stack);
      formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async getPreferencesByProfileId(req, res) {
    const { profile_id } = req.params;

    if (!profile_id) {
      return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
    }

    try {
      const result = await this.repo.getPreferencesByProfileId(profile_id);
      if (result.rows.length === 0) {
        return formatResponse(req, res, { message: 'No preference records found for this profile.' }, 404);
      }
      formatResponse(req, res, result.rows, 200);
    } catch (err) {
      console.error('Error retrieving preferences:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve preferences', error: err.message }, 500);
    }
  }

  async deletePreferenceRecordById(req, res) {
    const { profile_id, genre_id } = req.params;

    if (!profile_id || !genre_id) {
      return formatResponse(req, res, { message: 'Both profile_id and genre_id are required.' }, 400);
    }

    try {
      const result = await this.repo.deletePreference(profile_id, genre_id);
      if (result.rows.length === 0) {
        return formatResponse(req, res, { message: 'Preference record not found.' }, 404);
      }
      formatResponse(req, res, { message: 'Preference record deleted successfully!' }, 204);
    } catch (err) {
      console.error('Error deleting preference:', err.stack);
      formatResponse(req, res, { message: 'Failed to delete preference', error: err.message }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = PreferenceService;
