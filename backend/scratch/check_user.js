const { sequelize } = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function checkUser() {
  try {
    const results = await sequelize.query(
      'SELECT user_id, avatar_url FROM user_profiles WHERE user_id = 7',
      { type: QueryTypes.SELECT }
    );
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
