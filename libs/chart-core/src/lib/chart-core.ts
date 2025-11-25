/**
 * [FILE: libs/chart-core/src/lib/chart-engine.ts]
 * * Chart Core: 렌더링 엔진 (Vanilla TypeScript)
 * React, Vue 등 프레임워크에 대한 의존성이 전혀 없습니다.
 * 오직 HTMLCanvasElement만 알면 됩니다.
 */

export interface ChartOptions {
  type: 'bar' | 'line';
  data: number[];
  colors?: string[];
}

export class ChartEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: ChartOptions;
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement, options: ChartOptions) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get 2d context');
    this.ctx = context;
    this.options = options;

    // 초기화 시 리사이즈 이벤트 바인딩 등을 수행
    this.setupListeners();
  }

  private setupListeners() {
    // Canvas 해상도 보정 (Retina display 대응 등)
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // 데이터 업데이트 메서드
  public updateData(newData: number[]) {
    this.options.data = newData;
    this.render();
  }

  // 실제 그리기 로직 (Framework Independent)
  public render() {
    // 캔버스 초기화
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 차트 타입에 따른 그리기 위임
    if (this.options.type === 'bar') {
      this.drawBarChart();
    } else {
      this.drawLineChart();
    }
  }

  private drawBarChart() {
    const { data } = this.options;
    const barWidth = 40;
    const gap = 10;

    this.ctx.fillStyle = '#3b82f6'; // Tailwind Blue 500
    data.forEach((value, index) => {
      const x = index * (barWidth + gap);
      const y = 100; // Simplified y position
      this.ctx.fillRect(x, y, barWidth, -value); // 음수로 위로 그리기
    });
  }

  private drawLineChart() {
    // 라인 차트 로직 구현...
    console.log('Drawing Line Chart');
  }

  // 메모리 해제
  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    // 이벤트 리스너 제거 등
    console.log('Engine destroyed');
  }
}
