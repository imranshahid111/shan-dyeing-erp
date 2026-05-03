import { defineConfig } from 'vite'
import path from 'path'
import os from 'os'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Auto-detect LAN (non-internal IPv4) IP at dev/build time
function getLanIp(): string {
  const nets = os.networkInterfaces()
  for (const iface of Object.values(nets)) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address
      }
    }
  }
  return '127.0.0.1' // fallback
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
    base: './', 
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Inject machine's LAN IP so the frontend can auto-build the API base URL
  define: {
    __LAN_IP__: JSON.stringify(getLanIp()),
  },
})
