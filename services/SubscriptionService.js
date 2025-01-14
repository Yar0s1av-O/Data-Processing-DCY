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
        console.log("Initializing SubscriptionService routes...");

        // CRUD Operations
        this.router.post("/create", this.createSubscription.bind(this));
        this.router.get("/", this.getAllSubscriptions.bind(this));
        this.router.get("/:id", this.getSubscriptionById.bind(this));
        this.router.put("/:id", this.updateSubscription.bind(this));
        this.router.delete("/:id", this.deleteSubscription.bind(this));
    }

    async createSubscription(req, res) {
        const { subscription_type_id, subscription_name, subscription_price_euro } = req.body;

        try {
            await this.db.query(
                "INSERT INTO \"Subscriptions\" (subscription_type_id, subscription_name, subscription_price_euro) VALUES ($1, $2, $3)",
                [subscription_type_id, subscription_name, subscription_price_euro]
            );

            formatResponse(req, res, { message: "Subscription created successfully!" }, 201);
        } catch (err) {
            console.error("Error during subscription creation:", err.stack);
            formatResponse(req, res, { message: "Server error", error: err.message }, 500);
        }
    }

    async getAllSubscriptions(req, res) {
        try {
            const result = await this.db.query("SELECT * FROM \"Subscriptions\"");
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error("Error fetching subscriptions:", err.stack);
            formatResponse(req, res, { message: "Failed to retrieve subscriptions.", error: err.message }, 500);
        }
    }

    async getSubscriptionById(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query(
                "SELECT * FROM \"Subscriptions\" WHERE subscription_type_id = $1",
                [id]
            );

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
                `UPDATE \"Subscriptions\"
                 SET subscription_name = COALESCE($1, subscription_name),
                     subscription_price_euro = COALESCE($2, subscription_price_euro)
                 WHERE subscription_type_id = $3
                 RETURNING *`,
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
                'DELETE FROM \"Subscriptions\" WHERE subscription_type_id = $1 RETURNING subscription_type_id',
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
