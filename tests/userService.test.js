// tests/userService.test.js
const bcrypt = require('bcrypt');
const request = require('supertest');
const express = require('express');
const UserService = require('../services/UserService');
const UserRepository = require('../repositories/UserRepository');

jest.mock('../repositories/UserRepository');

let app;
let mockRepo;

beforeEach(() => {
  mockRepo = {
    getUserByEmail: jest.fn(),
    getUserProfilesByEmail: jest.fn(),
    createUser: jest.fn(),
    checkInvitation: jest.fn(),
    insertInvitation: jest.fn(),
    updateUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    deleteUser: jest.fn(),
    upsertOAuthUser: jest.fn()
  };

  UserRepository.mockImplementation(() => mockRepo);

  const userService = new UserService({ pool: {} }); // db irrelevant due to mock
  app = express();
  app.use(express.json());
  app.use('/users', userService.getRouter());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('UserService API Tests', () => {
  it('should register a new user successfully', async () => {
    mockRepo.getUserByEmail.mockResolvedValue(null);
    mockRepo.createUser.mockResolvedValue({ user_id: 1, email: 'newuser@example.com' });

    const res = await request(app)
      .post('/users/register')
      .send({ email: 'newuser@example.com', password: 'securepassword' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully.');
    expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
  });

  it('should not register a user with an existing email', async () => {
    mockRepo.getUserByEmail.mockResolvedValue({ user_id: 1, email: 'existing@example.com' });

    const res = await request(app)
      .post('/users/register')
      .send({ email: 'existing@example.com', password: 'securepassword' });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'Email is already registered.');
  });

  it('should log in a user with correct credentials', async () => {
    const password = 'correctpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    mockRepo.getUserByEmail.mockResolvedValue({ user_id: 1, email: 'test@example.com', password: hashedPassword });
    mockRepo.getUserProfilesByEmail.mockResolvedValue([{ user_id: 1, name: 'John', email: 'test@example.com' }]);

    const res = await request(app)
      .post('/users/login')
      .send({ email: 'test@example.com', password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful!');
    expect(res.body).toHaveProperty('token');
  });

  it('should fail login with incorrect credentials', async () => {
    const correctPassword = 'correctpassword';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);

    mockRepo.getUserByEmail.mockResolvedValue({ user_id: 1, email: 'test@example.com', password: hashedPassword });

    const res = await request(app)
      .post('/users/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password.');
  });

  it('should log in via OAuth if user exists', async () => {
    mockRepo.getUserByEmail.mockResolvedValue({ user_id: 2, email: 'oauth@example.com' });
    mockRepo.getUserProfilesByEmail.mockResolvedValue([{ user_id: 2, name: 'OAuth User', email: 'oauth@example.com' }]);

    const res = await request(app)
      .post('/users/login/oauth')
      .send({ email: 'oauth@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'OAuth login successful!');
    expect(res.body).toHaveProperty('token');
  });

  it('should return 404 if OAuth user not found', async () => {
    mockRepo.getUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/users/login/oauth')
      .send({ email: 'missing@example.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'OAuth user not found.');
  });
});