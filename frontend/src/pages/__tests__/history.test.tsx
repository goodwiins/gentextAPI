import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import History from '../history';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/__mocks__/auth-context';
import { toast } from 'react-hot-toast';
import { Client, Databases } from 'appwrite';

// Create a wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </AuthProvider>
  );
};

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock appwrite
vi.mock('appwrite');

const mockInteractions = [
  {
    $id: '1',
    input_text: 'What is the capital of France?',
    response_text: 'The capital of France is Paris.',
    created_at: '2024-03-20T10:00:00.000Z',
    user_id: 'user123',
  },
  {
    $id: '2',
    input_text: 'Explain quantum computing in simple terms.',
    response_text: 'Quantum computing uses quantum mechanics principles...',
    created_at: '2024-03-19T15:30:00.000Z',
    user_id: 'user123',
  },
  {
    $id: '3',
    input_text: 'Write a poem about spring.',
    response_text: 'Flowers bloom in morning light...',
    created_at: '2024-03-18T09:15:00.000Z',
    user_id: 'user123',
  },
];

describe('History Page', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockClient = new Client();
  const mockDb = new Databases(mockClient);

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (mockDb.listDocuments as any).mockImplementation(() => Promise.resolve({ documents: mockInteractions }));
  });

  const renderWithWrapper = (component: React.ReactElement) => {
    return render(component, { wrapper: TestWrapper });
  };

  it('renders loading state', () => {
    renderWithWrapper(<History />);
    expect(screen.getByText('Loading your history...')).toBeInTheDocument();
  });

  it('renders empty state when no interactions', async () => {
    (mockDb.listDocuments as any).mockResolvedValueOnce({ documents: [] });

    renderWithWrapper(<History />);

    await waitFor(() => {
      expect(screen.getByText('No quizzes yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first quiz.')).toBeInTheDocument();
    });
  });

  it('renders interactions table with data', async () => {
    renderWithWrapper(<History />);

    await waitFor(() => {
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText('Explain quantum computing in simple terms.')).toBeInTheDocument();
    });
  });

  it('handles text filtering', async () => {
    renderWithWrapper(<History />);

    await waitFor(() => {
      const filterInput = screen.getByPlaceholderText('Filter by text...');
      fireEvent.change(filterInput, { target: { value: 'quantum' } });
      
      expect(screen.getByText('Explain quantum computing in simple terms.')).toBeInTheDocument();
      expect(screen.queryByText('What is the capital of France?')).not.toBeInTheDocument();
    });
  });

  it('handles delete interaction', async () => {
    (mockDb.deleteDocument as any).mockResolvedValueOnce({});

    renderWithWrapper(<History />);

    await waitFor(() => {
      const actionButtons = screen.getAllByRole('button', { name: 'Open menu' });
      fireEvent.click(actionButtons[0]);
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Interaction deleted successfully');
    });
  });

  it('handles view interaction', async () => {
    renderWithWrapper(<History />);

    await waitFor(() => {
      const actionButtons = screen.getAllByRole('button', { name: 'Open menu' });
      fireEvent.click(actionButtons[0]);
    });

    const viewButton = screen.getByText('View Quiz');
    fireEvent.click(viewButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/quiz?id=1');
  });

  it('handles error state', async () => {
    (mockDb.listDocuments as any).mockRejectedValueOnce(new Error('Failed to fetch'));

    renderWithWrapper(<History />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load your interaction history')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Failed to load history');
    });
  });
}); 