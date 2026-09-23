(function () {
  "use strict";
  function loadScriptAsync(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", (e) => reject(e));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => {
        s.dataset.loaded = "true";
        resolve();
      };
      s.onerror = (err) => {
        console.error(`Gagal memuat modul script: ${src}`, err);
        reject(err);
      };
      document.body.appendChild(s);
    });
  }
  window.loadScriptAsync = loadScriptAsync;
  let physics = null;
  let carModel = null;
  let world = null;
  let radar = null;
  let audio = window.soundEngine;
  let scene = null;
  let camera = null;
  let renderer = null;
  const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
    shift: false
  };
  window.input = input;
  let isTrackingSkyAscension = false;
  let skyAscensionTimer = 0;
  const CAMERA_MODES = ["CHASE", "HOOD", "TOPDOWN"];
  let currentCameraIndex = 0;
  window._currentCameraMode = CAMERA_MODES[0];
  let isCameraOrbiting = false;
  let orbitStartX = 0;
  let orbitStartY = 0;
  let cameraYawOffset = 0;
  let cameraPitchOffset = 0;
  let walkerCameraYaw = 0;
  window.setCameraYawOffset = (val) => { cameraYawOffset = val; };
  window.setCameraPitchOffset = (val) => { cameraPitchOffset = val; };
  let isCinematic = false;
  let cinematicTarget = null;
  const currentCamLook = new THREE.Vector3(0, 0.82, -40.0);
  let isCarTransitioning = false;
  const transitionCamPos = new THREE.Vector3();
  const transitionCamLook = new THREE.Vector3();
  const QUALITY_MODES = {
    AUTO: "AUTO",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
  };
  const QUALITY_CYCLE = [QUALITY_MODES.AUTO, QUALITY_MODES.HIGH, QUALITY_MODES.MEDIUM, QUALITY_MODES.LOW];
  let currentQualityModeIndex = 0;
  let activeResolvedQuality = QUALITY_MODES.HIGH;
  let isFpsCounterVisible = false;
  let targetFpsLimit = 0;
  let lastFrameTime = 0;
  const CHECKPOINT_STORAGE_KEY = "tokyo_save_point_v1";
  let isCharModalOpen = false;
  let fpsFrameCount = 0;
  let lastFpsTime = performance.now();
  let currentFps = 60;
  let lowFpsStreak = 0;
  let highFpsStreak = 0;
  const LOW_FPS_THRESHOLD = 32;
  const HIGH_FPS_THRESHOLD = 57;
  let activeStation = null;
  let isCheckpointPillVisible = false;
  const UI = {
    checkpointPill: null,
    pillTitle: null,
    pillDistrict: null,
    pillCategory: null,
    pillOpenBtn: null,
    pillCloseBtn: null,
    drawer: null,
    drawerTitle: null,
    drawerDistrict: null,
    drawerCategory: null,
    drawerDesc: null,
    drawerTags: null,
    drawerLink: null,
    drawerCloseBtn: null,
    cameraBtn: null,
    mapBtn: null,
    langBtn: null,
    respawnToast: null,
    switchCharBtn: null,
    charSkillBtn: null,
    inspectBtn: null,
    rpgInspectModal: null,
    inspectCloseBtn: null,
    sniperCrosshair: null,
    sniperScopeOverlay: null,
    hubModal: null,
    openHubBtn: null,
    closeHubBtn: null,
    optAudioBtn: null,
    optQualityBtn: null,
    optFpsBtn: null,
    hudFpsBadge: null,
    optCameraBtn: null,
    optUnstuckBtn: null,
    optResetBtn: null,
    optModeBtn: null,
    hubProjectsList: null,
    walkPrompt: null,
    walkPromptText: null,
    gateModal: null,
    gateCloseBtn: null,
    gateQTag: null,
    gateQText: null,
    gateForm: null,
    gateInput: null,
    gateSubmitBtn: null,
    gateFeedback: null,
    gateQuizBox: null,
    gateRevealCard: null,
    gateRevealImg: null,
    gateRevealCaption: null,
    gateNextBtn: null,
    garageModal: null,
    garageCloseBtn: null
  };
  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function decryptVaultAsset(vaultUrl, answerStr) {
    const keyBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(answerStr.trim().toLowerCase()));
    const keyBytes = new Uint8Array(keyBuf);
    const res = await fetch(vaultUrl);
    if (!res.ok) throw new Error("Vault fetch failed: " + res.status);
    const cipherBuf = await res.arrayBuffer();
    const cipherBytes = new Uint8Array(cipherBuf);
    const plainBytes = new Uint8Array(cipherBytes.length);
    let offset = 0;
    let blockIdx = 0;
    while (offset < cipherBytes.length) {
      const blockPayload = new Uint8Array(36);
      blockPayload.set(keyBytes, 0);
      const view = new DataView(blockPayload.buffer);
      view.setUint32(32, blockIdx, false);
      const blockHash = new Uint8Array(await crypto.subtle.digest("SHA-256", blockPayload));
      const copyLen = Math.min(32, cipherBytes.length - offset);
      for (let i = 0; i < copyLen; i++) {
        plainBytes[offset + i] = cipherBytes[offset + i] ^ blockHash[i];
      }
      offset += copyLen;
      blockIdx++;
    }
    return URL.createObjectURL(new Blob([plainBytes], { type: "image/png" }));
  }
  const CELESTIAL_QUIZ = [
    {
      q: "siapa admin suki?",
      hash: "d2a1ba788399c8d1c1273791c5d9937a0b844247425556a9464677ac6dbbbd1f",
      caption: "Identity: MORGAN // Role: ADMIN SUKI",
      vault: "assets/vault/vault_01.bin"
    },
    {
      q: "siapa member suki?",
      hash: "59ef25a56c4a283719dc49744c47f7998e75b78abd7c3a627c1389352afbd671",
      caption: "Identity: LIEBERT // Role: MEMBER SUKI",
      vault: "assets/vault/vault_02.bin"
    },
    {
      q: "siapa orang normal?",
      hash: "139b7a14182277ce66d589d5ccc563988c753d29973e3a5e4b812a7c1150b5d4",
      caption: "Identity: STELLE // Role: ORANG NORMAL",
      vault: "assets/vault/vault_03.bin"
    }
  ];
  let currentQuizIndex = 0;
  let isGateModalOpen = false;
  window.addEventListener("DOMContentLoaded", initializeApplication);
  function initializeApplication() {
    if (window._updatePreloader) window._updatePreloader(45, "MENYIAPKAN RENDERER & SHADER...");
    cacheDOMElements();
    setupThreeScene();
    if (window._updatePreloader) window._updatePreloader(75, "MEMBANGUN INFRASTRUKTUR SHUTO...");
    setupCoreSystems();
    setupSidebarHub();
    setupCelestialGate();
    setupEventHandlers();
    setupCameraOrbitControls();
    setupTouchControls();
    setupCharacterModal();
    setupGranularGraphicsSettings();
    applyQualityTier(QUALITY_MODES.AUTO, false);
    updateWalkBtnUI();
    loadCheckpointState();
    if (window._updatePreloader) window._updatePreloader(100, "SISTEM SIAP! MASUK JALUR TOL...");
    const preloader = document.getElementById("app-preloader");
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 850);
      }, 350);
    }
    requestAnimationFrame(renderLoop);
    streamBackgroundWorldChunks();
    setInterval(saveCheckpointState, 10000);
  }
  function cacheDOMElements() {
    UI.checkpointPill = document.getElementById("checkpoint-pill");
    UI.pillTitle = document.getElementById("pill-title");
    UI.pillDistrict = document.getElementById("pill-district");
    UI.pillCategory = document.getElementById("pill-cat");
    UI.pillOpenBtn = document.getElementById("pill-open-btn");
    UI.pillCloseBtn = document.getElementById("pill-close-btn");
    UI.drawer = document.getElementById("project-drawer");
    UI.drawerTitle = document.getElementById("drawer-title");
    UI.drawerDistrict = document.getElementById("drawer-district");
    UI.drawerCategory = document.getElementById("drawer-cat");
    UI.drawerDesc = document.getElementById("drawer-desc");
    UI.drawerTags = document.getElementById("drawer-tags");
    UI.drawerLink = document.getElementById("drawer-link");
    UI.drawerCloseBtn = document.getElementById("drawer-close");
    UI.cameraBtn = document.getElementById("btn-camera-view");
    UI.walkBtn = document.getElementById("btn-toggle-walk");
    UI.changeCarBtn = document.getElementById("btn-change-car");
    UI.switchCharBtn = document.getElementById("btn-switch-char");
    UI.charSkillBtn = document.getElementById("btn-char-skill");
    UI.inspectBtn = document.getElementById("btn-inspect");
    UI.rpgInspectModal = document.getElementById("rpg-inspect-modal");
    UI.inspectCloseBtn = document.getElementById("inspect-close-btn");
    UI.sniperCrosshair = document.getElementById("sniper-crosshair");
    UI.sniperScopeOverlay = document.getElementById("sniper-scope-overlay");
    UI.mapBtn = document.getElementById("btn-open-map");
    UI.langBtn = document.getElementById("btn-lang");
    UI.respawnToast = document.getElementById("respawn-toast");
    UI.hubModal = document.getElementById("sidebar-hub-modal");
    UI.openHubBtn = document.getElementById("btn-open-hub");
    UI.closeHubBtn = document.getElementById("btn-close-hub");
    UI.optAudioBtn = document.getElementById("opt-audio-toggle");
    UI.optQualityBtn = document.getElementById("opt-quality-toggle");
    UI.optFpsBtn = document.getElementById("opt-fps-toggle");
    UI.hudFpsBadge = document.getElementById("hud-fps-badge");
    UI.optCameraBtn = document.getElementById("opt-camera-toggle");
    UI.optUnstuckBtn = document.getElementById("opt-unstuck-btn");
    UI.optResetBtn = document.getElementById("opt-reset-btn");
    UI.optModeBtn = document.getElementById("opt-mode-toggle");
    UI.hubProjectsList = document.getElementById("hub-projects-list");
    UI.walkPrompt = document.getElementById("walk-prompt");
    UI.walkPromptText = document.getElementById("walk-prompt-text");
    UI.gateModal = document.getElementById("celestial-gate-modal");
    UI.gateCloseBtn = document.getElementById("gate-close-btn");
    UI.gateQTag = document.getElementById("gate-q-tag");
    UI.gateQText = document.getElementById("gate-q-text");
    UI.gateForm = document.getElementById("gate-form");
    UI.gateInput = document.getElementById("gate-input");
    UI.gateSubmitBtn = document.getElementById("gate-submit-btn");
    UI.gateFeedback = document.getElementById("gate-feedback");
    UI.gateQuizBox = document.getElementById("gate-quiz-box");
    UI.gateRevealCard = document.getElementById("gate-reveal-card");
    UI.gateRevealImg = document.getElementById("gate-reveal-img");
    UI.gateRevealCaption = document.getElementById("gate-reveal-caption");
    UI.gateNextBtn = document.getElementById("gate-next-btn");
    UI.garageModal = document.getElementById("garage-modal");
    UI.garageCloseBtn = document.getElementById("garage-close-btn");
  }
  function setupThreeScene() {
    const container = document.getElementById("webgl-container");
    const aspect = window.innerWidth / window.innerHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 900);
    camera.position.set(0, 3.0, -49.8);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    window.addEventListener("resize", handleWindowResize, false);
  }
  function setupCoreSystems() {
    physics = new window.VehiclePhysicsEngine(window.APP_CONFIG.CAR);
    physics.onVoidFallCallback = handleVoidFall;
    physics.onFootstepCallback = () => {
      if (audio) audio.playFootstep();
    };
    world = new window.TokyoCityWorld(scene, physics, window.APP_CONFIG.WORLD);
    carModel = new window.SportsCarModel(scene, window.APP_CONFIG.CAR);
    const minimapCanvas = document.getElementById("minimap-canvas");
    const fullmapCanvas = document.getElementById("fullmap-canvas");
    radar = new window.WorldRadar(minimapCanvas, fullmapCanvas, window.APP_CONFIG.RADAR);
    window.onStationSelect = (stationId) => {
      cruiseToStation(stationId);
    };
    window.onWeatherChange = (preset) => {
      if (carModel) carModel.applyWeatherLighting(preset);
    };
    window.physics = physics;
    window.world = world;
    window.scene = scene;
    window.carModel = carModel;
    window.radar = radar;
    window.camera = camera;
    window.renderer = renderer;
    window.QUALITY_MODES = QUALITY_MODES;
    window.applyQualityTier = applyQualityTier;
    window.getFPS = () => currentFps;
    window.getWalkerCameraHeading = () => walkerCameraYaw;
    window.saveCheckpointState = saveCheckpointState;
    window.loadCheckpointState = loadCheckpointState;
    window.toggleCharacterModal = toggleCharacterModal;
  }
  function setupCelestialGate() {
    if (UI.walkPrompt) {
      UI.walkPrompt.addEventListener("click", () => {
        toggleWalkAndDrive();
      });
    }
    if (UI.gateCloseBtn) {
      UI.gateCloseBtn.addEventListener("click", () => {
        closeCelestialGateModal();
      });
    }
    if (UI.gateForm) {
      UI.gateForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleQuizSubmit();
      });
    }
    if (UI.gateNextBtn) {
      UI.gateNextBtn.addEventListener("click", () => {
        handleNextQuizStep();
      });
    }
    const viewSkyBtn = document.getElementById("gate-view-sky-btn");
    if (viewSkyBtn) {
      viewSkyBtn.addEventListener("click", () => {
        isTrackingSkyAscension = true;
        skyAscensionTimer = 6.0;
        if (UI.gateModal) UI.gateModal.classList.add("spectate-mode");
      });
    }
  }
  function openCelestialGateModal() {
    if (!UI.gateModal) return;
    isGateModalOpen = true;
    UI.gateModal.classList.add("open");
    renderCurrentQuizStep();
  }
  function closeCelestialGateModal() {
    if (!UI.gateModal) return;
    isGateModalOpen = false;
    UI.gateModal.classList.remove("open");
  }
  function renderCurrentQuizStep() {
    if (currentQuizIndex >= CELESTIAL_QUIZ.length) {
      if (UI.gateQTag) UI.gateQTag.textContent = "GERBANG LANGIT TERBUKA PENUH!";
      if (UI.gateQText) UI.gateQText.textContent = "✦ Semua 3 Gambar Kunci Telah Melayang ke Langit! ✦";
      if (UI.gateForm) UI.gateForm.style.display = "none";
      if (UI.gateRevealCard) UI.gateRevealCard.classList.remove("show");
      return;
    }
    const item = CELESTIAL_QUIZ[currentQuizIndex];
    if (UI.gateQTag) UI.gateQTag.textContent = `PERTANYAAN ${currentQuizIndex + 1} DARI 3`;
    if (UI.gateQText) UI.gateQText.textContent = item.q;
    if (UI.gateInput) {
      UI.gateInput.value = "";
      setTimeout(() => UI.gateInput.focus(), 150);
    }
    if (UI.gateFeedback) {
      UI.gateFeedback.textContent = "";
      UI.gateFeedback.className = "gate-feedback";
    }
    if (UI.gateForm) UI.gateForm.style.display = "block";
    if (UI.gateRevealCard) UI.gateRevealCard.classList.remove("show");
    [1, 2, 3].forEach(num => {
      const el = document.getElementById(`gate-step-${num}`);
      if (!el) return;
      el.classList.toggle("completed", num <= currentQuizIndex);
      el.classList.toggle("active", num === currentQuizIndex + 1);
    });
  }
  async function handleQuizSubmit() {
    if (currentQuizIndex >= CELESTIAL_QUIZ.length) return;
    const currentItem = CELESTIAL_QUIZ[currentQuizIndex];
    const userVal = UI.gateInput ? UI.gateInput.value.trim().toLowerCase() : "";
    const userHash = await sha256Hex(userVal);
    if (userHash === currentItem.hash) {
      if (audio) audio.playKeySuccess();
      if (UI.gateFeedback) {
        UI.gateFeedback.textContent = "✦ KUNCI DITERIMA! KATA SANDI BENAR! MENDEKRIPSI GAMBAR... ✦";
        UI.gateFeedback.className = "gate-feedback success";
      }
      let blobUrl = "";
      try {
        blobUrl = await decryptVaultAsset(currentItem.vault, userVal);
      } catch (err) {
        console.error("Vault decryption error:", err);
      }
      if (world && typeof world.revealCelestialPortrait === "function" && blobUrl) {
        world.revealCelestialPortrait(currentQuizIndex, blobUrl);
      }
      if (world && typeof world.launchCelestialImage === "function") {
        world.launchCelestialImage(currentQuizIndex);
      }
      isTrackingSkyAscension = true;
      skyAscensionTimer = 5.4;
      if (UI.gateModal) {
        UI.gateModal.classList.add("spectate-mode");
      }
      if (UI.gateRevealImg && blobUrl) {
        UI.gateRevealImg.src = blobUrl;
        UI.gateRevealImg.style.display = "block";
        const placeholder = document.getElementById("gate-reveal-placeholder");
        if (placeholder) placeholder.style.display = "none";
      }
      if (UI.gateRevealCaption) UI.gateRevealCaption.textContent = currentItem.caption;
      if (UI.gateRevealCard) UI.gateRevealCard.classList.add("show");
      if (UI.gateForm) UI.gateForm.style.display = "none";
      const curStep = document.getElementById(`gate-step-${currentQuizIndex + 1}`);
      if (curStep) curStep.classList.add("completed");
    } else {
      if (audio) audio.playKeyError();
      if (UI.gateFeedback) {
        UI.gateFeedback.textContent = "⚠️ Kunci salah! Kata sandi tidak cocok untuk mendekripsi brankas rahasia.";
        UI.gateFeedback.className = "gate-feedback error";
      }
      if (UI.gateInput) {
        UI.gateInput.select();
      }
    }
  }
  function handleNextQuizStep() {
    if (UI.gateModal) {
      UI.gateModal.classList.remove("spectate-mode");
    }
    isTrackingSkyAscension = false;
    skyAscensionTimer = 0;
    currentQuizIndex++;
    if (UI.gateRevealImg) {
      UI.gateRevealImg.src = "";
      UI.gateRevealImg.style.display = "none";
    }
    const placeholder = document.getElementById("gate-reveal-placeholder");
    if (placeholder) placeholder.style.display = "block";
    if (currentQuizIndex < CELESTIAL_QUIZ.length) {
      renderCurrentQuizStep();
    } else {
      renderCurrentQuizStep();
      setTimeout(() => {
        closeCelestialGateModal();
      }, 2500);
    }
  }
  let isGarageModalOpen = false;
  function openGarageModal() {
    if (!UI.garageModal) return;
    isGarageModalOpen = true;
    UI.garageModal.classList.add("open");
    updateGarageCardsUI();
    if (audio) audio.playChime();
  }
  function closeGarageModal() {
    if (!UI.garageModal) return;
    isGarageModalOpen = false;
    UI.garageModal.classList.remove("open");
  }
  function toggleGarageModal() {
    if (isGarageModalOpen) closeGarageModal();
    else openGarageModal();
  }
  function updateGarageCardsUI() {
    if (!carModel) return;
    const currentType = carModel.currentCarType;
    document.querySelectorAll(".garage-vehicle-card").forEach((card) => {
      const carType = card.getAttribute("data-car");
      const btn = card.querySelector(".garage-select-btn");
      if (carType === currentType) {
        card.classList.add("active");
        if (btn) btn.textContent = "✓ SEDANG DIGUNAKAN";
      } else {
        card.classList.remove("active");
        if (btn) btn.textContent = "PILIH MOBIL INI";
      }
    });
  }
  window.updateGarageCardsUI = updateGarageCardsUI;
  function showGameToast(msg, duration = 2600) {
    if (!UI.respawnToast) return;
    UI.respawnToast.textContent = msg;
    UI.respawnToast.classList.add("show");
    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(() => {
      if (UI.respawnToast) UI.respawnToast.classList.remove("show");
    }, duration);
  }
  window.showGameToast = showGameToast;
  function changeCar(specificType) {
    if (!carModel) return;
    carModel.switchCar(specificType);
    if (audio) audio.playChime();
    const meta = carModel.CAR_METADATA[carModel.currentCarType];
    if (meta) {
      showGameToast(`🏎️ Mobil Berganti: ${meta.name}`, 2500);
    }
    updateGarageCardsUI();
  }
  function switchCharacter(targetChar) {
    if (!world) return;
    const req = targetChar ? String(targetChar).toUpperCase() : "";
    const nextChar = (req === "MIYU" || req === "MINATO") ? req : (world.activeCharacter === "MINATO" ? "MIYU" : "MINATO");
    world.setCharacter(nextChar);
    if (audio) audio.playChime();
    showGameToast(nextChar === "MIYU" ? "🎯 Karakter Aktif: Kasumizawa Miyu (SRT)" : "⚡ Karakter Aktif: Minato Namikaze (Hokage)", 2500);
    if (isRPGInspectorOpen && inspectorCurrentTab === "CHAR") {
      loadInspectorModel();
      updateInspectorLoreCard();
    }
  }
  window.switchCharacter = switchCharacter;
  const SNIPER_ZOOM_LEVELS = [4.0, 8.0, 12.0];
  let sniperZoomIndex = 1;
  function setSniperZoom(idx) {
    sniperZoomIndex = (idx + SNIPER_ZOOM_LEVELS.length) % SNIPER_ZOOM_LEVELS.length;
    const zoomVal = SNIPER_ZOOM_LEVELS[sniperZoomIndex];
    const zoomBadge = document.getElementById("scope-zoom-val");
    if (zoomBadge) zoomBadge.textContent = `${zoomVal.toFixed(1)}X`;
    if (audio) audio.playChime();
    showGameToast(`🔭 ZOOM OPTIK: ${zoomVal.toFixed(1)}X`, 1200);
  }
  window.setSniperZoom = setSniperZoom;
  function toggleSniperAim() {
    if (!world || (physics && physics.mode !== "WALKING")) return;
    if (world.activeCharacter !== "MIYU") {
      showGameToast("💡 Beralih ke Kasumizawa Miyu (X) untuk mode bidik sniper!", 2200);
      return;
    }
    world.isAiming = !world.isAiming;
    const scopeOverlay = document.getElementById("sniper-scope-overlay");
    if (scopeOverlay) {
      if (world.isAiming) {
        scopeOverlay.classList.add("active");
        const zoomBadge = document.getElementById("scope-zoom-val");
        if (zoomBadge) zoomBadge.textContent = `${SNIPER_ZOOM_LEVELS[sniperZoomIndex].toFixed(1)}X`;
      } else {
        scopeOverlay.classList.remove("active");
      }
    }
    if (UI.sniperCrosshair) {
      if (world.isAiming) UI.sniperCrosshair.classList.add("active");
      else UI.sniperCrosshair.classList.remove("active");
    }
    if (audio) audio.playChime();
    if (world.isAiming) {
      showGameToast(`🔭 MODE BIDIK SNIPER AKTIF (${SNIPER_ZOOM_LEVELS[sniperZoomIndex]}X) • Scroll mouse untuk zoom • Klik / E untuk menembak`, 2500);
    }
  }
  window.toggleSniperAim = toggleSniperAim;
  function triggerCharacterSkill() {
    if (!world || !physics) return;
    if (physics.mode !== "WALKING") {
      showGameToast("💡 Turun dari mobil (F) terlebih dahulu untuk memakai skill!", 2200);
      return;
    }
    if (world.activeCharacter === "MINATO") {
      const lookYaw = physics.walkerRotation + cameraYawOffset;
      const throwDist = 45.0;
      const fromPos = new THREE.Vector3(physics.walkerX, physics.walkerY + 1.1, physics.walkerZ);
      const targetX = physics.walkerX + Math.sin(lookYaw) * throwDist;
      const targetZ = physics.walkerZ + Math.cos(lookYaw) * throwDist;
      const elev = (typeof physics.getGroundElevation === "function") ? physics.getGroundElevation(targetX, targetZ) : 0.05;
      const targetY = (elev !== null) ? elev : physics.walkerY;
      const toPos = new THREE.Vector3(targetX, targetY, targetZ);
      if (typeof world.triggerMinatoHiraishin === "function") {
        world.triggerMinatoHiraishin(fromPos, toPos, () => {
          physics.walkerX = targetX;
          physics.walkerY = targetY;
          physics.walkerZ = targetZ;
          showGameToast("⚡ HIRAISHIN NO JUTSU! Teleportasi Kilat Kuning Sukses!", 2000);
        });
      } else {
        if (audio) audio.playKunaiThrow();
        setTimeout(() => {
          if (audio) audio.playTeleportHiraishin();
          if (typeof world.createHiraishinTeleportVFX === "function") {
            world.createHiraishinTeleportVFX(fromPos, toPos);
          }
          physics.walkerX = targetX;
          physics.walkerY = targetY;
          physics.walkerZ = targetZ;
          showGameToast("⚡ HIRAISHIN NO JUTSU! Teleportasi Kilat Kuning Sukses!", 2000);
        }, 300);
      }
    } else if (world.activeCharacter === "MIYU") {
      const lookYaw = physics.walkerRotation + cameraYawOffset;
      const barrelPos = new THREE.Vector3(
        physics.walkerX + Math.sin(lookYaw) * 0.45,
        physics.walkerY + 1.25,
        physics.walkerZ + Math.cos(lookYaw) * 0.45
      );
      const shotRange = 220.0;
      const hitPos = new THREE.Vector3(
        physics.walkerX + Math.sin(lookYaw) * shotRange,
        physics.walkerY + 1.25 - cameraPitchOffset * 25.0,
        physics.walkerZ + Math.cos(lookYaw) * shotRange
      );
      if (typeof world.triggerMiyuSniperShot === "function") {
        world.triggerMiyuSniperShot(barrelPos, hitPos);
      } else {
        if (audio) audio.playSniperShot();
        if (typeof world.createSniperShotVFX === "function") {
          world.createSniperShotVFX(barrelPos, hitPos);
        }
      }
      cameraPitchOffset = Math.max(-1.35, cameraPitchOffset - 0.055);
      showGameToast("🎯 Tembakan Jitu Mosin-Nagant! Target Dilumpuhkan!", 1800);
    }
  }
  window.triggerCharacterSkill = triggerCharacterSkill;
  let isRPGInspectorOpen = false;
  let inspectorRenderer = null;
  let inspectorScene = null;
  let inspectorCamera = null;
  let inspectorTarget = new THREE.Vector3(0, 0.9, 0);
  let inspectorCamDist = 2.8;
  let inspectorRotX = 0.15;
  let inspectorRotY = 0.35;
  let inspectorCurrentTab = "CHAR";
  let inspectorModelRoot = null;
  let inspectorPedestal = null;
  let inspectorRing = null;
  let inspectorAnimId = null;
  let isInspectorDragging = false;
  let isInspectorPanning = false;
  let inspectStartX = 0, inspectStartY = 0;
  function toggleRPGInspector() {
    if (isRPGInspectorOpen) {
      closeRPGInspectorModal();
    } else {
      openRPGInspectorModal();
    }
  }
  window.toggleRPGInspector = toggleRPGInspector;
  function openRPGInspectorModal() {
    if (isRPGInspectorOpen) return;
    isRPGInspectorOpen = true;
    if (!UI.rpgInspectModal) {
      UI.rpgInspectModal = document.getElementById("rpg-inspect-modal");
    }
    if (UI.rpgInspectModal) {
      UI.rpgInspectModal.classList.add("open");
    }
    initInspector3DView();
    updateInspectorLoreCard();
    if (audio) audio.playChime();
  }
  window.openRPGInspectorModal = openRPGInspectorModal;
  window.openInspectStudio = (target) => {
    if (target) {
      const t = String(target).toUpperCase();
      if (t === "CAR") {
        inspectorCurrentTab = "CAR";
      } else {
        inspectorCurrentTab = "CHAR";
      }
    }
    openRPGInspectorModal();
    if (target) {
      const t = String(target).toUpperCase();
      const tabCar = document.getElementById("inspect-tab-car");
      const tabChar = document.getElementById("inspect-tab-char");
      if (t === "CAR") {
        if (tabCar) tabCar.classList.add("active");
        if (tabChar) tabChar.classList.remove("active");
      } else {
        if (tabChar) tabChar.classList.add("active");
        if (tabCar) tabCar.classList.remove("active");
        if (t === "MIYU" || t === "MINATO") {
          switchCharacter(t);
        }
      }
      loadInspectorModel();
      updateInspectorLoreCard();
    }
  };
  window.setInspectFocus = (focusName) => {
    const f = String(focusName).toLowerCase();
    const btn = document.getElementById("preset-" + f);
    if (btn) btn.click();
  };
  function closeRPGInspectorModal() {
    if (!isRPGInspectorOpen) return;
    isRPGInspectorOpen = false;
    if (UI.rpgInspectModal) {
      UI.rpgInspectModal.classList.remove("open");
    }
    if (inspectorAnimId) {
      cancelAnimationFrame(inspectorAnimId);
      inspectorAnimId = null;
    }
    if (inspectorRenderer) {
      const mount = document.getElementById("inspect-canvas-mount");
      if (mount && inspectorRenderer.domElement && inspectorRenderer.domElement.parentNode === mount) {
        mount.removeChild(inspectorRenderer.domElement);
      }
      inspectorRenderer.dispose();
      inspectorRenderer = null;
    }
    inspectorScene = null;
    inspectorCamera = null;
    inspectorModelRoot = null;
  }
  window.closeRPGInspectorModal = closeRPGInspectorModal;
  function initInspector3DView() {
    const mount = document.getElementById("inspect-canvas-mount");
    if (!mount) return;
    mount.innerHTML = "";
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;
    inspectorRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    inspectorRenderer.setSize(width, height);
    inspectorRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    inspectorRenderer.shadowMap.enabled = true;
    inspectorRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(inspectorRenderer.domElement);
    inspectorScene = new THREE.Scene();
    inspectorScene.background = new THREE.Color(0x0a101b);
    inspectorCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const ambLight = new THREE.AmbientLight(0xffffff, 0.95);
    inspectorScene.add(ambLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    inspectorScene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.7);
    fillLight.position.set(-5, 4, -4);
    inspectorScene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
    rimLight.position.set(0, 6, -6);
    inspectorScene.add(rimLight);
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.15, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x141d2e, roughness: 0.4, metalness: 0.6 });
    inspectorPedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    inspectorPedestal.position.y = -0.075;
    inspectorPedestal.receiveShadow = true;
    inspectorScene.add(inspectorPedestal);
    const ringGeo = new THREE.RingGeometry(1.58, 1.68, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    inspectorRing = new THREE.Mesh(ringGeo, ringMat);
    inspectorRing.rotation.x = -Math.PI / 2;
    inspectorRing.position.y = 0.005;
    inspectorScene.add(inspectorRing);
    loadInspectorModel();
    setupInspectorControls(mount);
    function animateInspector() {
      if (!isRPGInspectorOpen) return;
      inspectorAnimId = requestAnimationFrame(animateInspector);
      const mw = mount.clientWidth || 800;
      const mh = mount.clientHeight || 600;
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      if (inspectorRenderer.domElement.width !== Math.floor(mw * pr) || inspectorRenderer.domElement.height !== Math.floor(mh * pr)) {
        inspectorRenderer.setSize(mw, mh);
        inspectorCamera.aspect = mw / mh;
        inspectorCamera.updateProjectionMatrix();
      }
      const cy = Math.cos(inspectorRotY);
      const sy = Math.sin(inspectorRotY);
      const cx = Math.cos(inspectorRotX);
      const sx = Math.sin(inspectorRotX);
      inspectorCamera.position.x = inspectorTarget.x + inspectorCamDist * cx * sy;
      inspectorCamera.position.y = inspectorTarget.y + inspectorCamDist * sx;
      inspectorCamera.position.z = inspectorTarget.z + inspectorCamDist * cx * cy;
      inspectorCamera.lookAt(inspectorTarget);
      if (inspectorModelRoot && inspectorCurrentTab === "CHAR") {
        inspectorModelRoot.position.y = Math.sin(Date.now() * 0.002) * 0.008;
      }
      inspectorRenderer.render(inspectorScene, inspectorCamera);
    }
    animateInspector();
  }
  function cloneSkinnedHierarchy(source) {
    if (!source) return null;
    const clone = source.clone(true);
    const srcBones = [], clnBones = [];
    source.traverse(c => { if (c.isBone) srcBones.push(c); });
    clone.traverse(c => { if (c.isBone) clnBones.push(c); });
    clone.traverse(n => {
      if (n.isSkinnedMesh && n.skeleton) {
        const newBones = n.skeleton.bones.map(b => {
          const idx = srcBones.indexOf(b);
          return idx !== -1 ? clnBones[idx] : b;
        });
        n.skeleton = new THREE.Skeleton(newBones, n.skeleton.boneInverses);
        n.bind(n.skeleton, n.bindMatrix);
      }
    });
    return clone;
  }
  function loadInspectorModel() {
    if (!inspectorScene) return;
    if (inspectorModelRoot) {
      inspectorScene.remove(inspectorModelRoot);
      inspectorModelRoot = null;
    }
    inspectorModelRoot = new THREE.Group();
    const btnBody = document.getElementById("preset-body");
    const btnFace = document.getElementById("preset-face");
    const btnWeapon = document.getElementById("preset-weapon");
    const btnReset = document.getElementById("preset-reset");
    if (inspectorCurrentTab === "CHAR") {
      if (inspectorPedestal) {
        inspectorPedestal.scale.set(1.0, 1.0, 1.0);
        inspectorPedestal.position.y = -0.075;
      }
      if (inspectorRing) {
        inspectorRing.scale.set(1.0, 1.0, 1.0);
      }
      inspectorTarget.set(0, 0.88, 0);
      inspectorCamDist = 2.8;
      inspectorRotX = 0.14;
      inspectorRotY = 0.35;
      if (inspectorCamera) {
        inspectorCamera.fov = 45.0;
        inspectorCamera.updateProjectionMatrix();
      }
      if (world && world.activeCharacter === "MIYU") {
        if (!world.miyuLoaded && typeof world.loadMiyuModelAsync === "function") {
          world.loadMiyuModelAsync(() => {
            loadInspectorModel();
          });
          return;
        }
        if (world.miyuAvatarGroup) {
          const clone = cloneSkinnedHierarchy(world.miyuAvatarGroup);
          clone.visible = true;
          clone.position.set(0, 0, 0);
          clone.rotation.set(0, Math.PI, 0);
          inspectorModelRoot.add(clone);
        }
      } else {
        if (world && world.minatoAvatarGroup) {
          const clone = world.minatoAvatarGroup.clone(true);
          clone.visible = true;
          clone.position.set(0, 0, 0);
          clone.rotation.set(0, 0, 0);
          inspectorModelRoot.add(clone);
        }
      }
      if (btnBody) btnBody.innerHTML = "👤 SELURUH TUBUH";
      if (btnFace) btnFace.innerHTML = "👤 WAJAH / KEPALA";
      if (btnWeapon) btnWeapon.innerHTML = "🎯 SENJATA / DETAIL";
      if (btnReset) btnReset.innerHTML = "🔄 RESET SUDUT";
    } else {
      if (inspectorPedestal) {
        inspectorPedestal.scale.set(2.4, 1.0, 2.4);
        inspectorPedestal.position.y = -0.075;
      }
      if (inspectorRing) {
        inspectorRing.scale.set(2.4, 2.4, 2.4);
      }
      inspectorTarget.set(0, 0.65, 0);
      inspectorCamDist = 5.4;
      inspectorRotX = 0.16;
      inspectorRotY = 0.45;
      if (inspectorCamera) {
        inspectorCamera.fov = 40.0;
        inspectorCamera.updateProjectionMatrix();
      }
      if (carModel && carModel.chassisGroup) {
        const carClone = carModel.chassisGroup.clone(true);
        carClone.position.set(0, 0, 0);
        carClone.rotation.set(0, 0, 0);
        carClone.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(carClone);
        const bottomOffset = -box.min.y;
        carClone.position.set(0, bottomOffset, 0);
        inspectorModelRoot.add(carClone);
      }
      if (btnBody) btnBody.innerHTML = "🏎️ SELURUH MOBIL";
      if (btnFace) btnFace.innerHTML = "💺 KOKPIT / INTERIOR";
      if (btnWeapon) btnWeapon.innerHTML = "🛞 VELG & AERODINAMIKA";
      if (btnReset) btnReset.innerHTML = "🔄 RESET SUDUT";
    }
    inspectorScene.add(inspectorModelRoot);
    window.inspectorModelRoot = inspectorModelRoot;
    window.inspectorRing = inspectorRing;
    window.inspectorPedestal = inspectorPedestal;
  }
  function setupInspectorControls(mount) {
    const onMouseDown = (e) => {
      if (e.button === 0) isInspectorDragging = true;
      else if (e.button === 2) isInspectorPanning = true;
      inspectStartX = e.clientX;
      inspectStartY = e.clientY;
    };
    const onMouseMove = (e) => {
      const dx = e.clientX - inspectStartX;
      const dy = e.clientY - inspectStartY;
      inspectStartX = e.clientX;
      inspectStartY = e.clientY;
      if (isInspectorDragging) {
        inspectorRotY -= dx * 0.008;
        inspectorRotX = Math.max(-1.1, Math.min(1.1, inspectorRotX + dy * 0.008));
      } else if (isInspectorPanning) {
        const panSpeed = inspectorCamDist * 0.0015;
        inspectorTarget.x -= dx * panSpeed * Math.cos(inspectorRotY);
        inspectorTarget.z += dx * panSpeed * Math.sin(inspectorRotY);
        inspectorTarget.y += dy * panSpeed;
      }
    };
    const onMouseUp = () => {
      isInspectorDragging = false;
      isInspectorPanning = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      const zoomSpeed = inspectorCamDist * 0.0018;
      inspectorCamDist = Math.max(0.35, Math.min(8.0, inspectorCamDist + e.deltaY * zoomSpeed));
    };
    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: false });
    mount.addEventListener("contextmenu", (e) => e.preventDefault());
    const btnBody = document.getElementById("preset-body");
    const btnFace = document.getElementById("preset-face");
    const btnWeapon = document.getElementById("preset-weapon");
    const btnReset = document.getElementById("preset-reset");
    const clearPresetActive = () => {
      [btnBody, btnFace, btnWeapon, btnReset].forEach(b => { if (b) b.classList.remove("active"); });
    };
    if (btnBody) {
      btnBody.onclick = () => {
        clearPresetActive();
        btnBody.classList.add("active");
        if (inspectorCurrentTab === "CAR") {
          inspectorCamDist = 5.4;
          inspectorTarget.set(0, 0.65, 0);
          inspectorRotX = 0.16;
          inspectorRotY = 0.45;
        } else {
          inspectorCamDist = 2.6;
          inspectorTarget.set(0, 0.85, 0);
          inspectorRotX = 0.14;
          inspectorRotY = 0.35;
        }
      };
    }
    if (btnFace) {
      btnFace.onclick = () => {
        clearPresetActive();
        btnFace.classList.add("active");
        if (inspectorCurrentTab === "CAR") {
          inspectorCamDist = 2.4;
          inspectorTarget.set(-0.35, 0.72, 0.0);
          inspectorRotX = 0.22;
          inspectorRotY = 0.65;
        } else {
          inspectorCamDist = 1.35;
          inspectorTarget.set(0, 1.38, 0);
          inspectorRotX = 0.08;
          inspectorRotY = 0.15;
        }
      };
    }
    if (btnWeapon) {
      btnWeapon.onclick = () => {
        clearPresetActive();
        btnWeapon.classList.add("active");
        if (inspectorCurrentTab === "CAR") {
          inspectorCamDist = 2.6;
          inspectorTarget.set(0.9, 0.42, 1.2);
          inspectorRotX = 0.14;
          inspectorRotY = 0.75;
        } else {
          inspectorCamDist = 1.45;
          inspectorTarget.set(-0.15, 0.85, 0.0);
          inspectorRotX = 0.12;
          inspectorRotY = 0.45;
        }
      };
    }
    if (btnReset) {
      btnReset.onclick = () => {
        clearPresetActive();
        btnReset.classList.add("active");
        if (inspectorCurrentTab === "CAR") {
          inspectorCamDist = 5.4;
          inspectorTarget.set(0, 0.65, 0);
          inspectorRotX = 0.16;
          inspectorRotY = 0.45;
        } else {
          inspectorCamDist = 2.8;
          inspectorTarget.set(0, 0.88, 0);
          inspectorRotX = 0.14;
          inspectorRotY = 0.35;
        }
      };
    }
    const tabChar = document.getElementById("inspect-tab-char");
    const tabCar = document.getElementById("inspect-tab-car");
    if (tabChar) {
      tabChar.onclick = () => {
        inspectorCurrentTab = "CHAR";
        tabChar.classList.add("active");
        if (tabCar) tabCar.classList.remove("active");
        loadInspectorModel();
        updateInspectorLoreCard();
      };
    }
    if (tabCar) {
      tabCar.onclick = () => {
        inspectorCurrentTab = "CAR";
        tabCar.classList.add("active");
        if (tabChar) tabChar.classList.remove("active");
        loadInspectorModel();
        updateInspectorLoreCard();
      };
    }
  }
  function updateInspectorLoreCard() {
    const badge = document.getElementById("inspect-card-badge");
    const name = document.getElementById("inspect-card-name");
    const role = document.getElementById("inspect-card-role");
    const desc = document.getElementById("inspect-card-desc");
    const gearDesc = document.getElementById("inspect-gear-desc");
    if (inspectorCurrentTab === "CHAR") {
      if (world && world.activeCharacter === "MIYU") {
        if (badge) badge.textContent = "SRT SPECIAL ACADEMY // RABBIT 4";
        if (name) name.textContent = "Kasumizawa Miyu";
        if (role) role.textContent = "Sniper • RABBIT Squad (Kivotos)";
        if (desc) desc.textContent = "Siswi Akademi Khusus SRT divisi RABBIT Squad. Sangat pemalu dan pendiam, namun memiliki insting observasi alami dan kemampuan kamuflase taktis yang luar biasa. Selalu siap melindungi tim dengan tembakan presisi mematikan.";
        if (gearDesc) gearDesc.innerHTML = "🔫 <strong>Mosin-Nagant Bolt-Action Sniper</strong>: Dilengkapi peredam suara integral SRT dan scope optik pembesaran tinggi untuk eliminasi target jarak jauh tanpa terdeteksi • <strong>Kotak Kardus Taktis</strong> untuk kamuflase.";
        updateStatBars("98%", "EX", "96%", "SSS", "88%", "S+", "92%", "SS");
      } else {
        if (badge) badge.textContent = "KONOHAGAKURE // HOKAGE";
        if (name) name.textContent = "Minato Namikaze";
        if (role) role.textContent = "Yondaime Hokage // Yellow Flash (Kiiroi Senkō)";
        if (desc) desc.textContent = "Hokage Keempat dari Desa Konoha. Salah satu shinobi terhebat dalam sejarah ninja, pencipta Rasengan dan penyempurna Hiraishin no Jutsu (Flying Thunder God) yang memungkinkan teleportasi instan ke segel formula kunai.";
        if (gearDesc) gearDesc.innerHTML = "⚡ <strong>Flying Thunder God Kunai</strong>: Kunai bermata tiga dengan formula segel teleportasi instan • <strong>Hokage Flame Haori Cloak</strong> • <strong>Rasengan</strong>.";
        updateStatBars("99%", "EX", "95%", "SSS", "98%", "EX", "96%", "SSS");
      }
    } else {
      const curType = (carModel && carModel.currentCarType) || "LAMBORGHINI";
      const meta = (carModel && carModel.CAR_METADATA && carModel.CAR_METADATA[curType]) || {
        name: "Lamborghini Centenario",
        engine: "6.5L Naturally Aspirated V12 (770 HP)",
        maxSpeed: 70.0
      };
      if (badge) badge.textContent = "SUPERCAR SPECIFICATION // SHOWROOM";
      if (name) name.textContent = meta.name;
      if (role) role.textContent = meta.engine;
      if (desc) desc.textContent = `Hypercar performa tinggi dengan sasis serat karbon monokok, aerodinamika aktif, dan sistem penggerak all-wheel drive yang dirancang untuk kecepatan puncak di Tokyo Shuto Expressway.`;
      if (gearDesc) gearDesc.innerHTML = `🏎️ <strong>Mesin</strong>: ${meta.engine} • <strong>Pintu</strong>: Scissor Doors • <strong>Top Speed</strong>: ${(meta.maxSpeed * 5.8).toFixed(0)} km/h • <strong>Sistem Rem</strong>: Carbon Ceramic.`;
      updateStatBars("96%", "SSS", "92%", "SS", "95%", "SSS", "94%", "SS");
    }
  }
  function updateStatBars(w1, s1, w2, s2, w3, s3, w4, s4) {
    const sRange = document.getElementById("stat-range");
    const sRangeV = document.getElementById("stat-range-val");
    const sStealth = document.getElementById("stat-stealth");
    const sStealthV = document.getElementById("stat-stealth-val");
    const sSpd = document.getElementById("stat-spd");
    const sSpdV = document.getElementById("stat-spd-val");
    const sAtk = document.getElementById("stat-atk");
    const sAtkV = document.getElementById("stat-atk-val");
    if (sRange) sRange.style.width = w1;
    if (sRangeV) sRangeV.textContent = s1;
    if (sStealth) sStealth.style.width = w2;
    if (sStealthV) sStealthV.textContent = s2;
    if (sSpd) sSpd.style.width = w3;
    if (sSpdV) sSpdV.textContent = s3;
    if (sAtk) sAtk.style.width = w4;
    if (sAtkV) sAtkV.textContent = s4;
  }
  function toggleWalkAndDrive() {
    if (!physics || isCarTransitioning) return;
    if (physics.mode === "VEHICLE") {
      isCarTransitioning = true;
      physics.speed = 0;
      physics.vx = 0;
      physics.vz = 0;
      const carYaw = physics.rotation;
      const cosY = Math.cos(carYaw);
      const sinY = Math.sin(carYaw);
      transitionCamPos.set(
        physics.x - cosY * 3.2 - sinY * 0.3,
        physics.y + 1.45,
        physics.z - sinY * 3.2 + cosY * 0.3
      );
      transitionCamLook.set(physics.x - cosY * 0.4, physics.y + 0.65, physics.z - sinY * 0.4);
      if (carModel && typeof carModel.openDoors === "function") {
        carModel.openDoors(0.70);
      }
      if (audio) audio.playChime();
      setTimeout(() => {
        physics.exitVehicle();
        const startX = physics.x - cosY * 0.45;
        const startZ = physics.z - sinY * 0.45;
        const targetX = physics.x - cosY * 1.5;
        const targetZ = physics.z - sinY * 1.5;
        if (world && world.walkerGroup) {
          world.walkerGroup.visible = true;
          world.walkerGroup.position.set(startX, physics.y, startZ);
          world.walkerGroup.rotation.y = carYaw - Math.PI / 2;
        }
        const animStart = performance.now();
        const animDuration = 480;
        function stepOutLoop(now) {
          const elapsed = now - animStart;
          const progress = Math.min(1.0, elapsed / animDuration);
          const ease = progress * (2 - progress);
          if (world && world.walkerGroup) {
            world.walkerGroup.position.x = startX + (targetX - startX) * ease;
            world.walkerGroup.position.z = startZ + (targetZ - startZ) * ease;
            if (typeof world.animateWalkingLimbs === "function") {
              world.animateWalkingLimbs(0.016, 3.8, true);
            }
          }
          if (progress < 1.0) {
            requestAnimationFrame(stepOutLoop);
          } else {
            physics.walkerX = targetX;
            physics.walkerZ = targetZ;
            if (carModel && typeof carModel.closeDoors === "function") {
              carModel.closeDoors(0.65);
            }
          }
        }
        requestAnimationFrame(stepOutLoop);
      }, 400);
      setTimeout(() => {
        isCarTransitioning = false;
        walkerCameraYaw = physics.rotation;
        cameraPitchOffset = 0;
        checkSkywayAndGateProximity();
        updateWalkBtnUI();
        saveCheckpointState();
      }, 1300);
    } else {
      const distToCar = Math.hypot(physics.walkerX - physics.x, physics.walkerZ - physics.z);
      if (distToCar > 8.5) {
        showGameToast("🚶 Terlalu jauh dari mobil! Dekati mobil terlebih dahulu.", 2200);
        return;
      }
      isCarTransitioning = true;
      const carYaw = physics.rotation;
      const cosY = Math.cos(carYaw);
      const sinY = Math.sin(carYaw);
      transitionCamPos.set(
        physics.x - cosY * 3.2 - sinY * 0.3,
        physics.y + 1.4,
        physics.z - sinY * 3.2 + cosY * 0.3
      );
      transitionCamLook.set(physics.x - cosY * 0.4, physics.y + 0.65, physics.z - sinY * 0.4);
      if (carModel && typeof carModel.openDoors === "function") {
        carModel.openDoors(0.70);
      }
      if (audio) audio.playChime();
      const startX = physics.walkerX;
      const startZ = physics.walkerZ;
      const targetX = physics.x - cosY * 0.45;
      const targetZ = physics.z - sinY * 0.45;
      const animStart = performance.now();
      const animDuration = 520;
      function stepInLoop(now) {
        const elapsed = now - animStart;
        const progress = Math.min(1.0, elapsed / animDuration);
        const ease = progress * progress * (3 - 2 * progress);
        if (world && world.walkerGroup) {
          world.walkerGroup.position.x = startX + (targetX - startX) * ease;
          world.walkerGroup.position.z = startZ + (targetZ - startZ) * ease;
          world.walkerGroup.rotation.y = carYaw + Math.PI / 2;
          if (typeof world.animateWalkingLimbs === "function") {
            world.animateWalkingLimbs(0.016, 4.0, true);
          }
        }
        if (progress < 1.0) {
          requestAnimationFrame(stepInLoop);
        } else {
          physics.enterVehicle();
          if (world && world.walkerGroup) {
            world.walkerGroup.visible = false;
          }
          if (carModel && typeof carModel.closeDoors === "function") {
            carModel.closeDoors(0.65);
          }
        }
      }
      requestAnimationFrame(stepInLoop);
      setTimeout(() => {
        isCarTransitioning = false;
        checkSkywayAndGateProximity();
        updateWalkBtnUI();
      }, 1300);
    }
  }
  function updateWalkBtnUI() {
    const isWalking = Boolean(physics && physics.mode === "WALKING");
    if (UI.walkBtn) {
      UI.walkBtn.textContent = isWalking ? "🚗 NAIK" : "🚶 TURUN";
    }
    if (UI.switchCharBtn) {
      UI.switchCharBtn.style.display = isWalking ? "inline-flex" : "none";
    }
    if (UI.charSkillBtn) {
      UI.charSkillBtn.style.display = isWalking ? "inline-flex" : "none";
    }
    if (UI.changeCarBtn) {
      UI.changeCarBtn.style.display = isWalking ? "none" : "inline-flex";
    }
  }
  window.updateWalkBtnUI = updateWalkBtnUI;
  function checkSkywayAndGateProximity() {
    if (!physics) return;
    if (UI.walkPrompt) {
      if (physics.mode === "VEHICLE") {
        const isNearSkywayEntrance = (physics.z >= 440 && physics.z <= 485 && Math.abs(physics.x) <= 16);
        const isLowSpeed = Math.abs(physics.speed) < 5.0;
        if (isNearSkywayEntrance) {
          if (UI.walkPromptText) UI.walkPromptText.textContent = "JALAN MENUJU PINTU CAHAYA (Tekan F untuk Keluar)";
          UI.walkPrompt.classList.add("show");
        } else if (isLowSpeed) {
          if (UI.walkPromptText) UI.walkPromptText.textContent = "KELUAR MOBIL & JALAN KAKI (Tekan F)";
          UI.walkPrompt.classList.add("show");
        } else {
          UI.walkPrompt.classList.remove("show");
        }
      } else {
        const distToCar = Math.hypot(physics.walkerX - physics.x, physics.walkerZ - physics.z);
        if (distToCar <= 8.5) {
          const carName = (carModel && carModel.CAR_METADATA[carModel.currentCarType])
            ? carModel.CAR_METADATA[carModel.currentCarType].name.split(" ")[0].toUpperCase()
            : "MOBIL";
          if (UI.walkPromptText) UI.walkPromptText.textContent = `MASUK KEMBALI KE ${carName} (Tekan F)`;
          UI.walkPrompt.classList.add("show");
        } else {
          UI.walkPrompt.classList.remove("show");
        }
      }
    }
    if (physics.mode === "WALKING") {
      const distToGate = Math.hypot(physics.walkerX - 0, physics.walkerZ - 975);
      if (distToGate <= 12.5 && !isGateModalOpen && currentQuizIndex < CELESTIAL_QUIZ.length) {
        openCelestialGateModal();
      }
    }
  }
  function setupSidebarHub() {
    if (!UI.hubModal) return;
    if (UI.openHubBtn) {
      UI.openHubBtn.addEventListener("click", () => openSidebarHub("options"));
    }
    if (UI.closeHubBtn) {
      UI.closeHubBtn.addEventListener("click", () => closeSidebarHub());
    }
    document.querySelectorAll(".hub-tab-btn[data-tab]").forEach(tabBtn => {
      tabBtn.addEventListener("click", () => {
        const targetTab = tabBtn.getAttribute("data-tab");
        switchHubTab(targetTab);
        if (audio) audio.playChime();
      });
    });
    if (UI.optAudioBtn) {
      UI.optAudioBtn.addEventListener("click", () => {
        if (!audio.initialized) audio.init();
        const enabled = audio.toggle();
        UI.optAudioBtn.textContent = enabled ? "🔊" : "🔇";
      });
    }
    if (UI.optQualityBtn) {
      UI.optQualityBtn.addEventListener("click", () => {
        currentQualityModeIndex = (currentQualityModeIndex + 1) % QUALITY_CYCLE.length;
        const nextMode = QUALITY_CYCLE[currentQualityModeIndex];
        applyQualityTier(nextMode, false);
        const panel = document.getElementById("graphics-settings-panel");
        if (panel) {
          panel.classList.toggle("open");
        }
        if (audio) audio.playChime();
      });
    }
    if (UI.optFpsBtn) {
      UI.optFpsBtn.addEventListener("click", () => {
        isFpsCounterVisible = !isFpsCounterVisible;
        updateFpsUI(currentFps);
        if (audio) audio.playChime();
      });
    }
    if (UI.optCameraBtn) {
      UI.optCameraBtn.addEventListener("click", () => {
        cycleCameraView();
      });
    }
    if (UI.optUnstuckBtn) {
      UI.optUnstuckBtn.addEventListener("click", () => {
        physics.resetPosition(0, -42, 0);
        handleVoidFall();
        closeSidebarHub();
      });
    }
    if (UI.optResetBtn) {
      UI.optResetBtn.addEventListener("click", () => {
        resetVehicle();
        closeSidebarHub();
      });
    }
    if (UI.optModeBtn) {
      UI.optModeBtn.addEventListener("click", () => {
        toggleDriveAndCruise();
      });
    }
    document.querySelectorAll(".hub-weather-item").forEach(item => {
      item.addEventListener("click", () => {
        const weatherKey = item.getAttribute("data-weather");
        if (world && weatherKey) {
          world.applyWeather(weatherKey);
          document.querySelectorAll(".hub-weather-item").forEach(el => el.classList.remove("active"));
          item.classList.add("active");
          if (audio) audio.playChime();
        }
      });
    });
    populateHubProjects();
  }
  function applyQualityTier(targetMode, isAutoTriggered = false) {
    let resolvedTier = targetMode;
    if (targetMode === QUALITY_MODES.AUTO) {
      resolvedTier = activeResolvedQuality || QUALITY_MODES.HIGH;
    } else {
      activeResolvedQuality = targetMode;
    }
    let targetDpr = 1.0;
    if (resolvedTier === QUALITY_MODES.HIGH) {
      targetDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    } else if (resolvedTier === QUALITY_MODES.MEDIUM) {
      targetDpr = Math.min(window.devicePixelRatio || 1, 1.0);
    } else {
      targetDpr = Math.min(window.devicePixelRatio || 1, 0.85);
    }
    if (renderer) {
      renderer.setPixelRatio(targetDpr);
      renderer.shadowMap.enabled = (resolvedTier === QUALITY_MODES.HIGH);
    }
    if (world && typeof world.setQualityTier === "function") {
      world.setQualityTier(resolvedTier, camera);
    }
    if (carModel && typeof carModel.setContactShadow === "function") {
      carModel.setContactShadow(resolvedTier !== QUALITY_MODES.HIGH);
    }
    updateQualityButtonLabel();
    syncGranularButtonsFromTier(resolvedTier);
    if (isAutoTriggered) {
      const toastMsg = (resolvedTier === QUALITY_MODES.MEDIUM)
        ? (window.I18N ? window.I18N.getText("hub.toastQualityAutoDowngrade") : "⚡ Mode Sedang diaktifkan otomatis agar 60 FPS tetap mulus!")
        : (window.I18N ? window.I18N.getText("hub.toastQualityLowDowngrade") : "⚡ Mode Hemat Daya diaktifkan otomatis agar bebas lag!");
      showGameToast(toastMsg, 3500);
    }
  }
  function updateQualityButtonLabel() {
    if (!UI.optQualityBtn) return;
    const currentMode = QUALITY_CYCLE[currentQualityModeIndex];
    const t = (window.I18N && window.I18N.translations && window.I18N.translations[window.I18N.currentLang])
      ? window.I18N.translations[window.I18N.currentLang].hub
      : null;
    let tierLabel = "";
    if (activeResolvedQuality === QUALITY_MODES.HIGH) tierLabel = t ? t.qualityHigh : "Tinggi";
    else if (activeResolvedQuality === QUALITY_MODES.MEDIUM) tierLabel = t ? t.qualityMed : "Sedang";
    else tierLabel = t ? t.qualityLow : "Hemat Daya";
    if (currentMode === QUALITY_MODES.AUTO) {
      const autoText = t ? t.qualityAuto : "Auto (Adaptif)";
      UI.optQualityBtn.textContent = `${autoText} [${tierLabel}]`;
      UI.optQualityBtn.classList.add("quality-auto");
    } else {
      UI.optQualityBtn.textContent = tierLabel;
      UI.optQualityBtn.classList.remove("quality-auto");
    }
  }
  window.updateQualityButtonLabel = updateQualityButtonLabel;
  function updateFpsUI(fps) {
    if (UI.hudFpsBadge) {
      UI.hudFpsBadge.textContent = `${fps} FPS • ${activeResolvedQuality}`;
      UI.hudFpsBadge.className = `hud-fps-badge ${fps < 35 ? "low" : (fps < 50 ? "med" : "high")}`;
      UI.hudFpsBadge.style.display = isFpsCounterVisible ? "inline-flex" : "none";
    }
    if (UI.optFpsBtn) {
      UI.optFpsBtn.textContent = isFpsCounterVisible ? "ON" : "OFF";
      UI.optFpsBtn.classList.toggle("active", isFpsCounterVisible);
    }
  }
  function checkAdaptiveGovernor(fps) {
    const currentMode = QUALITY_CYCLE[currentQualityModeIndex];
    if (currentMode !== QUALITY_MODES.AUTO) return;
    if (fps < LOW_FPS_THRESHOLD) {
      lowFpsStreak++;
      highFpsStreak = 0;
      if (lowFpsStreak >= 2) {
        if (activeResolvedQuality === QUALITY_MODES.HIGH) {
          applyQualityTier(QUALITY_MODES.MEDIUM, true);
        } else if (activeResolvedQuality === QUALITY_MODES.MEDIUM) {
          applyQualityTier(QUALITY_MODES.LOW, true);
        }
        lowFpsStreak = 0;
      }
    } else if (fps >= HIGH_FPS_THRESHOLD) {
      highFpsStreak++;
      lowFpsStreak = 0;
      if (highFpsStreak >= 12 && activeResolvedQuality === QUALITY_MODES.LOW) {
        applyQualityTier(QUALITY_MODES.MEDIUM, false);
        highFpsStreak = 0;
      }
    } else {
      lowFpsStreak = 0;
      highFpsStreak = 0;
    }
  }
  function openSidebarHub(tabName = "options") {
    if (!UI.hubModal) return;
    UI.hubModal.classList.add("open");
    switchHubTab(tabName);
  }
  function closeSidebarHub() {
    if (!UI.hubModal) return;
    UI.hubModal.classList.remove("open");
  }
  function toggleSidebarHub() {
    if (!UI.hubModal) return;
    if (UI.hubModal.classList.contains("open")) {
      closeSidebarHub();
    } else {
      openSidebarHub("options");
    }
  }
  function switchHubTab(tabName) {
    document.querySelectorAll(".hub-tab-btn[data-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });
    document.querySelectorAll(".hub-tab-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === `tab-${tabName}`);
    });
  }
  function populateHubProjects() {
    if (!UI.hubProjectsList) return;
    const projects = window.APP_CONFIG.PROJECTS;
    UI.hubProjectsList.innerHTML = projects.map(p => `
      <div class="hub-project-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.95rem 1.15rem; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; margin-bottom: 0.75rem;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: #${p.color.toString(16).padStart(6, '0')}; letter-spacing: 0.08em; text-transform: uppercase;">${p.district}</div>
          <strong style="font-size: 1.02rem; color: #ffffff; letter-spacing: -0.01em;">${p.title}</strong>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="hub-proj-teleport-btn" data-id="${p.id}" style="padding: 0.45rem 0.85rem; background: var(--neon-amber); color: #000; border: none; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: all 0.2s;">⚡ JELAJAHI</button>
          <button class="hub-proj-detail-btn" data-id="${p.id}" style="padding: 0.45rem 0.85rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #fff; border-radius: 6px; font-size: 0.78rem; cursor: pointer; transition: all 0.2s;">📄 DETAIL</button>
        </div>
      </div>
    `).join("");
    UI.hubProjectsList.querySelectorAll(".hub-proj-teleport-btn").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        closeSidebarHub();
        cruiseToStation(id);
      });
    });
    UI.hubProjectsList.querySelectorAll(".hub-proj-detail-btn").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const p = window.APP_CONFIG.PROJECTS.find(item => item.id === id);
        if (p) {
          closeSidebarHub();
          openFullProjectDrawer(p);
        }
      });
    });
  }
  function handleVoidFall() {
    if (UI.respawnToast) {
      const t = window.I18N ? window.I18N.translations[window.I18N.currentLang] : null;
      UI.respawnToast.textContent = (t && t.hud && t.hud.respawnToast) ? t.hud.respawnToast : "↺ JATUH KE AIR! KEMBALI KE TITIK AWAL";
      UI.respawnToast.classList.add("show");
      setTimeout(() => {
        if (UI.respawnToast) UI.respawnToast.classList.remove("show");
      }, 2600);
    }
    cameraYawOffset = 0;
    cameraPitchOffset = 0;
    dismissCheckpointPill();
  }
  function cycleCameraView() {
    currentCameraIndex = (currentCameraIndex + 1) % CAMERA_MODES.length;
    window._currentCameraMode = CAMERA_MODES[currentCameraIndex];
    updateCameraModeButton();
    if (audio) audio.playChime();
  }
  function updateCameraModeButton() {
    const mode = CAMERA_MODES[currentCameraIndex];
    const t = window.I18N ? window.I18N.translations[window.I18N.currentLang] : null;
    if (UI.cameraBtn) {
      const modeText = (t && t.hud && t.hud.cameraView && t.hud.cameraView[mode]) || `📷 ${mode}`;
      UI.cameraBtn.textContent = modeText;
    }
    if (UI.optCameraBtn) {
      UI.optCameraBtn.textContent = mode;
    }
  }
  function setupEventHandlers() {
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        if (e.code === "Escape") {
          closeCelestialGateModal();
        }
        return;
      }
      if (audio && !audio.initialized) audio.init();
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          input.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          input.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          input.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          input.right = true;
          break;
        case "Space":
          input.space = true;
          e.preventDefault();
          break;
        case "ShiftLeft":
        case "ShiftRight":
          input.shift = true;
          break;
        case "KeyF":
          toggleWalkAndDrive();
          break;
        case "KeyX":
          toggleCharacterModal();
          break;
        case "KeyE":
          triggerCharacterSkill();
          break;
        case "KeyQ":
          toggleSniperAim();
          break;
        case "KeyI":
          toggleRPGInspector();
          break;
        case "KeyV":
          cycleCameraView();
          break;
        case "KeyR":
          resetVehicle();
          break;
        case "KeyH":
          if (audio) audio.playHorn();
          break;
        case "KeyC":
          if (physics && physics.mode === "WALKING") {
            toggleCharacterModal();
          } else {
            toggleGarageModal();
          }
          break;
        case "KeyN":
          cycleWeather();
          break;
        case "KeyM":
          if (radar) radar.toggleFullMap();
          break;
        case "Tab":
          e.preventDefault();
          toggleSidebarHub();
          break;
        case "Enter":
          if (isCheckpointPillVisible && activeStation) {
            openFullProjectDrawer(activeStation);
          }
          break;
        case "Escape":
          if (isRPGInspectorOpen) {
            closeRPGInspectorModal();
          } else if (isCharModalOpen) {
            closeCharacterModal();
          } else if (isGarageModalOpen) {
            closeGarageModal();
          } else if (isGateModalOpen) {
            closeCelestialGateModal();
          } else if (UI.hubModal && UI.hubModal.classList.contains("open")) {
            closeSidebarHub();
          } else if (radar && radar.isMapModalOpen) {
            radar.closeFullMap();
          } else {
            closeFullProjectDrawer();
          }
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        return;
      }
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          input.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          input.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          input.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          input.right = false;
          break;
        case "Space":
          input.space = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          input.shift = false;
          break;
      }
    });
    if (UI.cameraBtn) {
      UI.cameraBtn.addEventListener("click", cycleCameraView);
    }
    if (UI.langBtn) {
      UI.langBtn.addEventListener("click", () => {
        if (window.I18N) {
          window.I18N.cycleLanguage();
          updateCameraModeButton();
        }
      });
    }
    if (UI.mapBtn) {
      UI.mapBtn.addEventListener("click", () => {
        if (radar) radar.toggleFullMap();
      });
    }
    if (UI.walkBtn) {
      UI.walkBtn.addEventListener("click", () => {
        toggleWalkAndDrive();
      });
    }
    if (UI.switchCharBtn) {
      UI.switchCharBtn.addEventListener("click", () => {
        toggleCharacterModal();
      });
    }
    if (UI.charSkillBtn) {
      UI.charSkillBtn.addEventListener("click", () => {
        triggerCharacterSkill();
      });
    }
    if (UI.inspectBtn) {
      UI.inspectBtn.addEventListener("click", () => {
        toggleRPGInspector();
      });
    }
    if (UI.inspectCloseBtn) {
      UI.inspectCloseBtn.addEventListener("click", () => {
        closeRPGInspectorModal();
      });
    }
    if (UI.rpgInspectModal) {
      UI.rpgInspectModal.addEventListener("click", (e) => {
        if (e.target === UI.rpgInspectModal) closeRPGInspectorModal();
      });
    }
    if (UI.changeCarBtn) {
      UI.changeCarBtn.addEventListener("click", () => {
        toggleGarageModal();
      });
    }
    if (UI.garageCloseBtn) {
      UI.garageCloseBtn.addEventListener("click", closeGarageModal);
    }
    if (UI.garageModal) {
      UI.garageModal.addEventListener("click", (e) => {
        if (e.target === UI.garageModal) closeGarageModal();
      });
    }
    document.querySelectorAll(".garage-select-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const carType = btn.getAttribute("data-car");
        if (carType) {
          changeCar(carType);
          saveCheckpointState();
          setTimeout(closeGarageModal, 320);
        }
      });
    });
    document.querySelectorAll(".vehicle-inspect-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const carType = btn.getAttribute("data-car");
        if (carType) {
          if (carModel && carModel.currentCarType !== carType) {
            changeCar(carType);
          }
          closeGarageModal();
          openRPGInspectorModal();
          inspectorCurrentTab = "CAR";
          loadInspectorModel();
          updateInspectorLoreCard();
        }
      });
    });
    document.querySelectorAll(".nav-jump").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const stationId = link.getAttribute("data-station");
        cruiseToStation(stationId);
      });
    });
    if (UI.pillOpenBtn) {
      UI.pillOpenBtn.addEventListener("click", () => {
        if (activeStation) openFullProjectDrawer(activeStation);
      });
    }
    if (UI.pillCloseBtn) {
      UI.pillCloseBtn.addEventListener("click", () => {
        dismissCheckpointPill();
      });
    }
    if (UI.drawerCloseBtn) {
      UI.drawerCloseBtn.addEventListener("click", closeFullProjectDrawer);
    }
    window.addEventListener("blur", () => {
      input.forward = false;
      input.backward = false;
      input.left = false;
      input.right = false;
      input.space = false;
      input.shift = false;
    });
  }
  let cameraZoomMultiplier = 1.0;
  function setupCameraOrbitControls() {
    const canvas = renderer.domElement;
    canvas.addEventListener("wheel", (e) => {
      if (isRPGInspectorOpen || isGarageModalOpen || isGateModalOpen) return;
      e.preventDefault();
      if (physics && physics.mode === "WALKING" && world && world.activeCharacter === "MIYU" && world.isAiming) {
        if (e.deltaY < 0) {
          setSniperZoom(sniperZoomIndex + 1);
        } else if (e.deltaY > 0) {
          setSniperZoom(sniperZoomIndex - 1);
        }
        return;
      }
      const zoomDelta = e.deltaY * 0.0012;
      cameraZoomMultiplier = Math.max(0.38, Math.min(2.4, cameraZoomMultiplier + zoomDelta));
    }, { passive: false });
    canvas.addEventListener("contextmenu", (e) => {
      if (physics && physics.mode === "WALKING" && world && world.activeCharacter === "MIYU") {
        e.preventDefault();
        toggleSniperAim();
      }
    });
    canvas.addEventListener("click", (e) => {
      if (physics && physics.mode === "WALKING" && world && world.activeCharacter === "MIYU" && world.isAiming) {
        triggerCharacterSkill();
      }
    });
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        isCameraOrbiting = true;
        orbitStartX = e.clientX;
        orbitStartY = e.clientY;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!isCameraOrbiting) return;
      const dx = e.clientX - orbitStartX;
      const dy = e.clientY - orbitStartY;
      orbitStartX = e.clientX;
      orbitStartY = e.clientY;
      const sens = (world && world.isAiming) ? Math.min(1.0, camera.fov / 60.0) : 1.0;
      if (physics && physics.mode === "WALKING") {
        walkerCameraYaw -= dx * 0.0055 * sens;
        cameraPitchOffset = Math.max(-0.45, Math.min(0.55, cameraPitchOffset + dy * 0.004 * sens));
      } else {
        cameraYawOffset -= dx * 0.006 * sens;
        cameraPitchOffset = Math.max(-1.35, Math.min(0.65, cameraPitchOffset + dy * 0.0045 * sens));
      }
    });
    window.addEventListener("mouseup", () => {
      isCameraOrbiting = false;
    });
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        isCameraOrbiting = true;
        orbitStartX = e.touches[0].clientX;
        orbitStartY = e.touches[0].clientY;
      }
    });
    canvas.addEventListener("touchmove", (e) => {
      if (!isCameraOrbiting || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - orbitStartX;
      const dy = e.touches[0].clientY - orbitStartY;
      orbitStartX = e.touches[0].clientX;
      orbitStartY = e.touches[0].clientY;
      const sens = (world && world.isAiming) ? Math.min(1.0, camera.fov / 60.0) : 1.0;
      if (physics && physics.mode === "WALKING") {
        walkerCameraYaw -= dx * 0.0065 * sens;
        cameraPitchOffset = Math.max(-0.45, Math.min(0.55, cameraPitchOffset + dy * 0.0045 * sens));
      } else {
        cameraYawOffset -= dx * 0.007 * sens;
        cameraPitchOffset = Math.max(-1.35, Math.min(0.65, cameraPitchOffset + dy * 0.0055 * sens));
      }
    }, { passive: true });
    canvas.addEventListener("touchend", () => {
      isCameraOrbiting = false;
    });
  }
  function setupTouchControls() {
    const bindTouch = (id, onActive, onInactive) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => { e.preventDefault(); if (audio && !audio.initialized) audio.init(); onActive(); };
      const end = (e) => { e.preventDefault(); onInactive(); };
      el.addEventListener("touchstart", start);
      el.addEventListener("touchend", end);
      el.addEventListener("mousedown", start);
      el.addEventListener("mouseup", end);
    };
    bindTouch("touch-gas", () => input.forward = true, () => input.forward = false);
    bindTouch("touch-brake", () => input.backward = true, () => input.backward = false);
    bindTouch("touch-left", () => input.left = true, () => input.left = false);
    bindTouch("touch-right", () => input.right = true, () => input.right = false);
    bindTouch("touch-drift", () => input.space = true, () => input.space = false);
    const hornBtn = document.getElementById("touch-horn");
    if (hornBtn) hornBtn.addEventListener("click", () => { if (audio) audio.playHorn(); });
  }
  function cycleWeather() {
    if (!world) return;
    const nextPreset = world.cycleWeather();
    if (audio) audio.playChime();
  }
  function resetVehicle() {
    physics.resetPosition(0, -42, 0);
    isCinematic = false;
    cinematicTarget = null;
    cameraYawOffset = 0;
    cameraPitchOffset = 0;
    dismissCheckpointPill();
    closeFullProjectDrawer();
    if (UI.optModeBtn) {
      UI.optModeBtn.textContent = "🎮 Manual";
      UI.optModeBtn.classList.remove("cruise-active");
    }
    if (audio) audio.playHit(0.5);
  }
  function toggleDriveAndCruise() {
    if (isCinematic) {
      isCinematic = false;
      cinematicTarget = null;
      if (UI.optModeBtn) {
        UI.optModeBtn.textContent = "🎮 Manual";
        UI.optModeBtn.classList.remove("cruise-active");
      }
    } else {
      const projects = window.APP_CONFIG.PROJECTS;
      const target = projects[Math.floor(Math.random() * projects.length)];
      cruiseToStation(target.id);
    }
  }
  function cruiseToStation(stationId) {
    const station = window.APP_CONFIG.PROJECTS.find(p => p.id === stationId);
    if (!station) return;
    isCinematic = true;
    cinematicTarget = station;
    cameraYawOffset = 0;
    cameraPitchOffset = 0;
    if (UI.optModeBtn) {
      UI.optModeBtn.textContent = "✨ Sinematik";
      UI.optModeBtn.classList.add("cruise-active");
    }
    showCheckpointPill(station);
    if (audio) audio.playChime();
  }
  function checkStationProximity() {
    const px = physics.x;
    const pz = physics.z;
    let nearest = null;
    let minDistance = Infinity;
    const projects = window.APP_CONFIG.PROJECTS;
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const dist = Math.sqrt((p.pos.x - px) ** 2 + (p.pos.z - pz) ** 2);
      if (dist < p.radius && dist < minDistance) {
        nearest = p;
        minDistance = dist;
      }
    }
    if (nearest !== activeStation) {
      activeStation = nearest;
      if (nearest) {
        showCheckpointPill(nearest);
        if (audio) audio.playChime();
      } else {
        dismissCheckpointPill();
      }
    }
  }
  function showCheckpointPill(project) {
    if (!UI.checkpointPill || !project) return;
    const localized = window.I18N ? window.I18N.getProject(project.id) : project;
    window._activeStationId = project.id;
    UI.pillTitle.textContent = localized.title;
    if (UI.pillDistrict) UI.pillDistrict.textContent = localized.district;
    if (UI.pillCategory) UI.pillCategory.textContent = localized.category;
    UI.checkpointPill.classList.add("show");
    isCheckpointPillVisible = true;
  }
  function dismissCheckpointPill() {
    if (UI.checkpointPill) {
      UI.checkpointPill.classList.remove("show");
      isCheckpointPillVisible = false;
    }
  }
  function openFullProjectDrawer(project) {
    if (!UI.drawer || !project) return;
    const localized = window.I18N ? window.I18N.getProject(project.id) : project;
    const t = window.I18N ? window.I18N.translations[window.I18N.currentLang] : null;
    const hlTitle = t ? t.drawer.highlightsTitle : "KEY ENGINEERING HIGHLIGHTS";
    const btnText = localized.github.startsWith("mailto")
      ? (t ? t.drawer.emailBtn : "KIRIM EMAIL LANGSUNG →")
      : (t ? t.drawer.repoBtn : "LIHAT REPO / KODE →");
    UI.drawerTitle.textContent = localized.title;
    if (UI.drawerDistrict) UI.drawerDistrict.textContent = localized.district;
    if (UI.drawerCategory) UI.drawerCategory.textContent = localized.category.toUpperCase();
    UI.drawerDesc.innerHTML = `
      <div style="font-size: 1.18rem; color: #ffffff; line-height: 1.6; margin-bottom: 1.2rem; font-weight: 600;">
        ${localized.tagline}
      </div>
      <p style="color: #94a3b8; line-height: 1.75; margin-bottom: 1.6rem; font-size: 0.95rem;">
        ${localized.summary}
      </p>
      <div class="drawer-panel">
        <div class="drawer-panel-title">${hlTitle}</div>
        <ul class="drawer-features-list">
          ${localized.features.map(f => `<li><span>✦</span> ${f}</li>`).join("")}
        </ul>
      </div>
    `;
    UI.drawerTags.innerHTML = localized.stack.map(s => `<span class="drawer-tag">${s}</span>`).join("");
    UI.drawerLink.href = localized.github;
    UI.drawerLink.textContent = btnText;
    UI.drawer.classList.add("open");
  }
  function closeFullProjectDrawer() {
    if (UI.drawer) UI.drawer.classList.remove("open");
  }
  function updateCamera(dt) {
    if (isCarTransitioning) {
      camera.position.lerp(transitionCamPos, 8.5 * dt);
      currentCamLook.lerp(transitionCamLook, 9.5 * dt);
      camera.lookAt(currentCamLook);
      return;
    }
    if (skyAscensionTimer > 0) {
      skyAscensionTimer -= dt;
      if (skyAscensionTimer <= 0) {
        isTrackingSkyAscension = false;
      }
      const camTarget = new THREE.Vector3(0, 34.5, 950.0);
      camera.position.lerp(camTarget, 4.5 * dt);
      let targetLook = new THREE.Vector3(0, 78.0, 965.0);
      if (window.activeSkyAscendingMesh && window.activeSkyAscendingMesh.position) {
        targetLook = window.activeSkyAscendingMesh.position.clone();
      }
      currentCamLook.lerp(targetLook, 6.5 * dt);
      camera.lookAt(currentCamLook);
    } else if (isCinematic && cinematicTarget) {
      const targetPos = new THREE.Vector3(
        cinematicTarget.pos.x + 14,
        8.5,
        cinematicTarget.pos.z + 18
      );
      const lookPos = new THREE.Vector3(
        cinematicTarget.pos.x,
        3.0,
        cinematicTarget.pos.z
      );
      camera.position.lerp(targetPos, 4.0 * dt);
      currentCamLook.lerp(lookPos, 4.0 * dt);
      camera.lookAt(currentCamLook);
    } else if (physics && physics.mode === "WALKING") {
      const isAiming = Boolean(world && world.isAiming && world.activeCharacter === "MIYU");
      if (isAiming) {
        const targetFOV = (sniperZoomIndex === 0) ? 22.0 : ((sniperZoomIndex === 1) ? 12.0 : 7.5);
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, Math.min(1.0, 16.0 * dt));
        camera.updateProjectionMatrix();
        const eyeHeight = 1.38;
        const desiredX = physics.walkerX + Math.sin(walkerCameraYaw) * 0.12;
        const desiredZ = physics.walkerZ + Math.cos(walkerCameraYaw) * 0.12;
        const desiredY = physics.walkerY + eyeHeight;
        camera.position.lerp(new THREE.Vector3(desiredX, desiredY, desiredZ), Math.min(1.0, 18.0 * dt));
        const lookPitchY = -cameraPitchOffset * 85.0;
        const lookTarget = new THREE.Vector3(
          physics.walkerX + Math.sin(walkerCameraYaw) * 250.0,
          physics.walkerY + eyeHeight + lookPitchY,
          physics.walkerZ + Math.cos(walkerCameraYaw) * 250.0
        );
        currentCamLook.lerp(lookTarget, Math.min(1.0, 22.0 * dt));
        camera.lookAt(currentCamLook);
        if (typeof sniperRangeTimer === "undefined") window.sniperRangeTimer = 0;
        window.sniperRangeTimer += dt;
        if (window.sniperRangeTimer >= 0.1) {
          window.sniperRangeTimer = 0;
          const rangeEl = document.getElementById("scope-range-val");
          const legacyDistEl = document.getElementById("legacy-reticle-dist");
          if (rangeEl || legacyDistEl) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(world.scene.children.filter(o => o !== world.walkerGroup && o.isMesh), true);
            const distM = (intersects && intersects.length > 0) ? intersects[0].distance : 138.4;
            const distStr = `${distM.toFixed(1)} M`;
            if (rangeEl) rangeEl.textContent = distStr;
            if (legacyDistEl) legacyDistEl.textContent = `DIST: ${distStr}`;
          }
        }
      } else {
        if (camera.fov !== 60.0) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, 60.0, Math.min(1.0, 14.0 * dt));
          if (Math.abs(camera.fov - 60.0) < 0.2) camera.fov = 60.0;
          camera.updateProjectionMatrix();
        }
        const baseDist = 5.8 * cameraZoomMultiplier;
        const desiredX = physics.walkerX - Math.sin(walkerCameraYaw) * baseDist;
        const desiredZ = physics.walkerZ - Math.cos(walkerCameraYaw) * baseDist;
        const desiredY = Math.max(physics.walkerY + 0.9, physics.walkerY + 2.2 * cameraZoomMultiplier + cameraPitchOffset * 2.8);
        const targetPos = new THREE.Vector3(desiredX, desiredY, desiredZ);
        camera.position.lerp(targetPos, Math.min(1.0, 10.0 * dt));
        const lookPitchY = -cameraPitchOffset * 16.0;
        const lookTarget = new THREE.Vector3(
          physics.walkerX,
          physics.walkerY + 1.45 + lookPitchY,
          physics.walkerZ
        );
        currentCamLook.lerp(lookTarget, Math.min(1.0, 14.0 * dt));
        camera.lookAt(currentCamLook);
      }
    } else {
      const mode = CAMERA_MODES[currentCameraIndex];
      if (mode === "HOOD") {
        const carYaw = physics.rotation;
        const hoodX = physics.x + Math.sin(carYaw) * 0.95;
        const hoodZ = physics.z + Math.cos(carYaw) * 0.95;
        const hoodY = physics.y + 0.72;
        camera.position.set(hoodX, hoodY, hoodZ);
        const lookPitchY = -cameraPitchOffset * 18.0;
        const lookDist = 32.0;
        const forwardTarget = new THREE.Vector3(
          physics.x + Math.sin(carYaw) * lookDist,
          physics.y + 0.65 + lookPitchY,
          physics.z + Math.cos(carYaw) * lookDist
        );
        currentCamLook.lerp(forwardTarget, 16.0 * dt);
        camera.lookAt(currentCamLook);
      } else if (mode === "TOPDOWN") {
        const topX = physics.x;
        const topZ = physics.z - 12.0;
        const topY = physics.y + 28.0;
        const targetPos = new THREE.Vector3(topX, topY, topZ);
        camera.position.lerp(targetPos, 6.0 * dt);
        const centerLook = new THREE.Vector3(physics.x, physics.y, physics.z);
        currentCamLook.lerp(centerLook, 7.5 * dt);
        camera.lookAt(currentCamLook);
      } else {
        const carYaw = physics.rotation + cameraYawOffset;
        const carDist = 7.8 * cameraZoomMultiplier;
        const desiredX = physics.x - Math.sin(carYaw) * carDist;
        const desiredZ = physics.z - Math.cos(carYaw) * carDist;
        const desiredY = Math.max(physics.y + 0.8, physics.y + 2.5 * cameraZoomMultiplier + cameraPitchOffset * 3.2);
        const targetPos = new THREE.Vector3(desiredX, desiredY, desiredZ);
        const posLerp = 1.0 - Math.exp(-7.0 * dt);
        camera.position.lerp(targetPos, Math.min(Math.max(posLerp, 0), 1));
        const lookPitchY = -cameraPitchOffset * 26.0;
        const lookAhead = new THREE.Vector3(
          physics.x + Math.sin(carYaw) * 2.0,
          physics.y + 0.82 + lookPitchY,
          physics.z + Math.cos(carYaw) * 2.0
        );
        const lookLerp = 1.0 - Math.exp(-8.5 * dt);
        currentCamLook.lerp(lookAhead, Math.min(Math.max(lookLerp, 0), 1));
        camera.lookAt(currentCamLook);
      }
    }
  }
  function handleWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function syncGranularButtonsFromTier(tier) {
    const panel = document.getElementById("graphics-settings-panel");
    if (!panel) return;
    const setBtnActive = (setting, val) => {
      const btns = panel.querySelectorAll(`.g-btn[data-setting="${setting}"]`);
      btns.forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-val") === String(val));
      });
    };
    if (tier === QUALITY_MODES.HIGH) {
      setBtnActive("res", "1.0");
      setBtnActive("shadow", "SOFT");
      setBtnActive("fog", "FAR");
      setBtnActive("lights", "FULL");
      const r = document.getElementById("val-res-scale"); if (r) r.textContent = "1.00x";
      const s = document.getElementById("val-shadows"); if (s) s.textContent = "Lembut (PCF Soft)";
      const f = document.getElementById("val-draw-dist"); if (f) f.textContent = "Jauh (650m)";
      const l = document.getElementById("val-lighting"); if (l) l.textContent = "Penuh (Full)";
    } else if (tier === QUALITY_MODES.MEDIUM) {
      setBtnActive("res", "1.0");
      setBtnActive("shadow", "HARD");
      setBtnActive("fog", "MED");
      setBtnActive("lights", "ECO");
      const r = document.getElementById("val-res-scale"); if (r) r.textContent = "1.00x";
      const s = document.getElementById("val-shadows"); if (s) s.textContent = "Sederhana (Hard)";
      const f = document.getElementById("val-draw-dist"); if (f) f.textContent = "Sedang (350m)";
      const l = document.getElementById("val-lighting"); if (l) l.textContent = "Hemat (Eco)";
    } else {
      setBtnActive("res", "0.75");
      setBtnActive("shadow", "OFF");
      setBtnActive("fog", "NEAR");
      setBtnActive("lights", "OFF");
      const r = document.getElementById("val-res-scale"); if (r) r.textContent = "0.75x";
      const s = document.getElementById("val-shadows"); if (s) s.textContent = "Mati (Off)";
      const f = document.getElementById("val-draw-dist"); if (f) f.textContent = "Dekat (180m)";
      const l = document.getElementById("val-lighting"); if (l) l.textContent = "Mati (Off)";
    }
  }
  function setupGranularGraphicsSettings() {
    const panel = document.getElementById("graphics-settings-panel");
    if (!panel) return;
    panel.querySelectorAll(".g-btn[data-setting]").forEach(btn => {
      btn.addEventListener("click", () => {
        const settingType = btn.getAttribute("data-setting");
        const val = btn.getAttribute("data-val");
        const parent = btn.parentElement;
        if (parent) {
          parent.querySelectorAll(".g-btn").forEach(b => b.classList.remove("active"));
        }
        btn.classList.add("active");
        if (settingType === "res") {
          const ratio = parseFloat(val) || 1.0;
          if (renderer) renderer.setPixelRatio(ratio);
          const lbl = document.getElementById("val-res-scale");
          if (lbl) lbl.textContent = `${ratio.toFixed(2)}x`;
        } else if (settingType === "shadow") {
          const lbl = document.getElementById("val-shadows");
          if (val === "OFF") {
            if (renderer) renderer.shadowMap.enabled = false;
            if (world && world.sunLight) world.sunLight.castShadow = false;
            if (lbl) lbl.textContent = "Mati (Off)";
          } else if (val === "HARD") {
            if (renderer) {
              renderer.shadowMap.enabled = true;
              renderer.shadowMap.type = THREE.BasicShadowMap;
            }
            if (world && world.sunLight) world.sunLight.castShadow = true;
            if (lbl) lbl.textContent = "Sederhana (Hard)";
          } else {
            if (renderer) {
              renderer.shadowMap.enabled = true;
              renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
            if (world && world.sunLight) world.sunLight.castShadow = true;
            if (lbl) lbl.textContent = "Lembut (PCF Soft)";
          }
        } else if (settingType === "fog") {
          const lbl = document.getElementById("val-draw-dist");
          if (val === "NEAR") {
            if (scene && scene.fog) { scene.fog.near = 40; scene.fog.far = 180; }
            if (camera) { camera.far = 250; camera.updateProjectionMatrix(); }
            if (lbl) lbl.textContent = "Dekat (180m)";
          } else if (val === "MED") {
            if (scene && scene.fog) { scene.fog.near = 75; scene.fog.far = 350; }
            if (camera) { camera.far = 500; camera.updateProjectionMatrix(); }
            if (lbl) lbl.textContent = "Sedang (350m)";
          } else {
            if (scene && scene.fog) { scene.fog.near = 120; scene.fog.far = 650; }
            if (camera) { camera.far = 900; camera.updateProjectionMatrix(); }
            if (lbl) lbl.textContent = "Jauh (650m)";
          }
        } else if (settingType === "lights") {
          const lbl = document.getElementById("val-lighting");
          if (val === "OFF") {
            if (carModel && typeof carModel.setUnderglowVisible === "function") carModel.setUnderglowVisible(false);
            if (lbl) lbl.textContent = "Mati (Off)";
          } else if (val === "ECO") {
            if (carModel && typeof carModel.setUnderglowVisible === "function") carModel.setUnderglowVisible(false);
            if (lbl) lbl.textContent = "Hemat (Eco)";
          } else {
            if (carModel && typeof carModel.setUnderglowVisible === "function") carModel.setUnderglowVisible(true);
            if (lbl) lbl.textContent = "Penuh (Full)";
          }
        } else if (settingType === "fps-limit") {
          const lbl = document.getElementById("val-fps-limit");
          if (val === "30") {
            targetFpsLimit = 30;
            if (lbl) lbl.textContent = "30 FPS (Hemat Baterai)";
          } else if (val === "60") {
            targetFpsLimit = 60;
            if (lbl) lbl.textContent = "60 FPS (Standar Mulus)";
          } else {
            targetFpsLimit = 0;
            if (lbl) lbl.textContent = "Tanpa Batas (Max Hz)";
          }
        }
        if (audio) audio.playChime();
      });
    });
  }
  function openCharacterModal() {
    const modal = document.getElementById("character-modal");
    if (!modal) return;
    isCharModalOpen = true;
    modal.classList.add("open");
    const active = (world && world.activeCharacter) || "MINATO";
    document.querySelectorAll("#char-cards-grid .garage-vehicle-card").forEach(c => {
      c.classList.toggle("active", c.getAttribute("data-char") === active);
    });
    document.querySelectorAll(".char-select-btn").forEach(b => {
      const isAct = b.getAttribute("data-char") === active;
      b.textContent = isAct ? "✓ SEDANG DIGUNAKAN" : "PILIH KARAKTER";
    });
    if (audio) audio.playChime();
  }
  function closeCharacterModal() {
    const modal = document.getElementById("character-modal");
    if (!modal) return;
    isCharModalOpen = false;
    modal.classList.remove("open");
  }
  function toggleCharacterModal() {
    if (isCharModalOpen) closeCharacterModal();
    else openCharacterModal();
  }
  function setupCharacterModal() {
    const closeBtn = document.getElementById("char-modal-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeCharacterModal);
    const modal = document.getElementById("character-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeCharacterModal();
      });
    }
    document.querySelectorAll(".char-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const charName = btn.getAttribute("data-char");
        if (charName && world) {
          world.setCharacter(charName);
          document.querySelectorAll("#char-cards-grid .garage-vehicle-card").forEach(c => {
            c.classList.toggle("active", c.getAttribute("data-char") === charName);
          });
          document.querySelectorAll(".char-select-btn").forEach(b => {
            const isAct = b.getAttribute("data-char") === charName;
            b.textContent = isAct ? "✓ SEDANG DIGUNAKAN" : "PILIH KARAKTER";
          });
          saveCheckpointState();
          setTimeout(closeCharacterModal, 280);
        }
      });
    });
    document.querySelectorAll(".char-inspect-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const charName = btn.getAttribute("data-char");
        if (charName) {
          if (world && world.activeCharacter !== charName) {
            world.setCharacter(charName);
          }
          closeCharacterModal();
          openRPGInspectorModal();
          inspectorCurrentTab = "CHAR";
          loadInspectorModel();
          updateInspectorLoreCard();
        }
      });
    });
  }
  function streamBackgroundWorldChunks() {
    if (typeof window.loadScriptAsync !== "function") return;
    setTimeout(() => {
      window.loadScriptAsync("assets/js/data/environment/tokyo_tower_data.js").then(() => {
        if (world && typeof world.createTokyoTowerModel === "function") {
          world.createTokyoTowerModel();
        }
      }).catch(err => {
        console.warn("Background Tokyo Tower stream error:", err);
      });
      setTimeout(() => {
        window.loadScriptAsync("assets/js/data/environment/ccity_building_data.js").then(() => {
          if (world && typeof world.createRealCityBuildings === "function") {
            world.createRealCityBuildings();
          }
        }).catch(err => {
          console.warn("Background CCity stream error:", err);
        });
      }, 300);
      setTimeout(() => {
        window.loadScriptAsync("assets/js/data/environment/tokyo_city_model_data.js").then(() => {
          if (world && typeof world.createTokyoCityBlocksModel === "function") {
            world.createTokyoCityBlocksModel();
          }
          console.log("All Tokyo City background chunks streamed and rendered successfully!");
        }).catch(err => {
          console.warn("Background Tokyo City blocks stream error:", err);
        });
      }, 600);
    }, 200);
  }
  function saveCheckpointState() {
    if (!physics) return;
    try {
      const data = {
        mode: physics.mode,
        x: (physics.mode === "WALKING") ? physics.walkerX : physics.x,
        y: (physics.mode === "WALKING") ? physics.walkerY : physics.y,
        z: (physics.mode === "WALKING") ? physics.walkerZ : physics.z,
        rot: (physics.mode === "WALKING") ? physics.walkerRotation : physics.rotation,
        carType: (carModel && carModel.currentCarType) ? carModel.currentCarType : "rx7",
        charName: (world && world.activeCharacter) ? world.activeCharacter : "MINATO",
        timestamp: Date.now()
      };
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }
  function loadCheckpointState() {
    try {
      const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data.x !== "number") return;
      if (data.carType && carModel && data.carType !== carModel.currentCarType) {
        changeCar(data.carType);
      }
      if (data.charName && world && data.charName !== world.activeCharacter) {
        world.setCharacter(data.charName);
      }
      if (physics) {
        if (data.mode === "WALKING") {
          physics.walkerX = data.x;
          physics.walkerY = data.y;
          physics.walkerZ = data.z;
          physics.walkerRotation = data.rot || 0;
          walkerCameraYaw = data.rot || 0;
          cameraPitchOffset = 0;
          physics.mode = "WALKING";
          physics.speed = 0;
          physics.walkerSpeed = 0;
          physics.x = data.x;
          physics.z = data.z - 2.5;
        } else {
          physics.x = data.x;
          physics.y = data.y;
          physics.z = data.z;
          physics.rotation = data.rot || 0;
          physics.mode = "VEHICLE";
          physics.speed = 0;
        }
      }
      updateWalkBtnUI();
      if (window.showGameToast) {
        window.showGameToast("📍 Titik Simpan Terakhir Dimuat!", 2500);
      }
    } catch (e) {
      console.warn("Could not load checkpoint state:", e);
    }
  }
  let previousTimestamp = performance.now();
  function renderLoop(currentTimestamp) {
    requestAnimationFrame(renderLoop);
    if (targetFpsLimit > 0) {
      const elapsed = currentTimestamp - lastFrameTime;
      const interval = 1000 / targetFpsLimit;
      if (elapsed < interval - 1.5) {
        return;
      }
      lastFrameTime = currentTimestamp - (elapsed % interval);
    }
    const rawDt = (currentTimestamp - previousTimestamp) / 1000;
    previousTimestamp = currentTimestamp;
    const dt = Math.min(Math.max(rawDt, 0.0001), 0.05);
    try {
      physics.update(dt, input);
      if (audio) {
        if (physics.mode === "VEHICLE") {
          const speedRatio = Math.abs(physics.speed) / physics.config.MAX_SPEED;
          audio.updateWheelRolling(speedRatio, physics.isAccelerating);
          audio.updateSkid(physics.isDrifting);
        } else {
          audio.updateWheelRolling(0, false);
          audio.updateSkid(false);
        }
      }
      carModel.update(physics, dt);
      const trackedPos = (physics.mode === "WALKING")
        ? new THREE.Vector3(physics.walkerX, physics.walkerY, physics.walkerZ)
        : carModel.rootGroup.position;
      world.update(dt, currentTimestamp / 1000, trackedPos);
      checkStationProximity();
      checkSkywayAndGateProximity();
      updateCamera(dt);
      if (radar) {
        radar.render(physics, dt);
      }
      renderer.render(scene, camera);
      fpsFrameCount++;
      const currentNow = performance.now();
      if (currentNow - lastFpsTime >= 1000) {
        currentFps = Math.round((fpsFrameCount * 1000) / (currentNow - lastFpsTime));
        fpsFrameCount = 0;
        lastFpsTime = currentNow;
        updateFpsUI(currentFps);
        checkAdaptiveGovernor(currentFps);
      }
    } catch (renderErr) {
      console.warn("Non-fatal frame error caught, continuing render:", renderErr);
    }
  }
})();