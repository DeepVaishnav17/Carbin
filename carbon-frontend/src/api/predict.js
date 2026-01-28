export default async function handler(req, res) {
    try {
        const { state, area } = req.query;

        const response = await fetch(
            `http://15.207.84.129:5000/predict?state=${state}&area=${area}`
        );

        const data = await response.json();

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Proxy failed", details: err.message });
    }
}
