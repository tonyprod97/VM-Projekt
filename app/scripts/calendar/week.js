let headerRow;
let tableBody;
let startingDate;
let cellIsTaken = false;

window.onload = ()=>{
    headerRow = document.getElementById('header');
    tableBody = document.getElementsByTagName('tbody')[0];
    startingDate = document.getElementById('startingDate');
    appendWeek(new Date());
    appendHours();
};

function appendWeek(date) {
    headerRow.innerHTML = "";
    currentDate = date;
    headerRow.innerHTML += '<th> time: </th>';

    for(let i = 0;i<7;i++) {
        let currentDay = currentDate.getDate();
        currentMonth = currentDate.getMonth()+1;

        headerRow.innerHTML += '<th>'+currentDay+'.'+currentMonth+'.'+ '</th>';
        currentDate.setDate(currentDate.getDate()+1);
    }
}

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
    console.log(startingDate.value);
    appendWeek(new Date(startingDate.value));
}

function cellClicked(startingTimeHour,dateIndex) {
    let cell = document.getElementById('cell'+startingTimeHour+'-'+dateIndex);
    let classToAdd = cellIsTaken ? 'free' : 'taken';
    cell.classList.add(classToAdd);
    cellIsTaken = !cellIsTaken;
    console.log(cell.classList.value)
    console.log(startingTimeHour,dateIndex);
}