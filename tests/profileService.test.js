// tests/profileService.test.js
const request = require('supertest');
const express = require('express');
const ProfileService = require('../services/ProfileService');
const ProfileRepository = require('../repositories/ProfileRepository');
const { validateProfileCreate, validateProfileUpdate } = require('../validators/ProfileValidator');

jest.mock('../repositories/ProfileRepository');

let app;
let mockRepo;

beforeEach(() => {
  mockRepo = {
    createProfile: jest.fn(),
    getAllProfiles: jest.fn(),
    getProfileById: jest.fn(),
    getProfilesByUserId: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  };

  ProfileRepository.mockImplementation(() => mockRepo);

  const profileService = new ProfileService({ pool: {} });
  app = express();
  app.use(express.json());
  app.use('/profiles', profileService.getRouter());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ProfileService API Tests', () => {
  it('should create a profile successfully', async () => {
    mockRepo.createProfile.mockResolvedValue();

    const res = await request(app)
      .post('/profiles/create')
      .send({
        userid: 1,
        profile_name: 'Test User',
        profile_photo_link: 'https://example.com/photo.jpg',
        age: 25,
        language_id: 2
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Profile created successfully!');
  });

  it('should return 422 if profile creation validation fails', async () => {
    const res = await request(app)
      .post('/profiles/create')
      .send({ userid: 1 });

    expect(res.statusCode).toBe(422);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  it('should get all profiles', async () => {
    const mockProfiles = [{ profile_id: 1, profile_name: 'John' }];
    mockRepo.getAllProfiles.mockResolvedValue(mockProfiles);

    const res = await request(app).get('/profiles');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockProfiles);
  });

  it('should return 404 for nonexistent profile by ID', async () => {
    mockRepo.getProfileById.mockResolvedValue(null);

    const res = await request(app).get('/profiles/999');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Profile not found.');
  });

  it('should update a profile', async () => {
    const updated = {
      profile_id: 1,
      profile_photo_link: 'https://example.com/photo.jpg',
      age: 30,
      language_id: 1,
      profile_name: 'Updated'
    };
    mockRepo.updateProfile.mockResolvedValue(updated);

    const res = await request(app)
      .put('/profiles/1')
      .send({ profile_photo_link: updated.profile_photo_link });

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toEqual(updated);
  });

  it('should delete a profile successfully', async () => {
    mockRepo.deleteProfile.mockResolvedValue({ profile_id: 1 });

    const res = await request(app).delete('/profiles/1');

    expect(res.statusCode).toBe(204);
  });
});
