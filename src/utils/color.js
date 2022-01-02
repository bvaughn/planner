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

// TODO Make this array longer; use incoming string to determine array index
// this way shared plans will always have consistent colors even if their in-memory editing history is different.

let colorIndex = 0;
const colors = [
  "#363852",
  "#726D81",
  "#B29DA0",
  "#DECBC6",
  "#4A4E69",
  "#9A8C98",
  "#C9ADA7",
  "#22223B",
  "#F2E9E4",
];
const stringToColorMap = new Map();

export function getColorForString(string) {
  string = string.toLowerCase();

  if (!stringToColorMap.has(string)) {
    // Use pretty (hard-coded) colors for the first few tasks.
    if (colorIndex < colors.length) {
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      stringToColorMap.set(string, color);
    } else {
      // Fall back to randomly generated colors if we run out.
      // https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
      let hash = 0;
      if (string.length === 0) return "#000000";
      for (var i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      let color = "#";
      for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 255;
        color += ("00" + value.toString(16)).substr(-2);
      }
      stringToColorMap.set(string, color);
    }
  }

  return stringToColorMap.get(string);
}
