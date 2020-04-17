const electron = require('electron');
const { ipcRenderer } = electron;
const dialog = electron.remote.dialog;

const CONTAINER = document.getElementById('container');
const DOM = {
    button: document.createElement('button'),
    inputFile: document.getElementById('inputFile'),
    inputFileBrowse: document.getElementById('inputFileBrowse'),
    startButton: document.getElementById('startButton'),
    divStartButton: document.getElementById('divStartButton'),
    progressDiv: document.getElementById('progressDiv'),
    progressBar: document.getElementById('progressBar'),
    loadingBarText: document.getElementById('loadingBarText'),
    divSaveButton: document.getElementById('divSaveButton'),
    saveButton: document.getElementById('saveButton'),
}
const VIDEO = {}

ipcRenderer.on('videos:init', function(e, video) {
    console.log("INIT")
    VIDEO.name = video.name;
    VIDEO.dirName = video.dirName;
    console.log(VIDEO)

    DOM.inputFile.value = VIDEO.name
    DOM.inputFile.removeEventListener('click', chooseFile)

    DOM.startButton.disabled = false
    DOM.startButton.classList.remove('cursorNotAllowed')
})
ipcRenderer.on('videos:status', function(e, msg) {
    console.log(msg.progress)
    DOM.loadingBarText.innerHTML = msg['progress']
    //check if the message is a cut
    msg.processed = msg.progress.split(' ')
    if (msg.processed[0] === 'Cut') {
        const [nominateur, denominateur] = msg.processed[1].split('/').map(x => parseInt(x))
        const pourcentage = (nominateur/denominateur)*100
        DOM.progressBar.style.width = `${pourcentage}%`

    }

    if (msg.progress === "Terminé") {
        DOM.divSaveButton.classList.remove('notShow')
    }
})
ipcRenderer.on('videos:restart', function(e, msg) {
    DOM.inputFile.value = ""
    DOM.progressBar.style.width = "0%"
    DOM.loadingBarText.innerText = "Chargement..."
    DOM.progressDiv.classList.add("notShow")
    DOM.divSaveButton.classList.add("notShow")
    DOM.divStartButton.classList.remove("notShow")
    DOM.inputFile.addEventListener('click', chooseFile)
})
ipcRenderer.on('videos:debug', function(e, msg) {
    console.log(e)
    console.log(msg)
})
ipcRenderer.on('debug:console', function(e, msg) {
    console.log(msg)
})


function chooseFile() {
    const files = dialog.showOpenDialogSync({
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
    if (typeof files !== 'undefined') {
        ipcRenderer.sendSync('videoFile', files[0])
    }
}

function saveFile() {
    console.log(VIDEO)
    const files = dialog.showSaveDialogSync({
        defaultPath: VIDEO.name,
        filters: [
            {
                name: 'Movies',
                extensions: ['mp4', 'flv', 'gif', 'avi', 'mov', 'mkv', 'm4p', 'm4v', 'mpeg']
            }
        ]
    })

    console.log(files)
    if (typeof files !== 'undefined') {
        ipcRenderer.sendSync('videoSaveFile', files)
    }
}

function execPyProc() {
    console.log("start script")
    DOM.progressDiv.classList.remove('notVisible')
    VIDEO.name = DOM.inputFile.value
    ipcRenderer.sendSync('startMain', VIDEO)
    DOM.startButton.disabled = true;
    DOM.divStartButton.classList.add("notShow")
    DOM.progressDiv.classList.remove('notShow')
}

function runDevTest() {
    ipcRenderer.sendSync('run devTest', 'test')
}




DOM.startButton.addEventListener('click', execPyProc)
DOM.inputFile.addEventListener('click', chooseFile)
DOM.inputFileBrowse.addEventListener('click', chooseFile)
DOM.saveButton.addEventListener('click', saveFile)