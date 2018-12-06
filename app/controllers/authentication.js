
let form;
let emailInput;
let passwordInput;
let submitButton;
let passwordConfirmInput;

const authHelper = require('../OutlookManager/outlookHelper');

window.onload =()=>{
    form = document.querySelector("form");
    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    submitButton = document.getElementById("submitButton");
    passwordConfirmInput = document.getElementById("passwordConfirm");
};

function onFormChange() {
    // If passwordConfirmInput exists user is trying to register else to log in.
    if(passwordConfirmInput) { 
        register();
    } else {
        login();
    }
}

function onOutlookLogin() {
    
}

function onSubmit() {  
    let url;
    // If passwordConfirmInput exists user is trying to register else to log in.
    if(passwordConfirmInput) {
        // Check if user registered succesfully.
        url = './register';
    } else {
        // Check if user logged in succesfully.
        url = './login';
    }
    
    //send http POST
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        user: {
            email: emailInput.value,
            password: passwordInput.value
        }
    })); 
    window.location.href="/";
}

function register() {
    if(emailInput.value && passwordInput.value && passwordConfirmInput 
        && passwordConfirmInput.value === passwordInput.value
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
    } 
}

function login() {
    if(emailInput.value && passwordInput.value 
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
    } 
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}