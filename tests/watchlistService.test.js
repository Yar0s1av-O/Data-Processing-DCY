const request = require('supertest');
const express = require('express');
const WatchlistService = require('../services/WatchlistService');
const WatchlistRepository = require('../repositories/WatchlistRepository');

jest.mock('../repositories/WatchlistRepository');

let app;
let mockRepo;

beforeEach(() => {
  mockRepo = {
    createWatchlist: jest.fn(),
    getByProfileId: jest.fn(),
    deleteByCompositeId: jest.fn()
  };

  WatchlistRepository.mockImplementation(() => mockRepo);

  const service = new WatchlistService({ pool: {} });
  app = express();
  app.use(express.json());
  app.use('/watchlist', service.getRouter());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('WatchlistService API Tests', () => {
  it('should create a watchlist record successfully', async () => {
    mockRepo.createWatchlist.mockResolvedValue();

    const res = await request(app)
      .post('/watchlist/create')
      .send({
        profile_id: 1,
        watchable_id: 2
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Watchlist record created successfully!');
  });

  it('should fail creation with invalid input', async () => {
    const res = await request(app)
      .post('/watchlist/create')
      .send({
        profile_id: 'abc',
        watchable_id: 2
      });

    expect(res.statusCode).toBe(422);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  it('should fetch watchlist records by profile ID', async () => {
    const fakeData = [{ profile_id: 1, watchable_id: 2 }];
    mockRepo.getByProfileId.mockResolvedValue(fakeData);

    const res = await request(app).get('/watchlist/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeData);
  });

  it('should return 404 if no watchlist records found', async () => {
    mockRepo.getByProfileId.mockResolvedValue([]);

    const res = await request(app).get('/watchlist/1');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'No watchlist records found for this profile.');
  });

  it('should delete a watchlist record successfully', async () => {
    mockRepo.deleteByCompositeId.mockResolvedValue({ profile_id: 1, watchable_id: 2 });

    const res = await request(app).delete('/watchlist/1/2');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Watchlist record deleted successfully!');
  });

  it('should return 404 if record not found for deletion', async () => {
    mockRepo.deleteByCompositeId.mockResolvedValue(null);

    const res = await request(app).delete('/watchlist/1/99');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Watchlist record not found.');
  });

  it('should return 422 if invalid IDs are used in deletion', async () => {
    const res = await request(app).delete('/watchlist/abc/2');

    expect(res.statusCode).toBe(422);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });
});
