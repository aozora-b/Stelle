class TokyoCityWorld {
  constructor(scene, physics, config) {
    this.scene = scene;
    this.physics = physics;
    this.config = config || window.APP_CONFIG.WORLD;
    this.stations = [];
    this.animatedObjects = [];
    this.streetlights = [];
    this.skidMarks = [];
    this.exhaustPuffs = [];
    this.currentWeather = window.APP_CONFIG.WORLD.DEFAULT_WEATHER;
    this.hemiLight = null;
    this.sunLight = null;
    this.roadMaterial = null;
    this.waterMesh = null;
    this.rainParticles = null;
    this.sakuraPetals = null;
    this.buildWorld();
  }
  buildWorld() {
    this.setupLighting();
    this.createCoastalWater();
    this.createGroundTerrain();
    this.createExpresswayNetwork();
    this.createOptimizedSkylineWithColliders();
    this.createTokyoRealCityModels();
    this.createSakuraNatureSystem();
    this.createHighwaySignage();
    this.createRainSystem();
    this.createProjectStations();
    this.createPhysicsProps();
    this.createCelestialSkyway();
    this.applyWeather(this.currentWeather);
  }
  setupLighting() {
    this.scene.fog = new THREE.FogExp2(0x90caf9, 0.0011);
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d5a45, 1.4);
    this.scene.add(this.hemiLight);
    this.sunLight = new THREE.DirectionalLight(0xfffae8, 2.3);
    this.sunLight.position.set(160, 220, 110);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 40;
    this.sunLight.shadow.camera.far = 500;
    const shadowDist = 130;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);
  }
  createCoastalWater() {
    const waterGeo = new THREE.PlaneGeometry(this.config.SIZE * 2.2, this.config.SIZE * 2.2, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1bb8b0,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -1.8;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }
  createGroundTerrain() {
    const islandGeo = new THREE.PlaneGeometry(this.config.SIZE, this.config.SIZE);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x243328,
      roughness: 0.9,
      metalness: 0.05
    });
    const island = new THREE.Mesh(islandGeo, groundMat);
    island.rotation.x = -Math.PI / 2;
    island.position.y = 0.0;
    island.receiveShadow = true;
    this.scene.add(island);
    const grid = new THREE.GridHelper(this.config.SIZE, 80, 0x3d5a45, 0x1f2e22);
    grid.position.y = 0.02;
    this.scene.add(grid);
  }
  generateRoadTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#22252a";
    ctx.fillRect(0, 0, 512, 1024);
    const imgData = ctx.getImageData(0, 0, 512, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
    const kerbW = 36;
    const kerbStep = 64;
    for (let y = 0; y < 1024; y += kerbStep) {
      const isRed = (Math.floor(y / kerbStep) % 2 === 0);
      ctx.fillStyle = isRed ? "#e63946" : "#f8f9fa";
      ctx.fillRect(0, y, kerbW, kerbStep);
      ctx.fillRect(512 - kerbW, y, kerbW, kerbStep);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(kerbW + 4, 0, 8, 1024);
    ctx.fillRect(512 - kerbW - 12, 0, 8, 1024);
    ctx.fillStyle = "#ffb703";
    ctx.fillRect(256 - 9, 0, 6, 1024);
    ctx.fillRect(256 + 3, 0, 6, 1024);
    ctx.fillStyle = "#ffffff";
    const dashL = 48;
    const gapL = 36;
    for (let y = 0; y < 1024; y += (dashL + gapL)) {
      ctx.fillRect(146, y, 6, dashL);
      ctx.fillRect(366, y, 6, dashL);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  }
  createExpresswayNetwork() {
    const baseRoadTex = this.generateRoadTexture();
    const highways = [
      { x: 0, z: 0, w: 32, l: 200, rot: 0, isBridge: false },
      { x: 190, z: 0, w: 24, l: 520, rot: 0, isBridge: false },
      { x: -190, z: 0, w: 24, l: 520, rot: 0, isBridge: false },
      { x: 0, z: 260, w: 24, l: 420, rot: Math.PI / 2, isBridge: false },
      { x: 0, z: -260, w: 24, l: 420, rot: Math.PI / 2, isBridge: false },
      { x: 0, z: 460, w: 24, l: 240, rot: 0, isBridge: true },
      { x: 380, z: 0, w: 24, l: 260, rot: Math.PI / 2, isBridge: false },
      { x: -380, z: -100, w: 24, l: 240, rot: Math.PI / 2, isBridge: false },
      { x: 260, z: 260, w: 24, l: 200, rot: Math.PI / 4, isBridge: false },
      { x: -260, z: 260, w: 24, l: 200, rot: -Math.PI / 4, isBridge: false }
    ];
    highways.forEach(hw => {
      const roadGeo = new THREE.PlaneGeometry(hw.w, hw.l);
      const roadTex = baseRoadTex.clone();
      roadTex.needsUpdate = true;
      roadTex.repeat.set(1, Math.max(1, Math.round(hw.l / 22)));
      const roadMat = new THREE.MeshStandardMaterial({
        map: roadTex,
        roughness: 0.72,
        metalness: 0.12
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      if (hw.rot) road.rotation.z = hw.rot;
      road.position.set(hw.x, 0.045, hw.z);
      road.receiveShadow = true;
      this.scene.add(road);
      if (hw.isBridge) {
        for (let bz = hw.z - hw.l / 2 + 30; bz <= hw.z + hw.l / 2 - 30; bz += 50) {
          this.createBridgePillar(hw.x - 11, bz);
          this.createBridgePillar(hw.x + 11, bz);
        }
      }
    });
    const plazaCanvas = document.createElement("canvas");
    plazaCanvas.width = 512;
    plazaCanvas.height = 512;
    const pCtx = plazaCanvas.getContext("2d");
    pCtx.fillStyle = "#22252a";
    pCtx.fillRect(0, 0, 512, 512);
    pCtx.strokeStyle = "#ffb703";
    pCtx.lineWidth = 10;
    pCtx.beginPath();
    pCtx.arc(256, 256, 230, 0, Math.PI * 2);
    pCtx.stroke();
    pCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    pCtx.lineWidth = 6;
    pCtx.beginPath();
    pCtx.arc(256, 256, 205, 0, Math.PI * 2);
    pCtx.stroke();
    pCtx.fillStyle = "#ffffff";
    [-180, 180].forEach(cy => {
      for (let x = 160; x <= 352; x += 24) {
        pCtx.fillRect(x, 256 + cy - 18, 14, 36);
      }
    });
    [-180, 180].forEach(cx => {
      for (let y = 160; y <= 352; y += 24) {
        pCtx.fillRect(256 + cx - 18, y, 36, 14);
      }
    });
    const plazaTex = new THREE.CanvasTexture(plazaCanvas);
    const plazaGeo = new THREE.CircleGeometry(36, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      map: plazaTex,
      roughness: 0.65,
      metalness: 0.15
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.05, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);
    const ringGeo = new THREE.RingGeometry(35, 37.5, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf5a623, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.055, 0);
    this.scene.add(ring);
  }
  createBridgePillar(x, z) {
    const pillarGeo = new THREE.CylinderGeometry(1.6, 2.0, 10, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, -3.5, z);
    pillar.receiveShadow = true;
    this.scene.add(pillar);
    if (this.physics && this.physics.addStaticCollider) {
      this.physics.addStaticCollider(x - 1.8, x + 1.8, z - 1.8, z + 1.8, 10, "pillar");
    }
  }
  createOptimizedSkylineWithColliders() {
    this.cityBuildingMeshes = [];
    const roadClearance = 28;
    const isLocationClear = (bx, bz) => {
      const onPlaza = Math.sqrt(bx * bx + bz * bz) < 55;
      const onNorth = Math.abs(bz - 260) < roadClearance;
      const onSouth = Math.abs(bz + 260) < roadClearance;
      const onEast = Math.abs(bx - 190) < roadClearance;
      const onWest = Math.abs(bx + 190) < roadClearance;
      const onCenterStrip = Math.abs(bx) < roadClearance && Math.abs(bz) < 250;
      const onSpurEast = Math.abs(bz) < roadClearance && bx > 150 && bx < 520;
      const onSpurWest = Math.abs(bz + 100) < roadClearance && bx < -150 && bx > -520;
      const onBayshore = Math.abs(bx) < roadClearance && bz > 240 && bz < 600;
      const onSkywayRamp = Math.abs(bx) < 24 && bz >= 460 && bz <= 1020;
      const onTokyoTower = Math.hypot(bx - 340, bz + 340) < 65;
      const onTokyoBlock1 = Math.hypot(bx + 180, bz + 180) < 40;
      const onTokyoBlock2 = Math.hypot(bx - 180, bz - 140) < 40;
      const onTokyoBlock3 = Math.hypot(bx + 360, bz - 220) < 40;
      const onFlappie = Math.hypot(bx + 440, bz - 220) < 40;
      const onStations = (window.APP_CONFIG && window.APP_CONFIG.PROJECTS)
        ? window.APP_CONFIG.PROJECTS.some(p => Math.hypot(bx - p.pos.x, bz - p.pos.z) < 42)
        : false;
      return !(onPlaza || onNorth || onSouth || onEast || onWest || onCenterStrip || onSpurEast || onSpurWest || onBayshore || onSkywayRamp || onTokyoTower || onTokyoBlock1 || onTokyoBlock2 || onTokyoBlock3 || onFlappie || onStations);
    };
    if (typeof THREE.GLTFLoader === "function") {
      const loader = new THREE.GLTFLoader();
      const parseAndSpawnCcityBuildings = (buffer) => {
        try {
          loader.parse(buffer, "", (gltf) => {
            const root = gltf.scene;
            const candidateNames = [
              'LM_Paramount1', 'LM_Paramount9', 'Projects', 'Projects1',
              'Filler_Housing', 'Filler_Housing1', 'Filler_Apartments2',
              'Filler_CityArms2', 'LM_Clinic2', 'LM_Liquor', 'LM_Laundrette',
              'LM_PawnShop1', 'LM_PawnShop3'
            ];
            const buildingTemplates = [];
            candidateNames.forEach((name) => {
              const node = root.getObjectByName(name);
              if (node) {
                node.traverse((child) => {
                  if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                      child.material.roughness = 0.52;
                      child.material.metalness = 0.35;
                      if (child.material.name && child.material.name.toLowerCase().includes("glow")) {
                        child.material.emissive = new THREE.Color(0xffe890);
                        child.material.emissiveIntensity = 0.7;
                      }
                    }
                  }
                });
                const wrapper = new THREE.Group();
                const box = new THREE.Box3().setFromObject(node);
                const cx = (box.min.x + box.max.x) / 2;
                const cz = (box.min.z + box.max.z) / 2;
                const cy = box.min.y;
                node.position.set(-cx, -cy, -cz);
                wrapper.add(node);
                buildingTemplates.push({ name, wrapper });
              }
            });
            if (buildingTemplates.length === 0) return;
            const buildingPlots = [
              { x: -95, z: -95 }, { x: -140, z: -95 }, { x: -95, z: -140 }, { x: -140, z: -140 },
              { x: -240, z: -95 }, { x: -280, z: -140 }, { x: -240, z: -180 }, { x: -290, z: -220 },
              { x: -95, z: -240 }, { x: -140, z: -280 }, { x: -180, z: -240 }, { x: -220, z: -290 },
              { x: -80, z: -320 }, { x: -140, z: -350 }, { x: 0, z: -340 }, { x: 80, z: -320 },
              { x: 140, z: -350 }, { x: -220, z: -350 }, { x: 220, z: -350 }, { x: -60, z: -290 },
              { x: 95, z: -95 }, { x: 140, z: -95 }, { x: 95, z: -140 }, { x: 140, z: -140 },
              { x: 240, z: -95 }, { x: 280, z: -140 }, { x: 240, z: -180 }, { x: 290, z: -220 },
              { x: 95, z: -240 }, { x: 140, z: -280 }, { x: 180, z: -240 }, { x: 220, z: -290 },
              { x: 280, z: -320 }, { x: 380, z: -280 }, { x: 420, z: -340 },
              { x: 95, z: 95 }, { x: 140, z: 95 }, { x: 95, z: 140 }, { x: 140, z: 180 },
              { x: 240, z: 95 }, { x: 280, z: 140 }, { x: 240, z: 180 }, { x: 290, z: 220 },
              { x: 95, z: 240 }, { x: 140, z: 280 }, { x: 180, z: 240 }, { x: 220, z: 290 },
              { x: 280, z: 320 }, { x: 340, z: 260 }, { x: 380, z: 320 },
              { x: -95, z: 95 }, { x: -140, z: 95 }, { x: -95, z: 140 }, { x: -140, z: 180 },
              { x: -240, z: 95 }, { x: -280, z: 140 }, { x: -240, z: 180 }, { x: -290, z: 220 },
              { x: -95, z: 240 }, { x: -140, z: 280 }, { x: -180, z: 240 }, { x: -220, z: 290 },
              { x: -280, z: 320 }, { x: -340, z: 280 }, { x: -380, z: 340 }, { x: -440, z: 280 },
              { x: -380, z: -80 }, { x: -440, z: -140 }, { x: -420, z: 50 }, { x: -460, z: 120 },
              { x: 380, z: -80 }, { x: 440, z: -140 }, { x: 420, z: 50 }, { x: 460, z: 120 },
              { x: 320, z: 380 }, { x: -320, z: 380 }, { x: 180, z: 360 }, { x: -180, z: 360 }
            ];
            let placedCount = 0;
            buildingPlots.forEach((plot, pIdx) => {
              if (!isLocationClear(plot.x, plot.z)) return;
              const tpl = buildingTemplates[pIdx % buildingTemplates.length];
              const inst = tpl.wrapper.clone();
              let scale = 0.015;
              if (tpl.name.includes("Projects")) scale = 0.013;
              else if (tpl.name.includes("Paramount")) scale = 0.017;
              else if (tpl.name.includes("Liquor") || tpl.name.includes("Pawn") || tpl.name.includes("Laundr")) scale = 0.014;
              inst.scale.set(scale, scale, scale);
              inst.position.set(plot.x, 0.05, plot.z);
              inst.rotation.y = ((pIdx * 90) % 360) * (Math.PI / 180);
              this.scene.add(inst);
              inst.updateMatrixWorld(true);
              if (this.physics && this.physics.addStaticCollider) {
                const bbox = new THREE.Box3().setFromObject(inst);
                this.physics.addStaticCollider(
                  bbox.min.x,
                  bbox.max.x,
                  bbox.min.z,
                  bbox.max.z,
                  bbox.max.y,
                  "real_bldg_" + tpl.name,
                  bbox.min.y
                );
              }
              this.cityBuildingMeshes.push(inst);
              placedCount++;
            });
          }, undefined, (err) => {
            console.warn("Failed to parse CCITY_BUILDING_GLB:", err);
          });
        } catch (e) {
          console.warn("Error parsing CCITY GLB:", e);
        }
      };
      if (window.CCITY_BUILDING_GLB) {
        try {
          const bin = atob(window.CCITY_BUILDING_GLB);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          parseAndSpawnCcityBuildings(bytes.buffer);
        } catch (err) {
          console.warn("Base64 decode CCITY failed:", err);
        }
      }
    }
    this.createDetailedTokyoSkylineBackdrop(isLocationClear);
  }
  createDetailedTokyoSkylineBackdrop(isLocationClear) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e2638";
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 8; y < 248; y += 14) {
      for (let x = 6; x < 122; x += 10) {
        const isLit = Math.random() > 0.42;
        if (isLit) {
          const warm = Math.random() > 0.35;
          ctx.fillStyle = warm ? "#ffeaa7" : "#74b9ff";
        } else {
          ctx.fillStyle = "#0f172a";
        }
        ctx.fillRect(x, y, 7, 9);
      }
    }
    const windowTexture = new THREE.CanvasTexture(canvas);
    windowTexture.wrapS = THREE.RepeatWrapping;
    windowTexture.wrapT = THREE.RepeatWrapping;
    const skylineMat = new THREE.MeshStandardMaterial({
      map: windowTexture,
      roughness: 0.35,
      metalness: 0.55
    });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const count = 48;
    const instancedMesh = new THREE.InstancedMesh(boxGeo, skylineMat, count);
    instancedMesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let i = 0; i < count * 4 && placed < count; i++) {
      const angle = (placed / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = 380 + Math.random() * 220;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      if (!isLocationClear(bx, bz)) continue;
      const bW = 28 + Math.random() * 24;
      const bD = 28 + Math.random() * 24;
      const bH = 75 + Math.random() * 120;
      dummy.position.set(bx, bH / 2, bz);
      dummy.scale.set(bW, bH, bD);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(placed, dummy.matrix);
      if (this.physics && this.physics.addStaticCollider) {
        this.physics.addStaticCollider(
          bx - bW / 2,
          bx + bW / 2,
          bz - bD / 2,
          bz + bD / 2,
          bH,
          "skyline_tower"
        );
      }
      placed++;
    }
    this.scene.add(instancedMesh);
  }
  createTokyoRealCityModels() {
    if (typeof THREE.GLTFLoader !== "function") return;
    const loader = new THREE.GLTFLoader();
    if (window.TOKYO_TOWER_GLB) {
      try {
        const bin = atob(window.TOKYO_TOWER_GLB);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        loader.parse(bytes.buffer, "", (gltf) => {
          const tower = gltf.scene;
          tower.name = "tokyo_tower";
          tower.userData.tag = "tokyo_tower";
          const scale = 25.0;
          tower.scale.set(scale, scale, scale);
          tower.position.set(340, 0.05, -340);
          tower.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = 0.35;
                child.material.metalness = 0.65;
              }
            }
          });
          this.scene.add(tower);
          const beacon = new THREE.PointLight(0xff2200, 3.5, 160);
          beacon.position.set(340, 138, -340);
          this.scene.add(beacon);
          if (this.physics && this.physics.addStaticCollider) {
            this.physics.addStaticCollider(340 - 24, 340 + 24, -340 - 24, -340 + 24, 140, "tokyo_tower");
          }
        });
      } catch (err) {
        console.warn("Failed to load Tokyo Tower GLB:", err);
      }
    }
    if (window.TOKYO_CITY_GLB) {
      try {
        const bin = atob(window.TOKYO_CITY_GLB);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        loader.parse(bytes.buffer, "", (gltf) => {
          const baseCityScene = gltf.scene;
          baseCityScene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = 0.45;
                child.material.metalness = 0.4;
              }
            }
          });
          this.tokyoCityBlocks = [];
          const districtLocations = [
            { x: -180, z: -180, rotY: 0, tag: "shibuya_block" },
            { x: 180, z: 140, rotY: Math.PI / 2, tag: "akihabara_block" },
            { x: -360, z: 220, rotY: Math.PI, tag: "flappie_media_block" }
          ];
          districtLocations.forEach((loc) => {
            const block = baseCityScene.clone();
            const scale = 2.0;
            block.scale.set(scale, scale, scale);
            block.position.set(loc.x, 0.05, loc.z);
            block.rotation.y = loc.rotY;
            this.scene.add(block);
            block.updateMatrixWorld(true);
            block.walkableMeshes = [];
            const walkableKeywords = ["road", "cobble", "ground", "tile", "dirt", "brick", "concrete", "track", "ballast", "object_70", "object_71", "object_72", "object_67", "object_66", "object_63", "object_62", "object_68"];
            block.traverse((child) => {
              if (child.isMesh) {
                const mName = (child.name || "").toLowerCase();
                const matName = (child.material && child.material.name ? child.material.name : "").toLowerCase();
                if (walkableKeywords.some(kw => mName.includes(kw) || matName.includes(kw))) {
                  block.walkableMeshes.push(child);
                }
              }
            });
            if (block.walkableMeshes.length === 0) {
              block.traverse((child) => {
                if (child.isMesh) block.walkableMeshes.push(child);
              });
            }
            this.tokyoCityBlocks.push(block);
              const wallKeywords = ['wall', 'dumpster', 'pole', 'vending', 'townace', 'hotel', 'bakery', 'plantstore', 'hedge', 'gate', 'bar', 'net', 'opacity'];
              block.traverse((child) => {
                if (child.isMesh && !block.walkableMeshes.includes(child)) {
                  const mName = (child.name || "").toLowerCase();
                  const matName = (child.material && child.material.name ? child.material.name : "").toLowerCase();
                  if (wallKeywords.some(kw => mName.includes(kw) || matName.includes(kw))) {
                    if (mName.includes("fence") || matName.includes("fence") || matName.includes("cobble")) return;
                    const bbox = new THREE.Box3().setFromObject(child);
                    const widthX = bbox.max.x - bbox.min.x;
                    const depthZ = bbox.max.z - bbox.min.z;
                    const heightY = bbox.max.y - bbox.min.y;
                    if (widthX > 15.0 && depthZ > 8.0) return;
                    if (widthX > 0.15 && depthZ > 0.15 && heightY > 0.35) {
                      this.physics.addStaticCollider(
                        bbox.min.x,
                        bbox.max.x,
                        bbox.min.z,
                        bbox.max.z,
                        bbox.max.y,
                        child.name || (loc.tag + "_wall"),
                        bbox.min.y
                      );
                    }
                  }
                }
              });
            });
          if (this.physics) {
            const cityRaycaster = new THREE.Raycaster();
            const cityDown = new THREE.Vector3(0, -1, 0);
            const cityRayOrigin = new THREE.Vector3();
            this.physics.customHeightProvider = (x, z) => {
              if (!this.tokyoCityBlocks) return null;
              for (let b = 0; b < this.tokyoCityBlocks.length; b++) {
                const block = this.tokyoCityBlocks[b];
                const dx = x - block.position.x;
                const dz = z - block.position.z;
                if (Math.abs(dx) <= 26 && Math.abs(dz) <= 26 && block.walkableMeshes.length > 0) {
                  cityRayOrigin.set(x, 26.0, z);
                  cityRaycaster.set(cityRayOrigin, cityDown);
                  cityRaycaster.far = 30.0;
                  const hits = cityRaycaster.intersectObjects(block.walkableMeshes, false);
                  if (hits.length > 0) {
                    const validHit = hits.find(h => h.point.y >= 0.04);
                    if (validHit) {
                      return validHit.point.y + 0.02;
                    }
                  }
                }
              }
              return null;
            };
          }
        });
      } catch (err) {
        console.warn("Failed to load Tokyo City GLB:", err);
      }
    }
  }
  createSakuraNatureSystem() {
    const treePositions = [
      { x: -30, z: -35 }, { x: 30, z: -35 },
      { x: -38, z: 25 }, { x: 38, z: 25 },
      { x: -45, z: -5 }, { x: 45, z: -5 },
      { x: 90, z: -100 }, { x: 110, z: -120 },
      { x: -90, z: 100 }, { x: -110, z: 120 },
      { x: 120, z: 180 }, { x: -120, z: -180 },
      { x: 60, z: 320 }, { x: -60, z: 320 }
    ];
    treePositions.forEach(pos => this.createSakuraTree(pos.x, pos.z));
    const petalCount = 600;
    this.maxPetalCount = 600;
    this.activePetalCount = 600;
    const petalGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(petalCount * 3);
    const velocities = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 1] = 1.0 + Math.random() * 25.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350;
      velocities[i * 3] = (Math.random() - 0.5) * 0.8;
      velocities[i * 3 + 1] = -(0.5 + Math.random() * 1.2);
      velocities[i * 3 + 2] = 0.5 + Math.random() * 1.2;
    }
    petalGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    petalGeo.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    const petalMat = new THREE.PointsMaterial({
      color: 0xffa8c5,
      size: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.sakuraPetals = new THREE.Points(petalGeo, petalMat);
    this.sakuraPetals.visible = true;
    this.scene.add(this.sakuraPetals);
  }
  createSakuraTree(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 6.5, 8), trunkMat);
    trunk.position.y = 3.25;
    trunk.castShadow = true;
    group.add(trunk);
    const pinkMat1 = new THREE.MeshStandardMaterial({ color: 0xffa3c4, roughness: 0.8 });
    const pinkMat2 = new THREE.MeshStandardMaterial({ color: 0xffb7d2, roughness: 0.85 });
    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6, 1), pinkMat1);
    crown1.position.set(0, 7.5, 0);
    crown1.castShadow = true;
    group.add(crown1);
    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), pinkMat2);
    crown2.position.set(1.8, 6.8, 1.2);
    crown2.castShadow = true;
    group.add(crown2);
    const crown3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), pinkMat1);
    crown3.position.set(-1.8, 6.5, -1.2);
    crown3.castShadow = true;
    group.add(crown3);
    this.scene.add(group);
    if (this.physics && this.physics.addStaticCollider) {
      this.physics.addStaticCollider(x - 0.7, x + 0.7, z - 0.7, z + 0.7, 7, "tree");
    }
  }
  createHighwaySignage() {
    const gantries = [
      { x: 0, z: -110, rot: 0, text: "SHUTO EXPRESSWAY // C1 LOOP" },
      { x: 0, z: 130, rot: 0, text: "ROPPONGI & ODAIBA BAY" },
      { x: 190, z: -130, rot: Math.PI / 2, text: "AKIHABARA TECH DISTRICT" },
      { x: -190, z: 120, rot: Math.PI / 2, text: "GINZA COMMERCIAL BLVD" }
    ];
    gantries.forEach(g => this.createGantry(g.x, g.z, g.rot, g.text));
    for (let z = -240; z <= 240; z += 48) {
      if (Math.abs(z) > 30) {
        this.createStreetlightNode(-19, z);
        this.createStreetlightNode(19, z);
      }
    }
  }
  createGantry(x, z, rot, text) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 10, 8);
    const postL = new THREE.Mesh(postGeo, metalMat);
    postL.position.set(-16, 5, 0);
    const postR = postL.clone();
    postR.position.set(16, 5, 0);
    group.add(postL);
    group.add(postR);
    const beamGeo = new THREE.BoxGeometry(33, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, metalMat);
    beam.position.set(0, 9.8, 0);
    group.add(beam);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 55);
    ctx.fillStyle = "#f5a623";
    ctx.font = "18px sans-serif";
    ctx.fillText("SPEED LIMIT 140 KM/H  ▲  KEEP LEFT", 256, 95);
    const texture = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    sign.position.set(0, 8.8, 0.1);
    group.add(sign);
    this.scene.add(group);
    if (this.physics && this.physics.addStaticCollider) {
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      const pLx = x - 16 * cosR;
      const pLz = z + 16 * sinR;
      const pRx = x + 16 * cosR;
      const pRz = z - 16 * sinR;
      this.physics.addStaticCollider(pLx - 0.6, pLx + 0.6, pLz - 0.6, pLz + 0.6, 10, "gantry-post");
      this.physics.addStaticCollider(pRx - 0.6, pRx + 0.6, pRz - 0.6, pRz + 0.6, 10, "gantry-post");
    }
  }
  createStreetlightNode(x, z) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 11, 8), poleMat);
    pole.position.set(x, 5.5, z);
    this.scene.add(pole);
    const light = new THREE.PointLight(0xfffaed, 0.85, 26);
    light.position.set(x > 0 ? x - 2.0 : x + 2.0, 10.5, z);
    this.scene.add(light);
    this.streetlights.push(light);
  }
  createRainSystem() {
    const rainCount = 1500;
    this.maxRainCount = 1500;
    this.activeRainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.65,
      transparent: true,
      opacity: 0.55
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }
  createProjectStations() {
    const projects = window.APP_CONFIG.PROJECTS;
    projects.forEach(p => {
      const station = this.buildStation(p);
      this.stations.push(station);
    });
  }
  buildStation(p) {
    const group = new THREE.Group();
    group.position.set(p.pos.x, 0, p.pos.z);
    const baseGeo = new THREE.CylinderGeometry(11, 12, 1.2, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;
    base.receiveShadow = true;
    group.add(base);
    const ringGeo = new THREE.RingGeometry(10.2, 11.2, 6);
    const ringMat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.22;
    group.add(ring);
    const sculpture = this.createSculpture(p);
    sculpture.position.y = 5.0;
    group.add(sculpture);
    this.createStationBillboard(group, p);
    const light = new THREE.PointLight(p.color, 2.0, 30);
    light.position.set(0, 6, 0);
    group.add(light);
    this.scene.add(group);
    this.animatedObjects.push({
      update: (time) => {
        sculpture.rotation.y = time * 0.75;
        sculpture.position.y = 5.0 + Math.sin(time * 2.0) * 0.3;
      }
    });
    return { ...p, group, radius: p.radius || 20.0 };
  }
  createSculpture(p) {
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.6,
      wireframe: true
    });
    if (p.id === "music-app") {
      const g = new THREE.Group();
      for (let b = 0; b < 5; b++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.5, 0.5), mat);
        bar.position.x = (b - 2) * 0.8;
        g.add(bar);
      }
      this.animatedObjects.push({
        update: (time) => {
          g.children.forEach((c, idx) => {
            c.scale.y = 0.4 + Math.abs(Math.sin(time * 3.5 + idx * 0.9)) * 1.5;
          });
        }
      });
      return g;
    } else if (p.id === "flappie") {
      const g = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(2.0, 0.14, 12, 32);
      const ring = new THREE.Mesh(ringGeo, mat);
      g.add(ring);
      const playGeo = new THREE.ConeGeometry(1.2, 1.8, 3);
      playGeo.rotateZ(-Math.PI / 2);
      const playMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });
      const playMesh = new THREE.Mesh(playGeo, playMat);
      g.add(playMesh);
      this.animatedObjects.push({
        update: (time) => {
          ring.rotation.z = time * 2.2;
          ring.rotation.x = Math.sin(time * 1.4) * 0.45;
          playMesh.rotation.y = time * 1.8;
        }
      });
      return g;
    } else {
      return new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 1), mat);
    }
  }
  createStationBillboard(group, p) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "#" + p.color.toString(16).padStart(6, "0");
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.title, 256, 95);
    ctx.fillStyle = "#" + p.color.toString(16).padStart(6, "0");
    ctx.font = "600 22px sans-serif";
    ctx.fillText(p.district, 256, 145);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px sans-serif";
    ctx.fillText("⚡ CHECKPOINT ZONE", 256, 205);
    const texture = new THREE.CanvasTexture(canvas);
    let billboardMat;
    if (window.CyberpunkShaders) {
      billboardMat = window.CyberpunkShaders.createHoloMaterial(texture, p.color);
      this.animatedObjects.push({
        update: (time) => {
          if (billboardMat.uniforms && billboardMat.uniforms.time) {
            billboardMat.uniforms.time.value = time;
          }
        }
      });
    } else {
      billboardMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    }
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 3.2), billboardMat);
    billboard.position.set(0, 3.2, 0.1);
    billboard.rotation.y = Math.PI;
    group.add(billboard);
  }
  createPhysicsProps() {
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x9c6530, roughness: 0.8 });
    const crateGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    [{ x: 14, y: 0.7, z: 12 }, { x: 15.6, y: 0.7, z: 12.2 }, { x: -16, y: 0.7, z: -14 }].forEach(pos => {
      const c = new THREE.Mesh(crateGeo, crateMat);
      c.position.set(pos.x, pos.y, pos.z);
      c.castShadow = true;
      this.scene.add(c);
      this.physics.addObstacle(c, "crate", 0.95, 1.3);
    });
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(8.5, 0); shape.lineTo(0, 2.8); shape.closePath();
    const rampGeo = new THREE.ExtrudeGeometry(shape, { depth: 5.5, bevelEnabled: false });
    rampGeo.center();
    const ramp = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.4 }));
    ramp.rotation.y = Math.PI / 2;
    ramp.position.set(24, 1.4, -20);
    ramp.receiveShadow = true;
    this.scene.add(ramp);
    this.createPlaza3DControlsGraphic();
  }
  createPlaza3DControlsGraphic() {
    const group = new THREE.Group();
    group.position.set(7.5, 0.04, -10.5);
    group.rotation.y = -Math.PI / 10;
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      roughness: 0.6,
      metalness: 0.2
    });
    const boardGeo = new THREE.BoxGeometry(6.4, 0.14, 4.2);
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.07;
    board.receiveShadow = true;
    group.add(board);
    const normalKeyMat = new THREE.MeshStandardMaterial({
      color: 0x242e40,
      roughness: 0.7
    });
    const glowKeyMat = new THREE.MeshStandardMaterial({
      color: 0xffb84d,
      emissive: 0xffa020,
      emissiveIntensity: 0.85,
      roughness: 0.25
    });
    const keyGeo = new THREE.BoxGeometry(0.48, 0.12, 0.48);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        const kx = (c - 4.5) * 0.58;
        const kz = (r - 1.5) * 0.58;
        const isW = (r === 1 && c === 2);
        const isA = (r === 2 && c === 1);
        const isS = (r === 2 && c === 2);
        const isD = (r === 2 && c === 3);
        const key = new THREE.Mesh(keyGeo, (isW || isA || isS || isD) ? glowKeyMat : normalKeyMat);
        key.position.set(kx, 0.18, kz);
        group.add(key);
      }
    }
    const spaceGeo = new THREE.BoxGeometry(2.8, 0.12, 0.52);
    const spaceKey = new THREE.Mesh(spaceGeo, glowKeyMat);
    spaceKey.position.set(-0.5, 0.18, 1.25);
    group.add(spaceKey);
    const arrowMatRed = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
    const arrowMatBlue = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const redArrowShape = new THREE.Shape();
    redArrowShape.moveTo(0, 1.6);
    redArrowShape.lineTo(0.65, 0);
    redArrowShape.lineTo(0.24, 0);
    redArrowShape.lineTo(0.24, -1.0);
    redArrowShape.lineTo(-0.24, -1.0);
    redArrowShape.lineTo(-0.24, 0);
    redArrowShape.lineTo(-0.65, 0);
    redArrowShape.closePath();
    const redArrow = new THREE.Mesh(
      new THREE.ExtrudeGeometry(redArrowShape, { depth: 0.08, bevelEnabled: false }),
      arrowMatRed
    );
    redArrow.rotation.x = -Math.PI / 2;
    redArrow.position.set(-3.6, 0.1, 0.2);
    group.add(redArrow);
    const blueArrowShape = new THREE.Shape();
    blueArrowShape.moveTo(1.2, 0);
    blueArrowShape.lineTo(0, 0.5);
    blueArrowShape.lineTo(0, 0.18);
    blueArrowShape.lineTo(-0.9, 0.18);
    blueArrowShape.lineTo(-0.9, -0.18);
    blueArrowShape.lineTo(0, -0.18);
    blueArrowShape.lineTo(0, -0.5);
    blueArrowShape.closePath();
    const blueArrow = new THREE.Mesh(
      new THREE.ExtrudeGeometry(blueArrowShape, { depth: 0.08, bevelEnabled: false }),
      arrowMatBlue
    );
    blueArrow.rotation.x = -Math.PI / 2;
    blueArrow.position.set(-3.0, 0.1, 1.3);
    group.add(blueArrow);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x3e4756, roughness: 0.8 });
    const lanternGlow = new THREE.MeshBasicMaterial({ color: 0xffb84d });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8), lanternMat);
    post.position.set(4.5, 1.6, -1.2);
    group.add(post);
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), lanternGlow);
    lightBox.position.set(4.5, 3.5, -1.2);
    group.add(lightBox);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 4), lanternMat);
    roof.position.set(4.5, 4.3, -1.2);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    const lanternLight = new THREE.PointLight(0xffaa33, 1.4, 18);
    lanternLight.position.set(4.5, 3.6, -1.2);
    group.add(lanternLight);
    this.scene.add(group);
  }
  createPlazaLantern(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x3e4756, roughness: 0.8 });
    const lanternGlow = new THREE.MeshBasicMaterial({ color: 0xffb84d });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8), lanternMat);
    post.position.set(0, 1.6, 0);
    group.add(post);
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), lanternGlow);
    lightBox.position.set(0, 3.5, 0);
    group.add(lightBox);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 4), lanternMat);
    roof.position.set(0, 4.3, 0);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    const lanternLight = new THREE.PointLight(0xffaa33, 1.4, 18);
    lanternLight.position.set(0, 3.6, 0);
    group.add(lanternLight);
    this.scene.add(group);
    return group;
  }
  applyWeather(weatherKey) {
    const preset = window.APP_CONFIG.WEATHER[weatherKey];
    if (!preset) return;
    this.currentWeather = weatherKey;
    const fogMult = this.fogMultiplier || 1.0;
    const computedDensity = preset.fogDensity * fogMult;
    if (this.scene.fog) {
      this.scene.fog.color.setHex(preset.fogColor);
      this.scene.fog.density = computedDensity;
    } else {
      this.scene.fog = new THREE.FogExp2(preset.fogColor, computedDensity);
    }
    if (this.scene.background) {
      this.scene.background.setHex(preset.skyColor);
    } else {
      this.scene.background = new THREE.Color(preset.skyColor);
    }
    this.hemiLight.color.setHex(preset.hemiSky);
    this.hemiLight.groundColor.setHex(preset.hemiGround);
    this.sunLight.color.setHex(preset.sunColor);
    this.sunLight.intensity = preset.sunIntensity;
    if (this.roadMaterial) {
      this.roadMaterial.roughness = preset.roadRoughness;
    }
    this.streetlights.forEach(l => {
      l.visible = preset.streetlightsOn;
    });
    if (this.rainParticles) {
      this.rainParticles.visible = preset.rain;
    }
    if (this.sakuraPetals) {
      this.sakuraPetals.visible = preset.sakuraPetals !== false;
    }
    if (window.onWeatherChange) {
      window.onWeatherChange(preset);
    }
  }
  cycleWeather() {
    const keys = Object.keys(window.APP_CONFIG.WEATHER);
    const currentIndex = keys.indexOf(this.currentWeather);
    const nextKey = keys[(currentIndex + 1) % keys.length];
    this.applyWeather(nextKey);
    return nextKey;
  }
  setQualityTier(tier, camera) {
    this.qualityTier = tier;
    const isHigh = (tier === "HIGH");
    const isMed = (tier === "MEDIUM");
    const isLow = (tier === "LOW");
    if (this.sunLight) {
      this.sunLight.castShadow = isHigh;
    }
    if (this.walkerContactShadow) {
      this.walkerContactShadow.visible = !isHigh;
    }
    if (isHigh) {
      this.activePetalCount = 600;
      this.activeRainCount = 1500;
      this.fogMultiplier = 1.0;
      if (camera) camera.far = 900;
    } else if (isMed) {
      this.activePetalCount = 200;
      this.activeRainCount = 500;
      this.fogMultiplier = 1.35;
      if (camera) camera.far = 600;
    } else {
      this.activePetalCount = 60;
      this.activeRainCount = 150;
      this.fogMultiplier = 1.85;
      if (camera) camera.far = 420;
    }
    if (camera && typeof camera.updateProjectionMatrix === "function") {
      camera.updateProjectionMatrix();
    }
    if (this.sakuraPetals && this.sakuraPetals.geometry) {
      this.sakuraPetals.geometry.setDrawRange(0, this.activePetalCount);
    }
    if (this.rainParticles && this.rainParticles.geometry) {
      this.rainParticles.geometry.setDrawRange(0, this.activeRainCount);
    }
    const preset = (window.APP_CONFIG && window.APP_CONFIG.WEATHER) ? window.APP_CONFIG.WEATHER[this.currentWeather] : null;
    if (preset && this.scene.fog) {
      this.scene.fog.density = preset.fogDensity * this.fogMultiplier;
    }
  }
  addSkidMark(x, z, angle) {
    const geo = new THREE.PlaneGeometry(0.42, 0.85);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const mark = new THREE.Mesh(geo, mat);
    mark.rotation.x = -Math.PI / 2;
    mark.rotation.z = angle;
    mark.position.set(x, 0.048, z);
    this.scene.add(mark);
    this.skidMarks.push({ mesh: mark });
    if (this.skidMarks.length > 120) {
      const oldest = this.skidMarks.shift();
      this.scene.remove(oldest.mesh);
    }
  }
  spawnExhaustPuff(carPos, carRot) {
    const pGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x8898aa, transparent: true, opacity: 0.4 });
    const puff = new THREE.Mesh(pGeo, pMat);
    puff.position.set(
      carPos.x - Math.sin(carRot) * 2.1 + (Math.random() - 0.5) * 0.4,
      0.35 + Math.random() * 0.15,
      carPos.z - Math.cos(carRot) * 2.1 + (Math.random() - 0.5) * 0.4
    );
    this.scene.add(puff);
    this.exhaustPuffs.push({ mesh: puff, life: 1.0 });
  }
  update(dt, time, carPos) {
    this.animatedObjects.forEach(item => item.update(time));
    if (this.sakuraPetals && this.sakuraPetals.visible && carPos) {
      const pos = this.sakuraPetals.geometry.attributes.position.array;
      const vel = this.sakuraPetals.geometry.attributes.velocity.array;
      const petalLimit = Math.min(pos.length, (this.activePetalCount || 600) * 3);
      for (let i = 0; i < petalLimit; i += 3) {
        pos[i] += Math.sin(time * 1.5 + i) * 0.18 + vel[i] * dt;
        pos[i + 1] += vel[i + 1] * dt * 5.0;
        pos[i + 2] += Math.cos(time * 1.2 + i) * 0.15 + vel[i + 2] * dt;
        if (pos[i + 1] < 0.2) {
          pos[i] = carPos.x + (Math.random() - 0.5) * 220;
          pos[i + 1] = 18.0 + Math.random() * 10.0;
          pos[i + 2] = carPos.z + (Math.random() - 0.5) * 220;
        }
      }
      this.sakuraPetals.geometry.attributes.position.needsUpdate = true;
    }
    if (this.rainParticles && this.rainParticles.visible && carPos) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      const rainLimit = Math.min(pos.length, (this.activeRainCount || 1500) * 3);
      for (let i = 1; i < rainLimit; i += 3) {
        pos[i] -= dt * 65;
        if (pos[i] < 0) pos[i] = 80;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
      this.rainParticles.position.x = carPos.x;
      this.rainParticles.position.z = carPos.z;
    }
    for (let i = this.exhaustPuffs.length - 1; i >= 0; i--) {
      const p = this.exhaustPuffs[i];
      p.life -= dt * 2.2;
      p.mesh.position.y += dt * 0.9;
      p.mesh.scale.multiplyScalar(1.0 + dt * 1.8);
      p.mesh.material.opacity = p.life * 0.4;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.exhaustPuffs.splice(i, 1);
      }
    }
    if (this.sunLight && carPos) {
      this.sunLight.position.x = carPos.x + 160;
      this.sunLight.position.z = carPos.z + 110;
    }
    if (this.celestialPortalRings) {
      this.celestialPortalRings.forEach((ring, i) => {
        ring.rotation.z += dt * (i % 2 === 0 ? 0.65 : -0.85);
      });
    }
    if (this.celestialImages) {
      this.celestialImages.forEach((item, idx) => {
        if (item.userData.isDocked) {
          const hoverOffset = Math.sin(time * 1.8 + idx * 2.0) * 0.45;
          item.mesh.position.y = item.userData.targetPos.y + hoverOffset;
          item.mesh.rotation.x = -1.18 + Math.sin(time * 1.2 + idx) * 0.04;
          item.mesh.rotation.y = Math.PI + Math.sin(time * 0.8 + idx) * 0.08;
          return;
        }
        if (item.userData.isAscending) {
          item.userData.progress += dt / 4.2;
          const p = Math.min(1.0, item.userData.progress);
          const start = item.userData.startPos;
          const end = item.userData.targetPos;
          const midY = (start.y + end.y) * 0.5 + 16.0;
          const curX = THREE.MathUtils.lerp(start.x, end.x, p);
          const curZ = THREE.MathUtils.lerp(start.z, end.z, p);
          const curY = (1 - p) * (1 - p) * start.y + 2 * (1 - p) * p * midY + p * p * end.y;
          item.mesh.position.set(curX, curY, curZ);
          const scale = 0.2 + p * 0.8;
          item.mesh.scale.set(scale, scale, scale);
          item.mesh.rotation.y = (1.0 - p) * Math.PI * 4.0 + Math.PI;
          item.mesh.rotation.x = -1.18 * p;
          if (p >= 1.0) {
            item.userData.isAscending = false;
            item.userData.isDocked = true;
            item.mesh.position.copy(end);
            item.mesh.scale.set(1.0, 1.0, 1.0);
            item.mesh.rotation.set(-1.18, Math.PI, 0);
            if (this.skyShrines && this.skyShrines[idx]) {
              this.skyShrines[idx].visible = true;
            }
            if (window.soundEngine) {
              window.soundEngine.playChime();
            }
          }
        }
      });
    }
    if (this.walkerGroup && this.physics) {
      if (this.physics.mode === "WALKING") {
        this.walkerGroup.visible = true;
        this.walkerGroup.position.set(this.physics.walkerX, this.physics.walkerY, this.physics.walkerZ);
        this.walkerGroup.rotation.y = this.physics.walkerRotation;
        const isMoving = Boolean(this.physics.walkerIsMoving);
        const isRunning = Boolean(this.physics.walkerIsRunning);
        const moveSpeed = Math.abs(this.physics.walkerSpeed || 0);
        if (this.activeCharacter === "MIYU" && this.miyuLoaded && this.miyuBones) {
          const b = this.miyuBones;
          const isAiming = Boolean(this.isAiming);
          const rawSpeed = this.physics.walkerSpeed || 0;
          const isForward = rawSpeed >= 0;
          if (this.miyuRecoilTimer > 0) {
            this.miyuRecoilTimer = Math.max(0, this.miyuRecoilTimer - dt);
          }
          const recoilProgress = (this.miyuRecoilTimer > 0) ? Math.max(0, this.miyuRecoilTimer / 0.35) : 0;
          const recoilKick = Math.sin(recoilProgress * Math.PI);
          const axisUpperL = new THREE.Vector3(0.9757, 0.0980, 0.1961).normalize();
          const axisUpperR = new THREE.Vector3(-0.7009, 0.0570, 0.7110).normalize();
          const axisLowerL = new THREE.Vector3(0.9752, 0.1376, 0.1732).normalize();
          const axisLowerR = new THREE.Vector3(-0.2607, 0.0164, 0.9653).normalize();
          if (isMoving && moveSpeed > 0.2) {
            const cadence = isRunning ? 20.0 : 12.0;
            this.walkerWalkPhase = (this.walkerWalkPhase || 0) + dt * cadence * (isForward ? 1.0 : -1.0);
            const phase = this.walkerWalkPhase;
            const strideAmp = isRunning ? 0.52 : 0.35;
            const stride = Math.sin(phase) * strideAmp;
            if (b.Hips_177 && b.Hips_177.userData.restPos) {
              const hipBounce = Math.abs(Math.sin(phase)) * (isRunning ? 0.035 : 0.018);
              b.Hips_177.position.y = b.Hips_177.userData.restPos.y + hipBounce;
              b.Hips_177.quaternion.copy(b.Hips_177.userData.restQuat);
              const qSway = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(phase) * 0.04);
              b.Hips_177.quaternion.multiply(qSway);
            }
            if (b.UpperLeg_L_20 && b.UpperLeg_L_20.userData.restQuat) {
              const qL = new THREE.Quaternion().setFromAxisAngle(axisUpperL, -stride);
              b.UpperLeg_L_20.quaternion.copy(b.UpperLeg_L_20.userData.restQuat).multiply(qL);
            }
            if (b.UpperLeg_R_16 && b.UpperLeg_R_16.userData.restQuat) {
              const qR = new THREE.Quaternion().setFromAxisAngle(axisUpperR, stride);
              b.UpperLeg_R_16.quaternion.copy(b.UpperLeg_R_16.userData.restQuat).multiply(qR);
            }
            if (b.LowerLeg_L_19 && b.LowerLeg_L_19.userData.restQuat) {
              const kneeL = (stride < 0) ? -stride * 1.35 : 0.02;
              const qKneeL = new THREE.Quaternion().setFromAxisAngle(axisLowerL, -kneeL);
              b.LowerLeg_L_19.quaternion.copy(b.LowerLeg_L_19.userData.restQuat).multiply(qKneeL);
            }
            if (b.LowerLeg_R_15 && b.LowerLeg_R_15.userData.restQuat) {
              const kneeR = (stride > 0) ? stride * 1.35 : 0.02;
              const qKneeR = new THREE.Quaternion().setFromAxisAngle(axisLowerR, -kneeR);
              b.LowerLeg_R_15.quaternion.copy(b.LowerLeg_R_15.userData.restQuat).multiply(qKneeR);
            }
            if (b.Spine_176 && b.Spine_176.userData.restQuat) {
              const qSpine = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), isRunning ? 0.16 : 0.05);
              b.Spine_176.quaternion.copy(b.Spine_176.userData.restQuat).multiply(qSpine);
            }
            if (isAiming || recoilKick > 0) {
              this.applyMiyuAimAndRecoil(b, dt, time, recoilKick, isAiming, isRunning);
            } else {
              if (b.UpperArm_R_145 && b.UpperArm_R_145.userData.restQuat) {
                const qArmR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.38 + Math.sin(phase) * 0.07);
                b.UpperArm_R_145.quaternion.copy(b.UpperArm_R_145.userData.restQuat).multiply(qArmR);
              }
              if (b.UpperArm_L_165 && b.UpperArm_L_165.userData.restQuat) {
                const qArmL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.52 - Math.sin(phase) * 0.07);
                b.UpperArm_L_165.quaternion.copy(b.UpperArm_L_165.userData.restQuat).multiply(qArmL);
              }
            }
          } else {
            const breath = Math.sin(time * 2.0) * 0.032;
            if (b.Hips_177 && b.Hips_177.userData.restPos) {
              b.Hips_177.position.y = b.Hips_177.userData.restPos.y + breath * 0.005;
              b.Hips_177.quaternion.copy(b.Hips_177.userData.restQuat);
            }
            if (b.Spine_176 && b.Spine_176.userData.restQuat) {
              const qBreath = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), breath * 0.6);
              b.Spine_176.quaternion.copy(b.Spine_176.userData.restQuat).multiply(qBreath);
            }
            if (b.Head_125 && b.Head_125.userData.restQuat) {
              const headNod = Math.sin(time * 1.5) * 0.025;
              const qHead = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), headNod);
              b.Head_125.quaternion.copy(b.Head_125.userData.restQuat).multiply(qHead);
            }
            if (b.UpperLeg_L_20 && b.UpperLeg_L_20.userData.restQuat) b.UpperLeg_L_20.quaternion.copy(b.UpperLeg_L_20.userData.restQuat);
            if (b.UpperLeg_R_16 && b.UpperLeg_R_16.userData.restQuat) b.UpperLeg_R_16.quaternion.copy(b.UpperLeg_R_16.userData.restQuat);
            if (b.LowerLeg_L_19 && b.LowerLeg_L_19.userData.restQuat) b.LowerLeg_L_19.quaternion.copy(b.LowerLeg_L_19.userData.restQuat);
            if (b.LowerLeg_R_15 && b.LowerLeg_R_15.userData.restQuat) b.LowerLeg_R_15.quaternion.copy(b.LowerLeg_R_15.userData.restQuat);
            if (isAiming || recoilKick > 0) {
              this.applyMiyuAimAndRecoil(b, dt, time, recoilKick, isAiming, false);
            } else {
              if (b.UpperArm_R_145 && b.UpperArm_R_145.userData.restQuat) {
                const qArmR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.28 + breath * 0.35);
                b.UpperArm_R_145.quaternion.copy(b.UpperArm_R_145.userData.restQuat).multiply(qArmR);
              }
              if (b.UpperArm_L_165 && b.UpperArm_L_165.userData.restQuat) {
                const qArmL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.44 + breath * 0.35);
                b.UpperArm_L_165.quaternion.copy(b.UpperArm_L_165.userData.restQuat).multiply(qArmL);
              }
            }
          }
          return;
        }
        if (this.isUsingGusionModel && this.minatoPelvis) {
          if (this.heroChakraRing) {
            this.heroChakraRing.rotation.z += dt * (isRunning ? 4.5 : 1.5);
            const ringScale = isRunning ? (1.0 + Math.sin(time * 8.0) * 0.22) : 1.0;
            this.heroChakraRing.scale.set(ringScale, ringScale, 1.0);
            this.heroChakraRing.material.opacity = isRunning ? 0.75 : 0.35;
          }
          if (this.minatoIsThrowing) {
            this.minatoThrowTimer = (this.minatoThrowTimer || 0) + dt;
            if (this.minatoThrowTimer <= 0.12) {
              const w = this.minatoThrowTimer / 0.12;
              this.minatoRightShoulder.rotation.x = -0.85 * w;
              this.minatoRightShoulder.rotation.z = -0.66 + 0.35 * w;
              this.minatoTorso.rotation.x = -0.08 * w;
            } else if (this.minatoThrowTimer <= 0.40) {
              const p = (this.minatoThrowTimer - 0.12) / 0.28;
              this.minatoRightShoulder.rotation.x = -0.85 + 2.15 * Math.sin(p * Math.PI * 0.5);
              this.minatoRightShoulder.rotation.z = -0.31 - 0.35 * p;
              this.minatoTorso.rotation.x = 0.18 * Math.sin(p * Math.PI);
            } else {
              this.minatoRightShoulder.rotation.x *= 0.85;
              this.minatoRightShoulder.rotation.z = -0.66;
            }
          }
          if (isMoving && moveSpeed > 0.2) {
            const cadence = isRunning ? 22.0 : 12.0;
            const isFwd = (this.physics.walkerSpeed || 0) >= 0;
            this.walkerWalkPhase = (this.walkerWalkPhase || 0) + dt * cadence * (isFwd ? 1.0 : -1.0);
            const phase = this.walkerWalkPhase;
            const strideAmp = isRunning ? 0.44 : 0.28;
            const stride = Math.sin(phase) * strideAmp;
            const bob = Math.abs(Math.sin(phase)) * (isRunning ? 0.05 : 0.028);
            this.minatoPelvis.position.y = 0.88 + bob;
            this.minatoLeftHip.rotation.x = stride;
            this.minatoRightHip.rotation.x = -stride;
            const kneeAmp = isRunning ? 0.72 : 0.52;
            this.minatoLeftKnee.rotation.x = (stride < 0) ? -stride * kneeAmp : 0.04;
            this.minatoRightKnee.rotation.x = (stride > 0) ? stride * kneeAmp : 0.04;
            if (isRunning) {
              this.minatoTorso.rotation.x = 0.22;
              this.minatoHead.rotation.x = -0.16;
              this.minatoLeftShoulder.rotation.x = 0.95 + Math.sin(phase) * 0.12;
              this.minatoLeftShoulder.rotation.z = 0.25;
              if (!this.minatoIsThrowing) {
                this.minatoRightShoulder.rotation.x = 0.95 - Math.sin(phase) * 0.12;
                this.minatoRightShoulder.rotation.z = -0.25;
              }
            } else {
              this.minatoTorso.rotation.x = 0.05;
              this.minatoTorso.rotation.y = -stride * 0.10;
              this.minatoHead.rotation.x = 0;
              this.minatoLeftShoulder.rotation.x = -stride * 0.75;
              this.minatoLeftShoulder.rotation.z = 0.66;
              if (!this.minatoIsThrowing) {
                this.minatoRightShoulder.rotation.x = stride * 0.75;
                this.minatoRightShoulder.rotation.z = -0.66;
              }
            }
          } else {
            this.minatoPelvis.position.y = 0.88 + Math.sin(time * 2.0) * 0.01;
            this.minatoTorso.rotation.x = Math.sin(time * 2.0) * 0.015;
            this.minatoTorso.rotation.y *= 0.85;
            this.minatoHead.rotation.x = Math.sin(time * 2.0) * 0.01;
            this.minatoLeftShoulder.rotation.x *= 0.85;
            this.minatoLeftShoulder.rotation.z = 0.66;
            if (!this.minatoIsThrowing) {
              this.minatoRightShoulder.rotation.x *= 0.85;
              this.minatoRightShoulder.rotation.z = -0.66;
            }
            this.minatoLeftHip.rotation.x *= 0.85;
            this.minatoRightHip.rotation.x *= 0.85;
            this.minatoLeftKnee.rotation.x = 0.02;
            this.minatoRightKnee.rotation.x = 0.02;
          }
          return;
        }
        if (isMoving && moveSpeed > 0.2) {
          const cadence = isRunning ? 22.0 : 12.0;
          this.walkerWalkPhase = (this.walkerWalkPhase || 0) + dt * cadence;
          const phase = this.walkerWalkPhase;
          const strideAmp = isRunning ? 0.82 : 0.42;
          const leftStride = Math.sin(phase) * strideAmp;
          const rightStride = -leftStride;
          if (this.walkerLeftThigh) this.walkerLeftThigh.rotation.x = leftStride;
          if (this.walkerRightThigh) this.walkerRightThigh.rotation.x = rightStride;
          const kneeBendAmp = isRunning ? 1.25 : 0.65;
          if (this.walkerLeftKnee) {
            this.walkerLeftKnee.rotation.x = (leftStride < 0) ? Math.abs(leftStride) * kneeBendAmp : 0.06;
          }
          if (this.walkerRightKnee) {
            this.walkerRightKnee.rotation.x = (rightStride < 0) ? Math.abs(rightStride) * kneeBendAmp : 0.06;
          }
          const armAmp = isRunning ? 0.95 : 0.45;
          if (this.walkerLeftShoulder) this.walkerLeftShoulder.rotation.x = -leftStride * (isRunning ? 1.15 : 0.85);
          if (this.walkerRightShoulder) this.walkerRightShoulder.rotation.x = -rightStride * (isRunning ? 1.15 : 0.85);
          const elbowAngle = isRunning ? 1.35 : 0.35;
          if (this.walkerLeftElbow) this.walkerLeftElbow.rotation.x = elbowAngle;
          if (this.walkerRightElbow) this.walkerRightElbow.rotation.x = elbowAngle;
          const targetLean = isRunning ? 0.26 : 0.09;
          if (this.walkerTorso) this.walkerTorso.rotation.x = targetLean;
          const bob = Math.abs(Math.sin(phase)) * (isRunning ? 0.07 : 0.035);
          if (this.walkerHips) this.walkerHips.position.y = 0.88 + bob;
          if (this.walkerScarf) {
            this.walkerScarf.rotation.x = isRunning ? 0.85 : 0.42;
            this.walkerScarf.rotation.z = Math.sin(phase * 1.5) * (isRunning ? 0.45 : 0.22);
          }
        } else {
          if (this.walkerLeftThigh) this.walkerLeftThigh.rotation.x *= 0.82;
          if (this.walkerRightThigh) this.walkerRightThigh.rotation.x *= 0.82;
          if (this.walkerLeftKnee) this.walkerLeftKnee.rotation.x *= 0.82;
          if (this.walkerRightKnee) this.walkerRightKnee.rotation.x *= 0.82;
          if (this.walkerLeftShoulder) this.walkerLeftShoulder.rotation.x *= 0.82;
          if (this.walkerRightShoulder) this.walkerRightShoulder.rotation.x *= 0.82;
          if (this.walkerLeftElbow) this.walkerLeftElbow.rotation.x = 0.15;
          if (this.walkerRightElbow) this.walkerRightElbow.rotation.x = 0.15;
          if (this.walkerTorso) this.walkerTorso.rotation.x = Math.sin(time * 2.0) * 0.015;
          if (this.walkerHips) this.walkerHips.position.y = 0.88 + Math.sin(time * 2.0) * 0.01;
          if (this.walkerScarf) this.walkerScarf.rotation.z = Math.sin(time * 1.8) * 0.08;
        }
      } else {
        this.walkerGroup.visible = false;
      }
    }
  }
  createCelestialSkyway() {
    this.celestialImages = [];
    this.celestialPortalRings = [];
    this.celestialVortex = null;
    this.celestialParticles = [];
    this.skyShrines = [];
    this.walkerGroup = null;
    this.walkerHips = null;
    this.walkerTorso = null;
    this.walkerHeadGroup = null;
    this.walkerScarf = null;
    this.walkerLeftShoulder = null;
    this.walkerRightShoulder = null;
    this.walkerLeftElbow = null;
    this.walkerRightElbow = null;
    this.walkerLeftThigh = null;
    this.walkerRightThigh = null;
    this.walkerLeftKnee = null;
    this.walkerRightKnee = null;
    this.walkerWalkPhase = 0;
    const skywayGroup = new THREE.Group();
    this.scene.add(skywayGroup);
    this.createSkywayEntranceCheckpoint(skywayGroup);
    this.createSkywayRamp(skywayGroup);
    this.createSkywaySanctuaryPlatform(skywayGroup);
    this.createGateOfLightPortal(skywayGroup);
    this.createCelestialImageFrames(skywayGroup);
    this.createWalkerAvatar();
  }
  createSkywayEntranceCheckpoint(parent) {
    const entrance = new THREE.Group();
    entrance.position.set(0, 0.05, 475);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.8, roughness: 0.2 });
    const postGeo = new THREE.BoxGeometry(0.8, 6.0, 0.8);
    const leftPost = new THREE.Mesh(postGeo, towerMat);
    leftPost.position.set(-8.5, 3.0, 0);
    const rightPost = new THREE.Mesh(postGeo, towerMat);
    rightPost.position.set(8.5, 3.0, 0);
    entrance.add(leftPost, rightPost);
    const beamGeo = new THREE.BoxGeometry(18.0, 1.2, 1.0);
    const beam = new THREE.Mesh(beamGeo, towerMat);
    beam.position.set(0, 5.8, 0);
    entrance.add(beam);
    const barrierGeo = new THREE.CylinderGeometry(0.12, 0.12, 16.5, 16);
    barrierGeo.rotateZ(Math.PI / 2);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff3366,
      emissiveIntensity: 0.8
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(0, 0.85, 0);
    entrance.add(barrier);
    this.createPlazaLantern(-9.5, 475);
    this.createPlazaLantern(9.5, 475);
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const ctx = signCanvas.getContext("2d");
    ctx.fillStyle = "rgba(10, 16, 26, 0.92)";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 236);
    ctx.fillStyle = "#f5a623";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦ JALAN LAYANG LANGIT // CELESTIAL SKYWAY ✦", 512, 75);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("PANJANG JALAN: 500 METER • MENUJU PINTU CAHAYA", 512, 135);
    ctx.fillStyle = "#00f0ff";
    ctx.font = "26px monospace";
    ctx.fillText("🚶 KHUSUS PEJALAN KAKI — KELUAR DARI MOBIL (TEKAN F)", 512, 195);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(16.0, 4.0), signMat);
    signBoard.position.set(0, 7.8, 0);
    signBoard.rotation.y = Math.PI;
    entrance.add(signBoard);
    parent.add(entrance);
  }
  createSkywayRamp(parent) {
    const rampLength = 500.0;
    const rampHeight = 31.95;
    const slopeDist = Math.hypot(rampLength, rampHeight);
    const inclineAngle = Math.atan2(rampHeight, rampLength);
    const rampWidth = 18.0;
    const girderGeo = new THREE.BoxGeometry(rampWidth, 2.6, slopeDist);
    const girderMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.75,
      metalness: 0.2
    });
    const girderMesh = new THREE.Mesh(girderGeo, girderMat);
    girderMesh.rotation.x = -Math.PI / 2 + inclineAngle;
    girderMesh.position.set(0, 0.05 + rampHeight / 2 - 1.3, 475 + rampLength / 2);
    girderMesh.receiveShadow = true;
    girderMesh.castShadow = true;
    parent.add(girderMesh);
    this.skywayRamp = girderMesh;
    const roadCanvas = document.createElement("canvas");
    roadCanvas.width = 512;
    roadCanvas.height = 2048;
    const rCtx = roadCanvas.getContext("2d");
    rCtx.fillStyle = "#1e222a";
    rCtx.fillRect(0, 0, 512, 2048);
    const imgData = rCtx.getImageData(0, 0, 512, 2048);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      d[i] = Math.max(0, Math.min(255, d[i] + noise));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
    }
    rCtx.putImageData(imgData, 0, 0);
    const kerbW = 32;
    const kerbStep = 64;
    for (let y = 0; y < 2048; y += kerbStep) {
      const isRed = (Math.floor(y / kerbStep) % 2 === 0);
      rCtx.fillStyle = isRed ? "#e63946" : "#f8f9fa";
      rCtx.fillRect(0, y, kerbW, kerbStep);
      rCtx.fillRect(512 - kerbW, y, kerbW, kerbStep);
    }
    rCtx.fillStyle = "#ffffff";
    rCtx.fillRect(kerbW + 4, 0, 8, 2048);
    rCtx.fillRect(512 - kerbW - 12, 0, 8, 2048);
    rCtx.fillStyle = "#ffb703";
    rCtx.fillRect(256 - 9, 0, 6, 2048);
    rCtx.fillRect(256 + 3, 0, 6, 2048);
    rCtx.fillStyle = "#ffffff";
    const dashLen = 48, dashGap = 36;
    for (let y = 0; y < 2048; y += dashLen + dashGap) {
      rCtx.fillRect(144 - 3, y, 6, dashLen);
      rCtx.fillRect(368 - 3, y, 6, dashLen);
    }
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 16);
    const roadGeo = new THREE.PlaneGeometry(rampWidth, slopeDist);
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.55,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2 + inclineAngle;
    roadMesh.position.set(0, 0.05 + rampHeight / 2 + 0.03, 475 + rampLength / 2);
    roadMesh.receiveShadow = true;
    parent.add(roadMesh);
    const studGeo = new THREE.BoxGeometry(0.22, 0.08, 0.35);
    const studMatAmber = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const studMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let sz = 485; sz <= 965; sz += 18) {
      const sProgress = (sz - 475) / 500.0;
      const sY = 0.05 + sProgress * 31.95 + 0.06;
      const centerStud = new THREE.Mesh(studGeo, studMatAmber);
      centerStud.rotation.x = -Math.PI / 2 + inclineAngle;
      centerStud.position.set(0, sY, sz);
      parent.add(centerStud);
      [-7.8, 7.8].forEach(sx => {
        const sideStud = new THREE.Mesh(studGeo, studMatCyan);
        sideStud.rotation.x = -Math.PI / 2 + inclineAngle;
        sideStud.position.set(sx, sY, sz);
        parent.add(sideStud);
      });
    }
    [-8.65, 8.65].forEach((sideX, sideIdx) => {
      const barrierGeo = new THREE.BoxGeometry(0.7, 1.25, slopeDist);
      const barrierMat = new THREE.MeshStandardMaterial({
        color: 0x3a4454,
        roughness: 0.6,
        metalness: 0.2
      });
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.rotation.x = -Math.PI / 2 + inclineAngle;
      barrier.position.set(sideX, 0.05 + rampHeight / 2 + 0.625, 475 + rampLength / 2);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      parent.add(barrier);
      const railGeo = new THREE.CylinderGeometry(0.12, 0.12, slopeDist, 10);
      railGeo.rotateX(Math.PI / 2 - inclineAngle);
      const railColor = sideIdx === 0 ? 0x00f0ff : 0xf5a623;
      const railMat = new THREE.MeshStandardMaterial({
        color: railColor,
        emissive: railColor,
        emissiveIntensity: 0.9,
        roughness: 0.2
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(sideX, 0.05 + rampHeight / 2 + 1.35, 475 + rampLength / 2);
      parent.add(rail);
    });
    for (let pz = 515; pz <= 945; pz += 50) {
      const pRatio = (pz - 475) / 500.0;
      const curY = 0.05 + pRatio * 31.95;
      [-8.2, 8.2].forEach(px => {
        const pylonHeight = curY + 22.0;
        const pylonGeo = new THREE.CylinderGeometry(1.5, 2.2, pylonHeight, 16);
        const pylonMat = new THREE.MeshStandardMaterial({
          color: 0x1f2736,
          roughness: 0.75,
          metalness: 0.25
        });
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(px, curY / 2 - 11.0, pz);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        parent.add(pylon);
      });
      const beamGeo = new THREE.BoxGeometry(19.5, 2.2, 3.2);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x18202d, roughness: 0.8 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, curY - 1.8, pz);
      beam.castShadow = true;
      parent.add(beam);
    }
    for (let lz = 495; lz <= 945; lz += 36) {
      const lRatio = (lz - 475) / 500.0;
      const lampRoadY = 0.05 + lRatio * 31.95;
      const isLeft = ((Math.floor((lz - 475) / 36)) % 2 === 0);
      const lampX = isLeft ? -9.1 : 9.1;
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lampX, lampRoadY, lz);
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.2, 10);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.3 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(0, 3.1, 0);
      lampGroup.add(pole);
      const armGeo = new THREE.BoxGeometry(2.2, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(isLeft ? 1.0 : -1.0, 6.1, 0);
      lampGroup.add(arm);
      const headGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(isLeft ? 2.0 : -2.0, 6.0, 0);
      lampGroup.add(head);
      const glowGeo = new THREE.PlaneGeometry(0.65, 0.32);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.set(isLeft ? 2.0 : -2.0, 5.92, 0);
      lampGroup.add(glow);
      parent.add(lampGroup);
    }
    const gantryPositions = [
      { z: 530, title: "首都高速 湾岸線 [11] WANGAN EXPWY", sub: "↑ CELESTIAL SKYWAY & SANCTUARY 500m" },
      { z: 710, title: "首都高 聖域区間 SANCTUARY SECTOR", sub: "↑ GRAND SHRINE & GATE OF LIGHT 250m" },
      { z: 890, title: "CELESTIAL SKYWAY // ARRIVAL AHEAD", sub: "★ ゲート PINTU CAHAYA SANCTUARY 80m" }
    ];
    gantryPositions.forEach(gp => {
      const gRatio = (gp.z - 475) / 500.0;
      const gRoadY = 0.05 + gRatio * 31.95;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, gRoadY, gp.z);
      [-9.2, 9.2].forEach(gx => {
        const postGeo = new THREE.BoxGeometry(0.45, 6.5, 0.45);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.7, roughness: 0.4 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(gx, 3.25, 0);
        gantryGroup.add(post);
      });
      const beamGeo = new THREE.BoxGeometry(19.2, 0.6, 0.6);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.7, roughness: 0.4 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 6.2, 0);
      gantryGroup.add(beam);
      const signCanvas = document.createElement("canvas");
      signCanvas.width = 512;
      signCanvas.height = 128;
      const sCtx = signCanvas.getContext("2d");
      sCtx.fillStyle = "#0d6e38";
      sCtx.fillRect(0, 0, 512, 128);
      sCtx.strokeStyle = "#ffffff";
      sCtx.lineWidth = 6;
      sCtx.strokeRect(6, 6, 500, 116);
      sCtx.fillStyle = "#ffffff";
      sCtx.font = "bold 26px sans-serif";
      sCtx.textAlign = "center";
      sCtx.fillText(gp.title, 256, 48);
      sCtx.fillStyle = "#ffdd53";
      sCtx.font = "bold 22px monospace";
      sCtx.fillText(gp.sub, 256, 92);
      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signGeo = new THREE.PlaneGeometry(12.0, 3.0);
      const signMesh = new THREE.Mesh(signGeo, signMat);
      signMesh.position.set(0, 4.8, 0.35);
      gantryGroup.add(signMesh);
      parent.add(gantryGroup);
    });
    [620, 820].forEach(tz => {
      const tRatio = (tz - 475) / 500.0;
      const tRoadY = 0.05 + tRatio * 31.95;
      const towerGroup = new THREE.Group();
      towerGroup.position.set(0, tRoadY, tz);
      [-9.4, 9.4].forEach(tx => {
        const pylonGeo = new THREE.CylinderGeometry(0.8, 1.4, 32.0, 16);
        const pylonMat = new THREE.MeshStandardMaterial({
          color: 0x3182ce,
          metalness: 0.6,
          roughness: 0.3
        });
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(tx, 16.0, 0);
        towerGroup.add(pylon);
        const beaconGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(tx, 32.2, 0);
        towerGroup.add(beacon);
      });
      const topArchGeo = new THREE.BoxGeometry(20.0, 1.2, 1.2);
      const topArchMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, metalness: 0.6 });
      const topArch = new THREE.Mesh(topArchGeo, topArchMat);
      topArch.position.set(0, 31.2, 0);
      towerGroup.add(topArch);
      const cableMat = new THREE.MeshBasicMaterial({ color: 0x90cdf4, transparent: true, opacity: 0.75 });
      [-9.4, 9.4].forEach(tx => {
        [-40, -25, -12, 12, 25, 40].forEach(offsetZ => {
          const cableLen = Math.hypot(offsetZ, 30.0);
          const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, cableLen, 6);
          const cable = new THREE.Mesh(cableGeo, cableMat);
          const angle = Math.atan2(offsetZ, 30.0);
          cable.rotation.x = angle;
          cable.position.set(tx, 15.5, offsetZ / 2);
          towerGroup.add(cable);
        });
      });
      parent.add(towerGroup);
    });
    for (let az = 545; az <= 905; az += 72) {
      const aRatio = (az - 475) / 500.0;
      const archY = 0.5 + aRatio * 31.5;
      const archGroup = new THREE.Group();
      archGroup.position.set(0, archY, az);
      const torusGeo = new THREE.TorusGeometry(9.8, 0.45, 16, 48);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      archGroup.add(torus);
      [-9.8, 9.8].forEach(lx => {
        const lanternGeo = new THREE.OctahedronGeometry(0.8);
        const lanternMat = new THREE.MeshBasicMaterial({ color: 0xf5a623 });
        const lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(lx, 0, 0);
        archGroup.add(lantern);
      });
      parent.add(archGroup);
    }
  }
  createSkywaySanctuaryPlatform(parent) {
    const platform = new THREE.Group();
    platform.position.set(0, 32.0, 975);
    const deckGeo = new THREE.CylinderGeometry(22.0, 23.5, 2.0, 36);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x141b29,
      roughness: 0.35,
      metalness: 0.7
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = -1.0;
    deck.receiveShadow = true;
    platform.add(deck);
    [10.0, 16.0, 21.0].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.25, r + 0.25, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00f0ff : 0xf5a623,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      platform.add(ring);
    });
    const obeliskCount = 8;
    for (let i = 0; i < obeliskCount; i++) {
      const angle = (i / obeliskCount) * Math.PI * 2;
      if (Math.abs(angle - Math.PI) < 0.3) continue;
      const ox = Math.sin(angle) * 19.5;
      const oz = Math.cos(angle) * 19.5;
      const obeliskGeo = new THREE.ConeGeometry(1.2, 8.0, 6);
      const obeliskMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        roughness: 0.1
      });
      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      obelisk.position.set(ox, 4.0, oz);
      platform.add(obelisk);
      const oLight = new THREE.PointLight(0x00f0ff, 1.2, 18);
      oLight.position.set(ox, 8.2, oz);
      platform.add(oLight);
    }
    parent.add(platform);
  }
  createGateOfLightPortal(parent) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 32.0, 975);
    portalGroup.rotation.y = Math.PI;
    const spireGeo = new THREE.CylinderGeometry(0.8, 1.5, 18.0, 16);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x111928,
      metalness: 0.85,
      roughness: 0.25
    });
    const leftSpire = new THREE.Mesh(spireGeo, spireMat);
    leftSpire.position.set(-6.5, 9.0, 0);
    const rightSpire = new THREE.Mesh(spireGeo, spireMat);
    rightSpire.position.set(6.5, 9.0, 0);
    portalGroup.add(leftSpire, rightSpire);
    const crystalGeo = new THREE.OctahedronGeometry(1.8);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf5a623,
      emissive: 0xf5a623,
      emissiveIntensity: 1.2
    });
    const leftCrystal = new THREE.Mesh(crystalGeo, crystalMat);
    leftCrystal.position.set(-6.5, 19.0, 0);
    const rightCrystal = new THREE.Mesh(crystalGeo, crystalMat);
    rightCrystal.position.set(6.5, 19.0, 0);
    portalGroup.add(leftCrystal, rightCrystal);
    [5.0, 6.8].forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.25, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00f0ff : 0xf5a623,
        wireframe: true
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 9.5, 0);
      portalGroup.add(ringMesh);
      this.celestialPortalRings.push(ringMesh);
    });
    const portalCanvas = document.createElement("canvas");
    portalCanvas.width = 512;
    portalCanvas.height = 768;
    const pctx = portalCanvas.getContext("2d");
    const grad = pctx.createRadialGradient(256, 384, 20, 256, 384, 380);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.2, "rgba(0, 240, 255, 0.95)");
    grad.addColorStop(0.55, "rgba(153, 69, 255, 0.85)");
    grad.addColorStop(0.85, "rgba(245, 166, 35, 0.5)");
    grad.addColorStop(1.0, "rgba(10, 16, 32, 0.0)");
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 512, 768);
    pctx.fillStyle = "#ffffff";
    for (let i = 0; i < 90; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 768;
      const sr = Math.random() * 2.5 + 1;
      pctx.beginPath();
      pctx.arc(sx, sy, sr, 0, Math.PI * 2);
      pctx.fill();
    }
    const portalTex = new THREE.CanvasTexture(portalCanvas);
    const portalGeo = new THREE.PlaneGeometry(9.5, 14.5);
    const portalMat = new THREE.MeshBasicMaterial({
      map: portalTex,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.celestialVortex = new THREE.Mesh(portalGeo, portalMat);
    this.celestialVortex.position.set(0, 9.5, 0.2);
    portalGroup.add(this.celestialVortex);
    const beamGeo = new THREE.CylinderGeometry(4.0, 6.5, 300, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 150, 0);
    portalGroup.add(beam);
    const portalLight = new THREE.PointLight(0x00f0ff, 3.5, 45);
    portalLight.position.set(0, 10.0, 2.0);
    portalGroup.add(portalLight);
    parent.add(portalGroup);
  }
  createCelestialImageFrames(parent) {
    const imagesConfig = [
      {
        file: "1.png",
        name: "MORGAN",
        role: "ADMIN SUKI",
        color: 0xf5a623,
        skyPos: new THREE.Vector3(-42.0, 92.0, -35.0),
        desc: "✦ CHIEF SYSTEM ARCHITECT ✦"
      },
      {
        file: "2.png",
        name: "LIEBERT",
        role: "MEMBER SUKI",
        color: 0x9945ff,
        skyPos: new THREE.Vector3(42.0, 92.0, -35.0),
        desc: "✦ CORE DEVELOPER & SENTINEL ✦"
      },
      {
        file: "3.png",
        name: "STELLE",
        role: "ORANG NORMAL",
        color: 0x00f0ff,
        skyPos: new THREE.Vector3(0.0, 106.0, -20.0),
        desc: "👑 SUPREME CREATOR & NORMAL HUMAN 👑"
      }
    ];
    const createPlacardTex = (name, role, hexColor, desc) => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 320;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "rgba(10, 16, 30, 0.95)";
      ctx.fillRect(0, 0, 1024, 320);
      ctx.strokeStyle = "#" + hexColor.toString(16).padStart(6, "0");
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 992, 288);
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "#" + hexColor.toString(16).padStart(6, "0"));
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(20, 200, 984, 6);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, 512, 95);
      ctx.fillStyle = "#" + hexColor.toString(16).padStart(6, "0");
      ctx.font = "bold 44px monospace";
      ctx.fillText("[ " + role + " ]", 512, 165);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "28px monospace";
      ctx.fillText(desc, 512, 260);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    };
    this.celestialCanvases = [];
    const createPortraitTex = (cfg, idx) => {
      const c = document.createElement("canvas");
      c.width = 768;
      c.height = 1024;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0c1527";
      ctx.fillRect(0, 0, 768, 1024);
      ctx.strokeStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.lineWidth = 18;
      ctx.strokeRect(10, 10, 748, 1004);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      for (let s = 0; s < 50; s++) {
        ctx.beginPath();
        ctx.arc((s * 37) % 740 + 14, (s * 53) % 780 + 20, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.font = "bold 130px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔒", 384, 380);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("RAHASIA TERKUNCI", 384, 480);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 26px monospace";
      ctx.fillText("PECAHKAN TEKA-TEKI GERBANG", 384, 540);
      ctx.fillText("UNTUK MEMBUKA FOTO", 384, 580);
      ctx.fillStyle = "rgba(10, 16, 32, 0.95)";
      ctx.fillRect(20, 810, 728, 190);
      ctx.strokeStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 810, 728, 190);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cfg.name, 384, 880);
      ctx.fillStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.font = "bold 38px monospace";
      ctx.fillText("[ " + cfg.role + " ]", 384, 940);
      const canvasTex = new THREE.CanvasTexture(c);
      canvasTex.needsUpdate = true;
      this.celestialCanvases.push({ canvas: c, ctx, tex: canvasTex, cfg });
      return canvasTex;
    };
    imagesConfig.forEach((cfg, idx) => {
      const shrine = new THREE.Group();
      shrine.position.copy(cfg.skyPos);
      shrine.rotation.y = 0;
      shrine.rotation.x = 0.36;
      [-5.6, 5.6].forEach(px => {
        const pylonGeo = new THREE.BoxGeometry(0.8, 12.0, 0.8);
        const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(px, 0.5, 0);
        shrine.add(pylon);
        const pylonCapGeo = new THREE.OctahedronGeometry(0.8);
        const capMat = new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 1.0 });
        const cap = new THREE.Mesh(pylonCapGeo, capMat);
        cap.position.set(px, 6.8, 0);
        shrine.add(cap);
      });
      [6.8, 8.4].forEach((radius, rIdx) => {
        const ringGeo = new THREE.TorusGeometry(radius, 0.22, 16, 40);
        const ringMat = new THREE.MeshBasicMaterial({
          color: rIdx === 0 ? cfg.color : 0xffffff,
          wireframe: true
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0.5, 0);
        shrine.add(ringMesh);
        this.celestialPortalRings.push(ringMesh);
      });
      const placardTex = createPlacardTex(cfg.name, cfg.role, cfg.color, cfg.desc);
      const placardGeo = new THREE.PlaneGeometry(8.8, 2.8);
      const placardMat = new THREE.MeshBasicMaterial({
        map: placardTex,
        side: THREE.DoubleSide
      });
      const placard = new THREE.Mesh(placardGeo, placardMat);
      placard.position.set(0, -3.8, 0.5);
      shrine.add(placard);
      const beamGeo = new THREE.CylinderGeometry(2.5, 5.0, 140, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        depthWrite: false
      });
      const beamDown = new THREE.Mesh(beamGeo, beamMat);
      beamDown.position.set(0, -40, 0);
      shrine.add(beamDown);
      const shrineLight = new THREE.PointLight(cfg.color, 3.5, 60);
      shrineLight.position.set(0, 2.0, 3.0);
      shrine.add(shrineLight);
      shrine.visible = false;
      parent.add(shrine);
      this.skyShrines.push(shrine);
      const pictureGroup = new THREE.Group();
      const portraitTex = createPortraitTex(cfg, idx);
      const picGeo = new THREE.PlaneGeometry(15.0, 20.0);
      const picMat = new THREE.MeshBasicMaterial({
        map: portraitTex,
        side: THREE.DoubleSide
      });
      const picMesh = new THREE.Mesh(picGeo, picMat);
      picMesh.position.z = 0.22;
      pictureGroup.add(picMesh);
      const frameGeo = new THREE.BoxGeometry(15.8, 20.8, 0.25);
      const frameMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.75,
        roughness: 0.2
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.05;
      pictureGroup.add(frameMesh);
      const auraGeo = new THREE.PlaneGeometry(21.0, 26.0);
      const auraMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.40,
        depthWrite: false
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.z = -0.35;
      pictureGroup.add(aura);
      pictureGroup.position.set(0, 34.0, 975.0);
      pictureGroup.rotation.set(0, Math.PI, 0);
      pictureGroup.scale.set(0.18, 0.18, 0.18);
      pictureGroup.visible = false;
      this.scene.add(pictureGroup);
      this.celestialImages.push({
        id: idx,
        config: cfg,
        mesh: pictureGroup,
        userData: {
          isAscending: false,
          isDocked: false,
          progress: 0.0,
          startPos: new THREE.Vector3(0, 34.0, 975.0),
          targetPos: cfg.skyPos.clone()
        }
      });
    });
  }
  revealCelestialPortrait(index, blobUrl) {
    if (!this.celestialCanvases || !this.celestialCanvases[index]) return;
    const { canvas, ctx, tex, cfg } = this.celestialCanvases[index];
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#0c1527";
      ctx.fillRect(15, 15, 738, 790);
      ctx.drawImage(img, 30, 30, 708, 770);
      ctx.fillStyle = "rgba(10, 16, 32, 0.95)";
      ctx.fillRect(20, 810, 728, 190);
      ctx.strokeStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 810, 728, 190);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cfg.name, 384, 880);
      ctx.fillStyle = "#" + cfg.color.toString(16).padStart(6, "0");
      ctx.font = "bold 38px monospace";
      ctx.fillText("[ " + cfg.role + " ]", 384, 940);
      tex.needsUpdate = true;
    };
    img.src = blobUrl;
  }
  launchCelestialImage(index) {
    if (!this.celestialImages || !this.celestialImages[index]) return;
    const item = this.celestialImages[index];
    item.mesh.visible = true;
    item.mesh.position.set(0, 34.0, 975.0);
    item.mesh.scale.set(0.2, 0.2, 0.2);
    item.mesh.rotation.set(0, Math.PI, 0);
    item.userData.isAscending = true;
    item.userData.isDocked = false;
    item.userData.progress = 0.0;
    item.userData.startPos = new THREE.Vector3(0, 34.0, 975.0);
    window.activeSkyAscendingMesh = item.mesh;
    if (this.celestialVortex) {
      this.celestialVortex.material.opacity = 0.95;
    }
    if (window.soundEngine && typeof window.soundEngine.playAscensionSound === "function") {
      window.soundEngine.playAscensionSound();
    }
  }
  createWalkerAvatar() {
    this.walkerGroup = new THREE.Group();
    this.isUsingGusionModel = false;
    this.activeCharacter = "MINATO";
    this.minatoAvatarGroup = new THREE.Group();
    this.walkerGroup.add(this.minatoAvatarGroup);
    this.miyuAvatarGroup = new THREE.Group();
    this.miyuAvatarGroup.visible = false;
    this.walkerGroup.add(this.miyuAvatarGroup);
    this.miyuBones = {};
    this.miyuLoaded = false;
    if (window.GUSION_ARTICULATED_MODEL && window.GUSION_ARTICULATED_MODEL.parts) {
      const artData = window.GUSION_ARTICULATED_MODEL;
      const tex = new THREE.Texture();
      const img = new Image();
      img.onload = () => {
        tex.image = img;
        tex.needsUpdate = true;
      };
      img.src = artData.texture;
      const heroMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.45,
        metalness: 0.15,
        side: THREE.DoubleSide
      });
      const buildPartMesh = (partName) => {
        const p = artData.parts[partName];
        if (!p) return new THREE.Group();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p.positions), 3));
        geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(p.normals), 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(p.uvs), 2));
        geo.setIndex(new THREE.BufferAttribute(new Uint16Array(p.indices), 1));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, heroMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };
      this.minatoPelvis = new THREE.Group();
      this.minatoPelvis.position.set(0, 0.88, 0);
      this.minatoAvatarGroup.add(this.minatoPelvis);
      this.minatoTorso = new THREE.Group();
      this.minatoTorso.position.set(0, 0, 0);
      this.minatoPelvis.add(this.minatoTorso);
      this.minatoTorso.add(buildPartMesh("torso"));
      this.minatoHead = new THREE.Group();
      this.minatoHead.position.set(0, 0.52, 0);
      this.minatoTorso.add(this.minatoHead);
      this.minatoHead.add(buildPartMesh("head"));
      this.minatoLeftShoulder = new THREE.Group();
      this.minatoLeftShoulder.position.set(-0.24, 0.48, 0);
      this.minatoLeftShoulder.rotation.z = 0.66;
      this.minatoTorso.add(this.minatoLeftShoulder);
      this.minatoLeftShoulder.add(buildPartMesh("left_arm"));
      this.minatoRightShoulder = new THREE.Group();
      this.minatoRightShoulder.position.set(0.24, 0.48, 0);
      this.minatoRightShoulder.rotation.z = -0.66;
      this.minatoTorso.add(this.minatoRightShoulder);
      this.minatoRightShoulder.add(buildPartMesh("right_arm"));
      this.minatoLeftHip = new THREE.Group();
      this.minatoLeftHip.position.set(-0.14, 0, 0);
      this.minatoPelvis.add(this.minatoLeftHip);
      this.minatoLeftHip.add(buildPartMesh("left_thigh"));
      this.minatoLeftKnee = new THREE.Group();
      this.minatoLeftKnee.position.set(0, -0.42, 0);
      this.minatoLeftHip.add(this.minatoLeftKnee);
      this.minatoLeftKnee.add(buildPartMesh("left_calf"));
      this.minatoRightHip = new THREE.Group();
      this.minatoRightHip.position.set(0.14, 0, 0);
      this.minatoPelvis.add(this.minatoRightHip);
      this.minatoRightHip.add(buildPartMesh("right_thigh"));
      this.minatoRightKnee = new THREE.Group();
      this.minatoRightKnee.position.set(0, -0.42, 0);
      this.minatoRightHip.add(this.minatoRightKnee);
      this.minatoRightKnee.add(buildPartMesh("right_calf"));
      const auraGeo = new THREE.RingGeometry(0.35, 0.68, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xf5a623,
        transparent: true,
        opacity: 0.50,
        side: THREE.DoubleSide
      });
      this.heroChakraRing = new THREE.Mesh(auraGeo, auraMat);
      this.heroChakraRing.rotation.x = -Math.PI / 2;
      this.heroChakraRing.position.y = 0.04;
      this.minatoAvatarGroup.add(this.heroChakraRing);
      this.isUsingGusionModel = true;
    }
    if (typeof THREE.GLTFLoader === "function") {
      const loader = new THREE.GLTFLoader();
      const parseMiyuGLTF = (buffer) => {
        try {
          loader.parse(buffer, "", (gltf) => {
            const miyuRoot = gltf.scene;
            miyuRoot.scale.set(1.0, 1.0, 1.0);
            miyuRoot.rotation.y = Math.PI;
            miyuRoot.traverse((child) => {
              if (child.isMesh || child.isSkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.name === "Object_232" || child.name === "Ground_195") {
                  child.visible = false;
                }
              }
              if (child.isBone || (child.type && child.type.includes("Bone")) || child.name.includes("Leg") || child.name.includes("Arm") || child.name.includes("Spine") || child.name.includes("Hips") || child.name.includes("Weapon")) {
                this.miyuBones[child.name] = child;
                child.userData.restQuat = child.quaternion.clone();
                child.userData.restPos = child.position.clone();
              }
            });
            miyuRoot.traverse((child) => {
              if (child.name === "Weapon_Root_12" || child.name === "Garbage_Root_201") {
                this.miyuBones[child.name] = child;
                child.userData.restQuat = child.quaternion.clone();
              }
            });
            this.miyuAvatarGroup.add(miyuRoot);
            this.miyuLoaded = true;
            console.log("Kasumizawa Miyu 3D Model Loaded & Rigged successfully! Bones found:", Object.keys(this.miyuBones).length);
          }, (err) => console.warn("Miyu GLTF parse error:", err));
        } catch (e) {
          console.warn("Failed to parse Miyu model:", e);
        }
      };
      if (window.MIYU_MODEL_GLB) {
        try {
          const bin = atob(window.MIYU_MODEL_GLB);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          parseMiyuGLTF(bytes.buffer);
        } catch (b64Err) {
          console.warn("Base64 decode MIYU failed:", b64Err);
        }
      } else {
        loader.load("assets/blue_archivekasumizawa_miyu.glb", (gltf) => {
          const miyuRoot = gltf.scene;
          miyuRoot.rotation.y = Math.PI;
          miyuRoot.traverse(child => {
            if (child.name === "Object_232" || child.name === "Ground_195") child.visible = false;
            if (child.isBone || child.name.includes("Leg") || child.name.includes("Arm") || child.name.includes("Spine") || child.name.includes("Hips") || child.name.includes("Weapon")) {
              this.miyuBones[child.name] = child;
              child.userData.restQuat = child.quaternion.clone();
            }
          });
          this.miyuAvatarGroup.add(miyuRoot);
          this.miyuLoaded = true;
        }, undefined, (e) => console.warn("Miyu GLB load fallback error:", e));
      }
    }
    this.createCharacterNameplate();
    const walkerCanvas = document.createElement("canvas");
    walkerCanvas.width = 128;
    walkerCanvas.height = 128;
    const wCtx = walkerCanvas.getContext("2d");
    const wGrad = wCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    wGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    wGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.45)");
    wGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    wCtx.fillStyle = wGrad;
    wCtx.fillRect(0, 0, 128, 128);
    const wTex = new THREE.CanvasTexture(walkerCanvas);
    this.walkerContactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: wTex, transparent: true, opacity: 0.8, depthWrite: false })
    );
    this.walkerContactShadow.rotation.x = -Math.PI / 2;
    this.walkerContactShadow.position.set(0, 0.02, 0);
    this.walkerContactShadow.visible = false;
    this.walkerGroup.add(this.walkerContactShadow);
    this.walker = this.walkerGroup;
    this.minatoContainer = this.minatoAvatarGroup;
    this.miyuContainer = this.miyuAvatarGroup;
    this.walkerGroup.visible = false;
    this.scene.add(this.walkerGroup);
    this.walkerWalkPhase = 0;
  }
  createCharacterNameplate() {
    this.nameCanvas = document.createElement("canvas");
    this.nameCanvas.width = 512;
    this.nameCanvas.height = 128;
    this.updateNameplateTexture();
    const nameTex = new THREE.CanvasTexture(this.nameCanvas);
    const nameMat = new THREE.SpriteMaterial({
      map: nameTex,
      transparent: true
    });
    this.heroNameplate = new THREE.Sprite(nameMat);
    this.heroNameplate.scale.set(1.8, 0.45, 1.0);
    this.heroNameplate.position.set(0, 2.15, 0);
    this.walkerGroup.add(this.heroNameplate);
  }
  updateNameplateTexture() {
    if (!this.nameCanvas) return;
    const nCtx = this.nameCanvas.getContext("2d");
    nCtx.clearRect(0, 0, 512, 128);
    nCtx.fillStyle = "rgba(10, 16, 28, 0.85)";
    if (nCtx.roundRect) {
      nCtx.roundRect(10, 10, 492, 108, 16);
    } else {
      nCtx.fillRect(10, 10, 492, 108);
    }
    nCtx.fill();
    const isMiyu = (this.activeCharacter === "MIYU");
    nCtx.strokeStyle = isMiyu ? "#00f0ff" : "#f5a623";
    nCtx.lineWidth = 4;
    nCtx.stroke();
    nCtx.fillStyle = "#ffffff";
    nCtx.font = "bold 32px sans-serif";
    nCtx.textAlign = "center";
    nCtx.fillText(isMiyu ? "🎯 KASUMIZAWA MIYU 🎯" : "⚡ MINATO NAMIKAZE ⚡", 256, 52);
    nCtx.fillStyle = isMiyu ? "#00f0ff" : "#f5a623";
    nCtx.font = "bold 22px monospace";
    nCtx.fillText(isMiyu ? "SRT SPECIAL ACADEMY // RABBIT 4" : "YONDAIME HOKAGE // YELLOW FLASH", 256, 92);
    if (this.heroNameplate && this.heroNameplate.material && this.heroNameplate.material.map) {
      this.heroNameplate.material.map.needsUpdate = true;
    }
  }
  setCharacter(charName) {
    const upper = (charName || "").toUpperCase();
    this.activeCharacter = (upper === "MIYU") ? "MIYU" : "MINATO";
    if (this.minatoAvatarGroup) {
      this.minatoAvatarGroup.visible = (this.activeCharacter === "MINATO");
    }
    if (this.miyuAvatarGroup) {
      this.miyuAvatarGroup.visible = (this.activeCharacter === "MIYU");
    }
    this.updateNameplateTexture();
    const charBtn = document.getElementById("btn-switch-char");
    if (charBtn) {
      charBtn.textContent = (this.activeCharacter === "MIYU") ? "👤 MIYU" : "👤 MINATO";
    }
    const skillBtn = document.getElementById("btn-char-skill");
    if (skillBtn) {
      skillBtn.textContent = (this.activeCharacter === "MIYU") ? "🎯 TEMBAK" : "⚡ HIRAISHIN";
    }
  }
  applyMiyuAimAndRecoil(b, dt, time, kick, isAiming, isRunning) {
    if (!b) return;
    const breath = isAiming ? (Math.sin(time * 1.8) * 0.012) : 0;
    if (b.UpperArm_R_145 && b.UpperArm_R_145.userData.restQuat) {
      const qAimR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.88 + kick * 0.45 + breath);
      b.UpperArm_R_145.quaternion.copy(b.UpperArm_R_145.userData.restQuat).multiply(qAimR);
    }
    if (b.UpperArm_L_165 && b.UpperArm_L_165.userData.restQuat) {
      const qAimL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.98 + kick * 0.38 + breath);
      b.UpperArm_L_165.quaternion.copy(b.UpperArm_L_165.userData.restQuat).multiply(qAimL);
    }
    if (b.Head_125 && b.Head_125.userData.restQuat) {
      const qAimHead = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.16 + kick * 0.06);
      b.Head_125.quaternion.copy(b.Head_125.userData.restQuat).multiply(qAimHead);
    }
    if (kick > 0 && b.Spine_176 && b.Spine_176.userData.restQuat) {
      const qRecoilSpine = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), kick * 0.12);
      b.Spine_176.quaternion.copy(b.Spine_176.userData.restQuat).multiply(qRecoilSpine);
    }
  }
  createKunaiMesh() {
    const km = window.GUSION_KUNAI_MODEL;
    if (!km || !km.positions) {
      const fallback = new THREE.Group();
      const bGeo = new THREE.ConeGeometry(0.12, 0.6, 4);
      bGeo.rotateX(-Math.PI / 2);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.85, roughness: 0.25 });
      fallback.add(new THREE.Mesh(bGeo, bMat));
      return fallback;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(km.positions), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(km.normals), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(km.uvs), 2));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(km.indices), 1));
    geo.computeVertexNormals();
    const tex = new THREE.Texture();
    const img = new Image();
    img.onload = () => { tex.image = img; tex.needsUpdate = true; };
    img.src = km.texture;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.65,
      roughness: 0.35,
      side: THREE.DoubleSide
    });
    const kunaiMesh = new THREE.Mesh(geo, mat);
    kunaiMesh.scale.set(0.65, 0.65, 0.65);
    const tagGeo = new THREE.PlaneGeometry(0.14, 0.45);
    const tagCanvas = document.createElement("canvas");
    tagCanvas.width = 64; tagCanvas.height = 256;
    const tctx = tagCanvas.getContext("2d");
    tctx.fillStyle = "#fff8e7"; tctx.fillRect(0, 0, 64, 256);
    tctx.fillStyle = "#111"; tctx.font = "bold 22px serif"; tctx.textAlign = "center";
    tctx.fillText("忍", 32, 48); tctx.fillText("愛", 32, 108); tctx.fillText("之", 32, 168); tctx.fillText("剣", 32, 228);
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, side: THREE.DoubleSide });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.set(0, -0.42, 0);
    kunaiMesh.add(tag);
    return kunaiMesh;
  }
  triggerMinatoHiraishin(fromPos, toPos, onTeleport) {
    if (this.minatoIsThrowing) return;
    this.minatoIsThrowing = true;
    this.minatoThrowTimer = 0.0;
    if (window.soundEngine && typeof window.soundEngine.playKunaiThrow === "function") {
      window.soundEngine.playKunaiThrow();
    }
    const kunai = this.createKunaiMesh();
    const walkerRot = (this.physics && this.physics.walkerRotation) || 0;
    const handStart = new THREE.Vector3(
      fromPos.x + Math.sin(walkerRot) * 0.45 + Math.cos(walkerRot) * 0.25,
      fromPos.y + 0.15,
      fromPos.z + Math.cos(walkerRot) * 0.45 - Math.sin(walkerRot) * 0.25
    );
    kunai.position.copy(handStart);
    this.scene.add(kunai);
    const trailPoints = [handStart.clone()];
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.9, linewidth: 2 });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(trailLine);
    const dist = handStart.distanceTo(toPos);
    const flightDuration = Math.min(0.42, Math.max(0.26, dist * 0.0075));
    let elapsed = 0;
    const animateKunai = () => {
      elapsed += 0.024;
      if (elapsed < 0.10) {
        kunai.position.copy(handStart);
        requestAnimationFrame(animateKunai);
        return;
      }
      const flightProgress = Math.min(1.0, (elapsed - 0.10) / (flightDuration - 0.10));
      const curPos = new THREE.Vector3().lerpVectors(handStart, toPos, flightProgress);
      curPos.y += Math.sin(flightProgress * Math.PI) * (dist * 0.045);
      kunai.position.copy(curPos);
      kunai.rotation.z += 0.75;
      kunai.rotation.y = Math.atan2(toPos.x - handStart.x, toPos.z - handStart.z);
      trailPoints.push(curPos.clone());
      if (trailPoints.length > 14) trailPoints.shift();
      const posArr = new Float32Array(trailPoints.length * 3);
      for (let i = 0; i < trailPoints.length; i++) {
        posArr[i * 3] = trailPoints[i].x;
        posArr[i * 3 + 1] = trailPoints[i].y;
        posArr[i * 3 + 2] = trailPoints[i].z;
      }
      trailGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
      if (flightProgress < 1.0) {
        requestAnimationFrame(animateKunai);
      } else {
        this.createHiraishinTeleportVFX(fromPos, toPos);
        if (typeof onTeleport === "function") {
          onTeleport();
        }
        if (window.soundEngine && typeof window.soundEngine.playTeleportHiraishin === "function") {
          window.soundEngine.playTeleportHiraishin();
        }
        setTimeout(() => {
          this.scene.remove(kunai);
          this.scene.remove(trailLine);
          trailGeo.dispose();
          trailMat.dispose();
          this.minatoIsThrowing = false;
        }, 120);
      }
    };
    requestAnimationFrame(animateKunai);
  }
  triggerMiyuSniperShot(barrelPos, hitPos) {
    this.miyuRecoilTimer = 0.35;
    if (window.soundEngine && typeof window.soundEngine.playSniperShot === "function") {
      window.soundEngine.playSniperShot();
    }
    const scope = document.getElementById("sniper-scope-overlay");
    if (scope && scope.classList.contains("active")) {
      scope.classList.remove("recoil-kick");
      void scope.offsetWidth;
      scope.classList.add("recoil-kick");
    }
    this.createSniperShotVFX(barrelPos, hitPos);
  }
  createHiraishinTeleportVFX(fromPos, toPos) {
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, fromPos.distanceTo(toPos), 8);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.95 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(fromPos).lerp(toPos, 0.5);
    beam.lookAt(toPos);
    this.scene.add(beam);
    const depGeo = new THREE.SphereGeometry(1.6, 12, 12);
    const depMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.9 });
    const depSphere = new THREE.Mesh(depGeo, depMat);
    depSphere.position.copy(fromPos);
    this.scene.add(depSphere);
    const flashGeo = new THREE.SphereGeometry(2.6, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.88 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(toPos);
    flash.position.y += 0.8;
    this.scene.add(flash);
    const ringGeo = new THREE.RingGeometry(0.5, 3.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(toPos);
    ring.position.y += 0.08;
    this.scene.add(ring);
    const flashLight = new THREE.PointLight(0xffea00, 10.0, 35);
    flashLight.position.copy(toPos);
    flashLight.position.y += 1.2;
    this.scene.add(flashLight);
    let elapsed = 0;
    const animateVFX = () => {
      elapsed += 0.035;
      beamMat.opacity = Math.max(0, 0.95 - elapsed * 3.8);
      depMat.opacity = Math.max(0, 0.9 - elapsed * 4.2);
      flashMat.opacity = Math.max(0, 0.88 - elapsed * 2.8);
      ringMat.opacity = Math.max(0, 0.85 - elapsed * 2.5);
      flash.scale.multiplyScalar(1.08);
      ring.scale.multiplyScalar(1.10);
      flashLight.intensity = Math.max(0, 10.0 * (1.0 - elapsed * 3.2));
      if (elapsed < 0.35) {
        requestAnimationFrame(animateVFX);
      } else {
        this.scene.remove(beam);
        this.scene.remove(depSphere);
        this.scene.remove(flash);
        this.scene.remove(ring);
        this.scene.remove(flashLight);
        beamGeo.dispose(); beamMat.dispose();
        depGeo.dispose(); depMat.dispose();
        flashGeo.dispose(); flashMat.dispose();
        ringGeo.dispose(); ringMat.dispose();
      }
    };
    animateVFX();
  }
  createSniperShotVFX(barrelPos, hitPos) {
    const dist = barrelPos.distanceTo(hitPos);
    const tracerGeo = new THREE.CylinderGeometry(0.05, 0.05, dist, 6);
    tracerGeo.rotateX(Math.PI / 2);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95 });
    const tracer = new THREE.Mesh(tracerGeo, tracerMat);
    tracer.position.copy(barrelPos).lerp(hitPos, 0.5);
    tracer.lookAt(hitPos);
    this.scene.add(tracer);
    const muzzleGeo = new THREE.SphereGeometry(0.42, 12, 12);
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95 });
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.copy(barrelPos);
    this.scene.add(muzzle);
    const smokeGeo = new THREE.RingGeometry(0.1, 0.35, 16);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(barrelPos);
    smoke.lookAt(hitPos);
    this.scene.add(smoke);
    const sparkGeo = new THREE.SphereGeometry(0.55, 10, 10);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.copy(hitPos);
    this.scene.add(spark);
    let elapsed = 0;
    const animateTracer = () => {
      elapsed += 0.035;
      tracerMat.opacity = Math.max(0, 0.95 - elapsed * 7.5);
      muzzleMat.opacity = Math.max(0, 0.95 - elapsed * 8.5);
      smokeMat.opacity = Math.max(0, 0.6 - elapsed * 3.5);
      sparkMat.opacity = Math.max(0, 0.9 - elapsed * 6.0);
      muzzle.scale.multiplyScalar(1.15);
      smoke.scale.multiplyScalar(1.25);
      spark.scale.multiplyScalar(1.18);
      if (elapsed < 0.18) {
        requestAnimationFrame(animateTracer);
      } else {
        this.scene.remove(tracer);
        this.scene.remove(muzzle);
        this.scene.remove(smoke);
        this.scene.remove(spark);
        tracerGeo.dispose(); tracerMat.dispose();
        muzzleGeo.dispose(); muzzleMat.dispose();
        smokeGeo.dispose(); smokeMat.dispose();
        sparkGeo.dispose(); sparkMat.dispose();
      }
    };
    animateTracer();
  }
}
window.TokyoCityWorld = TokyoCityWorld;