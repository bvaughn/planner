export function hexToRgb(hex) {
  if (hex.length === 4) {
    hex = `#${hex.charAt(1)}${hex.charAt(1)}${hex.charAt(2)}${hex.charAt(
      2
    )}${hex.charAt(3)}${hex.charAt(3)}`;
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16), // r
        parseInt(result[2], 16), // g
        parseInt(result[3], 16), // b
      ]
    : null;
}

export function getLuminance(color) {
  const rgb = Array.isArray(color) ? color : hexToRgb(color);

  const values = rgb.map((value) => {
    const n = value / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return Number(
    (0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]).toFixed(3)
  );
}

export function getContrastRatio(colorA, colorB) {
  const luminanceA = getLuminance(hexToRgb(colorA));
  const luminanceB = getLuminance(hexToRgb(colorB));

  return (
    (Math.max(luminanceA, luminanceB) + 0.05) /
    (Math.min(luminanceA, luminanceB) + 0.05)
  );
}
