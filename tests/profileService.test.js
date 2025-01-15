const request = require('supertest');
const express = require('express');
const ProfileService = require('../services/ProfileService'); // The path to the profile service
const mockDb = {
    query: jest.fn(),
};

let app;

beforeAll(() => {
    const profileService = new ProfileService(mockDb);
    app = express();
    app.use(express.json());
    app.use('/profiles', profileService.getRouter());
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('ProfileService API Tests', () => {
    // Test: Create a profile
    it('should create a new profile successfully', async () => {
        mockDb.query.mockResolvedValueOnce(); // Mock successful procedure call

        const response = await request(app)
            .post('/profiles/create')
            .send({
                userid: 1,
                profile_name: 'John Doe',
                profile_photo_link: 'http://example.com/photo.jpg',
                age: 25,
                language: 'English',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Profile created successfully!');
    });

    // Test: Get all profiles
    it('should retrieve all profiles', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [
                { profile_id: 1, name: 'John Doe', age: 25 },
                { profile_id: 2, name: 'Jane Smith', age: 30 },
            ],
        });

        const response = await request(app).get('/profiles');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2); // Expect two profiles
    });

    // Test: Get profile by ID
    it('should retrieve a profile by ID', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ profile_id: 1, name: 'John Doe', age: 25 }],
        });

        const response = await request(app).get('/profiles/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('profile_id', 1);
        expect(response.body).toHaveProperty('name', 'John Doe');
    });

    // Test: Handle profile not found
    it('should return 404 if profile not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app).get('/profiles/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Profile not found.');
    });

    // Test: Update a profile
    it('should update a profile successfully', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ profile_id: 1, profile_photo_link: 'http://example.com/photo.jpg', age: 26, language: 'English', name: 'John Doe' }],
        });

        const response = await request(app)
            .put('/profiles/1')
            .send({ age: 26 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Profile updated successfully!');
        expect(response.body.profile).toHaveProperty('age', 26);
    });

    // Test: Handle profile update not found
    it('should return 404 if updating a non-existent profile', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
            .put('/profiles/999')
            .send({ age: 26 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Profile not found.');
    });

    // Test: Delete a profile
    it('should delete a profile successfully', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ profile_id: 1 }],
        });

        const response = await request(app).delete('/profiles/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Profile deleted successfully.');
    });

    // Test: Handle profile deletion not found
    it('should return 404 if deleting a non-existent profile', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app).delete('/profiles/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Profile not found.');
    });
});
