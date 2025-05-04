const express = require('express');
const request = require('supertest');
const PreferenceService = require('../services/PreferenceService');

const mockDb = {
  query: jest.fn()
};

const app = express();
app.use(express.json());
app.use('/preferences', new PreferenceService(mockDb).getRouter());

describe('PreferenceService API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a preference record', async () => {
    mockDb.query.mockResolvedValueOnce();
    const res = await request(app).post('/preferences/create').send({
      profile_id: 1,
      genre_id: 2
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Preference record created successfully!');
  });

  test('should fail validation on create', async () => {
    const res = await request(app).post('/preferences/create').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  test('should get preferences by profile ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ profile_id: 1, genre_id: 2 }] });
    const res = await request(app).get('/preferences/1');
    expect(res.status).toBe(200);
    expect(res.body[0].profile_id).toBe(1);
  });

  test('should return 404 if no preferences found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/preferences/99');
    expect(res.status).toBe(404);
  });

  test('should delete a preference record', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ profile_id: 1, genre_id: 2 }] });
    const res = await request(app).delete('/preferences/1/2');
    expect(res.status).toBe(204);
  });

  test('should return 404 when deleting nonexistent preference', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/preferences/1/999');
    expect(res.status).toBe(404);
  });
});
