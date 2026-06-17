// ==========================================================================
// Mandhi Web Application JavaScript
// Bottom navigation, Menu detail overlay, Carousel, Interactive Spin the Wheel,
// Watchlist state management, and Waitlist registration.
// Backend API: Express + SQLite (server.js)
// ==========================================================================

// API base URL — auto-detects local server
const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

  // ==================== TABS SWITCHING ====================
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const menuListView = document.getElementById('menu-list-view');
  const menuDetailView = document.getElementById('menu-detail-view');

  function switchTab(tabId) {
    // Deactivate all tabs
    tabContents.forEach(tab => tab.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    // Activate the selected tab
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Scroll active view to top
    if (activeTab) activeTab.scrollTop = 0;

    // Reset menu subview back to list when navigating to menu tab
    if (tabId === 'menu-tab') {
      menuListView.classList.add('active');
      menuDetailView.classList.remove('active');
    }

    // Re-render waiting list if switched to waiting-list tab
    if (tabId === 'waiting-list-tab') {
      renderQueue();
    }

  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Action links triggers from Home Tab
  const playGamesTrigger = document.querySelector('.play-games-trigger');
  if (playGamesTrigger) {
    playGamesTrigger.addEventListener('click', () => switchTab('games-tab'));
  }
  const navigateHome = document.querySelector('.navigate-home');
  if (navigateHome) {
    navigateHome.addEventListener('click', () => switchTab('home-tab'));
  }
  const navigateMenu = document.querySelector('.navigate-menu');
  if (navigateMenu) {
    navigateMenu.addEventListener('click', () => switchTab('menu-tab'));
  }
  const goToMenuBtn = document.querySelector('.go-to-menu-btn');
  if (goToMenuBtn) {
    goToMenuBtn.addEventListener('click', () => switchTab('menu-tab'));
  }
  
  // Promo and lively teaser card triggers
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.view-signature-trigger');
    if (trigger) {
      const itemId = trigger.getAttribute('data-item') || 'lamb_mandhi';
      switchTab('menu-tab');
      openDishDetails(itemId);
    }
  });

  // Carousel scroll sync and dot indicators
  const promoTrack = document.getElementById('promo-carousel-track');
  const promoDots = document.querySelectorAll('.promo-carousel-dots .dot');
  if (promoTrack && promoDots.length > 0) {
    promoTrack.addEventListener('scroll', () => {
      const cardWidth = promoTrack.firstElementChild ? promoTrack.firstElementChild.getBoundingClientRect().width : promoTrack.clientWidth;
      const index = Math.round(promoTrack.scrollLeft / (cardWidth + 12));
      promoDots.forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    });

    promoDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const cardWidth = promoTrack.firstElementChild ? promoTrack.firstElementChild.getBoundingClientRect().width : promoTrack.clientWidth;
        promoTrack.scrollTo({
          left: i * (cardWidth + 12),
          behavior: 'smooth'
        });
      });
    });
  }
  const spinTeaserTrigger = document.querySelector('.spin-teaser-trigger');
  if (spinTeaserTrigger) {
    spinTeaserTrigger.addEventListener('click', () => switchTab('games-tab'));
  }


  // ==================== FOOD DATA & DETAILS VIEW ====================
  const foodData = {
    chicken_mandhi: {
      name1: 'Chicken',
      name2: 'Mandhi',
      description: 'Slow-cooked whole chicken over fragrant basmati rice, served with tomato sauce and salata.',
      image: 'assets/chicken_mandhi.png',
      images: {
        Quarter: 'assets/chicken_mandhi_quarter.jpg',
        Half: 'assets/chicken_mandhi_half.jpg',
        Full: 'assets/chicken_mandhi.png'
      },
      prices: { Quarter: '₹180', Half: '₹320', Full: '₹580' }
    },
    lamb_mandhi: {
      name1: 'Lamb',
      name2: 'Mandhi',
      description: 'Premium slow-cooked tender lamb shanks over signature spiced rice, accompanied by spicy salata and cooling yogurt sauce.',
      image: 'assets/lamb_mandhi.png',
      images: {
        Quarter: 'assets/lamb_mandhi_quarter.jpg',
        Half: 'assets/lamb_mandhi_half.jpg',
        Full: 'assets/lamb_mandhi.png'
      },
      prices: { Quarter: '₹220', Half: '₹400', Full: '₹750' }
    },
    mutton_mandhi: {
      name1: 'Mutton',
      name2: 'Mandhi',
      description: 'Smoky, tender fire-grilled mutton served over rich traditional basmati Mandhi rice with fresh salata and house broth.',
      image: 'assets/mutton_mandhi.png',
      images: {
        Quarter: 'assets/mutton_mandhi_quarter.jpg',
        Half: 'assets/mutton_mandhi_half.jpg',
        Full: 'assets/mutton_mandhi.png'
      },
      prices: { Quarter: '₹180', Half: '₹320', Full: '₹580' }
    },
    mixed_platter: {
      name1: 'Mixed',
      name2: 'Platter',
      description: 'A feast-sized combination of our finest grilled skewers, chicken Mandhi, and roasted mutton over fragrant rice with side dips.',
      image: 'assets/mixed_platter_half.jpg',
      images: {
        Quarter: 'assets/mixed_platter_quarter.jpg',
        Half: 'assets/mixed_platter.png',
        Full: 'assets/mixed_platter_half.jpg'
      },
      prices: { Quarter: '₹180', Half: '₹320', Full: '₹580' }
    }
  };

  let currentSelectedDish = 'chicken_mandhi';

  const viewDetailBtns = document.querySelectorAll('.view-detail-btn');
  const detailTitleLine1 = document.getElementById('detail-title-line1');
  const detailTitleLine2 = document.getElementById('detail-title-line2');
  const detailDesc = document.getElementById('detail-description-text');
  const detailLargeImg = document.getElementById('detail-large-img');
  const detailBackBtn = document.getElementById('detail-back-btn');
  const sizeBtns = document.querySelectorAll('.size-btn');

  function openDishDetails(itemId) {
    const data = foodData[itemId];
    if (!data) return;

    currentSelectedDish = itemId;

    // Populate details
    detailTitleLine1.textContent = data.name1;
    detailTitleLine2.textContent = data.name2;
    detailDesc.textContent = data.description;
    
    // Set default image to Full
    if (data.images && data.images.Full) {
      detailLargeImg.src = data.images.Full;
    } else {
      detailLargeImg.src = data.image;
    }
    detailLargeImg.alt = `${data.name1} ${data.name2}`;

    // Reset size active selector to 'Full' (as shown in mockups)
    sizeBtns.forEach(btn => {
      if (btn.getAttribute('data-size') === 'Full') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle subviews
    menuListView.classList.remove('active');
    menuDetailView.classList.add('active');

    // Scroll view to top
    const menuTab = document.getElementById('menu-tab');
    if (menuTab) menuTab.scrollTop = 0;
  }

  viewDetailBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-item');
      openDishDetails(itemId);
    });
  });

  detailBackBtn.addEventListener('click', () => {
    menuDetailView.classList.remove('active');
    menuListView.classList.add('active');
  });

  // Size Button Selectors
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const size = btn.getAttribute('data-size');
      const dish = foodData[currentSelectedDish];
      if (dish) {
        // Update the image based on selected portion size
        if (dish.images && dish.images[size]) {
          detailLargeImg.src = dish.images[size];
        } else {
          detailLargeImg.src = dish.image;
        }
        console.log(`Selected ${size} size for ${dish.name1} ${dish.name2} priced at ${dish.prices[size]}`);
      }
    });
  });


  // ==================== STAGGER TESTIMONIALS SLIDER ====================
  const testimonialsData = [
    { tempId: 0, testimonial: "My favorite dining spot in town. We get served 5x faster with Mandhi.", by: "Alex, regular customer", imgSrc: "https://i.pravatar.cc/150?img=1" },
    { tempId: 1, testimonial: "I'm confident the food is clean & authentic at Mandhi. I can't say that about other providers.", by: "Dan, food blogger", imgSrc: "https://i.pravatar.cc/150?img=2" },
    { tempId: 2, testimonial: "I know it's cliche, but we were lost before we found Mandhi. Can't thank you guys enough for the taste!", by: "Stephanie, food reviewer", imgSrc: "https://i.pravatar.cc/150?img=3" },
    { tempId: 3, testimonial: "Mandhi's app makes reserving and waiting seamless. Can't recommend them enough!", by: "Marie, customer", imgSrc: "https://i.pravatar.cc/150?img=4" },
    { tempId: 4, testimonial: "If I could give 11 stars for their Mutton Mandhi, I'd give 12.", by: "Andre, designer", imgSrc: "https://i.pravatar.cc/150?img=5" },
    { tempId: 5, testimonial: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours of cooking so far.", by: "Jeremy, customer", imgSrc: "https://i.pravatar.cc/150?img=6" },
    { tempId: 6, testimonial: "Took some convincing, but now that we've tried Mandhi, we're never going back to regular grills.", by: "Pam, customer", imgSrc: "https://i.pravatar.cc/150?img=7" },
    { tempId: 7, testimonial: "I would be lost without Mandhi's queue updates. The dynamic status is EASILY 100X better for us.", by: "Daniel, analyst", imgSrc: "https://i.pravatar.cc/150?img=8" },
    { tempId: 8, testimonial: "It's just the best platter in town. Period.", by: "Fernando, customer", imgSrc: "https://i.pravatar.cc/150?img=9" },
    { tempId: 9, testimonial: "I switched to Mandhi rice 5 years ago and never looked back.", by: "Andy, customer", imgSrc: "https://i.pravatar.cc/150?img=10" },
    { tempId: 10, testimonial: "I've been searching for authentic taste like Mandhi for YEARS. So glad I finally found it!", by: "Pete, customer", imgSrc: "https://i.pravatar.cc/150?img=11" },
    { tempId: 11, testimonial: "It's so simple and intuitive, we got the whole family ordering in 10 seconds.", by: "Marina, customer", imgSrc: "https://i.pravatar.cc/150?img=12" },
    { tempId: 12, testimonial: "Mandhi's customer service is unparalleled. They're always there when we need extra broth!", by: "Olivia, customer", imgSrc: "https://i.pravatar.cc/150?img=13" },
    { tempId: 13, testimonial: "The efficiency of queueing since using Mandhi's waitlist is off the charts!", by: "Raj, customer", imgSrc: "https://i.pravatar.cc/150?img=14" },
    { tempId: 14, testimonial: "Mandhi has revolutionized how we handle weekend dining. It's a game-changer!", by: "Lila, customer", imgSrc: "https://i.pravatar.cc/150?img=15" },
    { tempId: 15, testimonial: "The portion sizes at Mandhi are impressive. It feeds our massive family meetings seamlessly.", by: "Trevor, customer", imgSrc: "https://i.pravatar.cc/150?img=16" },
    { tempId: 16, testimonial: "I appreciate how Mandhi continually innovates their spices. They're always one step ahead.", by: "Naomi, customer", imgSrc: "https://i.pravatar.cc/150?img=17" },
    { tempId: 17, testimonial: "The quality of saffron and meat with Mandhi is incredible. It's worth every single penny.", by: "Victor, customer", imgSrc: "https://i.pravatar.cc/150?img=18" },
    { tempId: 18, testimonial: "Mandhi's platform is so robust, yet easy to use. It's the perfect balance for ordering.", by: "Yuki, customer", imgSrc: "https://i.pravatar.cc/150?img=19" },
    { tempId: 19, testimonial: "We've tried many outlets, but Mandhi stands out in terms of smoke flavor and performance.", by: "Zoe, customer", imgSrc: "https://i.pravatar.cc/150?img=20" }
  ];

  let testimonialsList = [...testimonialsData];
  let cardWidth = 195;
  let cardHeight = 105;

  const track = document.getElementById('stagger-testimonials-track');

  function createCardsOnce() {
    if (!track) return;
    track.innerHTML = '';
    
    testimonialsList.forEach((testimonial) => {
      const card = document.createElement('div');
      card.className = 'stagger-testimonial-card';
      
      const parts = testimonial.by.split(', ');
      const name = parts[0] || '';
      const role = parts[1] || '';

      card.innerHTML = `
        <div class="review-stars-row">
          <span class="review-star">★</span>
          <span class="review-star">★</span>
          <span class="review-star">★</span>
          <span class="review-star">★</span>
          <span class="review-star">★</span>
        </div>
        <p class="review-quote">"${testimonial.testimonial}"</p>
        <div class="reviewer-info-row">
          <img src="${testimonial.imgSrc}" alt="${name}" class="reviewer-avatar">
          <div class="reviewer-meta-text">
            <h4 class="reviewer-name">${name}</h4>
            <p class="reviewer-role">${role}</p>
          </div>
        </div>
      `;
      
      testimonial.element = card;
      track.appendChild(card);
    });
  }

  function handleMove(steps) {
    // Reset autoplay interval on user clicks so cards don't cycle immediately
    startAutoPlay();

    if (steps === 0) return;

    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = testimonialsList.shift();
        testimonialsList.push(item);
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = testimonialsList.pop();
        testimonialsList.unshift(item);
      }
    }
    updateCardTransforms();
  }

  function updateCardTransforms() {
    testimonialsList.forEach((testimonial, index) => {
      const card = testimonial.element;
      if (!card) return;

      const position = testimonialsList.length % 2
        ? index - (testimonialsList.length + 1) / 2
        : index - testimonialsList.length / 2;

      const isCenter = position === 0;
      const absPos = Math.abs(position);

      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardHeight}px`;

      const isDesktop = window.matchMedia("(min-width: 600px)").matches;
      const spacingFactor = isDesktop ? 90 : 60;

      // Coordinate computations matching stacked premium cards
      const scale = isCenter ? 1 : Math.max(0.7, 1 - 0.12 * absPos);
      const translateX = position * spacingFactor;
      const translateY = isCenter ? -5 : -3 - (absPos * 3);
      // Subtle rotation for a premium stacked look
      const rotate = position * 3.5;
      const zIndex = 10 - absPos;

      card.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`;
      card.style.zIndex = zIndex;

      // Distance checking: hide cards that are too far out
      if (absPos > 2) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.visibility = 'hidden';
      } else {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        card.style.visibility = 'visible';
      }

      if (isCenter) {
        card.classList.add('is-center');
      } else {
        card.classList.remove('is-center');
      }

      // Re-bind dynamic click handler
      const clickHandler = () => handleMove(position);
      if (card._clickHandler) {
        card.removeEventListener('click', card._clickHandler);
      }
      card.addEventListener('click', clickHandler);
      card._clickHandler = clickHandler;
    });
  }

  function updateCardSize() {
    const isDesktop = window.matchMedia("(min-width: 600px)").matches;
    cardWidth = isDesktop ? 260 : 195;
    cardHeight = isDesktop ? 135 : 105;
    updateCardTransforms();
  }

  // Bind controls
  const prevBtn = document.getElementById('stagger-prev-btn');
  const nextBtn = document.getElementById('stagger-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => handleMove(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => handleMove(1));
  }

  // Autoplay Logic
  let autoPlayInterval;
  const container = document.getElementById('stagger-testimonials-container');

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
      handleMove(1);
    }, 4500);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  }

  if (container) {
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    container.addEventListener('touchstart', stopAutoPlay, { passive: true });
    container.addEventListener('touchend', () => {
      setTimeout(startAutoPlay, 1000);
    }, { passive: true });
  }

  // Initial load
  createCardsOnce();
  updateCardSize();
  window.addEventListener('resize', updateCardSize);
  startAutoPlay();


  // ==================== WAITING LIST MANAGEMENT (API-BACKED) ====================

  /**
   * Fetches live queue from the backend API and renders it.
   * Falls back gracefully if the server isn't running.
   */
  async function renderQueue() {
    const queueContainer = document.getElementById('wl-queue-list');
    if (!queueContainer) return;

    try {
      const res = await fetch(`${API_BASE}/api/queue`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const queue = data.queue;
      const stats = data.stats;

      // Update status board stats
      const queueCountBadge = document.getElementById('wl-queue-count-badge');
      if (queueCountBadge) {
        queueCountBadge.textContent = String(stats.count).padStart(2, '0');
      }

      // Render queue rows
      if (queue.length === 0) {
        queueContainer.innerHTML = `
          <div class="wl-queue-row" style="justify-content:center; color: #aaa; font-size: 12px; padding: 24px 0;">
            🎉 No one in queue right now!
          </div>
        `;
        return;
      }

      let rowsHtml = '';
      queue.forEach((party, index) => {
        const rankNum = String(index + 1).padStart(2, '0');
        rowsHtml += `
          <div class="wl-queue-row" style="animation-delay: ${index * 0.05}s">
            <span class="wl-row-num">${rankNum}</span>
            <span class="wl-row-name">${party.name}</span>
            <div class="wl-row-people">
              <span class="wl-people-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                ${party.party_size}
              </span>
            </div>
          </div>
        `;
      });
      queueContainer.innerHTML = rowsHtml;

      // Update last-updated timestamp
      const timeText = document.getElementById('wl-last-updated-text');
      if (timeText) {
        timeText.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

    } catch (err) {
      console.warn('[Mandhi] Could not fetch queue from API:', err.message);
      queueContainer.innerHTML = `
        <div class="wl-queue-row" style="justify-content:center; color:#f97316; font-size:11px; padding:20px;">
          ⚠️ Could not connect to server. Start the backend with: <code>node server.js</code>
        </div>
      `;
    }
  }

  // Refresh Queue button
  const refreshBtn = document.getElementById('wl-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('spinning');
      await renderQueue();
      setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    });
  }

  // Auto-refresh queue every 30 seconds when on the waiting list tab
  setInterval(() => {
    const waitingListTab = document.getElementById('waiting-list-tab');
    if (waitingListTab && waitingListTab.classList.contains('active')) {
      renderQueue();
    }
  }, 30000);

  // Initialize
  renderQueue();
  switchTab('home-tab');


  // ==================== INTERACTIVE SPIN THE WHEEL & RANDOM PICKER ====================
  const canvas = document.getElementById('wheelCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const namePickerModal = document.getElementById('name-picker-modal');
    const selectedNameDisplay = document.getElementById('selected-name-display');
    const removeNameBtn = document.getElementById('remove-name-btn');
    const continueNameBtn = document.getElementById('continue-name-btn');
    const nameAddInput = document.getElementById('wheel-name-add-input');
    const nameAddBtn = document.getElementById('wheel-name-add-btn');
    const namesListContainer = document.getElementById('wheel-names-list');

    // Start empty by default as requested
    let namesList = [];
    
    // Modern clean colors for sectors
    const sectorColors = [
      '#FF7A00', // Mandhi Orange
      '#FFB347', // Light Orange
      '#F04E37', // Warm Red
      '#FFCC02', // Golden Yellow
      '#4CAF50', // Fresh Green
      '#FF6B35', // Tangerine
      '#E8A020', // Amber Gold
      '#8BC34A', // Lime Green
      '#FF9800', // Deep Orange
      '#66BB6A'  // Soft Green
    ];

    function renderNamesList() {
      if (!namesListContainer) return;
      namesListContainer.innerHTML = '';

      namesList.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'pixel-name-item';
        itemDiv.innerHTML = `
          <input type="checkbox" ${item.active ? 'checked' : ''} data-index="${index}" class="pixel-name-checkbox" />
          <span class="pixel-name-text">${item.name}</span>
          <button class="pixel-name-delete" data-index="${index}">🗑</button>
        `;

        // Handle checkbox toggle
        itemDiv.querySelector('.pixel-name-checkbox').addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          namesList[idx].active = e.target.checked;
          drawWheel();
        });

        // Handle item deletion
        itemDiv.querySelector('.pixel-name-delete').addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          namesList.splice(idx, 1);
          renderNamesList();
          drawWheel();
        });

        namesListContainer.appendChild(itemDiv);
      });
    }

    function addName() {
      if (!nameAddInput) return;
      const val = nameAddInput.value.trim();
      if (val) {
        namesList.push({ name: val, active: true });
        nameAddInput.value = '';
        nameAddInput.focus();
        renderNamesList();
        drawWheel();
      }
    }

    if (nameAddBtn) {
      nameAddBtn.addEventListener('click', addName);
    }
    if (nameAddInput) {
      nameAddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addName();
        }
      });
    }

    let currentAngle = 0;
    let isSpinning = false;

    function drawWheel() {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = canvas.width / 2 - 16;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;

      // ── Outer ring: subtle shadow + clean border ──
      // Drop shadow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fill();

      // Outer border ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#3A3A3A';
      ctx.fill();

      // Inner ring highlight
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#555555';
      ctx.fill();

      // Notch dots around the rim
      for (let dotAngle = 0; dotAngle < 360; dotAngle += 15) {
        const rad = (dotAngle * Math.PI) / 180;
        const dotX = centerX + Math.cos(rad) * (radius + 6);
        const dotY = centerY + Math.sin(rad) * (radius + 6);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = dotAngle % 30 === 0 ? '#FFD700' : '#888888';
        ctx.fill();
      }

      const activeNames = namesList.filter(n => n.active);

      // ── Empty state ──
      if (activeNames.length === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        const emptyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        emptyGrad.addColorStop(0, '#F5F5F5');
        emptyGrad.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = emptyGrad;
        ctx.fill();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#999999';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ADD NAMES', centerX, centerY - 8);
        ctx.fillText('TO SPIN', centerX, centerY + 10);
        return;
      }

      const numSectors = activeNames.length;
      const arcSize = (2 * Math.PI) / numSectors;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);

      for (let i = 0; i < numSectors; i++) {
        const angle = i * arcSize;
        const baseColor = sectorColors[i % sectorColors.length];

        // Sector fill
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arcSize);
        ctx.lineTo(0, 0);
        ctx.fillStyle = baseColor;
        ctx.fill();

        // Thin white divider line
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();

        // Name text
        ctx.save();
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Determine text colour contrast
        const isDark = ['#F04E37', '#FF7A00', '#FF6B35', '#4CAF50', '#FF9800'].includes(baseColor);
        ctx.fillStyle = isDark ? '#FFFFFF' : '#222222';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        const nameText = activeNames[i].name;
        ctx.fillText(nameText.substring(0, 14), radius - 18, 0);

        ctx.restore();
      }

      ctx.restore();

      // ── Modern Center Hub ──
      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
      ctx.fillStyle = '#3A3A3A';
      ctx.fill();
      // Inner gradient
      const hubGrad = ctx.createRadialGradient(centerX - 4, centerY - 4, 2, centerX, centerY, 18);
      hubGrad.addColorStop(0, '#FFFFFF');
      hubGrad.addColorStop(0.6, '#F0F0F0');
      hubGrad.addColorStop(1, '#D5D5D5');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF7A00';
      ctx.fill();

      // ── Top Pointer Triangle (drawn outside the wheel) ──
      const pointerX = centerX;
      const pointerY = centerY - radius - 2;
      ctx.beginPath();
      ctx.moveTo(pointerX, pointerY + 4);
      ctx.lineTo(pointerX - 10, pointerY - 16);
      ctx.lineTo(pointerX + 10, pointerY - 16);
      ctx.closePath();
      ctx.fillStyle = '#FF7A00';
      ctx.fill();
      ctx.strokeStyle = '#3A3A3A';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawWheel();
    renderNamesList();

    let lastSelectedName = '';
    let lastSelectedIndex = -1;

    function spin() {
      const activeNames = namesList.filter(n => n.active);
      if (isSpinning || activeNames.length === 0) {
        if (activeNames.length === 0) {
          alert('⚠️ Please add at least one name to spin!');
        }
        return;
      }
      isSpinning = true;
      spinBtn.disabled = true;

      const numSectors = activeNames.length;
      const arcSize = (2 * Math.PI) / numSectors;

      const prizeIndex = Math.floor(Math.random() * numSectors);
      lastSelectedIndex = prizeIndex;
      lastSelectedName = activeNames[prizeIndex].name;

      const targetAngle = 1.5 * Math.PI - (prizeIndex * arcSize) - (arcSize / 2);
      const fullRotations = 6 + Math.floor(Math.random() * 3);
      const startRot = currentAngle;
      const finalRot = startRot + (fullRotations * 2 * Math.PI) + (targetAngle - (startRot % (2 * Math.PI)));

      const duration = 4000;
      const startTime = performance.now();

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animateSpin(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutCubic(progress);

        currentAngle = startRot + (finalRot - startRot) * ease;
        drawWheel();

        if (progress < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          isSpinning = false;
          spinBtn.disabled = false;
          
          setTimeout(() => {
            selectedNameDisplay.textContent = lastSelectedName;
            namePickerModal.classList.add('active');
          }, 350);
        }
      }
      requestAnimationFrame(animateSpin);
    }

    spinBtn.addEventListener('click', spin);

    removeNameBtn.addEventListener('click', () => {
      if (lastSelectedName) {
        // Find the item index in main namesList
        const mainIdx = namesList.findIndex(n => n.name === lastSelectedName);
        if (mainIdx !== -1) {
          namesList.splice(mainIdx, 1);
          renderNamesList();
          drawWheel();
        }
      }
      namePickerModal.classList.remove('active');
    });

    continueNameBtn.addEventListener('click', () => {
      namePickerModal.classList.remove('active');
    });
  }

  // ==================== FLAPPY CHICKEN GAME LOGIC ====================
  const flappyCanvas = document.getElementById('flappyCanvas');
  if (flappyCanvas) {
    const fCtx = flappyCanvas.getContext('2d');
    const startBtn = document.getElementById('flappy-start-btn');
    const overlay = document.getElementById('flappy-overlay');
    const scoreVal = document.getElementById('flappy-score');
    const bestVal = document.getElementById('flappy-best');

    // Ensure the HTML overlay is visible initially
    if (overlay) overlay.style.display = 'flex';

    let gameState = 'menu'; // menu, playing, gameover
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('flappy_best') || '0', 10);
    if (bestVal) bestVal.textContent = bestScore;

    const W = flappyCanvas.width;
    const H = flappyCanvas.height;

    // ── Physics (tuned for a relaxed pace) ──
    const GRAVITY = 0.12;
    const FLAP_VELOCITY = -3.0;
    const MAX_FALL_SPEED = 5;
    const PIPE_GAP = 170;
    const PIPE_SPEED = 0.9;
    const PIPE_SPAWN_DISTANCE = 220;  // px between pipe spawns
    const HITBOX_PADDING = 6;         // px inset on each side

    // Chicken sprite dimensions
    let chickenY = H * 0.45;
    let chickenX = 65;
    let velocity = 0;
    const chickenW = 44;
    const chickenH = 36;

    let pipes = [];
    const pipeWidth = 54;
    let frameCount = 0;
    let distSinceLastPipe = PIPE_SPAWN_DISTANCE; // spawn immediately

    // Layout constants
    const GROUND_Y = H - 44;       // top of ground strip
    const GROUND_H = 44;           // ground height

    // Scroll offsets
    let bgScrollX = 0;
    let bushScrollX = 0;

    // Bouncy title animation counter
    let menuBounce = 0;

    // ── Cloud & palm data ──
    const clouds = [
      { x: 20,  y: 28, w: 65, h: 26 },
      { x: 130, y: 48, w: 80, h: 30 },
      { x: 230, y: 22, w: 55, h: 22 },
    ];
    const palms = [
      { x: 35,  h: 90 },
      { x: 105, h: 75 },
      { x: 190, h: 95 },
      { x: 255, h: 70 },
    ];
    // Flower positions (relative to ground top)
    const flowers = [
      { x: 15,  c: '#E8533F' },
      { x: 58,  c: '#F5A623' },
      { x: 102, c: '#E8533F' },
      { x: 148, c: '#F5A623' },
      { x: 200, c: '#E8533F' },
      { x: 245, c: '#F5A623' },
    ];

    // ── Helper: rounded rect ──
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // ── Reset / Start ──
    function resetGame() {
      chickenY = H * 0.45;
      velocity = 0;
      pipes = [];
      score = 0;
      frameCount = 0;
      distSinceLastPipe = PIPE_SPAWN_DISTANCE;
      if (scoreVal) scoreVal.textContent = '0';

      if (overlay) {
        overlay.style.display = 'flex';
        const logoEl = overlay.querySelector('.flappy-logo');
        const instEl = overlay.querySelector('.flappy-instruction');
        const sBtn = overlay.querySelector('#flappy-start-btn');
        if (logoEl) logoEl.textContent = 'FLAPPY MANDHI';
        if (instEl) instEl.textContent = 'TAP SCREEN TO PLAY';
        if (sBtn) sBtn.textContent = 'START GAME';
      }
    }

    function startGame() {
      resetGame();
      gameState = 'playing';
      if (overlay) overlay.style.display = 'none';
    }

    // ── Input Handlers ──
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
      });
    }

    flappyCanvas.addEventListener('click', () => {
      if (gameState === 'playing') {
        velocity = FLAP_VELOCITY;
      } else if (gameState === 'gameover' || gameState === 'menu') {
        startGame();
      }
    });

    // Touch support for mobile
    flappyCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameState === 'playing') {
        velocity = FLAP_VELOCITY;
      } else if (gameState === 'gameover' || gameState === 'menu') {
        startGame();
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const gamesTab = document.getElementById('games-tab');
        if (gamesTab && gamesTab.classList.contains('active')) {
          e.preventDefault();
          if (gameState === 'playing') {
            velocity = FLAP_VELOCITY;
          } else {
            startGame();
          }
        }
      }
    });

    // ══════════════════ DRAWING FUNCTIONS ══════════════════

    // ── Chunky Cloud ──
    function drawCloud(ctx, cx, cy, w, h) {
      ctx.fillStyle = 'rgba(255, 252, 245, 0.55)';
      const r = h / 2;
      // Main body
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Left bump
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.28, cy + 2, w * 0.26, h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right bump
      ctx.beginPath();
      ctx.ellipse(cx + w * 0.28, cy + 1, w * 0.24, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Palm Tree Silhouette ──
    function drawPalm(ctx, bx, h) {
      const by = GROUND_Y;
      ctx.fillStyle = '#A08060';
      // Trunk
      ctx.fillRect(bx - 3, by - h, 6, h);
      ctx.fillRect(bx - 4, by - h + 4, 8, 6);
      // Fronds
      ctx.fillStyle = '#8A9A5A';
      for (let fa = -1; fa <= 1; fa += 0.5) {
        ctx.save();
        ctx.translate(bx, by - h);
        ctx.rotate(fa * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(20 * (fa < 0 ? -1 : 1), -16, 35 * (fa < 0 ? -1 : 1), 8);
        ctx.quadraticCurveTo(18 * (fa < 0 ? -1 : 1), -6, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      // Center top frond
      ctx.save();
      ctx.translate(bx, by - h);
      ctx.fillStyle = '#7A8C50';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, -22, -8, -14);
      ctx.quadraticCurveTo(-2, -10, 0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-3, -22, 8, -14);
      ctx.quadraticCurveTo(2, -10, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // ── Bush strip ──
    function drawBushes(ctx) {
      const bushY = GROUND_Y - 14;
      bushScrollX = (bushScrollX - PIPE_SPEED * 0.3) % 30;

      // Dark behind-layer bushes
      ctx.fillStyle = '#3D6B30';
      for (let bx = bushScrollX - 30; bx < W + 40; bx += 42) {
        ctx.beginPath();
        ctx.arc(bx, bushY + 6, 18, Math.PI, 0);
        ctx.fill();
      }
      // Bright front-layer bushes
      ctx.fillStyle = '#5A9A3E';
      for (let bx = bushScrollX - 10; bx < W + 40; bx += 36) {
        ctx.beginPath();
        ctx.arc(bx, bushY + 10, 14, Math.PI, 0);
        ctx.fill();
      }
      // Highlight bumps
      ctx.fillStyle = '#6FB84E';
      for (let bx = bushScrollX; bx < W + 40; bx += 36) {
        ctx.beginPath();
        ctx.arc(bx + 6, bushY + 8, 8, Math.PI, 0);
        ctx.fill();
      }

      // Flowers on the bush line
      flowers.forEach(f => {
        const fx = ((f.x + bushScrollX * 0.5) % (W + 20) + W + 20) % (W + 20) - 10;
        ctx.fillStyle = f.c;
        ctx.beginPath();
        ctx.arc(fx, bushY + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        // Center dot
        ctx.fillStyle = '#FFE066';
        ctx.beginPath();
        ctx.arc(fx, bushY + 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ── Ground ──
    function drawGround(ctx) {
      // Main ground fill
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, GROUND_Y, W, GROUND_H);
      // Top highlight
      ctx.fillStyle = '#A08C6E';
      ctx.fillRect(0, GROUND_Y, W, 3);
      // Dark bottom border
      ctx.fillStyle = '#5C4A32';
      ctx.fillRect(0, GROUND_Y + GROUND_H - 4, W, 4);
      // Scrolling brick/stone pattern
      ctx.fillStyle = '#6E5F48';
      bgScrollX = (bgScrollX - PIPE_SPEED) % 24;
      for (let gx = bgScrollX - 24; gx < W + 24; gx += 24) {
        ctx.fillRect(gx, GROUND_Y + 6, 20, 8);
        ctx.fillRect(gx + 12, GROUND_Y + 18, 20, 8);
      }
      // Stone separators
      ctx.fillStyle = '#5C4A32';
      for (let gx = bgScrollX - 24; gx < W + 24; gx += 24) {
        ctx.fillRect(gx + 20, GROUND_Y + 4, 2, 12);
        ctx.fillRect(gx + 8, GROUND_Y + 16, 2, 12);
      }
    }

    // ── Full Background Scene ──
    function drawBackground(ctx) {
      // Gradient sky: warm golden → sandy
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#F0D9A0');
      grad.addColorStop(0.5, '#EDD4A5');
      grad.addColorStop(1, '#D6BF90');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Clouds
      clouds.forEach(c => drawCloud(ctx, c.x, c.y, c.w, c.h));

      // Far hills/dunes
      ctx.fillStyle = '#C8AD82';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.quadraticCurveTo(50, GROUND_Y - 40, 100, GROUND_Y - 20);
      ctx.quadraticCurveTo(160, GROUND_Y - 50, 220, GROUND_Y - 15);
      ctx.quadraticCurveTo(260, GROUND_Y - 35, W, GROUND_Y - 10);
      ctx.lineTo(W, GROUND_Y);
      ctx.fill();

      // Palm silhouettes
      palms.forEach(p => drawPalm(ctx, p.x, p.h));

      // Bushes layer
      drawBushes(ctx);

      // Ground strip
      drawGround(ctx);
    }

    // ── Roasted Chicken Sprite (detailed, larger) ──
    function drawChicken(ctx, x, y) {
      ctx.save();
      ctx.translate(x, y);

      // Slight rotation based on velocity for liveliness
      const rot = Math.max(-0.35, Math.min(0.5, velocity * 0.04));
      ctx.rotate(rot);

      // Shadow under body
      ctx.fillStyle = 'rgba(60, 30, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // -- Drumstick legs (behind body) --
      // Left drumstick
      ctx.fillStyle = '#C0710A';
      ctx.beginPath();
      ctx.ellipse(-14, 8, 5, 9, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Left bone
      ctx.fillStyle = '#FAF0E0';
      ctx.fillRect(-19, 14, 4, 7);
      ctx.fillRect(-20, 20, 6, 3);
      // Bone tip
      ctx.beginPath();
      ctx.arc(-17, 23, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right drumstick
      ctx.fillStyle = '#C0710A';
      ctx.beginPath();
      ctx.ellipse(14, 8, 5, 9, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Right bone
      ctx.fillStyle = '#FAF0E0';
      ctx.fillRect(15, 14, 4, 7);
      ctx.fillRect(14, 20, 6, 3);
      ctx.beginPath();
      ctx.arc(17, 23, 3, 0, Math.PI * 2);
      ctx.fill();

      // -- Main body (large oval) --
      ctx.fillStyle = '#D4850F';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Darker bottom shadow
      ctx.fillStyle = '#B06E0A';
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 8, 0, 0, Math.PI);
      ctx.fill();

      // -- Roast skin highlights --
      ctx.fillStyle = '#E8A020';
      ctx.beginPath();
      ctx.ellipse(-3, -3, 10, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Hot shine
      ctx.fillStyle = '#F0C050';
      ctx.beginPath();
      ctx.ellipse(-4, -5, 6, 4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Top skin highlight (specular)
      ctx.fillStyle = 'rgba(255, 230, 160, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-2, -8, 5, 2.5, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // -- Roast lines / scoring --
      ctx.strokeStyle = '#A06008';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(0, 2, 8, -1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 3);
      ctx.quadraticCurveTo(2, 6, 10, 4);
      ctx.stroke();

      // -- Small steam / heat wisps --
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -14);
      ctx.quadraticCurveTo(-7, -20, -3, -24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, -13);
      ctx.quadraticCurveTo(5, -19, 2, -22);
      ctx.stroke();

      ctx.restore();
    }

    // ── Wooden Pipe / Pillar ──
    function drawPipe(ctx, pipe) {
      ctx.save();

      const topPipeBottom = pipe.top;
      const bottomPipeTop = pipe.top + PIPE_GAP;
      const capH = 16;
      const capOverhang = 5;

      // ─ Top Pipe (body from y=0 down to topPipeBottom - capH) ─
      const topBodyH = topPipeBottom - capH;
      if (topBodyH > 0) {
        // Main fill
        ctx.fillStyle = '#6E4B28';
        ctx.fillRect(pipe.x, 0, pipeWidth, topBodyH);
        // Left highlight stripe
        ctx.fillStyle = '#8C6438';
        ctx.fillRect(pipe.x + 3, 0, 6, topBodyH);
        // Right shadow
        ctx.fillStyle = '#4A3018';
        ctx.fillRect(pipe.x + pipeWidth - 6, 0, 6, topBodyH);
        // Center wood grain lines
        ctx.strokeStyle = '#5A3A1A';
        ctx.lineWidth = 0.6;
        for (let ly = 8; ly < topBodyH; ly += 14) {
          ctx.beginPath();
          ctx.moveTo(pipe.x + 10, ly);
          ctx.lineTo(pipe.x + pipeWidth - 10, ly);
          ctx.stroke();
        }
        // Leaf vine decorations
        ctx.strokeStyle = '#7AA050';
        ctx.lineWidth = 1.2;
        const vineX = pipe.x + pipeWidth / 2;
        for (let ly = 6; ly < topBodyH - 8; ly += 18) {
          // Stem
          ctx.beginPath();
          ctx.moveTo(vineX, ly);
          ctx.lineTo(vineX, ly + 14);
          ctx.stroke();
          // Left leaf
          ctx.fillStyle = '#7AA050';
          ctx.beginPath();
          ctx.ellipse(vineX - 5, ly + 4, 4, 2.5, -0.6, 0, Math.PI * 2);
          ctx.fill();
          // Right leaf
          ctx.beginPath();
          ctx.ellipse(vineX + 5, ly + 10, 4, 2.5, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Border
        ctx.strokeStyle = '#3A2010';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, pipeWidth, topBodyH);
      }
      // Top pipe cap
      ctx.fillStyle = '#5A3820';
      roundRect(ctx, pipe.x - capOverhang, topPipeBottom - capH, pipeWidth + capOverhang * 2, capH, 3);
      ctx.fill();
      ctx.strokeStyle = '#3A2010';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Cap highlight
      ctx.fillStyle = '#7A5430';
      ctx.fillRect(pipe.x - capOverhang + 3, topPipeBottom - capH + 2, pipeWidth + capOverhang * 2 - 6, 4);

      // ─ Bottom Pipe (body from bottomPipeTop + capH down to GROUND_Y) ─
      const bottomBodyTop = bottomPipeTop + capH;
      const bottomBodyH = GROUND_Y - bottomBodyTop;
      // Bottom pipe cap
      ctx.fillStyle = '#5A3820';
      roundRect(ctx, pipe.x - capOverhang, bottomPipeTop, pipeWidth + capOverhang * 2, capH, 3);
      ctx.fill();
      ctx.strokeStyle = '#3A2010';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#7A5430';
      ctx.fillRect(pipe.x - capOverhang + 3, bottomPipeTop + capH - 6, pipeWidth + capOverhang * 2 - 6, 4);

      if (bottomBodyH > 0) {
        ctx.fillStyle = '#6E4B28';
        ctx.fillRect(pipe.x, bottomBodyTop, pipeWidth, bottomBodyH);
        ctx.fillStyle = '#8C6438';
        ctx.fillRect(pipe.x + 3, bottomBodyTop, 6, bottomBodyH);
        ctx.fillStyle = '#4A3018';
        ctx.fillRect(pipe.x + pipeWidth - 6, bottomBodyTop, 6, bottomBodyH);
        // Wood grain
        ctx.strokeStyle = '#5A3A1A';
        ctx.lineWidth = 0.6;
        for (let ly = bottomBodyTop + 8; ly < GROUND_Y; ly += 14) {
          ctx.beginPath();
          ctx.moveTo(pipe.x + 10, ly);
          ctx.lineTo(pipe.x + pipeWidth - 10, ly);
          ctx.stroke();
        }
        // Leaf vines
        ctx.strokeStyle = '#7AA050';
        ctx.lineWidth = 1.2;
        const vineX2 = pipe.x + pipeWidth / 2;
        for (let ly = bottomBodyTop + 6; ly < GROUND_Y - 12; ly += 18) {
          ctx.beginPath();
          ctx.moveTo(vineX2, ly);
          ctx.lineTo(vineX2, ly + 14);
          ctx.stroke();
          ctx.fillStyle = '#7AA050';
          ctx.beginPath();
          ctx.ellipse(vineX2 - 5, ly + 4, 4, 2.5, -0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(vineX2 + 5, ly + 10, 4, 2.5, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#3A2010';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, bottomBodyTop, pipeWidth, bottomBodyH);
      }

      ctx.restore();
    }

    // ── Canvas UI: Score Boards ──
    function drawScoreBoard(ctx, label, value, x, y) {
      const bw = 52, bh = 40, r = 5;
      // Dark outer
      ctx.fillStyle = '#3A2010';
      roundRect(ctx, x - 1, y - 1, bw + 2, bh + 2, r + 1);
      ctx.fill();
      // Inner board
      ctx.fillStyle = '#5A3820';
      roundRect(ctx, x, y, bw, bh, r);
      ctx.fill();
      // Highlight top
      ctx.fillStyle = '#7A5430';
      roundRect(ctx, x + 2, y + 2, bw - 4, 10, 3);
      ctx.fill();

      ctx.fillStyle = '#F0D9A0';
      ctx.font = 'bold 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + bw / 2, y + 12);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "Outfit", sans-serif';
      ctx.fillText(String(value), x + bw / 2, y + 29);
    }

    // ── Canvas UI: Title ──
    function drawTitle(ctx) {
      const cx = W / 2;
      menuBounce += 0.035;
      const offsetY = Math.sin(menuBounce) * 4;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // "FLAPPY" line
      ctx.font = 'bold 22px "Outfit", sans-serif';
      // Dark outline/shadow
      ctx.fillStyle = '#3A2010';
      ctx.fillText('FLAPPY', cx + 1, 75 + offsetY + 1);
      ctx.fillStyle = '#F0C050';
      ctx.fillText('FLAPPY', cx, 75 + offsetY);

      // "CHICKEN" line
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillStyle = '#3A2010';
      ctx.fillText('CHICKEN', cx + 1, 103 + offsetY + 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('CHICKEN', cx, 103 + offsetY);

      ctx.restore();
    }

    // ── Canvas UI: "TAP TO FLAP" prompt ──
    function drawTapPrompt(ctx) {
      const px = 12, py = GROUND_Y - 38;
      const pw = 100, ph = 26, r = 6;

      ctx.fillStyle = '#D4920E';
      roundRect(ctx, px, py, pw, ph, r);
      ctx.fill();
      ctx.strokeStyle = '#3A2010';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Chicken emoji stand-in (small circle)
      ctx.fillStyle = '#F0D9A0';
      ctx.beginPath();
      ctx.arc(px + 16, py + ph / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A06008';
      ctx.font = '11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐔', px + 16, py + ph / 2);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TAP TO FLAP!', px + 28, py + ph / 2 + 1);
    }

    // ── Canvas UI: Game Over screen ──
    function drawGameOver(ctx) {
      // Dim overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;

      // "GAME OVER" title
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 26px "Outfit", sans-serif';
      ctx.fillStyle = '#3A2010';
      ctx.fillText('GAME OVER', cx + 2, H * 0.33 + 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('GAME OVER', cx, H * 0.33);

      // Score
      ctx.font = 'bold 16px "Outfit", sans-serif';
      ctx.fillStyle = '#F0C050';
      ctx.fillText(`SCORE: ${score}`, cx, H * 0.44);

      // Best
      if (score >= bestScore) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('★ NEW BEST! ★', cx, H * 0.52);
      }

      // Tap to restart
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = '#F0D9A0';
      ctx.fillText('TAP TO RESTART', cx, H * 0.64);
    }

    // ══════════════════ MAIN GAME LOOP ══════════════════
    function loop() {
      fCtx.clearRect(0, 0, W, H);

      drawBackground(fCtx);

      if (gameState === 'playing') {
        frameCount++;

        // Physics
        velocity += GRAVITY;
        if (velocity > MAX_FALL_SPEED) velocity = MAX_FALL_SPEED;
        chickenY += velocity;

        // Ground collision
        if (chickenY + chickenH / 2 > GROUND_Y) {
          chickenY = GROUND_Y - chickenH / 2;
          endGame();
        }
        // Ceiling
        if (chickenY - chickenH / 2 < 0) {
          chickenY = chickenH / 2;
          velocity = 0;
        }

        // Spawn pipes based on distance, not frame count
        distSinceLastPipe += PIPE_SPEED;
        if (distSinceLastPipe >= PIPE_SPAWN_DISTANCE) {
          distSinceLastPipe = 0;
          // Random top height; ensure gap fits within playable area
          const minTop = 40;
          const maxTop = GROUND_Y - PIPE_GAP - 40;
          const topH = minTop + Math.floor(Math.random() * (maxTop - minTop));
          pipes.push({
            x: W,
            top: topH,
            passed: false
          });
        }

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
          pipes[i].x -= PIPE_SPEED;

          // Collision (with hitbox padding inset)
          const hbL = chickenX - chickenW / 2 + HITBOX_PADDING;
          const hbR = chickenX + chickenW / 2 - HITBOX_PADDING;
          const hbT = chickenY - chickenH / 2 + HITBOX_PADDING;
          const hbB = chickenY + chickenH / 2 - HITBOX_PADDING;

          if (hbR > pipes[i].x && hbL < pipes[i].x + pipeWidth) {
            if (hbT < pipes[i].top || hbB > pipes[i].top + PIPE_GAP) {
              endGame();
            }
          }

          // Score
          if (pipes[i].x + pipeWidth < chickenX && !pipes[i].passed) {
            score++;
            if (scoreVal) scoreVal.textContent = score;
            pipes[i].passed = true;
          }

          // Remove offscreen
          if (pipes[i].x < -pipeWidth - 10) {
            pipes.splice(i, 1);
          }
        }
      }

      // Draw pipes
      pipes.forEach(pipe => drawPipe(fCtx, pipe));

      // Draw chicken
      drawChicken(fCtx, chickenX, chickenY);

      // ── HUD: In-canvas score boards ──
      drawScoreBoard(fCtx, 'SCORE', score, 8, 8);
      drawScoreBoard(fCtx, 'BEST', bestScore, W - 60, 8);

      // ── State-specific UI ──
      if (gameState === 'menu') {
        drawTitle(fCtx);
        drawTapPrompt(fCtx);
        // Gentle float animation for chicken on menu
        chickenY = H * 0.45 + Math.sin(menuBounce * 1.5) * 8;
      } else if (gameState === 'gameover') {
        drawGameOver(fCtx);
      }

      requestAnimationFrame(loop);
    }

    // ── End Game ──
    function endGame() {
      gameState = 'gameover';
      if (score > bestScore) {
        bestScore = score;
        if (bestVal) bestVal.textContent = bestScore;
        localStorage.setItem('flappy_best', bestScore);
      }

      if (overlay) {
        overlay.style.display = 'flex';
        const logoEl = overlay.querySelector('.flappy-logo');
        const instEl = overlay.querySelector('.flappy-instruction');
        const sBtn = overlay.querySelector('#flappy-start-btn');
        if (logoEl) logoEl.textContent = 'GAME OVER';
        if (instEl) instEl.textContent = `Your Score: ${score} | Best: ${bestScore}`;
        if (sBtn) sBtn.textContent = 'PLAY AGAIN';
      }
    }

    // Listen to exit button to stop/reset flappy bird loop
    const exitGameBtnFlappy = document.getElementById('exit-game-btn');
    if (exitGameBtnFlappy) {
      exitGameBtnFlappy.addEventListener('click', () => {
        gameState = 'menu';
        resetGame();
      });
    }

    // Start rendering loop
    requestAnimationFrame(loop);
  }


  // ==================== WAITLIST MODAL ====================
  const waitlistModal = document.getElementById('waitlist-modal');
  const joinTriggers = document.querySelectorAll('.join-waitlist-trigger');
  const footerWlBtns = document.querySelectorAll('.waitlist-modal-btn');
  const closeModalBtn = document.querySelector('.close-modal-btn');
  const waitlistForm = document.getElementById('waitlist-form');

  function openWaitlist() {
    waitlistModal.classList.add('active');
  }

  function closeWaitlist() {
    waitlistModal.classList.remove('active');
    waitlistForm.reset();
  }

  joinTriggers.forEach(t => t.addEventListener('click', openWaitlist));
  footerWlBtns.forEach(b => b.addEventListener('click', openWaitlist));
  closeModalBtn.addEventListener('click', closeWaitlist);

  waitlistModal.addEventListener('click', (e) => {
    if (e.target === waitlistModal) closeWaitlist();
  });

  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('wl-name').value.trim();
    const phone = document.getElementById('wl-phone').value.trim();
    const email = document.getElementById('wl-email').value.trim();
    const partySizeEl = document.getElementById('wl-party-size');
    const party_size = partySizeEl ? parseInt(partySizeEl.value, 10) : 2;

    const submitBtn = waitlistForm.querySelector('.submit-waitlist-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding you...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, party_size }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to join waitlist.');

      // Show success message
      alert(`🎉 Success! Thank you, ${name}.\nYou are #${data.position} in the queue.\nEstimated wait: ${data.estimatedWait}.\n\nWe will contact you at ${email} or ${phone}.`);

      closeWaitlist();

      // Refresh and show the waiting list tab
      await renderQueue();
      switchTab('waiting-list-tab');

    } catch (err) {
      console.error('[Mandhi] Failed to join waitlist:', err.message);
      alert(`⚠️ Could not connect to the Mandhi server.\nPlease make sure the backend is running:\n  node server.js`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'SUBMIT Waitlist <span class="arrow-icon">➔</span>';
      }
    }
  });

  // ==================== APPLE DOCK MAGNIFICATION EFFECT ====================
  const appleDock = document.querySelector('.apple-dock-nav');
  const appleDockItems = document.querySelectorAll('.apple-dock-nav .nav-item');

  if (appleDock && appleDockItems.length > 0) {
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const dockRect = appleDock.getBoundingClientRect();
      
      // Magnification triggers when the cursor is vertically close (within 120px)
      if (mouseY >= dockRect.top - 120 && mouseY <= dockRect.bottom + 120) {
        appleDockItems.forEach(item => {
          const itemRect = item.getBoundingClientRect();
          const itemCenterX = itemRect.left + itemRect.width / 2;
          const dist = Math.abs(mouseX - itemCenterX);
          
          const maxScale = 1.45;
          const maxDistance = 100;
          let scale = 1;
          
          if (dist < maxDistance) {
            const ratio = (maxDistance - dist) / maxDistance;
            scale = 1 + (maxScale - 1) * Math.sin(ratio * Math.PI / 2);
          }
          
          const icon = item.querySelector('.nav-icon');
          if (icon) {
            icon.style.transform = `scale(${scale})`;
            icon.style.margin = '0';
          }
        });
      } else {
        // Reset scales
        appleDockItems.forEach(item => {
          const icon = item.querySelector('.nav-icon');
          if (icon) {
            icon.style.transform = 'scale(1)';
          }
        });
      }
    });

    appleDock.addEventListener('mouseleave', () => {
      appleDockItems.forEach(item => {
        const icon = item.querySelector('.nav-icon');
        if (icon) {
          icon.style.transform = 'scale(1)';
        }
      });
    });
  }

  // ==================== FULLSCREEN GAME OVERLAY LOGIC ====================
  const gameOverlay = document.getElementById('game-fullscreen-overlay');
  const gameOverlayBody = gameOverlay ? gameOverlay.querySelector('.game-fullscreen-body') : null;
  const exitGameBtn = document.getElementById('exit-game-btn');
  const activeGameContainers = document.getElementById('active-game-containers');
  const gamePreviewCards = document.querySelectorAll('.game-preview-card.playable');

  if (gameOverlay && gameOverlayBody && exitGameBtn && activeGameContainers) {
    gamePreviewCards.forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.getAttribute('data-game');
        let gameCard = null;
        if (gameType === 'spin') {
          gameCard = document.getElementById('spin-game-card');
        } else if (gameType === 'flappy') {
          gameCard = document.getElementById('flappy-game-card');
        }

        if (gameCard) {
          // Clear current fullscreen body
          gameOverlayBody.innerHTML = '';
          // Append the game card to the fullscreen body
          gameOverlayBody.appendChild(gameCard);
          // Show the overlay
          gameOverlay.style.display = 'flex';
        }
      });
    });

    exitGameBtn.addEventListener('click', () => {
      // Find the game card currently inside fullscreen body
      const activeCard = gameOverlayBody.firstElementChild;
      if (activeCard) {
        // Move it back to the hidden containers
        activeGameContainers.appendChild(activeCard);
      }
      // Hide the overlay
      gameOverlay.style.display = 'none';

      // Reset flappy overlay UI
      const flappyOverlay = document.getElementById('flappy-overlay');
      if (flappyOverlay) {
        flappyOverlay.style.display = 'flex';
        flappyOverlay.querySelector('.flappy-logo').textContent = 'FLAPPY MANDHI';
        flappyOverlay.querySelector('.flappy-instruction').textContent = 'TAP SCREEN TO PLAY';
        const sBtn = flappyOverlay.querySelector('#flappy-start-btn');
        if (sBtn) sBtn.textContent = 'START GAME';
      }
    });
  }

});
