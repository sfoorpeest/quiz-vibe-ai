const Badge = require('../src/models/Badge');
const { sequelize } = require('../src/config/database');

async function checkBadges() {
    try {
        await sequelize.authenticate();
        const badges = await Badge.findAll();
        console.log('Current Badges Count:', badges.length);
        if (badges.length > 0) {
            console.log('Sample Badge:', JSON.stringify(badges[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkBadges();
