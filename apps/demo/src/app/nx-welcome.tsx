import { useState } from 'react';
import { ChartComponent } from '@berry-org-test/chart-react';
import './app.css';

export function NxWelcome({ title }: { title: string }) {
  const [chartData, setChartData] = useState<number[]>([10, 40, 30, 70, 50]);

  const randomizeData = () => {
    const newData = chartData.map(() => Math.floor(Math.random() * 100));
    setChartData(newData);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>2D Chart Library Demo</h1>
        <p>Core Engine: Vanilla TS / Wrapper: React</p>
      </header>

      <main>
        <div className="controls">
          <button onClick={randomizeData} className="btn-primary">
            Randomize Data
          </button>
        </div>

        <div className="chart-grid">
          <div className="card">
            <h2>Bar Chart</h2>
            <div className="chart-wrapper">
              <ChartComponent type="bar" data={chartData} height="300px" />
            </div>
          </div>

          <div className="card">
            <h2>Line Chart</h2>
            <div className="chart-wrapper">
              <ChartComponent type="line" data={chartData} height="300px" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NxWelcome;
