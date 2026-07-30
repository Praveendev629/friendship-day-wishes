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
  const videoSources = ['assets/video 1.mp4', 'assets/video 2.mp4'];
  let currentVideoIndex = 0;

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
    saveNameOnServer(userName).then(() => {
      nameCard.classList.add('fade-out');

      setTimeout(() => {
        nameCard.classList.add('hidden');
        videoCard.classList.remove('hidden');
        videoCard.classList.add('show');
        surpriseVideo.muted = false;
        surpriseVideo.volume = 0.9;
        startVideoSequence();
      }, 450);
    });
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
      setTimeout(() => {
        playVideo(1);
        setTimeout(() => {
          videoCard.classList.add('fade-out');
          setTimeout(() => {
            videoCard.classList.add('hidden');
          }, 500);
        }, 5000);
      }, 3000);
    }, 2000);
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
    }
  }
});
