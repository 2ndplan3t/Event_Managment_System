// Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders the correct text', () => {
    render(<Button text="Click Me" onClick={() => {}} />);

    // Check if the button has the text content
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls the onClick function when clicked', () => {
    const handleClick = jest.fn(); // Mock function
    render(<Button text="Click Me" onClick={handleClick} />);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    // Check if the click function was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
