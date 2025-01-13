const express = require('express');
const js2xmlparser = require("js2xmlparser");

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
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
        this.router.post('/create', this.createSubscription.bind(this));

        // Pay subscription for user for a user
        this.router.post('/pay', this.paySubscription.bind(this));

        // READ: Get all subscriptions
        this.router.get('/', this.getAllSubscription.bind(this));

        // READ: Get a specific subscription by ID
        this.router.get('/:id', this.getSubscriptionById.bind(this));

        // UPDATE: Update a subscription
        this.router.put('/:id', this.updateSubscription.bind(this));

        // DELETE: Delete a subscription
        this.router.delete('/:id', this.deleteSubscription.bind(this));
    }

    async createSubscription(req, res) {
        const { subscription_type_id, subscription_name, subscription_price_euro} = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_subscription($1, $2, $3)',
                [subscription_type_id, subscription_name, subscription_price_euro]
            );

            formatResponse(req, res, {
                message: 'Subscription created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error during Subscription Creation:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    async paySubscription(req, res) {
        const { userid, subscription_type_id} = req.body;

        if (!userid || !subscription_type_id) {
            return formatResponse(req, res, { message: 'User ID and Subscription Type ID are required.' }, 400);
        }

        try {

            await this.db.query('BEGIN'); // Begin Transaction

            const result = await this.db.query(
                'CALL public.sp_pay_subscription($1, $2, $3)',
                [userid, subscription_type_id, null]
            );

            // Get status_code
            const statusCode = result.rows[0]?.status_code || null;

            if (statusCode === 404) {
                res.status(404).json({ message: 'User not found.', status_code: 404 });
            } else if (statusCode === 422) {
                res.status(422).json({ message: 'Invalid subscription type.', status_code: 422 });
            } else if (statusCode === 403) {
                res.status(403).json({ message: 'Subscription is still active.', status_code: 403 });
            } else if (statusCode === 200) {
                res.status(200).json({ message: 'Subscription updated successfully.', status_code: 200 });
            } else {
                res.status(500).json({ message: 'Unexpected status code.', status_code });
            }

            await this.db.query('COMMIT'); // Commit Transaction

        } catch (err) {
            await this.db.query('ROLLBACK'); // Rollback Transaction
            console.error('Transaction failed:', err.message);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }

    }

    async getAllSubscription(req, res) {
    }

    async getSubscriptionById(req, res) {
    }

    async updateSubscription(req, res) {
    }

    async deleteSubscription(req, res) {
    }

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = SubscriptionService;