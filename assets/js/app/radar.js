class WorldRadar {
  constructor(minimapCanvas, fullmapCanvas, config) {
    this.canvas = minimapCanvas;
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.config = config || window.APP_CONFIG.RADAR;
    this.worldConfig = window.APP_CONFIG.WORLD;
    this.size = this.config.CANVAS_SIZE || 190;
    if (this.canvas) {
      this.canvas.width = this.size;
      this.canvas.height = this.size;
    }
    this.center = this.size / 2;
    this.radius = this.size / 2 - 8;
    this.isHeadingUp = this.config.DEFAULT_HEADING_MODE !== false;
    this.fullCanvas = fullmapCanvas;
    this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext("2d") : null;
    this.isMapModalOpen = false;
    this.panX = 0;
    this.panY = 0;
    this.mapZoom = 1.0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.targetLabelEl = document.getElementById("radar-target-info");
    this.modeBtnEl = document.getElementById("btn-radar-mode");
    this.modalEl = document.getElementById("tactical-map-modal");
    this.setupEventListeners();
  }
  setupEventListeners() {
    if (this.canvas) {
      this.canvas.addEventListener("click", () => {
        this.openFullMap();
      });
    }
    if (this.modeBtnEl) {
      this.modeBtnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleHeadingMode();
      });
    }
    if (this.fullCanvas) {
      this.fullCanvas.addEventListener("mousedown", (e) => {
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
      });
      window.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.renderFullMap(window._lastPhysics);
      });
      window.addEventListener("mouseup", () => {
        this.isDragging = false;
      });
      this.fullCanvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.15 : 0.87;
        this.mapZoom = Math.max(0.4, Math.min(3.0, this.mapZoom * zoomDelta));
        this.renderFullMap(window._lastPhysics);
      }, { passive: false });
      this.fullCanvas.addEventListener("click", (e) => {
        if (Math.abs(e.clientX - (this.dragStartX + this.panX)) > 6) return;
        this.handleFullMapClick(e);
      });
      this.fullCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          this.dragStartX = e.touches[0].clientX - this.panX;
          this.dragStartY = e.touches[0].clientY - this.panY;
        }
      });
      this.fullCanvas.addEventListener("touchmove", (e) => {
        if (!this.isDragging || e.touches.length !== 1) return;
        this.panX = e.touches[0].clientX - this.dragStartX;
        this.panY = e.touches[0].clientY - this.dragStartY;
        this.renderFullMap(window._lastPhysics);
      });
      this.fullCanvas.addEventListener("touchend", () => {
        this.isDragging = false;
      });
    }
    const closeBtn = document.getElementById("btn-close-fullmap");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeFullMap());
    }
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyM" && !e.target.matches("input, textarea")) {
        this.toggleFullMap();
      }
      if (e.code === "Escape" && this.isMapModalOpen) {
        this.closeFullMap();
      }
    });
    const zoomInBtn = document.getElementById("btn-map-zoom-in");
    const zoomOutBtn = document.getElementById("btn-map-zoom-out");
    const resetPanBtn = document.getElementById("btn-map-reset-pan");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => { this.mapZoom = Math.min(3.0, this.mapZoom * 1.25); this.renderFullMap(window._lastPhysics); });
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { this.mapZoom = Math.max(0.4, this.mapZoom * 0.8); this.renderFullMap(window._lastPhysics); });
    if (resetPanBtn) resetPanBtn.addEventListener("click", () => { this.panX = 0; this.panY = 0; this.mapZoom = 1.0; this.renderFullMap(window._lastPhysics); });
  }
  toggleHeadingMode() {
    this.isHeadingUp = !this.isHeadingUp;
    if (this.modeBtnEl) {
      this.modeBtnEl.textContent = this.isHeadingUp ? "🧭 HEADING-UP" : "🧭 NORTH-UP";
    }
  }
  openFullMap() {
    this.isMapModalOpen = true;
    if (this.modalEl) {
      this.modalEl.classList.add("open");
    }
    if (this.fullCanvas) {
      this.fullCanvas.width = this.fullCanvas.parentElement.clientWidth;
      this.fullCanvas.height = this.fullCanvas.parentElement.clientHeight;
      this.renderFullMap(window._lastPhysics);
    }
  }
  closeFullMap() {
    this.isMapModalOpen = false;
    if (this.modalEl) {
      this.modalEl.classList.remove("open");
    }
  }
  toggleFullMap() {
    if (this.isMapModalOpen) this.closeFullMap();
    else this.openFullMap();
  }
  handleFullMapClick(e) {
    const rect = this.fullCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - (this.fullCanvas.width / 2 + this.panX);
    const clickY = e.clientY - rect.top - (this.fullCanvas.height / 2 + this.panY);
    const scale = (this.fullCanvas.width / this.worldConfig.SIZE) * this.mapZoom;
    let chosen = null;
    let minD = 32;
    window.APP_CONFIG.PROJECTS.forEach(p => {
      const sx = p.pos.x * scale;
      const sy = p.pos.z * scale;
      const d = Math.hypot(clickX - sx, clickY - sy);
      if (d < minD) {
        chosen = p;
        minD = d;
      }
    });
    if (chosen && window.onStationSelect) {
      this.closeFullMap();
      window.onStationSelect(chosen.id);
    }
  }
  render(physics, dt) {
    window._lastPhysics = physics;
    this.renderMinimap(physics, dt);
    if (this.isMapModalOpen) {
      this.renderFullMap(physics);
    }
  }
  renderMinimap(physics, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.size;
    const h = this.size;
    const cx = this.center;
    const cy = this.center;
    const r = this.radius;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const oceanGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    oceanGrad.addColorStop(0, "#2d8a9e");
    oceanGrad.addColorStop(0.75, "#25788c");
    oceanGrad.addColorStop(1, "#1c6274");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);
    const scale = (this.size / this.worldConfig.SIZE) * 1.35;
    const playerX = (physics.mode === "WALKING") ? physics.walkerX : physics.x;
    const playerZ = (physics.mode === "WALKING") ? physics.walkerZ : physics.z;
    const playerRot = (physics.mode === "WALKING") ? physics.walkerRotation : physics.rotation;
    ctx.save();
    ctx.translate(cx, cy);
    if (this.isHeadingUp) {
      ctx.rotate(-playerRot);
      ctx.translate(-playerX * scale, -playerZ * scale);
    } else {
      ctx.translate(0, 0);
    }
    this.drawIslandLandmass(ctx, scale);
    this.drawRoadNetwork(ctx, scale, false);
    let closestStation = null;
    let closestDist = Infinity;
    window.APP_CONFIG.PROJECTS.forEach(p => {
      const px = p.pos.x * scale;
      const py = p.pos.z * scale;
      const dist = Math.hypot(p.pos.x - playerX, p.pos.z - playerZ);
      if (dist < closestDist) {
        closestDist = dist;
        closestStation = p;
      }
      this.drawDiamondMarker(ctx, px, py, 7, p.color, false);
    });
    if (!this.isHeadingUp) {
      this.drawPlayerAvatar(ctx, playerX * scale, playerZ * scale, playerRot, physics.mode);
    }
    ctx.restore();
    if (this.isHeadingUp) {
      this.drawPlayerAvatar(ctx, cx, cy, 0, physics.mode);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1;
    [r * 0.35, r * 0.68, r * 0.98].forEach(ringR => {
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
    ctx.strokeStyle = "rgba(245, 166, 35, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    if (this.isHeadingUp) {
      ctx.rotate(-playerRot);
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 0, -r + 9);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("S", 0, r - 9);
    ctx.fillText("E", r - 9, 0);
    ctx.fillText("W", -r + 9, 0);
    ctx.restore();
    if (this.targetLabelEl && closestStation) {
      this.targetLabelEl.innerHTML = `
        <span style="color: #${closestStation.color.toString(16).padStart(6, "0")}">◆</span>
        ${closestStation.title.toUpperCase()}: <strong>${Math.round(closestDist)}M</strong>
      `;
    }
  }
  renderFullMap(physics) {
    if (!this.fullCtx || !this.fullCanvas) return;
    const ctx = this.fullCtx;
    const w = this.fullCanvas.width;
    const h = this.fullCanvas.height;
    const cx = w / 2 + this.panX;
    const cy = h / 2 + this.panY;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1e5366";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.save();
    ctx.translate(cx, cy);
    const scale = (w / this.worldConfig.SIZE) * this.mapZoom;
    this.drawIslandLandmass(ctx, scale, true);
    this.drawRoadNetwork(ctx, scale, true);
    window.APP_CONFIG.PROJECTS.forEach(p => {
      const px = p.pos.x * scale;
      const py = p.pos.z * scale;
      const colorHex = "#" + p.color.toString(16).padStart(6, "0");
      this.drawDiamondMarker(ctx, px, py, 14, p.color, true);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 6;
      ctx.fillText(p.title, px, py - 20);
      ctx.fillStyle = colorHex;
      ctx.font = "10px monospace";
      ctx.fillText(p.district, px, py + 26);
      ctx.shadowBlur = 0;
    });
    if (physics) {
      const pX = (physics.mode === "WALKING") ? physics.walkerX : physics.x;
      const pZ = (physics.mode === "WALKING") ? physics.walkerZ : physics.z;
      const pRot = (physics.mode === "WALKING") ? physics.walkerRotation : physics.rotation;
      this.drawPlayerAvatar(ctx, pX * scale, pZ * scale, pRot, physics.mode, true);
    }
    ctx.restore();
  }
  drawIslandLandmass(ctx, scale, isTactical = false) {
    ctx.save();
    ctx.fillStyle = "#ddb274";
    ctx.strokeStyle = "#cba062";
    ctx.lineWidth = 4 * scale;
    const mainIslandR = 490 * scale;
    ctx.beginPath();
    ctx.roundRect(-mainIslandR, -mainIslandR, mainIslandR * 2, mainIslandR * 2, 80 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6aa344";
    const grassR = 450 * scale;
    ctx.beginPath();
    ctx.roundRect(-grassR, -grassR, grassR * 2, grassR * 2, 70 * scale);
    ctx.fill();
    const lagoons = [
      { x: -160, z: 120, r: 65 },
      { x: 140, z: -140, r: 75 },
      { x: 280, z: 160, r: 55 }
    ];
    lagoons.forEach(lg => {
      ctx.fillStyle = "#e0be88";
      ctx.beginPath();
      ctx.arc(lg.x * scale, lg.z * scale, (lg.r + 10) * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3ba3be";
      ctx.beginPath();
      ctx.arc(lg.x * scale, lg.z * scale, lg.r * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    if (isTactical) {
      const treeDots = [
        { x: -120, z: -80, c: "#ff9eb5" }, { x: -135, z: -70, c: "#ff8aa5" },
        { x: 120, z: 80, c: "#ff9eb5" }, { x: 135, z: 90, c: "#ff8aa5" },
        { x: -80, z: 160, c: "#528e32" }, { x: 90, z: -180, c: "#528e32" },
        { x: -300, z: -40, c: "#528e32" }, { x: 300, z: -40, c: "#528e32" }
      ];
      treeDots.forEach(td => {
        ctx.fillStyle = td.c;
        ctx.beginPath();
        ctx.arc(td.x * scale, td.z * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }
  drawRoadNetwork(ctx, scale, isTactical = false) {
    const roadSegments = [
      [0, -140, 0, 140, 32],
      [-140, 0, 140, 0, 32],
      [190, -260, 190, 260, 24],
      [-190, -260, -190, 260, 24],
      [-190, 260, 190, 260, 24],
      [-190, -260, 190, -260, 24],
      [0, 260, 0, 460, 26],
      [0, 460, 0, 975, 22],
      [190, 0, 380, 0, 24],
      [-190, -100, -380, -100, 24]
    ];
    ctx.save();
    roadSegments.forEach(([x1, z1, x2, z2, w]) => {
      const rw = Math.max(w * scale, 12);
      ctx.lineWidth = rw + 5;
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "#e74c3c";
      ctx.beginPath();
      ctx.moveTo(x1 * scale, z1 * scale);
      ctx.lineTo(x2 * scale, z2 * scale);
      ctx.stroke();
      ctx.lineDashOffset = 8;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x1 * scale, z1 * scale);
      ctx.lineTo(x2 * scale, z2 * scale);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    roadSegments.forEach(([x1, z1, x2, z2, w]) => {
      ctx.lineWidth = Math.max(w * scale, 10);
      ctx.strokeStyle = "#32353b";
      ctx.beginPath();
      ctx.moveTo(x1 * scale, z1 * scale);
      ctx.lineTo(x2 * scale, z2 * scale);
      ctx.stroke();
    });
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    roadSegments.forEach(([x1, z1, x2, z2]) => {
      ctx.beginPath();
      ctx.moveTo(x1 * scale, z1 * scale);
      ctx.lineTo(x2 * scale, z2 * scale);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    const plazaR = 36 * scale;
    ctx.fillStyle = "#32353b";
    ctx.beginPath();
    ctx.arc(0, 0, plazaR, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f5a623";
    ctx.beginPath();
    ctx.arc(0, 0, plazaR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 975 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  drawDiamondMarker(ctx, x, y, size, accentColor, isTactical = false) {
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    ctx.fillStyle = "#181a1d";
    ctx.beginPath();
    ctx.moveTo(0, -(s + 3));
    ctx.lineTo(s + 3, 0);
    ctx.lineTo(0, s + 3);
    ctx.lineTo(-(s + 3), 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    const innerS = s * 0.48;
    const colorHex = "#" + accentColor.toString(16).padStart(6, "0");
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.moveTo(0, -innerS);
    ctx.lineTo(innerS, 0);
    ctx.lineTo(0, innerS);
    ctx.lineTo(-innerS, 0);
    ctx.closePath();
    ctx.fill();
    if (isTactical) {
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, s + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawPlayerAvatar(ctx, x, y, rotation, mode, isTactical = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (mode === "WALKING") {
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(-3, 3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
    } else {
      const scale = isTactical ? 1.3 : 1.0;
      ctx.fillStyle = "rgba(255, 250, 220, 0.28)";
      ctx.beginPath();
      ctx.moveTo(-3 * scale, 8 * scale);
      ctx.lineTo(-12 * scale, 34 * scale);
      ctx.lineTo(12 * scale, 34 * scale);
      ctx.lineTo(3 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#181a1d";
      ctx.beginPath();
      ctx.roundRect(-6.5 * scale, -10 * scale, 13 * scale, 20 * scale, 3 * scale);
      ctx.fill();
      ctx.fillStyle = "#f5a623";
      ctx.beginPath();
      ctx.roundRect(-5.5 * scale, -9 * scale, 11 * scale, 18 * scale, 2.5 * scale);
      ctx.fill();
      ctx.fillStyle = "#0d131a";
      ctx.beginPath();
      ctx.roundRect(-4.0 * scale, -2 * scale, 8 * scale, 7 * scale, 1.5 * scale);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.fillRect(-6.5 * scale, -11 * scale, 13 * scale, 2.5 * scale);
      ctx.fillStyle = "#ff1e2d";
      ctx.fillRect(-5 * scale, -11.5 * scale, 10 * scale, 1.2 * scale);
    }
    ctx.restore();
  }
}
window.WorldRadar = WorldRadar;