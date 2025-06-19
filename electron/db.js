const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../data', 'kiosk.sqlite');

const db = new Database(dbPath);

// Create tables if not exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS kiosk (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                         uuid TEXT UNIQUE,
                                         token TEXT,
                                         channel_id INTEGER,
                                         kiosk_id INTEGER
    );
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
                                              id INTEGER PRIMARY KEY,
                                              name TEXT,
                                              image TEXT,
                                              count INTEGER
    );
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        price REAL,
        description TEXT,
        image TEXT,
        category_id INTEGER,
        available BOOLEAN,
        updated_at TEXT
    );
`).run();


const getToken = () => {
    const row = db.prepare('SELECT token FROM kiosk LIMIT 1').get();
    return row?.token;
};

// ------------------------
// CATEGORY LOGIC
// ------------------------
const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, image, count)
  VALUES (@id, @name, @image, @count)
`);

const getLocalCategories = () => {
    return db.prepare('SELECT * FROM categories ORDER BY count DESC').all();
};

const saveCategories = (categories) => {
    const transaction = db.transaction((cats) => {
        for (const cat of cats) {
            insertCategory.run(cat);
        }
    });

    transaction(categories);
};

// ------------------------
// PRODUCT LOGIC
// ------------------------
const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (id, name, price, description, image, category_id, available, updated_at)
    VALUES (
        @id,
        @name,
        @price,
        @description,
        @image,
        @category_id,
        @available,
        @updated_at
    )
`);

// Debug version of your database functions
// Add extensive logging to find the exact source of the error

function getLocalProducts(categoryId) {
    try {
        const stmt = db.prepare('SELECT * FROM products WHERE category_id = @category_id');
        return stmt.all({ category_id: categoryId });
    } catch (error) {
        console.error('❌ ERROR in getLocalProducts (named param):', error.message);
    }
}

function saveProducts(products, categoryId) {
    try {
        // Check if products is an array and has the expected structure
        if (!Array.isArray(products) || products.length === 0) {
            console.log('⚠️ DEBUG: No products to save');
            return;
        }

        // Map the API response to your database structure
        const mappedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            description: product.description || '',
            image: product.image || '',
            category_id: categoryId, // Make sure this is set correctly
            available: 1,
            updated_at: new Date().toISOString()
        }));

        const transaction = db.transaction((prods) => {
            for (const prod of prods) {
                insertStmt.run(prod);
            }
        });

        transaction(mappedProducts);
    } catch (error) {
        console.error('❌ ERROR in saveProducts:', error.message);
        console.error('❌ ERROR stack:', error.stack);
        throw error;
    }
}


// Export the db instance for other modules
module.exports = {
    db, // Export the db instance itself
    getToken,
    getLocalCategories,
    saveCategories,
    getLocalProducts,
    saveProducts,
};

