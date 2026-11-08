/**
 * THE WEDDING OF FITRI & GUSWIK - INTERACTIVE JAVASCRIPT
 * According to animation.md and design.md
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // 1. EXTRACT PERSONALIZED GUEST NAME FROM URL (?to=...)
  // -------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  let guestName = urlParams.get('to') || urlParams.get('guest') || urlParams.get('u');
  
  const guestDisplayEl = document.getElementById('guest-name-display');
  const rsvpNameInput = document.getElementById('rsvp-name');
  
  if (guestName) {
    // Replace pluses and decode URI components
    guestName = decodeURIComponent(guestName.replace(/\+/g, ' ')).trim();
    if (guestName && guestDisplayEl) {
      guestDisplayEl.textContent = guestName;
    }
    if (guestName && rsvpNameInput && !rsvpNameInput.value) {
      rsvpNameInput.value = guestName;
    }
  } else if (guestDisplayEl) {
    guestDisplayEl.textContent = 'Tamu Undangan';
  }

  // -------------------------------------------------------------------------
  // 2. AUDIO & OPEN INVITATION CONTROLLER
  // -------------------------------------------------------------------------
  const bgAudio = document.getElementById('bg-audio');
  const musicController = document.getElementById('music-controller');
  let isMusicPlaying = false;

  function playAudio() {
    if (!bgAudio) return;
    bgAudio.play().then(() => {
      isMusicPlaying = true;
      if (musicController) {
        musicController.classList.add('playing');
        musicController.setAttribute('aria-label', 'Jeda Musik');
      }
    }).catch(err => {
      console.log('Audio autoplay prevented or user gesture required:', err);
    });
  }

  function pauseAudio() {
    if (!bgAudio) return;
    bgAudio.pause();
    isMusicPlaying = false;
    if (musicController) {
      musicController.classList.remove('playing');
      musicController.setAttribute('aria-label', 'Putar Musik');
    }
  }

  function toggleAudio() {
    if (isMusicPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  if (musicController) {
    musicController.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // -------------------------------------------------------------------------
  // 3. MASTER INTRO & GATE TRANSITION (A-20 & A-30 VIA GSAP)
  // -------------------------------------------------------------------------
  const coverEl = document.getElementById('cover');
  const btnOpen = document.getElementById('btn-open-invitation');
  const driftContainer = document.querySelector('.drift');
  let introFinished = false;
  let isCoverOpen = false;
  let driftInterval = null;
  let shimmerInterval = null;
  let activeLeaves = 0;
  const maxLeaves = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 3 : 5;
  const leafAssets = [
    'assets/leave1.png',
    'assets/leave2.png',
    'assets/leave3.png',
    'assets/leave4.png',
    'assets/leave5.png',
    'assets/leave6.png',
    'assets/leave7.png'
  ];

  // Drifting Leaves Spawner (A-27)
  function spawnLeaf() {
    if (!driftContainer || activeLeaves >= maxLeaves || document.hidden || isCoverOpen) return;
    activeLeaves++;
    const leaf = document.createElement('img');
    const asset = leafAssets[Math.floor(Math.random() * leafAssets.length)];
    leaf.src = asset;
    leaf.alt = '';
    leaf.className = 'drift-leaf';
    
    const widthVw = Math.random() * 4 + 6; // 6vw to 10vw
    const startX = Math.random() * 85 + 5; // 5% to 90%
    const duration = Math.random() * 6 + 12; // 12s to 18s
    const rotStart = Math.random() * 60 - 30;
    const rotEnd = rotStart + (Math.random() > 0.5 ? 360 : -360);
    const driftX = (Math.random() - 0.5) * 16; // ±8vw
    
    leaf.style.width = `${widthVw}vw`;
    leaf.style.maxWidth = '42px';
    leaf.style.left = `${startX}%`;
    leaf.style.top = '-12vh';
    leaf.style.transform = `rotate(${rotStart}deg)`;
    leaf.style.opacity = '0';
    driftContainer.appendChild(leaf);
    
    if (window.gsap) {
      gsap.timeline({
        onComplete: () => {
          leaf.remove();
          activeLeaves--;
        }
      })
      .to(leaf, {
        opacity: 0.85,
        duration: duration * 0.15,
        ease: 'power1.out'
      }, 0)
      .to(leaf, {
        y: '124vh',
        x: `${driftX}vw`,
        rotation: rotEnd,
        duration: duration,
        ease: 'none'
      }, 0)
      .to(leaf, {
        opacity: 0,
        duration: duration * 0.25,
        ease: 'power1.in'
      }, duration * 0.75);
    } else {
      setTimeout(() => {
        leaf.remove();
        activeLeaves--;
      }, 14000);
    }
  }

  function startDrift() {
    if (driftInterval) return;
    spawnLeaf();
    driftInterval = setInterval(spawnLeaf, 3500);
  }

  function stopDrift() {
    if (driftInterval) {
      clearInterval(driftInterval);
      driftInterval = null;
    }
    if (driftContainer) {
      driftContainer.innerHTML = '';
    }
  }

  function startIdle() {
    if (isCoverOpen) return;
    if (coverEl) coverEl.classList.add('is-idle');
    startDrift();
    
    // Gold shimmer repeat every 12s (A-27)
    if (!shimmerInterval && window.gsap) {
      shimmerInterval = setInterval(() => {
        if (isCoverOpen || document.hidden) return;
        gsap.fromTo('.shine', 
          { xPercent: -100, opacity: 0 }, 
          { xPercent: 100, opacity: 0.8, duration: 1, ease: 'power2.inOut' }
        );
      }, 12000);
    }
  }

  function pauseIdle() {
    if (coverEl) coverEl.classList.remove('is-idle');
    stopDrift();
    if (shimmerInterval) {
      clearInterval(shimmerInterval);
      shimmerInterval = null;
    }
  }

  // Build Master GSAP Intro Timeline (A-20)
  let introTl = null;

  function buildIntro() {
    if (!window.gsap) {
      introFinished = true;
      if (btnOpen) btnOpen.classList.add('is-ready');
      document.querySelectorAll('.letter__names .w').forEach(w => w.classList.add('is-writing'));
      startIdle();
      return;
    }

    const E = {
      out: 'power3.out',
      inout: 'power2.inOut',
      settle: 'back.out(1.2)',
      write: 'power1.inOut'
    };

    // Prepare centered transforms for GSAP & initial closed tree state
    gsap.set('.letter-wrapper', { xPercent: -50, yPercent: -50 });
    gsap.set('.fg--bc', { xPercent: -50 });
    gsap.set('.tree-wing--left', { xPercent: 0, rotate: 0 });
    gsap.set('.tree-wing--right', { xPercent: 0, rotate: 0 });
    gsap.set('.tree-canopy-top', { yPercent: 0, scale: 1 });
    gsap.set('.tree-curtain__bottom', { yPercent: 0 });

    introTl = gsap.timeline({
      defaults: { ease: E.out },
      onComplete: () => {
        introFinished = true;
        if (btnOpen) btnOpen.classList.add('is-ready');
        startIdle();
      }
    });

    // 0.0s - 2.2s: L0-bg wash-to-clear & pohon mulai tertutup lalu terbuka
    introTl.addLabel('bg', 0)
      .fromTo('.bg', 
        { opacity: 0, filter: 'blur(8px) saturate(0.35) brightness(1.12)', yPercent: -2.5, scale: 1.06 },
        { opacity: 1, filter: 'blur(0px) saturate(1) brightness(1)', yPercent: 0, scale: 1, duration: 2.2 }, 
        'bg')
      .fromTo('.shine', 
        { xPercent: -100, opacity: 0 }, 
        { xPercent: 100, opacity: 0.8, duration: 1, ease: E.inout }, 
        0.9)

      // 0.4s - 2.2s: ANIMASI TIRAI POHON TERTUTUP LALU TERBUKA (SESUAI REFERENSI)
      .addLabel('treeOpen', 0.4)
      .to('.tree-wing--left', {
        xPercent: -76,
        rotate: -3,
        duration: 1.8,
        ease: 'power3.inOut'
      }, 'treeOpen')
      .to('.tree-wing--right', {
        xPercent: 76,
        rotate: 3,
        duration: 1.8,
        ease: 'power3.inOut'
      }, 'treeOpen')
      .to('.tree-canopy-top', {
        yPercent: -42,
        scale: 1.05,
        duration: 1.8,
        ease: 'power3.inOut'
      }, 'treeOpen')
      .to('.tree-curtain__bottom', {
        yPercent: 6,
        duration: 1.6,
        ease: 'power3.inOut'
      }, 'treeOpen')

      // 1.8s - 3.0s: Kertas Mendarat dengan Sedikit Overshoot
      .addLabel('paper', 1.8)
      .fromTo('.letter-wrapper', 
        { y: '40vh', rotate: 4, opacity: 0 },
        { y: 0, rotate: 0, opacity: 1, duration: 1.2, ease: E.settle }, 
        'paper')
      .fromTo('.letter-flower', 
        { scale: 0.6, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.7, stagger: 0.12 }, 
        'paper+=0.8')

      // 3.0s - 6.2s: Tulisan Nama Reveal Tangan & Wobble Pena
      .addLabel('write', 3.0)
      .fromTo('.letter__eyebrow', 
        { opacity: 0, letterSpacing: '0.6em' }, 
        { opacity: 1, letterSpacing: '0.3em', duration: 0.9 }, 
        'write')
      .fromTo('.ink', 
        { x: 20, rotate: 14, opacity: 0 }, 
        { x: 0, rotate: 8, opacity: 1, duration: 0.6 }, 
        'write+=0.4')
      .add(() => {
        const w1 = document.querySelector('.w--1');
        if (w1) w1.classList.add('is-writing');
      }, 'write+=0.6')
      .add(() => {
        const wAmp = document.querySelector('.w--amp');
        if (wAmp) wAmp.classList.add('is-writing');
      }, 'write+=1.7')
      .add(() => {
        const w2 = document.querySelector('.w--2');
        if (w2) w2.classList.add('is-writing');
      }, 'write+=2.1')
      .to('.ink', { rotate: 11, y: -2, duration: 0.45, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 'write+=0.6')
      .to('.ink', { rotate: 8, y: 0, duration: 0.4, ease: E.out }, 'write+=3.1')
      
      // 6.2s: Tagline & Tamu Undangan Fade In
      .fromTo('.letter__tagline', 
        { opacity: 0, y: 6 }, 
        { opacity: 1, y: 0, duration: 0.8 }, 
        6.2)
      .fromTo('.letter__guest', 
        { opacity: 0, y: 6 }, 
        { opacity: 1, y: 0, duration: 0.8 }, 
        6.4)

      // Muncul secara fade setelah 2 detik animasi selesai
      .fromTo('.cta', 
        { opacity: 0 }, 
        { 
          opacity: 1, 
          duration: 0.9, 
          ease: 'power2.out',
          onStart: () => {
            if (btnOpen) {
              btnOpen.style.pointerEvents = 'auto';
              btnOpen.classList.add('is-ready');
            }
          }
        }, 
        '+=2.0');

    // Normal speed playback for full cinematic immersion
    introTl.timeScale(1.0);

    // Prefers-reduced-motion check
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      skipIntro();
    }
  }

  // Tap-to-skip Intro (A-20)
  function skipIntro() {
    if (introFinished) return;
    if (introTl) {
      introTl.progress(1);
    }
    introFinished = true;
    gsap.set('.tree-wing--left', { xPercent: -76, rotate: -3 });
    gsap.set('.tree-wing--right', { xPercent: 76, rotate: 3 });
    gsap.set('.tree-canopy-top', { yPercent: -42, scale: 1.05 });
    gsap.set('.tree-curtain__bottom', { yPercent: 6 });
    document.querySelectorAll('.letter__names .w').forEach(w => w.classList.add('is-writing'));
    if (btnOpen) {
      gsap.to(btnOpen, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      btnOpen.style.pointerEvents = 'auto';
      btnOpen.classList.add('is-ready');
    }
    startIdle();
  }

  // Transisi "Buka Gapura" (A-30)
  function openGate() {
    if (isCoverOpen) return;
    isCoverOpen = true;
    pauseIdle();

    // 1. Play audio immediately
    playAudio();

    if (!window.gsap) {
      showPage2();
      return;
    }

    const E = { inout: 'power2.inOut', out: 'power3.out' };
    const tl = gsap.timeline({
      defaults: { ease: E.inout },
      onComplete: showPage2
    });

    tl.to('.cta', { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0)
      .to('.letter-wrapper', { y: '-40vh', rotate: -4, opacity: 0, duration: 0.9 }, 0.1)
      .to('.tree-wing--left', { xPercent: -130, opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 0.2)
      .to('.tree-wing--right', { xPercent: 130, opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 0.2)
      .to('.tree-canopy-top', { yPercent: -100, opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2)
      .to('.tree-curtain__bottom', { yPercent: 100, opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2)
      .to('.fg--bl', { x: '-35vw', scale: 1.25, opacity: 0, duration: 1.5 }, 0.3)
      .to('.fg--br', { x: '35vw', scale: 1.25, opacity: 0, duration: 1.5 }, 0.3)
      .to('.fg--bc', { y: '20vw', opacity: 0, duration: 1.4 }, 0.4)
      .to('.bg', { scale: 1.55, transformOrigin: '50% 66%', duration: 1.9 }, 0.3)
      .to('.veil', { opacity: 1, duration: 0.8 }, 1.5);
  }

  function showPage2() {
    if (coverEl) {
      coverEl.style.display = 'none';
    }
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);

    if (musicController) {
      musicController.classList.add('visible');
    }

    const page2 = document.getElementById('page-2');
    if (page2 && window.gsap) {
      page2.style.visibility = 'visible';
      gsap.fromTo(page2, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    }

    // Shift accessibility focus to Hero
    const heroTitle = document.querySelector('#hero-section h1, #hero-section h2');
    if (heroTitle) {
      heroTitle.setAttribute('tabindex', '-1');
      heroTitle.focus();
    }
  }

  // Direct Button Click Listener
  if (btnOpen) {
    btnOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      openGate();
    });
  }

  // Cover Click & Tap Listeners
  if (coverEl) {
    coverEl.addEventListener('click', (e) => {
      if (!introFinished) {
        skipIntro();
        return;
      }
      if (e.target.closest('#btn-open-invitation')) {
        openGate();
      }
    });

    // Touch Swipe Up to Open Gate (A-30)
    let touchStartY = 0;
    coverEl.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    coverEl.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchStartY - touchEndY > 50) {
        if (!introFinished) {
          skipIntro();
        } else {
          openGate();
        }
      }
    }, { passive: true });
  }

  // Initialize Cover Animation
  buildIntro();

  // -------------------------------------------------------------------------
  // 4. DYNAMIC COUNTDOWN TIMER (11 DESEMBER 2026, 08:00 WITA = UTC+8)
  // -------------------------------------------------------------------------
  const eventDate = new Date('2026-12-11T08:00:00+08:00');

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  function updateCountdown() {
    const now = new Date();
    let distance = eventDate.getTime() - now.getTime();

    // If date has passed in the client clock, rollover to the upcoming anniversary so timer remains active
    if (distance <= 0) {
      let celebrationDate = new Date(eventDate);
      while (celebrationDate.getTime() <= now.getTime()) {
        celebrationDate.setFullYear(celebrationDate.getFullYear() + 1);
      }
      distance = celebrationDate.getTime() - now.getTime();
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // -------------------------------------------------------------------------
  // 5. ADD TO GOOGLE CALENDAR (11 DESEMBER 2026)
  // -------------------------------------------------------------------------
  const btnAddToCalendar = document.getElementById('btn-add-calendar');
  if (btnAddToCalendar) {
    btnAddToCalendar.addEventListener('click', (e) => {
      e.preventDefault();
      const title = encodeURIComponent('The Wedding of Guswik & Fitri');
      const details = encodeURIComponent('Upacara Pawiwahan & Resepsi Pernikahan I Gusti Made Dwi Jayantara & Ni Komang Fitri.\nAtas kehadiran dan doa restu Bapak/Ibu/Saudara/i kami ucapkan terima kasih.');
      const location = encodeURIComponent('Community hall of Sembung Gede Kelod Village, Tabanan, Bali');
      const dates = '20261211T000000Z/20261211T100000Z';
      
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');
    });
  }

  // -------------------------------------------------------------------------
  // 6. WEDDING GIFT SECTION & COPY TO CLIPBOARD
  // -------------------------------------------------------------------------
  const btnToggleGift = document.getElementById('btn-toggle-gift');
  const giftPanel = document.getElementById('gift-content-panel');
  const toastNotice = document.getElementById('toast-notice');
  const toastMessage = document.getElementById('toast-message');
  let toastTimeout;

  if (btnToggleGift && giftPanel) {
    btnToggleGift.addEventListener('click', () => {
      const isExpanded = giftPanel.classList.toggle('expanded');
      btnToggleGift.innerHTML = isExpanded 
        ? `<svg viewBox="0 0 512 512"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm96 328c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16h160c8.8 0 16 7.2 16 16v160z"/></svg> Tutup Gift`
        : `<svg viewBox="0 0 512 512"><path d="M496 160h-56v-48c0-26.51-21.49-48-48-48h-80c-26.51 0-48 21.49-48 48v48H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h16v224c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V224h16c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zm-184-48c0-8.82 7.18-16 16-16h80c8.82 0 16 7.18 16 16v48h-112v-48zm120 336H80V224h352v224z"/></svg> Kirim Gift`;
    });
  }

  function showToast(message) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3200);
  }

  const copyButtons = document.querySelectorAll('.btn-copy');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      const label = btn.getAttribute('data-label') || 'Teks';
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`${label} berhasil disalin!`);
        }).catch(() => {
          fallbackCopyText(textToCopy, label);
        });
      } else {
        fallbackCopyText(textToCopy, label);
      }
    });
  });

  function fallbackCopyText(text, label) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`${label} berhasil disalin!`);
    } catch (err) {
      showToast(`Gagal menyalin ${label}`);
    }
    document.body.removeChild(textArea);
  }


  

  // -------------------------------------------------------------------------
  // 7. HORIZONTAL SWIPEABLE GALLERY SLIDER & LIGHTBOX MODAL
  // -------------------------------------------------------------------------
  const sliderTrack = document.getElementById('gallery-slider-track');
  const btnGalleryPrev = document.getElementById('gallery-btn-prev');
  const btnGalleryNext = document.getElementById('gallery-btn-next');
  const galleryCounter = document.getElementById('gallery-counter');
  const dotsWrap = document.getElementById('gallery-dots-wrap');

  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCounter = document.getElementById('lightbox-counter');

  const galleryCards = document.querySelectorAll('.gallery-slide-card, .gallery-item');
  const galleryImages = [];

  galleryCards.forEach((card, index) => {
    const img = card.querySelector('img');
    if (img) {
      galleryImages.push(img.src);
    }
  });

  const totalGallery = galleryImages.length;
  let currentGalleryIndex = 0;
  let activeSlideIndex = 0;

  // Generate Dots
  if (dotsWrap && totalGallery > 0) {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < totalGallery; i++) {
      const dot = document.createElement('button');
      dot.className = `gallery-dot ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `Lihat foto ${i + 1}`);
      dot.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateActiveSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalGallery) index = totalGallery - 1;
    activeSlideIndex = index;

    if (galleryCounter) {
      galleryCounter.textContent = `Foto ${activeSlideIndex + 1} dari ${totalGallery}`;
    }

    if (dotsWrap) {
      const dots = dotsWrap.querySelectorAll('.gallery-dot');
      dots.forEach((dot, i) => {
        if (i === activeSlideIndex) {
          dot.classList.add('active');
          // Keep active dot in view if overflowing
          dot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }

  function scrollToIndex(index) {
    if (!sliderTrack || !galleryCards[index]) return;
    const card = galleryCards[index];
    const offsetLeft = card.offsetLeft - (sliderTrack.clientWidth - card.clientWidth) / 2;
    sliderTrack.scrollTo({
      left: offsetLeft,
      behavior: 'smooth'
    });
    updateActiveSlide(index);
  }

  if (sliderTrack) {
    // Scroll listener to update active dot and counter
    let scrollTimeout;
    sliderTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const trackCenter = sliderTrack.scrollLeft + sliderTrack.clientWidth / 2;
        let closestIndex = 0;
        let minDiff = Infinity;

        galleryCards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.clientWidth / 2;
          const diff = Math.abs(trackCenter - cardCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        });

        updateActiveSlide(closestIndex);
      }, 50);
    }, { passive: true });

    // Prev / Next Navigation Buttons
    if (btnGalleryPrev) {
      btnGalleryPrev.addEventListener('click', () => {
        const nextIdx = Math.max(0, activeSlideIndex - 1);
        scrollToIndex(nextIdx);
      });
    }

    if (btnGalleryNext) {
      btnGalleryNext.addEventListener('click', () => {
        const nextIdx = Math.min(totalGallery - 1, activeSlideIndex + 1);
        scrollToIndex(nextIdx);
      });
    }

    // Mouse Drag-to-Scroll for Desktop
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;

    sliderTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      hasDragged = false;
      sliderTrack.classList.add('active');
      startX = e.pageX - sliderTrack.offsetLeft;
      scrollLeftStart = sliderTrack.scrollLeft;
    });

    sliderTrack.addEventListener('mouseleave', () => {
      isDown = false;
      sliderTrack.classList.remove('active');
    });

    sliderTrack.addEventListener('mouseup', () => {
      isDown = false;
      sliderTrack.classList.remove('active');
    });

    sliderTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - sliderTrack.offsetLeft;
      const walk = (x - startX);
      if (Math.abs(walk) > 6) {
        hasDragged = true;
      }
      sliderTrack.scrollLeft = scrollLeftStart - walk * 1.4;
    });

    // Card Click -> Open Lightbox (prevent opening if user dragged)
    galleryCards.forEach((card, index) => {
      card.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          return;
        }
        openLightbox(index);
      });
    });
  }

  // Lightbox Modal Functions
  function openLightbox(index) {
    currentGalleryIndex = index;
    updateLightbox();
    if (lightboxModal) {
      lightboxModal.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('active');
    }
    if (!document.body.classList.contains('locked')) {
      document.body.style.overflow = '';
    }
  }

  function updateLightbox() {
    if (lightboxImg && galleryImages[currentGalleryIndex]) {
      lightboxImg.style.opacity = '0';
      setTimeout(() => {
        lightboxImg.src = galleryImages[currentGalleryIndex];
        lightboxImg.style.opacity = '1';
      }, 150);
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${galleryImages.length}`;
    }
  }

  function prevImage() {
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightbox();
  }

  function nextImage() {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
    updateLightbox();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    // Touch Swipe Left/Right inside Lightbox on mobile
    let lbTouchStartX = 0;
    let lbTouchStartY = 0;

    lightboxModal.addEventListener('touchstart', (e) => {
      lbTouchStartX = e.changedTouches[0].screenX;
      lbTouchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].screenX - lbTouchStartX;
      const diffY = e.changedTouches[0].screenY - lbTouchStartY;

      // Ensure horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0) {
          nextImage(); // swipe left -> next image
        } else {
          prevImage(); // swipe right -> prev image
        }
      }
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // -------------------------------------------------------------------------
  // 8. RSVP & WEDDING WISHES BOARD (WITH LOCALSTORAGE)
  // -------------------------------------------------------------------------
  const defaultWishes = [
    {
      id: 'w1',
      name: 'I Gede Aditya Wardana',
      attendance: 'hadir',
      time: '2 jam yang lalu',
      message: 'Rahajeng Pawiwahan Fitri & Guswik! Dumogi langgeng riwekasan, labda karya, tur dados keluarga sane sukha lan harmonis selalu.',
      likes: 12
    },
    {
      id: 'w2',
      name: 'Ni Luh Putu Sintya Dewi',
      attendance: 'hadir',
      time: '5 jam yang lalu',
      message: 'Happy Wedding Fitri sayang dan Guswik! Akhirnya berlabuh di pelaminan setelah penantian panjang LDR. Sangat bahagia melihat kalian berdua!',
      likes: 8
    },
    {
      id: 'w3',
      name: 'Mang dan CalonSuami',
      attendance: 'hadir',
      time: '1 hari yang lalu',
      message: 'Selamat berbahagia untuk Fitri & Guswik. Semoga acara pawiwahan dan resepsi berjalan lancar dan penuh berkah Sang Hyang Widhi Wasa.',
      likes: 15
    },
    {
      id: 'w4',
      name: 'Made Rama Sanjaya, S.T.',
      attendance: 'ragu',
      time: '1 hari yang lalu',
      message: 'Selamat kawan seperjuangan Guswik & Fitri! Semoga acaranya sukses lancar jaya. Sedang usahakan cuti biar bisa hadir langsung ke Burau!',
      likes: 4
    },
    {
      id: 'w5',
      name: 'Kadek Ayu Maharani',
      attendance: 'hadir',
      time: '2 hari yang lalu',
      message: 'Om Swastyastu. Selamat menempuh hidup baru sahabatku Fitri & Guswik. Semoga cinta dan kebahagiaan selalu menyertai kalian berdua hingga kakek nenek.',
      likes: 9
    }
  ];

  const STORAGE_KEY = 'fitri_guswik_wedding_wishes_v1';
  let storedWishes = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      storedWishes = JSON.parse(raw);
    } else {
      storedWishes = defaultWishes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWishes));
    }
  } catch (e) {
    storedWishes = defaultWishes;
  }

  const wishesContainer = document.getElementById('wishes-list-container');
  const rsvpForm = document.getElementById('rsvp-form');
  const statTotal = document.getElementById('stat-total');
  const statHadir = document.getElementById('stat-hadir');
  const statTidak = document.getElementById('stat-tidak');
  const statRagu = document.getElementById('stat-ragu');

  function renderStats() {
    let total = storedWishes.length;
    let hadir = storedWishes.filter(w => w.attendance === 'hadir').length;
    let tidak = storedWishes.filter(w => w.attendance === 'tidak-hadir').length;
    let ragu = storedWishes.filter(w => w.attendance === 'ragu').length;

    if (statTotal) statTotal.textContent = total;
    if (statHadir) statHadir.textContent = hadir;
    if (statTidak) statTidak.textContent = tidak;
    if (statRagu) statRagu.textContent = ragu;
  }

  function getAttendanceBadge(status) {
    if (status === 'hadir') {
      return `<span class="badge-attendance hadir"><svg viewBox="0 0 20 20"><path fill="currentColor" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> Hadir</span>`;
    } else if (status === 'tidak-hadir') {
      return `<span class="badge-attendance tidak-hadir"><svg viewBox="0 0 20 20"><path fill="currentColor" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg> Tidak Hadir</span>`;
    } else {
      return `<span class="badge-attendance ragu"><svg viewBox="0 0 20 20"><path fill="currentColor" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/></svg> Masih Ragu</span>`;
    }
  }

  function renderWishes() {
    if (!wishesContainer) return;
    wishesContainer.innerHTML = '';

    storedWishes.forEach(wish => {
      const initial = wish.name ? wish.name.charAt(0).toUpperCase() : 'G';
      const wishCard = document.createElement('div');
      wishCard.className = 'wish-item';
      wishCard.id = `wish-${wish.id}`;
      wishCard.innerHTML = `
        <div class="wish-header">
          <div class="wish-author-wrap">
            <div class="wish-avatar">${initial}</div>
            <div>
              <div class="wish-author-name">${escapeHtml(wish.name)}</div>
              <div class="wish-time">${escapeHtml(wish.time)}</div>
            </div>
          </div>
          <div>${getAttendanceBadge(wish.attendance)}</div>
        </div>
        <div class="wish-message">${escapeHtml(wish.message)}</div>
        <div class="wish-footer">
          <button class="btn-like-wish" data-id="${wish.id}" aria-label="Suka ucapan">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span class="like-count">${wish.likes || 0}</span>
          </button>
        </div>
      `;
      wishesContainer.appendChild(wishCard);
    });

    // Attach like handlers
    wishesContainer.querySelectorAll('.btn-like-wish').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const wish = storedWishes.find(w => w.id === id);
        if (wish) {
          wish.likes = (wish.likes || 0) + 1;
          btn.classList.add('liked');
          btn.querySelector('.like-count').textContent = wish.likes;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWishes));
          } catch(e) {}
        }
      });
    });

    renderStats();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  renderWishes();

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('rsvp-name').value.trim();
      const attendance = document.querySelector('input[name="attendance"]:checked')?.value || 'hadir';
      const message = document.getElementById('rsvp-message').value.trim();

      if (!name) {
        showToast('Mohon masukkan nama Anda.');
        return;
      }
      if (!message) {
        showToast('Mohon tuliskan ucapan atau doa restu.');
        return;
      }

      const newWish = {
        id: 'w_' + Date.now(),
        name: name,
        attendance: attendance,
        time: 'Baru saja',
        message: message,
        likes: 0
      };

      storedWishes.unshift(newWish);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWishes));
      } catch (err) {}

      renderWishes();
      document.getElementById('rsvp-message').value = '';
      showToast('Terima kasih! Ucapan Anda telah tersimpan.');

      if (wishesContainer) {
        wishesContainer.scrollTop = 0;
      }
    });
  }

  // -------------------------------------------------------------------------
  // 9. FLOATING PETALS & GOLD DUST CANVAS ANIMATION
  // -------------------------------------------------------------------------
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 20;

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : -20;
        this.size = Math.random() * 6 + 4;
        this.speedY = Math.random() * 0.8 + 0.4;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.rotation = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 1.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.type = Math.floor(Math.random() * 3);
      }

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.02) * 0.5 + this.speedX;
        this.rotation += this.rotSpeed;

        if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;

        if (this.type === 0) {
          // Gold dust sparkle
          ctx.fillStyle = '#ecc876';
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 1) {
          // Balinese frangipani / white-gold petal
          ctx.fillStyle = '#fffdf7';
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size, this.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(236, 200, 118, 0.7)';
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.28, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Soft coral petal
          ctx.fillStyle = '#f7d3d9';
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 0.9, this.size * 0.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let isTabVisible = true;
    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
    });

    function animateParticles() {
      if (isTabVisible) {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          p.update();
          p.draw();
        });
      }
      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  // -------------------------------------------------------------------------
  // 10. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
  // -------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.fade-in-element');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }
});
