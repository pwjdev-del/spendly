import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveToken } from '../lib/api';
import { fetchApi } from '../lib/api';
import { colors, spacing, radii, typography, glowShadow, cardShadow } from '../lib/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            await saveToken(data.token);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.kav}
            >
                {/* Decorative mesh orbs */}
                <View style={s.orbTopRight} />
                <View style={s.orbBottomLeft} />

                {/* Logo */}
                <View style={s.logoSection}>
                    <View style={s.logoCircle}>
                        <Text style={s.logoEmoji}>💸</Text>
                    </View>
                    <Text style={s.appName}>spendly</Text>
                    <Text style={s.tagline}>Track expenses. Stay organized.</Text>
                </View>

                {/* Form */}
                <View style={s.formCard}>
                    <View style={s.inputGroup}>
                        <Text style={s.label}>EMAIL</Text>
                        <TextInput
                            style={s.input}
                            placeholder="name@company.com"
                            placeholderTextColor={colors.mutedDark}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>PASSWORD</Text>
                        <TextInput
                            style={s.input}
                            placeholder="••••••••"
                            placeholderTextColor={colors.mutedDark}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.signInBtn, loading && s.signInBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.signInText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={s.footer}>
                    <TouchableOpacity>
                        <Text style={s.footerLink}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    kav: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
    },

    // Decorative gradient-mesh-like orbs
    orbTopRight: {
        position: 'absolute',
        top: -80,
        right: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(56, 189, 248, 0.07)',
    },
    orbBottomLeft: {
        position: 'absolute',
        bottom: -100,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },

    // Logo section
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...cardShadow,
    },
    logoEmoji: {
        fontSize: 36,
    },
    appName: {
        ...typography.hero,
        color: colors.primaryLight,
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.caption,
        color: colors.muted,
    },

    // Form card
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xxl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.xxl,
        gap: spacing.lg,
        ...cardShadow,
    },
    inputGroup: {
        gap: spacing.sm,
    },
    label: {
        ...typography.pill,
        color: colors.muted,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        color: colors.foreground,
        ...typography.body,
    },
    signInBtn: {
        backgroundColor: colors.primary,
        borderRadius: radii.lg,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        ...glowShadow,
    },
    signInBtnDisabled: {
        opacity: 0.6,
    },
    signInText: {
        color: '#FFFFFF',
        ...typography.bodyBold,
        letterSpacing: 0.3,
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: spacing.xxl,
    },
    footerLink: {
        color: colors.muted,
        ...typography.caption,
    },
});
