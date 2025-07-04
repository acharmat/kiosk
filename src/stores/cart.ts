import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { apiService } from '@/services/apiService'
import type { CartItem, Product, Transaction, PaymentMethod } from '@/types'

export const useCartStore = defineStore('cart', () => {
    // State
    const items = ref<CartItem[]>([])
    const selectedChannel = ref<number | null>(null)
    const selectedCategory = ref<number | null>(null)
    const currentTransaction = ref<Transaction | null>(null)
    const paymentMethod = ref<PaymentMethod | null>(null)
    const isProcessingPayment = ref(false)
    const paymentError = ref<string | null>(null)

    // Computed
    const itemCount = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0)
    })

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
    })

    const formattedTotal = computed(() => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR'
        }).format(totalAmount.value)
    })

    const isEmpty = computed(() => items.value.length === 0)

    const canCheckout = computed(() => {
        return !isEmpty.value && !isProcessingPayment.value
    })

    // Actions
    const addItem = (product: Product, quantity: number = 1): void => {
        const existingItem = items.value.find(item => item.productId === product.id)

        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            const cartItem: CartItem = {
                id: uuidv4(),
                productId: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                quantity,
                addedAt: new Date()
            }
            items.value.push(cartItem)
        }
    }

    const removeItem = (itemId: string): void => {
        const index = items.value.findIndex(item => item.id === itemId)
        if (index > -1) {
            items.value.splice(index, 1)
        }
    }

    const updateQuantity = (itemId: string, quantity: number): void => {
        const item = items.value.find(item => item.id === itemId)
        if (item) {
            if (quantity <= 0) {
                removeItem(itemId)
            } else {
                item.quantity = quantity
            }
        }
    }

    const incrementQuantity = (itemId: string): void => {
        const item = items.value.find(item => item.id === itemId)
        if (item) {
            item.quantity += 1
        }
    }

    const decrementQuantity = (itemId: string): void => {
        const item = items.value.find(item => item.id === itemId)
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1
            } else {
                removeItem(itemId)
            }
        }
    }

    const clearCart = (): void => {
        items.value = []
        currentTransaction.value = null
        paymentMethod.value = null
        paymentError.value = null
    }

    const setSelectedChannel = (channelId: number): void => {
        selectedChannel.value = channelId
        // Clear category selection when channel changes
        selectedCategory.value = null
    }

    const setSelectedCategory = (categoryId: number): void => {
        selectedCategory.value = categoryId
    }

    const processCheckout = async (
        slotNumber: number,
        selectedPaymentMethod: PaymentMethod,
        paymentData?: any,
        customerData?: any
    ): Promise<Transaction> => {
        if (isEmpty.value) {
            throw new Error('Cart is empty')
        }

        isProcessingPayment.value = true
        paymentError.value = null

        try {
            // For now, process single item transactions
            // In a real implementation, you might want to process multiple items
            const firstItem = items.value[0]

            const transactionData = {
                slot_number: slotNumber,
                product_id: firstItem.productId,
                quantity: firstItem.quantity,
                payment_method: selectedPaymentMethod,
                payment_data: paymentData,
                customer_data: customerData,
                transaction_ref: uuidv4()
            }

            const response = await apiService.processTransaction(transactionData)

            if (response.success) {
                const transaction: Transaction = {
                    uuid: response.data.transaction_uuid,
                    slotNumber,
                    items: [...items.value],
                    totalAmount: totalAmount.value,
                    paymentMethod: selectedPaymentMethod,
                    paymentData,
                    customerData,
                    status: 'completed',
                    createdAt: new Date(),
                    remainingStock: response.data.remaining_stock
                }

                currentTransaction.value = transaction
                paymentMethod.value = selectedPaymentMethod

                // Store transaction locally for receipt
                if (window.electronAPI) {
                    await window.electronAPI.dbRun(
                        'INSERT INTO transactions (uuid, slot_number, product_id, quantity, payment_method, total_amount, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            transaction.uuid,
                            slotNumber,
                            firstItem.productId,
                            firstItem.quantity,
                            selectedPaymentMethod,
                            totalAmount.value,
                            1, // Already synced since we got a response
                            Date.now()
                        ]
                    )
                }

                return transaction
            } else {
                throw new Error(response.error || 'Transaction failed')
            }
        } catch (error) {
            paymentError.value = error instanceof Error ? error.message : 'Payment processing failed'

            // Store failed transaction for retry
            if (window.electronAPI) {
                const failedTransaction = {
                    uuid: uuidv4(),
                    slotNumber,
                    items: [...items.value],
                    totalAmount: totalAmount.value,
                    paymentMethod: selectedPaymentMethod,
                    paymentData,
                    customerData,
                    error: paymentError.value
                }

                await window.electronAPI.addToSyncQueue('failed_transaction', failedTransaction)
            }

            throw error
        } finally {
            isProcessingPayment.value = false
        }
    }

    const processOfflineTransaction = async (
        slotNumber: number,
        selectedPaymentMethod: PaymentMethod,
        paymentData?: any,
        customerData?: any
    ): Promise<Transaction> => {
        if (isEmpty.value) {
            throw new Error('Cart is empty')
        }

        const transaction: Transaction = {
            uuid: uuidv4(),
            slotNumber,
            items: [...items.value],
            totalAmount: totalAmount.value,
            paymentMethod: selectedPaymentMethod,
            paymentData,
            customerData,
            status: 'pending_sync',
            createdAt: new Date()
        }

        // Store transaction for later sync
        if (window.electronAPI) {
            const firstItem = items.value[0]

            await window.electronAPI.dbRun(
                'INSERT INTO transactions (uuid, slot_number, product_id, quantity, payment_method, total_amount, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    transaction.uuid,
                    slotNumber,
                    firstItem.productId,
                    firstItem.quantity,
                    selectedPaymentMethod,
                    totalAmount.value,
                    0, // Not synced yet
                    Date.now()
                ]
            )

            // Add to sync queue
            await window.electronAPI.addToSyncQueue('transaction', {
                slot_number: slotNumber,
                product_id: firstItem.productId,
                quantity: firstItem.quantity,
                payment_method: selectedPaymentMethod,
                payment_data: paymentData,
                customer_data: customerData,
                transaction_ref: transaction.uuid
            })
        }

        currentTransaction.value = transaction
        paymentMethod.value = selectedPaymentMethod

        return transaction
    }

    const retryFailedTransactions = async (): Promise<void> => {
        if (!window.electronAPI) return

        try {
            const syncQueue = await window.electronAPI.getSyncQueue()
            const transactionItems = syncQueue.filter(item => item.type === 'transaction')

            for (const item of transactionItems) {
                try {
                    const data = JSON.parse(item.data)
                    const response = await apiService.processTransaction(data)

                    if (response.success) {
                        // Mark as synced in local database
                        await window.electronAPI.dbRun(
                            'UPDATE transactions SET synced = 1 WHERE uuid = ?',
                            [data.transaction_ref]
                        )

                        // Remove from sync queue
                        await window.electronAPI.removeFromSyncQueue(item.id)
                    }
                } catch (error) {
                    console.error('Failed to retry transaction:', error)
                    // Increment retry count could be implemented here
                }
            }
        } catch (error) {
            console.error('Failed to retry transactions:', error)
        }
    }

    const getTransactionHistory = async (): Promise<Transaction[]> => {
        if (!window.electronAPI) return []

        try {
            const transactions = await window.electronAPI.dbQuery(
                'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50'
            )

            return transactions.map(tx => ({
                uuid: tx.uuid,
                slotNumber: tx.slot_number,
                items: [], // Would need to reconstruct from additional tables
                totalAmount: tx.total_amount,
                paymentMethod: tx.payment_method as PaymentMethod,
                status: tx.synced ? 'completed' : 'pending_sync',
                createdAt: new Date(tx.created_at)
            }))
        } catch (error) {
            console.error('Failed to get transaction history:', error)
            return []
        }
    }

    const calculateTax = (amount: number, taxRate: number = 0.19): number => {
        return amount * taxRate
    }

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR'
        }).format(price)
    }

    return {
        // State
        items,
        selectedChannel,
        selectedCategory,
        currentTransaction,
        paymentMethod,
        isProcessingPayment,
        paymentError,

        // Computed
        itemCount,
        totalAmount,
        formattedTotal,
        isEmpty,
        canCheckout,

        // Actions
        addItem,
        removeItem,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        setSelectedChannel,
        setSelectedCategory,
        processCheckout,
        processOfflineTransaction,
        retryFailedTransactions,
        getTransactionHistory,
        calculateTax,
        formatPrice
    }
})