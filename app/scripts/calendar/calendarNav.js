var studentsOnlyElements;
var teachersOnlyElements;

var user =  JSON.parse(localStorage.getItem('user'));
var role = user.isStudent ? 0:1; // if student 0, if teacher 1

window.addEventListener("load",hrefChanged,false);
window.addEventListener("load",getRole);

function getRole() {
    studentsOnlyElements = document.querySelectorAll('.students-only');
    teachersOnlyElements = document.querySelectorAll('.teachers-only');
    if(studentsOnlyElements && role) {
        studentsOnlyElements.forEach(el => el.style.display = "none");
    }

    if(teachersOnlyElements && !role) {
        teachersOnlyElements.forEach(el => el.style.display = "none");
    }
}

/**
 * Promjena puta
 * @param {Object} ref
 */
function routeChanged(ref) {
    console.log(ref);
    ref.classList.toggle('active');
}

/**
 * Promjena href reference
 */
function hrefChanged() {
    let urlName = window.location.href.split('/');
    urlName = urlName[urlName.length-1];
    let activeTab = document.querySelector("#tabsNav");
    let children = activeTab.querySelectorAll("a");

    children.forEach(el => {
        let state = el.name == urlName;
        if(state) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    })
}