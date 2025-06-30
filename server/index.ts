import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { appConfig, validateConfig } from "./config";
import { storage } from "./storage";
import { wallets } from "@shared/schema";

// Validate environment configuration
// Hot reload test comment
validateConfig();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Fungsi untuk memastikan Dompet Utama selalu tersedia
async function ensureMainWallet() {
  try {
    log('Memeriksa keberadaan Dompet Utama...');
    const allWallets = await storage.getWallets();
    
    // Cek apakah sudah ada dompet dengan isMain = true
    const mainWallet = allWallets.find(wallet => wallet.isMain === true);
    
    if (!mainWallet) {
      log('Dompet Utama tidak ditemukan, membuat Dompet Utama baru...');
      
      // Cari admin untuk dijadikan creator
      const adminUser = await storage.getUserByUsername('admin');
      const creatorId = adminUser ? adminUser.id : 1; // Default ke ID 1 jika admin tidak ditemukan
      
      // Buat Dompet Utama baru
      const newMainWallet = await storage.createWallet({
        name: 'Dompet Utama',
        balance: '0',
        description: 'Dompet utama yang tidak dapat dihapus',
        createdBy: creatorId,
        isMain: true
      });
      
      log(`Dompet Utama berhasil dibuat dengan ID: ${newMainWallet.id}`);
    } else {
      log(`Dompet Utama sudah tersedia dengan ID: ${mainWallet.id}`);
    }
  } catch (error) {
    console.error('Error saat memastikan keberadaan Dompet Utama:', error);
  }
}

(async () => {
  const server = await registerRoutes(app);
  
  // Pastikan Dompet Utama tersedia saat aplikasi pertama kali berjalan
  await ensureMainWallet();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error for debugging
    console.error(`Error ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    
    // Send response to client
    res.status(status).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use configured port or default to 5000
  const port = appConfig.server.port;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();