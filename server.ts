/**
 * =================================================================
 * SERVIDOR PRINCIPAL DE LA APLICACIÓN (Express.js)
 * =================================================================
 * Este archivo configura y ejecuta el servidor web que alimenta la aplicación.
 * Utiliza Express para el enrutamiento y la gestión de la API, y se integra
 * con Vite para el desarrollo y para servir la aplicación compilada en producción.
 */

// Importaciones de módulos esenciales
import express from "express"; // Framework para construir el servidor web.
import fs from "fs"; // Módulo del sistema de archivos de Node.js para leer/escribir archivos.
import path from "path"; // Módulo para trabajar con rutas de archivos y directorios.
import cors from "cors"; // Middleware para habilitar Cross-Origin Resource Sharing (CORS).
import "dotenv/config"; // Carga las variables de entorno desde el archivo .env.

// Creación de la instancia de la aplicación Express
const app = express();

// --- Configuración del Puerto ---
// El servidor escuchará en el puerto definido por la variable de entorno PORT (proporcionada por Google Cloud)
// o, si no está definida, usará el puerto 3000 por defecto.
// Se usa parseInt para asegurar que el valor sea un número.
const PORT = parseInt(process.env.PORT || '3000', 10);

// --- Middlewares Globales ---
// express.json() permite al servidor parsear cuerpos de solicitud en formato JSON.
// Se aumenta el límite a 50mb para permitir la carga de bases de conocimiento grandes.
app.use(express.json({ limit: '50mb' }));
// cors() permite que el frontend (que corre en un origen diferente) se comunique con esta API.
app.use(cors());

// --- Gestión de Archivos de Datos ---
// Define las rutas absolutas para los archivos que almacenan la configuración y la base de conocimientos.
// Usar process.cwd() asegura que las rutas sean correctas sin importar desde dónde se inicie el servidor.
const SETTINGS_FILE = path.join(process.cwd(), "settings.json");
const KNOWLEDGE_FILE = path.join(process.cwd(), "knowledge.json");

// --- Configuración por Defecto ---
// Si el archivo settings.json no existe, se creará con estos valores iniciales.
const defaultSettings = {
  welcomeMessageEs: "Hola, soy un agente especializado de TI y te ayudare con encontrar el mejor equipo para ti.",
  welcomeMessageEn: "Hello, I am a specialized IT agent and I will help you find the best equipment for you.",
  systemInstruction: "Eres un Agente de Conocimiento Avanzado especializado en TI. Responde de forma profesional y concisa.",
  temperature: 0.7,
  historyLimit: 5,
  ragLimit: 3,
  model: "gemini-2.5-flash"
};

// --- Inicialización de Archivos ---
// Comprueba si los archivos de datos existen. Si no, los crea con contenido por defecto.
// Esto previene errores en el primer arranque de la aplicación.
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
}
if (!fs.existsSync(KNOWLEDGE_FILE)) {
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify([], null, 2));
}

/**
 * =================================================================
 * RUTAS DE LA API
 * =================================================================
 * Definen los endpoints para que el frontend pueda obtener y guardar datos.
 */

// Endpoint para OBTENER la configuración actual
app.get("/api/settings", (req, res) => {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

// Endpoint para GUARDAR la configuración
app.post("/api/settings", (req, res) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Endpoint para OBTENER la base de conocimientos
app.get("/api/knowledge", (req, res) => {
  try {
    const data = fs.readFileSync(KNOWLEDGE_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Failed to read knowledge" });
  }
});

// Endpoint para GUARDAR la base de conocimientos
app.post("/api/knowledge", (req, res) => {
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save knowledge" });
  }
});

/**
 * =================================================================
 * ARRANQUE DEL SERVIDOR Y GESTIÓN DE ENTORNOS
 * =================================================================
 */

async function startServer() {
  // --- Modo de Desarrollo ---
  // Si la aplicación NO está en producción, se usa Vite como middleware.
  // Esto permite el Hot-Module-Replacement y una experiencia de desarrollo fluida.
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // --- Modo de Producción ---
    // Cuando se publica, el servidor debe servir los archivos estáticos compilados.
    // La carpeta 'dist' contiene la versión optimizada del frontend.
    const distPath = path.resolve(process.cwd(), 'dist'); // Ruta a los assets del cliente
    app.use(express.static(distPath));
    
    // Fallback para Single-Page Applications (SPA).
    // Cualquier ruta no reconocida por la API devolverá el index.html principal.
    // Inyectamos la API Key en tiempo de ejecución para que el cliente la tenga disponible
    // incluso si no estaba presente durante la compilación.
    app.get(/(.*)/, (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf-8');
          const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
          const injection = `<script>window.process = { env: { GEMINI_API_KEY: ${JSON.stringify(apiKey)} } };</script>`;
          html = html.replace('<head>', `<head>${injection}`);
          res.send(html);
        } else {
          res.status(404).send('Not Found');
        }
      } catch (e) {
        res.status(500).send('Internal Server Error');
      }
    });
  }

  // Inicia el servidor para que escuche en el puerto y host configurados.
  // Escuchar en '0.0.0.0' es crucial para que el servidor sea accesible desde fuera del contenedor.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Llama a la función para iniciar todo el proceso.
startServer();
