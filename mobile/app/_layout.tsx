import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css'; // NativeWind v4 initialization

export default function RootLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: false, // We usually hide headers in modern apps and build our own safe areas
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}
