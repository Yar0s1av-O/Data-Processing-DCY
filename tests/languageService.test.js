const express = require('express');
const request = require('supertest');
const LanguageService = require('../services/LanguageService');
const { validateCreateLanguage, validateUpdateLanguage } = require('../validators/LanguageValidator');
const LanguageRepository = require('../repositories/LanguageRepository');

const mockDb = {
  query: jest.fn(),
};

describe('LanguageService', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const languageService = new LanguageService(mockDb);
    app.use('/languages', languageService.getRouter());
    jest.clearAllMocks();
  });

  test('should create a language', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ language_id: 1, name: 'English' }] });
    const res = await request(app).post('/languages/create').send({ name: 'English' });
    expect(res.statusCode).toBe(201);
    expect(res.body.language.name).toBe('English');
  });

  test('should return all languages', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ language_id: 1, name: 'English' }] });
    const res = await request(app).get('/languages');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('should return 404 when no languages found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/languages');
    expect(res.statusCode).toBe(404);
  });

  test('should return a language by id', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ language_id: 1, name: 'English' }] });
    const res = await request(app).get('/languages/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('English');
  });

  test('should update a language', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ language_id: 1, name: 'French' }] });
    const res = await request(app).put('/languages/1').send({ name: 'French' });
    expect(res.statusCode).toBe(200);
    expect(res.body.language.name).toBe('French');
  });

  test('should delete a language', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ language_id: 1, name: 'English' }] });
    const res = await request(app).delete('/languages/1');
    expect(res.statusCode).toBe(204);
  });
});