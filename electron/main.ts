import { app, BrowserWindow, shell, Menu, dialog } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as http from "http";

const PORT = 3000;
const DEV = process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

function waitForServer(url: string, retries = 30): Promise<void> {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      }).on("error", retry);
    };
    const retry = () => {
      if (retries-- <= 0) { reject(new Error("Next.js server did not start")); return; }
      setTimeout(attempt, 1000);
    };
    attempt();
  });
}

function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(app.getAppPath(), "node_modules", ".bin", "next");
    const appDir = app.getAppPath();

    nextServer = spawn(nextBin, ["start", "-p", String(PORT)], {
      cwd: appDir,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "pipe",
    });

    nextServer.stdout?.on("data", (data) => {
      const text = String(data);
      if (text.includes("Ready") || text.includes("started")) resolve();
    });

    nextServer.stderr?.on("data", (data) => {
      console.error("[next]", String(data));
    });

    nextServer.on("error", reject);
    nextServer.on("exit", (code) => {
      if (code !== 0 && code !== null) reject(new Error(`Next.js exited with code ${code}`));
    });

    // Fallback: poll until server responds
    waitForServer(`http://localhost:${PORT}`).then(resolve).catch(reject);
  });
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Bookmoth",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "Open project folder",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => {
            shell.openPath(app.getAppPath());
          },
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(DEV ? [{ role: "toggleDevTools" as const }] : []),
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0f0e0d",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (DEV) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await startNextServer();
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }
}

app.whenReady().then(async () => {
  createMenu();
  try {
    await createWindow();
  } catch (err) {
    dialog.showErrorBox("Startup error", String(err));
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill("SIGTERM");
    nextServer = null;
  }
});
