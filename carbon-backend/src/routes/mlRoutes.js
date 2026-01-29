const express = require("express");
const axios = require("axios");
const router = express.Router();

// Proxy route for ML prediction
router.get("/predict", async (req, res) => {
    try {
        const { state, area } = req.query;

        if (!state || !area) {
            return res.status(400).json({ status: "error", message: "State and area are required" });
        }

        const mlApiUrl = process.env.ML_API_URL;
        if (!mlApiUrl) {
            console.error("ML_API_URL is not defined in environment variables.");
            return res.status(500).json({ status: "error", message: "Server configuration error" });
        }

        // Forward request to ML server
        const response = await axios.get(`${mlApiUrl}/predict`, {
            params: { state, area },
        });

        // Send ML server response back to frontend
        res.json(response.data);
    } catch (error) {
        console.error("Error proxying to ML server:", error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            res.status(503).json({ status: "error", message: "ML Service Unavailable" });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    }
});

module.exports = router;
