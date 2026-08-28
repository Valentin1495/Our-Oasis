import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'our-oasis',
  brand: {
    displayName: '우리들의 오아시스',
    primaryColor: '#014bf9',
    icon: 'https://static.toss.im/appsintoss/25061/88c4adb1-13cd-4f35-aae4-edfd2b0e4ea3.png',
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
