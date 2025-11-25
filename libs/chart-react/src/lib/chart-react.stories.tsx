import type { Meta, StoryObj } from '@storybook/react';
import { ChartReact } from './chart-react';

const meta: Meta<typeof ChartReact> = {
  component: ChartReact,
  title: 'ChartReact',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChartReact>;

export const Primary: Story = {
  args: {
    data: [1, 2, 3],
    type: 'bar',
  },
};
