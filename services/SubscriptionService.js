const express = require("express");
const js2xmlparser = require("js2xmlparser");

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === "xml") {
        res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
    } else {
        res.status(status).json(data);
    }
}

class SubscriptionService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // CREATE: Add a new subscription
        this.router.post("/create", this.createSubscription.bind(this));

        // Pay subscription for a user
        this.router.post("/pay", this.paySubscription.bind(this));

        // READ: Get all subscriptions
        this.router.get("/", this.getAllSubscription.bind(this));

        // READ: Get a specific subscription by ID
        this.router.get("/:id", this.getSubscriptionById.bind(this));

        // UPDATE: Update a subscription
        this.router.put("/:id", this.updateSubscription.bind(this));

        // DELETE: Delete a subscription
        this.router.delete("/:id", this.deleteSubscription.bind(this));
    }

    async createSubscription(req, res) {
        const { subscription_type_id, subscription_name, subscription_price_euro } = req.body;

        try {
            await this.db.query(
                "CALL sp_insert_subscription($1, $2, $3)",
                [subscription_type_id, subscription_name, subscription_price_euro]
            );

            formatResponse(req, res, {
                message: "Subscription created successfully!",
            }, 201);
        } catch (err) {
            console.error("Error during subscription creation:", err.stack);
            formatResponse(req, res, { message: "Server error", error: err.message }, 500);
        }
    }

    async paySubscription(req, res) {
        const { userid, subscription_type_id } = req.body;

        if (!userid || !subscription_type_id) {
            return formatResponse(req, res, { message: "User ID and Subscription Type ID are required." }, 400);
        }

        try {
            const result = await this.db.query(
                "CALL public.sp_pay_subscription($1, $2, $3)",
                [userid, subscription_type_id, null]
            );

            const statusCode = result.rows[0]?.status_code || null;

            if (statusCode === 404) {
                formatResponse(req, res, { message: "User not found.", status_code: 404 }, 404);
            } else if (statusCode === 422) {
                formatResponse(req, res, { message: "Invalid subscription type.", status_code: 422 }, 422);
            } else if (statusCode === 403) {
                formatResponse(req, res, { message: "Subscription is still active.", status_code: 403 }, 403);
            } else if (statusCode === 200) {
                formatResponse(req, res, { message: "Subscription payment processed successfully.", status_code: 200 }, 200);
            } else {
                formatResponse(req, res, { message: "Unexpected status code.", status_code }, 500);
            }
        } catch (err) {
            console.error("Error during subscription payment:", err.message);
            formatResponse(req, res, { message: "Server error", error: err.message }, 500);
        }
    }

    async getAllSubscription(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Subscriptions"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error("Error fetching subscriptions:", err.stack);
            formatResponse(req, res, { message: "Failed to retrieve subscriptions.", error: err.message }, 500);
        }
    }

    async getSubscriptionById(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query('SELECT * FROM "Subscriptions" WHERE subscription_type_id = $1', [id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: "Subscription not found." }, 404);
            }

            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error(`Error fetching subscription by ID (${id}):`, err.stack);
            formatResponse(req, res, { message: "Failed to retrieve subscription.", error: err.message }, 500);
        }
    }

    async updateSubscription(req, res) {
        const { id } = req.params;
        const { subscription_name, subscription_price_euro } = req.body;

        try {
            const result = await this.db.query(
                `UPDATE "Subscriptions"
                 SET subscription_name = COALESCE($1, subscription_name),
                     subscription_price_euro = COALESCE($2, subscription_price_euro)
                 WHERE subscription_type_id = $3
                 RETURNING subscription_type_id, subscription_name, subscription_price_euro`,
                [subscription_name, subscription_price_euro, id]
            );

            if (result.rows.length === 0) {
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
            const result = await this.db.query(
                'DELETE FROM "Subscriptions" WHERE subscription_type_id = $1 RETURNING subscription_type_id',
                [id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: "Subscription not found." }, 404);
            }

            formatResponse(req, res, { message: "Subscription deleted successfully!" }, 200);
        } catch (err) {
            console.error(`Error deleting subscription with ID (${id}):`, err.stack);
            formatResponse(req, res, { message: "Failed to delete subscription.", error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = SubscriptionService;