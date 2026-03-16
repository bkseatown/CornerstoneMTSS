/**
 * voice-analyzer.js
 * Analyzes audio for pitch, tempo, clarity, and phoneme accuracy
 * Compares student recording to model audio
 */

const VoiceAnalyzer = (() => {
  /**
   * Detect dominant frequency (pitch) from audio buffer
   * Uses FFT frequency analysis to find fundamental frequency
   * @param {AudioBuffer} audioBuffer - Decoded audio
   * @returns {number} Frequency in Hz
   */
  function detectPitch(audioBuffer) {
    if (!audioBuffer) return 0;

    const audioContext = VoiceRecorder?.getAudioContext();
    if (!audioContext) return 0;

    // Create offline context for analysis
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create analyser
    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 4096;

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(offlineContext.destination);

    source.start();

    // Get frequency data
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    // Find peak frequency
    let maxValue = 0;
    let maxFrequency = 0;

    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxValue) {
        maxValue = freqData[i];
        // Convert bin index to Hz
        maxFrequency = (i * audioBuffer.sampleRate) / (2 * analyser.fftSize);
      }
    }

    return maxFrequency;
  }

  /**
   * Analyze audio energy (clarity/loudness)
   * @param {AudioBuffer} audioBuffer - Decoded audio
   * @returns {number} RMS energy (0-1)
   */
  function analyzeClarity(audioBuffer) {
    if (!audioBuffer || !audioBuffer.getChannelData) return 0;

    const channel = audioBuffer.getChannelData(0);
    let sum = 0;

    for (let i = 0; i < channel.length; i++) {
      sum += channel[i] * channel[i];
    }

    const rms = Math.sqrt(sum / channel.length);
    // Normalize to 0-1 (typical speech is 0.1-0.5)
    return Math.min(1, rms * 2);
  }

  /**
   * Detect tempo/rhythm from audio
   * Uses energy envelope to estimate tempo
   * @param {AudioBuffer} audioBuffer - Decoded audio
   * @returns {number} Estimated BPM
   */
  function analyzeTempo(audioBuffer) {
    if (!audioBuffer || !audioBuffer.getChannelData) return 0;

    const channel = audioBuffer.getChannelData(0);
    const windowSize = Math.floor(audioBuffer.sampleRate * 0.1); // 100ms windows
    const energyEnvelope = [];

    // Calculate energy in each window
    for (let i = 0; i < channel.length; i += windowSize) {
      let windowEnergy = 0;
      for (let j = 0; j < windowSize && i + j < channel.length; j++) {
        windowEnergy += channel[i + j] * channel[i + j];
      }
      energyEnvelope.push(Math.sqrt(windowEnergy / windowSize));
    }

    // Find peaks in energy envelope (beats)
    const peaks = [];
    const threshold = energyEnvelope.reduce((a, b) => a + b) / energyEnvelope.length * 0.5;

    for (let i = 1; i < energyEnvelope.length - 1; i++) {
      if (energyEnvelope[i] > threshold &&
          energyEnvelope[i] > energyEnvelope[i - 1] &&
          energyEnvelope[i] >= energyEnvelope[i + 1]) {
        peaks.push(i);
      }
    }

    // Estimate BPM from peak spacing
    if (peaks.length < 2) return 0;

    let avgSpacing = 0;
    for (let i = 1; i < peaks.length; i++) {
      avgSpacing += peaks[i] - peaks[i - 1];
    }
    avgSpacing /= (peaks.length - 1);

    // Convert window spacing to BPM (assuming 100ms windows)
    const beatDuration = avgSpacing * 0.1; // in seconds
    const bpm = Math.round(60 / beatDuration);

    return Math.max(0, Math.min(300, bpm)); // Clamp to 0-300 BPM
  }

  /**
   * Simple phoneme alignment score
   * Compares two audio buffers using spectral similarity
   * @param {AudioBuffer} studentBuffer - Student's recording
   * @param {AudioBuffer} modelBuffer - Model pronunciation
   * @returns {number} Similarity score (0-1)
   */
  function analyzePhonemeSimilarity(studentBuffer, modelBuffer) {
    if (!studentBuffer || !modelBuffer) return 0;

    // Get spectral data from both
    const studentSpectrum = getSpectralProfile(studentBuffer);
    const modelSpectrum = getSpectralProfile(modelBuffer);

    // Calculate cosine similarity
    let dotProduct = 0;
    let studentMagnitude = 0;
    let modelMagnitude = 0;

    for (let i = 0; i < Math.min(studentSpectrum.length, modelSpectrum.length); i++) {
      dotProduct += studentSpectrum[i] * modelSpectrum[i];
      studentMagnitude += studentSpectrum[i] * studentSpectrum[i];
      modelMagnitude += modelSpectrum[i] * modelSpectrum[i];
    }

    if (studentMagnitude === 0 || modelMagnitude === 0) return 0;

    return dotProduct / (Math.sqrt(studentMagnitude) * Math.sqrt(modelMagnitude));
  }

  /**
   * Get spectral profile (MFCC-like feature) of audio
   * @param {AudioBuffer} audioBuffer - Audio to analyze
   * @returns {Float32Array} Spectral features
   */
  function getSpectralProfile(audioBuffer) {
    if (!audioBuffer || !audioBuffer.getChannelData) {
      return new Float32Array(13);
    }

    const channel = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const numFrames = Math.floor(channel.length / fftSize);
    const spectrum = new Float32Array(13);

    // Extract features from multiple frames
    for (let frameIdx = 0; frameIdx < Math.min(numFrames, 10); frameIdx++) {
      const frame = channel.slice(frameIdx * fftSize, (frameIdx + 1) * fftSize);

      // Apply Hann window
      for (let i = 0; i < frame.length; i++) {
        frame[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (frame.length - 1)));
      }

      // Simple FFT approximation using frequency bins
      for (let binIdx = 0; binIdx < spectrum.length; binIdx++) {
        const freq = (binIdx + 1) * audioBuffer.sampleRate / fftSize;
        spectrum[binIdx] += Math.sqrt(getFrequencyBinMagnitude(frame, freq, audioBuffer.sampleRate));
      }
    }

    // Average over frames
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] /= Math.min(numFrames, 10);
    }

    return spectrum;
  }

  /**
   * Approximate magnitude at frequency using Goertzel algorithm
   */
  function getFrequencyBinMagnitude(signal, frequency, sampleRate) {
    const N = signal.length;
    const k = (frequency * N) / sampleRate;
    const w = (2 * Math.PI * k) / N;

    let s0 = 0, s1 = 0, s2 = 0;
    const coeff = 2 * Math.cos(w);

    for (let i = 0; i < N; i++) {
      s0 = signal[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    const real = s1 - s2 * Math.cos(w);
    const imag = s2 * Math.sin(w);

    return real * real + imag * imag;
  }

  /**
   * Compare student audio to model audio
   * @param {AudioBuffer} studentBuffer - Student's recording
   * @param {AudioBuffer} modelBuffer - Model pronunciation
   * @returns {object} Analysis results with suggestions
   */
  function analyze(studentBuffer, modelBuffer) {
    // Detect pitch for both
    const studentPitch = detectPitch(studentBuffer);
    const modelPitch = detectPitch(modelBuffer);

    // Analyze tempo for both
    const studentTempo = analyzeTempo(studentBuffer);
    const modelTempo = analyzeTempo(modelBuffer);

    // Analyze clarity
    const studentClarity = analyzeClarity(studentBuffer);

    // Analyze phoneme similarity
    const phonemeAccuracy = analyzePhonemeSimilarity(studentBuffer, modelBuffer);

    // Calculate match percentages
    const pitchMatch = studentPitch > 0 && modelPitch > 0
      ? Math.round(100 * (1 - Math.abs(studentPitch - modelPitch) / Math.max(studentPitch, modelPitch)))
      : 0;

    const tempoMatch = studentTempo > 0 && modelTempo > 0
      ? Math.round(100 * (1 - Math.abs(studentTempo - modelTempo) / Math.max(studentTempo, modelTempo)))
      : 0;

    // Generate suggestions
    const suggestions = generateSuggestions({
      pitchMatch,
      tempoMatch,
      studentClarity,
      phonemeAccuracy,
      studentTempo,
      modelTempo,
    });

    return {
      pitch: {
        studentHz: Math.round(studentPitch),
        modelHz: Math.round(modelPitch),
        match: pitchMatch,
      },
      tempo: {
        studentBPM: studentTempo,
        modelBPM: modelTempo,
        match: tempoMatch,
      },
      clarity: studentClarity,
      phonemeAccuracy: phonemeAccuracy,
      suggestions,
      score: Math.round((pitchMatch + tempoMatch + phonemeAccuracy * 100) / 3),
    };
  }

  /**
   * Generate actionable feedback based on analysis
   */
  function generateSuggestions(analysis) {
    const suggestions = [];

    const { pitchMatch, tempoMatch, studentClarity, phonemeAccuracy, studentTempo, modelTempo } = analysis;

    // Pitch feedback
    if (pitchMatch >= 90) {
      suggestions.push("⭐ Excellent pitch! Very close to the model.");
    } else if (pitchMatch >= 75) {
      suggestions.push("✓ Good pitch! Within acceptable range.");
    } else if (pitchMatch >= 50) {
      suggestions.push("→ Pitch is a bit different. Try to match the model more closely.");
    } else {
      suggestions.push("⚠️ Pitch needs work. Listen to the model again and try matching it.");
    }

    // Tempo feedback
    if (tempoMatch >= 85) {
      suggestions.push("⭐ Great pace! Right on tempo.");
    } else if (studentTempo < modelTempo) {
      suggestions.push(`→ A bit slow. Try speaking at ${modelTempo} BPM instead of ${studentTempo}.`);
    } else {
      suggestions.push(`→ A bit fast. Try slowing to ${modelTempo} BPM instead of ${studentTempo}.`);
    }

    // Clarity feedback
    if (studentClarity >= 0.7) {
      suggestions.push("✓ Clear and confident voice!");
    } else if (studentClarity >= 0.4) {
      suggestions.push("→ Speak a bit louder and clearer.");
    } else {
      suggestions.push("⚠️ Too quiet or unclear. Speak more confidently.");
    }

    // Phoneme feedback
    if (phonemeAccuracy >= 0.85) {
      suggestions.push("⭐ Pronunciation is excellent!");
    } else if (phonemeAccuracy >= 0.7) {
      suggestions.push("✓ Pronunciation is good.");
    } else {
      suggestions.push("→ Practice the pronunciation a few more times.");
    }

    return suggestions;
  }

  return {
    analyze,
    detectPitch,
    analyzeTempo,
    analyzeClarity,
    analyzePhonemeSimilarity,
  };
})();
