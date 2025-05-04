const express = require('express');
const request = require('supertest');
const QualityService = require('../services/QualityService');
const QualityRepository = require('../repositories/QualityRepository');

// Mock the database object inline
const mockDb = {
  query: jest.fn(),
};

const app = express();
app.use(express.json());

const service = new QualityService(mockDb);
app.use('/qualities', service.getRouter());

describe('QualityService API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a quality', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ quality_id: 1, name: 'HD' }] });

    const res = await request(app)
      .post('/qualities/create')
      .send({ name: 'HD' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Quality created successfully!');
    expect(mockDb.query).toHaveBeenCalledWith(
      'INSERT INTO "Qualities" (name) VALUES ($1) RETURNING quality_id, name',
      ['HD']
    );
  });

  test('should return validation error if name is missing', async () => {
    const res = await request(app)
      .post('/qualities/create')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('"name" is required');
  });

  test('should return all qualities', async () => {
    const mockQualities = [{ quality_id: 1, name: 'HD' }, { quality_id: 2, name: 'SD' }];
    mockDb.query.mockResolvedValueOnce({ rows: mockQualities });

    const res = await request(app).get('/qualities');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQualities);
    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM "Qualities" ORDER BY quality_id ASC');
  });

  test('should update a quality', async () => {
    const updatedRow = { quality_id: 1, name: 'UHD' };
    mockDb.query.mockResolvedValueOnce({ rows: [updatedRow] });

    const res = await request(app)
      .put('/qualities/1')
      .send({ name: 'UHD' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Quality updated successfully!');
    expect(res.body.quality).toEqual(updatedRow);
    expect(mockDb.query).toHaveBeenCalledWith(
      `UPDATE "Qualities" SET name = $1 WHERE quality_id = $2 RETURNING quality_id, name`,
      ['UHD', '1']
    );
  });

  test('should return 404 if quality to update is not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/qualities/99')
      .send({ name: '4K' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Quality not found.');
  });

  test('should delete a quality', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ quality_id: 1, name: 'HD' }] });

    const res = await request(app).delete('/qualities/1');

    expect(res.status).toBe(204);
    expect(mockDb.query).toHaveBeenCalledWith(
      'DELETE FROM "Qualities" WHERE quality_id = $1 RETURNING quality_id, name',
      ['1']
    );
  });

  test('should return 404 if quality to delete is not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/qualities/999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Quality not found.');
  });
});
