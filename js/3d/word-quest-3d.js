/**
 * word-quest-3d.js
 * 3D game environment using Babylon.js
 * Immersive Word Quest with 3D tiles, keyboard, and effects
 */

const WordQuest3D = (() => {
  let engine = null;
  let scene = null;
  let camera = null;
  let isInitialized = false;
  let wordTiles = new Map();
  let keyboard3D = null;
  let lightingMode = 'dynamic';

  /**
   * Initialize 3D scene
   * @param {string|HTMLElement} canvasElement - Canvas element or ID
   * @param {object} options - Configuration options
   */
  function init(canvasElement, options = {}) {
    if (isInitialized) {
      console.warn('⚠️ WordQuest3D already initialized');
      return true;
    }

    // Get canvas
    if (typeof canvasElement === 'string') {
      canvasElement = document.getElementById(canvasElement);
    }

    if (!canvasElement) {
      console.error('❌ Canvas element not found');
      return false;
    }

    try {
      // Initialize Babylon.js engine
      engine = new BABYLON.Engine(canvasElement, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
      });

      // Create scene
      scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color3(0.95, 0.96, 0.98); // Light gray background
      scene.collisionsEnabled = true;
      scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
      scene.fogStart = 10;
      scene.fogEnd = 100;
      scene.fogColor = scene.clearColor;

      // Setup camera
      setupCamera();

      // Setup lighting
      setupLighting();

      // Setup shadows
      setupShadows();

      // Create default board
      createGameBoard();

      // Handle window resize
      window.addEventListener('resize', () => {
        engine.resize();
      });

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      isInitialized = true;
      console.log('✅ WordQuest3D initialized');

      return true;
    } catch (err) {
      console.error('❌ Failed to initialize WordQuest3D:', err);
      return false;
    }
  }

  /**
   * Setup camera (arc rotate for user control)
   */
  function setupCamera() {
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,              // alpha
      Math.PI / 2.5,            // beta
      20,                       // radius
      new BABYLON.Vector3(0, 1, 0), // target
      scene
    );

    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    camera.minZ = 0.1;
    camera.maxZ = 1000;
    camera.wheelPrecision = 50;
    camera.inertia = 0.7;
    camera.angularSensibilityX = 600;
    camera.angularSensibilityY = 600;

    // Limit camera movement
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    camera.lowerBetaLimit = Math.PI / 4;
    camera.upperBetaLimit = Math.PI / 1.5;
  }

  /**
   * Setup dynamic lighting
   */
  function setupLighting() {
    // Main light
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0.5),
      scene
    );
    light.intensity = 0.8;
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(0.8, 0.8, 0.8);

    // Point light for accent
    const pointLight = new BABYLON.PointLight(
      'pointLight',
      new BABYLON.Vector3(5, 10, 5),
      scene
    );
    pointLight.intensity = 0.5;
    pointLight.range = 50;

    // Optional: spot light for dramatic effect
    const spotLight = new BABYLON.SpotLight(
      'spotLight',
      new BABYLON.Vector3(0, 10, 0),
      new BABYLON.Vector3(0, -1, 0),
      Math.PI / 3,
      1,
      scene
    );
    spotLight.intensity = 0.3;
  }

  /**
   * Setup shadow rendering
   */
  function setupShadows() {
    const shadowGenerator = new BABYLON.ShadowGenerator(2048,
      scene.lights[0]
    );
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Shadows will be applied to meshes as they're created
    return shadowGenerator;
  }

  /**
   * Create game board plane
   */
  function createGameBoard() {
    const board = BABYLON.MeshBuilder.CreateGround('gameBoard',
      {width: 15, height: 10},
      scene
    );

    const boardMaterial = new BABYLON.StandardMaterial('boardMat', scene);
    boardMaterial.diffuse = new BABYLON.Color3(0.9, 0.92, 0.94);
    boardMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    board.material = boardMaterial;
    board.receiveShadows = true;

    return board;
  }

  /**
   * Create 3D word tile
   * @param {string} word - Word to display
   * @param {number} index - Position index
   * @param {string} status - 'secure' | 'developing' | 'emerging' | 'unassessed'
   */
  function createWordTile(word, index, status = 'unassessed') {
    if (!isInitialized) {
      console.warn('⚠️ WordQuest3D not initialized');
      return null;
    }

    const id = `tile-${word}-${index}`;

    // Calculate position in grid
    const cols = 4;
    const spacing = 3;
    const x = (index % cols) * spacing - (cols * spacing) / 2;
    const z = Math.floor(index / cols) * spacing - spacing;

    // Create box
    const tile = BABYLON.MeshBuilder.CreateBox(id,
      {width: 2.5, height: 2.5, depth: 0.3},
      scene
    );
    tile.position = new BABYLON.Vector3(x, 1.2, z);
    tile.metadata = {
      word,
      status,
      isRevealed: false
    };

    // Material based on status
    const material = createTileMaterial(status);
    tile.material = material;
    tile.receiveShadows = true;
    tile.castShadows = true;

    // Create text on tile
    addTextToTile(tile, word);

    // Store reference
    wordTiles.set(id, tile);

    return tile;
  }

  /**
   * Create material for tile based on status
   */
  function createTileMaterial(status) {
    const material = new BABYLON.StandardMaterial(`tileMat-${status}`, scene);

    switch (status) {
      case 'secure':
        material.emissiveColor = new BABYLON.Color3(0, 0.65, 0.4); // Green
        material.diffuse = new BABYLON.Color3(0.1, 0.8, 0.5);
        break;
      case 'developing':
        material.emissiveColor = new BABYLON.Color3(1, 0.6, 0); // Orange
        material.diffuse = new BABYLON.Color3(1, 0.7, 0.1);
        break;
      case 'emerging':
        material.emissiveColor = new BABYLON.Color3(0.8, 0, 0); // Red
        material.diffuse = new BABYLON.Color3(1, 0.2, 0.2);
        break;
      case 'unassessed':
      default:
        material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Gray
        material.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
    }

    material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    material.specularPower = 16;

    return material;
  }

  /**
   * Add text label to 3D tile
   */
  function addTextToTile(tile, text) {
    const textMesh = BABYLON.MeshBuilder.CreateGround(
      `text-${text}`,
      {width: 2.4, height: 2.4},
      scene
    );
    textMesh.parent = tile;
    textMesh.position.z = 0.16; // Slightly in front of tile

    // Create dynamic texture for text
    const texture = new BABYLON.DynamicTexture('textTexture', 512, scene);
    const ctx = texture.getContext();

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 256, 256);
    texture.update();

    const textMaterial = new BABYLON.StandardMaterial('textMat', scene);
    textMaterial.emissiveTexture = texture;
    textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    textMesh.material = textMaterial;

    return textMesh;
  }

  /**
   * Animate tile reveal (rotation + scale)
   */
  function revealTile(tileId) {
    const tile = wordTiles.get(tileId);
    if (!tile) return;

    tile.metadata.isRevealed = true;

    const frameRate = 60;
    const animation = new BABYLON.Animation(
      'revealAnimation',
      'rotation.y',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
    );

    const keys = [
      {frame: 0, value: tile.rotation.y},
      {frame: frameRate * 0.5, value: Math.PI}
    ];
    animation.setKeys(keys);

    scene.beginAnimation(tile, 0, frameRate * 0.5, false, 1.5);
  }

  /**
   * Create 3D keyboard
   */
  function createKeyboard() {
    keyboard3D = Keyboard3D;
    if (keyboard3D && typeof keyboard3D.init === 'function') {
      keyboard3D.init(scene, {
        position: new BABYLON.Vector3(0, 0.5, -7),
        scale: 0.8
      });
      return keyboard3D;
    }
    return null;
  }

  /**
   * Trigger celebration effect
   */
  function celebrate(position) {
    if (typeof CelebrationEffect === 'undefined') return;

    CelebrationEffect.trigger(scene, position || new BABYLON.Vector3(0, 5, 0));
  }

  /**
   * Dispose all 3D objects
   */
  function dispose() {
    if (scene) {
      scene.dispose();
    }
    if (engine) {
      engine.dispose();
    }
    wordTiles.clear();
    isInitialized = false;
  }

  /**
   * Get scene (for advanced usage)
   */
  function getScene() {
    return scene;
  }

  /**
   * Get engine (for advanced usage)
   */
  function getEngine() {
    return engine;
  }

  /**
   * Get word tile by ID
   */
  function getTile(tileId) {
    return wordTiles.get(tileId);
  }

  /**
   * Get all tiles
   */
  function getTiles() {
    return Array.from(wordTiles.values());
  }

  /**
   * Update camera to focus on tile
   */
  function focusOnTile(tileId, duration = 500) {
    const tile = wordTiles.get(tileId);
    if (!tile || !camera) return;

    const targetPosition = tile.position.clone();
    targetPosition.y += 3;

    BABYLON.Animation.CreateAndStartAnimation(
      'cameraFocus',
      camera,
      'target',
      60,
      Math.floor(duration / 16),
      camera.target,
      targetPosition,
      BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
    );
  }

  /**
   * Switch lighting mode
   */
  function setLightingMode(mode) {
    lightingMode = mode;
    // Could adjust scene.lights here based on mode
  }

  return {
    init,
    createWordTile,
    revealTile,
    createKeyboard,
    celebrate,
    focusOnTile,
    setLightingMode,
    getTile,
    getTiles,
    getScene,
    getEngine,
    dispose
  };
})();
