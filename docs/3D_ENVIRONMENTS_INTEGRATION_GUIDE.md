# 3D Game Environments Integration Guide

## Phase 4: Immersive 3D Word Quest with Babylon.js

### Quick Start (20 minutes)

Add to your HTML `<head>`:

```html
<!-- Babylon.js library -->
<script src="https://cdn.jsdelivr.net/npm/babylonjs@latest/babylon.js"></script>

<!-- 3D Game Environment -->
<script src="/js/3d/word-quest-3d.js"></script>
<script src="/js/3d/keyboard-3d.js"></script>
<script src="/js/3d/celebration-particles.js"></script>
```

Create 3D Word Quest game:

```html
<!-- Canvas for 3D rendering -->
<canvas id="renderCanvas" style="width: 100%; height: 100vh;"></canvas>

<script>
  // Initialize 3D scene
  const success = WordQuest3D.init('renderCanvas', {
    antialias: true,
    preserveDrawingBuffer: true
  });

  if (success) {
    // Create word tiles
    const words = ['CAT', 'DOG', 'BIRD', 'FISH'];
    words.forEach((word, index) => {
      WordQuest3D.createWordTile(word, index, 'unassessed');
    });

    // Create keyboard
    WordQuest3D.createKeyboard();

    // Listen for game events
    document.addEventListener('word-correct', (event) => {
      const {word} = event.detail;

      // Reveal tile with animation
      const tileId = `tile-${word}-0`;
      WordQuest3D.revealTile(tileId);

      // Celebrate
      WordQuest3D.celebrate();
    });
  }
</script>
```

---

## Components Explained

### 1. **WordQuest3D** (`js/3d/word-quest-3d.js`)

Main 3D scene manager using Babylon.js.

**Methods:**

```javascript
// Initialize 3D scene
WordQuest3D.init('renderCanvas', {
  antialias: true,
  preserveDrawingBuffer: true
});

// Create word tile
const tile = WordQuest3D.createWordTile(
  'WORD',           // Word text
  0,                // Grid index (0, 1, 2, ...)
  'unassessed'      // Status: 'secure'|'developing'|'emerging'|'unassessed'
);

// Animate tile reveal
WordQuest3D.revealTile('tile-WORD-0');

// Create 3D keyboard
WordQuest3D.createKeyboard();

// Trigger celebration
WordQuest3D.celebrate(position);

// Focus camera on tile
WordQuest3D.focusOnTile('tile-WORD-0', 500);

// Get tile
const tile = WordQuest3D.getTile('tile-WORD-0');

// Get all tiles
const tiles = WordQuest3D.getTiles();

// Access scene/engine for advanced usage
const scene = WordQuest3D.getScene();
const engine = WordQuest3D.getEngine();

// Cleanup
WordQuest3D.dispose();
```

**Tile Status Colors:**
- `secure` - Green (#00A651) - Student has mastered
- `developing` - Orange (#F77F00) - In progress
- `emerging` - Red (#D62828) - Beginning stage
- `unassessed` - Gray (#B0B0B0) - Not yet assessed

### 2. **Keyboard3D** (`js/3d/keyboard-3d.js`)

3D QWERTY keyboard with tactile feedback.

**Methods:**

```javascript
// Initialize on scene
Keyboard3D.init(scene, {
  position: new BABYLON.Vector3(0, 0, -6),
  scale: 0.8
});

// Press key (visual + sound feedback)
Keyboard3D.pressKey('A');

// Highlight key
Keyboard3D.highlightKey('A', new BABYLON.Color3(1, 1, 0));

// Reset highlight
Keyboard3D.resetKeyHighlight('A');

// Get key mesh
const keyMesh = Keyboard3D.getKey('A');

// Get all keys
const keyMeshes = Keyboard3D.getAllKeys();
```

**Keyboard Layout:**
```
Q W E R T Y U I O P
 A S D F G H J K L
  Z X C V B N M
```

### 3. **CelebrationEffect** (`js/3d/celebration-particles.js`)

Particle effects for celebratory moments.

**Methods:**

```javascript
// Trigger celebration
CelebrationEffect.trigger(scene, position, {
  type: 'confetti',    // 'confetti'|'sparkles'|'burst'
  intensity: 'normal', // 'low'|'normal'|'high'
  duration: 2000       // milliseconds
});

// Floating text effect
CelebrationEffect.createFloatingText(
  scene,
  position,
  'Great!',            // Text
  {
    duration: 2000,
    color: new BABYLON.Color3(1, 1, 0),
    size: 2
  }
);

// Screen shake effect
CelebrationEffect.screenShake(camera, 1, 300);
```

**Effect Types:**
- **Confetti** - Falling colored paper (good for correct answers)
- **Sparkles** - Fast-moving sparkles (good for bonus points)
- **Burst** - Explosive burst effect (good for level completion)

---

## Complete Example: Babylon.js Word Quest

```html
<!DOCTYPE html>
<html>
<head>
  <title>Word Quest 3D</title>
  <script src="https://cdn.jsdelivr.net/npm/babylonjs@latest/babylon.js"></script>
  <script src="/js/3d/word-quest-3d.js"></script>
  <script src="/js/3d/keyboard-3d.js"></script>
  <script src="/js/3d/celebration-particles.js"></script>
  <style>
    body { margin: 0; overflow: hidden; }
    #renderCanvas { width: 100%; height: 100%; display: block; }
    #ui { position: absolute; top: 20px; left: 20px; color: #333; }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <div id="ui">
    <h2>Word Quest 3D</h2>
    <p>Score: <span id="score">0</span></p>
  </div>

  <script>
    // Game state
    let score = 0;
    const words = ['CAT', 'DOG', 'BIRD', 'FISH', 'HOUSE', 'APPLE'];
    let currentWordIndex = 0;
    let selectedLetters = [];

    // Initialize 3D scene
    const initialized = WordQuest3D.init('renderCanvas');

    if (initialized) {
      // Create all word tiles
      words.forEach((word, index) => {
        WordQuest3D.createWordTile(word, index, 'unassessed');
      });

      // Create keyboard
      WordQuest3D.createKeyboard();

      // Handle keyboard input
      document.addEventListener('keydown', (event) => {
        const letter = event.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
          Keyboard3D.pressKey(letter);
          selectedLetters.push(letter);

          // Check if word is complete
          const currentWord = words[currentWordIndex];
          if (selectedLetters.join('') === currentWord) {
            onWordCorrect(currentWord, currentWordIndex);
          }
        }

        if (event.key === 'Backspace') {
          selectedLetters.pop();
        }

        if (event.key === 'Enter') {
          onSubmitWord();
        }
      });

      // Word correct handler
      function onWordCorrect(word, index) {
        score += 10;
        document.getElementById('score').textContent = score;

        // Animate tile reveal
        const tileId = `tile-${word}-${index}`;
        WordQuest3D.revealTile(tileId);

        // Focus camera on tile
        WordQuest3D.focusOnTile(tileId, 500);

        // Celebrate
        const tile = WordQuest3D.getTile(tileId);
        if (tile) {
          CelebrationEffect.trigger(
            WordQuest3D.getScene(),
            tile.position,
            {type: 'confetti', intensity: 'high'}
          );

          CelebrationEffect.createFloatingText(
            WordQuest3D.getScene(),
            tile.position.clone().addInPlace(new BABYLON.Vector3(0, 2, 0)),
            '⭐ Great!',
            {duration: 1500, color: new BABYLON.Color3(1, 1, 0), size: 1.5}
          );
        }

        // Move to next word
        selectedLetters = [];
        currentWordIndex++;

        if (currentWordIndex >= words.length) {
          onGameComplete();
        }
      }

      function onGameComplete() {
        alert(`Game Complete! Score: ${score}`);
        // Reset
        currentWordIndex = 0;
        score = 0;
        selectedLetters = [];
      }

      function onSubmitWord() {
        const currentWord = words[currentWordIndex];
        const selected = selectedLetters.join('');

        if (selected === currentWord) {
          onWordCorrect(currentWord, currentWordIndex);
        } else {
          // Wrong answer
          CelebrationEffect.screenShake(
            WordQuest3D.getScene().cameras[0],
            0.5,
            200
          );
          selectedLetters = [];
        }
      }
    } else {
      console.error('Failed to initialize 3D scene');
    }
  </script>
</body>
</html>
```

---

## Advanced Features

### Custom Materials

```javascript
// Access Babylon.js scene for custom materials
const scene = WordQuest3D.getScene();

// Create custom material
const customMaterial = new BABYLON.StandardMaterial('custom', scene);
customMaterial.diffuse = new BABYLON.Color3(1, 0, 0);
customMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
customMaterial.specularPower = 64;

// Apply to tile
const tile = WordQuest3D.getTile('tile-CAT-0');
if (tile) {
  tile.material = customMaterial;
}
```

### Camera Control

```javascript
const scene = WordQuest3D.getScene();
const camera = scene.activeCamera;

// Zoom in
camera.radius = 10;

// Pan
camera.target = new BABYLON.Vector3(5, 0, -5);

// Animate
const animation = new BABYLON.Animation(
  'cameraZoom',
  'radius',
  60,
  BABYLON.Animation.ANIMATIONTYPE_FLOAT,
  BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
);

const keys = [
  {frame: 0, value: 20},
  {frame: 60, value: 10}
];
animation.setKeys(keys);

scene.beginAnimation(camera, 0, 60);
```

### Physics-Based Animations

```javascript
// Enable physics
const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
const physicsPlugin = new BABYLON.CannonJSPlugin();
scene.enablePhysics(gravityVector, physicsPlugin);

// Add physics to tile
const tile = WordQuest3D.getTile('tile-CAT-0');
tile.physicsImpostor = new BABYLON.PhysicsImpostor(
  tile,
  BABYLON.PhysicsImpostor.BoxImpostor,
  {mass: 1, restitution: 0.5},
  scene
);
```

---

## Performance Optimization

### Texture Optimization

```javascript
// Use lower resolution textures on mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const textureResolution = isMobile ? 256 : 512;
```

### Level of Detail (LOD)

```javascript
// Reduce detail on distance tiles
const tiles = WordQuest3D.getTiles();
tiles.forEach(tile => {
  const distance = BABYLON.Vector3.Distance(
    tile.position,
    scene.activeCamera.position
  );

  if (distance > 20) {
    // Reduce polygon count
    // (would need to create simplified mesh versions)
  }
});
```

### Garbage Collection

```javascript
// Dispose unused meshes
scene.onDispose = () => {
  scene.meshes.forEach(mesh => {
    if (!mesh.isVisible) {
      mesh.dispose();
    }
  });
};
```

---

## Testing Checklist

### WordQuest3D
- [ ] Scene initializes without errors
- [ ] Canvas resizes on window resize
- [ ] Camera can be rotated/zoomed (mouse control)
- [ ] Word tiles appear in grid
- [ ] Each tile has correct color by status
- [ ] Text renders on tiles
- [ ] Tile reveal animation works
- [ ] Camera focus animation smooth

### Keyboard3D
- [ ] Keyboard appears below game board
- [ ] All letter keys visible (26 keys)
- [ ] Key press animation works (depress + highlight)
- [ ] Highlight applied correctly
- [ ] Key click sound plays (if audio implemented)

### CelebrationEffect
- [ ] Confetti effect shows colored particles
- [ ] Sparkles effect bright and fast-moving
- [ ] Burst effect explosively outward
- [ ] Floating text appears and fades
- [ ] Screen shake effect visible
- [ ] All particles cleanup after duration

### Accessibility
- [ ] High contrast mode: Clear boundaries on tiles
- [ ] Low vision mode: Larger text on tiles
- [ ] Keyboard navigation: Alternative to 3D camera
- [ ] Color blind: Not relying only on color for status

### Performance
- [ ] 60 FPS on desktop (measure with performance tools)
- [ ] No memory leaks (use Chrome DevTools Memory)
- [ ] Smooth animations (no stuttering)
- [ ] Mobile 30+ FPS (scale down textures/particles)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Babylon.js | ✅ 50+ | ✅ 45+ | ✅ 10+ | ✅ 15+ |
| WebGL | ✅ All | ✅ All | ✅ All | ✅ All |
| Canvas 3D | ✅ All | ✅ All | ✅ All | ✅ All |

**Fallback:** For unsupported browsers, fall back to 2D game shell.

---

## Troubleshooting

### Scene doesn't render

```javascript
// Check if Babylon.js loaded
if (typeof BABYLON === 'undefined') {
  console.error('Babylon.js not loaded');
}

// Check canvas element
const canvas = document.getElementById('renderCanvas');
if (!canvas) {
  console.error('Canvas element not found');
}
```

### Particles not showing

- Verify texture paths are correct
- Check browser console for 404 errors
- Ensure textures exist in `/textures/` folder

### Camera not responding

```javascript
// Re-attach controls
const canvas = scene.getEngine().getRenderingCanvas();
camera.attachControl(canvas, true);
```

### Low FPS

- Reduce particle count
- Lower texture resolution
- Disable shadows on mobile
- Use Level of Detail (LOD)

---

## Future Enhancements

1. **Multiplayer 3D** - Multiple students in same virtual classroom
2. **Voice-controlled tiles** - Speak word to reveal tile
3. **Gesture recognition** - Hand gestures to select letters
4. **AR integration** - 3D tiles in real-world via AR
5. **Custom avatars** - Student creates avatar for classroom
6. **3D soundscapes** - Spatial audio feedback
7. **Physics-based gameplay** - Gravity and momentum in word selection
8. **VR support** - Full VR headset compatibility
9. **Dynamic lighting** - Time-of-day effects
10. **Weather effects** - Rain, snow, wind particles

---

## Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://www.babylonjs-playground.com/)
- [WebGL Performance Tips](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [3D Game Design Patterns](https://www.patterns.dev/posts/game-programming/)
- [Particle System Guide](https://doc.babylonjs.com/features/featuresByName/Particles)
