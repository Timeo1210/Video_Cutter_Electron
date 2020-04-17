const electron = require('electron');
const { app, BrowserWindow, Menu } = electron;
const mainMenuTemplate = require('../menuTemplates/mainMenu');

/**
 * Creer la fenetre principal
 */
function CreateMainWindow() {
    mainWindow = new BrowserWindow({
        title: "Fast4Videos",
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile('./views/mainWindow.html');

    if (process.env.NODE_ENV == 'development') {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.on('closed', function() {
        app.quit();
    })

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
}

module.exports = CreateMainWindow;