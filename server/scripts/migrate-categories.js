/**
 * One-time migration script to normalize item categories.
 *
 * Mapping:
 *   "Furniture"              -> "Dorm & Home"
 *   "Books/ notes"           -> "Books"
 *   "Books/notes"            -> "Books"
 *   "Miscellaneous"          -> "Other"
 *   "For Fun"                -> "Other"
 *   "for fun"                -> "Other"
 *   "Vehicle"                -> "Other"
 *   "vehicle"                -> "Other"
 *   "Tickets"                -> "Tickets & Events"
 *   "tickets"                -> "Tickets & Events"
 *   "Electronics"            -> "Electronics" (no-op)
 *   "electronics"            -> "Electronics"
 *   "Apparel"                -> "Apparel" (no-op)
 *   "apparel"                -> "Apparel"
 *
 * Usage:
 *   node server/scripts/migrate-categories.js
 *   (requires DATABASE_ACCESS env var or .env file)
 *
 *   OR hit POST /api/admin/migrate-categories on the running server.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const CATEGORY_MAP = {
    'furniture':     'Dorm & Home',
    'books/ notes':  'Books',
    'books/notes':   'Books',
    'miscellaneous': 'Other',
    'for fun':       'Other',
    'vehicle':       'Other',
    'tickets':       'Tickets & Events',
    'electronics':   'Electronics',
    'apparel':       'Apparel',
};

const VALID_CATEGORIES = ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other'];

async function migrate() {
    const uri = process.env.DATABASE_ACCESS || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('No MongoDB URI found. Set DATABASE_ACCESS in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collection = db.collection('Item');

    const items = await collection.find({}).toArray();
    let updated = 0;
    let skipped = 0;
    let unmapped = [];

    for (const item of items) {
        const oldCat = item.category;
        if (!oldCat) { skipped++; continue; }

        if (VALID_CATEGORIES.includes(oldCat)) { skipped++; continue; }

        const mapped = CATEGORY_MAP[oldCat.toLowerCase().trim()];
        if (mapped) {
            await collection.updateOne({ _id: item._id }, { $set: { category: mapped } });
            console.log(`  ✓ "${oldCat}" -> "${mapped}"  (item: ${item.name || item._id})`);
            updated++;
        } else {
            console.log(`  ? Unknown category "${oldCat}" -> "Other"  (item: ${item.name || item._id})`);
            await collection.updateOne({ _id: item._id }, { $set: { category: 'Other' } });
            unmapped.push(oldCat);
            updated++;
        }
    }

    console.log(`\nMigration complete: ${updated} updated, ${skipped} already valid.`);
    if (unmapped.length > 0) {
        console.log('Unmapped categories defaulted to "Other":', [...new Set(unmapped)]);
    }

    await mongoose.disconnect();
}

if (require.main === module) {
    migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
}

module.exports = { migrate, CATEGORY_MAP, VALID_CATEGORIES };
