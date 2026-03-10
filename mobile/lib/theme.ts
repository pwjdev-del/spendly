/**
 * Spendly Mobile Design System
 * Premium Dark Navy + Sky Blue Glassmorphism
 */

export const colors = {
    // Core backgrounds
    bg: '#0F111A',
    bgAlt: '#0D0F17',
    surface: '#181B25',
    surfaceAlt: '#1F2937',

    // Primary accent (Sky Blue)
    primary: '#0EA5E9',
    primaryLight: '#38BDF8',
    primaryDark: '#0284C7',
    primaryGlow: 'rgba(14, 165, 233, 0.15)',
    primaryGlowStrong: 'rgba(14, 165, 233, 0.25)',

    // Text
    foreground: '#E2E8F0',
    muted: '#94A3B8',
    mutedDark: '#64748B',
    heading: '#F1F5F9',

    // Status
    success: '#22C55E',
    successGlow: 'rgba(34, 197, 94, 0.12)',
    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.12)',
    destructive: '#EF4444',
    destructiveGlow: 'rgba(239, 68, 68, 0.12)',

    // Borders & shadows
    border: '#2D3748',
    borderSubtle: 'rgba(226, 232, 240, 0.06)',
    shadow: 'rgba(0, 0, 0, 0.4)',

    // Mesh gradient orbs (for LinearGradient overlays in the future)
    meshCyan: 'rgba(56, 189, 248, 0.08)',
    meshPurple: 'rgba(139, 92, 246, 0.06)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
};

export const typography = {
    hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
    h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    bodyBold: { fontSize: 15, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '500' as const },
    tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
    pill: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4 },
};

/** Reusable card shadow preset */
export const cardShadow = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
};

/** Subtle glow shadow (primary accent) */
export const glowShadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
};

/** Status badge config lookup */
export const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: {
        bg: colors.warningGlow,
        text: colors.warning,
        border: 'rgba(245, 158, 11, 0.25)',
    },
    APPROVED: {
        bg: colors.successGlow,
        text: colors.success,
        border: 'rgba(34, 197, 94, 0.25)',
    },
    REJECTED: {
        bg: colors.destructiveGlow,
        text: colors.destructive,
        border: 'rgba(239, 68, 68, 0.25)',
    },
};
