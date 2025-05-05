const request = require('supertest');
const express = require('express');
const GenreService = require('../services/GenreService');

const mockDb = {
  query: jest.fn()
};

const app = express();
app.use(express.json());
const service = new GenreService(mockDb);
app.use('/genres', service.getRouter());

describe('GenreService API', () => {
  afterEach(() => jest.clearAllMocks());

  test('POST /genres/create - should create genre', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ genre_id: 1, genre_name: 'Action' }] });

    const res = await request(app)
      .post('/genres/create')
      .send({ genre_name: 'Action' });

    expect(res.statusCode).toBe(201);
    expect(res.body.genre.genre_name).toBe('Action');
  });

  test('GET /genres - should return genres', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ genre_id: 1, genre_name: 'Action' }] });

    const res = await request(app).get('/genres');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('GET /genres/:id - not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/genres/99');

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('PUT /genres/:id - update genre', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ genre_id: 1, genre_name: 'Updated' }]
    });

    const res = await request(app)
      .put('/genres/1')
      .send({ genre_name: 'Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.genre.genre_name).toBe('Updated');
  });

  test('DELETE /genres/:id - delete genre', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ genre_id: 1 }] });

    const res = await request(app).delete('/genres/1');

    expect(res.statusCode).toBe(204);
  });
});
