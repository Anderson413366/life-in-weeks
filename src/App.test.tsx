import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock Supabase to avoid network calls
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('App Smoke Test', () => {
  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // The loading state has 'Loading...' text
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});
