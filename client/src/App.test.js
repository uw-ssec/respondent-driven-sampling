import { render, screen } from '@testing-library/react';
import App from './App';

// This is a test suite for the App component
// It uses React Testing Library to render the App component and check if it behaves as expected
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
