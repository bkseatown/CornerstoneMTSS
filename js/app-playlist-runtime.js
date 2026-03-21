/**
 * app-playlist-runtime.js
 * Playlist selection, assignment, and progress helpers for teacher workflows.
 */

function createPlaylistRuntimeModule(deps) {
  const {
    buildCurrentTargetSnapshot = () => null,
    documentRef = null,
    el = () => null,
    getActiveStudentLabel = () => 'Class',
    getPlaylistState = () => ({ playlists: [], assignments: {}, progress: {}, selectedId: '' }),
    renderPlaylistControls = () => {},
    savePlaylistState = () => {},
    setPlaylistState = () => {},
    applySnapshotToSettings = () => false
  } = deps || {};

  function getAssigneeKeyForStudent(name) {
    const label = String(name || '').trim();
    if (!label || label === 'Class') return 'class';
    return `student:${label}`;
  }

  function getSelectedPlaylist() {
    const playlistState = getPlaylistState();
    const selectedId = String(playlistState.selectedId || '').trim();
    if (!selectedId) return null;
    return playlistState.playlists.find((entry) => entry.id === selectedId) || null;
  }

  function setSelectedPlaylistId(playlistId) {
    const playlistState = getPlaylistState();
    const nextId = String(playlistId || '').trim();
    if (!nextId) {
      playlistState.selectedId = '';
    } else if (playlistState.playlists.some((entry) => entry.id === nextId)) {
      playlistState.selectedId = nextId;
    } else {
      playlistState.selectedId = '';
    }
    savePlaylistState();
  }

  function getAssignedPlaylistContext(studentLabel) {
    const playlistState = getPlaylistState();
    const studentKey = getAssigneeKeyForStudent(studentLabel);
    const directId = String(playlistState.assignments[studentKey] || '').trim();
    if (directId) {
      const direct = playlistState.playlists.find((entry) => entry.id === directId);
      if (direct) return { playlist: direct, key: studentKey };
    }
    const classId = String(playlistState.assignments.class || '').trim();
    if (!classId) return null;
    const classPlaylist = playlistState.playlists.find((entry) => entry.id === classId) || null;
    if (!classPlaylist) return null;
    return { playlist: classPlaylist, key: 'class' };
  }

  function getAssignedPlaylistForStudent(studentLabel) {
    return getAssignedPlaylistContext(studentLabel)?.playlist || null;
  }

  function getPlaylistProgressIndex(assigneeKey, playlist) {
    const playlistState = getPlaylistState();
    if (!playlist || !Array.isArray(playlist.items) || !playlist.items.length) return 0;
    const key = String(assigneeKey || '').trim();
    const max = playlist.items.length;
    const raw = Math.floor(Number(playlistState.progress?.[key]) || 0);
    return Math.max(0, raw % max);
  }

  function setPlaylistProgressIndex(assigneeKey, playlist, rawIndex = 0) {
    const playlistState = getPlaylistState();
    const key = String(assigneeKey || '').trim();
    if (!key) return;
    if (!playlistState.progress || typeof playlistState.progress !== 'object') {
      playlistState.progress = Object.create(null);
    }
    const max = Math.max(1, Array.isArray(playlist?.items) ? playlist.items.length : 1);
    const parsed = Math.floor(Number(rawIndex) || 0);
    playlistState.progress[key] = Math.max(0, parsed % max);
  }

  function renderPlaylistControlsImpl() {
    const playlistState = getPlaylistState();
    const select = el('s-playlist-select');
    const nameInput = el('s-playlist-name');
    const summaryChip = el('session-playlist-summary');
    const assignmentChip = el('session-playlist-assigned');
    if (select) {
      select.innerHTML = '';
      const none = documentRef.createElement('option');
      none.value = '';
      none.textContent = 'No playlist selected';
      select.appendChild(none);
      playlistState.playlists.forEach((playlist) => {
        const option = documentRef.createElement('option');
        option.value = playlist.id;
        option.textContent = `${playlist.name} (${playlist.items.length})`;
        select.appendChild(option);
      });
      if (playlistState.selectedId && playlistState.playlists.some((entry) => entry.id === playlistState.selectedId)) {
        select.value = playlistState.selectedId;
      } else {
        select.value = '';
      }
    }

    const selected = getSelectedPlaylist();
    if (nameInput && !nameInput.matches(':focus')) {
      nameInput.value = selected?.name || '';
    }
    if (summaryChip) {
      summaryChip.textContent = selected
        ? `Playlist: ${selected.name} (${selected.items.length} target${selected.items.length === 1 ? '' : 's'})`
        : 'Playlist: --';
      summaryChip.setAttribute('title', summaryChip.textContent);
    }
    if (assignmentChip) {
      const studentLabel = getActiveStudentLabel();
      const assignedContext = getAssignedPlaylistContext(studentLabel);
      const assigned = assignedContext?.playlist || null;
      if (!assigned) {
        assignmentChip.textContent = 'Assignment: --';
        assignmentChip.setAttribute('title', assignmentChip.textContent);
      } else {
        const nextIndex = getPlaylistProgressIndex(assignedContext.key, assigned);
        const itemCount = Math.max(0, assigned.items.length);
        const nextTarget = itemCount ? assigned.items[nextIndex] : null;
        assignmentChip.textContent = itemCount
          ? `Assignment: ${studentLabel} -> ${assigned.name} (next ${nextIndex + 1}/${itemCount})`
          : `Assignment: ${studentLabel} -> ${assigned.name} (empty)`;
        assignmentChip.setAttribute(
          'title',
          itemCount
            ? `${assignmentChip.textContent} · Next target: ${nextTarget?.label || 'Saved target'}`
            : `${assignmentChip.textContent} · Add at least one target to this playlist.`
        );
      }
    }
  }

  function saveCurrentTargetToPlaylist() {
    const playlistState = getPlaylistState();
    const selected = getSelectedPlaylist();
    const nameInput = el('s-playlist-name');
    const typedName = String(nameInput?.value || '').trim();
    const snapshot = buildCurrentTargetSnapshot();
    if (!snapshot) return false;

    if (selected) {
      const duplicate = selected.items.some((entry) => (
        entry.packId === snapshot.packId &&
        entry.targetId === snapshot.targetId &&
        entry.focus === snapshot.focus &&
        entry.gradeBand === snapshot.gradeBand &&
        entry.length === snapshot.length
      ));
      if (!duplicate) {
        selected.items.push(snapshot);
        selected.items = selected.items.slice(-20);
      }
      selected.updatedAt = Date.now();
      if (typedName) selected.name = typedName;
      savePlaylistState();
      renderPlaylistControls();
      return true;
    }

    const nextName = typedName || `Playlist ${playlistState.playlists.length + 1}`;
    const playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: nextName,
      items: [snapshot],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    playlistState.playlists.push(playlist);
    playlistState.playlists = playlistState.playlists.slice(-40);
    setSelectedPlaylistId(playlist.id);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function assignSelectedPlaylistToActiveStudent() {
    const playlistState = getPlaylistState();
    const selected = getSelectedPlaylist();
    if (!selected) return false;
    const student = getActiveStudentLabel();
    const assigneeKey = getAssigneeKeyForStudent(student);
    playlistState.assignments[assigneeKey] = selected.id;
    setPlaylistProgressIndex(assigneeKey, selected, 0);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function applyAssignedPlaylistForActiveStudent() {
    const context = getAssignedPlaylistContext(getActiveStudentLabel());
    const assigned = context?.playlist || null;
    if (!context || !assigned || !assigned.items.length) return false;
    const index = getPlaylistProgressIndex(context.key, assigned);
    const target = assigned.items[index] || assigned.items[0];
    const applied = applySnapshotToSettings(target, { toast: true });
    if (!applied) return false;
    setPlaylistProgressIndex(context.key, assigned, index + 1);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function deleteSelectedPlaylist() {
    const playlistState = getPlaylistState();
    const selected = getSelectedPlaylist();
    if (!selected) return false;
    playlistState.playlists = playlistState.playlists.filter((entry) => entry.id !== selected.id);
    Object.entries(playlistState.assignments).forEach(([key, playlistId]) => {
      if (playlistId !== selected.id) return;
      delete playlistState.assignments[key];
      if (playlistState.progress && typeof playlistState.progress === 'object') {
        delete playlistState.progress[key];
      }
    });
    setSelectedPlaylistId(playlistState.playlists[0]?.id || '');
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  return Object.freeze({
    applyAssignedPlaylistForActiveStudent,
    assignSelectedPlaylistToActiveStudent,
    deleteSelectedPlaylist,
    getAssignedPlaylistContext,
    getAssignedPlaylistForStudent,
    getAssigneeKeyForStudent,
    getPlaylistProgressIndex,
    getSelectedPlaylist,
    renderPlaylistControls: renderPlaylistControlsImpl,
    saveCurrentTargetToPlaylist,
    setPlaylistProgressIndex,
    setSelectedPlaylistId
  });
}

window.createPlaylistRuntimeModule = createPlaylistRuntimeModule;
