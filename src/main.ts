import { Engine, Scene } from "@babylonjs/core";
import { ArcRotateCamera, EnvironmentHelper, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import { Mesh, StandardMaterial, Color3, Vector3 } from "@babylonjs/core";
import { WebXRInputSource } from "@babylonjs/core/XR";
import { Inspector } from "@babylonjs/inspector";

import '@babylonjs/core/Materials/Textures/Loaders'; // Required for EnvironmentHelper
import '@babylonjs/loaders/glTF'; // Enable GLTF/GLB loader for loading controller models from WebXR Input registry
import './style.css'

// Create a canvas element for rendering
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// Create engine and a scene
const babylonEngine = new Engine(canvas, true);
const scene = new Scene(babylonEngine);

// Add a basic light
new HemisphericLight('light1', new Vector3(0, 2, 2), scene);

// Create a default environment (skybox, ground mesh, etc)
const envHelper = new EnvironmentHelper({
  skyboxSize: 30,
  groundColor: new Color3(1, 1, 1),
}, scene);

// Add a camera for the non-VR view in browser
const camera = new ArcRotateCamera("Camera", -(Math.PI / 4) * 3, Math.PI / 4, 10, new Vector3(0, 0, 0), scene);
camera.attachControl(true);

let leftController: WebXRInputSource | null = null;
let rightController: WebXRInputSource | null = null;
let leftColor = new Color3(0, 0, 0);
let rightColor = new Color3(0, 0, 0);

const leftSphere = MeshBuilder.CreateSphere('xSphere', { segments: 16, diameter: 0.1 }, scene);
const rightSphere = MeshBuilder.CreateSphere('xSphere', { segments: 16, diameter: 0.1 }, scene);
const leftMaterial = new StandardMaterial("matR", scene);
const rightMaterial = new StandardMaterial("matR", scene);

leftMaterial.diffuseColor = leftColor;
rightMaterial.diffuseColor = rightColor;

leftMaterial.alpha = 0.5;
rightMaterial.alpha = 0.5;

leftSphere.position.x = -0.5;
rightSphere.position.x = 0.5;

leftSphere.material = leftMaterial;
rightSphere.material = rightMaterial;

(async function main() {
  const defaultXRExperience = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [envHelper?.ground as Mesh],
    inputOptions: {
      controllerOptions: {
        // disableMotionControllerAnimation: true,
        // doNotLoadControllerMesh: true,
        // forceControllerProfile: <string>,
        // renderingGroupId: <number>
      },
      // customControllersRepositoryURL: <string>,
      // disableControllerAnimation: true,
      // disableOnlineControllerRepository: true,
      doNotLoadControllerMeshes: true, // move, but hide controllers
      // forceInputProfile: 'generic-trigger-squeeze-thumbstick',
    },
  });

  defaultXRExperience.teleportation.detach();
  defaultXRExperience.pointerSelection.detach();

  const hasImmersiveVR = await defaultXRExperience.baseExperience.sessionManager.isSessionSupportedAsync('immersive-vr');

  if (hasImmersiveVR) {
    defaultXRExperience.input.onControllerAddedObservable.add((controller: WebXRInputSource) => {
      controller.onMotionControllerInitObservable.add(motionController => {
        let color: Color3;
        let sphere: Mesh;
        let material: StandardMaterial;

        if (motionController.handedness === 'left') {
          leftController = controller;
          sphere = leftSphere;
          material = leftMaterial;
          color = leftColor;
        } else {
          rightController = controller;
          sphere = rightSphere;
          material = rightMaterial;
          color = rightColor;
        }

        // React on buttons
        //   0: "xr-standard-trigger": { "type": "trigger" },
        //   1: "xr-standard-squeeze": { "type": "squeeze" },
        //   2: "xr-standard-thumbstick": { "type": "thumbstick" },
        //   3: "x-button" : { "type": "button" }, "a-button" : { "type": "button" }, 
        //   4: "y-button" : { "type": "button" }, "b-button" : { "type": "button" }, 
        //   5: "thumbrest" : { "type": "button" },
        const componentIds = motionController.getComponentIds();

        const triggerComponent = motionController.getComponent(componentIds[0]);
        triggerComponent.onButtonStateChangedObservable.add((component) => {
          const scaling = component.pressed ? 2 : 1;
          sphere.scaling.y = scaling;
        });

        const squeezeComponent = motionController.getComponent(componentIds[1]);
        squeezeComponent.onButtonStateChangedObservable.add((component) => {
          const scaling = component.pressed ? 2 : 1;
          sphere.scaling.x = sphere.scaling.z = scaling;
        });

        const buttonYBComponent = motionController.getComponent(componentIds[2]);
        buttonYBComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            color.r = 1;
          } else if (component.touched) {
            color.r = 0.5;
          } else {
            color.r = 0;
          }
        });

        const buttonXAComponent = motionController.getComponent(componentIds[3]);
        buttonXAComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            color.g = 1;
          } else if (component.touched) {
            color.g = 0.5;
          } else {
            color.g = 0;
          }
        });

        const stickComponent = motionController.getComponent(componentIds[4]);
        stickComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            color.b = 1;
          } else if (component.touched) {
            color.b = 0.5;
          } else {
            color.b = 0;
          }
        });

        const thumbrestComponent = motionController.getComponent(componentIds[5]);
        thumbrestComponent.onButtonStateChangedObservable.add((component) => {
          if (component.touched) {
            material.alpha = 1;
          } else {
            material.alpha = 0.5;
          }
        });
      });
    });
  }

  // Run render loop
  babylonEngine.runRenderLoop(() => {
    if (leftController && rightController) {
      leftSphere.position = leftController.pointer.position;
      rightSphere.position = rightController.pointer.position;
    }

    scene.render()
  });

  Inspector.Show(scene, {});
})();
