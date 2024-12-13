
const express = require("express");
const formatResponse = require('../utils/formatHelper');

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

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = ExportService;
