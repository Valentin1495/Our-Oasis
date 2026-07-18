import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'our-oasis',
  brand: {
    displayName: '우리들의 오아시스',
    primaryColor: '#2db8af',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite dev',
      build: 'vite build',
    },
  },
  permissions: [
    { name: 'clipboard', access: 'write' },
    { name: 'clipboard', access: 'read' },
  ],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});
