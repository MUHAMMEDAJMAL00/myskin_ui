import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

interface Droplet {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  drift: number;
}

@Component({
  standalone: false,
  selector: 'app-drip-canvas',
  template: '<canvas #canvas class="drip-canvas"></canvas>',
  styles: [`
    .drip-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      display: block;
    }
  `],
})
export class DripCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() dropCount = 25;
  @Input() smokeCount = 15;

  private ctx!: CanvasRenderingContext2D;
  private droplets: Droplet[] = [];
  private smoke: SmokeParticle[] = [];
  private animId = 0;
  private time = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.initCanvas();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    this.initParticles(w, h);
    this.draw();
  }

  private initParticles(w: number, h: number): void {
    this.droplets = [];
    for (let i = 0; i < this.dropCount; i++) {
      this.droplets.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.15 + Math.random() * 0.35,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        alpha: 0.15 + Math.random() * 0.35,
      });
    }
    this.smoke = [];
    for (let i = 0; i < this.smokeCount; i++) {
      this.smoke.push({
        x: Math.random() * w,
        y: h + Math.random() * 100,
        r: 30 + Math.random() * 60,
        speed: 0.08 + Math.random() * 0.15,
        alpha: 0.02 + Math.random() * 0.05,
        drift: -0.3 + Math.random() * 0.6,
      });
    }
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    this.initParticles(w, h);
  };

  private draw = (): void => {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas || canvas.width === 0) {
      this.animId = requestAnimationFrame(this.draw);
      return;
    }
    const ctx = this.ctx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    this.time += 0.005;

    for (const d of this.droplets) {
      d.wobble += d.wobbleSpeed;
      d.y += d.speed;
      d.x += Math.sin(d.wobble) * 0.15;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 109, 63, ${d.alpha * 0.5})`;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(d.x - d.r * 0.2, d.y - d.r * 0.2, d.r * 0.25, d.r * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 109, 63, ${d.alpha * 0.3})`;
      ctx.fill();

      if (d.y - d.r > h) {
        d.y = -d.r;
        d.x = Math.random() * w;
        d.speed = 0.1 + Math.random() * 0.4;
      }
    }

    for (const s of this.smoke) {
      s.y -= s.speed;
      s.x += s.drift + Math.sin(this.time + s.x * 0.01) * 0.2;
      s.alpha += (Math.sin(this.time * 2 + s.x * 0.01) * 0.005);

      s.alpha = Math.max(0.01, Math.min(0.08, s.alpha));
      s.r += 0.01;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 228, 212, ${s.alpha * 0.6})`;
      ctx.fill();

      if (s.y + s.r < 0) {
        s.y = h + s.r;
        s.x = Math.random() * w;
        s.r = 30 + Math.random() * 60;
        s.alpha = 0.02 + Math.random() * 0.04;
      }
    }

    this.animId = requestAnimationFrame(this.draw);
  };
}
