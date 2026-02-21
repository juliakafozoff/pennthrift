/**
 * Migration script to populate usernameLower for existing users
 * Run this once after deploying the username change feature
 * 
 * Usage: node server/scripts/migrate-usernames.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connection = require('../db-config');

async function migrateUsernames() {
    try {
        console.log('🔄 Starting username migration...');
        
        // Find all users without usernameLower
        const users = await User.find({
            $or: [
                { usernameLower: { $exists: false } },
                { usernameLower: null }
            ]
        });

        console.log(`📊 Found ${users.length} users to migrate`);

        let migrated = 0;
        let errors = 0;

        for (const user of users) {
            try {
                if (user.username) {
                    user.usernameLower = user.username.toLowerCase();
                    await user.save();
                    migrated++;
                    if (migrated % 10 === 0) {
                        console.log(`✅ Migrated ${migrated} users...`);
                    }
                }
            } catch (err) {
                console.error(`❌ Error migrating user ${user.username || user._id}:`, err.message);
                errors++;
            }
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📊 Total: ${users.length}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

// Run migration
migrateUsernames();


