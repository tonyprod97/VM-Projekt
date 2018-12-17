window.addEventListener("load",hrefChanged,false);


/**
 * ...
 * @param {Object} ref
 */
function routeChanged(ref) {
    console.log(ref);
    ref.classList.toggle('active');
}

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