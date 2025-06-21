// Global variables for clock, timer, and stopwatch
let digitalClockInterval;
let timerInterval;
let stopwatchInterval;
let timerRemaining = 0;
let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0;
let isTimerRunning = false;
let isStopwatchRunning = false;
let laps = [];

// Array to store alarms
let alarms = [];

// --- DOM Elements ---
const digitalClockDisplay = document.getElementById('digital-clock');
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const secondHand = document.getElementById('second-hand');
const timezoneDisplay = document.getElementById('timezone-display');
const currentDateDisplay = document.getElementById('current-date');
const beepSound = document.getElementById('beep-sound');

// Tab Buttons
const clockTabBtn = document.getElementById('clock-tab');
const alarmTabBtn = document.getElementById('alarm-tab');
const timerTabBtn = document.getElementById('timer-tab');
const stopwatchTabBtn = document.getElementById('stopwatch-tab');

// Tab Content Panels
const clockContent = document.getElementById('clock-content');
const alarmContent = document.getElementById('alarm-content');
const timerContent = document.getElementById('timer-content');
const stopwatchContent = document.getElementById('stopwatch-content');

// Alarm Elements
const alarmsList = document.getElementById('alarms-list');
const newAlarmTimeInput = document.getElementById('new-alarm-time');
const addAlarmBtn = document.getElementById('add-alarm-btn');

// Timer Elements
const timerHoursInput = document.getElementById('timer-hours');
const timerMinutesInput = document.getElementById('timer-minutes');
const timerSecondsInput = document.getElementById('timer-seconds');
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');

// Stopwatch Elements
const stopwatchDisplay = document.getElementById('stopwatch-display');
const startStopwatchBtn = document.getElementById('start-stopwatch-btn');
const pauseStopwatchBtn = document.getElementById('pause-stopwatch-btn');
const resetStopwatchBtn = document.getElementById('reset-stopwatch-btn');
const lapStopwatchBtn = document.getElementById('lap-stopwatch-btn');
const lapsList = document.getElementById('laps-list');

// Custom Modal Elements
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- Helper Functions ---

/**
 * Formats a number to have leading zeros if it's a single digit.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
function formatTwoDigits(num) {
    return num < 10 ? '0' + num : num;
}

/**
 * Formats milliseconds into a string with two decimal places.
 * @param {number} ms - The milliseconds to format.
 * @returns {string} The formatted milliseconds string.
 */
function formatMilliseconds(ms) {
    return (ms / 1000).toFixed(3).split('.')[1];
}

/**
 * Shows a custom modal with a given title and message.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content of the modal.
 */
function showCustomModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove('hidden');
    // Set z-index to ensure it's on top
    customModal.style.zIndex = '9999';
}

/**
 * Hides the custom modal.
 */
function hideCustomModal() {
    customModal.classList.add('hidden');
    customModal.style.zIndex = ''; // Remove z-index
}

/**
 * Plays a short beep sound.
 */
function playBeep() {
    if (beepSound) {
        beepSound.play().catch(e => console.error("Error playing sound:", e));
    }
}

/**
 * Requests notification permission from the user.
 */
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.warn('Notification permission denied.');
                showCustomModal("Permission Denied", "Notifications will not be shown as permission was denied.");
            }
        });
    } else {
        console.warn('Notifications not supported in this browser.');
    }
}

/**
 * Sends a notification to the user.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body text of the notification.
 */
function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        // Using a data URI for the icon to embed an SVG directly
        const iconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%235a5a5a' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.87 13.91l-4.73-2.73c-.2-.12-.32-.34-.32-.58V7.5c0-.41.34-.75.75-.75s.75.34.75.75v4.56l4.21 2.43c.36.21.49.66.28 1.02-.21.36-.66.49-1.02.28z'/></svg>`;
        const iconUrl = `data:image/svg+xml;base64,${btoa(iconSvg)}`;

        new Notification(title, {
            body: body,
            icon: iconUrl // Use the SVG data URI as the icon
        });
    }
}

// --- Clock Functions ---

/**
 * Updates the digital and analog clock display.
 */
function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Digital clock
    const formattedTime = `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
    digitalClockDisplay.textContent = formattedTime;

    // Analog clock hands (logo)
    // Calculate rotation for hands
    // Hour: 360 degrees / 12 hours = 30 degrees per hour. Plus 0.5 degree per minute (30/60)
    const hourRotation = (hours % 12) * 30 + (minutes * 0.5);
    // Minute: 360 degrees / 60 minutes = 6 degrees per minute
    const minuteRotation = minutes * 6 + (seconds * 0.1); // Also account for seconds for smoother minute hand
    // Second: 360 degrees / 60 seconds = 6 degrees per second
    const secondRotation = seconds * 6;

    hourHand.setAttribute('transform', `rotate(${hourRotation} 50 50)`);
    minuteHand.setAttribute('transform', `rotate(${minuteRotation} 50 50)`);
    secondHand.setAttribute('transform', `rotate(${secondRotation} 50 50)`);

    // Date display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);

    // Timezone display (once on load, or if needed on change)
    if (!timezoneDisplay.dataset.loaded) {
        timezoneDisplay.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        timezoneDisplay.dataset.loaded = 'true'; // Mark as loaded
    }

    // Check alarms
    checkAlarms(hours, minutes, seconds);
}

/**
 * Checks for active alarms and triggers notifications/sound.
 * @param {number} currentHour - Current hour.
 * @param {number} currentMinute - Current minute.
 * @param {number} currentSecond - Current second.
 */
function checkAlarms(currentHour, currentMinute, currentSecond) {
    alarms.forEach(alarm => {
        if (alarm.enabled &&
            alarm.time.hours === currentHour &&
            alarm.time.minutes === currentMinute &&
            currentSecond === 0 && // Trigger precisely at the minute mark
            !alarm.triggeredToday) { // Prevent multiple triggers on the same minute
            playBeep();
            sendNotification('Alarm!', `It's ${formatTwoDigits(alarm.time.hours)}:${formatTwoDigits(alarm.time.minutes)}`);
            showCustomModal('Alarm!', `It's ${formatTwoDigits(alarm.time.hours)}:${formatTwoDigits(alarm.time.minutes)}`);
            alarm.triggeredToday = true; // Mark as triggered for today
        }
    });

    // Reset triggeredToday flag at midnight to allow alarms to trigger again next day
    if (currentHour === 0 && currentMinute === 0 && currentSecond === 0) {
        alarms.forEach(alarm => alarm.triggeredToday = false);
    }
}


// --- Alarm Functions ---

/**
 * Renders the list of alarms in the UI.
 */
function renderAlarms() {
    alarmsList.innerHTML = ''; // Clear existing list
    if (alarms.length === 0) {
        alarmsList.innerHTML = '<p class="text-center text-[#b0b0b0]">No alarms set yet. Add one!</p>';
        return;
    }

    alarms.forEach((alarm, index) => {
        const alarmItem = document.createElement('div');
        alarmItem.className = 'alarm-item';
        alarmItem.innerHTML = `
            <span class="alarm-time">${formatTwoDigits(alarm.time.hours)}:${formatTwoDigits(alarm.time.minutes)}</span>
            <div class="alarm-actions flex items-center space-x-4">
                <label class="toggle-switch">
                    <input type="checkbox" ${alarm.enabled ? 'checked' : ''} data-index="${index}">
                    <span class="slider"></span>
                </label>
                <button class="delete-alarm-btn text-[#F44336] hover:text-[#da190b]" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        alarmsList.appendChild(alarmItem);
    });

    // Add event listeners for new elements
    document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => {
        toggle.onchange = (e) => toggleAlarm(e.target.dataset.index, e.target.checked);
    });
    document.querySelectorAll('.delete-alarm-btn').forEach(button => {
        button.onclick = (e) => deleteAlarm(e.currentTarget.dataset.index);
    });
}

/**
 * Adds a new alarm based on the input time.
 */
function addAlarm() {
    const timeValue = newAlarmTimeInput.value;
    if (timeValue) {
        const [hours, minutes] = timeValue.split(':').map(Number);
        // Check for duplicates
        const isDuplicate = alarms.some(alarm => alarm.time.hours === hours && alarm.time.minutes === minutes);
        if (isDuplicate) {
            showCustomModal("Duplicate Alarm", "An alarm for this time already exists.");
            return;
        }

        alarms.push({
            time: { hours, minutes },
            enabled: true,
            triggeredToday: false, // Flag to prevent multiple triggers in one day
            id: Date.now() // Unique ID for alarm
        });
        alarms.sort((a, b) => (a.time.hours * 60 + a.time.minutes) - (b.time.hours * 60 + b.time.minutes)); // Sort by time
        renderAlarms();
        newAlarmTimeInput.value = ''; // Clear input
        saveAlarms();
    } else {
        showCustomModal("Invalid Time", "Please select a time for the alarm.");
    }
}

/**
 * Toggles the enabled state of an alarm.
 * @param {number} index - The index of the alarm in the alarms array.
 * @param {boolean} isEnabled - The new enabled state.
 */
function toggleAlarm(index, isEnabled) {
    if (alarms[index]) {
        alarms[index].enabled = isEnabled;
        saveAlarms();
    }
}

/**
 * Deletes an alarm from the list.
 * @param {number} index - The index of the alarm to delete.
 */
function deleteAlarm(index) {
    if (confirm("Are you sure you want to delete this alarm?")) { // Using confirm for simplicity for now, would replace with custom modal
        alarms.splice(index, 1);
        renderAlarms();
        saveAlarms();
    }
}

/**
 * Saves alarms to localStorage.
 */
function saveAlarms() {
    localStorage.setItem('xiaomiClockAlarms', JSON.stringify(alarms));
}

/**
 * Loads alarms from localStorage.
 */
function loadAlarms() {
    const storedAlarms = localStorage.getItem('xiaomiClockAlarms');
    if (storedAlarms) {
        alarms = JSON.parse(storedAlarms);
        // Ensure triggeredToday is false on load for a fresh start each day
        alarms.forEach(alarm => alarm.triggeredToday = false);
        renderAlarms();
    }
}

// --- Timer Functions ---

/**
 * Updates the timer display.
 */
function updateTimerDisplay() {
    const totalSeconds = Math.max(0, Math.floor(timerRemaining / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    timerDisplay.textContent = `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
}

/**
 * Starts or resumes the timer.
 */
function startTimer() {
    if (isTimerRunning) return;

    if (timerRemaining === 0) { // If starting a new timer
        const hours = parseInt(timerHoursInput.value) || 0;
        const minutes = parseInt(timerMinutesInput.value) || 0;
        const seconds = parseInt(timerSecondsInput.value) || 0;
        timerRemaining = (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    if (timerRemaining <= 0) {
        showCustomModal("No Time Set", "Please set a duration for the timer.");
        return;
    }

    isTimerRunning = true;
    startTimerBtn.classList.add('hidden');
    pauseTimerBtn.classList.remove('hidden');

    timerInterval = setInterval(() => {
        timerRemaining -= 1000;
        updateTimerDisplay();

        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startTimerBtn.classList.remove('hidden');
            pauseTimerBtn.classList.add('hidden');
            playBeep();
            sendNotification('Timer Finished!', 'Your timer has ended.');
            showCustomModal('Timer Finished!', 'Your timer has ended.');
            timerRemaining = 0; // Reset for next start
            updateTimerDisplay();
        }
    }, 1000);
}

/**
 * Pauses the timer.
 */
function pauseTimer() {
    if (!isTimerRunning) return;
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.add('hidden');
}

/**
 * Resets the timer to its initial state.
 */
function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerRemaining = 0;
    timerHoursInput.value = 0;
    timerMinutesInput.value = 0;
    timerSecondsInput.value = 0;
    updateTimerDisplay();
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.add('hidden');
}

// --- Stopwatch Functions ---

/**
 * Updates the stopwatch display.
 */
function updateStopwatchDisplay() {
    const elapsed = isStopwatchRunning ? Date.now() - stopwatchStartTime + stopwatchElapsedTime : stopwatchElapsedTime;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    const milliseconds = Math.floor((elapsed % 1000));

    stopwatchDisplay.textContent = `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}.${formatMilliseconds(milliseconds)}`;
}

/**
 * Starts or resumes the stopwatch.
 */
function startStopwatch() {
    if (isStopwatchRunning) return;
    isStopwatchRunning = true;
    stopwatchStartTime = Date.now();
    startStopwatchBtn.classList.add('hidden');
    pauseStopwatchBtn.classList.remove('hidden');
    stopwatchInterval = setInterval(updateStopwatchDisplay, 10); // Update every 10ms for milliseconds
}

/**
 * Pauses the stopwatch.
 */
function pauseStopwatch() {
    if (!isStopwatchRunning) return;
    clearInterval(stopwatchInterval);
    isStopwatchRunning = false;
    stopwatchElapsedTime += Date.now() - stopwatchStartTime;
    startStopwatchBtn.classList.remove('hidden');
    pauseStopwatchBtn.classList.add('hidden');
    updateStopwatchDisplay(); // Ensure display is updated one last time
}

/**
 * Resets the stopwatch to zero.
 */
function resetStopwatch() {
    clearInterval(stopwatchInterval);
    isStopwatchRunning = false;
    stopwatchStartTime = 0;
    stopwatchElapsedTime = 0;
    laps = [];
    renderLaps();
    stopwatchDisplay.textContent = '00:00:00.000';
    startStopwatchBtn.classList.remove('hidden');
    pauseStopwatchBtn.classList.add('hidden');
}

/**
 * Records a lap time for the stopwatch.
 */
function recordLap() {
    if (!isStopwatchRunning) return;
    const elapsed = Date.now() - stopwatchStartTime + stopwatchElapsedTime;
    laps.push(elapsed);
    renderLaps();
    // Scroll to the bottom of the laps list
    lapsList.scrollTop = lapsList.scrollHeight;
}

/**
 * Renders the recorded lap times in the UI.
 */
function renderLaps() {
    lapsList.innerHTML = ''; // Clear existing laps
    if (laps.length === 0) {
        lapsList.innerHTML = '<p class="text-center text-[#b0b0b0]">No laps recorded yet.</p>';
        return;
    }

    laps.forEach((lapTime, index) => {
        const hours = Math.floor(lapTime / (1000 * 60 * 60));
        const minutes = Math.floor((lapTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((lapTime % (1000 * 60)) / 1000);
        const milliseconds = Math.floor((lapTime % 1000));

        const lapItem = document.createElement('div');
        lapItem.className = 'lap-item';
        lapItem.innerHTML = `
            <span class="text-[#b0b0b0]">Lap ${index + 1}:</span>
            <span class="lap-time">${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}.${formatMilliseconds(milliseconds)}</span>
        `;
        lapsList.appendChild(lapItem);
    });
}

// --- Tab Switching Logic ---

/**
 * Activates a specific tab and shows its content.
 * @param {HTMLElement} tabButton - The button element of the tab to activate.
 * @param {HTMLElement} tabPanel - The content panel element of the tab to show.
 */
function activateTab(tabButton, tabPanel) {
    // Deactivate all tabs and hide all panels
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

    // Activate the clicked tab and show its panel
    tabButton.classList.add('active');
    tabPanel.classList.remove('hidden');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup for clock
    updateClock();
    digitalClockInterval = setInterval(updateClock, 1000); // Update every second

    // Request notification permission on page load
    requestNotificationPermission();

    // Load alarms from localStorage
    loadAlarms();

    // Tab button click handlers
    clockTabBtn.addEventListener('click', () => activateTab(clockTabBtn, clockContent));
    alarmTabBtn.addEventListener('click', () => activateTab(alarmTabBtn, alarmContent));
    timerTabBtn.addEventListener('click', () => activateTab(timerTabBtn, timerContent));
    stopwatchTabBtn.addEventListener('click', () => activateTab(stopwatchTabBtn, stopwatchContent));

    // Alarm listeners
    addAlarmBtn.addEventListener('click', addAlarm);

    // Timer listeners
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    // Stopwatch listeners
    startStopwatchBtn.addEventListener('click', startStopwatch);
    pauseStopwatchBtn.addEventListener('click', pauseStopwatch);
    resetStopwatchBtn.addEventListener('click', resetStopwatch);
    lapStopwatchBtn.addEventListener('click', recordLap);

    // Custom Modal close button
    modalCloseBtn.addEventListener('click', hideCustomModal);

    // Add PWA service worker registration (for installability and widget potential)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
});
