/**
 * Writers Studio: Interactive Writing Organization Tool
 * Supports Story Map, Concept Map, Opinion Map, and Circle Map organizers
 * Grounded in Wilson Brainframes methodology
 */

(function() {
  'use strict';

  // App state
  const state = {
    currentOrganizer: 'story-map',
    mode: 'individual', // 'individual' or 'group' (projection)
    complexityLevel: 2, // 1 (heavy scaffolding), 2 (moderate), 3 (minimal)
    storyMapData: {
      setting: '',
      character: '',
      problem: '',
      climax: '',
      resolution: ''
    },
    savedOrganizers: []
  };

  // Initialize app
  document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadSavedData();
    updateProgress();
  });

  // ==================== Event Listeners ====================

  function initializeEventListeners() {
    // Organizer type selector
    const organizerTypeSelect = document.getElementById('ws-organizer-type');
    organizerTypeSelect.addEventListener('change', handleOrganizerChange);

    // Complexity level selector
    const complexitySelect = document.getElementById('ws-complexity-level');
    complexitySelect.addEventListener('change', handleComplexityChange);

    // Mode toggle button
    const modeToggleBtn = document.getElementById('ws-mode-toggle');
    modeToggleBtn.addEventListener('click', toggleMode);

    // Save button
    const saveBtn = document.getElementById('ws-save-btn');
    saveBtn.addEventListener('click', saveOrganizer);

    // Export button
    const exportBtn = document.getElementById('ws-export-btn');
    exportBtn.addEventListener('click', exportOrganizer);

    // New organizer button
    const newBtn = document.getElementById('ws-new-organizer');
    newBtn.addEventListener('click', newOrganizer);

    // Story Map text inputs
    const storyInputs = document.querySelectorAll('.story-input');
    storyInputs.forEach(input => {
      input.addEventListener('input', function() {
        const fieldName = this.id.replace('story-', '');
        state.storyMapData[fieldName] = this.value.trim();
        updateProgress();
      });
    });

    // Auto-save on input
    storyInputs.forEach(input => {
      input.addEventListener('change', autoSave);
    });
  }

  // ==================== Mode Switching ====================

  function toggleMode() {
    state.mode = state.mode === 'individual' ? 'group' : 'individual';
    const modeLabel = document.querySelector('.ws-mode-label');
    const container = document.querySelector('.ws-container');

    modeLabel.textContent = state.mode === 'individual' ? 'Individual Mode' : 'Group Mode (Projection)';
    container.setAttribute('data-mode', state.mode);

    // In group mode, enlarge text and buttons
    if (state.mode === 'group') {
      container.classList.add('group-mode');
    } else {
      container.classList.remove('group-mode');
    }
  }

  // ==================== Organizer Selection ====================

  function handleOrganizerChange(event) {
    const organizerId = event.target.value;
    switchOrganizer(organizerId);
  }

  function switchOrganizer(organizerId) {
    // Hide all organizers
    document.querySelectorAll('.ws-organizer-container').forEach(container => {
      container.classList.remove('active');
    });

    // Show selected organizer
    const selectedContainer = document.getElementById(`ws-${organizerId}-container`);
    if (selectedContainer) {
      selectedContainer.classList.add('active');
    }

    state.currentOrganizer = organizerId;
  }

  // ==================== Complexity Levels ====================

  function handleComplexityChange(event) {
    const level = parseInt(event.target.value);
    state.complexityLevel = level;
    applyComplexityLevel(level);
  }

  function applyComplexityLevel(level) {
    const container = document.querySelector('.ws-organizer-container.active');
    container.setAttribute('data-level', level);

    if (state.currentOrganizer === 'story-map') {
      applyStoryMapLevel(level);
    }
  }

  function applyStoryMapLevel(level) {
    const elements = document.querySelectorAll('.story-element');
    elements.forEach(el => {
      el.setAttribute('data-level', level);
    });

    // Level 1: Show example text, more prompts
    // Level 2: Show prompt, word bank available
    // Level 3: Minimal help

    if (level === 1) {
      addPlaceholderExamples();
    } else if (level === 2) {
      // Moderate support
    } else {
      // Level 3: minimal support
    }
  }

  function addPlaceholderExamples() {
    const examples = {
      'story-setting': 'Example: In a small village, on a snowy winter morning...',
      'story-character': 'Example: A clever fox with orange fur and bright eyes...',
      'story-problem': 'Example: The fox wanted to find food but the snow was too deep...',
      'story-climax': 'Example: The fox discovered food hidden under the snow...',
      'story-resolution': 'Example: The fox ate well and returned home safe and warm...'
    };

    if (state.complexityLevel === 1) {
      Object.entries(examples).forEach(([id, example]) => {
        const input = document.getElementById(id);
        if (input) {
          input.title = example;
          input.setAttribute('data-example', example);
        }
      });
    }
  }

  // ==================== Progress Tracking ====================

  function updateProgress() {
    const fields = Object.values(state.storyMapData);
    const completedFields = fields.filter(field => field && field.length > 0).length;
    const totalFields = fields.length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    // Update progress bar
    const progressFill = document.getElementById('ws-progress-fill');
    const progressText = document.getElementById('ws-progress-text');

    progressFill.style.width = percentage + '%';
    progressText.textContent = percentage + '% complete';

    // Show completion message
    const completionMsg = document.getElementById('ws-completion-message');
    if (percentage === 100) {
      completionMsg.classList.remove('hidden');
    } else {
      completionMsg.classList.add('hidden');
    }
  }

  // ==================== Save & Export ====================

  function saveOrganizer() {
    const organizer = {
      id: Date.now(),
      type: state.currentOrganizer,
      timestamp: new Date().toISOString(),
      data: state.storyMapData
    };

    // Save to localStorage
    state.savedOrganizers.push(organizer);
    try {
      localStorage.setItem('cs.writers-studio.organizers', JSON.stringify(state.savedOrganizers));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    // Show feedback
    showNotification('Organizer saved! ✨');
  }

  function autoSave() {
    // Auto-save without showing notification
    try {
      localStorage.setItem('cs.writers-studio.draft', JSON.stringify(state.storyMapData));
    } catch (e) {
      console.warn('Could not auto-save', e);
    }
  }

  function loadSavedData() {
    try {
      const draft = localStorage.getItem('cs.writers-studio.draft');
      if (draft) {
        const data = JSON.parse(draft);
        state.storyMapData = data;
        // Populate form fields
        Object.entries(data).forEach(([key, value]) => {
          const input = document.getElementById(`story-${key}`);
          if (input) {
            input.value = value;
          }
        });
        updateProgress();
      }
    } catch (e) {
      console.warn('Could not load saved data', e);
    }
  }

  function exportOrganizer() {
    const data = {
      type: state.currentOrganizer,
      timestamp: new Date().toLocaleString(),
      ...state.storyMapData
    };

    const text = formatForExport(data);
    copyToClipboard(text);
    showNotification('Organizer copied to clipboard!');
  }

  function formatForExport(data) {
    const lines = [
      '📖 STORY MAP',
      '================',
      '',
      `📍 Setting: ${data.setting || '(not filled)'}`,
      '',
      `👥 Character: ${data.character || '(not filled)'}`,
      '',
      `⚠️ Problem: ${data.problem || '(not filled)'}`,
      '',
      `🔥 Climax: ${data.climax || '(not filled)'}`,
      '',
      `✨ Resolution: ${data.resolution || '(not filled)'}`,
      '',
      `Created: ${data.timestamp}`
    ];

    return lines.join('\n');
  }

  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // ==================== New Organizer ====================

  function newOrganizer() {
    if (confirm('Clear current organizer? Your auto-saved draft will be saved.')) {
      state.storyMapData = {
        setting: '',
        character: '',
        problem: '',
        climax: '',
        resolution: ''
      };

      // Clear form
      document.querySelectorAll('.story-input').forEach(input => {
        input.value = '';
      });

      updateProgress();
      autoSave();
      showNotification('New organizer started!');
    }
  }

  // ==================== UI Feedback ====================

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'ws-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('visible'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Expose module for testing
  window.WritersStudio = {
    state,
    updateProgress,
    toggleMode,
    switchOrganizer
  };
})();
