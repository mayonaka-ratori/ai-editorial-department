"use client";
import { useEffect, useRef } from "react";
import type { EditorKey } from "@/lib/editors/types";

// ブースの大画面の3D。スマホの画面では使わない（three.js はこの画面を開いたときだけ読み込む）。
// - 床の格子、光の粒、表紙の下の光は WebGL で描く。
// - 表紙は今までと同じ HTML（CoverView）を、CSS3DRenderer で同じ3Dの空間に置く。文字が画像にならないので、離れても読める。
// 表紙の中身は、呼び出し側が slots の div に createPortal で入れる。

const RATIO: Record<EditorKey, number> = { kurodo: 2 / 3, nina: 1328 / 1760, sol: 2 / 3 };
const BASE_W = 350; // 表紙は350px幅で組む（components/ScaledCover.tsx と同じ）
const KEYS: EditorKey[] = ["kurodo", "nina", "sol"];

type Pose = { x: number; y: number; z: number; ry: number; s: number };

export default function Stage3D({ order, onSlots }: { order: EditorKey[]; onSlots: (slots: Record<EditorKey, HTMLDivElement>) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  // [左, 真ん中, 右]。描画の繰り返しの中で読むので ref に持つ。
  const orderRef = useRef(order);
  orderRef.current = order;
  const onSlotsRef = useRef(onSlots);
  onSlotsRef.current = onSlots;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let raf = 0;
    const cleanups: (() => void)[] = [];

    (async () => {
      const THREE = await import("three");
      const { CSS3DRenderer, CSS3DObject } = await import("three/examples/jsm/renderers/CSS3DRenderer.js");
      if (disposed) return;

      const fov = 35;
      let W = mount.clientWidth;
      let H = mount.clientHeight;
      // カメラの距離。z=0 の面で「1の長さ = 1px」になるようにする。表紙の大きさをpxで考えられる。
      const dist = () => H / 2 / Math.tan(((fov / 2) * Math.PI) / 180);
      const camera = new THREE.PerspectiveCamera(fov, W / H, 10, 20000);
      const placeCamera = () => {
        camera.aspect = W / H;
        camera.position.set(0, H * 0.06, dist());
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      };
      placeCamera();

      // WebGL（床、光の粒、表紙の下の光）。使えない端末では表紙だけ出す。
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070b16, 0.00032);
      let gl: InstanceType<typeof THREE.WebGLRenderer> | null = null;
      try {
        gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.setSize(W, H);
        gl.domElement.className = "stage-gl";
        mount.appendChild(gl.domElement);
      } catch {
        gl = null;
      }

      const floorY = () => -H * 0.46;
      // 床の格子。線を描いた絵を敷き詰める（細い線を直接描くより、遠くまで線が見える）。
      const gridTex = gridTexture(THREE);
      gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
      gridTex.repeat.set(120, 120);
      if (gl) gridTex.anisotropy = gl.capabilities.getMaxAnisotropy();
      const grid = new THREE.Mesh(
        new THREE.PlaneGeometry(12000, 12000),
        new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false, opacity: 0.55 }),
      );
      grid.rotation.x = -Math.PI / 2;
      scene.add(grid);

      // 奥の青い光（地平線のあたりを明るくする）
      const glowTex = radialTexture(THREE, "rgba(53,214,255,0.55)");
      const horizon = new THREE.Mesh(
        new THREE.PlaneGeometry(9000, 2600),
        new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 }),
      );
      scene.add(horizon);

      // 表紙の下に落ちる光
      const pools = KEYS.map(() => {
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(1, 48),
          new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }),
        );
        m.rotation.x = -Math.PI / 2;
        scene.add(m);
        return m;
      });

      // 漂う光の粒
      const N = 500;
      const pos = new Float32Array(N * 3);
      const speed = new Float32Array(N);
      const spread = () => ({ x: (Math.random() - 0.5) * 5000, z: -Math.random() * 3000 + 400 });
      for (let i = 0; i < N; i++) {
        const p = spread();
        pos[i * 3] = p.x;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        pos[i * 3 + 2] = p.z;
        speed[i] = 0.15 + Math.random() * 0.5;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const points = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ size: 5, map: radialTexture(THREE, "rgba(200,245,255,1)"), color: 0x9fe9ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }),
      );
      scene.add(points);

      // 表紙（HTML）を置く面
      const css = new CSS3DRenderer();
      css.setSize(W, H);
      css.domElement.className = "stage-css";
      mount.appendChild(css.domElement);
      const cssScene = new THREE.Scene();

      const slots = {} as Record<EditorKey, HTMLDivElement>;
      const zoomers = {} as Record<EditorKey, HTMLDivElement>;
      const objects = {} as Record<EditorKey, InstanceType<typeof CSS3DObject>>;
      const current = {} as Record<EditorKey, Pose>;
      for (const k of KEYS) {
        const el = document.createElement("div");
        el.className = "book3d";
        // 中の表紙は「真ん中の大きさ」で組む（zoom）。左右は縮めて出すだけなので、文字がにじまない。
        const zoomer = document.createElement("div");
        zoomer.style.width = `${BASE_W}px`;
        el.appendChild(zoomer);
        const obj = new CSS3DObject(el);
        cssScene.add(obj);
        slots[k] = zoomer;
        zoomers[k] = zoomer;
        objects[k] = obj;
      }

      // 真ん中の表紙の大きさ。画面の高さの78%ほど。
      const centerZoom = () => Math.max(0.6, (H * 0.78) / (BASE_W / RATIO.kurodo));
      const applyZoom = () => {
        for (const k of KEYS) zoomers[k].style.zoom = String(centerZoom());
      };
      applyZoom();

      const target = (k: EditorKey, t: number): Pose => {
        const i = orderRef.current.indexOf(k); // 0 左、1 真ん中、2 右
        const cx = -W * 0.09; // 右に説明の欄があるので、少し左に寄せる
        const coverH = (BASE_W / RATIO[k]) * centerZoom();
        const bob = Math.sin(t * 0.5 + i * 2) * 8;
        const sway = Math.sin(t * 0.25 + i) * 0.07;
        if (i === 1) return { x: cx, y: -H * 0.02 + bob, z: 0, ry: sway, s: (H * 0.78) / coverH };
        const side = i === 0 ? -1 : 1;
        return { x: cx + side * W * 0.31, y: -H * 0.1 + bob, z: -380, ry: -side * 0.42 + sway, s: (H * 0.5) / coverH };
      };

      const onResize = () => {
        W = mount.clientWidth;
        H = mount.clientHeight;
        placeCamera();
        gl?.setSize(W, H);
        css.setSize(W, H);
        applyZoom();
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      let t = 0;
      let first = true;
      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.1);
        t += reduce ? 0 : dt;
        const fy = floorY();
        grid.position.set(0, fy, -2000);
        gridTex.offset.y = (t * 0.3) % 1; // 床がゆっくり手前に流れる
        horizon.position.set(0, fy + 600, -5200);
        const arr = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < N; i++) {
          arr[i * 3 + 1] += reduce ? 0 : speed[i];
          if (arr[i * 3 + 1] > 1000) {
            const p = spread();
            arr[i * 3] = p.x;
            arr[i * 3 + 1] = -1000;
            arr[i * 3 + 2] = p.z;
          }
        }
        pGeo.attributes.position.needsUpdate = true;

        KEYS.forEach((k, idx) => {
          const g = target(k, t);
          const c = (current[k] ??= g);
          // 真ん中が入れ替わるときは、少しずつ動かす
          const a = first || reduce ? 1 : 0.05;
          c.x += (g.x - c.x) * a;
          c.y += (g.y - c.y) * a;
          c.z += (g.z - c.z) * a;
          c.ry += (g.ry - c.ry) * a;
          c.s += (g.s - c.s) * a;
          const o = objects[k];
          o.position.set(c.x, c.y, c.z);
          o.rotation.set(0, c.ry, 0);
          o.scale.setScalar(c.s);
          o.element.classList.toggle("center", orderRef.current[1] === k);
          const coverW = BASE_W * centerZoom() * c.s;
          const pool = pools[idx];
          pool.position.set(c.x, fy + 1, c.z);
          pool.scale.setScalar(coverW * 0.9);
        });
        first = false;

        if (gl) gl.render(scene, camera);
        css.render(cssScene, camera);
        raf = requestAnimationFrame(frame);
      };
      frame();
      onSlotsRef.current(slots);

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        gl?.dispose();
        gl?.domElement.remove();
        css.domElement.remove();
        pGeo.dispose();
        gridTex.dispose();
      });
    })();

    return () => {
      disposed = true;
      cleanups.forEach((f) => f());
    };
  }, []);

  return <div ref={mountRef} className="stage3d" />;
}

// 中心が明るく、外に向かって消える丸い光の絵
function radialTexture(THREE: typeof import("three"), color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 床の格子の1マス。縁に水色の線を引いた絵
function gridTexture(THREE: typeof import("three")) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.strokeStyle = "rgba(53,214,255,0.9)";
  x.lineWidth = 3;
  x.strokeRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
