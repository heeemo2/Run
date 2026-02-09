let goalKm = 0;
let totalDistance = 0;
let lastPosition = null;
let watchId = null;
let points = [];

let chart;

function startWalking() {
  goalKm = parseFloat(document.getElementById("goal").value);

  if (!goalKm || goalKm <= 0) {
    alert("حدد عدد الكيلوات أولاً");
    return;
  }

  totalDistance = 0;
  lastPosition = null;
  points = [];

  speak("بدأنا المشي، الله يقويك");

  watchId = navigator.geolocation.watchPosition(
    updatePosition,
    locationError,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

function updatePosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (lastPosition) {
    const distance = calculateDistance(
      lastPosition.lat,
      lastPosition.lng,
      lat,
      lng
    );

    totalDistance += distance;

    document.getElementById("distance").textContent =
      totalDistance.toFixed(2);

    points.push(totalDistance.toFixed(2));
    drawChart();

    if (totalDistance >= goalKm) {
      speak(`مبروك وصلت ${goalKm} كيلو، كفو والله`);
      navigator.geolocation.clearWatch(watchId);
    }
  }

  lastPosition = { lat, lng };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 1;
  speechSynthesis.speak(msg);
}

function locationError() {
  alert("رجاءً فعّل GPS واسمح بالموقع");
}

function drawChart() {
  const ctx = document.getElementById("chart");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: points.map((_, i) => i + 1),
      datasets: [
        {
          label: "المسافة (كم)",
          data: points,
          borderColor: "#4CAF50",
          backgroundColor: "transparent",
          tension: 0.3
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#fff"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#aaa" }
        },
        y: {
          ticks: { color: "#aaa" }
        }
      }
    }
  });
}
