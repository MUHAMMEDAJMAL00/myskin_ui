import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-ocean-scene',
  templateUrl: './ocean-scene.component.html',
  styleUrl: './ocean-scene.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class OceanSceneComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  protected readonly NAMES = ['DAWN', 'MIDDAY', 'DUSK', 'NIGHT', 'STORM'];
  protected hudPct = '000%';
  protected progPct = 0;
  protected sceneLabel = 'DAWN';
  protected activeDot = 0;
  protected theme: 'dark' | 'light' = 'dark';

  private gl!: WebGLRenderingContext;
  private prog!: WebGLProgram;
  private uR!: WebGLUniformLocation;
  private uTi!: WebGLUniformLocation;
  private uScroll!: WebGLUniformLocation;
  private uScene!: WebGLUniformLocation;
  private uBlend!: WebGLUniformLocation;
  private uBg!: WebGLUniformLocation;

  private maxScroll = 1;
  private tgt = 0;
  private smooth = 0;
  private velocity = 0;
  private lastViewportW = 0;
  private lastViewportH = 0;
  private animId = 0;
  private resizeRAF = 0;
  private t0 = 0;
  private lastNow = 0;
  private qualityScale = 1;
  private lowFpsTime = 0;
  private highFpsTime = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private anchorAnim: number | null = null;
  private themeOverride: string | null = null;

  private readonly vs = `attribute vec2 a;
void main() {
  gl_Position = vec4(a, 0.0, 1.0);
}`;

  private readonly fs = `
precision highp float;
uniform vec2 uR;
uniform float uT, uS, uSc, uBl;
uniform vec3 uBg;
#define PI 3.14159265359
#define TAU 6.28318530718
#define MARCH_STEPS 22
#define REFINE_STEPS 5
float sat(float x) { return clamp(x, 0.0, 1.0); }
float smoother(float x) { x = sat(x); return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }
vec3 sCol(vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
  int si = int(uSc); vec3 a = c0; vec3 b = c1;
  if (si == 1) { a = c1; b = c2; } else if (si == 2) { a = c2; b = c3; } else if (si == 3) { a = c3; b = c4; }
  return mix(a, b, uBl);
}
float sF(float c0, float c1, float c2, float c3, float c4) {
  int si = int(uSc); float a = c0; float b = c1;
  if (si == 1) { a = c1; b = c2; } else if (si == 2) { a = c2; b = c3; } else if (si == 3) { a = c3; b = c4; }
  return mix(a, b, uBl);
}
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float waveH(vec2 p, float t, float amp, float storm) {
  float h = 0.0;
  vec2 swell1 = normalize(vec2(1.0, 0.28));
  vec2 swell2 = normalize(vec2(-0.48, 0.88));
  vec2 swell3 = normalize(vec2(0.82, -0.16));
  swell2 = rot(storm * 0.18) * swell2; swell3 = rot(-storm * 0.14) * swell3;
  float d1 = dot(p, swell1); float d2 = dot(p, swell2); float d3 = dot(p, swell3);
  h += amp * 0.66 * sin(d1 * 0.42 + t * 0.38);
  h += amp * 0.22 * sin(d1 * 0.94 - t * 0.62);
  h += amp * 0.14 * sin(d2 * 1.18 - t * 0.82);
  h += amp * 0.09 * sin(d3 * 1.82 + t * 1.04);
  h += amp * (0.11 + storm * 0.07) * sin(p.x * 1.45 - t * 0.76 + p.y * 0.66);
  h += amp * (0.07 + storm * 0.05) * sin(p.x * 2.85 + t * 1.06 - p.y * 0.52);
  h += amp * (0.04 + storm * 0.03) * sin(p.x * 4.60 - t * 1.50 + p.y * 1.02);
  float micro = noise(p * 14.0 + vec2(t * 0.18, t * 0.06)) - 0.5;
  h += micro * amp * (0.010 + storm * 0.008);
  return h;
}
vec3 waveNorm(vec2 p, float t, float amp, float storm) {
  float e = 0.018;
  float hL = waveH(p - vec2(e, 0.0), t, amp, storm);
  float hR = waveH(p + vec2(e, 0.0), t, amp, storm);
  float hD = waveH(p - vec2(0.0, e), t, amp, storm);
  float hU = waveH(p + vec2(0.0, e), t, amp, storm);
  return normalize(vec3(-(hR - hL) / (2.0 * e), 1.0, -(hU - hD) / (2.0 * e)));
}
float starField(vec2 uv) {
  vec2 gv = floor(uv); vec2 lv = fract(uv) - 0.5;
  float h = hash(gv); float size = mix(0.012, 0.0025, h);
  float d = length(lv + vec2(hash(gv + 3.1) - 0.5, hash(gv + 7.3) - 0.5) * 0.25);
  float star = smoothstep(size, 0.0, d); star *= smoothstep(0.82, 1.0, h);
  return star;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - uR * 0.5) / uR.y;
  float s = smoother(uS);
  float camY = mix(1.14, 1.03, s); camY += sin(s * PI * 1.4) * 0.028;
  float camZ = mix(0.08, -0.18, s); float pitch = mix(0.115, 0.088, s);
  vec3 ro = vec3(0.0, camY, camZ); vec3 rd = normalize(vec3(uv.x, uv.y - pitch, -1.4));
  float storm = smoothstep(0.80, 1.0, s); float night = smoothstep(0.56, 0.84, s);
  vec3 skyTop = sCol(vec3(0.18,0.06,0.24), vec3(0.05,0.24,0.68), vec3(0.26,0.06,0.04), vec3(0.01,0.01,0.05), vec3(0.04,0.05,0.09));
  vec3 skyHori = sCol(vec3(0.92,0.48,0.18), vec3(0.42,0.62,0.90), vec3(0.88,0.32,0.04), vec3(0.03,0.05,0.14), vec3(0.15,0.17,0.23));
  vec3 sunCol = sCol(vec3(1.0,0.62,0.22), vec3(1.0,0.96,0.80), vec3(1.0,0.38,0.05), vec3(0.70,0.75,0.94), vec3(0.26,0.28,0.34));
  vec3 seaDeep = sCol(vec3(0.08,0.05,0.12), vec3(0.03,0.14,0.34), vec3(0.10,0.06,0.04), vec3(0.00,0.01,0.03), vec3(0.03,0.04,0.07));
  vec3 seaShlo = sCol(vec3(0.28,0.17,0.24), vec3(0.09,0.38,0.60), vec3(0.24,0.13,0.06), vec3(0.04,0.06,0.16), vec3(0.07,0.10,0.14));
  vec3 fogCol = sCol(vec3(0.80,0.50,0.30), vec3(0.58,0.72,0.90), vec3(0.70,0.28,0.05), vec3(0.02,0.03,0.08), vec3(0.12,0.14,0.18));
  float sunProgress = clamp(s / 0.58, 0.0, 1.0);
  float sunAngle = sunProgress * PI;
  float sunArcX = cos(sunAngle) * -0.75; float sunArcY = sin(sunAngle) * 0.38 - 0.08;
  vec3 sunDir = normalize(vec3(sunArcX, sunArcY, -1.0));
  vec3 moonDir = normalize(vec3(-0.14, 0.42, -1.0));
  float waveAmp = sF(0.082, 0.070, 0.100, 0.054, 0.30); waveAmp += storm * 0.020;
  float fogDen = sF(0.020, 0.010, 0.022, 0.034, 0.046);
  float moonAmt = sF(0.0, 0.0, 0.05, 0.92, 0.06);
  float sunAbove = step(0.0, sunDir.y); float sunGlow = smoothstep(-0.10, 0.06, sunDir.y);
  vec3 col;
  if (rd.y < 0.0) {
    float tFlat = ro.y / (-rd.y); float stepSize = tFlat / float(MARCH_STEPS); float t = stepSize;
    for (int i = 0; i < MARCH_STEPS; i++) { vec2 wpTest = ro.xz + rd.xz * t; float wy = ro.y + rd.y * t; if (wy < waveH(wpTest, uT, waveAmp, storm)) break; t += stepSize; }
    float ta = t - stepSize; float tb = t;
    for (int i = 0; i < REFINE_STEPS; i++) { float tm = (ta + tb) * 0.5; vec2 wpm = ro.xz + rd.xz * tm; if (ro.y + rd.y * tm < waveH(wpm, uT, waveAmp, storm)) tb = tm; else ta = tm; }
    t = (ta + tb) * 0.5;
    vec2 wp = ro.xz + rd.xz * t; vec3 n = waveNorm(wp, uT, waveAmp, storm); vec3 vDir = -rd;
    float fres = pow(1.0 - clamp(dot(n, vDir), 0.0, 1.0), 4.0);
    vec3 refl = reflect(rd, n); float rh = clamp(refl.y, 0.0, 1.0);
    vec3 reflSky = mix(skyHori, skyTop, pow(rh, 0.42)); reflSky = mix(reflSky, skyHori, 0.12);
    float rSun = max(dot(refl, sunDir), 0.0); reflSky += sunCol * pow(rSun, 120.0) * 2.0 * sunGlow; reflSky += sunCol * pow(rSun, 18.0) * 0.07 * sunGlow;
    if (moonAmt > 0.04) { float rMoon = max(dot(refl, moonDir), 0.0); reflSky += vec3(0.72,0.80,0.95) * pow(rMoon, 120.0) * 0.78 * moonAmt; }
    float depth = exp(-t * 0.40); vec3 waterC = mix(seaDeep, seaShlo, depth * 0.5);
    vec3 absorb = vec3(0.85, 0.92, 1.0); waterC *= mix(vec3(1.0), absorb, clamp(t * 0.25, 0.0, 1.0));
    col = mix(waterC, reflSky, 0.15 + fres * 0.34);
    float spec = pow(max(dot(reflect(-sunDir, n), vDir), 0.0), 200.0); col += sunCol * spec * 1.10 * sunAbove;
    float broadSpec = pow(max(dot(reflect(-sunDir, n), vDir), 0.0), 32.0); col += sunCol * broadSpec * 0.12 * sunGlow;
    float sunLine = pow(max(dot(reflect(rd, n), sunDir), 0.0), 8.0); col += sunCol * sunLine * 0.48 * smoothstep(0.0, 0.35, -rd.y) * sunGlow;
    float sparkle = noise(wp * 18.0 + vec2(uT * 0.55, uT * 0.22)); sparkle = smoothstep(0.94, 1.0, sparkle); col += sunCol * sparkle * 0.08 * sunGlow * sunAbove;
    if (moonAmt > 0.04) { float mSpec = pow(max(dot(reflect(-moonDir, n), vDir), 0.0), 520.0); col += vec3(0.72,0.80,0.95) * mSpec * 0.09 * moonAmt; }
    float hC = waveH(wp, uT, waveAmp, storm); float hL = waveH(wp - vec2(0.025, 0.0), uT, waveAmp, storm);
    float hR = waveH(wp + vec2(0.025, 0.0), uT, waveAmp, storm); float hD = waveH(wp - vec2(0.0, 0.025), uT, waveAmp, storm);
    float hU = waveH(wp + vec2(0.0, 0.025), uT, waveAmp, storm); float curvature = hR + hL + hU + hD - 4.0 * hC;
    float foam = clamp(curvature * (24.0 + storm * 10.0), 0.0, 1.0); col += foam * vec3(1.0) * (0.03 + storm * 0.10);
    float fog = 1.0 - exp(-t * fogDen * 1.65); col = mix(col, fogCol, fog);
  } else {
    float h = clamp(rd.y, 0.0, 1.0); col = mix(skyHori, skyTop, pow(h, 0.38));
  }
  float horizonW = 0.008; float skyMix = smoothstep(-horizonW, horizonW, rd.y);
  vec3 skyCol;
  {
    float h = clamp(rd.y, 0.0, 1.0); skyCol = mix(skyHori, skyTop, pow(h, 0.38));
    float cloudBand = noise(rd.x * 5.5 + vec2(rd.y * 3.0, uT * 0.015));
    float cloudBand2 = noise(rd.x * 8.0 - vec2(rd.y * 4.0, uT * 0.010));
    float clouds = smoothstep(0.62, 0.86, cloudBand * 0.65 + cloudBand2 * 0.35);
    clouds *= smoothstep(-0.02, 0.24, rd.y); clouds *= 0.08 + storm * 0.18;
    vec3 cloudCol = mix(vec3(1.0,0.82,0.65), vec3(0.42,0.48,0.56), storm);
    skyCol = mix(skyCol, mix(skyCol * 0.97, cloudCol, 0.35), clouds);
    float sd = max(dot(rd, sunDir), 0.0); skyCol += sunCol * pow(sd, 380.0) * 6.8 * sunGlow;
    skyCol += sunCol * pow(sd, 22.0) * 0.20 * sunGlow; skyCol += sunCol * pow(sd, 5.0) * 0.09 * sunGlow;
    float sunDisk = smoothstep(0.99925, 0.99995, dot(rd, sunDir)); skyCol += sunCol * sunDisk * 2.6 * sunGlow;
    float horizonBand = exp(-abs(rd.y) * 24.0); skyCol += sunCol * horizonBand * 0.11 * sunGlow;
    float viewSun = max(dot(rd, sunDir), 0.0); skyCol += sunCol * pow(viewSun, 3.0) * 0.035 * sunGlow;
    if (moonAmt > 0.04) { float md = max(dot(rd, moonDir), 0.0); skyCol += vec3(0.88,0.92,1.0) * pow(md, 820.0) * 7.4 * moonAmt; skyCol += vec3(0.88,0.92,1.0) * pow(md, 6.0) * 0.045 * moonAmt; }
    if (night > 0.02) { vec2 starUv = rd.xy / max(0.12, rd.z + 1.6); starUv *= 140.0; float stars = starField(starUv) + starField(starUv * 0.55 + 11.7) * 0.65; stars *= smoothstep(0.02, 0.26, rd.y); stars *= (1.0 - storm * 0.85); skyCol += vec3(0.80,0.88,1.0) * stars * night * 0.82; }
    float horizonMist = exp(-abs(rd.y) * mix(38.0, 22.0, storm)); skyCol += fogCol * horizonMist * (0.09 + storm * 0.10);
    skyCol = mix(skyCol, skyCol * vec3(0.91,0.94,0.98), storm * 0.22);
  }
  col = mix(col, skyCol, skyMix);
  float hEdge = smoothstep(-0.008, 0.018, rd.y); col = mix(fogCol, col, hEdge * 0.25 + 0.75);
  float grain = hash(gl_FragCoord.xy * 0.5 + floor(uT * 12.0)) - 0.5; col += grain * 0.006;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) { canvas.style.background = '#0a0a0f'; return; }
    this.gl = gl;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
      return s;
    };

    const vert = mkShader(gl.VERTEX_SHADER, this.vs);
    const frag = mkShader(gl.FRAGMENT_SHADER, this.fs);
    if (!vert || !frag) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert); gl.attachShader(prog, frag); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
    this.prog = prog;
    gl.useProgram(prog);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.disable(gl.DITHER);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    this.uR = gl.getUniformLocation(prog, 'uR')!;
    this.uTi = gl.getUniformLocation(prog, 'uT')!;
    this.uScroll = gl.getUniformLocation(prog, 'uS')!;
    this.uScene = gl.getUniformLocation(prog, 'uSc')!;
    this.uBlend = gl.getUniformLocation(prog, 'uBl')!;
    this.uBg = gl.getUniformLocation(prog, 'uBg')!;

    this.resize();
    this.t0 = performance.now();
    this.lastNow = this.t0;
    this.frame(this.t0);
    window.addEventListener('resize', this.requestResize, { passive: true });
    window.addEventListener('scroll', this.updateScrollMetrics, { passive: true });
    window.addEventListener('load', this.updateScrollMetrics, { passive: true });
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    cancelAnimationFrame(this.resizeRAF);
    window.removeEventListener('resize', this.requestResize);
    window.removeEventListener('scroll', this.updateScrollMetrics);
    window.removeEventListener('load', this.updateScrollMetrics);
    window.removeEventListener('wheel', this.onWheel);
  }

  private onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const linePx = 16;
    const pagePx = window.innerHeight * 0.9;
    const delta = e.deltaMode === 1 ? e.deltaY * linePx : e.deltaMode === 2 ? e.deltaY * pagePx : e.deltaY;
    this.velocity += delta;
    this.velocity = Math.max(-520, Math.min(520, this.velocity));
    this.stopAnchorAnim();
  };

  protected toggleTheme(): void {
    this.themeOverride = this.theme === 'dark' ? 'light' : 'dark';
    this.theme = this.themeOverride as 'dark' | 'light';
    const [r, g, b] = this.hexToVec3(this.theme === 'dark' ? '#0a0a0f' : '#eef4ff');
    this.gl.uniform3f(this.uBg, r, g, b);
  }

  protected scrollToSection(id: string): void {
    const target = document.querySelector(id);
    if (!target) return;
    const y = Math.max(0, Math.min((target as HTMLElement).offsetTop, this.maxScroll));
    this.smoothScrollToY(y);
  }

  private hexToVec3(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  private updateScrollMetrics = (): void => {
    const vh = this.lastViewportH || window.innerHeight;
    this.maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    this.tgt = this.maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / this.maxScroll)) : 0;
  };

  private requestResize = (): void => {
    if (!this.resizeRAF) this.resizeRAF = requestAnimationFrame(() => this.resize());
  };

  private resize(): void {
    this.resizeRAF = 0;
    const canvas = this.canvasRef.nativeElement;
    const w = Math.round(window.innerWidth);
    const h = Math.round(window.innerHeight);
    if (!w || !h) return;
    this.lastViewportW = w; this.lastViewportH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderScale = dpr * this.qualityScale;
    const pw = Math.max(1, Math.round(w * renderScale));
    const ph = Math.max(1, Math.round(h * renderScale));
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw; canvas.height = ph;
      this.gl.viewport(0, 0, pw, ph);
      this.gl.uniform2f(this.uR, pw, ph);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    this.updateScrollMetrics();
  }

  private frame = (now: number): void => {
    this.animId = requestAnimationFrame(this.frame);
    const dt = Math.min((now - this.lastNow) / 1000, 0.05);
    this.lastNow = now;

    this.fpsAccum += dt; this.fpsFrames++;
    if (this.fpsAccum >= 0.75) {
      const avgDt = this.fpsAccum / this.fpsFrames;
      const fps = 1 / avgDt;
      this.fpsAccum = 0; this.fpsFrames = 0;
      if (fps < 50) { this.lowFpsTime += 0.75; this.highFpsTime = 0; }
      else if (fps > 57) { this.highFpsTime += 0.75; this.lowFpsTime = 0; }
      else { this.lowFpsTime = 0; this.highFpsTime = 0; }
      if (this.lowFpsTime >= 1.5 && this.qualityScale > 0.82) {
        this.qualityScale = Math.max(0.82, +(this.qualityScale - 0.06).toFixed(2));
        this.lowFpsTime = 0; this.requestResize();
      }
      if (this.highFpsTime >= 3.0 && this.qualityScale < 1) {
        this.qualityScale = Math.min(1, +(this.qualityScale + 0.04).toFixed(2));
        this.highFpsTime = 0; this.requestResize();
      }
    }

    this.velocity *= Math.pow(0.86, dt * 60);
    if (Math.abs(this.velocity) < 0.02) this.velocity = 0;
    if (this.velocity !== 0) window.scrollBy({ top: this.velocity * 0.1, behavior: 'auto' });

    this.smooth += (this.tgt - this.smooth) * (1 - Math.exp(-dt * 8));
    const raw = this.smooth * 4;
    const si = Math.min(Math.floor(raw), 3);
    const bl = raw - si;

    this.hudPct = String(Math.round(this.smooth * 100)).padStart(3, '0') + '%';
    this.progPct = Math.round(this.smooth * 100);
    this.sceneLabel = this.NAMES[Math.min(Math.floor(this.smooth * 5), 4)];
    this.activeDot = Math.min(Math.floor(this.smooth * 5), 4);

    this.gl.uniform1f(this.uTi, (now - this.t0) / 1000);
    this.gl.uniform1f(this.uScroll, this.smooth);
    this.gl.uniform1f(this.uScene, si);
    this.gl.uniform1f(this.uBlend, bl);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  };

  private stopAnchorAnim(): void {
    if (this.anchorAnim) { cancelAnimationFrame(this.anchorAnim); this.anchorAnim = null; }
  }

  private smoothScrollToY(targetY: number, duration = 900): void {
    this.stopAnchorAnim(); this.velocity = 0;
    const startY = window.scrollY; const diff = targetY - startY; const start = performance.now();
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + diff * ease(p));
      if (p < 1) this.anchorAnim = requestAnimationFrame(tick); else this.anchorAnim = null;
    };
    this.anchorAnim = requestAnimationFrame(tick);
  }
}
