const VERTICAL_TEXT_OFFSET = 1;

let patternCanvas = null;

export function drawDiagonalStripePattern(backgroundColor, color) {
  if (patternCanvas === null) {
    patternCanvas = document.createElement("canvas");
    patternCanvas.width = 300;
    patternCanvas.height = 300;

    const context = patternCanvas.getContext("2d");

    var numberOfStripes = 100;
    for (var i = 0; i < numberOfStripes * 2; i++) {
      var thickness = 300 / numberOfStripes;
      context.beginPath();
      context.strokeStyle = i % 2 ? backgroundColor : color;
      context.lineWidth = thickness;
      context.lineCap = "round";
      context.moveTo(i * thickness + thickness / 2 - 300, 0);
      context.lineTo(0 + i * thickness + thickness / 2, 300);
      context.stroke();
    }
  }

  return patternCanvas;
}

export function drawTextToFitWidth(context, text, x, y, width, height) {
  let resizedText = false;

  let textToRender = text;
  let textWidth = context.measureText(textToRender).width;
  if (textWidth > width) {
    resizedText = true;

    while (textWidth >= width && textToRender.length > 1) {
      textToRender = textToRender.substring(0, textToRender.length - 2) + "…";
      textWidth = context.measureText(textToRender).width;
    }
  }

  context.textBaseline = "middle";
  context.fillText(
    textToRender,
    x,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    width
  );

  return resizedText ? textWidth : null;
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

// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
export function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

export function drawAvatarCircle(context, avatar, x, y, size) {
  context.save();
  context.beginPath();
  drawRoundedRect(context, x, y, size, size, size / 2);
  context.closePath();
  context.clip();

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
    size,
    size
  );

  context.restore();
}
