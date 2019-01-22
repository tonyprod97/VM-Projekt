/**
 * Vracanje ispravnog formata datuma za HTML input datuma
 * @param {Object} date
 * @returns {Object}
 */
function getLocalDateFormat(date) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toJSON().slice(0,10);
}

/**
 * Slanje zahtjeva za sastancima
 */
function sendRequestForMeetings() {
    
    let dataToSend = reservedCells.slice();
    cleanCellsReservation();
    console.log('data to send: ',dataToSend);

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
            openPopup();
            cleanCellsReservation();
            console.log('Success')
        }
      }

}

/**
 * Postavljanje dosptupnosti termina
 */

function sendMarkAsAvailable() {

    let dataToSend = reservedCells.slice();
    console.log('data to send: ',dataToSend);
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
            openPopup();
            cleanCellsReservation();
            console.log('Success');
            document.location.reload();
        }
      }
}

/**
 * Uklanja slobodne termine
 */
function deleteAvailable() {
    var http = new XMLHttpRequest();
    http.open("POST", '/calendar/week?operation=deleteAvailable', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Accept', 'application/json');
    http.responseType = 'json';
    http.send(JSON.stringify({
        user: user
    }));
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            openPopup();
            console.log('Success');
            //resetCells();
            appendWeek(currentDate);
        }
    }
}

/**
 * Dohvat podataka kalendara
 */
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
        if (http.readyState === 4 && http.status == 200 && http.response) {
            calendarData = JSON.parse(http.response.calendarData);
            fillCellsWithData();
        } else {
            if(http.readyState === 4 && http.status == 200) appendWeek(currentDate);
        }
      }
}