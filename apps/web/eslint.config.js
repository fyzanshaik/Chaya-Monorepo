import { defineConfig } from 'eslint-define-config';

export const nextJsConfig = defineConfig({
  extends: ['next/core-web-vitals', 'turbo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
});
