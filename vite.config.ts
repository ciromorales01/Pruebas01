/**
 * =================================================================
 * ARCHIVO DE CONFIGURACIÓN DE VITE
 * =================================================================
 * Vite es la herramienta que compila y sirve el frontend de la aplicación.
 * Este archivo le dice a Vite cómo debe comportarse tanto en desarrollo como en producción.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // --- Plugins ---
  // Aquí se cargan las extensiones de Vite. `plugin-react` es esencial para que entienda JSX y React.
  plugins: [react()],

  // --- Base Path ---
  // Define la ruta base pública. './' es importante para que las rutas a los assets (CSS, JS, imágenes)
  // funcionen correctamente cuando se sirven desde el servidor Express en una subruta.
  base: './',

  // --- Definiciones Globales ---
  // Esta sección es CRÍTICA para que las variables de entorno del servidor (leídas de .env)
  // sean accesibles desde el código del frontend (que se ejecuta en el navegador).
  // Sin esto, `process.env.GEMINI_API_KEY` sería `undefined` en el cliente.
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || ""),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY || ""),
    'process.env': {}
  },

  // --- Configuración de Compilación (Build) ---
  // Estas opciones controlan cómo se genera la versión de producción de la aplicación.
  build: {
    // Directorio de salida. Aquí es donde Vite dejará los archivos compilados.
    // Es crucial que coincida con la ruta que el servidor Express espera en producción.
    outDir: 'dist',

    // Directorio para los assets (CSS, JS, etc.) dentro de `outDir`.
    assetsDir: 'assets',

    // Desactiva la generación de sourcemaps en producción para reducir el tamaño de la compilación.
    sourcemap: false
  }
});
