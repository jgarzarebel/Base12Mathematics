import "./style.css";

// // @ts-ignore
// import * as THREE from "https://cdn.skypack.dev/three";
// // @ts-ignore
// import Stats from "https://cdn.skypack.dev/three/examples/jsm/libs/stats.module.js";
// // @ts-ignore
// import { GUI } from "https://cdn.skypack.dev/three/examples/jsm/libs/lil-gui.module.min.js";
// OR import {GUI as lilgui} from 'https://cdn.skypack.dev/lil-gui';
// // @ts-ignore
// import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";
// // @ts-ignore
// import { Water } from "https://cdn.skypack.dev/three/examples/jsm/objects/Water.js";
// // @ts-ignore
// import { Sky } from "https://cdn.skypack.dev/three/examples/jsm/objects/Sky.js";

import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { LuminosityHighPassShader } from "three/examples/jsm/shaders/LuminosityHighPassShader";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BufferGeometry } from "three";
// @ts-ignore
import canvasSketch from "canvas-sketch";

const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false,
};

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

const sketch = ({ context, canvas, width, height }: any) => {
  const stats = new (Stats as any)();
  document.body.appendChild(stats.dom);
  const gui = new GUI();

  const options = {
    enableSwoopingCamera: false,
    enableRotation: true,
    transmission: 1,
    thickness: 0.1,
    roughness: 0.32,
    envMapIntensity: 2.2,
    clearcoat: 1,
    clearcoatRoughness: 0.4,
    normalScale: 0,
    clearcoatNormalScale: 0.7,
    normalRepeat: 1,
    // bloomThreshold: 0.15, // 0.99
    // bloomStrength: 1.2,   // 5
    // bloomRadius: 1,       // 1
    bloomThreshold: 0.12,
    bloomStrength: 0,
    bloomRadius: 1,
  };

  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false,
  });
  renderer.setClearColor(0x1f1e1c, 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 40, 50);

  const controls = new OrbitControls(camera, canvas);
  controls.enabled = !options.enableSwoopingCamera;

  const scene = new THREE.Scene();

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );

  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // Background Image
  // -------

  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load("textures/taybase12_circle.png");
  const bgGeometry = new THREE.PlaneGeometry(20, 20);
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    transparent: true,
  });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(-0.4, -1, 0.5);
  bgMesh.rotation.x = -Math.PI / 2;

  scene.add(bgMesh);

  // Merkaba
  // -------

  const hdrEquirect = new RGBELoader().load(
    "src/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const normalMapTexture = new THREE.TextureLoader().load("src/normal.jpg");
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  const material = new THREE.MeshPhysicalMaterial({
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

  // Triangle Up Geometry
  const triangleUp = new THREE.ConeGeometry(5, 5, 4);
  triangleUp.translate(0, 5, 0);

  // Triangle Down Geometry
  const triangleDown = new THREE.ConeGeometry(5, 5, 4);
  rotateObject(triangleDown, 180, 0, 0);
  triangleDown.translate(0, 2.5, 0);

  // Merkaba
  const merkabaGeometry = BufferGeometryUtils.mergeBufferGeometries([
    triangleUp,
    triangleDown,
  ]);
  const mesh = new THREE.Mesh(merkabaGeometry, material);

  // const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  mesh.position.set(0, 0, 0);

  // Spark
  // -------

  //   // SUPER SIMPLE GLOW EFFECT
  //   // use sprite because it appears the same from all angles
  //   var spriteMaterial = new THREE.SpriteMaterial({
  //     map: new THREE.TextureLoader().load(
  //       // resource URL
  //       "src/glow.png",
  //       // onLoad callback
  //       (texture) => {
  //         return texture;
  //       }
  //     ),
  //     color: 0xffffff,
  //     transparent: true,
  //     opacity: 1,
  //     blending: THREE.AdditiveBlending,
  //   });
  //   var sprite = new THREE.Sprite(spriteMaterial);
  //   sprite.scale.set(10, 10, 10);
  //   sprite.position.set(0, 4, 0);
  //   mesh.add(sprite);

  // Spark object
  const color = new THREE.Color("#FFFFFF");
  const sparkMaterial = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 15),
    sparkMaterial
  );
  sphere.position.set(0, 3.5, 0);
  scene.add(sphere);

  //   // SUN
  //   // ---

  //   let sun = new THREE.Vector3();
  //   const sky = new Sky();
  //   sky.scale.setScalar(10000);
  //   scene.add(sky);
  //   const skyUniforms = sky.material.uniforms;
  //   skyUniforms["turbidity"].value = 10;
  //   skyUniforms["rayleigh"].value = 2;
  //   skyUniforms["mieCoefficient"].value = 0.005;
  //   skyUniforms["mieDirectionalG"].value = 0.8;

  //   const parameters = {
  //     elevation: 2,
  //     azimuth: 180,
  //   };

  //   const pmremGenerator = new THREE.PMREMGenerator(renderer);
  //   function updateSun() {
  //     const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  //     const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  //     sun.setFromSphericalCoords(1, phi, theta);

  //     sky.material.uniforms["sunPosition"].value.copy(sun);
  //     // water.material.uniforms["sunDirection"].value.copy(sun).normalize();

  //     scene.environment = pmremGenerator.fromScene(<any>sky).texture;
  //   }
  //   updateSun();

  //   // Water
  //   // ---

  //   const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  //   let water = new Water(waterGeometry, {
  //     textureWidth: 512,
  //     textureHeight: 512,
  //     waterNormals: new THREE.TextureLoader().load(
  //       "textures/waternormals.jpg",
  //       function (texture) {
  //         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //       }
  //     ),
  //     sunDirection: new THREE.Vector3(),
  //     sunColor: 0xffffff,
  //     waterColor: 0x001e0f,
  //     distortionScale: 3.7,
  //     fog: scene.fog !== undefined,
  //   });
  //   water.rotation.x = -Math.PI / 2;
  //   scene.add(water);

  // GUI
  // ---

  gui.add(options, "enableSwoopingCamera").onChange((val: number) => {
    controls.enabled = !val;
    controls.reset();
  });

  gui.add(options, "enableRotation").onChange(() => {
    mesh.rotation.set(0, 0, 0);
  });

  gui.add(options, "transmission", 0, 1, 0.01).onChange((val: number) => {
    material.transmission = val;
  });

  gui.add(options, "thickness", 0, 1, 0.01).onChange((val: number) => {
    material.thickness = val;
  });

  gui.add(options, "roughness", 0, 1, 0.01).onChange((val: number) => {
    material.roughness = val;
  });

  gui.add(options, "envMapIntensity", 0, 3, 0.1).onChange((val: number) => {
    material.envMapIntensity = val;
  });

  gui.add(options, "clearcoat", 0, 1, 0.01).onChange((val: number) => {
    material.clearcoat = val;
  });

  gui.add(options, "clearcoatRoughness", 0, 1, 0.01).onChange((val: number) => {
    material.clearcoatRoughness = val;
  });

  gui.add(options, "normalScale", 0, 5, 0.01).onChange((val: number) => {
    material.normalScale.set(val, val);
  });

  gui
    .add(options, "clearcoatNormalScale", 0, 5, 0.01)
    .onChange((val: number) => {
      material.clearcoatNormalScale.set(val, val);
    });

  gui.add(options, "normalRepeat", 1, 4, 1).onChange((val: number) => {
    normalMapTexture.repeat.set(val, val);
  });

  const postprocessing = gui.addFolder("Post Processing");
  postprocessing.open();

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

  // Update
  // ------

  const update = (time: any, deltaTime: any) => {
    const ROTATE_TIME = 10; // Time in seconds for a full rotation
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, -1, 0);
    const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
    const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;

    if (options.enableRotation) {
      // mesh.rotateOnWorldAxis(xAxis, rotateX);
      mesh.rotateOnWorldAxis(yAxis, rotateY);
    }

    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }

    // water.material.uniforms["time"].value += 1.0 / 60.0;
  };

  //   window.addEventListener("resize", () => {
  //     camera.aspect = window.innerWidth / window.innerHeight;
  //     camera.updateProjectionMatrix();
  //     renderer.setSize(window.innerWidth, window.innerHeight);
  //   });

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }: any) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = viewportWidth + "px";
      canvas.style.height = viewportHeight + "px";

      bloomPass.resolution.set(viewportWidth, viewportHeight);

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      composer.setPixelRatio(dpr);
      composer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
      // bloomComposer.setSize(window.innerWidth, window.innerHeight);
    },
    render({ time, deltaTime }: any) {
      stats.begin();
      controls.update();
      update(time, deltaTime);
      // renderer.render(scene, camera);
      composer.render();
      stats.end();
      // bloomComposer.render();
    },
    unload() {
      material.dispose();
      hdrEquirect.dispose();
      controls.dispose();
      renderer.dispose();
      bloomPass.dispose();
      gui.destroy();
      document.body.removeChild(stats.dom);
    },
  };
};

canvasSketch(sketch, settings);
