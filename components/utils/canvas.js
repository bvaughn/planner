const STRIPE_PATTER_SIZE = 40;
const STRIPE_SIZE = 2;
const VERTICAL_TEXT_OFFSET = 1;

export function drawDiagonalStripePattern(backgroundColor, color) {
  const canvas = document.createElement("canvas");
  canvas.width = STRIPE_PATTER_SIZE;
  canvas.height = STRIPE_PATTER_SIZE;

  const context = canvas.getContext("2d");

  const numberOfStripes = STRIPE_PATTER_SIZE / 2;
  for (let i = 0; i < numberOfStripes * 2; i++) {
    const thickness = STRIPE_PATTER_SIZE / numberOfStripes;
    context.beginPath();
    context.strokeStyle = i % 2 ? backgroundColor : color;
    context.lineWidth = thickness;
    context.lineCap = "round";
    context.moveTo(i * thickness + thickness / 2 - STRIPE_PATTER_SIZE, 0);
    context.lineTo(0 + i * thickness + thickness / 2, STRIPE_PATTER_SIZE);
    context.stroke();
  }

  return canvas;
}

export function drawTextToFit(context, textOrTexts, rect, options = {}) {
  const { x, width } = rect;
  let { y, height } = rect;
  const { align = "middle", renderIfClipped = true } = options;

  const textArray = Array.isArray(textOrTexts) ? textOrTexts : [textOrTexts];
  for (let i = 0; i < textArray.length; i++) {
    const text = textArray[i];

    let resizedText = false;

    let textToRender = text;
    let textWidth = context.measureText(textToRender).width;
    if (textWidth > width) {
      resizedText = true;

      // If a shorter alternate text has been provided, move onto it.
      if (i < textArray.length - 1) {
        continue;
      }

      while (textWidth >= width && textToRender.length > 1) {
        textToRender = textToRender.substring(0, textToRender.length - 2) + "…";
        textWidth = context.measureText(textToRender).width;
      }
    }

    if (!resizedText || renderIfClipped) {
      let textBaseline;
      switch (align) {
        case "top":
          textBaseline = "top";
          break;
        case "bottom":
          textBaseline = "bottom";
          y = y + height;
          height = 0;
          break;
        case "middle":
          textBaseline = "middle";
          y = y + height / 2;
          height = 0;
        default:
          break;
      }

      context.textBaseline = textBaseline;
      context.fillText(textToRender, x, y, width);
    }

    return [textWidth, resizedText];
  }
}

export function drawTextToCenterWithin(context, text, x, y, width, height) {
  const textWidth = context.measureText(text).width;

  context.textBaseline = "middle";
  context.fillText(
    text,
    x + width / 2 - textWidth / 2,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    textWidth
  );
}

export function drawTopCornerBadge(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.lineTo(x + width, y + height);
  context.lineTo(x, y);
  context.closePath();
}

// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
export function drawRoundedRect(context, x, y, width, height, radiusOrConfig) {
  let topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius;
  if (typeof radiusOrConfig === "number") {
    topLeftRadius = radiusOrConfig;
    topRightRadius = radiusOrConfig;
    bottomLeftRadius = radiusOrConfig;
    bottomRightRadius = radiusOrConfig;
  } else {
    topLeftRadius = radiusOrConfig.topLeft;
    topRightRadius = radiusOrConfig.topRight;
    bottomLeftRadius = radiusOrConfig.bottomLeft;
    bottomRightRadius = radiusOrConfig.bottomRight;
  }

  context.beginPath();
  context.moveTo(x + topLeftRadius, y);
  context.arcTo(x + width, y, x + width, y + height, topRightRadius);
  context.arcTo(x + width, y + height, x, y + height, bottomRightRadius);
  context.arcTo(x, y + height, x, y, bottomLeftRadius);
  context.arcTo(x, y, x + width, y, topLeftRadius);
  context.closePath();
}

export function drawAvatarCircle(context, avatar, x, y, width, height, radius) {
  context.save();
  context.beginPath();
  drawRoundedRect(context, x, y, width, height, {
    topLeft: radius,
    bottomLeft: radius,
    topRight: 0,
    bottomRight: 0,
  });
  context.closePath();
  context.clip();

  const aspectRatio = avatar.width / avatar.height;
  const imageHeight = height;
  const imageWidth = aspectRatio * height;

  context.drawImage(
    avatar.image,

    // Native image coordinates and size
    0,
    0,
    avatar.width,
    avatar.height,

    // Canvas coordinates and scaled image size
    x,
    y,
    imageWidth,
    imageHeight
  );

  context.restore();
}
