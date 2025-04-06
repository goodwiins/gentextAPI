/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/frontend/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./frontend/src/setupTests.ts'],
    include: ['./frontend/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['frontend/src/**/*.{ts,tsx}'],
      exclude: [
        'frontend/src/**/*.{test,spec}.{ts,tsx}',
        'frontend/src/setupTests.ts',
      ],
    },
  },
}); 