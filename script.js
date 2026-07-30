document.addEventListener('DOMContentLoaded', () => {
  const countdownLabel = document.querySelector('.counter');
  const ring = document.querySelector('.ring-progress');
  const intro = document.querySelector('.intro-text');
  const surprise = document.querySelector('.surprise-text');
  const circleHolder = document.querySelector('.circle-holder');
  const loadingCard = document.querySelector('.loading-card');
  const nameCard = document.querySelector('.name-card');
  const videoCard = document.querySelector('.video-card');
  const nameInput = document.getElementById('nameInput');
  const nextButton = document.getElementById('nextButton');
  const surpriseVideo = document.getElementById('surpriseVideo');
  const friendshipScene = document.querySelector('.friendship-scene');
  const wishText = document.getElementById('wishText');
  const wishCaret = document.getElementById('wishCaret');
  const proceedButton = document.getElementById('proceedButton');
  const preparingPanel = document.querySelector('.preparing-panel');
  const certificateOutput = document.querySelector('.certificate-output');
  const downloadButton = document.getElementById('downloadButton');
  const scratchCard = document.querySelector('.scratch-card');
  const scratchCanvas = document.getElementById('scratchCanvas');
  const scratchImage = document.getElementById('scratchImage');
  const scratchNextButton = document.getElementById('scratchNextButton');
  const scratchHint = document.querySelector('.scratch-hint');
  const videoSources = ['assets/video 1.mp4', 'assets/video 2.mp4'];
  let currentVideoIndex = 0;
  let currentFriendName = '';
  let scratchContext = null;
  let isScratching = false;
  let scratchInitialized = false;

  const radius = 95;
  const circumference = 2 * Math.PI * radius;

  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference}`;

  setTimeout(() => {
    intro.classList.add('show');

    setTimeout(() => {
      surprise.classList.add('show');
    }, 700);

    setTimeout(() => {
      circleHolder.classList.add('show');
      startCountdown(5);
    }, 1400);
  }, 500);

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  function startCountdown(seconds) {
    let remaining = seconds;
    countdownLabel.textContent = remaining;
    setProgress(0);

    const startTime = performance.now();
    const duration = seconds * 1000;

    function animate(time) {
      const elapsed = Math.min(time - startTime, duration);
      const progress = (elapsed / duration) * 100;
      setProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);

    const timer = setInterval(() => {
      remaining -= 1;
      countdownLabel.textContent = remaining >= 0 ? remaining : 0;

      if (remaining <= 0) {
        clearInterval(timer);
        setProgress(100);
        showNamePage();
      }
    }, 1000);
  }

  function showNamePage() {
    loadingCard.classList.add('fade-out');
    setTimeout(() => {
      loadingCard.classList.add('hidden');
      surprise.classList.remove('show');
      nameCard.classList.remove('hidden');
      nameCard.classList.add('show');
      nameInput.focus();
    }, 450);
  }

  nameInput.addEventListener('input', () => {
    if (nameInput.value.trim().length > 0) {
      nextButton.classList.remove('hidden');
      nextButton.classList.add('visible');
    } else {
      nextButton.classList.add('hidden');
      nextButton.classList.remove('visible');
    }
  });

  nextButton.addEventListener('click', () => {
    const userName = nameInput.value.trim();
    if (!userName) return;

    currentFriendName = userName;
    nameInput.disabled = true;
    nextButton.disabled = true;
    nameCard.classList.add('fade-out');

    setTimeout(() => {
      nameCard.classList.add('hidden');
      videoCard.classList.remove('hidden');
      videoCard.classList.add('show');
      surpriseVideo.muted = false;
      surpriseVideo.volume = 0.9;
      startVideoSequence();
    }, 450);

    saveNameOnServer(userName).catch((error) => {
      console.error('Name save failed:', error);
    });
  });

  surpriseVideo.addEventListener('ended', () => {
    if (currentVideoIndex === 0) {
      showScratchReveal();
    } else if (currentVideoIndex === 1) {
      setTimeout(() => {
        fadeOutVideoCard();
      }, 5000);
    }
  });

  scratchNextButton.addEventListener('click', () => {
    scratchCard.classList.add('hidden');
    scratchCard.classList.remove('show');
    videoCard.classList.remove('hidden');
    videoCard.classList.add('show');
    playVideo(1);
  });

  function playVideo(index) {
    currentVideoIndex = index;
    surpriseVideo.src = videoSources[index];
    surpriseVideo.load();
    surpriseVideo.play().catch((error) => {
      console.error('Video playback failed:', error);
    });
  }

  function startVideoSequence() {
    setTimeout(() => {
      playVideo(0);
    }, 2000);
  }

  function showScratchReveal() {
    videoCard.classList.add('hidden');
    scratchCard.classList.remove('hidden');
    scratchCard.classList.add('show');
    initializeScratchSurface();
  }

  async function initializeScratchSurface() {
    if (scratchInitialized) return;
    const image = new Image();
    image.src = scratchImage.src;

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
    } catch (error) {
      console.error('Scratch image failed to load:', error);
      scratchHint.textContent = 'Unable to load scratch card.';
      return;
    }

    const canvas = scratchCanvas;
    const rect = scratchImage.getBoundingClientRect();
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    scratchContext = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';

    scratchHint.textContent = 'Scratch to reveal';
    scratchNextButton.classList.add('hidden');
    scratchNextButton.classList.remove('visible');

    canvas.addEventListener('pointerdown', startScratch);
    canvas.addEventListener('pointermove', scratchMove);
    canvas.addEventListener('pointerup', endScratch);
    canvas.addEventListener('pointerleave', endScratch);
    scratchInitialized = true;
  }

  function startScratch(event) {
    isScratching = true;
    scratch(event);
  }

  function scratchMove(event) {
    if (!isScratching) return;
    scratch(event);
  }

  function endScratch() {
    if (!isScratching) return;
    isScratching = false;
    checkScratchProgress();
  }

  function scratch(event) {
    if (!scratchContext) return;
    const rect = scratchCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * scratchCanvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * scratchCanvas.height;
    scratchContext.beginPath();
    scratchContext.arc(x, y, 32, 0, Math.PI * 2);
    scratchContext.fill();
  }

  function checkScratchProgress() {
    if (!scratchContext) return;
    const imageData = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount += 1;
    }

    const percent = (transparentCount / (pixels.length / 4)) * 100;
    if (percent >= 25) {
      scratchHint.textContent = 'Nice! Tap next to continue.';
      scratchNextButton.classList.remove('hidden');
      scratchNextButton.classList.add('visible');
    }
  }

  function fadeOutVideoCard() {
    videoCard.classList.add('fade-out');
    setTimeout(() => {
      videoCard.classList.add('hidden');
      showFriendshipScene();
    }, 500);
  }

  function showFriendshipScene() {
    friendshipScene.classList.remove('hidden');
    friendshipScene.classList.add('show');
    wishText.textContent = '';
    wishCaret.classList.remove('hidden');

    const wish = `Happy Friendship Day , ${currentFriendName}!\n

Just wanted to say I'm really lucky to have friends like you. Thank you for all the laughs 😂, the crazy memories 🤪, the support 💙, and for being there whenever I needed someone.

Life wouldn't be the same without you all. No matter where we go or how busy life gets, I hope we always stay connected and keep making great memories together. 📸✨

Wishing you all lots of happiness, success, good health, and endless reasons to smile. 😊🍀

once again

Happy Friendship Day! 🫶🎉.`;
    typeWishText(wish, () => {
      wishCaret.classList.add('hidden');
      showProceedButton();
    });
  }

  function typeWishText(text, callback) {
    let index = 0;
    const speed = 40;

    const typer = setInterval(() => {
      wishText.textContent = text.slice(0, index + 1);
      index += 1;

      if (index >= text.length) {
        clearInterval(typer);
        callback();
      }
    }, speed);
  }

  function showProceedButton() {
    proceedButton.classList.remove('hidden');
    proceedButton.classList.add('visible');
  }

  function showCertificatePreparation() {
    proceedButton.classList.remove('visible');
    proceedButton.classList.add('hidden');
    preparingPanel.classList.remove('hidden');
    preparingPanel.classList.add('fade-in');

    setTimeout(() => {
      renderCertificate();
    }, 5000);
  }

  async function renderCertificate() {
    const savedName = await getLatestSavedName();
    const displayName = savedName || currentFriendName || 'Beloved Friend';

    await drawCertificateCanvas(displayName);

    preparingPanel.classList.add('hidden');
    certificateOutput.classList.remove('hidden');
    certificateOutput.classList.add('fade-in');
    downloadButton.classList.remove('hidden');
    downloadButton.classList.add('visible');
  }

  proceedButton.addEventListener('click', () => {
    const encodedName = encodeURIComponent(currentFriendName || 'Beloved Friend');
    localStorage.setItem('certificateName', currentFriendName);
    window.location.href = `certificate.html?name=${encodedName}`;
  });

  async function getLatestSavedName() {
    try {
      const response = await fetch('/friend-names');
      if (!response.ok) throw new Error('Unable to load names');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[data.length - 1].name;
      }
    } catch (error) {
      console.warn('Could not load saved name from friendship JSON:', error);
    }
    return null;
  }

  async function saveNameOnServer(name) {
    const payload = {
      name,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/save-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save name');
      }

      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
});
