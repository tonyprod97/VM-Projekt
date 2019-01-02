let headerRow;
let tableBody;
let startingDate;
let reservedCells = new Array();
let calendarData;
let currentDate;

window.onload = ()=>{
    var dataElement= document.querySelector("#calendarData");
    
    calendarData = JSON.parse(dataElement.innerText);
    dataElement.parentNode.removeChild(dataElement);
    //localStorage.setItem("calendarData",JSON.stringify(data));

    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.querySelector('#date-picker');
    startingDate.value = getLocalDateFormat(new Date());
    //calendarData = JSON.parse(window.localStorage.getItem("calendarData"));
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
            let tempYear = tempDate.getFullYear();
            let dateString = tempYear + '/'+tempMonth+"/"+tempDay;
            
            row +='<td id="cell'+i+'-'+dateString+'" onclick="cellClicked('+i+','+tempYear+','+tempMonth+','+tempDay+')"></td>';
        }
        tableBody.innerHTML +=row;
        tableBody.innerHTML +='</tr>';
    }
}

function fillCellsWithData() {
    calendarData.forEach(event=>{
        let data = new CalendarEvent(event.Subject,new Date(event.Start.DateTime),new Date(event.End.DateTime),event.Location ? event.Location.DisplayName : '');
        let id = "cell"+data.start.getHours()+'-'+data.start.getFullYear()+'/'+Number(data.start.getMonth()+1)+'/'+data.start.getDate();
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


function cellClicked(startingTimeHour,year,month,day) {
    let cell = document.getElementById('cell'+startingTimeHour+'-'+year+'/'+month+'/'+day);
    console.log('Cell clicked: ',cell.id);
    if(!cell.classList.contains('taken')) {
        cell.classList.toggle('reserved');

        let newCellObject = new CellObject(year,month,day,startingTimeHour);
        let newArray = reservedCells.filter(obj => !obj.equals(newCellObject));

        if(reservedCells.length == newArray.length) newArray.push(newCellObject);
        reservedCells = newArray;
    }
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

    reservedCells.forEach(o=>{
        let cell = document.getElementById('cell'+o.startingTime+'-'+o.year+'/'+o.month+'/'+o.day);
        cell.classList.toggle('reserved');  
    })
    let dataToSend = reservedCells.slice();
    reservedCells = new Array();
    console.log(dataToSend)

    let subjectElement = document.querySelector("#subject");
    let subject = subjectElement.value;
    subjectElement.value='';

    //send http POST
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/calendar/week', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept','application/json');
    xhr.responseType = 'json';
    xhr.send(JSON.stringify({
        subject: subject,
        requestedMeetings: dataToSend
    })); 
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log('Success')
        }
      }

}

/**
 * @class Class representing a cell
 */
class CellObject {
 
    constructor(year,month,day,startingTime) {
        this.year = year;
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
        return this.year===obj.year && this.month === obj.month && this.day === obj.day && this.startingTime === obj.startingTime;
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