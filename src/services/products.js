export async function syncProductsIfOnline(categoryId) {
    return await window.api.syncProducts(categoryId)
}

export function getLocalProducts(categoryId) {
    return window.api.getLocalProducts(categoryId);
}
