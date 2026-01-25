/**
 * AQI Utility Functions
 * Centralized logic for category mapping, color mapping, and health advice
 */

// AQI Category Definitions
export const AQI_CATEGORIES = {
    GOOD: {
        name: "Good",
        range: [0, 50],
        bgColor: "#1db854", // Bright green for good
        textColor: "#ffffff",
        darkBg: "#0d4d2b",
        description: "Air quality is satisfactory",
    },
    MODERATE: {
        name: "Moderate",
        range: [51, 100],
        bgColor: "#7cb342", // Lime green
        textColor: "#ffffff",
        darkBg: "#423f2a",
        description: "Acceptable air quality",
    },
    UNHEALTHY_FOR_SENSITIVE: {
        name: "Unhealthy for Sensitive Groups",
        range: [101, 150],
        bgColor: "#fdd835", // Yellow
        textColor: "#000000",
        darkBg: "#4a4a00",
        description: "Sensitive groups may experience health effects",
    },
    UNHEALTHY: {
        name: "Unhealthy",
        range: [151, 200],
        bgColor: "#fb8c00", // Orange
        textColor: "#ffffff",
        darkBg: "#5a3a00",
        description: "Everyone may begin to experience health effects",
    },
    VERY_UNHEALTHY: {
        name: "Very Unhealthy",
        range: [201, 300],
        bgColor: "#e53935", // Red
        textColor: "#ffffff",
        darkBg: "#4a0000",
        description: "Health alert: everyone may experience serious health effects",
    },
    HAZARDOUS: {
        name: "Hazardous",
        range: [301, 500],
        bgColor: "#6a1b9a", // Purple
        textColor: "#ffffff",
        darkBg: "#2a0035",
        description: "Health warning of emergency conditions",
    },
};

/**
 * Get AQI category object based on AQI value
 * @param {number} aqi - AQI value
 * @returns {object} Category object
 */
export const getAQICategory = (aqi) => {
    if (aqi <= 50) return AQI_CATEGORIES.GOOD;
    if (aqi <= 100) return AQI_CATEGORIES.MODERATE;
    if (aqi <= 150) return AQI_CATEGORIES.UNHEALTHY_FOR_SENSITIVE;
    if (aqi <= 200) return AQI_CATEGORIES.UNHEALTHY;
    if (aqi <= 300) return AQI_CATEGORIES.VERY_UNHEALTHY;
    return AQI_CATEGORIES.HAZARDOUS;
};

/**
 * Get color for AQI value (for charts)
 * @param {number} aqi - AQI value
 * @returns {string} Hex color code
 */
export const getAQIColor = (aqi) => {
    const category = getAQICategory(aqi);
    return category.bgColor;
};

/**
 * Determine if it's safe to go outside
 * @param {number} aqi - AQI value
 * @returns {object} Decision object {status, icon, color, advice}
 */
export const getGoOutsideDecision = (aqi) => {
    if (aqi <= 50) {
        return {
            status: "Safe",
            icon: "check",
            color: "#1db854",
            advice: "Perfect conditions for outdoor activities",
        };
    }
    if (aqi <= 100) {
        return {
            status: "Safe",
            icon: "check",
            color: "#7cb342",
            advice: "Good for most outdoor activities",
        };
    }
    if (aqi <= 150) {
        return {
            status: "Caution",
            icon: "warning",
            color: "#fdd835",
            advice: "Sensitive groups should limit outdoor activities",
        };
    }
    if (aqi <= 200) {
        return {
            status: "Caution",
            icon: "warning",
            color: "#fb8c00",
            advice: "Limit outdoor exposure for all",
        };
    }
    if (aqi <= 300) {
        return {
            status: "Avoid",
            icon: "close",
            color: "#e53935",
            advice: "Avoid outdoor activities",
        };
    }
    return {
        status: "Avoid",
        icon: "close",
        color: "#6a1b9a",
        advice: "Avoid all outdoor activities immediately",
    };
};

/**
 * Get health advisory based on AQI value
 * @param {number} aqi - AQI value
 * @returns {object} Health advice object
 */
export const getHealthAdvice = (aqi) => {
    const category = getAQICategory(aqi);

    const advice = {
        GOOD: {
            general: "Air quality is satisfactory. Enjoy outdoor activities freely.",
            sensitive: "No restrictions for sensitive groups.",
            vulnerable: "No restrictions. Great time for outdoor exercise.",
        },
        MODERATE: {
            general: "Air quality is acceptable for most people.",
            sensitive:
                "Unusually sensitive people should consider limiting prolonged outdoor activities.",
            vulnerable:
                "People with respiratory conditions should limit strenuous outdoor activities.",
        },
        UNHEALTHY_FOR_SENSITIVE: {
            general:
                "Members of sensitive groups may experience health effects. General public less likely affected.",
            sensitive:
                "Limit prolonged outdoor activities. Keep activity level moderate.",
            vulnerable:
                "Avoid strenuous outdoor activities. Consider staying indoors or reducing time outside.",
        },
        UNHEALTHY: {
            general:
                "Everyone may experience health effects. Limit outdoor activities.",
            sensitive: "Significantly restrict all outdoor activities.",
            vulnerable:
                "Avoid all outdoor activity. Seek medical attention if symptoms worsen.",
        },
        VERY_UNHEALTHY: {
            general:
                "Health alert: health effects may occur in general population. Avoid outdoor activities.",
            sensitive: "Avoid all outdoor activities completely.",
            vulnerable:
                "Stay indoors and maintain indoor air quality. Seek medical care.",
        },
        HAZARDOUS: {
            general:
                "Health warning of emergency conditions. Avoid all outdoor activities.",
            sensitive: "Remain indoors and keep activity levels low.",
            vulnerable:
                "Remain indoors. Seek immediate medical care if experiencing symptoms.",
        },
    };

    const categoryName = category.name.toUpperCase().replace(/ /g, "_");
    return advice[categoryName] || advice.MODERATE;
};

/**
 * Get pollutant info based on AQI level
 * @param {number} aqi - AQI value
 * @returns {array} Pollutant information
 */
export const getPollutantInfo = (aqi) => {
    if (aqi <= 50) {
        return [
            { name: "PM2.5", level: "Good" },
            { name: "PM10", level: "Good" },
            { name: "NO₂", level: "Good" },
        ];
    }
    if (aqi <= 100) {
        return [
            { name: "PM2.5", level: "Moderate" },
            { name: "PM10", level: "Moderate" },
            { name: "NO₂", level: "Low" },
        ];
    }
    if (aqi <= 150) {
        return [
            { name: "PM2.5", level: "High" },
            { name: "PM10", level: "Moderate-High" },
            { name: "NO₂", level: "Moderate" },
        ];
    }
    if (aqi <= 200) {
        return [
            { name: "PM2.5", level: "Very High" },
            { name: "PM10", level: "High" },
            { name: "NO₂", level: "High" },
        ];
    }
    return [
        { name: "PM2.5", level: "Critical" },
        { name: "PM10", level: "Very High" },
        { name: "NO₂", level: "Very High" },
    ];
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (typeof date === "string") {
        date = new Date(date);
    }
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};

/**
 * Get day name from date
 * @param {Date|string} date - Date to get day name from
 * @returns {string} Day name (Mon, Tue, etc.)
 */
export const getDayName = (date) => {
    if (typeof date === "string") {
        date = new Date(date);
    }
    return date.toLocaleDateString("en-US", { weekday: "short" });
};

/**
 * Generate sample AQI forecast data for next 7 days
 * @returns {array} Array of forecast objects with real dates
 */
export const generateSampleForecast = () => {
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        // Generate realistic varying AQI values (50-250 range)
        const baseAQI = 80 + Math.sin(i) * 40 + Math.random() * 30;
        forecast.push({
            day: i + 1,
            date: date, // Pass as Date object
            dateString: date.toISOString().split("T")[0],
            aqi: Math.round(Math.max(30, Math.min(300, baseAQI))),
        });
    }

    return forecast;
};
