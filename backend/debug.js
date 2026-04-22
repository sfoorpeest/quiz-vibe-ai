const { Op } = require('sequelize');
const User = require('./src/models/User');
const { connectDB } = require('./src/config/database');

async function test() {
    await connectDB();
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role_id']
        });
        console.log("USERS IN DB:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit();
}

test();
