import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Next.js local server via Expo (10.0.2.2 for Android Emulator)
const API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/mobile'
    // Physical iOS devices need the laptop's local IP address
    : 'http://192.168.254.32:3000/api/mobile';

const TOKEN_KEY = 'spendly_jwt_token';

export async function saveToken(token: string) {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to save token', e);
    }
}

export async function getToken() {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
        console.error('Failed to get token', e);
        return null;
    }
}

export async function removeToken() {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
        console.error('Failed to delete token', e);
    }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = await getToken();

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized (e.g. log out)
            await removeToken();
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API request failed: ${response.status}`);
    }

    return response.json();
}
