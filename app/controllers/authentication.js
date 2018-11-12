let form;
let emailInput;
let passwordInput;
let submitButton;
let passwordConfirmInput;

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

function onSubmit() {
    // If passwordConfirmInput exists user is trying to register else to log in.
    if(passwordConfirmInput) {
        // Check if user registered succesfully.
        if(true) {
            window.location.href="/";
        } else {
            // Add validation messages.
        }
    } else {
        // Check if user logged in succesfully.
        if(true) {
            window.location.href="/";
        } else {
            // Add validation messages.
        }
    }
}

function register() {
    if(emailInput.value && passwordInput.value && passwordConfirmInput 
        && passwordConfirmInput.value === passwordInput.value
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
        // Conncect with backend.
    } 
}

function login() {
    if(emailInput.value && passwordInput.value 
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
        // Conncect with backend.
    } 
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}