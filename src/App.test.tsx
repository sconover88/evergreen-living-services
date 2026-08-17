import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app branding', () => {
    render(<App />);
    expect(
      screen.getByText('Evergreen Living Services')
    ).toBeInTheDocument();
  });

  it('renders nursing documentation subtitle', () => {
    render(<App />);
    expect(
      screen.getByText('Nursing Documentation')
    ).toBeInTheDocument();
  });

  it('shows patient list in patient-selection phase', () => {
    render(<App />);
    // PatientList should render patient names from mock data
    expect(screen.getByText('Margaret Thompson')).toBeInTheDocument();
  });
});
