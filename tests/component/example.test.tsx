import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

function Greeting() {
  return <p>Sawubona</p>;
}

describe('T-SETUP-5: jsdom and Testing Library run', () => {
  it('T-SETUP-5: finds the text of a rendered component', () => {
    render(<Greeting />);
    expect(screen.getByText('Sawubona')).toBeInTheDocument();
  });
});
