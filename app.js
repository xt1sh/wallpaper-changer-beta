const fs = require("fs");
const electron = require('electron'); 
const wallpaper = require('wallpaper');
const schedule = require('node-schedule');
const Store = require('electron-store');
const path = require('path');
const { getCurrentWindow, globalShortcut, dialog } = require('electron').remote;

const lastChangeDateKey = 'lastChange';
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

this.setButtonEvent();
this.buildGrid();

var store = new Store();

this.checkStoreDate().then();

function setButtonEvent() {
    let button = document.getElementById('cur-btn');
    button.addEventListener('click', () => this.setNewImageForCurrentDate());
}

function buildGrid() {
    let parentDiv = document.getElementById('months-grid');
    let sortedMonths = this.getSortedMonths();
    let currentMonth = new Date().getMonth();
    sortedMonths.forEach(month => {
        let currentPictureSrc = './images/' + sortedMonths.indexOf(month) + '.png';
        console.log(currentPictureSrc)
        let element = document.createElement('div');
        element.classList.add(...['month-picker-container']);
        element.innerHTML = `
            <h4>${month}</h4>
            <button id="month-${months.indexOf(month)}" class="month-picker-button" ${fs.existsSync(currentPictureSrc) ? 'style="background:url('+currentPictureSrc+') no-repeat"' : ''}>
                ${fs.existsSync(currentPictureSrc) ? '' : 'add'}
            </button>
        `;
        parentDiv.appendChild(element);
    });
    this.setButtonEvents();
}

function setButtonEvents() {
    for (let i = 0; i < 12; i++) {
        let button = document.getElementById(`month-${i}`);
        button.addEventListener('click', () => {
            if (process.platform !== 'darwin') {
                dialog.showOpenDialog({
                    title: 'Select the File to be uploaded',
                    defaultPath: path.join(__dirname, './images/'),
                    buttonLabel: 'Upload',
                    filters: [
                        {
                            name: 'Images',
                            extensions: ['png', 'jpg', 'jpeg']
                        }, ],
                    properties: ['openFile']
                }).then(file => {
                    if (!file.canceled) {
                      var filePath = file.filePaths[0].toString();
                      fs.createReadStream(filePath).pipe(fs.createWriteStream(`./images/${i}.png`));
                      getCurrentWindow().reload();
                    }
                }).catch(err => {
                    console.log(err)
                });
            }
            else {
                dialog.showOpenDialog({
                    title: 'Select the File to be uploaded',
                    defaultPath: path.join(__dirname, './images/'),
                    buttonLabel: 'Upload',
                    filters: [
                        {
                            name: 'Images',
                            extensions: ['png', 'jpg', 'jpeg']
                        }, ],
                    properties: ['openFile', 'openDirectory']
                }).then(file => {
                    if (!file.canceled) {
                        var filePath = file.filePaths[0].toString();
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(`./images/${i}.png`));
                        getCurrentWindow().reload();
                    }
                }).catch(err => {
                    console.log(err)
                });
            }
        });
    }
}

function getSortedMonths() {
    return months.sort((a, b) => months.indexOf(a) - months.indexOf(b));
}

async function setNewImageForCurrentDate() {
    let currentMonth = new Date().getMonth();
    let image = `./images/${currentMonth}.png`;
    if (fs.existsSync(image)) {
        await wallpaper.set(image);
    }
    this.setNextDateEvent();
    this.setCurrentMonthToStore();
}

function setNextDateEvent() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let nextMonth = (currentMonth + 1) % 12;
    let currentYear = currentDate.getFullYear();
    let nextDate = new Date(nextMonth === 0 ? currentYear + 1 : currentYear, nextMonth);
    schedule.scheduleJob(nextDate, () => this.setNewImageForCurrentDate().then());
}

async function checkStoreDate() {
    let lastChangeDate = store.get(lastChangeDateKey);
    let currentMonth = new Date().getMonth();
    if (!lastChangeDate || currentMonth != lastChangeDate) {
        await this.setNewImageForCurrentDate();
    } else {
        setNextDateEvent();
    }
}

function setCurrentMonthToStore() {
    let currentMonth = new Date().getMonth();
    store.set(lastChangeDateKey, currentMonth);
}

function uploadImage(image, index) {
    fs.writeFileSync(`./images/${index}.png`, image, { flag: 'w' });
}
