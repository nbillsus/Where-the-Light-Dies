// Keep the artwork sharp on high-density screens without allocating an
// unbounded WebGL buffer on very large monitors.
export const renderScale = Math.max(1, Math.min(
  window.devicePixelRatio || 1,
  2,
  3840 / window.innerWidth,
  2160 / window.innerHeight,
));

export function logicalSize(scene) {
  return { width: scene.scale.width / renderScale, height: scene.scale.height / renderScale };
}

export function sharpenText(scene) {
  const visit = (item) => {
    if (item.type === 'Text') item.setResolution(renderScale);
    if (item.list) item.list.forEach(visit);
  };
  scene.children.list.forEach(visit);
}
