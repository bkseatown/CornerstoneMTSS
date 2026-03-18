/**
 * keyboard-3d.js
 * 3D animated keyboard with tactile feedback using Babylon.js
 */

const Keyboard3D = (() => {
  let scene = null;
  let keys = new Map();
  let keyLayout = null;
  let isInitialized = false;

  // QWERTY keyboard layout
  const LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  /**
   * Initialize keyboard
   * @param {BABYLON.Scene} gameScene - Babylon.js scene
   * @param {object} options - Configuration {position, scale}
   */
  function init(gameScene, options = {}) {
    if (isInitialized) {
      console.warn('⚠️ Keyboard3D already initialized');
      return true;
    }

    scene = gameScene;
    if (!scene) {
      console.error('❌ Scene not provided');
      return false;
    }

    const {
      position = new BABYLON.Vector3(0, 0, -6),
      scale = 1
    } = options;

    createKeyboardMesh(position, scale);

    isInitialized = true;
    console.log('✅ Keyboard3D initialized');
    return true;
  }

  /**
   * Create keyboard mesh
   */
  function createKeyboardMesh(position, scale) {
    // Create keyboard container (ground plane)
    const keyboardBase = BABYLON.MeshBuilder.CreateGround(
      'keyboardBase',
      {width: 12 * scale, height: 4.5 * scale},
      scene
    );
    keyboardBase.position = position;

    const baseMaterial = new BABYLON.StandardMaterial('keyboardBaseMat', scene);
    baseMaterial.diffuse = new BABYLON.Color3(0.2, 0.2, 0.2);
    baseMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    keyboardBase.material = baseMaterial;

    // Create keys
    let keyIndex = 0;
    LAYOUT.forEach((row, rowIndex) => {
      const rowOffset = rowIndex * 1.2 * scale;
      const rowStart = -((row.length - 1) * 0.6 * scale) / 2;

      row.forEach((letter, colIndex) => {
        const keyX = rowStart + colIndex * 0.6 * scale;
        const keyY = 0.35;
        const keyZ = rowOffset - 1.5 * scale;

        createKey(letter, new BABYLON.Vector3(keyX, keyY, keyZ) + position, scale);
        keyIndex++;
      });
    });
  }

  /**
   * Create individual key
   */
  function createKey(letter, position, scale = 1) {
    const keyMesh = BABYLON.MeshBuilder.CreateBox(
      `key-${letter}`,
      {width: 0.5 * scale, height: 0.5 * scale, depth: 0.3 * scale},
      scene
    );
    keyMesh.position = position;

    // Key material
    const keyMaterial = new BABYLON.StandardMaterial(`keyMat-${letter}`, scene);
    keyMaterial.diffuse = new BABYLON.Color3(0.4, 0.4, 0.4);
    keyMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    keyMaterial.specularPower = 32;
    keyMesh.material = keyMaterial;
    keyMesh.receiveShadows = true;
    keyMesh.castShadows = true;

    // Add text
    addKeyText(keyMesh, letter);

    // Store metadata
    keyMesh.metadata = {
      letter: letter,
      isPressed: false,
      originalPosition: position.clone()
    };

    keys.set(letter, keyMesh);
    return keyMesh;
  }

  /**
   * Add text to key
   */
  function addKeyText(keyMesh, letter) {
    const textPlane = BABYLON.MeshBuilder.CreateGround(
      `keyText-${letter}`,
      {width: 0.48, height: 0.48},
      scene
    );
    textPlane.parent = keyMesh;
    textPlane.position.z = 0.16;

    // Create texture
    const texture = new BABYLON.DynamicTexture('keyTexture-' + letter, 256, scene);
    const ctx = texture.getContext();

    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 128, 128);
    texture.update();

    const textMaterial = new BABYLON.StandardMaterial('keyTextMat-' + letter, scene);
    textMaterial.emissiveTexture = texture;
    textPlane.material = textMaterial;
  }

  /**
   * Press key (visual feedback)
   * @param {string} letter - Letter to press
   */
  function pressKey(letter) {
    const keyMesh = keys.get(letter.toUpperCase());
    if (!keyMesh) return;

    // Visual feedback: depress and highlight
    const originalY = keyMesh.metadata.originalPosition.y;
    const pressDistance = 0.15;

    // Animate depression
    const animation = new BABYLON.Animation(
      'keyPress',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
    );

    const keys_anim = [
      {frame: 0, value: originalY},
      {frame: 10, value: originalY - pressDistance},
      {frame: 20, value: originalY}
    ];
    animation.setKeys(keys_anim);

    scene.beginAnimation(keyMesh, 0, 20, false, 1);

    // Change material color to highlight
    keyMesh.material.diffuse = new BABYLON.Color3(0.6, 0.8, 1);
    setTimeout(() => {
      keyMesh.material.diffuse = new BABYLON.Color3(0.4, 0.4, 0.4);
    }, 200);

    // Sound effect (optional)
    playKeyClickSound();
  }

  /**
   * Play key click sound
   */
  function playKeyClickSound() {
    // Placeholder for sound - would use Web Audio API
    // Example: playSound('/sounds/key-click.mp3');
  }

  /**
   * Highlight a key
   */
  function highlightKey(letter, color = null) {
    const keyMesh = keys.get(letter.toUpperCase());
    if (!keyMesh) return;

    const highlightColor = color || new BABYLON.Color3(1, 1, 0); // Yellow
    keyMesh.material.emissiveColor = highlightColor;
  }

  /**
   * Reset key highlight
   */
  function resetKeyHighlight(letter) {
    const keyMesh = keys.get(letter.toUpperCase());
    if (!keyMesh) return;

    keyMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
  }

  /**
   * Get all keys
   */
  function getAllKeys() {
    return Array.from(keys.values());
  }

  /**
   * Get key by letter
   */
  function getKey(letter) {
    return keys.get(letter.toUpperCase());
  }

  return {
    init,
    pressKey,
    highlightKey,
    resetKeyHighlight,
    getAllKeys,
    getKey
  };
})();
