import { Color, DoubleSide, Mesh, MeshBasicMaterial, PMREMGenerator, PlaneGeometry, Scene } from "three";
import type { Material, WebGLRenderTarget, WebGLRenderer } from "three";

/**
 * A product-photography studio as an environment map, built in the scene
 * rather than loaded from an HDR file (nothing to fetch, nothing for the
 * desktop app's CSP to allow): a dark room with a big key softbox above and to
 * the right, a strip on each side and a cool rim light behind. Rendered once
 * into a prefiltered (PMREM) cube for reflections and soft ambient light.
 * The caller owns the returned render target and disposes of it.
 */
export function studioEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const room = new Scene();
  room.background = new Color("#0b1215");
  const plane = new PlaneGeometry(1, 1);
  const materials: Material[] = [];

  const softbox = (color: string, intensity: number, position: [number, number, number], size: [number, number]) => {
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
    });
    materials.push(material);
    const mesh = new Mesh(plane, material);
    mesh.position.set(...position);
    mesh.scale.set(size[0], size[1], 1);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  };

  softbox("#ffffff", 3.2, [3.5, 4.5, 4.5], [5, 3.5]); // key
  softbox("#ffffff", 1.6, [0, 7, 0.5], [7, 4]); // top
  softbox("#ffffff", 1.1, [-6, 1.2, 2.5], [1.4, 6]); // left strip
  softbox("#ffffff", 0.9, [6, 0.6, -0.5], [1.2, 5]); // right strip
  softbox("#d8f1f4", 2.4, [-3, 2.5, -5], [6, 1.6]); // rim, a touch of teal in the white

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.035);
  pmrem.dispose();
  plane.dispose();
  for (const m of materials) m.dispose();
  return target;
}
