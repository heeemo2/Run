const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
let points = [];

function drawChart(distance) {
  points.push(distance);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = "#4CAF50";

  points.forEach((p, i) => {
    const x = (i / points.length) * canvas.width;
    const y = canvas.height - (p * 10);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();
}
