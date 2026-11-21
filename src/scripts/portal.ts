// The home page portal, drawn by a small WebGL fragment shader: a swirling disc with a glowing rim that
// leans towards the pointer. No library. It starts when the browser is idle, draws only while the hero is
// on screen and the tab is visible, and draws one still frame when reduced motion is asked for.
// Without WebGL the CSS portal under the canvas stays as it is.

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uCenter;   // portal centre in canvas pixels (y up)
uniform float uRadius;  // portal radius in canvas pixels
uniform float uTime;
uniform vec2 uPointer;  // pointer in canvas pixels (y up)
uniform float uLight;   // 1.0 in the light theme: a softer outer glow

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - uCenter) / uRadius;
  vec2 m = (uPointer - uCenter) / uRadius;
  // the swirl leans towards the pointer, most near the middle
  p -= clamp(m, -2.0, 2.0) * 0.07 * exp(-dot(p, p) * 1.4);

  float r = length(p);
  float a = atan(p.y, p.x);
  float twist = a + 2.4 / (r + 0.28) - uTime * 0.55;
  // noise read on a circle of the twisted angle, so there is no seam where atan() wraps around
  float n = fbm(vec2(cos(twist), sin(twist)) * 1.7 + vec2(r * 3.2 - uTime * 0.35, r * 1.3));
  float arms = 0.5 + 0.5 * sin(twist * 3.0 + n * 3.2);

  // a soft, living edge: noise read around the circle, so it has no corners and no seam
  vec2 ring = vec2(cos(a), sin(a));
  float wobble = fbm(ring * 1.6 + vec2(uTime * 0.25, -uTime * 0.2)) - 0.5;
  float edge = 1.0 + 0.09 * wobble + 0.025 * (n - 0.5);
  float disc = smoothstep(edge, edge - 0.05, r);

  vec3 deep = vec3(0.03, 0.42, 0.33);
  vec3 green = vec3(0.16, 0.74, 0.47);
  vec3 cyan = vec3(0.16, 0.80, 0.76);
  vec3 lime = vec3(0.74, 0.95, 0.26);
  vec3 core = vec3(0.96, 1.0, 0.86);

  vec3 col = mix(deep, green, smoothstep(0.15, 0.75, arms));
  col = mix(col, cyan, smoothstep(0.55, 0.95, n) * 0.6);
  col = mix(col, lime, smoothstep(0.7, 1.0, arms) * 0.75);
  col = mix(col, core, smoothstep(0.5, 0.0, r) * 0.9);

  float rim = exp(-pow((r - edge) * 10.0, 2.0));
  float halo = exp(-max(r - edge, 0.0) * (uLight > 0.5 ? 5.5 : 3.2)) * (1.0 - disc);
  vec3 glow = mix(lime, cyan, 0.25 + 0.25 * sin(a * 2.0 + uTime));

  vec3 color = col * disc + glow * (rim * 0.95 + halo * 0.5);
  float alpha = clamp(disc + rim * 0.95 + halo * 0.5, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

function shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  return sh; // the status is read only after linking, so the compile can run in the background
}

/** Resolves when the program has linked; with KHR_parallel_shader_compile it never blocks the main thread. */
function linked(gl: WebGLRenderingContext, program: WebGLProgram): Promise<boolean> {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  return new Promise((resolve) => {
    const check = () => {
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
        setTimeout(check, 50);
        return;
      }
      resolve(Boolean(gl.getProgramParameter(program, gl.LINK_STATUS)));
    };
    check();
  });
}

async function start(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>("[data-portal-canvas]");
  const anchor = hero.querySelector<HTMLElement>("[data-portal-anchor]");
  if (!canvas || !anchor) return;
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: false,
    antialias: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return;
  // a software renderer (no GPU) would spend the main thread on every frame: keep the CSS portal instead
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return;
  }

  const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!(await linked(gl, program))) return;
  gl.useProgram(program);

  // one triangle that covers the canvas
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  // only the square around the portal and its glow is drawn; the rest of the hero stays empty
  gl.enable(gl.SCISSOR_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uCenter = u("uCenter");
  const uRadius = u("uRadius");
  const uTime = u("uTime");
  const uPointer = u("uPointer");
  const uLight = u("uLight");

  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  let scale = 1;
  let center = { x: 0, y: 0 };
  let radius = 1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  // the CSS portal (the anchor) says where the portal is and how big; the shader follows it
  function measure() {
    // the portal is soft, so a buffer below the screen's resolution looks the same and costs far less
    scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.75;
    const box = canvas!.getBoundingClientRect();
    const a = anchor!.getBoundingClientRect();
    canvas!.width = Math.round(box.width * scale);
    canvas!.height = Math.round(box.height * scale);
    gl!.viewport(0, 0, canvas!.width, canvas!.height);
    center = {
      x: (a.left + a.width / 2 - box.left) * scale,
      y: (box.bottom - (a.top + a.height / 2)) * scale,
    };
    radius = (a.width / 2) * scale;
    const reach = radius * 1.7;
    gl!.scissor(center.x - reach, center.y - reach, reach * 2, reach * 2);
    pointer.x = pointer.tx = center.x;
    pointer.y = pointer.ty = center.y;
  }

  function isLight() {
    const chosen = document.documentElement.dataset.theme;
    return chosen ? chosen === "light" : !dark.matches;
  }

  const t0 = performance.now();
  function draw(now: number) {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform2f(uCenter, center.x, center.y);
    gl!.uniform1f(uRadius, radius);
    gl!.uniform1f(uTime, still.matches ? 4 : (now - t0) / 1000);
    gl!.uniform2f(uPointer, pointer.x, pointer.y);
    gl!.uniform1f(uLight, isLight() ? 1 : 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  let frame = 0;
  let visible = true;
  function loop(now: number) {
    draw(now);
    frame = still.matches || !visible || document.hidden ? 0 : requestAnimationFrame(loop);
  }
  function resume() {
    if (!frame) frame = requestAnimationFrame(loop);
  }

  measure();
  draw(performance.now());
  hero.dataset.portal = "on"; // the CSS portal fades out under the canvas
  resume();

  new ResizeObserver(() => {
    measure();
    draw(performance.now());
  }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) resume();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => !document.hidden && resume());
  still.addEventListener("change", resume);
  new MutationObserver(() => draw(performance.now())).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  hero.addEventListener("pointermove", (event) => {
    const box = canvas.getBoundingClientRect();
    pointer.tx = (event.clientX - box.left) * scale;
    pointer.ty = (box.bottom - event.clientY) * scale;
    // -1…1 from the portal centre, for the parallax of Rick and Morty (CSS --mx, --my)
    const span = Math.max(box.width, box.height) / 2;
    hero.style.setProperty(
      "--mx",
      ((event.clientX - box.left - center.x / scale) / span).toFixed(3),
    );
    hero.style.setProperty(
      "--my",
      ((box.bottom - event.clientY - center.y / scale) / -span).toFixed(3),
    );
  });
  hero.addEventListener("pointerleave", () => {
    pointer.tx = center.x;
    pointer.ty = center.y;
    hero.style.setProperty("--mx", "0");
    hero.style.setProperty("--my", "0");
  });
}

const hero = document.querySelector<HTMLElement>("[data-portal-hero]");
if (hero) {
  // WebGL starts on the first sign of a person (a pointer move, a touch, a key, a scroll), when the browser is
  // idle: creating the context and compiling the shader never competes with the first paint, and the
  // CSS portal (a turning SVG spiral) is what shows until then.
  const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    events.forEach((e) => window.removeEventListener(e, go));
    const run = () => void start(hero);
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 50);
  };
  events.forEach((e) => window.addEventListener(e, go, { passive: true }));
}
