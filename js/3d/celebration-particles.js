/**
 * celebration-particles.js
 * Particle effects for celebration moments using Babylon.js
 */

const CelebrationEffect = (() => {
  /**
   * Trigger celebration effect at position
   * @param {BABYLON.Scene} scene - Babylon.js scene
   * @param {BABYLON.Vector3} position - Position for effect
   * @param {object} options - Configuration {intensity, duration, type}
   */
  function trigger(scene, position, options = {}) {
    const {
      intensity = 'normal',
      duration = 2000,
      type = 'confetti'
    } = options;

    switch (type) {
      case 'confetti':
        createConfettiEffect(scene, position, intensity);
        break;
      case 'sparkles':
        createSparklesEffect(scene, position, intensity);
        break;
      case 'burst':
        createBurstEffect(scene, position, intensity);
        break;
      default:
        createConfettiEffect(scene, position, intensity);
    }

    // Auto-cleanup
    setTimeout(() => {
      // Effect particles will be cleaned up by Babylon.js
    }, duration);
  }

  /**
   * Create confetti effect
   */
  function createConfettiEffect(scene, position, intensity) {
    const particleCount = intensity === 'high' ? 100 : intensity === 'low' ? 20 : 50;

    // Create particle system
    const particleSystem = new BABYLON.ParticleSystem(
      'confetti',
      particleCount,
      scene
    );

    // Emitter
    const emitter = new BABYLON.MeshBuilder.CreateSphere(
      'emitter',
      {segments: 8},
      scene
    );
    emitter.position = position;
    emitter.isVisible = false;

    particleSystem.emitter = emitter;

    // Particle texture
    particleSystem.particleTexture = new BABYLON.Texture('/textures/confetti.png', scene);

    // Particle settings
    particleSystem.minEmitPower = 15;
    particleSystem.maxEmitPower = 20;
    particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1);

    // Lifespan
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 3;

    // Size
    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.8;

    // Direction
    particleSystem.direction1 = new BABYLON.Vector3(-5, -10, -5);
    particleSystem.direction2 = new BABYLON.Vector3(5, 10, 5);

    // Gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

    // Colors
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.8, 0, 1));
    particleSystem.addColorGradient(0.5, new BABYLON.Color4(0, 0.8, 1, 1));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0, 0.8, 0));

    // Emit rate and duration
    particleSystem.emitRate = particleCount / 2;
    particleSystem.start();

    // Stop after duration
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
        emitter.dispose();
      }, 3000);
    }, 1000);
  }

  /**
   * Create sparkles effect
   */
  function createSparklesEffect(scene, position, intensity) {
    const particleCount = intensity === 'high' ? 80 : intensity === 'low' ? 15 : 40;

    const particleSystem = new BABYLON.ParticleSystem(
      'sparkles',
      particleCount,
      scene
    );

    const emitter = new BABYLON.MeshBuilder.CreateSphere(
      'sparkleEmitter',
      {segments: 8},
      scene
    );
    emitter.position = position;
    emitter.isVisible = false;

    particleSystem.emitter = emitter;
    particleSystem.particleTexture = new BABYLON.Texture('/textures/sparkle.png', scene);

    // Tight burst
    particleSystem.minEmitPower = 20;
    particleSystem.maxEmitPower = 30;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);

    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 2;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    // Fast moving
    particleSystem.direction1 = new BABYLON.Vector3(-10, -5, -10);
    particleSystem.direction2 = new BABYLON.Vector3(10, 10, 10);

    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

    // Bright colors
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 0, 1)); // Yellow
    particleSystem.addColorGradient(0.5, new BABYLON.Color4(1, 0.5, 0, 1)); // Orange
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 0)); // White fade

    particleSystem.emitRate = particleCount;
    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
        emitter.dispose();
      }, 2000);
    }, 500);
  }

  /**
   * Create burst effect (quick explosion)
   */
  function createBurstEffect(scene, position, intensity) {
    const particleCount = intensity === 'high' ? 150 : intensity === 'low' ? 50 : 100;

    // Create sphere burst
    for (let i = 0; i < particleCount / 10; i++) {
      const particleSystem = new BABYLON.ParticleSystem(
        `burst-${i}`,
        10,
        scene
      );

      const emitter = new BABYLON.MeshBuilder.CreateSphere(
        `burstEmitter-${i}`,
        {segments: 4},
        scene
      );
      emitter.position = position;
      emitter.isVisible = false;

      particleSystem.emitter = emitter;
      particleSystem.particleTexture = new BABYLON.Texture('/textures/particle.png', scene);

      // High velocity burst
      const angle = (i / (particleCount / 10)) * Math.PI * 2;
      const direction = new BABYLON.Vector3(
        Math.cos(angle) * 25,
        20,
        Math.sin(angle) * 25
      );

      particleSystem.direction1 = direction.scale(0.8);
      particleSystem.direction2 = direction.scale(1.2);

      particleSystem.minEmitPower = 0;
      particleSystem.maxEmitPower = 0;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 1;

      particleSystem.minSize = 0.3;
      particleSystem.maxSize = 0.8;

      particleSystem.gravity = new BABYLON.Vector3(0, -20, 0);

      particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 1));
      particleSystem.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 0));

      particleSystem.emitRate = 10;
      particleSystem.start();

      setTimeout(() => {
        particleSystem.stop();
        setTimeout(() => {
          particleSystem.dispose();
          emitter.dispose();
        }, 1000);
      }, 100);
    }
  }

  /**
   * Create floating text effect
   */
  function createFloatingText(scene, position, text, options = {}) {
    const {
      duration = 2000,
      color = new BABYLON.Color3(1, 1, 0),
      size = 2
    } = options;

    // Create billboard text
    const textPlane = BABYLON.MeshBuilder.CreateGround(
      'floatingText',
      {width: size, height: size},
      scene
    );
    textPlane.position = position;

    // Create texture with text
    const texture = new BABYLON.DynamicTexture('floatingTextTexture', 512, scene);
    const ctx = texture.getContext();

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 256);
    texture.update();

    const material = new BABYLON.StandardMaterial('floatingTextMat', scene);
    material.emissiveTexture = texture;
    material.emissiveColor = color;
    textPlane.material = material;

    // Animate upward and fade
    const animation = new BABYLON.Animation(
      'floatText',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP
    );

    const keys = [
      {frame: 0, value: position.y},
      {frame: 60, value: position.y + 3}
    ];
    animation.setKeys(keys);

    scene.beginAnimation(textPlane, 0, 60, false, 1);

    // Fade out
    setTimeout(() => {
      material.alpha = 0;
    }, duration - 500);

    // Cleanup
    setTimeout(() => {
      textPlane.dispose();
      texture.dispose();
      material.dispose();
    }, duration);
  }

  /**
   * Create screen shake effect
   */
  function screenShake(camera, intensity = 1, duration = 300) {
    const originalPosition = camera.position.clone();
    const shakeStrength = 0.1 * intensity;
    const shakeSpeed = 10;

    let elapsed = 0;
    const shakeInterval = setInterval(() => {
      if (elapsed > duration) {
        clearInterval(shakeInterval);
        camera.position = originalPosition;
        return;
      }

      const offsetX = (Math.random() - 0.5) * shakeStrength;
      const offsetY = (Math.random() - 0.5) * shakeStrength;
      const offsetZ = (Math.random() - 0.5) * shakeStrength;

      camera.position.x = originalPosition.x + offsetX;
      camera.position.y = originalPosition.y + offsetY;
      camera.position.z = originalPosition.z + offsetZ;

      elapsed += shakeSpeed;
    }, shakeSpeed);
  }

  return {
    trigger,
    createFloatingText,
    screenShake,
    // Effects
    createConfettiEffect,
    createSparklesEffect,
    createBurstEffect
  };
})();
