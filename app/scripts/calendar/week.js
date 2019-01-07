let headerRow;
let tableBody;
let teacherElement;
let startingDate;
let reservedCells = new Array();
let calendarData;
let currentDate;
let daysOfWeek = ["Sunday","Monday", "Tuesday", "Wednesday", 
"Thursday", "Friday", "Saturday"];

window.addEventListener('load',initializeData);

function initializeData() {   
    
    teacherElement = document.querySelector('#teacherElement');
    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.querySelector('#date-picker');
    startingDate.value = getLocalDateFormat(new Date());
    startingDate.addEventListener('change',dateChanged);
    appendWeek(new Date());
    fetchCalendarData();
};

function fetchCalendarData() {
    let url = '/outlook/calendarData';
    
    if(teacherElement) {
        url += '?teacher='+teacherElement.innerText; 
    } 
    //send http POST
    var http = new XMLHttpRequest();
    http.open("POST", url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Accept','application/json');
    http.responseType = 'json';
    
    http.send(JSON.stringify({user:user})); 

    http.onreadystatechange = function() {
        if (http.readyState === 4 && http.status == 200) {
            calendarData = JSON.parse(http.response.calendarData);
            fillCellsWithData();
        }
      }
}

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
    
        headerRow.innerHTML += '<th>'+tempMonth+'/'+tempDay+ '<br>'+ daysOfWeek[tempDate.getDay()]+'</th>';
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
    //teacherElement is displayed only when requesting, role is 0 if student is logged
    let disabledCell = !teacherElement && !role ? 'disabled': '';

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
            
            row +='<td id="cell'+i+'-'+dateString+'" class="'+disabledCell+'" onclick="cellClicked('+i+','+tempYear+','+tempMonth+','+tempDay+')"></td>';
        }
        tableBody.innerHTML +=row;
        tableBody.innerHTML +='</tr>';
    }
}

function fillCellsWithData() {
    if(calendarData === undefined) return;
    calendarData.forEach(event=>{
        let data = new CalendarEvent(event.Subject,new Date(event.Start.DateTime),new Date(event.End.DateTime),event.Location ? event.Location.DisplayName : '');
        let id = "cell"+data.start.getHours()+'-'+data.start.getFullYear()+'/'+Number(data.start.getMonth()+1)+'/'+data.start.getDate();
        let cell = document.getElementById(id);
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
    if(!cell.classList.contains('taken') && !cell.classList.contains('disabled')) {
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
    fillCellsWithData();
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
    fillCellsWithData();
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
    
    let dataToSend = reservedCells.slice();
    cleanCellsReservation();

    let subjectElement = document.querySelector("#subject");
    let subject = subjectElement.value;
    subjectElement.value='';

    //send http POST
    var http = new XMLHttpRequest();
    http.open("POST", '/calendar/week?operation=requestMeeting', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Accept','application/json');
    http.responseType = 'json';
    http.send(JSON.stringify({
        user: user,
        teacher: teacherElement.innerText,
        subject: subject,
        requestedMeetings: dataToSend
    })); 
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            console.log('Success')
        }
      }

}

function sendMarkAsAvailable() {

    let dataToSend = reservedCells.slice();
    cleanCellsReservation();

    //send http POST
    var http = new XMLHttpRequest();
    http.open("POST", '/calendar/week?operation=markAsAvailable', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Accept','application/json');
    http.responseType = 'json';
    http.send(JSON.stringify({
        user: user,
        available: dataToSend
    })); 
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            console.log('Success')
        }
      }
}

function cleanCellsReservation() {
    reservedCells.forEach(o=>{
        let cell = document.getElementById('cell'+o.startingTime+'-'+o.year+'/'+o.month+'/'+o.day);
        cell.classList.toggle('reserved');  
    });
    reservedCells = new Array();
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