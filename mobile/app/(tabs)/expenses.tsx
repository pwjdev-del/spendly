import { useEffect, useState, useCallback, memo } from 'react';
import {
    View, Text, FlatList, RefreshControl, ActivityIndicator,
    TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchApi } from '../../lib/api';
import { colors, spacing, radii, typography, cardShadow, statusConfig } from '../../lib/theme';

const filters = ['All', 'Pending', 'Approved', 'Rejected'];

const ExpenseItem = memo(({ item }: { item: any }) => {
    const status = statusConfig[item.status] || statusConfig.PENDING;
    return (
        <View style={s.card}>
            <View style={s.cardLeft}>
                <Text style={s.merchant} numberOfLines={1}>{item.merchant}</Text>
                <View style={s.metaRow}>
                    <Text style={s.category}>{item.category}</Text>
                    <Text style={s.dot}>•</Text>
                    <Text style={s.date}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={s.cardRight}>
                <Text style={s.amount}>${(item.amount / 100).toFixed(2)}</Text>
                <View style={[s.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
                    <Text style={[s.badgeText, { color: status.text }]}>{item.status}</Text>
                </View>
            </View>
        </View>
    );
});

export default function ExpensesScreen() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const loadExpenses = useCallback(async () => {
        try {
            const res = await fetchApi('/expenses?limit=50');
            setExpenses(res.expenses || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { loadExpenses(); }, [loadExpenses]);

    const filtered = activeFilter === 'All'
        ? expenses
        : expenses.filter(e => e.status === activeFilter.toUpperCase());

    if (loading) {
        return (
            <View style={[s.container, s.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Decorative orbs */}
            <View style={s.orbTopRight} />

            {/* Header */}
            <View style={s.header}>
                <Text style={s.headerTitle}>Expenses</Text>
                <Text style={s.headerSub}>{expenses.length} total</Text>
            </View>

            {/* Filter pills */}
            <View style={s.filterRow}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[s.filterPill, activeFilter === f && s.filterPillActive]}
                        onPress={() => setActiveFilter(f)}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                renderItem={({ item }) => <ExpenseItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.listContent}
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadExpenses(); }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={s.emptyState}>
                        <Text style={s.emptyEmoji}>🧾</Text>
                        <Text style={s.emptyTitle}>No expenses found</Text>
                        <Text style={s.emptyText}>Pull down to refresh</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    orbTopRight: {
        position: 'absolute', top: -50, right: -50,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
    },

    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xs },
    headerTitle: { ...typography.h1, color: colors.heading },
    headerSub: { ...typography.caption, color: colors.muted, marginTop: 2 },

    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    filterPill: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: radii.full,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: { ...typography.caption, color: colors.muted },
    filterTextActive: { color: '#FFFFFF' },

    listContent: { padding: spacing.lg, paddingTop: 0, gap: 10 },

    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...cardShadow,
    },
    cardLeft: { flex: 1, marginRight: spacing.md },
    merchant: { ...typography.bodyBold, color: colors.foreground },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    category: { ...typography.caption, color: colors.muted },
    dot: { color: colors.border, fontSize: 10 },
    date: { ...typography.caption, color: colors.muted },
    cardRight: { alignItems: 'flex-end' },
    amount: { fontSize: 17, fontWeight: '700', color: colors.foreground },
    badge: {
        marginTop: 6, paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: radii.full, borderWidth: 1,
    },
    badgeText: { ...typography.pill },

    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 40, marginBottom: spacing.md },
    emptyTitle: { ...typography.bodyBold, color: colors.foreground },
    emptyText: { ...typography.caption, color: colors.muted, marginTop: 4 },
});
