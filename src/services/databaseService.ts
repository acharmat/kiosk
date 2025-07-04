import type { Channel, Category, Product, Transaction } from '@/types'

class DatabaseService {
    private isAvailable: boolean = false

    constructor() {
        this.isAvailable = !!window.electronAPI
    }

    private async query(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.isAvailable) {
            throw new Error('Database not available')
        }

        const result = await window.electronAPI.dbQuery(sql, params)
        return result || []
    }

    private async run(sql: string, params: any[] = []): Promise<any> {
        if (!this.isAvailable) {
            throw new Error('Database not available')
        }

        return await window.electronAPI.dbRun(sql, params)
    }

    // Channel operations
    async syncChannels(channels: Channel[]): Promise<void> {
        const timestamp = Date.now()

        for (const channel of channels) {
            await this.run(
                'INSERT OR REPLACE INTO channels (id, name, logo_url, description, is_active, sync_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                [channel.id, channel.name, channel.logo_url, channel.description, channel.is_active ? 1 : 0, timestamp]
            )
        }

        // Remove channels that weren't in the sync
        await this.run(
            'DELETE FROM channels WHERE sync_timestamp != ?',
            [timestamp]
        )
    }

    async getChannels(): Promise<Channel[]> {
        const rows = await this.query(
            'SELECT * FROM channels WHERE is_active = 1 ORDER BY name'
        )

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            logo_url: row.logo_url,
            description: row.description,
            is_active: row.is_active === 1
        }))
    }

    async getChannel(id: number): Promise<Channel | null> {
        const rows = await this.query(
            'SELECT * FROM channels WHERE id = ?',
            [id]
        )

        if (rows.length === 0) return null

        const row = rows[0]
        return {
            id: row.id,
            name: row.name,
            logo_url: row.logo_url,
            description: row.description,
            is_active: row.is_active === 1
        }
    }

    // Category operations
    async syncCategories(channelId: number, categories: Category[]): Promise<void> {
        const timestamp = Date.now()

        for (const category of categories) {
            await this.run(
                'INSERT OR REPLACE INTO categories (id, channel_id, name, image, products_count, sync_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                [category.id, channelId, category.name, category.image, category.products_count || 0, timestamp]
            )
        }

        // Remove categories for this channel that weren't in the sync
        await this.run(
            'DELETE FROM categories WHERE channel_id = ? AND sync_timestamp != ?',
            [channelId, timestamp]
        )
    }

    async getCategories(channelId: number): Promise<Category[]> {
        const rows = await this.query(
            'SELECT * FROM categories WHERE channel_id = ? ORDER BY products_count DESC, name',
            [channelId]
        )

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            image: row.image,
            products_count: row.products_count
        }))
    }

    async getCategory(id: number): Promise<Category | null> {
        const rows = await this.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        )

        if (rows.length === 0) return null

        const row = rows[0]
        return {
            id: row.id,
            name: row.name,
            image: row.image,
            products_count: row.products_count
        }
    }

    // Product operations
    async syncProducts(categoryId: number, products: Product[]): Promise<void> {
        const timestamp = Date.now()

        for (const product of products) {
            await this.run(
                'INSERT OR REPLACE INTO products (id, category_id, name, description, price, image, sync_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product.id, categoryId, product.name, product.description, product.price, product.image, timestamp]
            )
        }

        // Remove products for this category that weren't in the sync
        await this.run(
            'DELETE FROM products WHERE category_id = ? AND sync_timestamp != ?',
            [categoryId, timestamp]
        )
    }

    async getProducts(categoryId: number, limit?: number, offset?: number): Promise<Product[]> {
        let sql = 'SELECT * FROM products WHERE category_id = ? ORDER BY name'
        const params: any[] = [categoryId]

        if (limit) {
            sql += ' LIMIT ?'
            params.push(limit)

            if (offset) {
                sql += ' OFFSET ?'
                params.push(offset)
            }
        }

        const rows = await this.query(sql, params)

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image
        }))
    }

    async getProduct(id: number): Promise<Product | null> {
        const rows = await this.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        )

        if (rows.length === 0) return null

        const row = rows[0]
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image
        }
    }

    async searchProducts(query: string, channelId?: number): Promise<Product[]> {
        let sql = `
      SELECT p.* FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.description LIKE ?
    `
        const params: any[] = [`%${query}%`, `%${query}%`]

        if (channelId) {
            sql += ' AND c.channel_id = ?'
            params.push(channelId)
        }

        sql += ' ORDER BY p.name LIMIT 50'

        const rows = await this.query(sql, params)

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image
        }))
    }

    // Transaction operations
    async saveTransaction(transaction: Partial<Transaction>): Promise<boolean> {
        try {
            await this.run(
                'INSERT INTO transactions (uuid, slot_number, product_id, quantity, payment_method, total_amount, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    transaction.uuid,
                    transaction.slotNumber,
                    transaction.items?.[0]?.productId || null,
                    transaction.items?.[0]?.quantity || 1,
                    transaction.paymentMethod,
                    transaction.totalAmount,
                    0, // Not synced initially
                    Date.now()
                ]
            )
            return true
        } catch (error) {
            console.error('Failed to save transaction:', error)
            return false
        }
    }

    async getTransactions(limit = 50): Promise<any[]> {
        return await this.query(
            'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?',
            [limit]
        )
    }

    async getPendingTransactions(): Promise<any[]> {
        return await this.query(
            'SELECT * FROM transactions WHERE synced = 0 ORDER BY created_at ASC'
        )
    }

    async markTransactionSynced(uuid: string): Promise<boolean> {
        try {
            await this.run(
                'UPDATE transactions SET synced = 1 WHERE uuid = ?',
                [uuid]
            )
            return true
        } catch (error) {
            console.error('Failed to mark transaction as synced:', error)
            return false
        }
    }

    // Settings operations
    async getSetting(key: string): Promise<any> {
        const rows = await this.query(
            'SELECT value FROM app_settings WHERE key = ?',
            [key]
        )

        if (rows.length === 0) return null

        try {
            return JSON.parse(rows[0].value)
        } catch {
            return rows[0].value
        }
    }

    async setSetting(key: string, value: any): Promise<boolean> {
        try {
            await this.run(
                'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
                [key, JSON.stringify(value)]
            )
            return true
        } catch (error) {
            console.error('Failed to set setting:', error)
            return false
        }
    }

    // Cache management
    async getCacheStats(): Promise<{
        channels: number
        categories: number
        products: number
        transactions: number
        lastSync: Date | null
    }> {
        const channelCount = await this.query('SELECT COUNT(*) as count FROM channels')
        const categoryCount = await this.query('SELECT COUNT(*) as count FROM categories')
        const productCount = await this.query('SELECT COUNT(*) as count FROM products')
        const transactionCount = await this.query('SELECT COUNT(*) as count FROM transactions')

        const lastSync = await this.getSetting('last_sync_timestamp')

        return {
            channels: channelCount[0]?.count || 0,
            categories: categoryCount[0]?.count || 0,
            products: productCount[0]?.count || 0,
            transactions: transactionCount[0]?.count || 0,
            lastSync: lastSync ? new Date(lastSync) : null
        }
    }

    async clearCache(): Promise<boolean> {
        try {
            await this.run('DELETE FROM channels')
            await this.run('DELETE FROM categories')
            await this.run('DELETE FROM products')
            await this.setSetting('last_sync_timestamp', null)
            return true
        } catch (error) {
            console.error('Failed to clear cache:', error)
            return false
        }
    }

    async clearOldTransactions(daysOld = 30): Promise<number> {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)

        try {
            const result = await this.run(
                'DELETE FROM transactions WHERE created_at < ? AND synced = 1',
                [cutoffTime]
            )
            return result.changes || 0
        } catch (error) {
            console.error('Failed to clear old transactions:', error)
            return 0
        }
    }

    // Data validation and integrity
    async validateDataIntegrity(): Promise<{
        valid: boolean
        issues: string[]
    }> {
        const issues: string[] = []

        try {
            // Check for orphaned categories
            const orphanedCategories = await this.query(
                'SELECT COUNT(*) as count FROM categories WHERE channel_id NOT IN (SELECT id FROM channels)'
            )
            if (orphanedCategories[0]?.count > 0) {
                issues.push(`${orphanedCategories[0].count} orphaned categories found`)
            }

            // Check for orphaned products
            const orphanedProducts = await this.query(
                'SELECT COUNT(*) as count FROM products WHERE category_id NOT IN (SELECT id FROM categories)'
            )
            if (orphanedProducts[0]?.count > 0) {
                issues.push(`${orphanedProducts[0].count} orphaned products found`)
            }

            // Check for missing required fields
            const invalidChannels = await this.query(
                'SELECT COUNT(*) as count FROM channels WHERE name IS NULL OR name = ""'
            )
            if (invalidChannels[0]?.count > 0) {
                issues.push(`${invalidChannels[0].count} channels with missing names`)
            }

        } catch (error) {
            issues.push(`Database validation error: ${error}`)
        }

        return {
            valid: issues.length === 0,
            issues
        }
    }

    // Backup and restore
    async exportData(): Promise<{
        channels: Channel[]
        categories: Category[]
        products: Product[]
        settings: Record<string, any>
    }> {
        const channels = await this.getChannels()
        const allCategories: Category[] = []
        const allProducts: Product[] = []

        // Get all categories and products
        for (const channel of channels) {
            const categories = await this.getCategories(channel.id)
            allCategories.push(...categories)

            for (const category of categories) {
                const products = await this.getProducts(category.id)
                allProducts.push(...products)
            }
        }

        // Get all settings
        const settingsRows = await this.query('SELECT * FROM app_settings')
        const settings: Record<string, any> = {}

        for (const row of settingsRows) {
            try {
                settings[row.key] = JSON.parse(row.value)
            } catch {
                settings[row.key] = row.value
            }
        }

        return {
            channels,
            categories: allCategories,
            products: allProducts,
            settings
        }
    }

    async importData(data: {
        channels: Channel[]
        categories: Category[]
        products: Product[]
        settings: Record<string, any>
    }): Promise<boolean> {
        try {
            // Clear existing data
            await this.clearCache()

            // Import channels
            await this.syncChannels(data.channels)

            // Group and import categories by channel
            const categoriesByChannel = data.categories.reduce((acc, category) => {
                const channelId = category.channel_id || 1
                if (!acc[channelId]) acc[channelId] = []
                acc[channelId].push(category)
                return acc
            }, {} as Record<number, Category[]>)

            for (const [channelId, categories] of Object.entries(categoriesByChannel)) {
                await this.syncCategories(parseInt(channelId), categories)
            }

            // Group and import products by category
            const productsByCategory = data.products.reduce((acc, product) => {
                const categoryId = product.category_id || 1
                if (!acc[categoryId]) acc[categoryId] = []
                acc[categoryId].push(product)
                return acc
            }, {} as Record<number, Product[]>)

            for (const [categoryId, products] of Object.entries(productsByCategory)) {
                await this.syncProducts(parseInt(categoryId), products)
            }

            // Import settings
            for (const [key, value] of Object.entries(data.settings)) {
                await this.setSetting(key, value)
            }

            return true
        } catch (error) {
            console.error('Failed to import data:', error)
            return false
        }
    }
}

export const databaseService = new DatabaseService()