let watchId;
let totalDistance = 0;
let lastPosition = null;
let goalKm = 0;

function startWalking() {

  goalKm = parseFloat(document.getElementById("goal").value);

  if (!goalKm) {
    alert("حدد الهدف أولاً");
    return;
  }

  if (!navigator.geolocation) {
    alert("جهازك لا يدعم GPS");
    return;
  }

  alert("تم تشغيل تتبع الموقع");

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

  console.log("GPS يعمل");

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (lastPosition) {

    const d = calculateDistance(
      lastPosition.lat,
      lastPosition.lng,
      lat,
      lng
    );

    totalDistance += d;

    document.getElementById("distance").textContent =
      totalDistance.toFixed(2);

    if (totalDistance >= goalKm) {
      speak(`مبروك وصلت ${goalKm} كيلو`);
      navigator.geolocation.clearWatch(watchId);
    }
  }

  lastPosition = { lat, lng };
}

function locationError(err) {
  alert("فشل GPS: " + err.message);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  speechSynthesis.speak(msg);
}
