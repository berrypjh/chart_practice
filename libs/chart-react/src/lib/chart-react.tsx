import React, { useEffect, useRef } from 'react';
import { ChartEngine, ChartOptions } from '@berry-org-test/chart-core';

export interface ChartReactProps extends ChartOptions {
  width?: string;
  height?: string;
}

export const ChartReact: React.FC<ChartReactProps> = ({
  data,
  type,
  width = '100%',
  height = '300px',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartEngine | null>(null);

  // 1. 초기화 (Mount)
  useEffect(() => {
    if (!canvasRef.current) return;

    // Core 엔진 인스턴스 생성
    chartInstance.current = new ChartEngine(canvasRef.current, {
      type,
      data,
    });

    // 초기 렌더링
    chartInstance.current.render();

    // 3. 해제 (Unmount)
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []); // 의존성 배열을 비워 인스턴스는 한 번만 생성되도록 함 (옵션 변경은 아래에서 처리)

  // 2. 데이터 업데이트 (Update)
  useEffect(() => {
    if (chartInstance.current) {
      // React의 props 변경을 Core 엔진의 메서드 호출로 변환
      chartInstance.current.updateData(data);
    }
  }, [data]);

  return (
    <div style={{ width, height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
