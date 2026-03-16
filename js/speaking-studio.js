/**
 * Speaking Studio: Interactive Voice Recording & Self-Assessment
 * Privacy-first audio recording with Web Audio API
 * Supports local-only storage and playback with waveform visualization
 */

(function() {
  'use strict';

  // Activity definitions
  const ACTIVITIES = {
    'fluency': {
      title: 'Fluency Practice',
      prompt: 'Read the following passage aloud at a natural, steady pace. Focus on clear pronunciation and smooth expression.',
      passage: '"The old lighthouse stood on the rocky cliff, its white paint peeling in the salt spray. Every evening, the lighthouse keeper would climb the narrow spiral stairs to light the great beacon that guided ships safely through the foggy waters."',
      icon: '📖'
    },
    'articulation': {
      title: 'Articulation & Pronunciation',
      prompt: 'Read each word clearly, focusing on proper pronunciation of difficult sounds.',
      passage: 'Articulation, pronunciation, comprehension, vocabulary, phonetics, enthusiasm, responsibility, contribution.',
      icon: '🎙️'
    },
    'presentation': {
      title: 'Prepared Speech',
      prompt: 'Present your prepared speech or presentation. Remember to speak clearly and maintain a steady pace.',
      passage: '(Use your own prepared content)',
      icon: '🎤'
    },
    'response': {
      title: 'Language Response',
      prompt: 'Answer the question in complete sentences: "Describe your favorite book and explain why you enjoyed it."',
      passage: '(Record your response to the question)',
      icon: '💬'
    }
  };

  // App state
  const state = {
    currentActivity: 'fluency',
    isRecording: false,
    audioContext: null,
    mediaStream: null,
    analyser: null,
    dataArray: null,
    recordedChunks: [],
    audioBlob: null,
    audioUrl: null,
    isPlaying: false,
    playbackRate: 1,
    volume: 1,
    assessmentRatings: {},
    reflectionNotes: '',
    recordingStartTime: null,
    recordingDuration: 0,
    timerInterval: null
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
    setupEventListeners();
    updateActivityPrompt();
  });

  // ==================== UI Initialization ====================

  function initializeUI() {
    // Initialize activity menu
    const activityMenu = document.getElementById('ss-activity-menu');
    const activities = Object.entries(ACTIVITIES);

    activityMenu.addEventListener('click', function() {
      showActivityMenu();
    });
  }

  function showActivityMenu() {
    const activities = Object.entries(ACTIVITIES);
    const currentActivity = state.currentActivity;

    // Create menu buttons
    const menuItems = activities
      .map(([key, data]) =>
        `<button class="activity-option ${key === currentActivity ? 'selected' : ''}" data-activity="${key}">
          ${data.icon} ${data.title}
        </button>`
      )
      .join('');

    // Show menu (simple implementation - could be expanded to modal)
    const labels = ['fluency', 'articulation', 'presentation', 'response'];
    let index = labels.indexOf(currentActivity);
    index = (index + 1) % labels.length;
    switchActivity(labels[index]);
  }

  function switchActivity(activityKey) {
    state.currentActivity = activityKey;
    updateActivityPrompt();
    document.getElementById('ss-activity-label').textContent = ACTIVITIES[activityKey].title;
  }

  function updateActivityPrompt() {
    const activity = ACTIVITIES[state.currentActivity];
    document.getElementById('ss-prompt-title').textContent = activity.title;
    document.getElementById('ss-prompt-text').textContent = activity.prompt;
    document.getElementById('ss-passage-text').innerHTML = `<p>${activity.passage}</p>`;
  }

  // ==================== Event Listeners ====================

  function setupEventListeners() {
    // Record button
    const recordBtn = document.getElementById('ss-record-btn');
    recordBtn.addEventListener('click', toggleRecording);

    // New recording button
    const newRecordingBtn = document.getElementById('ss-new-recording');
    newRecordingBtn.addEventListener('click', startNewRecording);

    // Play button
    const playBtn = document.getElementById('ss-play-btn');
    playBtn.addEventListener('click', togglePlayback);

    // Playback progress bar
    const progressContainer = document.querySelector('.ss-playback-progress-container');
    progressContainer.addEventListener('click', seekPlayback);

    // Speed control
    const speedSelect = document.getElementById('ss-speed-select');
    speedSelect.addEventListener('change', handleSpeedChange);

    // Volume control
    const volumeSlider = document.getElementById('ss-volume-slider');
    volumeSlider.addEventListener('input', handleVolumeChange);

    // Rating buttons
    const ratingButtons = document.querySelectorAll('.ss-rating-btn');
    ratingButtons.forEach(btn => {
      btn.addEventListener('click', handleRating);
    });

    // Reflection text
    const reflectionText = document.getElementById('ss-reflection-text');
    reflectionText.addEventListener('input', function() {
      state.reflectionNotes = this.value;
    });

    // Save button
    const saveBtn = document.getElementById('ss-save-btn');
    saveBtn.addEventListener('click', saveRecording);

    // Export button
    const exportBtn = document.getElementById('ss-export-btn');
    exportBtn.addEventListener('click', exportAudio);

    // Delete button
    const deleteBtn = document.getElementById('ss-delete-btn');
    deleteBtn.addEventListener('click', deleteRecording);
  }

  // ==================== Recording Functions ====================

  async function toggleRecording() {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function startRecording() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      state.mediaStream = stream;
      state.recordedChunks = [];

      // Initialize Web Audio API
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const context = state.audioContext;

      // Create analyser
      state.analyser = context.createAnalyser();
      state.analyser.fftSize = 256;
      state.dataArray = new Uint8Array(state.analyser.frequencyBinCount);

      // Create media stream source and connect
      const source = context.createMediaStreamSource(stream);
      source.connect(state.analyser);

      // Create recorder (using MediaRecorder API)
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          state.recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob
        state.audioBlob = new Blob(state.recordedChunks, { type: mediaRecorder.mimeType });
        state.audioUrl = URL.createObjectURL(state.audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Update UI
        updateRecordingUI(false);
        enablePlaybackControls();
        drawPlaybackWaveform();
      };

      // Start recording
      state.isRecording = true;
      state.recordingStartTime = Date.now();
      mediaRecorder.start();
      state.mediaRecorder = mediaRecorder;

      // Update UI
      updateRecordingUI(true);

      // Start timer
      startRecordingTimer();

      // Start waveform visualization
      visualizeRecording();

      showNotification('🎙️ Recording started...');
    } catch (error) {
      console.error('Microphone access denied:', error);
      showNotification('❌ Microphone access denied. Please allow microphone access to record.');
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      state.isRecording = false;
      stopRecordingTimer();
      showNotification('✅ Recording complete!');
    }
  }

  function startNewRecording() {
    if (state.audioBlob) {
      if (!confirm('Start a new recording? Your current recording will be cleared.')) {
        return;
      }
    }

    // Reset state
    state.audioBlob = null;
    state.audioUrl = null;
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    state.recordedChunks = [];
    state.assessmentRatings = {};
    state.reflectionNotes = '';
    state.recordingDuration = 0;

    // Reset UI
    document.getElementById('ss-timer').textContent = '0:00';
    document.getElementById('ss-status-text').textContent = 'Ready to record';
    document.getElementById('ss-reflection-text').value = '';

    // Clear canvas
    const canvas = document.getElementById('ss-waveform-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear playback elements
    document.getElementById('ss-no-recording-message').style.display = 'block';
    document.getElementById('ss-playback-waveform-container').style.display = 'none';

    // Reset rating buttons
    document.querySelectorAll('.ss-rating-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    // Disable controls
    disablePlaybackControls();

    showNotification('🆕 New recording ready');
  }

  // ==================== Recording Timer ====================

  function startRecordingTimer() {
    let elapsedTime = 0;
    state.timerInterval = setInterval(() => {
      elapsedTime++;
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      document.getElementById('ss-timer').textContent = timeString;
      document.getElementById('ss-status-text').textContent = 'Recording...';
    }, 1000);
  }

  function stopRecordingTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      const timerText = document.getElementById('ss-timer').textContent;
      state.recordingDuration = timerText;
    }
  }

  // ==================== Waveform Visualization ====================

  function visualizeRecording() {
    const canvas = document.getElementById('ss-waveform-canvas');
    const ctx = canvas.getContext('2d');

    function draw() {
      if (!state.isRecording) return;

      // Clear canvas
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get frequency data
      state.analyser.getByteFrequencyData(state.dataArray);

      // Draw waveform
      const barWidth = (canvas.width / state.dataArray.length) * 2.5;
      let x = 0;

      for (let i = 0; i < state.dataArray.length; i++) {
        const barHeight = (state.dataArray[i] / 255) * canvas.height;

        // Color based on volume
        if (state.dataArray[i] < 85) {
          ctx.fillStyle = '#3b82f6'; // Blue
        } else if (state.dataArray[i] < 170) {
          ctx.fillStyle = '#fbbf24'; // Yellow
        } else {
          ctx.fillStyle = '#ef4444'; // Red
        }

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

  function drawPlaybackWaveform() {
    if (!state.audioUrl) return;

    const canvas = document.getElementById('ss-playback-waveform-canvas');
    const ctx = canvas.getContext('2d');

    // Read audio file and decode
    const audioContext = state.audioContext;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', state.audioUrl);
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      audioContext.decodeAudioData(xhr.response, function(audioBuffer) {
        drawWaveform(canvas, audioBuffer);
      });
    };

    xhr.send();
  }

  function drawWaveform(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Get audio data
    const rawData = audioBuffer.getChannelData(0);
    const samples = Math.floor(rawData.length / width);

    // Draw waveform
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      let sum = 0;
      for (let j = 0; j < samples; j++) {
        sum += Math.abs(rawData[i * samples + j]);
      }
      const average = sum / samples;
      const y = height / 2 - average * height / 2;

      ctx.lineTo(i, y);
    }

    ctx.stroke();
  }

  // ==================== Playback Functions ====================

  function togglePlayback() {
    if (!state.audioUrl) return;

    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = state.audioContext;
    const audio = new Audio(state.audioUrl);

    // Set playback rate and volume
    audio.playbackRate = state.playbackRate;
    audio.volume = state.volume;

    // Update UI
    state.isPlaying = true;
    document.getElementById('ss-play-btn').textContent = '⏸️';
    state.audioElement = audio;

    // Update progress
    audio.addEventListener('timeupdate', updatePlaybackProgress);
    audio.addEventListener('ended', () => {
      state.isPlaying = false;
      document.getElementById('ss-play-btn').textContent = '▶️';
    });

    audio.play();
  }

  function pausePlayback() {
    if (state.audioElement) {
      state.audioElement.pause();
      state.isPlaying = false;
      document.getElementById('ss-play-btn').textContent = '▶️';
    }
  }

  function seekPlayback(event) {
    if (!state.audioElement) return;

    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    state.audioElement.currentTime = percent * state.audioElement.duration;
  }

  function updatePlaybackProgress() {
    if (!state.audioElement) return;

    const progress = (state.audioElement.currentTime / state.audioElement.duration) * 100;
    document.getElementById('ss-playback-progress').style.width = progress + '%';

    // Update time display
    const current = formatTime(state.audioElement.currentTime);
    const duration = formatTime(state.audioElement.duration);
    document.querySelector('.ss-current-time').textContent = current;
    document.querySelector('.ss-duration-time').textContent = duration;
  }

  function handleSpeedChange(event) {
    state.playbackRate = parseFloat(event.target.value);
    if (state.audioElement) {
      state.audioElement.playbackRate = state.playbackRate;
    }
  }

  function handleVolumeChange(event) {
    state.volume = event.target.value / 100;
    if (state.audioElement) {
      state.audioElement.volume = state.volume;
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ==================== Self-Assessment ====================

  function handleRating(event) {
    const btn = event.target.closest('.ss-rating-btn');
    if (!btn) return;

    // Get assessment category
    const parent = btn.closest('.ss-assessment-item');
    const categoryName = parent.querySelector('h3').textContent;
    const rating = btn.getAttribute('data-rating');

    // Update state
    state.assessmentRatings[categoryName] = rating;

    // Update UI
    const siblings = btn.parentElement.querySelectorAll('.ss-rating-btn');
    siblings.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  // ==================== Save & Export ====================

  function saveRecording() {
    if (!state.audioBlob) return;

    const recording = {
      id: Date.now(),
      activity: state.currentActivity,
      duration: state.recordingDuration,
      timestamp: new Date().toISOString(),
      ratings: state.assessmentRatings,
      reflection: state.reflectionNotes,
      blob: state.audioBlob
    };

    // Save to localStorage (blob as base64)
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const savedRecordings = JSON.parse(localStorage.getItem('ss.recordings') || '[]');
      const recordingData = {
        id: recording.id,
        activity: recording.activity,
        duration: recording.duration,
        timestamp: recording.timestamp,
        ratings: recording.ratings,
        reflection: recording.reflection,
        audioData: base64
      };
      savedRecordings.push(recordingData);
      localStorage.setItem('ss.recordings', JSON.stringify(savedRecordings));
    };
    reader.readAsDataURL(state.audioBlob);

    showNotification('💾 Recording saved successfully!');
  }

  function exportAudio() {
    if (!state.audioBlob) return;

    const url = state.audioUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `speaking-studio-${state.currentActivity}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showNotification('📥 Audio exported!');
  }

  function deleteRecording() {
    if (!state.audioBlob) return;

    if (confirm('Delete this recording? This cannot be undone.')) {
      startNewRecording();
    }
  }

  // ==================== UI Helpers ====================

  function updateRecordingUI(isRecording) {
    const recordBtn = document.getElementById('ss-record-btn');
    const statusDot = document.querySelector('.ss-status-dot');

    if (isRecording) {
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏹️\nStop';
      statusDot.classList.add('recording');
    } else {
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🎙️\nRecord';
      statusDot.classList.remove('recording');
    }
  }

  function enablePlaybackControls() {
    document.getElementById('ss-play-btn').disabled = false;
    document.getElementById('ss-speed-select').disabled = false;
    document.getElementById('ss-volume-slider').disabled = false;
    document.getElementById('ss-save-btn').disabled = false;
    document.getElementById('ss-export-btn').disabled = false;
    document.getElementById('ss-delete-btn').disabled = false;

    // Show waveform, hide no-recording message
    document.getElementById('ss-no-recording-message').style.display = 'none';
    document.querySelector('.ss-playback-waveform-container').style.display = 'flex';
  }

  function disablePlaybackControls() {
    document.getElementById('ss-play-btn').disabled = true;
    document.getElementById('ss-speed-select').disabled = true;
    document.getElementById('ss-volume-slider').disabled = true;
    document.getElementById('ss-save-btn').disabled = true;
    document.getElementById('ss-export-btn').disabled = true;
    document.getElementById('ss-delete-btn').disabled = true;
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'ss-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-weight: 600;
      animation: slideIn 300ms ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 300ms ease';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  // Expose for testing
  window.SpeakingStudio = {
    state,
    toggleRecording,
    togglePlayback,
    switchActivity
  };
})();
