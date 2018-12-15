let headerRow;
let tableBody;
let startingDate;
let reservedCells = new Array();

window.onload = ()=>{
    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.querySelector('#date-picker');
    startingDate.value = getLocalDateFormat(new Date());
    appendWeek(new Date());
    appendHours();
};

/*
* Create columns in table.
*/
function appendWeek(date) {
    headerRow.innerHTML = "";
    currentDate = date;
    headerRow.innerHTML += '<th> YEAR '+currentDate.getFullYear()+' </th>';

    for(let i = 0;i<7;i++) {
        let currentDay = currentDate.getDate();
        currentMonth = currentDate.getMonth()+1;
        headerRow.innerHTML += '<th>'+currentMonth+'/'+currentDay+ '</th>';
        currentDate.setDate(currentDate.getDate()+1);
    }
}

/*
* Create rows in table.
*/
function appendHours() {
    for(let i=8;i<21;i++) {
        tableBody.innerHTML += '<tr id="row"'+(i+1)+'>';
        let timeSufix = i>9 ? i+':00' : '0'+i +':00';
        timeSufix +='-';
        timeSufix += i+1>9 ? (i+1)+':00' : '0'+(i+1)+':00';
        let row ='<th scope="row">'+timeSufix+'</th>';
        
        for(let j=0;j<7;j++) {
            row +='<td id="cell'+i+'-'+j+'" onclick="cellClicked('+i+','+j+')"></td>';
        }
        tableBody.innerHTML +=row;
        tableBody.innerHTML +='</tr>';
    }
}

function dateChanged() {
    appendWeek(new Date(startingDate.value));
}

function cellClicked(startingTimeHour,dateIndex) {
    let cell = document.getElementById('cell'+startingTimeHour+'-'+dateIndex);
    cell.classList.toggle('reserved');
    let newCellObject = new cellObject(dateIndex,startingTimeHour);
    let newArray = reservedCells.filter(obj => !obj.equals(newCellObject));

    if(reservedCells.length == newArray.length) newArray.push(newCellObject);
    reservedCells = newArray;
}

function next() {
    let date = new Date(startingDate.value);
    date.setDate(date.getDate()+7);
    startingDate.value = getLocalDateFormat(date);
    console.log(startingDate.value)
    appendWeek(date);
}

function previous() {
    let date = new Date(startingDate.value);
    date.setDate(date.getDate()-7);
    startingDate.value = getLocalDateFormat(date);
    appendWeek(date);
}

/*
* Returns correct date format for HTML date input
*/
function getLocalDateFormat(date) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toJSON().slice(0,10);
}

function sendRequestForMeetings() {
    console.log(reservedCells);

    reservedCells = reservedCells.map(o=>{

        let cell = document.getElementById('cell'+o.startingTime+'-'+o.date);
        cell.classList.toggle('reserved'); 

        let newDate = new Date(startingDate.value);
        newDate.setDate(newDate.getDate()+o.date);
        return new cellObject(newDate,o.startingTime); 
    })
    reservedCells = new Array();
}

class cellObject {
    constructor(date,startingTime) {
        this.date = date;
        this.startingTime = startingTime;
    }

    equals(obj) {
        return this.date === obj.date && this.startingTime === obj.startingTime;
    }
}