<script lang="ts">
	import { onMount } from "svelte";
	import * as THREE from "three";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

	let canvasContainer;

	onMount(() => {
		// ✅ Create Scene & Renderer
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
		camera.position.set(0, 2, 5); // ✅ Adjusted for bigger model

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(500, 500); // ✅ Larger container size
		renderer.setClearColor(0x000000, 0); // Transparent background
		canvasContainer.appendChild(renderer.domElement);

		// ✅ Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
		scene.add(ambientLight);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 5, 5).normalize();
		scene.add(directionalLight);

		// ✅ Load `scene.gltf` Model
		const loader = new GLTFLoader();
		let model;
		loader.load(
			"/models/scene.gltf",
			(gltf) => {
				model = gltf.scene;
				model.scale.set(0.6, 0.6, 0.6); // ✅ Bigger Model
				scene.add(model);
			},
			(xhr) => console.log(`GLTF Model ${xhr.loaded / xhr.total * 100}% loaded`),
			(error) => console.error("Error loading GLTF model:", error)
		);

		// ✅ Orbit Controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		// ✅ Auto-Rotation Animation
		const animate = () => {
			requestAnimationFrame(animate);
			if (model) model.rotation.y += 0.02; // Rotate model
			controls.update();
			renderer.render(scene, camera);
		};
		animate();
	});
</script>

<!-- ✅ Bigger Model Container -->
<div bind:this={canvasContainer} class="glTF-container"></div>

<style>
    .glTF-container {
        width: 500px; /* ✅ Increased size */
        height: 500px;
        position: absolute;
        right: 30px;
        bottom: 30px;
    }
</style>
