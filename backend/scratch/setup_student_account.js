const User = require('../src/models/User');
const Badge = require('../src/models/Badge');
const UserBadge = require('../src/models/UserBadge');
const UserStat = require('../src/models/UserStat');
const { sequelize } = require('../src/config/database');
const bcrypt = require('bcryptjs');

require('dotenv').config();

async function setupStudent() {
    const email = process.env.TEST_STUDENT_EMAIL;
    const password = process.env.TEST_STUDENT_PASSWORD;
    const name = 'Lê Minh Phan';
    const role_id = 1; // Student

    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // 2. Create or update user
        let user = await User.findOne({ where: { email } });
        if (user) {
            console.log(`User ${email} already exists. Updating...`);
            await user.update({ name, password_hash, role_id });
        } else {
            console.log(`Creating user ${email}...`);
            user = await User.create({
                name,
                email,
                password_hash,
                role_id
            });
        }

        const userId = user.id;

        // 3. Setup User Stats (Full Achievements)
        let stats = await UserStat.findOne({ where: { user_id: userId } });
        const fullStats = {
            total_quizzes_taken: 100,
            total_perfect_scores: 50,
            current_streak_days: 30,
            max_streak_days: 30,
            total_live_wins: 20,
            total_monster_kills: 500,
            last_practice_date: new Date().toISOString().split('T')[0]
        };

        if (stats) {
            console.log('Updating user stats...');
            await stats.update(fullStats);
        } else {
            console.log('Creating user stats...');
            await UserStat.create({
                user_id: userId,
                ...fullStats
            });
        }

        // 4. Award all badges
        console.log('Awarding all badges...');
        const allBadges = await Badge.findAll();
        for (const badge of allBadges) {
            const existingUserBadge = await UserBadge.findOne({
                where: { user_id: userId, badge_id: badge.id }
            });
            if (!existingUserBadge) {
                await UserBadge.create({
                    user_id: userId,
                    badge_id: badge.id,
                    unlocked_at: new Date()
                });
            }
        }

        console.log('✅ Student account setup completed successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('❌ Error setting up student account:', error);
    } finally {
        await sequelize.close();
    }
}

setupStudent();
