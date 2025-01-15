const request = require('supertest');
const express = require('express');
const ExportService = require('../services/ExportService');

// Mock database
const mockDb = {
    query: jest.fn(),
};

// Inline mock for formatResponse
jest.mock('../utils/formatHelper', () => {
    return jest.fn((data, format = "json", rootName = "data") => {
        if (format === "xml") {
            return `<${rootName}>${JSON.stringify(data)}</${rootName}>`; // Mock XML response
        }
        return JSON.stringify(data); // Mock JSON response
    });
});

const formatResponse = require('../utils/formatHelper');

let app;

beforeAll(() => {
    const exportService = new ExportService(mockDb);
    app = express();
    app.use('/export', exportService.getRouter());
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('ExportService API Tests', () => {
    it('should export all users in JSON format by default', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [
                { user_id: 1, email: 'user1@example.com' },
                { user_id: 2, email: 'user2@example.com' },
            ],
        });

        const response = await request(app).get('/export/users');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.text).toEqual(JSON.stringify([
            { user_id: 1, email: 'user1@example.com' },
            { user_id: 2, email: 'user2@example.com' },
        ]));
    });

    it('should export all users in XML format when requested', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [
                { user_id: 1, email: 'user1@example.com' },
                { user_id: 2, email: 'user2@example.com' },
            ],
        });

        const response = await request(app).get('/export/users?format=xml');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/xml');
        expect(response.text).toContain('<users>');
    });

    it('should handle database errors when exporting users', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).get('/export/users');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Failed to export users');
    });

    // Add similar tests for profiles and subscriptions...
});
