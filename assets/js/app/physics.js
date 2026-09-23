class VehiclePhysicsEngine {
  constructor(config) {
    this.config = config || window.APP_CONFIG.CAR;
    this.worldConfig = window.APP_CONFIG.WORLD;
    this.x = 0;
    this.y = 0.45;
    this.z = -42;
    this.rotation = 0;
    this.speed = 0;
    this.lateralVelocity = 0;
    this.verticalVelocity = 0;
    this.angularVelocity = 0;
    this.steeringAngle = 0;
    this.maxSteerAngle = 0.52;
    this.pitch = 0;
    this.roll = 0;
    this.isAirborne = false;
    this.isDrifting = false;
    this.isBraking = false;
    this.isAccelerating = false;
    this.isFallingIntoVoid = false;
    this.boostLevel = 0;
    this.gear = 1;
    this.rpm = 1000;
    this.isAirbraking = false;
    this.backfireTimer = 0;
    this.launchControlActive = false;
    this.mode = "VEHICLE";
    this.walkerX = 0;
    this.walkerY = 0.5;
    this.walkerZ = 475;
    this.walkerRotation = 0;
    this.walkerSpeed = 0;
    this.walkerIsMoving = false;
    this.walkerIsRunning = false;
    this.walkerIsFalling = false;
    this.walkerVerticalVel = 0;
    this.footstepTimer = 0;
    this.onFootstepCallback = null;
    this.onModeChangeCallback = null;
    this.staticColliders = [];
    this.obstacles = [];
    this.customHeightProvider = null;
    this.onVoidFallCallback = null;
  }
  addStaticCollider(minX, maxX, minZ, maxZ, height = 50, label = "building", minY = -5.0) {
    this.staticColliders.push({
      minX,
      maxX,
      minZ,
      maxZ,
      height,
      minY,
      label
    });
  }
  addObstacle(mesh, type = "crate", radius = 0.95, mass = 1.2) {
    const obstacle = {
      mesh,
      type,
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
      vx: 0,
      vy: 0,
      vz: 0,
      rotX: mesh.rotation.x,
      rotY: mesh.rotation.y,
      rotZ: mesh.rotation.z,
      vrotX: 0,
      vrotY: 0,
      vrotZ: 0,
      radius,
      mass
    };
    this.obstacles.push(obstacle);
    return obstacle;
  }
  resetPosition(x = 0, z = -42, rotation = 0) {
    this.x = x;
    this.y = 0.45;
    this.z = z;
    this.rotation = rotation;
    this.speed = 0;
    this.lateralVelocity = 0;
    this.verticalVelocity = 0;
    this.angularVelocity = 0;
    this.steeringAngle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.isAirborne = false;
    this.isDrifting = false;
    this.isFallingIntoVoid = false;
    this.mode = "VEHICLE";
    this.walkerX = x;
    this.walkerY = 0.5;
    this.walkerZ = z;
    this.walkerRotation = rotation;
    this.walkerSpeed = 0;
    this.walkerIsMoving = false;
    this.walkerIsRunning = false;
    this.walkerIsFalling = false;
    this.walkerVerticalVel = 0;
  }
  getGroundElevation(x, z) {
    if (typeof this.customHeightProvider === "function") {
      const customElev = this.customHeightProvider(x, z);
      if (customElev !== null && customElev !== undefined) {
        return customElev;
      }
    }
    if (z >= 950 && z <= 1015) {
      const distToSanctuaryCenter = Math.hypot(x, z - 975);
      if (distToSanctuaryCenter <= 26.0) {
        return 32.0;
      }
      return null;
    }
    if (z >= 475 && z < 975) {
      if (Math.abs(x) <= 9.2) {
        const progress = (z - 475) / 500.0;
        return 0.05 + progress * 31.95;
      }
    }
    if (z >= 340 && z <= 580 && Math.abs(x) <= 16.0) {
      return 0.05;
    }
    if (Math.abs(x) <= 780 && z >= -780 && z <= 580) {
      return 0.05;
    }
    return null;
  }
  getSkywayElevation(x, z) {
    return this.getGroundElevation(x, z);
  }
  exitVehicle() {
    if (this.mode === "WALKING") return false;
    this.mode = "WALKING";
    this.speed = 0;
    this.angularVelocity = 0;
    this.lateralVelocity = 0;
    this.isAccelerating = false;
    this.isBraking = false;
    this.isDrifting = false;
    this.walkerX = this.x - 2.0 * Math.cos(this.rotation);
    this.walkerZ = this.z + 2.0 * Math.sin(this.rotation);
    this.walkerY = this.getGroundElevation(this.walkerX, this.walkerZ) || 0.05;
    this.walkerRotation = this.rotation;
    this.walkerSpeed = 0;
    this.walkerIsMoving = false;
    this.walkerIsRunning = false;
    this.walkerIsFalling = false;
    this.walkerVerticalVel = 0;
    if (typeof this.onModeChangeCallback === "function") {
      this.onModeChangeCallback(this.mode);
    }
    return true;
  }
  enterVehicle() {
    if (this.mode === "VEHICLE") return false;
    const dist = Math.hypot(this.walkerX - this.x, this.walkerZ - this.z);
    if (dist > 7.5) return false;
    this.mode = "VEHICLE";
    this.walkerIsMoving = false;
    this.walkerIsRunning = false;
    if (typeof this.onModeChangeCallback === "function") {
      this.onModeChangeCallback(this.mode);
    }
    return true;
  }
  updateWalker(dt, input) {
    if (this.walkerIsFalling) {
      this.walkerVerticalVel -= 28.0 * dt;
      this.walkerY += this.walkerVerticalVel * dt;
      if (this.walkerY < -10.0) {
        if (window.soundEngine) window.soundEngine.playVoidFallSplash();
        this.walkerX = 0;
        this.walkerZ = 478;
        this.walkerY = 0.5;
        this.walkerRotation = 0;
        this.walkerVerticalVel = 0;
        this.walkerIsFalling = false;
        if (typeof this.onVoidFallCallback === "function") {
          this.onVoidFallCallback("walker");
        }
      }
      return;
    }
    const isSprinting = Boolean(input.space || input.shift);
    const maxWalkSpeed = isSprinting ? 14.5 : 5.5;
    let forwardInput = 0;
    let rightInput = 0;
    if (input.forward) forwardInput += 1;
    if (input.backward) forwardInput -= 1;
    if (input.left) rightInput -= 1;
    if (input.right) rightInput += 1;
    const camAngle = (typeof window.getWalkerCameraHeading === "function")
      ? window.getWalkerCameraHeading()
      : (this.walkerRotation + (window.cameraYawOffset || 0));
    const isAiming = Boolean(window.world && window.world.isAiming && window.world.activeCharacter === "MIYU");
    const hasInput = (forwardInput !== 0 || rightInput !== 0);
    let moveDirX = 0;
    let moveDirZ = 0;
    if (hasInput) {
      const sinC = Math.sin(camAngle);
      const cosC = Math.cos(camAngle);
      moveDirX = sinC * forwardInput + cosC * rightInput;
      moveDirZ = cosC * forwardInput - sinC * rightInput;
      const len = Math.hypot(moveDirX, moveDirZ);
      if (len > 0.001) {
        moveDirX /= len;
        moveDirZ /= len;
      }
      if (isAiming) {
        this.walkerRotation = camAngle;
      } else {
        const targetRot = Math.atan2(moveDirX, moveDirZ);
        let diff = targetRot - this.walkerRotation;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turnSpeed = isSprinting ? 18.0 : 14.0;
        this.walkerRotation += diff * Math.min(1.0, turnSpeed * dt);
      }
    } else if (isAiming) {
      this.walkerRotation = camAngle;
    }
    const targetSpeed = hasInput ? maxWalkSpeed : 0;
    const accelRate = hasInput ? (isSprinting ? 32.0 : 22.0) : 26.0;
    if (this.walkerSpeed < targetSpeed) {
      this.walkerSpeed = Math.min(targetSpeed, this.walkerSpeed + accelRate * dt);
    } else if (this.walkerSpeed > targetSpeed) {
      this.walkerSpeed = Math.max(targetSpeed, this.walkerSpeed - accelRate * dt);
    }
    this.walkerIsMoving = Math.abs(this.walkerSpeed) > 0.3;
    this.walkerIsRunning = isSprinting && this.walkerIsMoving && Math.abs(this.walkerSpeed) > 6.0;
    if (this.walkerIsMoving) {
      const fwdX = hasInput ? moveDirX : Math.sin(this.walkerRotation);
      const fwdZ = hasInput ? moveDirZ : Math.cos(this.walkerRotation);
      const moveDist = this.walkerSpeed * dt;
      const prevX = this.walkerX;
      this.walkerX += fwdX * moveDist;
      this.resolveWalkerStaticCollisions("X", prevX);
      const prevZ = this.walkerZ;
      this.walkerZ += fwdZ * moveDist;
      this.resolveWalkerStaticCollisions("Z", prevZ);
      this.footstepTimer += dt;
      const stepInterval = isSprinting ? 0.22 : 0.44;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        if (typeof this.onFootstepCallback === "function") {
          this.onFootstepCallback(isSprinting);
        }
      }
    } else {
      this.footstepTimer = 0.2;
    }
    const elev = this.getGroundElevation(this.walkerX, this.walkerZ);
    if (elev !== null) {
      const diff = elev - this.walkerY;
      if (diff > 0 && diff <= 0.85) {
        this.walkerY = elev;
      } else {
        this.walkerY += diff * Math.min(1.0, 24.0 * dt);
      }
      this.walkerIsFalling = false;
      this.walkerVerticalVel = 0;
    } else {
      this.walkerIsFalling = true;
      this.walkerVerticalVel -= 20.0 * dt;
      this.walkerY += this.walkerVerticalVel * dt;
      if (this.walkerY < -3.5) {
        if (window.soundEngine && typeof window.soundEngine.playVoidFallSplash === "function") {
          window.soundEngine.playVoidFallSplash();
        }
        const distToCar = Math.hypot(this.walkerX - this.x, this.walkerZ - this.z);
        if (distToCar < 250.0) {
          this.walkerX = this.x - 2.0 * Math.cos(this.rotation);
          this.walkerZ = this.z + 2.0 * Math.sin(this.rotation);
          this.walkerY = this.getGroundElevation(this.walkerX, this.walkerZ) || 0.05;
        } else {
          this.walkerX = 0;
          this.walkerZ = 475;
          this.walkerY = 0.05;
        }
        this.walkerVerticalVel = 0;
        this.walkerIsFalling = false;
      }
    }
  }
  resolveWalkerStaticCollisions(axis, prevCoord) {
    const walkerRadius = 0.38;
    const walkerHeight = 1.80;
    for (let i = 0; i < this.staticColliders.length; i++) {
      const box = this.staticColliders[i];
      const boxMinY = box.minY !== undefined ? box.minY : -5.0;
      const boxMaxY = box.height !== undefined ? box.height : 60.0;
      if (this.walkerY >= boxMaxY - 0.05 || (this.walkerY + walkerHeight) <= boxMinY + 0.05) {
        continue;
      }
      if (axis === "X") {
        if (this.walkerZ >= box.minZ - walkerRadius * 0.95 && this.walkerZ <= box.maxZ + walkerRadius * 0.95) {
          if (prevCoord >= box.maxX + walkerRadius && this.walkerX < box.maxX + walkerRadius) {
            this.walkerX = box.maxX + walkerRadius;
          } else if (prevCoord <= box.minX - walkerRadius && this.walkerX > box.minX - walkerRadius) {
            this.walkerX = box.minX - walkerRadius;
          }
        }
      } else if (axis === "Z") {
        if (this.walkerX >= box.minX - walkerRadius * 0.95 && this.walkerX <= box.maxX + walkerRadius * 0.95) {
          if (prevCoord >= box.maxZ + walkerRadius && this.walkerZ < box.maxZ + walkerRadius) {
            this.walkerZ = box.maxZ + walkerRadius;
          } else if (prevCoord <= box.minZ - walkerRadius && this.walkerZ > box.minZ - walkerRadius) {
            this.walkerZ = box.minZ - walkerRadius;
          }
        }
      }
    }
  }
  update(deltaTime, input) {
    const dt = Math.min(deltaTime, 0.05);
    if (this.mode === "WALKING") {
      this.updateWalker(dt, input);
      return;
    }
    this.updateSteering(dt, input);
    this.updateLongitudinalDrive(dt, input);
    this.updateCorneringAndDrift(dt, input);
    this.integratePosition(dt);
    this.resolveStaticCollisions();
    this.updateVerticalDynamics(dt);
    this.updateSuspensionLean(dt);
    this.resolveObstacles(dt);
  }
  updateSteering(dt, input) {
    const speedRatio = Math.abs(this.speed) / this.config.MAX_SPEED;
    const speedDamping = 1.0 / (1.0 + speedRatio * 1.15);
    const targetLock = this.maxSteerAngle * speedDamping;
    let targetAngle = 0;
    if (input.left) targetAngle = targetLock;
    else if (input.right) targetAngle = -targetLock;
    const steerRate = (targetAngle === 0) ? 14.0 : 10.5;
    this.steeringAngle += (targetAngle - this.steeringAngle) * Math.min(1.0, steerRate * dt);
  }
  updateLongitudinalDrive(dt, input) {
    this.isAccelerating = false;
    this.isBraking = false;
    const handbrake = input.space;
    if (this.backfireTimer > 0) {
      this.backfireTimer -= dt;
    }
    if (input.forward) {
      this.isAccelerating = true;
      this.reverseEngageTimer = 0;
      this.boostLevel = Math.min(2.8, this.boostLevel + 2.4 * dt);
      if (this.speed < -0.4) {
        this.speed += this.config.BRAKE_FORCE * dt;
        this.isBraking = true;
      } else {
        const boostMultiplier = 1.0 + (this.boostLevel / 2.8) * 0.45;
        const speedFraction = Math.max(0, this.speed / this.config.MAX_SPEED);
        const torqueMultiplier = (1.0 - Math.pow(speedFraction, 1.6) * 0.60) * boostMultiplier;
        this.speed = Math.min(this.speed + this.config.ACCELERATION * torqueMultiplier * dt, this.config.MAX_SPEED);
      }
    } else {
      if (this.boostLevel > 1.2) {
        if (window.soundEngine && typeof window.soundEngine.playTurboBlowOff === "function") {
          window.soundEngine.playTurboBlowOff();
        }
        if (this.rpm > 3800 && Math.random() < 0.7) {
          this.triggerBackfire();
        }
      }
      this.boostLevel = Math.max(0, this.boostLevel - 5.0 * dt);
      if (input.backward) {
        if (this.speed > 0.4) {
          this.isBraking = true;
          this.speed = Math.max(0, this.speed - this.config.BRAKE_FORCE * dt);
          this.reverseEngageTimer = 0;
        } else {
          this.reverseEngageTimer = (this.reverseEngageTimer || 0) + dt;
          if (this.reverseEngageTimer > 0.08) {
            this.speed = Math.max(this.speed - this.config.ACCELERATION * 0.65 * dt, this.config.MAX_REVERSE_SPEED);
          } else {
            this.speed = 0;
          }
        }
      } else {
        this.reverseEngageTimer = 0;
        const rollFriction = this.config.FRICTION * dt;
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - rollFriction);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + rollFriction);
        }
        if (Math.abs(this.speed) < 0.15) {
          this.speed = 0;
          this.lateralVelocity = 0;
          this.angularVelocity = 0;
        }
      }
    }
    if (handbrake) {
      this.isBraking = true;
      const handbrakeBite = this.config.BRAKE_FORCE * 0.85 * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - handbrakeBite);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + handbrakeBite);
      if (Math.abs(this.speed) < 0.15) {
        this.speed = 0;
        this.lateralVelocity = 0;
        this.angularVelocity = 0;
      }
    }
    this.isAirbraking = this.isBraking && this.speed > 12.0;
    if (this.isAirbraking) {
      const airbrakeDrag = 16.5 * dt;
      this.speed = Math.max(0, this.speed - airbrakeDrag);
    }
    this.updateTransmission(dt);
  }
  updateTransmission(dt) {
    const absSpeed = Math.abs(this.speed);
    const gearThresholds = [0, 14, 25, 36, 48, 58, 65];
    let newGear = 1;
    for (let g = 6; g >= 1; g--) {
      if (absSpeed >= gearThresholds[g]) {
        newGear = g + 1;
        break;
      }
    }
    if (newGear !== this.gear) {
      if (newGear > this.gear && this.isAccelerating) {
        this.triggerBackfire();
      }
      this.gear = newGear;
    }
    const lowerSpeed = gearThresholds[this.gear - 1] || 0;
    const upperSpeed = gearThresholds[this.gear] || (this.config.MAX_SPEED + 6);
    const speedRatioInGear = (absSpeed - lowerSpeed) / Math.max(1, upperSpeed - lowerSpeed);
    const targetRpm = 1100 + speedRatioInGear * 5800 + (this.isAccelerating ? 600 : 0);
    this.rpm += (targetRpm - this.rpm) * 12.0 * dt;
  }
  triggerBackfire() {
    this.backfireTimer = 0.24;
    if (window.soundEngine && typeof window.soundEngine.playBackfirePop === "function") {
      window.soundEngine.playBackfirePop();
    }
  }
  updateCorneringAndDrift(dt, input) {
    const handbrake = input.space;
    const wheelBase = this.config.WHEEL_BASE;
    let targetAngularVelocity = (this.speed / wheelBase) * Math.sin(this.steeringAngle);
    const downforceRatio = Math.pow(Math.abs(this.speed) / this.config.MAX_SPEED, 2.0);
    const aeroGripBonus = 1.0 + downforceRatio * 1.5;
    const gripCoeff = handbrake ? 0.62 : 1.45;
    const maxLatAcc = gripCoeff * 9.81 * aeroGripBonus;
    const maxSafeYawRate = maxLatAcc / Math.max(Math.abs(this.speed), 3.5);
    targetAngularVelocity = Math.max(-maxSafeYawRate, Math.min(maxSafeYawRate, targetAngularVelocity));
    const yawResponsiveness = 10.5;
    this.angularVelocity += (targetAngularVelocity - this.angularVelocity) * yawResponsiveness * dt;
    this.rotation += this.angularVelocity * dt;
    const lateralSpeed = Math.abs(this.angularVelocity * this.speed);
    const isSharpTurn = lateralSpeed > (9.5 * aeroGripBonus);
    this.isDrifting = (handbrake && Math.abs(this.speed) > 5.5) || (isSharpTurn && !handbrake);
    if (this.isDrifting) {
      this.lateralVelocity += Math.sin(this.steeringAngle) * this.speed * 0.35 * dt;
      this.lateralVelocity *= Math.pow(0.96, dt * 60);
    } else {
      this.lateralVelocity *= Math.pow(0.78 / aeroGripBonus, dt * 60);
    }
  }
  integratePosition(dt) {
    const forwardX = Math.sin(this.rotation);
    const forwardZ = Math.cos(this.rotation);
    const sideX = Math.cos(this.rotation);
    const sideZ = -Math.sin(this.rotation);
    this.x += (forwardX * this.speed + sideX * this.lateralVelocity) * dt;
    this.z += (forwardZ * this.speed + sideZ * this.lateralVelocity) * dt;
  }
  resolveStaticCollisions() {
    const carRadius = 1.35;
    for (let i = 0; i < this.staticColliders.length; i++) {
      const box = this.staticColliders[i];
      const boxMinY = box.minY !== undefined ? box.minY : -5.0;
      const boxMaxY = box.height !== undefined ? box.height : 60.0;
      if (this.y >= boxMaxY || (this.y + 1.6) <= boxMinY) {
        continue;
      }
      const closestX = Math.max(box.minX, Math.min(this.x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(this.z, box.maxZ));
      const distX = this.x - closestX;
      const distZ = this.z - closestZ;
      const distSq = distX * distX + distZ * distZ;
      if (distSq < carRadius * carRadius) {
        let nx = 0;
        let nz = 0;
        let penetration = 0;
        if (distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          penetration = carRadius - dist;
          nx = distX / dist;
          nz = distZ / dist;
        } else {
          const dLeft = Math.abs(this.x - box.minX);
          const dRight = Math.abs(this.x - box.maxX);
          const dTop = Math.abs(this.z - box.minZ);
          const dBottom = Math.abs(this.z - box.maxZ);
          const minEdge = Math.min(dLeft, dRight, dTop, dBottom);
          if (minEdge === dLeft) { nx = -1; penetration = carRadius + dLeft; }
          else if (minEdge === dRight) { nx = 1; penetration = carRadius + dRight; }
          else if (minEdge === dTop) { nz = -1; penetration = carRadius + dTop; }
          else { nz = 1; penetration = carRadius + dBottom; }
        }
        this.x += nx * penetration;
        this.z += nz * penetration;
        const forwardX = Math.sin(this.rotation);
        const forwardZ = Math.cos(this.rotation);
        const vx = forwardX * this.speed + Math.cos(this.rotation) * this.lateralVelocity;
        const vz = forwardZ * this.speed - Math.sin(this.rotation) * this.lateralVelocity;
        const normalDot = vx * nx + vz * nz;
        if (normalDot < 0) {
          const restitution = 0.28;
          const bounceImpulse = -(1 + restitution) * normalDot;
          const newVx = vx + nx * bounceImpulse;
          const newVz = vz + nz * bounceImpulse;
          this.speed = (newVx * forwardX + newVz * forwardZ) * 0.72;
          this.lateralVelocity = (newVx * Math.cos(this.rotation) - newVz * Math.sin(this.rotation)) * 0.6;
          const impactForce = Math.abs(normalDot);
          if (impactForce > 1.8 && window.soundEngine) {
            window.soundEngine.playHit(Math.min(1.0, impactForce / 12.0));
          }
        }
      }
    }
  }
  updateVerticalDynamics(dt) {
    const groundY = this.getGroundElevation(this.x, this.z);
    const rampX = 24, rampZ = -20, rampW = 6, rampL = 10;
    const onRamp = Math.abs(this.x - rampX) < rampW / 2 && Math.abs(this.z - rampZ) < rampL / 2;
    if (onRamp && !this.isAirborne && this.speed > 8.5) {
      this.isAirborne = true;
      this.verticalVelocity = Math.min(this.speed * 0.52, 14.5);
      if (window.soundEngine) window.soundEngine.playHit(0.4);
    }
    if (groundY === null) {
      this.isAirborne = true;
      this.isFallingIntoVoid = true;
      this.verticalVelocity -= 28.0 * dt;
      this.y += this.verticalVelocity * dt;
      if (this.y < -10.0) {
        this.triggerVoidFall();
      }
    } else {
      const targetRideHeight = groundY + 0.45;
      if (this.isAirborne) {
        this.verticalVelocity -= 26.0 * dt;
        this.y += this.verticalVelocity * dt;
        if (this.y <= targetRideHeight) {
          this.y = targetRideHeight;
          this.verticalVelocity = 0;
          this.isAirborne = false;
          this.isFallingIntoVoid = false;
          if (window.soundEngine) window.soundEngine.playHit(0.5);
        }
      } else {
        this.y += (targetRideHeight - this.y) * Math.min(1.0, 24.0 * dt);
        this.verticalVelocity = 0;
      }
    }
  }
  triggerVoidFall() {
    if (window.soundEngine) {
      window.soundEngine.playVoidFallSplash();
    }
    this.resetPosition(0, -42, 0);
    if (typeof this.onVoidFallCallback === "function") {
      this.onVoidFallCallback();
    }
  }
  updateSuspensionLean(dt) {
    let slopePitch = 0;
    if (this.z >= 475 && this.z <= 975) {
      const rampIncline = 0.063;
      slopePitch = -Math.cos(this.rotation) * rampIncline;
    }
    const airbrakeDip = this.isAirbraking ? 0.045 : 0;
    const targetPitch = slopePitch + (this.isAccelerating ? -0.075 : 0) + (this.isBraking ? (0.095 + airbrakeDip) : 0);
    const lateralG = (this.speed / this.config.MAX_SPEED) * (this.angularVelocity / 1.5);
    const targetRoll = -lateralG * 0.12;
    this.pitch += (targetPitch - this.pitch) * 9.5 * dt;
    this.roll += (targetRoll - this.roll) * 9.5 * dt;
  }
  resolveObstacles(dt) {
    const carRadius = 1.5;
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      if (Math.abs(o.vx) > 0.02 || Math.abs(o.vz) > 0.02 || o.y > 0.6) {
        o.x += o.vx * dt;
        o.z += o.vz * dt;
        o.y += o.vy * dt;
        o.vx *= Math.pow(0.93, dt * 60);
        o.vz *= Math.pow(0.93, dt * 60);
        if (o.y > 0.6) o.vy -= 20 * dt;
        else { o.y = 0.6; o.vy = 0; }
        o.rotX += o.vrotX * dt;
        o.rotY += o.vrotY * dt;
        o.rotZ += o.vrotZ * dt;
        o.vrotX *= 0.95; o.vrotY *= 0.95; o.vrotZ *= 0.95;
        o.mesh.position.set(o.x, o.y, o.z);
        o.mesh.rotation.set(o.rotX, o.rotY, o.rotZ);
      }
      const dx = o.x - this.x;
      const dz = o.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const threshold = carRadius + o.radius;
      if (dist < threshold && dist > 0.001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const pen = threshold - dist;
        o.x += nx * pen * 0.85;
        o.z += nz * pen * 0.85;
        const impact = Math.max(Math.abs(this.speed) * 0.85, 4.5) / o.mass;
        o.vx += nx * impact;
        o.vz += nz * impact;
        o.vy = Math.min(impact * 0.4, 7.0);
        o.vrotX = (Math.random() - 0.5) * impact * 1.8;
        o.vrotY = (Math.random() - 0.5) * impact * 2.0;
        o.vrotZ = (Math.random() - 0.5) * impact * 1.8;
        this.speed *= 0.72;
        if (window.soundEngine) {
          window.soundEngine.playHit(Math.min(impact / 12, 1.0));
        }
      }
    }
  }
}
window.VehiclePhysicsEngine = VehiclePhysicsEngine;