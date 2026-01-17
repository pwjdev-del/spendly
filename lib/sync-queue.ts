import { db, PendingExpense, PendingTrip } from './offline-db';

/**
 * Saves an expense to the offline outbox
 */
export async function saveOfflineExpense(data: Omit<PendingExpense, 'id' | 'status' | 'createdAt'>) {
    try {
        const id = await db.pendingExpenses.add({
            ...data,
            status: 'pending',
            createdAt: Date.now()
        });
        return id;
    } catch (error) {
        console.error("Failed to save offline expense:", error);
        throw error;
    }
}

export async function saveOfflineTrip(data: Omit<PendingTrip, 'id' | 'syncStatus' | 'createdAt'>) {
    try {
        const id = await db.pendingTrips.add({
            ...data,
            syncStatus: 'pending',
            createdAt: Date.now()
        });
        return id;
    } catch (error) {
        console.error("Failed to save offline trip:", error);
        throw error;
    }
}

/**
 * Gets all pending expenses sorted by creation time
 */
export async function getPendingExpenses() {
    return await db.pendingExpenses
        .where('status')
        .equals('pending')
        .sortBy('createdAt');
}

export async function getPendingTrips() {
    return await db.pendingTrips
        .where('syncStatus')
        .equals('pending')
        .sortBy('createdAt');
}

/**
 * Updates status to syncing
 */
export async function markAsSyncing(id: number) {
    return await db.pendingExpenses.update(id, { status: 'syncing' });
}

export async function markTripAsSyncing(id: number) {
    return await db.pendingTrips.update(id, { syncStatus: 'syncing' });
}

/**
 * Updates status to failed with error message
 */
export async function markAsFailed(id: number, error: string) {
    return await db.pendingExpenses.update(id, { status: 'failed', error });
}

export async function markTripAsFailed(id: number, error: string) {
    return await db.pendingTrips.update(id, { syncStatus: 'failed', error });
}

/**
 * Removes the expense from the queue upon successful sync
 */
export async function removeSyncedExpense(id: number) {
    return await db.pendingExpenses.delete(id);
}

export async function removeSyncedTrip(id: number) {
    return await db.pendingTrips.delete(id);
}

/**
 * Count pending items
 */
export async function getPendingCount() {
    const expenses = await db.pendingExpenses.where('status').notEqual('failed').count();
    const trips = await db.pendingTrips.where('syncStatus').notEqual('failed').count();
    return expenses + trips;
}
