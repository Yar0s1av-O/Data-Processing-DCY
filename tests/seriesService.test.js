
const request = require('supertest');
const express = require('express');
const SeriesService = require('../services/SeriesService');

describe('SeriesService API Tests', () => {
  let app;
  let mockDb;

  beforeAll(() => {
    mockDb = {
      query: jest.fn()
    };
    const service = new SeriesService(mockDb);
    app = express();
    app.use(express.json());
    app.use('/series', service.getRouter());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all series', async () => {
    const mockData = [{ watchable_id: 1, title: 'Test Series' }];
    mockDb.query.mockResolvedValue({ rows: mockData });

    const res = await request(app).get('/series');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return a series by ID', async () => {
    const mockSeries = { watchable_id: 1, title: 'Test Series' };
    mockDb.query.mockResolvedValue({ rows: [mockSeries] });

    const res = await request(app).get('/series/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockSeries);
  });

  it('should return 404 for unknown series ID', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/series/999');
    expect(res.statusCode).toBe(404);
  });

  it('should return series by title', async () => {
    const mockData = [{ title: 'Test Series' }];
    mockDb.query.mockResolvedValue({ rows: mockData });

    const res = await request(app).get('/series/title/Test');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return series by genre name', async () => {
    const mockData = [{ genre_id: 2, title: 'Genre Match' }];
    mockDb.query.mockResolvedValue({ rows: mockData });

    const res = await request(app).get('/series/genre/Action');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return series by title and season', async () => {
    const mockData = [{ title: 'Test Series', season: 1 }];
    mockDb.query.mockResolvedValue({ rows: mockData });

    const res = await request(app).get('/series/title/Test/season/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should return preferred series by profile ID', async () => {
    const mockData = [{ title: 'Preferred Series', genre_id: 1 }];
    mockDb.query.mockResolvedValue({ rows: mockData });

    const res = await request(app).get('/series/profile/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });
});
