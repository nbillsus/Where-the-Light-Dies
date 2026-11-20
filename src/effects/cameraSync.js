// Run something every frame right after the camera has settled where it will
// draw from (scroll, shake and zoom all applied), just before it draws.
// Anything placed from the camera's view - like the light map - stays exactly
// in step with it, even when the camera jumps (respawns) or shakes (scares).
export function afterCameraMoves(scene, callback) {
  const camera = scene.cameras.main;
  const settle = camera.preRender;
  camera.preRender = function preRenderThenSync(...args) {
    settle.apply(this, args);
    callback(camera);
  };
}
