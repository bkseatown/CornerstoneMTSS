/**
 * voice-recorder.js
 * Captures audio from microphone with real-time waveform visualization
 * Uses Web Audio API for capture and analysis
 */

const VoiceRecorder = (() => {
  let audioContext = null;
  let mediaStreamSource = null;
  let analyser = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let dataArray = null;
  let animationId = null;

  // Configuration
  const config = {
    sampleRate: 44100,
    fftSize: 2048,
    bufferLength: 4096,
  };

  /**
   * Initialize audio context and request microphone access
   * @param {object} options - Configuration options
   * @param {function} onPermissionGranted - Callback when microphone access granted
   * @param {function} onError - Callback on error
   */
  function init(options = {}, onPermissionGranted = null, onError = null) {
    if (audioContext) return Promise.resolve();

    const mergedConfig = { ...config, ...options };

    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Initialize audio context
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: mergedConfig.sampleRate
          });
        }

        // Create analyser
        if (!mediaStreamSource) {
          mediaStreamSource = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = mergedConfig.fftSize;
          analyser.smoothingTimeConstant = 0.85;
          mediaStreamSource.connect(analyser);
        }

        // Setup MediaRecorder
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        // Initialize data array for visualization
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        if (onPermissionGranted) onPermissionGranted();

        console.log('🎤 VoiceRecorder initialized');
        return true;
      })
      .catch(err => {
        console.error('❌ Microphone access denied:', err);
        if (onError) onError(err);
        return false;
      });
  }

  /**
   * Start recording audio
   * @param {function} onVisualize - Callback with real-time audio data
   */
  function startRecording(onVisualize = null) {
    if (!mediaRecorder || isRecording) return;

    audioChunks = [];
    isRecording = true;
    mediaRecorder.start();

    console.log('🔴 Recording started');

    // Start visualization loop
    if (onVisualize && analyser) {
      const visualize = () => {
        animationId = requestAnimationFrame(visualize);
        analyser.getByteFrequencyData(dataArray);
        onVisualize({
          frequencies: new Uint8Array(dataArray),
          bufferLength: analyser.frequencyBinCount,
          sampleRate: audioContext.sampleRate,
        });
      };
      visualize();
    }
  }

  /**
   * Stop recording and return audio blob
   * @returns {Promise<Blob>} Audio blob
   */
  function stopRecording() {
    return new Promise((resolve) => {
      if (!mediaRecorder || !isRecording) {
        resolve(null);
        return;
      }

      isRecording = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        console.log('⏹️ Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }

  /**
   * Get current recording status
   */
  function isActive() {
    return isRecording;
  }

  /**
   * Get current frequency data (for visualization)
   */
  function getFrequencyData() {
    if (!analyser) return null;
    analyser.getByteFrequencyData(dataArray);
    return new Uint8Array(dataArray);
  }

  /**
   * Get time-domain waveform data
   */
  function getWaveformData() {
    if (!analyser) return null;
    const waveData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(waveData);
    return waveData;
  }

  /**
   * Convert audio blob to ArrayBuffer
   */
  function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Decode audio blob to AudioBuffer
   */
  function decodeAudio(blob) {
    return blobToArrayBuffer(blob)
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));
  }

  /**
   * Playback audio blob
   */
  function playAudio(blob) {
    return decodeAudio(blob)
      .then(audioBuffer => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        return source;
      });
  }

  /**
   * Get audio context for advanced analysis
   */
  function getAudioContext() {
    return audioContext;
  }

  /**
   * Get analyser node for advanced analysis
   */
  function getAnalyser() {
    return analyser;
  }

  return {
    init,
    startRecording,
    stopRecording,
    isActive,
    getFrequencyData,
    getWaveformData,
    blobToArrayBuffer,
    decodeAudio,
    playAudio,
    getAudioContext,
    getAnalyser,
  };
})();
