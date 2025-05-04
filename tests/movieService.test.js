const express = require('express');
const request = require('supertest');
const MovieService = require('../services/MovieService');

const mockDb = {
  query: jest.fn()
};

const app = express();
app.use(express.json());
app.use('/movies', new MovieService(mockDb).getRouter());

describe('MovieService API Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return all movies', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ watchable_id: 1, title: 'Test Movie' }] });
    const res = await request(app).get('/movies');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Test Movie');
  });

  test('should get movie by ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ watchable_id: 1, title: 'Inception' }] });
    const res = await request(app).get('/movies/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Inception');
  });

  test('should get movies by title', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ title: 'Titanic' }] });
    const res = await request(app).get('/movies/title/Titanic');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Titanic');
  });

  test('should get movies by genre', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ genre_id: 2 }] });
    const res = await request(app).get('/movies/genre/Drama');
    expect(res.status).toBe(200);
  });

  test('should get movies by profile preferences', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ watchable_id: 5 }] });
    const res = await request(app).get('/movies/profile/1');
    expect(res.status).toBe(200);
  });

  test('should return 404 if movie not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/movies/999');
    expect(res.status).toBe(404);
  });
});