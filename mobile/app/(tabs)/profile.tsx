import { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, RefreshControl, ActivityIndicator,
    TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchApi, removeToken } from '../../lib/api';
import { colors, spacing, radii, typography, cardShadow } from '../../lib/theme';

export default function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadProfile = useCallback(async () => {
        try {
            const res = await fetchApi('/profile');
            setProfile(res);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleLogout = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive',
                onPress: async () => { await removeToken(); router.replace('/'); },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[s.container, s.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const name = profile?.name || 'Spendly User';
    const email = profile?.email || '';
    const role = profile?.role || 'Member';
    const department = profile?.department || 'General';

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.orbTopRight} />

                <Text style={s.headerTitle}>My Profile</Text>

                {/* Hero ID Card */}
                <View style={s.idCard}>
                    <View style={s.avatarCircle}>
                        <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={s.userName}>{name}</Text>
                    <Text style={s.userRole}>{role} • {department}</Text>
                    {email ? <Text style={s.userEmail}>{email}</Text> : null}
                </View>

                {/* Menu Rows */}
                <View style={s.menuCard}>
                    {['Personal Information', 'Bank Details', 'Security Settings', 'Notifications'].map((item, i, arr) => (
                        <TouchableOpacity key={item} style={[s.menuRow, i < arr.length - 1 && s.menuRowBorder]} activeOpacity={0.6}>
                            <Text style={s.menuText}>{item}</Text>
                            <Text style={s.menuChevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Delete Account */}
                <TouchableOpacity style={s.deleteBtn} activeOpacity={0.7}>
                    <Text style={s.deleteText}>Delete Account</Text>
                </TouchableOpacity>

                {/* Sign Out */}
                <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <Text style={s.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: spacing.xl, paddingBottom: 40 },
    orbTopRight: {
        position: 'absolute', top: -50, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(56, 189, 248, 0.06)',
    },

    headerTitle: { ...typography.h1, color: colors.heading, marginBottom: spacing.xxl },

    idCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xxl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.xxl,
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...cardShadow,
    },
    avatarCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.primaryGlow,
        borderWidth: 2, borderColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
    userName: { ...typography.h2, color: colors.heading, marginBottom: 4 },
    userRole: { ...typography.caption, color: colors.primary, marginBottom: 4 },
    userEmail: { ...typography.caption, color: colors.muted },

    menuCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        ...cardShadow,
    },
    menuRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 16,
    },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
    menuText: { ...typography.bodyBold, color: colors.foreground },
    menuChevron: { fontSize: 22, color: colors.primary, fontWeight: '300' },

    deleteBtn: {
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        backgroundColor: colors.destructiveGlow,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    deleteText: { ...typography.bodyBold, color: colors.destructive },

    signOutBtn: {
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingVertical: 14,
        alignItems: 'center',
    },
    signOutText: { ...typography.bodyBold, color: colors.muted },
});
