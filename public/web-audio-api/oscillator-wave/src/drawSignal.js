module.exports = (canvas, data, caption) => {
  let context = canvas.getContext("2d");
  let textWidth = context.measureText(caption).width;

  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#0c0";
  context.beginPath();

  for (let i = 0; i < data.length; i++) {
    let x = Math.round((i / (data.length - 1)) * canvas.width);
    let y = canvas.height * 0.5 - data[i] * canvas.height * 0.5;

    context.lineTo(x, y);
  }

  context.stroke();

  context.fillStyle = "#0f0";
  context.fillText(caption, canvas.width - textWidth - 4, 12);
};
