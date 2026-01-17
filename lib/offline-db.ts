import Dexie, { Table } from 'dexie';

export interface PendingExpense {
    id?: number;
    merchant: string;
    amount: number;
    date: Date;
    category: string;
    tripId?: string;
    description?: string;
    receiptImage?: Blob | null; // For image uploads
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    } | null;
    status: 'pending' | 'syncing' | 'failed';
    createdAt: number;
    error?: string; // Store last sync error
}

export interface PendingTrip {
    id?: number;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    budget?: number;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
    syncStatus: 'pending' | 'syncing' | 'failed';
    createdAt: number;
    error?: string;
}

export class OfflineDatabase extends Dexie {
    pendingExpenses!: Table<PendingExpense>;
    pendingTrips!: Table<PendingTrip>;

    constructor() {
        super('KharchoOfflineDB');
        // Version 1
        this.version(1).stores({
            pendingExpenses: '++id, status, createdAt' // Indexes
        });
        // Version 2: Add trips
        this.version(2).stores({
            pendingExpenses: '++id, status, createdAt',
            pendingTrips: '++id, syncStatus, createdAt'
        });
    }
}

export const db = new OfflineDatabase();
