/**
 * curriculum-sync-store.js
 *
 * CURRICULUM DATA PERSISTENCE & SYNC LAYER
 * =========================================
 * Manages curriculum data storage, synchronization, and caching
 * Single source for curriculum data (Google Sheets, internal DB, or API)
 *
 * FUNCTIONS:
 * - Persistent storage of curriculum data (IndexedDB or localStorage)
 * - Nightly sync from curriculum source (currently: sample data, Phase B: real sync)
 * - Action logging (teacher actions for feedback loop)
 * - Evidence aggregation for competency inference
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Part 4: Phase A Deliverable 4
 */

class CurriculumSyncStore {
  constructor(storageName = 'cornerstone_curriculum') {
    /**
     * Storage configuration
     * Uses IndexedDB for size, falls back to localStorage
     */
    this.storageName = storageName;
    this.storageType = this._detectStorageCapability();

    /**
     * In-memory cache (for fast access during session)
     * Synced from persistent store on startup
     */
    this.cache = {
      curriculum: null,
      lastSync: null,
      actionLog: [],
      syncStatus: 'NOT_INITIALIZED',
    };

    /**
     * Sync configuration
     * Will be configurable in Phase B
     */
    this.syncConfig = {
      source: 'sample-data', // Phase B: 'google-sheets' or 'api'
      interval: 24 * 60 * 60 * 1000, // 24 hours (nightly)
      nextSyncTime: null,
    };
  }

  /**
   * Initialize the store
   * Load cached curriculum from persistent storage (if exists)
   *
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load curriculum from persistent storage
      const cached = await this._loadFromPersistentStorage();

      if (cached && cached.curriculum) {
        this.cache = cached;
        this.cache.syncStatus = 'INITIALIZED_FROM_CACHE';
      } else {
        // First run: fetch curriculum
        await this.syncCurriculum();
      }

      // Schedule next sync (if not already scheduled)
      if (!this.syncConfig.nextSyncTime) {
        this.syncConfig.nextSyncTime = Date.now() + this.syncConfig.interval;
        this._scheduleNextSync();
      }
    } catch (err) {
      console.error('CurriculumSyncStore initialization failed:', err);
      this.cache.syncStatus = 'ERROR';
      throw err;
    }
  }

  /**
   * Get curriculum data
   * Returns cached copy (fast); syncs if stale
   *
   * @async
   * @returns {Promise<object>} Curriculum data structure
   */
  async getCurriculumData() {
    // Check if sync is needed
    if (this._isSyncStale()) {
      await this.syncCurriculum();
    }

    return this.cache.curriculum;
  }

  /**
   * Sync curriculum from source
   * Fetches fresh data and persists to storage
   *
   * @async
   * @param {string} forceSource - Override source (e.g., for testing)
   * @returns {Promise<object>} Synced curriculum
   */
  async syncCurriculum(forceSource = null) {
    try {
      const source = forceSource || this.syncConfig.source;

      // Fetch curriculum data from source
      const curriculum = await this._fetchCurriculumFromSource(source);

      // Validate data integrity
      this._validateCurriculumData(curriculum);

      // Update cache and persistent storage
      this.cache.curriculum = curriculum;
      this.cache.lastSync = Date.now();
      this.cache.syncStatus = 'SYNCED';

      // Persist to storage
      await this._persistToStorage(this.cache);

      // Schedule next sync
      this.syncConfig.nextSyncTime = Date.now() + this.syncConfig.interval;
      this._scheduleNextSync();

      return curriculum;
    } catch (err) {
      console.error('Curriculum sync failed:', err);
      this.cache.syncStatus = 'SYNC_ERROR';
      throw err;
    }
  }

  /**
   * Record teacher action
   * Used for validation loop (Phase C) to track intervention implementation
   *
   * @async
   * @param {object} action - Teacher action object
   *   @property {string} studentId - Student ID
   *   @property {string} recommendationId - Recommendation this addresses
   *   @property {string} action - 'delivered', 'not-delivered', 'partial', 'adapted'
   *   @property {string} notes - Optional teacher notes
   *   @property {object} evidence - Optional student performance during intervention
   *
   * @returns {Promise<string>} Action log ID
   */
  async recordTeacherAction(action) {
    try {
      const actionRecord = {
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
      };

      // Add to in-memory log
      this.cache.actionLog.push(actionRecord);

      // Persist to storage
      await this._persistToStorage(this.cache);

      return actionRecord.id;
    } catch (err) {
      console.error('Failed to record teacher action:', err);
      throw err;
    }
  }

  /**
   * Get teacher action log
   * Used by intervention-impact-report (Phase C) to assess recommendation effectiveness
   *
   * @async
   * @param {object} filters - Optional filters
   *   @property {string} studentId - Filter by student
   *   @property {string} recommendationId - Filter by recommendation
   *   @property {number} sinceTimestamp - Filter by date (ms since epoch)
   *
   * @returns {Promise<Array>} Filtered action log
   */
  async getTeacherActionLog(filters = {}) {
    let log = this.cache.actionLog || [];

    if (filters.studentId) {
      log = log.filter(a => a.studentId === filters.studentId);
    }
    if (filters.recommendationId) {
      log = log.filter(a => a.recommendationId === filters.recommendationId);
    }
    if (filters.sinceTimestamp) {
      log = log.filter(a => a.timestamp > filters.sinceTimestamp);
    }

    return log;
  }

  /**
   * Clear all data (for testing or reset)
   *
   * @async
   * @returns {Promise<void>}
   */
  async clearAll() {
    this.cache = {
      curriculum: null,
      lastSync: null,
      actionLog: [],
      syncStatus: 'CLEARED',
    };

    await this._clearPersistentStorage();
  }

  /**
   * Detect storage capability
   * Try IndexedDB, fall back to localStorage
   *
   * @private
   * @returns {string} 'indexeddb', 'localStorage', or 'memory'
   */
  _detectStorageCapability() {
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        return 'indexeddb';
      }
    } catch (err) {
      // IndexedDB not available
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return 'localStorage';
      }
    } catch (err) {
      // localStorage not available
    }

    // Fallback to memory-only (not persisted)
    return 'memory';
  }

  /**
   * Load data from persistent storage
   *
   * @private
   * @async
   * @returns {Promise<object>} Cached curriculum + metadata
   */
  async _loadFromPersistentStorage() {
    try {
      if (this.storageType === 'indexeddb') {
        return await this._loadFromIndexedDB();
      } else if (this.storageType === 'localStorage') {
        return JSON.parse(
          window.localStorage.getItem(this.storageName) || 'null'
        );
      }
      return null;
    } catch (err) {
      console.warn('Failed to load from persistent storage:', err);
      return null;
    }
  }

  /**
   * Persist data to storage
   *
   * @private
   * @async
   * @param {object} data - Data to persist
   * @returns {Promise<void>}
   */
  async _persistToStorage(data) {
    try {
      if (this.storageType === 'indexeddb') {
        return await this._persistToIndexedDB(data);
      } else if (this.storageType === 'localStorage') {
        window.localStorage.setItem(
          this.storageName,
          JSON.stringify(data)
        );
      }
      // Memory-only: no persistence
    } catch (err) {
      console.warn('Failed to persist to storage:', err);
    }
  }

  /**
   * Clear persistent storage
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async _clearPersistentStorage() {
    try {
      if (this.storageType === 'localStorage') {
        window.localStorage.removeItem(this.storageName);
      } else if (this.storageType === 'indexeddb') {
        // IndexedDB clear logic here
      }
    } catch (err) {
      console.warn('Failed to clear storage:', err);
    }
  }

  /**
   * Load from IndexedDB (placeholder)
   *
   * @private
   * @async
   * @returns {Promise<object>} Cached data
   */
  async _loadFromIndexedDB() {
    // Full IndexedDB implementation in Phase B
    return null;
  }

  /**
   * Persist to IndexedDB (placeholder)
   *
   * @private
   * @async
   * @param {object} data - Data to persist
   * @returns {Promise<void>}
   */
  async _persistToIndexedDB(data) {
    // Full IndexedDB implementation in Phase B
  }

  /**
   * Fetch curriculum from source
   * Phase A: Returns sample data
   * Phase B: Will integrate with Google Sheets, API, or database
   *
   * @private
   * @async
   * @param {string} source - Curriculum source
   * @returns {Promise<object>} Curriculum data structure
   */
  async _fetchCurriculumFromSource(source) {
    if (source === 'sample-data') {
      return this._getSampleCurriculum();
    }

    // Phase B sources:
    // - 'google-sheets': fetch from Google Sheets API
    // - 'api': fetch from internal API
    // - 'database': fetch from database

    throw new Error(`Unknown curriculum source: ${source}`);
  }

  /**
   * Sample curriculum for Phase A testing
   *
   * @private
   * @returns {object} Sample curriculum structure
   */
  _getSampleCurriculum() {
    return {
      version: '1.0',
      source: 'sample-data',
      generatedAt: new Date().toISOString(),
      standards: {
        'K.RF.1': {
          id: 'K.RF.1',
          name: 'Phoneme Awareness',
          gradeLevel: 'K',
          subject: 'Reading',
        },
        '1.RF.2': {
          id: '1.RF.2',
          name: 'Letter Recognition',
          gradeLevel: '1',
          subject: 'Reading',
        },
        '3.RF.3': {
          id: '3.RF.3',
          name: 'Multisyllabic Word Decoding',
          gradeLevel: '3',
          subject: 'Reading',
        },
      },
      units: {
        'U_K_RF_01': {
          id: 'U_K_RF_01',
          name: 'Phoneme Awareness Unit',
          gradeLevel: 'K',
          subject: 'Reading',
          standardIds: ['K.RF.1'],
        },
      },
      lessons: {
        'L_K_RF_001': {
          id: 'L_K_RF_001',
          name: 'Initial Sounds',
          gradeLevel: 'K',
          subject: 'Reading',
          unitId: 'U_K_RF_01',
          standardIds: ['K.RF.1'],
          duration: 30,
        },
      },
    };
  }

  /**
   * Validate curriculum data integrity
   *
   * @private
   * @param {object} curriculum - Curriculum to validate
   * @throws {Error} If validation fails
   */
  _validateCurriculumData(curriculum) {
    if (!curriculum) {
      throw new Error('Curriculum data is null');
    }

    if (
      !curriculum.standards ||
      Object.keys(curriculum.standards).length === 0
    ) {
      throw new Error('Curriculum must contain at least one standard');
    }

    // Further validation in Phase B
  }

  /**
   * Check if cache is stale
   *
   * @private
   * @returns {boolean} True if sync is needed
   */
  _isSyncStale() {
    if (!this.cache.lastSync) {
      return true; // Never synced
    }

    const age = Date.now() - this.cache.lastSync;
    return age > this.syncConfig.interval;
  }

  /**
   * Schedule next sync
   * In Phase B: Implement using service worker or background task
   *
   * @private
   */
  _scheduleNextSync() {
    // Phase B: Implement background sync
    // For now, sync happens on-demand when getCurriculumData() detects staleness
  }
}

// EXPORT FOR USE IN OTHER MODULES
module.exports = CurriculumSyncStore;
