import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona no GitHub Pages ou em qualquer subpasta
export default defineConfig({
  base: './',
  plugins: [react()],
});
