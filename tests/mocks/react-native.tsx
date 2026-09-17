import React from "react";

export const View = React.forwardRef<HTMLDivElement, any>(
  (
    {
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      children,
      style,
      testID,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        aria-label={accessibilityLabel}
        data-testid={testID}
        ref={ref}
        role={accessibilityRole}
        style={Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style}
        {...props}
      >
        {children}
      </div>
    );
  },
);
View.displayName = "View";

export const Text = React.forwardRef<HTMLSpanElement, any>(
  (
    {
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      children,
      style,
      testID,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        aria-label={accessibilityLabel}
        data-testid={testID}
        ref={ref}
        role={accessibilityRole}
        style={Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Text.displayName = "Text";

export const Pressable = React.forwardRef<HTMLButtonElement, any>(
  (
    {
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      children,
      disabled,
      onPress,
      style,
      testID,
      ...props
    },
    ref,
  ) => {
    const computedStyle = typeof style === "function" ? style({ pressed: false }) : style;
    const flatStyle = Array.isArray(computedStyle)
      ? Object.assign({}, ...computedStyle.filter(Boolean))
      : computedStyle;

    return (
      <button
        aria-disabled={accessibilityState?.disabled ?? disabled}
        aria-label={accessibilityLabel}
        data-testid={testID}
        disabled={disabled}
        onClick={disabled ? undefined : onPress}
        ref={ref}
        role={accessibilityRole || "button"}
        style={flatStyle}
        type="button"
        {...props}
      >
        {typeof children === "function" ? children({ pressed: false }) : children}
      </button>
    );
  },
);
Pressable.displayName = "Pressable";

export const ActivityIndicator = ({ testID, ...props }: any) => (
  <div data-testid={testID || "activity-indicator"} role="progressbar" {...props} />
);

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (style: any) =>
    Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style,
};

export const Platform = {
  OS: "ios",
  select: (obj: any) => obj.ios ?? obj.default,
};
