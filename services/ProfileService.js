// services/ProfileService.js
const express = require('express');
const js2xmlparser = require('js2xmlparser');
const { validateProfileCreate, validateProfileUpdate } = require('../validators/ProfileValidator');
const ProfileRepository = require('../repositories/ProfileRepository');
const Joi = require('joi');


function formatResponse(req, res, data, status = 200) {
  const format = req.query.format;
  if (format === 'xml') {
    res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
  } else {
    res.status(status).json(data);
  }
}

class ProfileService {
  constructor(db) {
    this.db = db;
    this.repo = new ProfileRepository(db);
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/create', this.createProfile.bind(this));
    this.router.get('/', this.getAllProfiles.bind(this));
    this.router.get('/:id', this.getProfileById.bind(this));
    this.router.get('/user/:user_id', this.getProfilesByUserId.bind(this));
    this.router.put('/:id', this.updateProfile.bind(this));
    this.router.delete('/:id', this.deleteProfile.bind(this));
  }

  async createProfile(req, res) {
    const { error } = validateProfileCreate(req.body);
    if (error) {
      return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
    }
    try {
      await this.repo.createProfile(req.body);
      formatResponse(req, res, { message: 'Profile created successfully!' }, 201);
    } catch (err) {
      console.error('Create profile error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async getAllProfiles(req, res) {
    try {
      const profiles = await this.repo.getAllProfiles();
      formatResponse(req, res, profiles, 200);
    } catch (err) {
      console.error('Get all profiles error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async getProfileById(req, res) {
    const { id } = req.params;
    try {
      const profile = await this.repo.getProfileById(id);
      if (!profile) return formatResponse(req, res, { message: 'Profile not found.' }, 404);
      formatResponse(req, res, profile, 200);
    } catch (err) {
      console.error('Get profile by ID error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async getProfilesByUserId(req, res) {
    const { user_id } = req.params;
    try {
      const profiles = await this.repo.getProfilesByUserId(user_id);
      if (!profiles.length) return formatResponse(req, res, { message: 'No profiles found for this user.' }, 404);
      formatResponse(req, res, profiles, 200);
    } catch (err) {
      console.error('Get profiles by user ID error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async updateProfile(req, res) {
    const { id } = req.params;
    const { error } = validateProfileUpdate(req.body);
    if (error) {
      return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
    }
    try {
      const updated = await this.repo.updateProfile(id, req.body);
      if (!updated) return formatResponse(req, res, { message: 'Profile not found.' }, 404);
      formatResponse(req, res, { message: 'Profile updated successfully!', profile: updated }, 200);
    } catch (err) {
      console.error('Update profile error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async deleteProfile(req, res) {
    const { id } = req.params;
    try {
      const deleted = await this.repo.deleteProfile(id);
      if (!deleted) return formatResponse(req, res, { message: 'Profile not found.' }, 404);
      res.status(204).send();
    } catch (err) {
      console.error('Delete profile error:', err);
      formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ProfileService;
