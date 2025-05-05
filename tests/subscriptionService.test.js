const request = require("supertest");
const express = require("express");
const SubscriptionService = require("../services/SubscriptionService");
const SubscriptionRepository = require("../repositories/SubscriptionRepository");

// Mock database connection and repo
const mockDb = { query: jest.fn() };
const mockRepo = new SubscriptionRepository(mockDb);

// Spy on methods in the mock repo
jest.spyOn(mockRepo, "create");
jest.spyOn(mockRepo, "pay");
jest.spyOn(mockRepo, "getAll");
jest.spyOn(mockRepo, "getById");
jest.spyOn(mockRepo, "update");
jest.spyOn(mockRepo, "delete");

let app;

beforeAll(() => {
  const service = new SubscriptionService(mockDb, mockRepo); // Pass mockRepo explicitly
  app = express();
  app.use(express.json());
  app.use("/subscriptions", service.getRouter());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("SubscriptionService API Tests", () => {
  it("should create a subscription", async () => {
    mockRepo.create.mockResolvedValue(); // Simulate success

    const res = await request(app).post("/subscriptions/create").send({
      subscription_name: "Premium",
      subscription_price_euro: 9.99
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/created/i);
    expect(mockRepo.create).toHaveBeenCalledWith("Premium", 9.99);
  });

  it("should reject invalid create request", async () => {
    const res = await request(app).post("/subscriptions/create").send({});

    expect(res.statusCode).toBe(422);
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it("should pay for a subscription", async () => {
    mockRepo.pay.mockResolvedValue({ rows: [{ status_code: 200 }] });

    const res = await request(app).post("/subscriptions/pay").send({
      userid: 1,
      subscription_type_id: 2
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status_code).toBe(200);
  });

  it("should return all subscriptions", async () => {
    const subscriptions = [{ subscription_type_id: 1, subscription_name: "Basic", subscription_price_euro: 4.99 }];
    mockRepo.getAll.mockResolvedValue({ rows: subscriptions });

    const res = await request(app).get("/subscriptions");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(subscriptions);
  });

  it("should return subscription by ID", async () => {
    const sub = { subscription_type_id: 2, subscription_name: "Pro", subscription_price_euro: 12.99 };
    mockRepo.getById.mockResolvedValue({ rows: [sub] });

    const res = await request(app).get("/subscriptions/2");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(sub);
  });

  it("should return 404 for non-existent subscription ID", async () => {
    mockRepo.getById.mockResolvedValue({ rows: [] });

    const res = await request(app).get("/subscriptions/999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("should update subscription", async () => {
    const updated = {
      subscription_type_id: 1,
      subscription_name: "Updated",
      subscription_price_euro: 19.99,
    };
    mockRepo.update.mockResolvedValue({ rows: [updated] });

    const res = await request(app).put("/subscriptions/1").send({
      subscription_name: "Updated",
      subscription_price_euro: 19.99,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.subscription).toEqual(updated);
  });

  it("should delete a subscription", async () => {
    mockRepo.delete.mockResolvedValue({ rows: [{ subscription_type_id: 1 }] });

    const res = await request(app).delete("/subscriptions/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("should return 404 if delete target does not exist", async () => {
    mockRepo.delete.mockResolvedValue({ rows: [] });

    const res = await request(app).delete("/subscriptions/999");

    expect(res.statusCode).toBe(404);
  });
});
