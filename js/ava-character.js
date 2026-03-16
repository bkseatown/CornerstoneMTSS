/**
 * ava-character.js
 * Animated Ava character SVG with emotion and gesture system
 * Brings the brand voice to life with synchronous expression during student interaction
 */

const AvaCharacter = (() => {
  let svgEl = null;
  let containerEl = null;
  let currentEmotion = 'neutral';
  let isAnimating = false;

  // Animation states
  const emotions = {
    neutral: { mouth: 'M50,65 Q70,70 90,65', eyeHeight: 12 },
    happy: { mouth: 'M50,65 Q70,78 90,65', eyeHeight: 14 },
    encouraging: { mouth: 'M50,68 Q70,82 90,68', eyeHeight: 16 },
    confused: { mouth: 'M50,68 Q70,62 90,68', eyeHeight: 10 },
    celebrating: { mouth: 'M50,62 Q70,85 90,62', eyeHeight: 18 },
  };

  /**
   * Initialize Ava character in container
   * @param {string|HTMLElement} selector Container for character
   * @param {object} options Size, position, etc.
   */
  function init(selector, options = {}) {
    containerEl = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!containerEl) {
      console.error('AvaCharacter: container not found');
      return;
    }

    const size = options.size || 200;
    const position = options.position || 'center';

    // Create SVG character
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', '0 0 200 280');
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.setAttribute('style', `
      width: ${size}px;
      height: ${size * 1.4}px;
      display: block;
      margin: 0 auto;
    `);

    renderCharacter(svgEl);
    containerEl.appendChild(svgEl);

    // Load GSAP if not already loaded
    if (typeof gsap === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      script.onload = () => console.log('GSAP loaded');
      document.head.appendChild(script);
    }
  }

  /**
   * Render the character SVG structure
   */
  function renderCharacter(svg) {
    // Head
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', 100);
    head.setAttribute('cy', 80);
    head.setAttribute('r', 50);
    head.setAttribute('fill', '#ffd4a3');
    head.setAttribute('stroke', '#e6a876');
    head.setAttribute('stroke-width', '2');
    head.setAttribute('id', 'ava-head');
    svg.appendChild(head);

    // Left Eye
    const leftEyeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    leftEyeGroup.setAttribute('id', 'ava-eye-left');

    const leftEyeBg = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    leftEyeBg.setAttribute('cx', 75);
    leftEyeBg.setAttribute('cy', 70);
    leftEyeBg.setAttribute('rx', 12);
    leftEyeBg.setAttribute('ry', 12);
    leftEyeBg.setAttribute('fill', 'white');
    leftEyeGroup.appendChild(leftEyeBg);

    const leftEyePupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    leftEyePupil.setAttribute('cx', 75);
    leftEyePupil.setAttribute('cy', 70);
    leftEyePupil.setAttribute('r', 7);
    leftEyePupil.setAttribute('fill', '#333');
    leftEyePupil.setAttribute('id', 'ava-pupil-left');
    leftEyeGroup.appendChild(leftEyePupil);

    svg.appendChild(leftEyeGroup);

    // Right Eye
    const rightEyeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rightEyeGroup.setAttribute('id', 'ava-eye-right');

    const rightEyeBg = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    rightEyeBg.setAttribute('cx', 125);
    rightEyeBg.setAttribute('cy', 70);
    rightEyeBg.setAttribute('rx', 12);
    rightEyeBg.setAttribute('ry', 12);
    rightEyeBg.setAttribute('fill', 'white');
    rightEyeGroup.appendChild(rightEyeBg);

    const rightEyePupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rightEyePupil.setAttribute('cx', 125);
    rightEyePupil.setAttribute('cy', 70);
    rightEyePupil.setAttribute('r', 7);
    rightEyePupil.setAttribute('fill', '#333');
    rightEyePupil.setAttribute('id', 'ava-pupil-right');
    rightEyeGroup.appendChild(rightEyePupil);

    svg.appendChild(rightEyeGroup);

    // Nose
    const nose = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    nose.setAttribute('cx', 100);
    nose.setAttribute('cy', 90);
    nose.setAttribute('rx', 6);
    nose.setAttribute('ry', 8);
    nose.setAttribute('fill', '#e6a876');
    svg.appendChild(nose);

    // Mouth
    const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mouth.setAttribute('d', emotions.neutral.mouth);
    mouth.setAttribute('stroke', '#c97544');
    mouth.setAttribute('stroke-width', '2.5');
    mouth.setAttribute('fill', 'none');
    mouth.setAttribute('stroke-linecap', 'round');
    mouth.setAttribute('id', 'ava-mouth');
    svg.appendChild(mouth);

    // Body (neck + shoulders)
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', 'M85,125 Q85,140 60,160 L60,200 Q60,220 80,230 L120,230 Q140,220 140,200 L140,160 Q115,140 115,125');
    body.setAttribute('fill', '#e8f4fa');
    body.setAttribute('stroke', '#a8c8d8');
    body.setAttribute('stroke-width', '2');
    svg.appendChild(body);

    // Left arm (for gestures)
    const leftArm = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    leftArm.setAttribute('id', 'ava-arm-left');

    const leftArmPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    leftArmPath.setAttribute('d', 'M70,145 Q50,155 45,175');
    leftArmPath.setAttribute('stroke', '#ffd4a3');
    leftArmPath.setAttribute('stroke-width', '8');
    leftArmPath.setAttribute('fill', 'none');
    leftArmPath.setAttribute('stroke-linecap', 'round');
    leftArm.appendChild(leftArmPath);

    const leftHand = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    leftHand.setAttribute('cx', 45);
    leftHand.setAttribute('cy', 175);
    leftHand.setAttribute('r', 6);
    leftHand.setAttribute('fill', '#ffd4a3');
    leftArm.appendChild(leftHand);

    svg.appendChild(leftArm);

    // Right arm (for gestures)
    const rightArm = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rightArm.setAttribute('id', 'ava-arm-right');

    const rightArmPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rightArmPath.setAttribute('d', 'M130,145 Q150,155 155,175');
    rightArmPath.setAttribute('stroke', '#ffd4a3');
    rightArmPath.setAttribute('stroke-width', '8');
    rightArmPath.setAttribute('fill', 'none');
    rightArmPath.setAttribute('stroke-linecap', 'round');
    rightArm.appendChild(rightArmPath);

    const rightHand = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rightHand.setAttribute('cx', 155);
    rightHand.setAttribute('cy', 175);
    rightHand.setAttribute('r', 6);
    rightHand.setAttribute('fill', '#ffd4a3');
    rightArm.appendChild(rightHand);

    svg.appendChild(rightArm);
  }

  /**
   * Set emotion with animation
   * @param {string} emotion One of: neutral, happy, encouraging, confused, celebrating
   * @param {number} duration Animation duration in seconds
   */
  function setEmotion(emotion, duration = 0.6) {
    if (!emotions[emotion] || currentEmotion === emotion) return;

    currentEmotion = emotion;
    const config = emotions[emotion];

    if (typeof gsap !== 'undefined') {
      const mouth = document.getElementById('ava-mouth');
      const eyes = [
        document.getElementById('ava-eye-left'),
        document.getElementById('ava-eye-right')
      ];

      // Mouth animation
      if (mouth) {
        gsap.to(mouth, {
          attr: { d: config.mouth },
          duration: duration,
          ease: 'power2.out'
        });
      }

      // Eyes animation (open more when happy)
      eyes.forEach(eye => {
        if (eye) {
          const ellipses = eye.querySelectorAll('ellipse');
          gsap.to(ellipses, {
            attr: { ry: config.eyeHeight },
            duration: duration,
            ease: 'power2.out'
          });
        }
      });
    }
  }

  /**
   * Wave gesture (encouraging)
   */
  function wave() {
    const arm = document.getElementById('ava-arm-right');
    if (arm && typeof gsap !== 'undefined') {
      gsap.fromTo(arm,
        { rotation: 0 },
        {
          rotation: 25,
          yoyo: true,
          repeat: 2,
          duration: 0.4,
          ease: 'sine.inOut',
          transformOrigin: '130px 145px'
        }
      );
    }
  }

  /**
   * Point gesture (highlighting)
   */
  function point() {
    const arm = document.getElementById('ava-arm-left');
    if (arm && typeof gsap !== 'undefined') {
      gsap.fromTo(arm,
        { rotation: 0 },
        {
          rotation: -20,
          duration: 0.3,
          ease: 'back.out',
          transformOrigin: '70px 145px'
        }
      );
    }
  }

  /**
   * Head tilt (thinking)
   */
  function tilt(direction = 'left') {
    const head = document.getElementById('ava-head');
    if (head && typeof gsap !== 'undefined') {
      const angle = direction === 'left' ? -8 : 8;
      gsap.fromTo(head,
        { rotation: 0 },
        {
          rotation: angle,
          yoyo: true,
          repeat: 1,
          duration: 0.5,
          ease: 'sine.inOut',
          transformOrigin: '100px 80px'
        }
      );
    }
  }

  /**
   * Celebration dance
   */
  function celebrate() {
    setEmotion('celebrating', 0.4);

    const body = document.querySelector('path[d*="L140,160"]');
    if (body && typeof gsap !== 'undefined') {
      gsap.fromTo(body,
        { y: 0, rotation: 0 },
        {
          y: -8,
          rotation: 3,
          yoyo: true,
          repeat: 3,
          duration: 0.3,
          ease: 'sine.inOut',
          transformOrigin: '100px 145px'
        }
      );
    }

    wave();
  }

  /**
   * Show reaction to student answer
   * @param {boolean} isCorrect Was the answer correct?
   */
  function react(isCorrect) {
    if (isCorrect) {
      setEmotion('happy');
      wave();
      setTimeout(() => celebrate(), 400);
    } else {
      setEmotion('encouraging');
      tilt('left');
    }
  }

  /**
   * Speak animation (mouth open)
   */
  function speak() {
    setEmotion('happy');
    // Add subtle bounce while speaking
    const head = document.getElementById('ava-head');
    if (head && typeof gsap !== 'undefined') {
      gsap.to(head, {
        y: -3,
        yoyo: true,
        repeat: 1,
        duration: 0.2,
        ease: 'sine.inOut',
        transformOrigin: '100px 80px'
      });
    }
  }

  /**
   * Reset to neutral state
   */
  function reset() {
    setEmotion('neutral');
  }

  return {
    init,
    setEmotion,
    wave,
    point,
    tilt,
    celebrate,
    react,
    speak,
    reset
  };
})();
