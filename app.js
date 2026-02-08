// ========================================
// متغيرات عامة
// ========================================

let isWalking = false; // حالة الجلسة
let startTime = null; // وقت البدء
let timerInterval = null; // مؤقت العد
let totalDistance = 0; // المسافة الإجمالية بالكيلومترات
let totalCalories = 0; // السعرات المحروقة
let userWeight = 70; // وزن المستخدم الافتراضي
let selectedKilometers = [1, 2, 3]; // الكيلومترات المختارة للتنبيهات
let triggeredMilestones = []; // الإنجازات التي تم تفعيلها

// GPS
let watchId = null; // معرف مراقبة الموقع
let lastPosition = null; // آخر موقع GPS

// عناصر DOM
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timerDisplay');
const distanceDisplay = document.getElementById('distanceDisplay');
const caloriesDisplay = document.getElementById('caloriesDisplay');
const weightInput = document.getElementById('weightInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const gpsStatus = document.getElementById('gpsStatus');
const gpsStatusText = document.getElementById('gpsStatusText');
const milestoneAlert = document.getElementById('milestoneAlert');
const permissionMessage = document.getElementById('permissionMessage');

// ========================================
// تحميل الإعدادات عند بدء التطبيق
// ========================================

window.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    updateDisplay();
});

// ========================================
// حفظ وتحميل الإعدادات
// ========================================

function loadSettings() {
    // تحميل الوزن
    const savedWeight = localStorage.getItem('userWeight');
    if (savedWeight) {
        userWeight = parseInt(savedWeight);
        weightInput.value = userWeight;
    }
    
    // تحميل الكيلومترات المختارة
    const savedKm = localStorage.getItem('selectedKilometers');
    if (savedKm) {
        selectedKilometers = JSON.parse(savedKm);
        document.querySelectorAll('.km-checkbox').forEach(checkbox => {
            checkbox.checked = selectedKilometers.includes(parseInt(checkbox.value));
        });
    }
}

function saveSettings() {
    // حفظ الوزن
    userWeight = parseInt(weightInput.value) || 70;
    localStorage.setItem('userWeight', userWeight);
    
    // حفظ الكيلومترات المختارة
    selectedKilometers = [];
    document.querySelectorAll('.km-checkbox:checked').forEach(checkbox => {
        selectedKilometers.push(parseInt(checkbox.value));
    });
    localStorage.setItem('selectedKilometers', JSON.stringify(selectedKilometers));
    
    showPermissionMessage('تم حفظ الإعدادات بنجاح ✅', 'info');
}

saveSettingsBtn.addEventListener('click', saveSettings);

// ========================================
// بدء جلسة المشي
// ========================================

startBtn.addEventListener('click', function() {
    if (isWalking) return;
    
    isWalking = true;
    startTime = Date.now();
    triggeredMilestones = [];
    
    // تحديث واجهة المستخدم
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // بدء المؤقت
    startTimer();
    
    // طلب GPS
    requestGPSPermission();
    
    // إخفاء رسالة الأذونات
    hidePermissionMessage();
});

// ========================================
// إيقاف جلسة المشي
// ========================================

stopBtn.addEventListener('click', function() {
    if (!isWalking) return;
    
    stopWalkingSession();
});

function stopWalkingSession() {
    isWalking = false;
    
    // إيقاف المؤقت
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // إيقاف GPS
    stopGPSTracking();
    
    // تحديث واجهة المستخدم
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    updateGPSStatus('تم إيقاف الجلسة', 'default');
}

// ========================================
// إعادة تعيين البيانات
// ========================================

resetBtn.addEventListener('click', function() {
    if (isWalking) {
        stopWalkingSession();
    }
    
    totalDistance = 0;
    totalCalories = 0;
    triggeredMilestones = [];
    lastPosition = null;
    
    updateDisplay();
    hideMilestoneAlert();
    hidePermissionMessage();
    updateGPSStatus('⏳ في انتظار موقع GPS...', 'default');
});

// ========================================
// المؤقت
// ========================================

function startTimer() {
    timerInterval = setInterval(function() {
        if (!isWalking) return;
        
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        timerDisplay.textContent = formatTime(hours, minutes, seconds);
        
        // حساب المسافة بناءً على الوقت (احتياطي إذا لم يكن GPS متاحاً)
        if (!watchId && lastPosition === null) {
            calculateTimeBasedDistance(elapsed);
        }
        
        // تحديث العرض
        updateDisplay();
        
    }, 1000);
}

function formatTime(h, m, s) {
    return convertToArabicNumerals(
        String(h).padStart(2, '0') + ':' + 
        String(m).padStart(2, '0') + ':' + 
        String(s).padStart(2, '0')
    );
}

// ========================================
// GPS وحساب المسافة
// ========================================

function requestGPSPermission() {
    if (!navigator.geolocation) {
        showPermissionMessage('GPS غير متاح على جهازك', 'error');
        updateGPSStatus('GPS غير متوفر', 'error');
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    watchId = navigator.geolocation.watchPosition(
        onGPSSuccess,
        onGPSError,
        options
    );
    
    updateGPSStatus('🔍 جاري البحث عن GPS...', 'default');
}

function onGPSSuccess(position) {
    if (!isWalking) return;
    
    const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
    };
    
    // حساب المسافة إذا كان هناك موقع سابق
    if (lastPosition) {
        const distance = calculateDistance(
            lastPosition.lat,
            lastPosition.lng,
            currentPosition.lat,
            currentPosition.lng
        );
        
        // إضافة المسافة فقط إذا كانت معقولة (تجنب القفزات الخاطئة)
        if (distance < 0.5 && currentPosition.accuracy < 50) {
            totalDistance += distance;
            checkMilestones();
        }
    }
    
    lastPosition = currentPosition;
    updateGPSStatus('✅ GPS متصل (دقة: ' + Math.round(currentPosition.accuracy) + 'م)', 'active');
    updateDisplay();
}

function onGPSError(error) {
    let message = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'تم رفض إذن الموقع. يرجى تفعيل GPS من إعدادات المتصفح';
            updateGPSStatus('❌ تم رفض إذن الموقع', 'error');
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'الموقع غير متاح حالياً';
            updateGPSStatus('⚠️ الموقع غير متاح', 'error');
            break;
        case error.TIMEOUT:
            message = 'انتهت مهلة طلب الموقع';
            updateGPSStatus('⏱️ مهلة GPS انتهت', 'error');
            break;
        default:
            message = 'خطأ غير معروف في GPS';
            updateGPSStatus('❌ خطأ في GPS', 'error');
    }
    
    showPermissionMessage(message, 'warning');
}

function stopGPSTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// حساب المسافة بين نقطتين GPS (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// حساب المسافة بناءً على الوقت (احتياطي)
// متوسط سرعة المشي: 5 كم/ساعة
function calculateTimeBasedDistance(elapsedMs) {
    const averageSpeed = 5; // كم/ساعة
    const hours = elapsedMs / 3600000;
    totalDistance = hours * averageSpeed;
}

// ========================================
// حساب السعرات الحرارية
// ========================================

function calculateCalories() {
    // معادلة تقريبية: السعرات = الوزن × المسافة × 0.75
    totalCalories = Math.round(userWeight * totalDistance * 0.75);
}

// ========================================
// فحص الإنجازات والتنبيهات
// ========================================

function checkMilestones() {
    selectedKilometers.forEach(function(km) {
        if (totalDistance >= km && !triggeredMilestones.includes(km)) {
            triggeredMilestones.push(km);
            showMilestone(km);
            playArabicAudio(km);
        }
    });
}

function showMilestone(km) {
    const arabicKm = convertToArabicNumerals(km);
    milestoneAlert.textContent = '🎉 وصلت إلى ' + arabicKm + ' كيلومتر!';
    milestoneAlert.classList.add('show');
    
    setTimeout(function() {
        hideMilestoneAlert();
    }, 5000);
}

function hideMilestoneAlert() {
    milestoneAlert.classList.remove('show');
}

// ========================================
// تشغيل الصوت العربي (TTS)
// ========================================

function playArabicAudio(km) {
    if (!('speechSynthesis' in window)) {
        console.log('TTS غير مدعوم على هذا المتصفح');
        return;
    }
    
    const arabicKm = convertToArabicNumerals(km);
    const message = 'تهانينا، وصلت إلى ' + arabicKm + ' كيلومتر';
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // محاولة العثور على صوت عربي
    const voices = speechSynthesis.getVoices();
    const arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
    if (arabicVoice) {
        utterance.voice = arabicVoice;
    }
    
    try {
        speechSynthesis.speak(utterance);
    } catch (e) {
        console.log('فشل تشغيل الصوت:', e);
    }
}

// تحميل الأصوات المتاحة (ضروري لبعض المتصفحات)
if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function() {
        speechSynthesis.getVoices();
    };
}

// ========================================
// تحديث واجهة المستخدم
// ========================================

function updateDisplay() {
    // تحديث المسافة
    distanceDisplay.textContent = convertToArabicNumerals(totalDistance.toFixed(2)) + ' كم';
    
    // حساب وتحديث السعرات
    calculateCalories();
    caloriesDisplay.textContent = convertToArabicNumerals(totalCalories) + ' سعرة';
}

function updateGPSStatus(text, status) {
    gpsStatusText.textContent = text;
    gpsStatus.className = 'card gps-status';
    
    if (status === 'active') {
        gpsStatus.classList.add('active');
    } else if (status === 'error') {
        gpsStatus.classList.add('error');
    }
}

function showPermissionMessage(text, type) {
    permissionMessage.textContent = text;
    permissionMessage.className = 'permission-message show ' + type;
}

function hidePermissionMessage() {
    permissionMessage.classList.remove('show');
}

// ========================================
// تحويل الأرقام إلى العربية
// ========================================

function convertToArabicNumerals(str) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(str).replace(/[0-9]/g, function(digit) {
        return arabicNumerals[parseInt(digit)];
    });
}

// ========================================
// معالجة حالة التطبيق عند الإغلاق/الفتح
// ========================================

window.addEventListener('beforeunload', function() {
    if (isWalking) {
        // حفظ الحالة
        localStorage.setItem('lastSession', JSON.stringify({
            distance: totalDistance,
            calories: totalCalories,
            startTime: startTime,
            triggered: triggeredMilestones
        }));
    }
});

// استعادة الجلسة الأخيرة (اختياري)
window.addEventListener('load', function() {
    const lastSession = localStorage.getItem('lastSession');
    if (lastSession) {
        const session = JSON.parse(lastSession);
        // يمكن إضافة منطق لاستعادة الجلسة هنا إذا لزم الأمر
    }
});
