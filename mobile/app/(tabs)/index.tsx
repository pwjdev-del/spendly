import { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, RefreshControl, ActivityIndicator,
    TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchApi, removeToken } from '../../lib/api';
import { colors, spacing, radii, typography, cardShadow, glowShadow } from '../../lib/theme';

export default function DashboardScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadDashboard = useCallback(async () => {
        try {
            const res = await fetchApi('/dashboard');
            setData(res);
        } catch (e: any) {
            if (e.message?.includes('401')) router.replace('/');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const handleLogout = async () => {
        await removeToken();
        router.replace('/');
    };

    if (loading) {
        return (
            <View style={[s.container, s.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const totalSpend = data?.totalSpend ?? 0;
    const approved = data?.approved ?? 0;
    const pending = data?.pending ?? 0;
    const recentActivity = data?.recentActivity ?? [];

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} tintColor={colors.primary} />
                }
            >
                {/* Decorative mesh orbs */}
                <View style={s.orbTopRight} />
                <View style={s.orbBottomLeft} />

                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.greeting}>Welcome back 👋</Text>
                        <Text style={s.headerTitle}>Dashboard</Text>
                    </View>
                    <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <Text style={s.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Hero Spend Card */}
                <View style={s.heroCard}>
                    <Text style={s.heroLabel}>TOTAL SPEND THIS MONTH</Text>
                    <Text style={s.heroAmount}>${(totalSpend / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                    {pending > 0 && (
                        <View style={s.pendingBadge}>
                            <Text style={s.pendingBadgeText}>{pending} Pending</Text>
                        </View>
                    )}
                </View>

                {/* Quick Stats */}
                <View style={s.statsRow}>
                    <View style={[s.statCard, s.statCardGreen]}>
                        <Text style={s.statLabel}>Approved</Text>
                        <Text style={[s.statValue, { color: colors.success }]}>{approved}</Text>
                    </View>
                    <View style={[s.statCard, s.statCardOrange]}>
                        <Text style={s.statLabel}>Pending</Text>
                        <Text style={[s.statValue, { color: colors.warning }]}>{pending}</Text>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
                        <Text style={s.seeAll}>See All →</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.activityCard}>
                    {recentActivity.length === 0 ? (
                        <View style={s.emptyRow}>
                            <Text style={s.emptyText}>No recent activity</Text>
                        </View>
                    ) : (
                        recentActivity.map((item: any, i: number) => (
                            <View key={item.id || i} style={[s.activityRow, i < recentActivity.length - 1 && s.activityRowBorder]}>
                                <View style={s.activityLeft}>
                                    <Text style={s.activityMerchant}>{item.merchant}</Text>
                                    <Text style={s.activityDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={s.activityAmount}>${(item.amount / 100).toFixed(2)}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: spacing.xl, paddingBottom: 40 },

    orbTopRight: {
        position: 'absolute', top: -60, right: -40,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(56, 189, 248, 0.06)',
    },
    orbBottomLeft: {
        position: 'absolute', bottom: 60, left: -60,
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(139, 92, 246, 0.04)',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xxl,
    },
    greeting: { ...typography.caption, color: colors.muted, marginBottom: 2 },
    headerTitle: { ...typography.h1, color: colors.heading },
    logoutBtn: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    logoutText: { ...typography.caption, color: colors.muted },

    // Hero card
    heroCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xxl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.xxl,
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...glowShadow,
    },
    heroLabel: { ...typography.pill, color: colors.muted, marginBottom: spacing.sm },
    heroAmount: { ...typography.hero, color: colors.heading, fontSize: 42 },
    pendingBadge: {
        marginTop: spacing.md,
        paddingHorizontal: 14, paddingVertical: 5,
        borderRadius: radii.full,
        backgroundColor: colors.warningGlow,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    pendingBadgeText: { ...typography.pill, color: colors.warning },

    // Stats
    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.xl,
        alignItems: 'center',
        ...cardShadow,
    },
    statCardGreen: { borderColor: 'rgba(34, 197, 94, 0.15)' },
    statCardOrange: { borderColor: 'rgba(245, 158, 11, 0.15)' },
    statLabel: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
    statValue: { fontSize: 32, fontWeight: '800' },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.h3, color: colors.heading },
    seeAll: { ...typography.caption, color: colors.primary },

    // Activity
    activityCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        overflow: 'hidden',
        ...cardShadow,
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
    },
    activityRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    activityLeft: { flex: 1 },
    activityMerchant: { ...typography.bodyBold, color: colors.foreground },
    activityDate: { ...typography.caption, color: colors.muted, marginTop: 2 },
    activityAmount: { ...typography.bodyBold, color: colors.foreground },
    emptyRow: { padding: spacing.xxl, alignItems: 'center' },
    emptyText: { ...typography.caption, color: colors.muted },
});
