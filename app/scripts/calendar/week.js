let headerRow;
let tableBody;
let startingDate;
let reservedCells = new Array();
let calendarData;
let currentDate;

window.onload = ()=>{
    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.querySelector('#date-picker');
    startingDate.value = getLocalDateFormat(new Date());
    calendarData = JSON.parse(window.localStorage.getItem("calendarData"));
    appendWeek(new Date());
    fillCellsWithData();
    console.log('DATA: ',calendarData);
};

/**
 * Creating columns in table.
 * @param {Object} date
*/
function appendWeek(date) {
    headerRow.innerHTML = "";
    currentDate = date;

    headerRow.innerHTML += '<th> YEAR '+currentDate.getFullYear()+' </th>';

    for(let i = 0;i<7;i++) {
        let tempDate = new Date(currentDate);
        tempDate.setDate(tempDate.getDate()+i);
        let tempDay = tempDate.getDate();
        let tempMonth = tempDate.getMonth()+1;
    
        headerRow.innerHTML += '<th>'+tempMonth+'/'+tempDay+ '</th>';
        //currentDate.setDate(currentDate.getDate()+1);
    }
    appendHours();
}

/**
 * Creating rows in table.
/**
 *
 *
 */
function appendHours() {
    tableBody.innerHTML = '';
    for(let i=7;i<21;i++) {
        tableBody.innerHTML += '<tr id="row"'+(i+1)+'>';
        let timeSufix = i>9 ? i+':00' : '0'+i +':00';
        timeSufix +='-';
        timeSufix += i+1>9 ? (i+1)+':00' : '0'+(i+1)+':00';
        let row ='<th scope="row">'+timeSufix+'</th>';
        
        for(let j=0;j<7;j++) {
            let tempDate = new Date(currentDate);
            tempDate.setDate(tempDate.getDate()+j);
            let tempDay = tempDate.getDate();
            let tempMonth = tempDate.getMonth()+1;
            let dateString = tempMonth+"/"+tempDay;
            
            row +='<td id="cell'+i+'-'+dateString+'" onclick="cellClicked('+i+','+tempMonth+','+tempDay+')"></td>';
        }
        tableBody.innerHTML +=row;
        tableBody.innerHTML +='</tr>';
    }
}

function fillCellsWithData() {
    calendarData.forEach(event=>{
        let data = new CalendarEvent(event.Subject,new Date(event.Start.DateTime),new Date(event.End.DateTime),event.Location ? event.Location.DisplayName : '');
        let id = "cell"+data.start.getHours()+'-'+Number(data.start.getMonth()+1)+'/'+data.start.getDate();
        let cell = document.getElementById(id);
        console.log('filling cells with data: ',id,cell);
        if(cell) {
            if(data.subject) {
                cell.innerHTML="<div>"+data.subject+"</div>";
            } else {
                cell.innerHTML="<div>taken</div>";
            }
            cell.classList.add('taken');
        }
        
    })
}

function compareDates(x,y) {
    return x.getDate()==y.getDate() && x.getFullYear() == y.getFullYear() && x.getMonth() == y.getMonth();
}
/**
 * Changing date
 */

function dateChanged() {
    if(startingDate.value) {

        appendWeek(new Date(startingDate.value));
    }else {
        appendWeek(new Date());
    }
    resetCells();
    fillCellsWithData();
}


function cellClicked(startingTimeHour,month,day) {
    let cell = document.getElementById('cell'+startingTimeHour+'-'+month+'/'+day);
    console.log('Cell clicked: ',cell.id);
    cell.classList.toggle('reserved');
    let newCellObject = new cellObject(month,day,startingTimeHour);
    let newArray = reservedCells.filter(obj => !obj.equals(newCellObject));

    if(reservedCells.length == newArray.length) newArray.push(newCellObject);
    reservedCells = newArray;
}

function resetCells() {
    let cells = document.querySelectorAll('table td');
    cells.forEach(cell=>{cell.classList.remove('reserved');cell.classList.remove('taken');cell.innerHTML=''});
    reservedCells = new Array();
}

/**
 * Showing next 7 days
 */
function next() {
    let date = new Date(startingDate.value);
    date.setDate(date.getDate()+7);
    startingDate.value = getLocalDateFormat(date);
    console.log(startingDate.value)
    appendWeek(date);
    resetCells();
}

/**
 * Showing past 7 days
 */
function previous() {
    let date = new Date(startingDate.value);
    date.setDate(date.getDate()-7);
    startingDate.value = getLocalDateFormat(date);
    appendWeek(date);
    resetCells();
}

/**
 * Returning correct date format for HTML date input
 * @param {Object} date
 * @returns {Object}
 */
function getLocalDateFormat(date) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toJSON().slice(0,10);
}

/**
 * Sending request for meetings
 */
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

/**
 * @class Class representing a cell
 */
class cellObject {
 
    constructor(month,day,startingTime) {
        this.month = month;
        this.day = day;
        this.startingTime = startingTime;
    }

    /**
     * Checking whether objects are equal by date and startingTime parameters
     * @param {Object} obj
     * @returns {boolean}
     */
    equals(obj) {
        return this.month === obj.month && this.day == obj.day && this.startingTime === obj.startingTime;
    }
}

class CalendarEvent {
    constructor(subject,start,end,location) {
        this.subject = subject;
        this.end = end;
        this.start = start;
        this.location = location;
    }
}