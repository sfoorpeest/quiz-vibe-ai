const { sequelize } = require('./config/database');

async function addTagsColumn() {
    try {
        await sequelize.query('ALTER TABLE materials ADD COLUMN tags TEXT;');
        console.log('Added tags column successfully');
    } catch (err) {
        if (err.parent && err.parent.errno === 1060) {
            console.log('Column tags already exists');
        } else {
            console.error('Error adding column:', err);
        }
    } finally {
        process.exit();
    }
}

addTagsColumn();
