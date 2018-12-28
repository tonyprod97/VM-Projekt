
window.onload=()=>{
    var dataElement= document.querySelector("#calendarData");
    
    let data = JSON.parse(dataElement.innerText);
    dataElement.parentNode.removeChild(dataElement);
    localStorage.setItem("calendarData",JSON.stringify(data));
}

