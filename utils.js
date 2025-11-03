// Get a shuffled random sample of 15 images from your local folder
export function catUrls(n = 15) {
    const allCats = [
        "cat1.jpg", "cat2.gif", "cat3.gif", "cat4.jpg", "cat5.jpg",
        "cat6.jpg", "cat7.jpg", "cat8.jpg", "cat9.jpg", "cat10.jpg",
        "cat11.jpg", "cat12.gif", "cat13.png", "cat14.jpg", "cat15.gif",
        "cat16.jpg", "cat17.jpg", "cat18.gif", "cat19.jpg", "cat20.png"
    ];

    // Shuffle the array
    const shuffle = allCats.sort(() => Math.random() - 0.5);

    // Pick the first n items and add the relative path
    return shuffle.slice(0, n).map(cat => `/images/${cat}`);
}

// Preload local images
export function preload(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src);
        img.src = src;
    });
}

// LocalStorage helper (same as before)
const KEY = "paws-liked-v1";
export const likesStore = {
    get() {return JSON.parse(localStorage.getItem(KEY) || "[]");},
    set(arr) {localStorage.setItem(KEY,JSON.stringify(arr));},
    clear() {localStorage.removeItem(KEY);}
};