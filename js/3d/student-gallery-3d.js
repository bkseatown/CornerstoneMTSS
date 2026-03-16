/**
 * student-gallery-3d.js
 * 3D immersive student progress gallery using Babylon.js
 * Visualizes individual and class progress in virtual space
 */

const StudentGallery3D = (() => {
  let scene = null;
  let camera = null;
  let engine = null;
  let isInitialized = false;
  let studentPodiums = new Map();
  let galleryConfig = {
    layout: 'stadium',      // 'stadium', 'circle', 'grid'
    enableAnimations: true,
    particlesEnabled: true
  };

  /**
   * Initialize 3D gallery
   * @param {string|HTMLElement} canvasElement - Canvas element or ID
   * @param {object} options - Configuration options
   */
  function init(canvasElement, options = {}) {
    if (isInitialized) {
      console.warn('⚠️ StudentGallery3D already initialized');
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
      // Initialize engine
      engine = new BABYLON.Engine(canvasElement, true, {
        antialias: true,
        stencil: true
      });

      // Create scene
      scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color3(0.95, 0.96, 0.98);
      scene.collisionsEnabled = true;

      // Setup camera
      setupCamera();

      // Setup lighting
      setupLighting();

      // Create gallery floor
      createGalleryFloor();

      // Handle resize
      window.addEventListener('resize', () => {
        engine.resize();
      });

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Merge options
      Object.assign(galleryConfig, options);

      isInitialized = true;
      console.log('✅ StudentGallery3D initialized');
      return true;
    } catch (err) {
      console.error('❌ Failed to initialize StudentGallery3D:', err);
      return false;
    }
  }

  /**
   * Setup camera for gallery view
   */
  function setupCamera() {
    camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 8, -20),
      scene
    );

    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    camera.speed = 5;
    camera.angularSensibility = 100;
    camera.inertia = 0.7;
  }

  /**
   * Setup lighting
   */
  function setupLighting() {
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0.5),
      scene
    );
    light.intensity = 0.9;

    const spotLight = new BABYLON.SpotLight(
      'spotLight',
      new BABYLON.Vector3(0, 20, -5),
      new BABYLON.Vector3(0, -1, 0),
      Math.PI / 2,
      2,
      scene
    );
    spotLight.intensity = 0.6;
  }

  /**
   * Create gallery floor
   */
  function createGalleryFloor() {
    const floor = BABYLON.MeshBuilder.CreateGround(
      'galleryFloor',
      {width: 100, height: 100},
      scene
    );

    const floorMaterial = new BABYLON.StandardMaterial('floorMat', scene);
    floorMaterial.diffuse = new BABYLON.Color3(0.8, 0.85, 0.9);
    floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    floor.material = floorMaterial;
    floor.receiveShadows = true;
  }

  /**
   * Add student to gallery
   * @param {string} studentId - Student ID
   * @param {object} data - Student data {name, avatar, score, progress, status}
   */
  function addStudent(studentId, data) {
    if (!isInitialized) {
      console.warn('⚠️ StudentGallery3D not initialized');
      return null;
    }

    const {
      name = 'Student',
      avatar = '👤',
      score = 0,
      progress = 0,
      status = 'developing'
    } = data;

    // Calculate position based on layout
    const position = calculateStudentPosition(studentPodiums.size);

    // Create podium
    const podium = createStudentPodium(studentId, position, {
      name,
      avatar,
      score,
      progress,
      status
    });

    studentPodiums.set(studentId, {
      podium,
      data,
      position
    });

    console.log(`✓ Student ${name} added to gallery`);
    return podium;
  }

  /**
   * Calculate position for student based on layout
   */
  function calculateStudentPosition(index) {
    switch (galleryConfig.layout) {
      case 'circle': {
        const angle = (index / 30) * Math.PI * 2;
        const radius = 20;
        return new BABYLON.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
      }
      case 'grid': {
        const cols = 5;
        const spacing = 8;
        return new BABYLON.Vector3(
          (index % cols) * spacing - (cols * spacing) / 2,
          0,
          Math.floor(index / cols) * spacing - spacing
        );
      }
      case 'stadium':
      default: {
        const cols = 6;
        const spacing = 7;
        const row = Math.floor(index / cols);
        const col = index % cols;
        const xOffset = row % 2 === 0 ? 0 : spacing / 2;
        return new BABYLON.Vector3(
          col * spacing + xOffset - (cols * spacing) / 2,
          0,
          row * spacing * 0.866 - spacing
        );
      }
    }
  }

  /**
   * Create student podium with progress visualization
   */
  function createStudentPodium(studentId, position, data) {
    const {name, avatar, score, progress, status} = data;

    // Podium base (platform)
    const podiumBase = BABYLON.MeshBuilder.CreateBox(
      `podium-${studentId}`,
      {width: 2, height: Math.max(0.5, progress / 100 * 3), depth: 2},
      scene
    );
    podiumBase.position = position.clone().addInPlace(
      new BABYLON.Vector3(0, Math.max(0.5, progress / 100 * 3) / 2, 0)
    );

    // Color based on status
    const baseMaterial = createStatusMaterial(status);
    podiumBase.material = baseMaterial;
    podiumBase.receiveShadows = true;
    podiumBase.castShadows = true;

    // Add name label
    addPodiumLabel(podiumBase, `${avatar} ${name}`, score);

    // Add progress ring
    addProgressRing(podiumBase, progress);

    // Return group (for future manipulation)
    return {
      base: podiumBase,
      studentId,
      data
    };
  }

  /**
   * Create material by status
   */
  function createStatusMaterial(status) {
    const material = new BABYLON.StandardMaterial(`statusMat-${status}`, scene);

    switch (status) {
      case 'secure':
        material.diffuse = new BABYLON.Color3(0, 0.7, 0.5);
        material.emissiveColor = new BABYLON.Color3(0, 0.4, 0.2);
        break;
      case 'developing':
        material.diffuse = new BABYLON.Color3(1, 0.7, 0);
        material.emissiveColor = new BABYLON.Color3(0.6, 0.35, 0);
        break;
      case 'emerging':
        material.diffuse = new BABYLON.Color3(1, 0.3, 0.3);
        material.emissiveColor = new BABYLON.Color3(0.6, 0.1, 0.1);
        break;
      default:
        material.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
        material.emissiveColor = new BABYLON.Color3(0.35, 0.35, 0.35);
    }

    material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    return material;
  }

  /**
   * Add student name and score label
   */
  function addPodiumLabel(podium, text, score) {
    const textPlane = BABYLON.MeshBuilder.CreateGround(
      `label-${podium.name}`,
      {width: 2, height: 0.8},
      scene
    );
    textPlane.parent = podium;
    textPlane.position.y = 2.5;

    const texture = new BABYLON.DynamicTexture('labelTexture', 512, scene);
    const ctx = texture.getContext();

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 256);
    ctx.fillStyle = '#0173b2';
    ctx.font = '30px Arial';
    ctx.fillText(`${score}pts`, 256, 350);
    texture.update();

    const material = new BABYLON.StandardMaterial('labelMat', scene);
    material.emissiveTexture = texture;
    textPlane.material = material;
  }

  /**
   * Add progress ring around podium
   */
  function addProgressRing(podium, progress) {
    const ringMesh = BABYLON.MeshBuilder.CreateTorus(
      `ring-${podium.name}`,
      {diameter: 2.5, thickness: 0.15},
      scene
    );
    ringMesh.parent = podium;
    ringMesh.position.y = 0.5;

    const ringMaterial = new BABYLON.StandardMaterial('ringMat', scene);
    ringMaterial.diffuse = new BABYLON.Color3(
      0.2 + progress / 100 * 0.8,
      0.2,
      1
    );
    ringMaterial.emissiveColor = ringMaterial.diffuse;
    ringMesh.material = ringMaterial;

    // Animate ring rotation
    if (galleryConfig.enableAnimations) {
      ringMesh.rotation.z = (progress / 100) * Math.PI * 2;
    }
  }

  /**
   * Update student progress
   */
  function updateStudent(studentId, data) {
    const entry = studentPodiums.get(studentId);
    if (!entry) return false;

    const {podium, position} = entry;
    const {progress, score, status} = data;

    // Update podium height
    if (progress !== undefined) {
      podium.base.scaling.y = Math.max(1, progress / 100 * 3);
      podium.base.position.y = position.y + podium.base.scaling.y / 2;
    }

    // Update material color if status changed
    if (status !== undefined) {
      podium.base.material = createStatusMaterial(status);
    }

    // Animate update
    if (galleryConfig.enableAnimations && progress !== undefined) {
      BABYLON.Animation.CreateAndStartAnimation(
        'progressUpdate',
        podium.base,
        'scaling.y',
        60,
        30,
        podium.base.scaling.y - 0.1,
        Math.max(1, progress / 100 * 3),
        BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
      );
    }

    entry.data = {...entry.data, ...data};
    console.log(`✓ Student ${studentId} updated`);
    return true;
  }

  /**
   * Focus camera on student
   */
  function focusOnStudent(studentId, duration = 1000) {
    const entry = studentPodiums.get(studentId);
    if (!entry || !camera) return false;

    const target = entry.position.clone().addInPlace(new BABYLON.Vector3(0, 1, -5));

    const animation = new BABYLON.Animation(
      'cameraFocus',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
    );

    const keys = [
      {frame: 0, value: camera.position.clone()},
      {frame: Math.floor(duration / 16), value: target}
    ];
    animation.setKeys(keys);

    scene.beginAnimation(camera, 0, Math.floor(duration / 16));
    return true;
  }

  /**
   * Get scene
   */
  function getScene() {
    return scene;
  }

  /**
   * Dispose
   */
  function dispose() {
    if (scene) scene.dispose();
    if (engine) engine.dispose();
    studentPodiums.clear();
    isInitialized = false;
  }

  return {
    init,
    addStudent,
    updateStudent,
    focusOnStudent,
    getScene,
    dispose
  };
})();
