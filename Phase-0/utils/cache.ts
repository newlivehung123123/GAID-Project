/**
 * Smart Cache: Returns "stale" data instantly, then updates in the background
 */
export const fetchDataWithCache = async <T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    expiryHours: number = 24
): Promise<T> => {
    const cached = localStorage.getItem(key);
    const now = new Date();

    if (cached) {
        const data = JSON.parse(cached);
        const isExpired = now.getTime() > data.expiry;

        if (!isExpired) {
            console.log(`%c[Cache] Fresh: Loading ${key} instantly`, "color: #10b981");
            return data.value;
        }

        // STRATEGY 2: Data is expired, but we show it anyway to avoid the 30s wait!
        console.log(`%c[Cache] Stale: Showing old ${key} while updating...`, "color: #f59e0b");
        
        // Trigger the update in the background (don't "await" it)
        fetchFunction().then(newResult => {
            localStorage.setItem(key, JSON.stringify({
                value: newResult,
                expiry: new Date().getTime() + (expiryHours * 60 * 60 * 1000)
            }));
            console.log(`%c[Cache] ${key} updated in background for next visitor`, "color: #3b82f6");
        });

        return data.value; // Return the old data immediately
    }

    // Only if there is ZERO data do we make the user wait
    const result = await fetchFunction();
    localStorage.setItem(key, JSON.stringify({
        value: result,
        expiry: now.getTime() + (expiryHours * 60 * 60 * 1000)
    }));
    return result;
};