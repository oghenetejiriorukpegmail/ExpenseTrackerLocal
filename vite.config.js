import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use the automatic runtime (default in Vite >= 2)
      jsxRuntime: 'automatic',
    }),
  ],
  // Set the root directory where index.html is located
  root: path.resolve(__dirname, 'src'),
  // Base public path when served in development or production.
  // './' ensures relative paths work correctly after building for Electron
  base: './',
  build: {
    // Output directory relative to the project root
    outDir: path.resolve(__dirname, 'dist'),
    // Ensure the output directory is emptied before building
    emptyOutDir: true,
    // Optional: Sourcemaps for debugging production builds
    // sourcemap: true,
  },
  // Optional: Configure server options if needed for development
  // server: {
  //   port: 3000, // Example port
  // }
});