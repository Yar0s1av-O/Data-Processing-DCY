const express = require("express");
const formatResponse = require('../utils/formatResponse');
console.log("formatResponse in ExportService:", formatResponse);


class ExportService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Export all users
        this.router.get("/users", this.exportUsers.bind(this));
        // Export all profiles
        this.router.get("/profiles", this.exportProfiles.bind(this));
        // Export all subscriptions
        this.router.get("/subscriptions", this.exportSubscriptions.bind(this));
        
    }

    async exportUsers(req, res) {
        const format = req.query.format || "json"; // Default format is JSON
        try {
            const users = await this.db.query('SELECT * FROM "Users"');
            const formattedResponse = formatResponse(users.rows, format, "users");
            if (format === "xml") {
                res.set("Content-Type", "application/xml");
            } else {
                res.set("Content-Type", "application/json");
            }
            res.status(200).send(formattedResponse);
        } catch (error) {
            console.error("Error exporting users:", error);
            res.status(500).send({ error: "Failed to export users" });
        }
    }

    async exportProfiles(req, res) {
        const format = req.query.format || "json"; // Default format is JSON
        try {
            const profiles = await this.db.query('SELECT * FROM "Profiles"');
            const formattedResponse = formatResponse(profiles.rows, format, "profiles");
            if (format === "xml") {
                res.set("Content-Type", "application/xml");
            } else {
                res.set("Content-Type", "application/json");
            }
            res.status(200).send(formattedResponse);
        } catch (error) {
            console.error("Error exporting profiles:", error);
            res.status(500).send({ error: "Failed to export profiles" });
        }
    }

    async exportSubscriptions(req, res) {
        const format = req.query.format || "json"; // Default format is JSON
        try {
            const subscriptions = await this.db.query('SELECT * FROM "Subscriptions"');
            const formattedResponse = formatResponse(subscriptions.rows, format, "subscriptions");
            if (format === "xml") {
                res.set("Content-Type", "application/xml");
            } else {
                res.set("Content-Type", "application/json");
            }
            res.status(200).send(formattedResponse);
        } catch (error) {
            console.error("Error exporting subscriptions:", error);
            res.status(500).send({ error: "Failed to export subscriptions" });
        }
    }
    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = ExportService;