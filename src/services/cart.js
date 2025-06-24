// src/services/cart.js
import { reactive, computed } from 'vue'

// Reactive cart state
const cartState = reactive({
    items: [],
    isOpen: false
})

// Cart service
export const cartService = {
    // Getters
    get items() {
        return cartState.items
    },

    get isOpen() {
        return cartState.isOpen
    },

    get itemCount() {
        return cartState.items.reduce((total, item) => total + item.quantity, 0)
    },

    get totalPrice() {
        return cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    get isEmpty() {
        return cartState.items.length === 0
    },

    // Actions
    addItem(product, quantity = 1) {
        const existingItem = cartState.items.find(item => item.id === product.id)

        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            cartState.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                description: product.description,
                quantity: quantity
            })
        }

        console.log(`Added ${quantity}x ${product.name} to cart`)
    },

    removeItem(productId) {
        const index = cartState.items.findIndex(item => item.id === productId)
        if (index !== -1) {
            const item = cartState.items[index]
            cartState.items.splice(index, 1)
            console.log(`Removed ${item.name} from cart`)
        }
    },

    updateQuantity(productId, quantity) {
        const item = cartState.items.find(item => item.id === productId)
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId)
            } else {
                item.quantity = quantity
            }
        }
    },

    clear() {
        cartState.items.splice(0, cartState.items.length)
        console.log('Cart cleared')
    },

    openCart() {
        cartState.isOpen = true
    },

    closeCart() {
        cartState.isOpen = false
    },

    toggleCart() {
        cartState.isOpen = !cartState.isOpen
    }
}

// Computed properties for reactive updates
export const cartComputed = {
    itemCount: computed(() => cartService.itemCount),
    totalPrice: computed(() => cartService.totalPrice),
    isEmpty: computed(() => cartService.isEmpty),
    items: computed(() => cartService.items)
}