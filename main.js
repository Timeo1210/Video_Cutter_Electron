const electron = require('electron');
const path = require('path');
const fs = require('fs');
const strftime = require('strftime');
const expressApp = require('express')()
const http = require('http').createServer(expressApp)
const io = require('socket.io')(http)
const cp = require('child_process')

const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;

//PARAMS
app.allowRendererProcessReuse = true;
process.env.NODE_ENV = "production";
const DS = path.sep;
const RLPATH = app.getAppPath();
const FLPATH = process.env.NODE_ENV == 'production' ? path.dirname(RLPATH) : RLPATH
const FILE = {}

let mainWindow;

app.on('ready', () => {
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
});

//TEMPLATES
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add Video',
                accelerator: process.platform == 'darwin' ? 'Cmd+O' : 'Ctrl+O',
                click() {
                    openFile()
                }
            }
        ]
    }
]
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({label: ''})
}


//Add developper tools if not in production
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: "Developer Tools",
        submenu: [
            {
                label: "Toggle DevTools",
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

/**
 * Ouvre la boite une dialog pour ouvrir un fichier
 */
function openFile() {
    const files = dialog.showOpenDialogSync(mainWindow, {
        properties: [
            'openFile'
        ],
        filters: [
            {
                name: 'Movies',
                extensions: ['mkv', 'flv', 'gif', 'avi', 'mov', 'mp4', 'm4p', 'm4v', 'mpeg']
            }
        ]
    });

    if (typeof files[0] !== 'undefined') {
        handleVideoFile(files[0])
    }
}

function handleVideoFile(file) {

    const filePath = file;
    let filePathSeperated = filePath.split(DS)
    const fileName = filePathSeperated[filePathSeperated.length - 1];
    const currentDate = strftime('%d-%m-%Y_%H-%M-%S')
    const fileDirName = currentDate;
    FILE.videoName = fileName
    FILE.videoDir = fileDirName
    FILE.filePath = filePath 
    mainWindow.webContents.send('videos:init', {
        dirName: fileDirName,
        name: fileName,
    });
    
}

function handleDeleteCache() {
    const fileDirPathOut = path.join(FLPATH, "cache", "Output_Videos", FILE.videoDir)
    const newFilePathOut = path.join(FLPATH, "cache", "Output_Videos", FILE.videoDir, FILE.videoName)
    try {
        fs.unlinkSync(newFilePathOut)
        fs.rmdirSync(fileDirPathOut)
    } catch (e) {
        console.log(e)
    }
}

//IpcRenderer
ipcMain.on('startMain', (event, arg) => {
    FILE.videoName = arg.name 
    const fileDirPathIn = path.join(FLPATH, "cache", "Input_Videos", FILE.videoDir)
    const newFilePath = path.join(FLPATH, "cache", "Input_Videos", FILE.videoDir, FILE.videoName)
    try {
        fs.mkdirSync(fileDirPathIn);
        fs.copyFileSync(FILE.filePath, newFilePath, (err) => {
            console.log(err)
        })
        FILE.newFilePath = newFilePath
        io.emit('run main', {"videoName": FILE.videoName, "videoDir": FILE.videoDir})
        event.returnValue = "starting..."
    } catch (e) {
        event.returnValue = "error"
    }
})

ipcMain.on('videoFile', (event, arg) => {
    handleVideoFile(arg)
    event.returnValue = "OK"
})

ipcMain.on('videoSaveFile', (event, arg) => {
    const filePath = arg;
    const finalFilePath = path.join(FLPATH, "cache", "Output_Videos", FILE.videoDir, FILE.videoName)
    fs.copyFileSync(finalFilePath, filePath, (err) => {
        console.log(err)
    })
    handleDeleteCache()
    event.returnValue = "OK"
    mainWindow.webContents.send('videos:restart', "restart")
})

//IO
io.on('connection', function(socket) {
    socket.on('mainStatus', function(msg) {
        console.log('CP: ' + JSON.stringify(msg))
        mainWindow.webContents.send('videos:status', msg)
    })
})

//PYTHON
let exeProc = null;

const createPyProc = () => {
    if (process.env.NODE_ENV === 'production') {
        if (process.platform === 'darwin') {
            //TODO
        } else {
            EXEpath = path.resolve(FLPATH, 'windist', 'client', 'client.exe')
        }
    } else {
        if (process.platform == 'darwin') {
            //TODO
        } else {
            EXEpath = path.resolve(__dirname, 'windist', 'client', 'client.exe')
        }
    }
    exeProc = cp.execFile(EXEpath)

    if (exeProc !== null) {
        console.log('child process sucessed')
    }
}

const exitPyProc = () => {
    exeProc.kill()
}

app.on('ready', createPyProc)
app.on('will-quit', exitPyProc)
http.listen(4646, function() {
    console.log('listenning on: 4646')
})

