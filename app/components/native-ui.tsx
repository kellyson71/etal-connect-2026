"use client";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, Text } from "./native";
import { ArrowRight } from "lucide-react";
export function NativeButton({
  children,
  onPress,
  label,
  variant = "primary",
  disabled = false,
  arrow = false,
}: {
  children: ReactNode;
  onPress: () => void;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "mint";
  disabled?: boolean;
  arrow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === "primary"
          ? styles.primary
          : variant === "secondary"
            ? styles.secondary
            : variant === "mint"
              ? styles.mint
              : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        <Text
          style={[
            styles.text,
            variant === "primary" ? styles.white : styles.navy,
          ]}
        >
          {children}
        </Text>
        {arrow && (
          <ArrowRight
            size={17}
            color={variant === "primary" ? "white" : "#35517e"}
          />
        )}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 17,
    borderRadius: 13,
    minHeight: 49,
    justifyContent: "center",
  },
  primary: { backgroundColor: "#355589" },
  mint: { backgroundColor: "#bfeadf" },
  secondary: {
    backgroundColor: "#e8eef7",
    borderWidth: 1,
    borderColor: "#dce5f2",
  },
  ghost: { backgroundColor: "transparent", paddingVertical: 10, minHeight: 36 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    fontFamily: "DM Sans, sans-serif",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  white: { color: "#fff" },
  navy: { color: "#48648e" },
});
