const request = require('supertest');
const express = require('express');
const WatchableService = require('../services/WatchableService');

const mockDb = {
  query: jest.fn(),
};

let app;

beforeEach(() => {
  const watchableService = new WatchableService(mockDb);
  app = express();
  app.use(express.json());
  app.use('/watchables', watchableService.getRouter());
  jest.clearAllMocks();
});

describe('WatchableService API Tests', () => {
  it('should create a new watchable successfully', async () => {
    mockDb.query.mockResolvedValueOnce();

    const res = await request(app).post('/watchables/create').send({
      title: 'Inception',
      description: 'A mind-bending thriller',
      genre_id: 1,
      duration: '02:28:00',
      season: null,
      episode: null
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Watchable created successfully!');
  });

  it('should return 422 for invalid create payload', async () => {
    const res = await request(app).post('/watchables/create').send({
      title: '',
      genre_id: 1,
      duration: 'not-a-time'
    });

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('Validation failed');
  });

  it('should retrieve all watchables', async () => {
    const mockData = [{ watchable_id: 1, title: 'Test Show' }];
    mockDb.query.mockResolvedValueOnce({ rows: mockData });

    const res = await request(app).get('/watchables');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return 404 for non-existing watchable by ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/watchables/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Watchable not found.');
  });

  it('should update an existing watchable', async () => {
    const updatedWatchable = {
      watchable_id: 1,
      title: 'Updated Title',
      description: 'Updated Description',
      genre_id: 2,
      duration: '01:30:00',
      season: 1,
      episode: 1
    };

    mockDb.query.mockResolvedValueOnce({ rows: [updatedWatchable] });

    const res = await request(app).put('/watchables/1').send({
      title: 'Updated Title',
      duration: '01:30:00'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.watchable).toEqual(updatedWatchable);
  });

  it('should delete a watchable', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ watchable_id: 1 }] });

    const res = await request(app).delete('/watchables/1');
    expect(res.statusCode).toBe(204);
  });
});