import { render } from '@testing-library/react';

import { ChartReact } from './chart-react';

describe('ChartReact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChartReact data={[1, 2, 3]} type="bar" />);
    expect(baseElement).toBeTruthy();
  });
});
