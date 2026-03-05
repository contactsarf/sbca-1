/** Design tokens as TypeScript constants — mirrors globals.css @theme values */

export const colors = {
    primary: "#2D523E",
    primaryDark: "#1E392A",
    secondary: "#9BA894",
    secondaryDark: "#8B9A82",
    tertiary: "#5D6D63",
    background: "#EEF0EE",
    foreground: "#081C15",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
    dangerDark: "#B91C1C",
} as const;

export type ColorKey = keyof typeof colors;
