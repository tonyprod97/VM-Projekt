/**
 * @file Ovdje se nalaze varijable i metode za upravljanje celijama kalendara
 */

let headerRow;
let tableBody;
let teacherElement;
let startingDate;
let reservedCells = new Array();
let calendarData;
let currentDate;
let daysOfWeek = ["Sunday","Monday", "Tuesday", "Wednesday", 
"Thursday", "Friday", "Saturday"];
let monday;
let selectingMode;

window.addEventListener('load',initializeData);

/**
 * Inicijalizacija elemenata kalendara
 */
function initializeData() {   
    
    teacherElement = document.querySelector('#teacherElement');
    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.querySelector('#date-picker');
    startingDate.value = getLocalDateFormat(new Date());
    startingDate.addEventListener('change',dateChanged);
    fetchCalendarData();
    currentDate = new Date();
    setMonday();
    appendWeek(new Date());
    document.addEventListener('dragstart',()=>{
        dragStart(event);
    })
};



/**
 * Stvaranje stupaca po danima
 * @param {Object} date - trenutni datum
*/
function appendWeek(date) {
    if(date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear()) {
        if(date.getDay() != 1 && date.getTime()>currentDate.getTime()) return; // If not monday neglect the change of date if trying to increase the date.
        if(date.getTime()<currentDate.getTime() && date.getDay() == 0) {
            //Set date to previous monday.
            date.setDate(date.getDate()-6);
        }
    } else {
        currentDate = date;
        setMonday();
    }
    headerRow.innerHTML = '';
    
    currentDate = date;

    let thElement = document.createElement('th');
    thElement.innerHTML = 'YEAR' + currentDate.getFullYear();
    thElement.className +=' col-auto';
    headerRow.appendChild(thElement);
    setMonday();
    
    //append dates of week
    for(let i = 0;i<7;i++) {
        let tempDate =new Date(monday);
        tempDate.setDate(monday.getDate()+i);

        let tempDay = tempDate.getDate();
        let tempMonth = tempDate.getMonth()+1;
        let thElement = document.createElement('th');
        thElement.className +='col-auto';

        thElement.innerText += tempMonth+'/'+tempDay;
        thElement.innerText += ' - '+ daysOfWeek[tempDate.getDay()];

        headerRow.appendChild(thElement);
    }
    tableBody.innerHTML = '';
    appendHours();
}

function dragStart(ev) {
    console.log('ev:', ev);
    selectingMode = false;
    if(ev.target.classList.contains('quarter-time')) ev.target.classList.add('selecting');
}
/**
 * Stvaranje redaka po satima
 */
function appendHours() {
    //teacherElement is displayed only when requesting, role is 0 if student is logged
    let roleClass = !role ? 'student': 'teacher';

    //displaying personal calendar for student
    let viewClass;
    let availableClass;
    let clickableClass;

    console.log('role:', role)
    viewClass = teacherElement ? 'teacher-view' : 'personal-view';
    if(!role) {
        //student is logged
        if(teacherElement) clickableClass = 'clickable';
    } else {
        //teacher is logged
        clickableClass = 'clickable';
    } 
    console.log('clickableClass:', clickableClass)

    let disabledCell = !teacherElement && !role ? 'disabled': '';
    let freeCell = teacherElement && !role ? 'free' : '';
    
    for(let i=8;i<20;i++) {
        let trElement = document.createElement('tr');
        trElement.id = 'row'+i;
        tableBody.appendChild(trElement);

        let timeSufix = i>9 ? i+':00' : '0'+i +':00';
        timeSufix +='-';
        timeSufix += i+1>9 ? (i+1)+':00' : '0'+(i+1)+':00';
        let tdTimeElement = document.createElement('td');
        tdTimeElement.innerText =  timeSufix;
        tdTimeElement.className += 'time-column';
        trElement.appendChild(tdTimeElement);

        for(let j=0;j<7;j++) {
            let tempDate = new Date(monday);
            tempDate.setDate(tempDate.getDate()+j);
            let tempDay = tempDate.getDate();
            let tempMonth = tempDate.getMonth()+1;
            let tempYear = tempDate.getFullYear();
            let dateString = tempYear + '/'+tempMonth+"/"+tempDay;
            
            let tdElement = document.createElement('td');
            //id exp. 8-2019/1/25 -> format: startingTime - year/month/dayOfMonth
            tdElement.id = i+'-'+dateString;
            tdElement.classList.add('available',roleClass,viewClass);
            if(clickableClass) tdElement.classList.add(clickableClass);

            for(let k = 0; k < 4; k++) {
                let div = document.createElement('div');
                div.setAttribute('draggable',false);
                

                div.addEventListener('mousedown',function(){
                    mouseDown(event);
                });
                div.addEventListener('mouseup',function(){
                    mouseUp(event);
                });
                div.addEventListener('mouseover',function(){
                    mouseOver(event);
                });
                div.addEventListener('click',function() {
                    let minutes = k === 0 ? '00':k*15;
                    cellClicked(event,i+':'+minutes,tempYear,tempMonth,tempDay)
                });
               
                
                div.classList = tdElement.classList;

                let minutes = k*15;
                if(minutes === 0) minutes = '00';
                div.id = i+':'+minutes+'-'+dateString;
                div.classList.add('quarter-time','noselect');
                div.innerText = '+';
                tdElement.appendChild(div);
            } 

            /*tdElement.addEventListener('click',function() {
                cellClicked(i+':00',tempYear,tempMonth,tempDay)
            });*/

            trElement.appendChild(tdElement);
        }
        
        tableBody.appendChild(trElement);
    }
}

/**
 * Dodavanje podataka celijama
 */
function fillCellsWithData() {
    if(calendarData === undefined) return;
    if(calendarData.length === 0) return;
    appendWeek(currentDate);
    //resetCells();
    
    calendarData.forEach(event=>{
        let data = new CalendarEvent(event.Subject,new Date(event.Start.DateTime),new Date(event.End.DateTime),event.Location ? event.Location.DisplayName : '');
        let minutes = data.start.getMinutes() === 0 ? '00' : data.start.getMinutes();
        let id = data.start.getHours()+':'+minutes+'-'+data.start.getFullYear()+'/'+Number(data.start.getMonth()+1)+'/'+data.start.getDate();
        let startEvent = data.start.getHours();
        let endHour = data.end.getHours();
        let endMinutes = data.end.getMinutes();

        let cell = document.getElementById(id);
        
        if(cell) cell.innerHTML = '';
        let div = document.createElement('div');
        
        if(cell) {
            let cellTime = id.split('-')[0].split(':');
            if(data.subject) {
                div.innerHTML +=data.subject;
            } else {
                div.innerHTML +="taken";
            }
            cell.appendChild(div);
            /*console.log('endHour:', endHour)
            console.log('cellTime[0]+1:', +cellTime[0]+1)
            if(+endHour == +cellTime[0]+1) {
                while(cell.nextSibling) {
                    cell = cell.nextSibling;
                    cell.appendChild(div);
                }
                cell.style.height = cell.parentElement.offsetHeight;
                cell.style.width = cell.parentElement.offsetWidth;
                
                cell.style.display = 'table';
                cell.children[0].setAttribute('style','display:table-cell;vertical-align:middle');
            }*/
            
            cell.classList.add('busy');
            if(!role) cell.classList.add('clickable');
            cell.classList.remove('available');
        }
    })
}

/**
 * Rezervacija termina klikom na celiju
 * @param {Object} startingTimeHour - izabrano pocetno vrijeme 
 * @param {Object} year - izabrana godina
 * @param {Object} month - izabran mjesec
 * @param {Object} day - izabran dan
 */

function cellClicked(ev,startingTimeHour,year,month,day) {
    let cell = document.getElementById(startingTimeHour+'-'+year+'/'+month+'/'+day);
    if(!cell) {
        cell = ev.target.parentElement;
    }
    console.log('cell:', cell)
    if(!cell.classList.contains('clickable')) return;
    if(!cell.classList.contains('busy') && !role) return;
    
    cell.classList.toggle('marked');
    cell.classList.toggle('reserved');

    console.log('startingTimeHour:', startingTimeHour)
    let newCellObject = new CellObject(year,month,day,startingTimeHour);
    let newArray = reservedCells.filter(obj => !obj.equals(newCellObject));

    if(reservedCells.length == newArray.length) newArray.push(newCellObject);
    reservedCells = newArray;
    console.log('reservedCells:', reservedCells)

}
/**
 * Usporedba dva datuma
 * @param {Object} x - prvi datum
 * @param {Object} y - drugi datum
 * @returns {boolean}
 */
function compareDates(x,y) {
    return x.getDate()==y.getDate() && x.getFullYear() == y.getFullYear() && x.getMonth() == y.getMonth();
}

function setMonday() {
    let current = new Date(currentDate);
    let subtract = current.getDay();
    monday = new Date(currentDate);
    monday.setDate(monday.getDate()-subtract+1);
}

/**
 * Izmjena datuma kalendara
 */
function dateChanged() {
    if(startingDate.value) {
        appendWeek(new Date(startingDate.value));
    }else {
        appendWeek(new Date());
    }
    fillCellsWithData();
}

/**
 * Brisanje zauzetosti izabranih celija
 */
function resetCells() {
    let cells = document.querySelectorAll('td');
    cells.forEach(cell=>{
        if(cell.classList.contains('time-column')) return;
        cell.classList.remove('marked','busy');
        if(!role) cell.classList.remove('clickable');
        cell.classList.add('available');
        cell.innerHTML=''
    });
    reservedCells = new Array();
}

/**
 * Prikaz sljedecih 7 dana 
 */
function next() {
    //let date = new Date(startingDate.value);
    setMonday();
    let date = new Date(currentDate);
    date.setDate(monday.getDate()+7);
    startingDate.value = getLocalDateFormat(date);
    currentDate = new Date(date);
    resetCells();
    appendWeek(date);
    fillCellsWithData();
}

/**
 * Prikaz prethodnih 7 dana
 */
function previous() {
    setMonday();
    let date = new Date(currentDate);
    date.setDate(monday.getDate()-7);
    startingDate.value = getLocalDateFormat(date);
    currentDate = new Date(date);
    resetCells();
    appendWeek(date);
    fillCellsWithData();
}

/**
 * Uklanjanje rezerviranih termina
 */

function cleanCellsReservation() {
    reservedCells.forEach(o=>{
        let cell = document.getElementById(o.startingTime+'-'+o.year+'/'+o.month+'/'+o.day);
        cell.classList.toggle('marked');  
    });
    reservedCells = new Array();
}

function mouseUp(ev) {
    if(!role) return; 
    //push selected cells to array
    let selectedCells = document.querySelectorAll('div.selecting');
    console.log('selectedCells:', selectedCells)

    selectedCells.forEach(cell => {
        //id exp. 8:00-2019/1/23
        let date = cell.id.split('-')[1].split('/');
        let newCellObject = new CellObject(date[0],date[1],date[2],cell.id.split('-')[0]);
        let existingCell = reservedCells.find(c => {
            console.log('newCellObject.equals(c):', newCellObject.equals(c))
            return newCellObject.equals(c);
        });
        console.log('existingCell:', existingCell)
        if(existingCell) {
            reservedCells = reservedCells.filter(c => newCellObject.equals(c));
        } else {
            reservedCells.push(newCellObject);
        }
        
    });
    console.log('reservedCells:', reservedCells)
    selectingMode = false;
  }
  
  function mouseDown(ev) {
    let target = ev.target;
    if(!target.classList.contains('clickable')) return;
    if(!target.classList.contains('busy') && !role) return;
    target.classList.toggle('selecting');
    selectingMode = true;
  }
  
  function mouseOver(ev) {
    if(selectingMode) {
        ev.target.classList.toggle('selecting');
    }
  }

/**
 * @class Klasa koja predstavlja celiju
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

function openPopup() {
    var popup = document.getElementById("sendPopup");
    popup.classList.toggle("show");
    setTimeout(()=>{
        popup.classList.toggle("show");
    },3000);
}

/**
 * @class Klasa koja predstavlja dogadaj u kalendaru
 */

class CalendarEvent {
    constructor(subject,start,end,location) {
        this.subject = subject;
        this.end = end;
        this.start = start;
        this.location = location;
    }
}