import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
}

@Component({
  standalone: false,
  selector: 'app-bubbles-canvas',
  template: '<canvas #canvas class="bubbles-canvas"></canvas>',
  styles: [`
    .bubbles-canvas {
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
export class BubblesCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() particleCount = 40;
  @Input() minRadius = 2;
  @Input() maxRadius = 10;
  @Input() speed = 0.004;
  @Input() color = 'hsla(42, 85%, 65%, ALPHA)';

  private ctx!: CanvasRenderingContext2D;
  private bubbles: Bubble[] = [];
  private animId = 0;

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
    this.bubbles = [];
    const spacing = w / this.particleCount;
    for (let i = 0; i < this.particleCount; i++) {
      this.bubbles.push({
        x: i * spacing + Math.random() * spacing * 0.5,
        y: Math.random() * h,
        r: this.minRadius + Math.random() * (this.maxRadius - this.minRadius),
        speed: 0.3 + Math.random() * 0.7,
        alpha: 0,
      });
    }
    this.draw();
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  };

  private draw = (): void => {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas || canvas.width === 0) {
      this.animId = requestAnimationFrame(this.draw);
      return;
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const b of this.bubbles) {
      b.alpha = Math.min(0.35 * (b.y / canvas.height), 0.35);
      b.speed += this.speed;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = this.color.replace('ALPHA', String(b.alpha));
      ctx.fill();

      b.y -= b.speed;
      if (b.y + b.r < 0) {
        b.y = canvas.height + b.r;
        b.x = Math.random() * canvas.width;
        b.speed = 0.3 + Math.random() * 0.7;
      }
    }

    this.animId = requestAnimationFrame(this.draw);
  };
}
