import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (o el framework que uses)

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto equivale a usar el comando --host que configuramos antes
    allowedHosts: ['.trycloudflare.com'] // Permite cualquier URL que termine en trycloudflare.com
  }
})