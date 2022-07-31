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
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BufferGeometry } from "three";

/* Global Vars */

let container: HTMLElement, stats: Stats;
let camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer;
let controls, water: Water, sun: THREE.Vector3, merkaba: THREE.Mesh;

/* Run */

init(); // Setup 3D
animate(); // Loop

/* Functions */

function init() {
  container = <HTMLElement>document.getElementById("container");

  // -- Init Three --

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // -- Init Schene and Camera --

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);

  // -- Init Sun --

  sun = new THREE.Vector3();

  // -- Init Water --

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "textures/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // -- Init Sky --

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(<any>sky).texture;
  }
  updateSun();

  // -- Init Merkaba --

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

  // const geometry = new THREE.BoxGeometry(30, 30, 30);
  // const material = new THREE.MeshStandardMaterial({ roughness: 0 });
  // merkaba = new THREE.Mesh(geometry, material);
  // merkaba.position.y = 15;
  // scene.add(merkaba);

  // const material = new THREE.MeshStandardMaterial({ roughness: 0 });

  // const crystalTexture = new THREE.TextureLoader().load(
  //   "textures/crystalnormals.jpg",
  //   function (texture) {
  //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //   }
  // );
  const crystalTexture = new THREE.TextureLoader().load(
    "textures/crystalnormals.jpg"
  );
  crystalTexture.wrapS = THREE.RepeatWrapping;
  crystalTexture.wrapT = THREE.RepeatWrapping;
  crystalTexture.repeat.set(3, 3);

  const materialOptions = {
    metalness: 0,
    transmission: 1,
    thickness: 1,
    roughness: 2,
    envMapIntensity: 2,
    clearcoat: 0.1,
    clearcoatRoughness: 0,
    ior: 0,
    reflectivity: 0,
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: materialOptions.metalness,
    transmission: materialOptions.transmission,
    // @ts-ignore
    thickness: materialOptions.thickness,
    roughness: materialOptions.roughness,
    envMapIntensity: materialOptions.envMapIntensity,
    clearcoat: materialOptions.clearcoat,
    clearcoatRoughness: materialOptions.clearcoatRoughness,
    ior: materialOptions.ior,
    reflectivity: materialOptions.reflectivity,
    normalScale: new THREE.Vector2(1),
    clearcoatNormalScale: new THREE.Vector2(0.1),
    // envMap: hdrEquirect, // TODO:
    normalMap: crystalTexture,
    clearcoatNormalMap: crystalTexture,
  });

  // Triangle Up Geometry
  const triangleUp = new THREE.ConeGeometry(40, 40, 4);
  triangleUp.translate(0, 40, 0);

  // Triangle Down Geometry
  const triangleDown = new THREE.ConeGeometry(40, 40, 4);
  rotateObject(triangleDown, 180, 0, 0);
  triangleDown.translate(0, 20, 0);

  // Merkaba
  const merkabaGeometry = BufferGeometryUtils.mergeBufferGeometries([
    triangleUp,
    triangleDown,
  ]);
  const merkaba = new THREE.Mesh(merkabaGeometry, material);
  scene.add(merkaba);

  // -- Init Orbital Controls --

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  // -- Init and add Frames Per Second (FPS) --

  stats = new (Stats as any)();
  container.appendChild(stats.dom);

  // -- Init Controls GUI (lil-gui) --

  const gui = new GUI();

  const folderSky = gui.addFolder("Sky");
  folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
  folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
  folderSky.open();

  const waterUniforms = water.material.uniforms;

  const folderWater = gui.addFolder("Water");
  folderWater
    .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
    .name("distortionScale");
  folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
  folderWater.open();

  gui.add(materialOptions, "metalness", 0, 1, 0.01).onChange((val: number) => {
    material.metalness = val;
  });

  gui
    .add(materialOptions, "transmission", 0, 1, 0.01)
    .onChange((val: number) => {
      material.transmission = val;
    });

  gui.add(materialOptions, "thickness", 0, 5, 0.1).onChange((val: number) => {
    material.thickness = val;
  });

  gui.add(materialOptions, "roughness", 0, 1, 0.01).onChange((val: number) => {
    material.roughness = val;
  });

  gui
    .add(materialOptions, "envMapIntensity", 0, 3, 0.1)
    .onChange((val: number) => {
      material.envMapIntensity = val;
    });

  gui.add(materialOptions, "clearcoat", 0, 1, 0.01).onChange((val: number) => {
    material.clearcoat = val;
  });

  gui
    .add(materialOptions, "clearcoatRoughness", 0, 1, 0.01)
    .onChange((val: number) => {
      material.clearcoatRoughness = val;
    });

  gui.add(materialOptions, "ior", 0, 1, 0.01).onChange((val: number) => {
    material.ior = val;
  });

  gui
    .add(materialOptions, "reflectivity", 0, 1, 0.01)
    .onChange((val: number) => {
      material.reflectivity = val;
    });

  // gui
  //   .add(materialOptions, "normalScale", 0, 5, 0.01)
  //   .onChange((val: number) => {
  //     material.normalScale.set(val, val);
  //   });

  // -- EventListeners --

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  // 3D Animation Loop
  requestAnimationFrame(animate);
  animateMerkaba();
  animateWater();
  renderer.render(scene, camera);
  stats.update();
}

function animateMerkaba() {
  const time = performance.now() * 0.001;
  // mesh.position.y = Math.sin(time) * 20 + 5;
  // mesh.rotation.x = time * 0.5;
  // mesh.rotation.z = time * 0.51;
  // or mesh.postion(x,y,z)
}

function animateWater() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
}
