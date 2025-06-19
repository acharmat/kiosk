export async function syncCategoriesIfOnline() {
    return await window.api.syncCategories();
}

export function getLocalCategories() {
    return window.api.getLocalCategories();
}
