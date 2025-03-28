const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Use verbose for more detailed logs
const fs = require('fs-extra'); // For file system operations
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

// --- Database Setup ---
const dbPath = path.join(__dirname, 'database', 'expenses.db');
let db; // Hold the database connection

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');

      // Use serialize to ensure table creation happens sequentially
      db.serialize(() => {
        // Create Projects Table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating projects table', err.message);
            return reject(err);
          }
          console.log('Projects table checked/created.');
        });

        // Create Expenses Table
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          receipt_image_path TEXT NOT NULL,
          receipt_date DATE,
          store_name TEXT,
          total_amount REAL,
          currency TEXT,
          location TEXT,
          date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
          ocr_raw_text TEXT,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating expenses table', err.message);
            return reject(err);
          }
          console.log('Expenses table checked/created.');
          resolve(); // Resolve the promise once tables are set up
        });
      });
    });
  });
}
// --- End Database Setup ---


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Protect against prototype pollution
      enableRemoteModule: false, // Turn off remote module
      nodeIntegration: false // Keep Node.js integration off in renderer
    }
  });

  // Load the index.html of the app.
  // Load the built index.html file from the 'dist' directory created by Vite.
  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // Open the DevTools (optional, uncomment for debugging)
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    await initializeDatabase(); // Ensure DB is ready before creating window
    createWindow();
  } catch (error) {
    console.error('Failed to initialize database or create window:', error);
    // Handle error appropriately, maybe quit the app or show an error dialog
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// --- IPC Handlers ---

// Get all projects
ipcMain.handle('db:getProjects', async (event) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject(new Error('Database not initialized.'));
    }
    // Ensure db connection is valid before querying
    if (!db.open) {
        console.error('Attempted to query closed database.');
        return reject(new Error('Database connection is closed.'));
    }
    db.all('SELECT id, name, created_at FROM projects ORDER BY name ASC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching projects:', err.message);
        reject(err);
      } else {
        console.log('Fetched projects:', rows);
        resolve(rows || []); // Ensure we always resolve with an array
      }
    });
  });
});

// Add a new project
ipcMain.handle('db:addProject', async (event, name) => {
  return new Promise((resolve, reject) => {
    if (!db || !db.open) {
      return reject(new Error('Database not initialized or closed.'));
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return reject(new Error('Invalid project name provided.'));
    }

    const sql = `INSERT INTO projects (name) VALUES (?)`;
    // Use function() syntax for callback to access 'this.lastID'
    db.run(sql, [name.trim()], function(err) {
      if (err) {
        console.error('Error adding project:', err.message);
        // Handle specific errors like UNIQUE constraint
        if (err.code === 'SQLITE_CONSTRAINT') {
           reject(new Error(`Project name "${name.trim()}" already exists.`));
        } else {
           reject(err);
        }
      } else {
        // Return the newly created project object
        const newProjectId = this.lastID;
        console.log(`Added project: ${name.trim()} with ID: ${newProjectId}`);
        // Fetch the newly added project to return complete data
        db.get('SELECT id, name, created_at FROM projects WHERE id = ?', [newProjectId], (getErr, row) => {
            if (getErr) {
                console.error('Error fetching newly added project:', getErr.message);
                reject(getErr);
            } else {
                resolve(row);
            }
        });
      }
    });
  });
});

// Save receipt image (expects base64 data)
ipcMain.handle('fs:saveImage', async (event, base64Data) => {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Invalid image data provided.');
    }

    // Basic check for base64 format (can be improved)
    const base64Match = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!base64Match) {
      throw new Error('Image data is not in expected base64 format (data:image/...).');
    }

    const fileExtension = base64Match[1] || 'png'; // Default to png if type is missing
    const imageBuffer = Buffer.from(base64Match[2], 'base64');
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const receiptsDir = path.join(__dirname, 'receipts');
    const filePath = path.join(receiptsDir, uniqueFilename);

    // Ensure the receipts directory exists
    await fs.ensureDir(receiptsDir);

    // Write the file
    await fs.writeFile(filePath, imageBuffer);

    console.log(`Saved receipt image to: ${filePath}`);

    // Return the relative path for storage in the database
    const relativePath = path.join('receipts', uniqueFilename);
    return relativePath;

  } catch (error) {
    console.error('Error saving image:', error.message);
    // Rethrow or return an error object/message to the renderer
    throw new Error(`Failed to save image: ${error.message}`);
  }
});


// Add other handlers here later (getExpenses, addExpense, processImage...)