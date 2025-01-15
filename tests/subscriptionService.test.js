const request = require('supertest');
const express = require('express');
const SubscriptionService = require('../services/SubscriptionService'); // The path to the subscription service
const mockDb = {
    query: jest.fn(),
};

let app;

beforeAll(() => {
    const subscriptionService = new SubscriptionService(mockDb);
    app = express();
    app.use(express.json());
    app.use('/subscriptions', subscriptionService.getRouter());
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('SubscriptionService API Tests', () => {
    // Test: Create a subscription
    it('should create a new subscription successfully', async () => {
        mockDb.query.mockResolvedValueOnce(); // Mock successful stored procedure call

        const response = await request(app)
            .post('/subscriptions/create')
            .send({
                subscription_type_id: 1,
                subscription_name: 'Basic Plan',
                subscription_price_euro: 9.99,
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Subscription created successfully!');
    });

    // Test: Pay a subscription
    it('should process a subscription payment successfully', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ status_code: 200 }], // Mock successful payment
        });

        const response = await request(app)
            .post('/subscriptions/pay')
            .send({
                userid: 1,
                subscription_type_id: 1,
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Subscription payment processed successfully.');
    });

    it('should return 404 when user is not found for payment', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ status_code: 404 }],
        });

        const response = await request(app)
            .post('/subscriptions/pay')
            .send({
                userid: 1,
                subscription_type_id: 1,
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'User not found.');
    });

    // Test: Get all subscriptions
    it('should retrieve all subscriptions', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [
                { subscription_type_id: 1, subscription_name: 'Basic Plan', subscription_price_euro: 9.99 },
                { subscription_type_id: 2, subscription_name: 'Premium Plan', subscription_price_euro: 19.99 },
            ],
        });

        const response = await request(app).get('/subscriptions');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('subscription_name', 'Basic Plan');
    });

    // Test: Get subscription by ID
    it('should retrieve a subscription by ID', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ subscription_type_id: 1, subscription_name: 'Basic Plan', subscription_price_euro: 9.99 }],
        });

        const response = await request(app).get('/subscriptions/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('subscription_name', 'Basic Plan');
    });

    it('should return 404 if subscription not found by ID', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app).get('/subscriptions/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Subscription not found.');
    });

    // Test: Update subscription
    it('should update a subscription successfully', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ subscription_type_id: 1, subscription_name: 'Updated Plan', subscription_price_euro: 12.99 }],
        });

        const response = await request(app)
            .put('/subscriptions/1')
            .send({ subscription_name: 'Updated Plan', subscription_price_euro: 12.99 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Subscription updated successfully!');
        expect(response.body.subscription).toHaveProperty('subscription_price_euro', 12.99);
    });

    it('should return 404 if subscription to update is not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
            .put('/subscriptions/999')
            .send({ subscription_name: 'Updated Plan', subscription_price_euro: 12.99 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Subscription not found.');
    });

    // Test: Delete subscription
    it('should delete a subscription successfully', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ subscription_type_id: 1 }],
        });

        const response = await request(app).delete('/subscriptions/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Subscription deleted successfully!');
    });

    it('should return 404 if subscription to delete is not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app).delete('/subscriptions/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Subscription not found.');
    });
});
