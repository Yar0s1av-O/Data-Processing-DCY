const bcrypt = require('bcrypt');
const request = require('supertest');
const express = require('express');
const UserService = require('../services/UserService'); // Adjust the path
const mockDb = {
    query: jest.fn(),
};

let app;

beforeAll(() => {
    const userService = new UserService(mockDb);
    app = express();
    app.use(express.json());
    app.use('/users', userService.getRouter());
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('UserService API Tests', () => {
    it('should log in a user with correct credentials', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'test@example.com', password: hashedPassword }] })
            .mockResolvedValueOnce({ rows: [{ user_id: 1, name: 'John', email: 'test@example.com' }] });

        const response = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com', password: 'correctpassword' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Login successful!');
        expect(response.body).toHaveProperty('token');
    });

    it('should fail login with incorrect credentials', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'test@example.com', password: hashedPassword }] });

        const response = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Email or password is incorrect.');
    });

    it('should register a new user successfully', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] }) // Mock no existing user
            .mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'newuser@example.com' }] });

        const response = await request(app)
            .post('/users/register')
            .send({ email: 'newuser@example.com', password: 'securepassword' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'User registered successfully!');
        expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should not register a user with an existing email', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'existinguser@example.com' }] });

        const response = await request(app)
            .post('/users/register')
            .send({ email: 'existinguser@example.com', password: 'securepassword' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email is already registered!');
    });
});
