import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

const colors = {
    background: '#0F111A',
    border: '#2D3748',
    primary: '#0EA5E9',
    muted: '#94A3B8',
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Home',
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: 'Expenses',
                    tabBarLabel: 'Expenses',
                }}
            />
        </Tabs>
    );
}
