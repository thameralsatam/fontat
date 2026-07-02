import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// يتم توليد رقم الإصدار تلقائياً بناءً على وقت البناء (Build Timestamp) ليتغير مع كل نشر (Deployment) تلقائياً على كلاود فلير دون الحاجة للتغيير اليدوي
const APP_VERSION = '1.1.0_' + Date.now(); 

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'manual-asset-versioning',
      enforce: 'post',
      generateBundle(options, bundle) {
        // يتم تعطيل الهاش الافتراضي في الأسفل (rollupOptions)
      },
      transformIndexHtml(html) {
        // إضافة رقم الإصدار إلى جميع ملفات JS و CSS في index.html
        return html.replace(
          /(src|href)="(.*?\.(?:js|css))"/g,
          `$1="$2?v=${APP_VERSION}"`
        );
      }
    },
    {
      name: 'manual-css-versioning',
      enforce: 'pre',
      transform(code, id) {
        // إضافة رقم الإصدار إلى مسارات الخطوط (والصور) داخل ملفات CSS
        if (id.endsWith('.css')) {
          return code.replace(
            /url\(['"]?(\/fonts\/[^'"?)]+\.[a-zA-Z0-9]+)[\?v=[0-9.]+]*['"]?\)/g,
            `url('$1?v=${APP_VERSION}')`
          );
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // إزالة الـ hashes من أسماء الملفات لاعتماد نظام الإصدارات اليدوي
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
