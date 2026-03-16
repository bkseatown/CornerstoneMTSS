/**
 * waveform-canvas.js
 * Real-time waveform visualization for voice recording and comparison
 */

const WaveformDisplay = (() => {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let audioData = null;
  let comparisonData = null;

  // Display configuration
  const config = {
    backgroundColor: '#ffffff',
    waveColor: '#0173b2',
    comparisonColor: '#de8f05',
    height: 200,
    padding: 20,
  };

  /**
   * Initialize waveform canvas
   * @param {string} containerId - Container element ID
   * @param {object} options - Configuration options
   */
  function init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container ${containerId} not found`);
      return false;
    }

    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = config.height;
    canvas.style.display = 'block';
    canvas.style.backgroundColor = config.backgroundColor;
    canvas.style.borderRadius = '4px';
    canvas.style.border = '2px solid #e0e0e0';
    container.appendChild(canvas);

    ctx = canvas.getContext('2d');

    // Merge options
    Object.assign(config, options);

    console.log('📊 WaveformDisplay initialized');
    return true;
  }

  /**
   * Draw live waveform from frequency data
   * @param {object} audioData - {frequencies: Uint8Array, bufferLength: number}
   */
  function drawLive(data) {
    if (!canvas || !ctx) return;

    audioData = data;
    draw();
  }

  /**
   * Set comparison waveform (model/reference audio)
   * @param {AudioBuffer} audioBuffer - Decoded audio buffer
   */
  function setComparison(audioBuffer) {
    if (!audioBuffer || !audioBuffer.getChannelData) return;

    const channel = audioBuffer.getChannelData(0);
    comparisonData = channel;
  }

  /**
   * Draw waveform on canvas
   */
  function draw() {
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw comparison waveform if available
    if (comparisonData) {
      drawComparisonWave();
    }

    // Draw live waveform
    if (audioData) {
      drawLiveWave();
    }

    // Draw center line
    drawCenterLine();
  }

  /**
   * Draw background grid
   */
  function drawGrid() {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    const gridSpacing = canvas.width / 8;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    const verticalSpacing = canvas.height / 4;
    for (let y = 0; y < canvas.height; y += verticalSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  /**
   * Draw live frequency waveform
   */
  function drawLiveWave() {
    if (!audioData || !audioData.frequencies) return;

    const data = audioData.frequencies;
    const bufferLength = audioData.bufferLength || data.length;

    ctx.strokeStyle = config.waveColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerY = canvas.height / 2;
    const scaleX = canvas.width / bufferLength;
    const scaleY = (canvas.height / 2) * 0.8;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < bufferLength; i++) {
      const normalized = data[i] / 255;
      const y = centerY - (normalized * scaleY - scaleY / 2);
      const x = i * scaleX;
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw frequency waveform as filled area
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = config.waveColor;
    ctx.lineTo(canvas.width, centerY);
    ctx.lineTo(0, centerY);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  /**
   * Draw comparison waveform (model/reference)
   */
  function drawComparisonWave() {
    if (!comparisonData) return;

    // Resample comparison data to canvas width
    const step = Math.ceil(comparisonData.length / canvas.width);
    const data = [];

    for (let i = 0; i < canvas.width; i++) {
      const dataIndex = i * step;
      if (dataIndex < comparisonData.length) {
        data.push(Math.abs(comparisonData[dataIndex]) * 255);
      }
    }

    ctx.strokeStyle = config.comparisonColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.6;

    const centerY = canvas.height / 2;
    const scaleY = (canvas.height / 2) * 0.8;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] / 255;
      const y = centerY - (normalized * scaleY - scaleY / 2);
      const x = i;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  }

  /**
   * Draw center reference line
   */
  function drawCenterLine() {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    const centerY = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * Compare two waveforms side-by-side
   * @param {AudioBuffer} studentBuffer - Student's recording
   * @param {AudioBuffer} modelBuffer - Model pronunciation
   */
  function compareWaveforms(studentBuffer, modelBuffer) {
    if (!canvas || !ctx) return;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = config.height * 2 + config.padding;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw student waveform (top)
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, config.height + config.padding / 2);
    ctx.fillStyle = '#000000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Your recording:', 10, 20);

    drawWaveform(studentBuffer, config.waveColor, config.padding, 0);

    // Draw model waveform (bottom)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, config.height + config.padding / 2, canvas.width, config.height + config.padding / 2);
    ctx.fillStyle = '#000000';
    ctx.fillText('Model pronunciation:', 10, config.height + config.padding + 20);

    drawWaveform(modelBuffer, config.comparisonColor, config.height + config.padding, 0);

    // Draw divergence highlights
    highlightDivergences(studentBuffer, modelBuffer);
  }

  /**
   * Draw a single waveform in a section
   */
  function drawWaveform(audioBuffer, color, offsetY, offsetX) {
    if (!audioBuffer || !audioBuffer.getChannelData) return;

    const channel = audioBuffer.getChannelData(0);
    const step = Math.ceil(channel.length / (canvas.width - 20));
    const sectionHeight = config.height - 40;
    const centerY = offsetY + config.height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(10, centerY);

    for (let i = 0; i < canvas.width - 20; i++) {
      const dataIndex = Math.floor(i * step);
      if (dataIndex < channel.length) {
        const value = channel[dataIndex];
        const y = centerY - (value * sectionHeight / 2);
        const x = i + 10;
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * Highlight areas where waveforms diverge significantly
   */
  function highlightDivergences(studentBuffer, modelBuffer) {
    if (!studentBuffer || !modelBuffer) return;

    const student = studentBuffer.getChannelData(0);
    const model = modelBuffer.getChannelData(0);
    const minLength = Math.min(student.length, model.length);

    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';

    const step = Math.ceil(minLength / (canvas.width - 20));

    for (let i = 0; i < canvas.width - 20; i++) {
      const dataIndex = Math.floor(i * step);
      if (dataIndex < minLength) {
        const studentVal = student[dataIndex];
        const modelVal = model[dataIndex];
        const divergence = Math.abs(studentVal - modelVal);

        if (divergence > 0.3) {
          const x = i + 10;
          ctx.fillRect(x, 0, 1, canvas.height);
        }
      }
    }
  }

  /**
   * Clear canvas
   */
  function clear() {
    if (!ctx || !canvas) return;

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Stop animation loop
   */
  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * Resize canvas to fit container
   */
  function resize() {
    if (!canvas) return;

    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
  }

  return {
    init,
    drawLive,
    setComparison,
    compareWaveforms,
    clear,
    stop,
    resize,
  };
})();
