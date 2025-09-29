import '@testing-library/jest-dom';
import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock window.matchMedia for accessibility testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for performance monitoring tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver for performance tests
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame for animation performance tests
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn().mockImplementation((id) => clearTimeout(id));

// Mock web vitals functions
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFCP: vi.fn(),
  getFID: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
}));

// Mock UUID for consistent test IDs
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid-1234'),
}));

// Setup for accessibility testing
beforeEach(() => {
  // Reset any global state
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 