const express = require("express");
const js2xmlparser = require("js2xmlparser");
const {
  validateCreateSubscription,
  validateUpdateSubscription,
  validatePaySubscription,
} = require("../validators/SubscriptionValidator");
const SubscriptionRepository = require("../repositories/SubscriptionRepository");

function formatResponse(req, res, data, status = 200) {
  const format = req.query.format;
  if (format === "xml") {
    res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
  } else {
    res.status(status).json(data);
  }
}

class SubscriptionService {
  constructor(db, repo = null) {
    this.db = db;
    this.subscriptionRepo = repo || new SubscriptionRepository(this.db);
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post("/create", this.createSubscription.bind(this));
    this.router.post("/pay", this.paySubscription.bind(this));
    this.router.get("/", this.getAllSubscription.bind(this));
    this.router.get("/:id", this.getSubscriptionById.bind(this));
    this.router.put("/:id", this.updateSubscription.bind(this));
    this.router.delete("/:id", this.deleteSubscription.bind(this));
  }

  async createSubscription(req, res) {
    const { error } = validateCreateSubscription(req.body);
    if (error) {
      return formatResponse(req, res, { message: error.details.map(err => err.message) }, 422);
    }

    const { subscription_name, subscription_price_euro } = req.body;

    try {
      await this.subscriptionRepo.create(subscription_name, subscription_price_euro);
      formatResponse(req, res, { message: "Subscription created successfully!" }, 201);
    } catch (err) {
      console.error("Error during subscription creation:", err.stack);
      formatResponse(req, res, { message: "Server error", error: err.message }, 500);
    }
  }

  async paySubscription(req, res) {
    const { error } = validatePaySubscription(req.body);
    if (error) {
      return formatResponse(req, res, { message: error.details.map(err => err.message) }, 422);
    }

    const { userid, subscription_type_id } = req.body;

    try {
      const result = await this.subscriptionRepo.pay(userid, subscription_type_id);
      const statusCode = result.rows?.[0]?.status_code;

      switch (statusCode) {
        case 404:
          return formatResponse(req, res, { message: "User not found.", status_code: 404 }, 404);
        case 422:
          return formatResponse(req, res, { message: "Invalid subscription type.", status_code: 422 }, 422);
        case 403:
          return formatResponse(req, res, { message: "Subscription is still active.", status_code: 403 }, 403);
        case 200:
          return formatResponse(req, res, { message: "Subscription payment processed successfully.", status_code: 200 }, 200);
        default:
          return formatResponse(req, res, { message: "Unexpected status code.", status_code }, 500);
      }
    } catch (err) {
      console.error("Error during subscription payment:", err.message);
      formatResponse(req, res, { message: "Server error", error: err.message }, 500);
    }
  }

  async getAllSubscription(req, res) {
    try {
      const result = await this.subscriptionRepo.getAll();
      formatResponse(req, res, result.rows, 200);
    } catch (err) {
      console.error("Error fetching subscriptions:", err.stack);
      formatResponse(req, res, { message: "Failed to retrieve subscriptions.", error: err.message }, 500);
    }
  }

  async getSubscriptionById(req, res) {
    const { id } = req.params;

    try {
      const result = await this.subscriptionRepo.getById(id);
      if (!result.rows.length) {
        return formatResponse(req, res, { message: "Subscription not found." }, 404);
      }
      formatResponse(req, res, result.rows[0], 200);
    } catch (err) {
      console.error(`Error fetching subscription by ID (${id}):`, err.stack);
      formatResponse(req, res, { message: "Failed to retrieve subscription.", error: err.message }, 500);
    }
  }

  async updateSubscription(req, res) {
    const { error } = validateUpdateSubscription(req.body);
    if (error) {
      return formatResponse(req, res, { message: error.details.map(err => err.message) }, 422);
    }

    const { id } = req.params;
    const { subscription_name, subscription_price_euro } = req.body;

    try {
      const result = await this.subscriptionRepo.update(id, subscription_name, subscription_price_euro);
      if (!result.rows.length) {
        return formatResponse(req, res, { message: "Subscription not found." }, 404);
      }

      formatResponse(req, res, {
        message: "Subscription updated successfully!",
        subscription: result.rows[0],
      }, 200);
    } catch (err) {
      console.error(`Error updating subscription with ID (${id}):`, err.stack);
      formatResponse(req, res, { message: "Failed to update subscription.", error: err.message }, 500);
    }
  }

  async deleteSubscription(req, res) {
    const { id } = req.params;

    try {
      const result = await this.subscriptionRepo.delete(id);
      if (!result.rows.length) {
        return formatResponse(req, res, { message: "Subscription not found." }, 404);
      }

      formatResponse(req, res, { message: "Subscription deleted successfully!" }, 200);
    } catch (err) {
      console.error(`Error deleting subscription with ID (${id}):`, err.stack);
      formatResponse(req, res, { message: "Failed to delete subscription.", error: err.message }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SubscriptionService;
