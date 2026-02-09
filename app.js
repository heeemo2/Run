let watchId;
let startTime;
let lastPos = null;
let distance = 0;
let timer;

const timeEl = document.getElementById('time');
const distEl = document.getElementById('distance');
const calEl = document.getElementById('calories');
const statusEl = document.getElementById('status');
const beep = document.getElementById('beep');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

function toRad(v) {
  return v * Math.PI / 180;
}

function calcDistance(p1, p2) {
  const R = 6371;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(toRad(p1.lat)) *
    Math.cos(toRad(p2.lat)) *
    Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function startTimer() {
  startTime = Date.now();
  timer = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(s / 60);
    timeEl.textContent =
      String(m).padStart(2,'0') + ':' +
      String(s % 60).padStart(2,'0');
  }, 1000);
}

function startWalk() {
  if (!navigator.geolocation) {
    alert('GPS غير مدعوم');
    return;
  }

  statusEl.textContent = '📡 جارٍ التتبع...';
  startBtn.disabled = true;
  stopBtn.disabled = false;

  startTimer();

  watchId = navigator.geolocation.watchPosition(pos => {
    const current = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude
    };

    if (lastPos) {
      distance += calcDistance(lastPos, current);
      distEl.textContent = distance.toFixed(2);
      calEl.textContent = Math.floor(distance * 60);

      if (Math.floor(distance) > Math.floor(distance - 0.01)) {
        beep.play();
      }
    }
    lastPos = current;
  }, err => {
    statusEl.textContent = '❌ خطأ في GPS';
  }, { enableHighAccuracy: true });
}

function stopWalk() {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timer);
  statusEl.textContent = '⏹️ تم الإيقاف';
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function resetWalk() {
  stopWalk();
  distance = 0;
  lastPos = null;
  distEl.textContent = '0.00';
  calEl.textContent = '0';
  timeEl.textContent = '00:00';
  statusEl.textContent = 'جاهز';
}

startBtn.onclick = startWalk;
stopBtn.onclick = stopWalk;
resetBtn.onclick = resetWalk;
