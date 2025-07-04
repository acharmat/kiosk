import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        vue(),
        electron([
            {
                // Main process entry point
                entry: 'electron/main.ts',
                onstart: (options) => {
                    if (process.env.VSCODE_DEBUG) {
                        console.log('[startup] Electron App')
                    } else {
                        options.startup()
                    }
                },
                vite: {
                    build: {
                        sourcemap: 'inline',
                        minify: false,
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['better-sqlite3', 'electron-store', '@electron-toolkit/utils']
                        }
                    }
                }
            },
            {
                // Preload scripts
                entry: 'electron/preload.ts',
                onstart: (options) => options.reload(),
                vite: {
                    build: {
                        sourcemap: 'inline',
                        minify: false,
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['better-sqlite3', 'electron-store', '@electron-toolkit/utils']
                        }
                    }
                }
            }
        ]),
        // Use Node.js API in the Renderer process
        renderer()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@assets': resolve(__dirname, 'src/assets'),
            '@components': resolve(__dirname, 'src/components'),
            '@views': resolve(__dirname, 'src/views'),
            '@stores': resolve(__dirname, 'src/stores'),
            '@services': resolve(__dirname, 'src/services'),
            '@types': resolve(__dirname, 'src/types'),
            '@utils': resolve(__dirname, 'src/utils')
        }
    },
    build: {
        outDir: 'dist-renderer',
        target: 'chrome100', // Electron uses Chromium
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            }
        }
    },
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 5173
        }
    },

    optimizeDeps: {
        exclude: ['electron']
    }
})