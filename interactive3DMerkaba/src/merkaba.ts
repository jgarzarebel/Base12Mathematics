/* 
Taygetan/Swaruunian 3D Merkaba
  ~ J Garza
*/

import "./style.css";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BufferGeometry } from "three";

function rotateObject(
  object: BufferGeometry,
  degreeX = 0,
  degreeY = 0,
  degreeZ = 0
) {
  object.rotateX(THREE.MathUtils.degToRad(degreeX));
  object.rotateY(THREE.MathUtils.degToRad(degreeY));
  object.rotateZ(THREE.MathUtils.degToRad(degreeZ));
}

const init = () => {
  let container: HTMLElement;
  // ----
  // Add FPS Stats
  // ----
  const stats = new (Stats as any)();
  document.body.appendChild(stats.dom);

  // ----
  // GUI Options
  // ----

  enum Transparency {
    metalic = "metalic",
    metalicTransparent = "metalicTransparent",
    crystalTransparent = "crystalTransparent",
    transparent = "transparent",
  }

  const options = {
    taygetanNumbers: true,
    merkabaSpinAnimation: true,
    freezeRotation: false,
    merkabaRotaion: true,
    merkabaSpeed: 0,
    merkabaUltraGlow: false,
    merkabaTransparency: Transparency.metalic,
    merkabaSemiTransparent: false,
    etherTorus: false,
    etherTorusTickness: 0.1,
    backgroundColor: 0x1f1e1c,
    // Degub // TODO: Fix word.
    transmission: 1,
    thickness: 0.1,
    roughness: 0.32,
    envMapIntensity: 2.2,
    clearcoat: 1,
    clearcoatRoughness: 0.4,
    normalScale: 0,
    clearcoatNormalScale: 0.7,
    normalRepeat: 1,
    bloomThreshold: 0.12,
    bloomStrength: 0, // -> 2
    bloomRadius: 1,
  };

  // ----
  // Setup Three.js
  // ----

  container = <HTMLElement>document.getElementById("container");

  // Main Render
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
  });
  renderer.setClearColor(options.backgroundColor, 1);
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  // Camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.position.set(0, 40, 50);
  // Enable Oribtal Controls (Left Mouse Move)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  // Create a Scene for 3D objects
  const scene = new THREE.Scene();

  // ----
  // Glowing Effect
  // ----

  // Create a Glow Effect
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );
  // Add Glow Effect to Scene
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // ----
  // Taygetan Base12 floor Image
  // ----

  // Load Image
  const textureLoader = new THREE.TextureLoader();
  const base12FloorTexture = textureLoader.load(
    "textures/taybase12_circle.png"
  );
  // Add Image into a Planar Geometry
  const base12FloorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({
      map: base12FloorTexture,
      transparent: true,
    })
  );
  // Set Planar Geometry Size and rotate to floor.
  base12FloorMesh.position.set(-0.4, -1, 0.5);
  base12FloorMesh.rotation.x = -Math.PI / 2;
  scene.add(base12FloorMesh);

  // ----
  // Taygetan Merkaba
  // ----

  // Load Light Background (HDR) for shainiess
  const hdrEquirect = new RGBELoader().load(
    "textures/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  // Load crystal-like texture
  const normalMapTexture = new THREE.TextureLoader().load(
    "textures/crystalnormal.jpg"
  );
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  // Set Merkaba material texture
  const merkabaMaterial = new THREE.MeshPhysicalMaterial({
    transmission: options.transmission,
    // @ts-ignore
    thickness: options.thickness, // TODO: Issue this bug to Three.js
    roughness: options.roughness,
    envMap: hdrEquirect,
    envMapIntensity: options.envMapIntensity,
    clearcoat: options.clearcoat,
    clearcoatRoughness: options.clearcoatRoughness,
    normalScale: new THREE.Vector2(options.normalScale),
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
  });

  // Merkaba Triangle UP Geometry
  const triangleUp = new THREE.ConeGeometry(5, 5, 4);
  triangleUp.translate(0, 5, 0);

  // Merkaba Triangle DOWN Geometry
  const triangleDown = new THREE.ConeGeometry(5, 5, 4);
  rotateObject(triangleDown, 180, 0, 0);
  triangleDown.translate(0, 2.5, 0);

  // Merkaba
  const merkabaGeometry = BufferGeometryUtils.mergeBufferGeometries([
    triangleUp,
    triangleDown,
  ]);
  const merkabaMesh = new THREE.Mesh(merkabaGeometry, merkabaMaterial);
  merkabaMesh.position.set(0, 0, 0);

  // Add Merkaba to Scene
  scene.add(merkabaMesh);

  // ----
  // Spark Circle
  // ----

  // Create Spark Circle
  const color = new THREE.Color("#FFFFFF");
  const sparkMaterial = new THREE.MeshBasicMaterial({ color: color });
  const sparkCircle = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 15),
    sparkMaterial
  );
  sparkCircle.position.set(0, 3.5, 0); // Center

  // Add Spark to Scene
  scene.add(sparkCircle);

  // ----
  // Animate
  // ----

  // Animate parameters
  enum FASE {
    angle0 = "angle0",
    angle180 = "angle180",
  }
  const merkabaEffect = {
    speedMin: 0,
    speedMax: 45,
    speed: options.merkabaSpeed, // Speed in Degree
    step: 0.1, // Increment Step in Degrees
    fase: FASE.angle0, // Merkaba position in Degrees
  };
  const sparkEffect = {
    duration: 5, // Duration in Frames
    spark: 0, // Current spark Frames > 0 it sparks
  };

  // Maps a range based on another range
  function scaleRange(
    num: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
  ) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  // Loops on every frame
  const update = () => {
    if (options.merkabaRotaion) {
      // Set merkaba rotation speed - SPIN MERKABA!
      merkabaMesh.rotateOnWorldAxis(
        new THREE.Vector3(0, -1, 0),
        THREE.MathUtils.degToRad(merkabaEffect.speed)
      );

      // Get Angle Fase (0 or 180)
      merkabaMesh.updateMatrix();
      const merkabaDeg = Math.trunc(
        THREE.MathUtils.radToDeg(merkabaMesh.rotation.y)
      );
      const fase = merkabaDeg > 0 ? FASE.angle180 : FASE.angle0;

      // Set Spark
      if (fase !== merkabaEffect.fase) {
        // Reset Spark Effect
        sparkEffect.spark = sparkEffect.duration;
        merkabaEffect.fase = fase;
      }

      // Spark!
      if (sparkEffect.spark > 0) {
        sparkCircle.visible = true;
        bloomPass.strength = 2;
        sparkEffect.spark--;
      } else {
        sparkCircle.visible = false;
        bloomPass.strength = 0;
      }

      // Set torus tickness
      if (options.etherTorus) {
        // Scale torus tickness based on merkaba speed
        const tubeTickenss = scaleRange(
          merkabaEffect.speed,
          merkabaEffect.speedMin,
          merkabaEffect.speedMax,
          0.1,
          1.2
        );
        createTours(tubeTickenss);
      }
    }
  };

  // ----
  // Ether Torus
  // ----

  let torusMesh: THREE.Mesh<
    THREE.TorusGeometry,
    THREE.MeshBasicMaterial
  > | null = null;
  function createTours(tubeTickness: number /*0.1 - 1.2*/) {
    if (torusMesh != null) scene.remove(torusMesh);
    const torus = new THREE.TorusGeometry(5.4, tubeTickness, 30, 100);
    rotateObject(torus, 90, 0, 0);
    torusMesh = new THREE.Mesh(
      torus,
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    torusMesh.position.set(0, 3.8, 0); // Center around merkaba
    scene.add(torusMesh);
  }
  if (options.etherTorus) {
    createTours(options.etherTorusTickness);
  }

  // ----
  // Ultra Glow Effect
  // ----

  // Note: use it at high merkaba speed only
  let ultraGlowTimerTrue: number | null = null;
  let ultraGlowTimerFalse: number | null = null;
  function ultraGlowEffect(val: boolean) {
    if (val == true) {
      if (ultraGlowTimerTrue) clearInterval(ultraGlowTimerTrue);
      if (ultraGlowTimerFalse) clearInterval(ultraGlowTimerFalse);
      ultraGlowTimerTrue = setInterval(() => {
        if (merkabaMaterial.transmission <= 0) {
          if (ultraGlowTimerTrue) clearInterval(ultraGlowTimerTrue);
        } else {
          merkabaMaterial.transmission -= 0.1;
        }
      }, 150);
    } else {
      if (ultraGlowTimerTrue) clearInterval(ultraGlowTimerTrue);
      if (ultraGlowTimerFalse) clearInterval(ultraGlowTimerFalse);
      ultraGlowTimerFalse = setInterval(() => {
        if (merkabaMaterial.transmission >= getCurrentTransmission()) {
          if (ultraGlowTimerFalse) clearInterval(ultraGlowTimerFalse);
          transparencyEffect(options.merkabaTransparency); // Reset transparency
        } else {
          merkabaMaterial.transmission += 0.1;
        }
      }, 150);
    }
  }

  // ----
  // Merkaba Spin Effect
  // ----
  let merkabaSpinTimer: number | null = null;
  const COOLDOWNFRAMES = 36;
  const PEAKUPFRAMES = 24;
  const PEAKFRAMES = 72;
  const PEAKDOWNFRAMES = 48;
  function merkabaSpinEffect(enable: boolean) {
    if (enable == true) {
      if (merkabaSpinTimer) clearInterval(merkabaSpinTimer);
      let direction:
        | "cooldown"
        | "up"
        | "peakup"
        | "peak"
        | "peakdown"
        | "down" = "cooldown";
      let cooldownFrames = COOLDOWNFRAMES;
      let peakupFrames = PEAKUPFRAMES;
      let peakFrames = PEAKFRAMES;
      let peakdownFrames = PEAKDOWNFRAMES;

      merkabaSpinTimer = setInterval(() => {
        switch (direction) {
          case "cooldown":
            cooldownFrames--;
            if (cooldownFrames <= 0) {
              direction = "up";
              cooldownFrames = COOLDOWNFRAMES; // reset
            }
            break;
          case "up":
            merkabaEffect.speed += 0.5;
            if (merkabaEffect.speed >= 45) {
              direction = "peakup";
            }
            break;
          case "peakup":
            peakupFrames--;
            if (peakupFrames <= 0) {
              direction = "peak";
              peakupFrames = PEAKUPFRAMES; // reset
              ultraGlowEffect(true);
            }
            break;
          case "peak":
            peakFrames--;
            if (peakFrames <= 0) {
              direction = "peakdown";
              peakFrames = PEAKFRAMES; // reset
              ultraGlowEffect(false);
            }
            break;
          case "peakdown":
            peakdownFrames--;
            if (peakdownFrames <= 0) {
              direction = "down";
              peakdownFrames = PEAKDOWNFRAMES; // reset
            }
            break;
          case "down":
            merkabaEffect.speed -= 0.5;
            if (merkabaEffect.speed <= 0) {
              direction = "cooldown";
            }
            break;
        }
      }, 100);
    } else {
      if (merkabaSpinTimer) clearInterval(merkabaSpinTimer);
      ultraGlowEffect(false); // reset
    }
  }
  merkabaSpinEffect(options.merkabaSpinAnimation); // Init on start

  // ----
  // Transparency Effect
  // ----
  let currentTransmission = merkabaMaterial.transmission;
  function setCurrentTransmission(transmission: number) {
    currentTransmission = transmission;
  }

  function getCurrentTransmission() {
    return currentTransmission;
  }

  function transparencyEffect(val: string) {
    switch (val) {
      case Transparency.metalic:
        merkabaMaterial.transmission = 0.75;
        setCurrentTransmission(merkabaMaterial.transmission);
        merkabaMaterial.clearcoatRoughness = 0;
        merkabaMaterial.envMapIntensity = options.envMapIntensity;
        break;
      case Transparency.metalicTransparent:
        merkabaMaterial.transmission = 1;
        setCurrentTransmission(merkabaMaterial.transmission);
        merkabaMaterial.clearcoatRoughness = 0;
        merkabaMaterial.envMapIntensity = options.envMapIntensity;
        break;
      case Transparency.crystalTransparent: // normal
        merkabaMaterial.transmission = 1;
        setCurrentTransmission(merkabaMaterial.transmission);
        merkabaMaterial.clearcoatRoughness = 1;
        merkabaMaterial.envMapIntensity = options.envMapIntensity;
        break;
      case Transparency.transparent:
        merkabaMaterial.transmission = 1;
        setCurrentTransmission(merkabaMaterial.transmission);
        merkabaMaterial.clearcoatRoughness = 1;
        merkabaMaterial.envMapIntensity = 0;
        break;
      default:
        break;
    }
  }
  transparencyEffect(Transparency.metalic); // Init transparency

  // ----
  // Controls GUI
  // ----

  const gui = new GUI();

  gui.add(options, "taygetanNumbers").onChange((val: boolean) => {
    base12FloorMesh.visible = val;
  });

  gui.add(options, "merkabaSpinAnimation").onChange((val: boolean) => {
    // Reset Merkaba
    merkabaMesh.rotation.y = 0;
    options.merkabaRotaion = val;
    merkabaEffect.speed = 0;
    transparencyEffect(options.merkabaTransparency);
    ultraGlowEffect(false);
    merkabaSettings.reset();

    // Enable/Disable Controls GUI
    merkabaRotationSetting.disable(val);
    merkabaSpeedSetting.disable(val);
    merkabaUltraGlowSetting.disable(val);

    merkabaSpinEffect(val);
  });

  gui
    .add(options, "merkabaTransparency", [
      Transparency.metalic,
      Transparency.metalicTransparent,
      Transparency.crystalTransparent,
      Transparency.transparent,
    ])
    .onChange((val: string) => {
      transparencyEffect(val);
    });

  gui.add(options, "etherTorus").onChange((val: boolean) => {
    if (torusMesh) torusMesh.visible = val;
  });

  gui.addColor(options, "backgroundColor").onChange((val: number) => {
    renderer.setClearColor(val, 1);
  });

  const merkabaSettings = gui.addFolder("Taygetan Merkaba");
  merkabaSettings.open();

  const merkabaSpeedSetting = merkabaSettings
    .add(options, "merkabaSpeed", 0, 45, 0.5)
    .disable(true)
    .onChange((val: number) => {
      merkabaEffect.speed = val;
    });

  const merkabaRotationSetting = merkabaSettings
    .add(options, "freezeRotation")
    .disable(true)
    .onChange((val: boolean) => {
      options.merkabaRotaion = !val;
    });

  const merkabaUltraGlowSetting = merkabaSettings
    .add(options, "merkabaUltraGlow")
    .disable(true)
    .onChange((val: boolean) => {
      ultraGlowEffect(val);
    });

  // ----
  // Debug GUI Options
  // ----

  const debugSettings = gui.addFolder("Debug");
  debugSettings.close();

  debugSettings
    .add(options, "transmission", 0, 1, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.transmission = val;
    });

  debugSettings
    .add(options, "thickness", 0, 1, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.thickness = val;
    });
  merkabaMaterial;

  debugSettings
    .add(options, "roughness", 0, 1, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.roughness = val;
    });

  debugSettings
    .add(options, "envMapIntensity", 0, 3, 0.1)
    .onChange((val: number) => {
      merkabaMaterial.envMapIntensity = val;
    });

  debugSettings
    .add(options, "clearcoat", 0, 1, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.clearcoat = val;
    });

  debugSettings
    .add(options, "clearcoatRoughness", 0, 1, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.clearcoatRoughness = val;
    });

  debugSettings
    .add(options, "normalScale", 0, 5, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.normalScale.set(val, val);
    });

  debugSettings
    .add(options, "clearcoatNormalScale", 0, 5, 0.01)
    .onChange((val: number) => {
      merkabaMaterial.clearcoatNormalScale.set(val, val);
    });

  debugSettings
    .add(options, "normalRepeat", 1, 4, 1)
    .onChange((val: number) => {
      normalMapTexture.repeat.set(val, val);
    });

  const postprocessing = gui.addFolder("Debug Post Processing");
  postprocessing.close();

  postprocessing
    .add(options, "bloomThreshold", 0, 1, 0.01)
    .onChange((val: number) => {
      bloomPass.threshold = val;
    });

  postprocessing
    .add(options, "bloomStrength", 0, 5, 0.01)
    .onChange((val: number) => {
      bloomPass.strength = val;
    });

  postprocessing
    .add(options, "bloomRadius", 0, 1, 0.01)
    .onChange((val: number) => {
      bloomPass.radius = val;
    });

  const torusSettings = gui.addFolder("Debug Torus Settings");
  torusSettings.close();

  torusSettings
    .add(options, "etherTorusTickness", 0.1, 1.2, 0.01)
    .onChange((val: number) => {
      createTours(val);
    });

  // ----
  // Render Lifecycle (Risize & Render)
  // ----

  // -- EventListeners --
  window.addEventListener("resize", () => {
    resize();
  });

  // Updates three.js canvas
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2); // Cap DPR scaling to 2x

    const canvas = renderer.domElement;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";

    bloomPass.resolution.set(container.clientWidth, container.clientHeight);

    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);

    composer.setPixelRatio(dpr);
    composer.setSize(container.clientWidth, container.clientHeight);

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }

  // Animates three.js objects (loop)
  function render() {
    requestAnimationFrame(render);
    stats.begin();
    controls.update();
    update();
    renderer.render(scene, camera);
    composer.render();
    stats.end();
  }

  // ----
  // Init Lifecycle (Risize & Render)
  // ----
  resize();
  render();
};

init();
