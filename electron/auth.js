const { db } = require('./db'); // Import db instance

function getAuthToken() {
    const kiosk = db.prepare('SELECT * FROM kiosk LIMIT 1').get();
    return kiosk?.token ?? null;
}

module.exports = { getAuthToken };
