const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./db'); // Import db instance

async function ensureKioskProvisioned() {
    const existing = db.prepare('SELECT * FROM kiosk LIMIT 1').get();
    if (existing) return existing;

    const uuid = uuidv4();

    try {
        const requestBody = {
            uuid: uuid,
            company_id: 1,
            channel_id: 2,
            meta: {
                version: "0.0.1",
                location: "Main Entrance"
            }
        };

        console.log('Provisioning kiosk with data:', requestBody);

        const res = await axios.post('https://blup.com/api/kiosks/provision', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        console.log('Provision response:', res.data);

        const { token, channel_id, kiosk_id } = res.data;

        db.prepare(`
            INSERT INTO kiosk (uuid, token, channel_id, kiosk_id)
            VALUES (?, ?, ?, ?)
        `).run(uuid, token, channel_id, kiosk_id);

        console.log('Kiosk provisioned successfully with token:', token);
        return { uuid, token, channel_id, kiosk_id };
    } catch (error) {
        console.error('Failed to provision kiosk:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { ensureKioskProvisioned };
