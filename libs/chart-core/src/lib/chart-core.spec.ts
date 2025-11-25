import { ChartEngine } from './chart-core.js';

describe('ChartEngine', () => {
  it('should work', () => {
    const canvas = document.createElement('canvas');
    const mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      scale: vi.fn(),
    };
    vi.spyOn(canvas, 'getContext').mockReturnValue(
      mockContext as unknown as CanvasRenderingContext2D
    );

    const chart = new ChartEngine(canvas, {
      type: 'bar',
      data: [1, 2, 3],
    });

    expect(chart).toBeInstanceOf(ChartEngine);
  });
});
