
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                ws: true,
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['lucide-react', 'framer-motion', '@radix-ui/react-accordion', '@radix-ui/react-switch'],
                    charts: ['recharts'],
                    three: ['three', '@react-three/fiber', '@react-three/drei']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})
