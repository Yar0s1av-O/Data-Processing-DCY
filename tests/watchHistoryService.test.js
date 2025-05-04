const request = require('supertest');
const express = require('express');
const WatchHistoryService = require('../services/WatchHistoryService');
const WatchHistoryRepository = require('../repositories/WatchHistoryRepository');
const { validateWatchHistoryCreate, validateWatchHistoryUpdate } = require('../validators/WatchHistoryValidator');

jest.mock('../repositories/WatchHistoryRepository');

let app;
let mockRepo;

beforeEach(() => {
  mockRepo = {
    createWatchHistory: jest.fn(),
    getAllWatchHistory: jest.fn(),
    getWatchHistoryByProfileId: jest.fn(),
    updateWatchHistory: jest.fn(),
    deleteWatchHistory: jest.fn(),
  };

  WatchHistoryRepository.mockImplementation(() => mockRepo);

  const service = new WatchHistoryService({ pool: {} });
  app = express();
  app.use(express.json());
  app.use('/watch-history', service.getRouter());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('WatchHistoryService API Tests', () => {
  it('should create a watch history record successfully', async () => {
    mockRepo.createWatchHistory.mockResolvedValue();

    const res = await request(app)
      .post('/watch-history/create')
      .send({
        profile_id: 1,
        watchable_id: 10,
        time_stopped: 90
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Watch history record created successfully!');
  });

  it('should return 422 if creation validation fails', async () => {
    const res = await request(app)
      .post('/watch-history/create')
      .send({ profile_id: 1 });

    expect(res.statusCode).toBe(422);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  it('should get all watch history records', async () => {
    const mockData = [{ profile_id: 1, watchable_id: 10, time_stopped: 50 }];
    mockRepo.getAllWatchHistory.mockResolvedValue(mockData);

    const res = await request(app).get('/watch-history');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return 404 for non-existent watch history record by ID', async () => {
    mockRepo.getWatchHistoryByProfileId.mockResolvedValue(null);

    const res = await request(app).get('/watch-history/999');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Watch history record not found.');
  });

  it('should update a watch history record', async () => {
    const updated = {
      profile_id: 1,
      watchable_id: 10,
      time_stopped: 120
    };
    mockRepo.updateWatchHistory.mockResolvedValue(updated);

    const res = await request(app)
      .put('/watch-history/1/10')
      .send({ time_stopped: 120 });

    expect(res.statusCode).toBe(200);
    expect(res.body.watchHistory).toEqual(updated);
  });

  it('should delete a watch history record successfully', async () => {
    mockRepo.deleteWatchHistory.mockResolvedValue({ profile_id: 1, watchable_id: 10 });

    const res = await request(app).delete('/watch-history/1/10');

    expect(res.statusCode).toBe(204);
  });
});