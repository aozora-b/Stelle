class SportsCarModel {
  constructor(scene, carConfig) {
    this.scene = scene;
    this.config = carConfig || window.APP_CONFIG.CAR;
    this.rootGroup = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.rootGroup.add(this.chassisGroup);
    this.CAR_TYPES = {
      LAMBORGHINI: "LAMBORGHINI",
      BUGATTI: "BUGATTI",
      F1: "F1",
      DODGE: "DODGE"
    };
    this.CAR_METADATA = {
      LAMBORGHINI: {
        name: "Lamborghini Centenario LP-770",
        engine: "6.5L Naturally Aspirated V12 (770 HP)",
        maxSpeed: 68.0,
        accel: 46.0,
        driverPos: { x: -0.41, y: -0.28, z: 0.08 },
        driverScale: 0.42
      },
      BUGATTI: {
        name: "Bugatti Chiron",
        engine: "8.0L Quad-Turbo W16 (1,500 HP)",
        maxSpeed: 72.0,
        accel: 48.0,
        driverPos: { x: -0.38, y: -0.14, z: -0.14 },
        driverScale: 0.44
      },
      F1: {
        name: "McLaren MCL35M Formula 1",
        engine: "1.6L Turbo Hybrid V6 (1,000+ HP)",
        maxSpeed: 75.0,
        accel: 52.0,
        driverPos: { x: 0.0, y: -0.06, z: 0.18 },
        driverScale: 0.35
      },
      DODGE: {
        name: "Dodge Challenger SRT Hellcat",
        engine: "6.2L Supercharged HEMI V8 (717 HP)",
        maxSpeed: 62.0,
        accel: 42.0,
        driverPos: { x: -0.42, y: -0.06, z: -0.12 },
        driverScale: 0.42
      }
    };
    this.currentCarType = this.CAR_TYPES.BUGATTI;
    this.carCache = {};
    this.activeModel = null;
    this.wheels = [];
    this.headlights = [];
    this.taillightMeshes = [];
    this.reverseLightMesh = null;
    this.underglowLights = [];
    this.exhaustFlames = [];
    this.exhaustFlashLight = null;
    this.spoilerMesh = null;
    this.steeringWheelMesh = null;
    this.smokeParticles = [];
    this.doorOpenProgress = 0.0;
    this.targetDoorProgress = 0.0;
    this.doorAnimCallback = null;
    this.doorHingeL = null;
    this.doorHingeR = null;
    this.doorHingeL_baseRot = null;
    this.doorHingeR_baseRot = null;
    this.seatedDriver = null;
    this.currentSpoilerAngle = 0;
    this.wheelRollAngle = 0;
    this.contactShadow = this.createContactShadowMesh();
    this.rootGroup.add(this.contactShadow);
    this.buildCar();
    this.scene.add(this.rootGroup);
  }
  buildCar() {
    this.loadCarModel(this.currentCarType);
  }
  loadCarModel(type, onComplete) {
    if (this.carCache[type]) {
      this.activateCarModel(type, this.carCache[type]);
      if (onComplete) onComplete(this.carCache[type]);
      return;
    }
    const carFiles = {
      LAMBORGHINI: "assets/js/data/vehicles/lamborghini_model_data.js",
      BUGATTI: "assets/js/data/vehicles/bugatti_model_data.js",
      F1: "assets/js/data/vehicles/mclaren_f1_data.js",
      DODGE: "assets/js/data/vehicles/dodge_model_data.js"
    };
    const getCarB64 = (t) => {
      if (t === this.CAR_TYPES.LAMBORGHINI) return window.LAMBORGHINI_GLB;
      if (t === this.CAR_TYPES.BUGATTI) return window.BUGATTI_CHIRON_GLB;
      if (t === this.CAR_TYPES.F1) return window.MCLAREN_F1_GLB;
      if (t === this.CAR_TYPES.DODGE) return window.DODGE_CHALLENGER_GLB;
      return null;
    };
    let b64 = getCarB64(type);
    if (!b64 && carFiles[type] && typeof window.loadScriptAsync === "function") {
      if (window.showGameToast && this.CAR_METADATA[type]) {
        window.showGameToast(`⏳ Memuat model 3D ${this.CAR_METADATA[type].name}...`, 3200);
      }
      window.loadScriptAsync(carFiles[type]).then(() => {
        b64 = getCarB64(type);
        if (b64) {
          this._parseAndActivateCar(type, b64, onComplete);
        } else {
          console.warn("Base64 still missing after script load for " + type);
          this.buildProceduralFallback();
        }
      }).catch((err) => {
        console.error("Failed to load car script for " + type, err);
        this.buildProceduralFallback();
      });
      return;
    }
    if (!b64 || typeof THREE.GLTFLoader !== "function") {
      console.warn("Model data not available for " + type + ", building procedural hypercar fallback.");
      this.buildProceduralFallback();
      return;
    }
    this._parseAndActivateCar(type, b64, onComplete);
  }
  _parseAndActivateCar(type, b64, onComplete) {
    try {
      const bin = atob(b64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const loader = new THREE.GLTFLoader();
      loader.parse(bytes.buffer, "", (gltf) => {
        const model = gltf.scene;
        this.carCache[type] = model;
        this.activateCarModel(type, model);
        if (onComplete) onComplete(model);
      }, (err) => {
        console.error("Failed to parse " + type + " GLB:", err);
        this.buildProceduralFallback();
      });
    } catch (e) {
      console.error("Failed to decode model data for " + type + ":", e);
      this.buildProceduralFallback();
    }
  }
  activateCarModel(type, model) {
    this.currentCarType = type;
    if (this.activeModel && this.activeModel.parent === this.chassisGroup) {
      this.chassisGroup.remove(this.activeModel);
    }
    this.wheelRigs = null;
    this.doorHingeL = null;
    this.doorHingeR = null;
    this.spoilerMesh = null;
    this.steeringWheelMesh = null;
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelBL = null;
    this.wheelBR = null;
    this.taillightMeshes = [];
    this.reverseLightMesh = null;
    if (type === this.CAR_TYPES.LAMBORGHINI) {
      this.setupLamborghiniModel(model);
    } else if (type === this.CAR_TYPES.BUGATTI) {
      this.setupBugattiModel(model);
    } else if (type === this.CAR_TYPES.F1) {
      this.setupMcLarenF1Model(model);
    } else if (type === this.CAR_TYPES.DODGE) {
      this.setupDodgeChallengerModel(model);
    }
    this.activeModel = model;
    this.chassisGroup.add(model);
    if (window.physics && window.physics.config && this.CAR_METADATA[type]) {
      const meta = this.CAR_METADATA[type];
      window.physics.config.MAX_SPEED = meta.maxSpeed;
      window.physics.config.ACCELERATION = meta.accel;
    }
    this.setupLightingSystems();
    this.setupExhaustBackfireSystem();
    if (this.smokeParticles.length === 0) {
      this.setupTireSmokeSystem();
    }
    this.setupSeatedDriverAvatar();
    console.log("🏎️ Active Hypercar switched to:", this.CAR_METADATA[type].name);
    if (typeof window.updateGarageCardsUI === "function") {
      window.updateGarageCardsUI();
    }
  }
  switchCar(nextType) {
    if (!nextType) {
      const keys = Object.keys(this.CAR_TYPES);
      const currentIndex = keys.indexOf(this.currentCarType);
      const nextIndex = (currentIndex + 1) % keys.length;
      nextType = this.CAR_TYPES[keys[nextIndex]];
    }
    if (nextType === this.currentCarType) return;
    this.currentCarType = nextType;
    this.loadCarModel(nextType);
    if (window.showGameToast && this.CAR_METADATA[nextType]) {
      const meta = this.CAR_METADATA[nextType];
      window.showGameToast(`🏎️ ${meta.name} [${meta.engine}]`, 2800);
    }
  }
  setupLamborghiniModel(model) {
    model.scale.set(1.0, 1.0, 1.0);
    model.position.set(0, -0.48, 0);
    model.rotation.y = 0;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || child.material.name || "").toLowerCase();
        if (name.includes("body") || name.includes("carosserie") || name.includes("paint")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x111316,
            metalness: 0.88,
            roughness: 0.22,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04
          });
        } else if (name.includes("yellow") || name.includes("gold") || name.includes("accent")) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xf5a623,
            metalness: 0.75,
            roughness: 0.25
          });
        } else if (name.includes("glass") || name.includes("vitre") || name.includes("windshield")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x080f1a,
            transparent: true,
            opacity: 0.65,
            roughness: 0.05,
            metalness: 0.90,
            transmission: 0.45
          });
        }
      }
    });
    model.traverse((node) => {
      const n = (node.name || "").toLowerCase();
      if (n.includes("empty001_16") || n.includes("empty.001")) {
        this.doorHingeL = node;
        this.doorHingeL_baseRot = node.rotation.clone();
      }
      if (n.includes("empty002_20") || n.includes("empty.002")) {
        this.doorHingeR = node;
        this.doorHingeR_baseRot = node.rotation.clone();
      }
      if (n.includes("movsteer") || n.includes("steer")) {
        this.steeringWheelMesh = node;
        this.steering_baseQuat = node.quaternion.clone();
      }
    });
    this.setupLamborghiniWheels(model);
  }
  buildUniversalWheelRigs(model, parents, hubs, configs) {
    model.updateMatrixWorld(true);
    const modelInv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    const rigs = {};
    const keys = ["FL", "FR", "BL", "BR"];
    keys.forEach((key) => {
      const cfg = configs[key];
      const hub = hubs[key];
      const steerGroup = new THREE.Group();
      steerGroup.position.copy(hub);
      const rollGroup = new THREE.Group();
      steerGroup.add(rollGroup);
      const unrotY = cfg.unrotateY || 0;
      const cosU = Math.cos(unrotY);
      const sinU = Math.sin(unrotY);
      parents.forEach((parentGroup) => {
        if (!parentGroup) return;
        parentGroup.traverse((c) => {
          if (c.isMesh && c.geometry) {
            const geo = c.geometry;
            const posAttr = geo.getAttribute("position");
            const normAttr = geo.getAttribute("normal");
            const uvAttr = geo.getAttribute("uv");
            const index = geo.getIndex();
            const meshToModel = new THREE.Matrix4().multiplyMatrices(modelInv, c.matrixWorld);
            const numTris = index ? index.count / 3 : posAttr.count / 3;
            const matchingTris = [];
            for (let i = 0; i < numTris; i++) {
              const i0 = index ? index.getX(i * 3 + 0) : i * 3 + 0;
              const i1 = index ? index.getX(i * 3 + 1) : i * 3 + 1;
              const i2 = index ? index.getX(i * 3 + 2) : i * 3 + 2;
              const v0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)).applyMatrix4(meshToModel);
              const v1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1)).applyMatrix4(meshToModel);
              const v2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)).applyMatrix4(meshToModel);
              const avg = new THREE.Vector3().add(v0).add(v1).add(v2).multiplyScalar(1 / 3);
              if (cfg.filter(avg)) {
                matchingTris.push({ i0, i1, i2, v0, v1, v2 });
              }
            }
            if (matchingTris.length > 0) {
              const newGeo = new THREE.BufferGeometry();
              const map = new Map();
              const positions = [];
              const normals = [];
              const uvs = [];
              const indices = [];
              const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshToModel);
              for (const tri of matchingTris) {
                const triIndices = [tri.i0, tri.i1, tri.i2];
                const triVerts = [tri.v0, tri.v1, tri.v2];
                for (let k = 0; k < 3; k++) {
                  const oldIdx = triIndices[k];
                  const vWorld = triVerts[k];
                  if (!map.has(oldIdx)) {
                    const newIdx = map.size;
                    map.set(oldIdx, newIdx);
                    let rx = vWorld.x - hub.x;
                    let ry = vWorld.y - hub.y;
                    let rz = vWorld.z - hub.z;
                    if (unrotY !== 0) {
                      const nx = rx * cosU + rz * sinU;
                      const nz = -rx * sinU + rz * cosU;
                      rx = nx;
                      rz = nz;
                    }
                    positions.push(rx, ry, rz);
                    if (normAttr) {
                      let n = new THREE.Vector3(normAttr.getX(oldIdx), normAttr.getY(oldIdx), normAttr.getZ(oldIdx))
                        .applyMatrix3(normalMatrix)
                        .normalize();
                      if (unrotY !== 0) {
                        const nnx = n.x * cosU + n.z * sinU;
                        const nnz = -n.x * sinU + n.z * cosU;
                        n.x = nnx;
                        n.z = nnz;
                      }
                      normals.push(n.x, n.y, n.z);
                    }
                    if (uvAttr) {
                      uvs.push(uvAttr.getX(oldIdx), uvAttr.getY(oldIdx));
                    }
                  }
                  indices.push(map.get(oldIdx));
                }
              }
              newGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
              if (normals.length) newGeo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
              if (uvs.length) newGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
              newGeo.setIndex(indices);
              const m = new THREE.Mesh(newGeo, c.material);
              m.castShadow = true;
              m.receiveShadow = true;
              rollGroup.add(m);
            }
          }
        });
      });
      model.add(steerGroup);
      rigs[key] = { steer: steerGroup, roll: rollGroup };
    });
    parents.forEach((p) => {
      if (p) p.visible = false;
    });
    return rigs;
  }
  setupLamborghiniWheels(model) {
    if (model.userData.wheelRigs) {
      this.wheelRigs = model.userData.wheelRigs;
      return;
    }
    let frontCompound = null;
    let rearCompound = null;
    model.traverse((node) => {
      if (node.name === "<Wheel003_2" || node.name === "<Wheel.003_2") frontCompound = node;
      if (node.name === "<Wheel_0") rearCompound = node;
    });
    if (!frontCompound || !rearCompound) return;
    const hubs = {
      FL: new THREE.Vector3(0.8658, 0.3844, 1.2008),
      FR: new THREE.Vector3(-0.8741, 0.3844, 1.1943),
      BL: new THREE.Vector3(0.8641, 0.3995, -1.5002),
      BR: new THREE.Vector3(-0.8641, 0.3995, -1.5002)
    };
    const configs = {
      FL: { filter: (v) => v.x > 0 && v.z > 0, unrotateY: -0.404 },
      FR: { filter: (v) => v.x < 0 && v.z > 0, unrotateY: -0.355 },
      BL: { filter: (v) => v.x > 0 && v.z <= 0, unrotateY: 0 },
      BR: { filter: (v) => v.x < 0 && v.z <= 0, unrotateY: 0 }
    };
    this.wheelRigs = this.buildUniversalWheelRigs(model, [frontCompound, rearCompound], hubs, configs);
    model.userData.wheelRigs = this.wheelRigs;
  }
  setupBugattiModel(model) {
    const scale = 1.45;
    model.scale.set(scale, scale, scale);
    model.rotation.y = -Math.PI / 2;
    model.position.set(0, -0.40, 0);
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || child.material.name || "").toLowerCase();
        if (name.includes("body")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x0341ff,
            metalness: 0.72,
            roughness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04
          });
        } else if (name.includes("darker") || name.includes("black")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x02040a,
            metalness: 0.85,
            roughness: 0.18,
            clearcoat: 0.85,
            clearcoatRoughness: 0.08
          });
        } else if (name.includes("silver") || name.includes("steel") || name.includes("rims")) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.98,
            roughness: 0.10
          });
        }
      }
    });
    model.traverse((n) => {
      if (n.name === "Wheel-FL") this.wheelFL = n;
      if (n.name === "Wheel-FR") this.wheelFR = n;
      if (n.name === "Wheel-BL") this.wheelBL = n;
      if (n.name === "Wheel-BR") this.wheelBR = n;
      if (n.name === "spoiler") this.spoilerMesh = n;
      if (n.name === "Steering-wheel") this.steeringWheelMesh = n;
    });
    if (this.wheelFL) this.wheelFL_baseQuat = this.wheelFL.quaternion.clone();
    if (this.wheelFR) this.wheelFR_baseQuat = this.wheelFR.quaternion.clone();
    if (this.wheelBL) this.wheelBL_baseQuat = this.wheelBL.quaternion.clone();
    if (this.wheelBR) this.wheelBR_baseQuat = this.wheelBR.quaternion.clone();
    if (this.steeringWheelMesh) this.steering_baseQuat = this.steeringWheelMesh.quaternion.clone();
    if (this.spoilerMesh) this.spoiler_baseRotX = this.spoilerMesh.rotation.x;
  }
  setupMcLarenF1Model(model) {
    const scale = 1.18;
    model.scale.set(scale, scale, scale);
    model.position.set(0, 0.215, 0.5);
    model.rotation.y = 0;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || child.material.name || "").toLowerCase();
        if (name.includes("orange") || name.includes("papaya") || name.includes("c_png")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xff6b00,
            metalness: 0.65,
            roughness: 0.28,
            clearcoat: 0.9
          });
        } else if (name.includes("blue") || name.includes("gulf") || name.includes("m_png")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x00a3e0,
            metalness: 0.7,
            roughness: 0.25
          });
        }
      }
    });
    this.setupMcLarenF1Wheels(model);
  }
  setupMcLarenF1Wheels(model) {
    if (model.userData.wheelRigs) {
      this.wheelRigs = model.userData.wheelRigs;
      return;
    }
    const parents = [];
    model.traverse((c) => {
      if (c.isMesh && (c.name === "Object_6" || c.name === "Object_8" || c.name === "Object_9")) {
        parents.push(c);
      }
    });
    if (parents.length === 0) return;
    const hubs = {
      FL: new THREE.Vector3(0.825, -0.230, 1.139),
      FR: new THREE.Vector3(-0.824, -0.230, 1.139),
      BL: new THREE.Vector3(0.787, -0.229, -2.557),
      BR: new THREE.Vector3(-0.789, -0.229, -2.557)
    };
    const configs = {
      FL: { filter: (v) => v.x > 0 && v.z > 0.0, unrotateY: 0 },
      FR: { filter: (v) => v.x < 0 && v.z > 0.0, unrotateY: 0 },
      BL: { filter: (v) => v.x > 0 && v.z <= 0.0, unrotateY: 0 },
      BR: { filter: (v) => v.x < 0 && v.z <= 0.0, unrotateY: 0 }
    };
    this.wheelRigs = this.buildUniversalWheelRigs(model, parents, hubs, configs);
    model.userData.wheelRigs = this.wheelRigs;
  }
  setupDodgeChallengerModel(model) {
    model.scale.set(1.0, 1.0, 1.0);
    model.position.set(0, -0.326, 0);
    model.rotation.y = 0;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || child.material.name || "").toLowerCase();
        if (name.includes("carosserie") || name.includes("body")) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xa80e15,
            metalness: 0.82,
            roughness: 0.22,
            clearcoat: 1.0
          });
        } else if (name.includes("hood") || name.includes("noir")) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x141416,
            roughness: 0.72,
            metalness: 0.2
          });
        }
      }
    });
    this.setupDodgeChallengerWheels(model);
  }
  setupDodgeChallengerWheels(model) {
    if (model.userData.wheelRigs) {
      this.wheelRigs = model.userData.wheelRigs;
      return;
    }
    let wheelParent = null;
    model.traverse((n) => {
      if (n.name === "Plane001_14" || n.name === "Plane.001_14") wheelParent = n;
    });
    if (!wheelParent) return;
    const hubs = {
      FL: new THREE.Vector3(0.739, 0.246, 1.549),
      FR: new THREE.Vector3(-0.739, 0.246, 1.549),
      BL: new THREE.Vector3(0.739, 0.246, -1.410),
      BR: new THREE.Vector3(-0.739, 0.246, -1.410)
    };
    const configs = {
      FL: { filter: (v) => v.x > 0 && v.z > 0.05, unrotateY: 0 },
      FR: { filter: (v) => v.x < 0 && v.z > 0.05, unrotateY: 0 },
      BL: { filter: (v) => v.x > 0 && v.z <= 0.05, unrotateY: 0 },
      BR: { filter: (v) => v.x < 0 && v.z <= 0.05, unrotateY: 0 }
    };
    this.wheelRigs = this.buildUniversalWheelRigs(model, [wheelParent], hubs, configs);
    model.userData.wheelRigs = this.wheelRigs;
  }
  setupSeatedDriverAvatar() {
    if (this.seatedDriver && this.seatedDriver.parent) {
      this.seatedDriver.parent.remove(this.seatedDriver);
    }
    if (!window.GUSION_ARTICULATED_MODEL || !window.GUSION_ARTICULATED_MODEL.parts) {
      return;
    }
    const artData = window.GUSION_ARTICULATED_MODEL;
    const meta = this.CAR_METADATA[this.currentCarType] || this.CAR_METADATA.LAMBORGHINI;
    const tex = new THREE.Texture();
    const img = new Image();
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
    };
    img.src = artData.texture;
    const driverMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.45,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    const buildPart = (partName) => {
      const p = artData.parts[partName];
      if (!p) return new THREE.Group();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p.positions), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(p.normals), 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(p.uvs), 2));
      geo.setIndex(new THREE.BufferAttribute(new Uint16Array(p.indices), 1));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, driverMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };
    const driverRoot = new THREE.Group();
    const dScale = meta.driverScale || 0.52;
    driverRoot.scale.set(dScale, dScale, dScale);
    driverRoot.position.set(meta.driverPos.x, meta.driverPos.y, meta.driverPos.z);
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.12, 0);
    driverRoot.add(pelvis);
    const torso = new THREE.Group();
    torso.rotation.x = 0.18;
    pelvis.add(torso);
    torso.add(buildPart("torso"));
    const head = new THREE.Group();
    head.position.set(0, 0.50, 0);
    head.rotation.x = -0.15;
    torso.add(head);
    head.add(buildPart("head"));
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.24, 0.48, 0);
    leftArm.rotation.set(-0.85, 0.28, 0.35);
    torso.add(leftArm);
    leftArm.add(buildPart("left_arm"));
    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, 0.48, 0);
    rightArm.rotation.set(-0.85, -0.28, -0.35);
    torso.add(rightArm);
    rightArm.add(buildPart("right_arm"));
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.16, 0, 0);
    leftThigh.rotation.x = -Math.PI / 2.15;
    pelvis.add(leftThigh);
    leftThigh.add(buildPart("left_thigh"));
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.16, 0, 0);
    rightThigh.rotation.x = -Math.PI / 2.15;
    pelvis.add(rightThigh);
    rightThigh.add(buildPart("right_thigh"));
    const leftCalf = new THREE.Group();
    leftCalf.position.set(0, -0.42, 0);
    leftCalf.rotation.x = Math.PI / 2.2;
    leftThigh.add(leftCalf);
    leftCalf.add(buildPart("left_calf"));
    const rightCalf = new THREE.Group();
    rightCalf.position.set(0, -0.42, 0);
    rightCalf.rotation.x = Math.PI / 2.2;
    rightThigh.add(rightCalf);
    rightCalf.add(buildPart("right_calf"));
    this.seatedDriver = driverRoot;
    this.chassisGroup.add(this.seatedDriver);
  }
  setDoorOpenProgress(t) {
    this.doorOpenProgress = Math.max(0.0, Math.min(1.0, t));
    if (this.doorHingeL && this.doorHingeL_baseRot) {
      this.doorHingeL.rotation.x = this.doorHingeL_baseRot.x - 0.95 * this.doorOpenProgress;
      this.doorHingeL.rotation.y = this.doorHingeL_baseRot.y + 0.28 * this.doorOpenProgress;
      this.doorHingeL.rotation.z = this.doorHingeL_baseRot.z + 0.18 * this.doorOpenProgress;
    }
    if (this.doorHingeR && this.doorHingeR_baseRot) {
      this.doorHingeR.rotation.x = this.doorHingeR_baseRot.x - 0.95 * this.doorOpenProgress;
      this.doorHingeR.rotation.y = this.doorHingeR_baseRot.y - 0.28 * this.doorOpenProgress;
      this.doorHingeR.rotation.z = this.doorHingeR_baseRot.z - 0.18 * this.doorOpenProgress;
    }
  }
  animateDoor(target, duration = 0.65, onComplete = null) {
    this.targetDoorProgress = target;
    this.doorAnimDuration = duration;
    this.doorAnimTimer = 0;
    this.doorAnimStartProgress = this.doorOpenProgress;
    this.doorAnimCallback = onComplete;
  }
  openDoors(duration = 0.65, onComplete = null) {
    this.animateDoor(1.0, duration, onComplete);
  }
  closeDoors(duration = 0.55, onComplete = null) {
    this.animateDoor(0.0, duration, onComplete);
  }
  setupLightingSystems() {
    this.headlights.forEach(h => { if (h.parent) h.parent.remove(h); });
    this.underglowLights.forEach(u => { if (u.parent) u.parent.remove(u); });
    this.headlights = [];
    this.underglowLights = [];
    [-0.85, 0.85].forEach((xPos) => {
      const spot = new THREE.SpotLight(0xfffaed, 2.2, 60, Math.PI / 5.2, 0.35, 1.2);
      spot.position.set(xPos, 0.19, 2.05);
      const target = new THREE.Object3D();
      target.position.set(xPos, -0.25, 34);
      this.chassisGroup.add(target);
      spot.target = target;
      this.chassisGroup.add(spot);
      this.headlights.push(spot);
    });
    const underglowCoords = [
      { x: -0.75, z: 0.85 }, { x: 0.75, z: 0.85 },
      { x: -0.75, z: -0.85 }, { x: 0.75, z: -0.85 }
    ];
    underglowCoords.forEach((pos) => {
      const neon = new THREE.PointLight(this.config.COLORS.UNDERGLOW, 1.4, 4.8);
      neon.position.set(pos.x, -0.29, pos.z);
      this.chassisGroup.add(neon);
      this.underglowLights.push(neon);
    });
  }
  setupExhaustBackfireSystem() {
    this.exhaustFlames.forEach(f => { if (f.parent) f.parent.remove(f); });
    this.exhaustFlames = [];
    if (this.exhaustFlashLight && this.exhaustFlashLight.parent) {
      this.exhaustFlashLight.parent.remove(this.exhaustFlashLight);
    }
    const flameGeo = new THREE.ConeGeometry(0.085, 0.55, 12);
    flameGeo.rotateX(-Math.PI / 2);
    const blueCoreMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.95 });
    const orangeOuterMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });
    [-0.12, 0.12].forEach((xPos) => {
      const flameGroup = new THREE.Group();
      flameGroup.position.set(xPos, -0.044, -2.14);
      const innerCore = new THREE.Mesh(flameGeo, blueCoreMat);
      innerCore.scale.set(0.65, 0.65, 0.65);
      const outerPlume = new THREE.Mesh(flameGeo, orangeOuterMat);
      outerPlume.scale.set(1.15, 1.15, 1.15);
      flameGroup.add(innerCore, outerPlume);
      flameGroup.visible = false;
      this.chassisGroup.add(flameGroup);
      this.exhaustFlames.push(flameGroup);
    });
    this.exhaustFlashLight = new THREE.PointLight(0xff7700, 0, 8.0);
    this.exhaustFlashLight.position.set(0, -0.044, -2.2);
    this.chassisGroup.add(this.exhaustFlashLight);
  }
  setupTireSmokeSystem() {
    const particleCount = 20;
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;
    const ctx = smokeCanvas.getContext("2d");
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, "rgba(235, 240, 245, 0.85)");
    grad.addColorStop(0.4, "rgba(200, 210, 220, 0.45)");
    grad.addColorStop(1, "rgba(180, 190, 200, 0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);
    const smokeGeo = new THREE.PlaneGeometry(0.8, 0.8);
    for (let i = 0; i < particleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: smokeTex,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const p = new THREE.Mesh(smokeGeo, mat);
      p.visible = false;
      this.scene.add(p);
      this.smokeParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.65,
        vx: 0, vy: 0, vz: 0,
        scale: 0.5
      });
    }
  }
  spawnTireSmoke(x, y, z) {
    const p = this.smokeParticles.find(item => item.life <= 0);
    if (!p) return;
    p.mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.15, z + (Math.random() - 0.5) * 0.3);
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
    p.life = 0.01;
    p.maxLife = 0.55 + Math.random() * 0.25;
    p.vx = (Math.random() - 0.5) * 0.8;
    p.vy = 0.8 + Math.random() * 0.6;
    p.vz = (Math.random() - 0.5) * 0.8;
    p.scale = 0.5 + Math.random() * 0.3;
    p.mesh.scale.set(p.scale, p.scale, p.scale);
    p.mesh.visible = true;
    p.mesh.material.opacity = 0.65;
  }
  applyWeatherLighting(preset) {
    const hIntensity = preset.headlightsIntensity || 2.2;
    this.headlights.forEach((hl) => { hl.intensity = hIntensity; });
    const uIntensity = preset.underglowIntensity || 1.4;
    this.underglowLights.forEach((ug) => { ug.intensity = uIntensity; });
  }
  update(physics, dt) {
    this.rootGroup.position.set(physics.x, physics.y, physics.z);
    this.rootGroup.rotation.y = physics.rotation;
    this.chassisGroup.rotation.x = physics.pitch;
    this.chassisGroup.rotation.z = physics.roll;
    if (this.seatedDriver) {
      this.seatedDriver.visible = (physics.mode === "VEHICLE");
    }
    if (this.doorAnimDuration && this.doorAnimTimer < this.doorAnimDuration) {
      this.doorAnimTimer += dt;
      const progress = Math.min(1.0, this.doorAnimTimer / this.doorAnimDuration);
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const current = this.doorAnimStartProgress + (this.targetDoorProgress - this.doorAnimStartProgress) * eased;
      this.setDoorOpenProgress(current);
      if (progress >= 1.0) {
        this.doorAnimDuration = 0;
        if (typeof this.doorAnimCallback === "function") {
          const cb = this.doorAnimCallback;
          this.doorAnimCallback = null;
          cb();
        }
      }
    }
    const speed = physics.speed || 0;
    const absSpeed = Math.abs(speed);
    const steerAngle = physics.steeringAngle || 0;
    const isBraking = Boolean(physics.isBraking || speed < -0.2);
    const tireRadius = 0.355;
    const rollDelta = (speed / tireRadius) * dt;
    this.wheelRollAngle += rollDelta;
    if (this.wheelRigs) {
      this.wheelRigs.FL.steer.rotation.y = steerAngle;
      this.wheelRigs.FR.steer.rotation.y = steerAngle;
      this.wheelRigs.FL.roll.rotation.x = this.wheelRollAngle;
      this.wheelRigs.FR.roll.rotation.x = this.wheelRollAngle;
      this.wheelRigs.BL.roll.rotation.x = this.wheelRollAngle;
      this.wheelRigs.BR.roll.rotation.x = this.wheelRollAngle;
    } else {
      const rollAxis = new THREE.Vector3(0, 1, 0);
      const steerAxis = new THREE.Vector3(0, 0, 1);
      const updateWheelTransform = (wheel, baseQuat, isFront, steerSign) => {
        if (!wheel || !baseQuat) return;
        const qRoll = new THREE.Quaternion().setFromAxisAngle(rollAxis, this.wheelRollAngle);
        if (isFront) {
          const qSteer = new THREE.Quaternion().setFromAxisAngle(steerAxis, steerAngle * steerSign);
          wheel.quaternion.copy(baseQuat).multiply(qSteer).multiply(qRoll);
        } else {
          wheel.quaternion.copy(baseQuat).multiply(qRoll);
        }
      };
      updateWheelTransform(this.wheelFL, this.wheelFL_baseQuat, true, -1.0);
      updateWheelTransform(this.wheelFR, this.wheelFR_baseQuat, true, -1.0);
      updateWheelTransform(this.wheelBL, this.wheelBL_baseQuat, false, 1.0);
      updateWheelTransform(this.wheelBR, this.wheelBR_baseQuat, false, 1.0);
    }
    if (this.steeringWheelMesh && this.steering_baseQuat) {
      const steerColumnAxis = new THREE.Vector3(0, 1, 0);
      const qColumn = new THREE.Quaternion().setFromAxisAngle(steerColumnAxis, -steerAngle * 2.8);
      this.steeringWheelMesh.quaternion.copy(this.steering_baseQuat).multiply(qColumn);
    }
    if (this.spoilerMesh) {
      let targetSpoilerAngle = 0;
      if (physics.isAirbraking) {
        targetSpoilerAngle = 0.73;
      } else if (absSpeed > 12.0) {
        targetSpoilerAngle = 0.25 + (absSpeed / this.config.MAX_SPEED) * 0.15;
      }
      this.currentSpoilerAngle += (targetSpoilerAngle - this.currentSpoilerAngle) * 9.0 * dt;
      this.spoilerMesh.rotation.x = this.spoiler_baseRotX + this.currentSpoilerAngle;
    }
    const targetEmissive = isBraking ? 3.8 : 1.3;
    this.taillightMeshes.forEach((mat) => {
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 14.0 * dt;
    });
    const isBackfiring = Boolean(physics.backfireTimer > 0);
    this.exhaustFlames.forEach((flame) => {
      flame.visible = isBackfiring;
      if (isBackfiring) {
        const flicker = 0.85 + Math.random() * 0.45;
        flame.scale.set(flicker, flicker, flicker);
      }
    });
    if (this.exhaustFlashLight) {
      this.exhaustFlashLight.intensity = isBackfiring ? (3.5 + Math.random() * 2.0) : 0;
    }
    if (physics.isDrifting || (isBraking && absSpeed > 8.0)) {
      const cosY = Math.cos(physics.rotation);
      const sinY = Math.sin(physics.rotation);
      [-0.95, 0.95].forEach((sideX) => {
        const rearZ = -1.35;
        const wx = physics.x + sideX * cosY - rearZ * sinY;
        const wz = physics.z + sideX * sinY + rearZ * cosY;
        if (Math.random() < 0.65) {
          this.spawnTireSmoke(wx, physics.y, wz);
        }
      });
    }
    this.smokeParticles.forEach((p) => {
      if (p.life > 0) {
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const progress = p.life / p.maxLife;
        if (progress >= 1.0) {
          p.life = 0;
          p.mesh.visible = false;
        } else {
          const currentScale = p.scale + progress * 1.6;
          p.mesh.scale.set(currentScale, currentScale, currentScale);
          p.mesh.material.opacity = (1.0 - progress) * 0.55;
        }
      }
    });
  }
  buildProceduralFallback() {
    const hullMat = new THREE.MeshPhysicalMaterial({ color: 0x0341ff, metalness: 0.7, roughness: 0.2, clearcoat: 1.0 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 4.4), hullMat);
    hull.position.y = 0.52;
    this.chassisGroup.add(hull);
    const cabinMat = new THREE.MeshPhysicalMaterial({ color: 0x080e18, transparent: true, opacity: 0.7, metalness: 0.9 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.58, 2.1), cabinMat);
    cabin.position.set(0, 0.98, -0.15);
    this.chassisGroup.add(cabin);
    this.setupLightingSystems();
  }
  createContactShadowMesh() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(64, 128, 20, 64, 128, 115);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.82)");
    grad.addColorStop(0.35, "rgba(0, 0, 0, 0.55)");
    grad.addColorStop(0.7, "rgba(0, 0, 0, 0.2)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
    const texture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 4.9);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(shadowGeo, shadowMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.025, 0);
    mesh.visible = false;
    return mesh;
  }
  setContactShadow(visible) {
    if (this.contactShadow) {
      this.contactShadow.visible = Boolean(visible);
    }
  }
}
window.SportsCarModel = SportsCarModel;