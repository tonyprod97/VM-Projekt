/**
 * @file Ovdje se nalaze varijable i metode za ispravnu registraciju i prijavu korisnika
 */

let form;
let emailInput;
let passwordInput;
let submitButton;
let passwordConfirmInput;
let emailError;
let errorPassword;
let roleSelected;

window.onload =()=>{
    form = document.querySelector("form");
    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    submitButton = document.getElementById("submitButton");
    passwordConfirmInput = document.getElementById("passwordConfirm");
    emailError = document.getElementById("errorEmail");
    errorPassword = document.getElementById("errorPassword");
    roleSelected = document.getElementById("roleSelect");
    
    if(passwordInput) {
        passwordInput.onkeydown = e => {
            if(e.keyCode == 13) submitButton.click();
        };
    }

    if(passwordConfirmInput) {
        passwordConfirmInput.onkeydown = e => {
            if(e.keyCode == 13) submitButton.click();
        };
    }

};


/**
 * Provjera zeli li se user registrirati ili prijaviti
 */
function onFormChange() {
    // If passwordConfirmInput exists user is trying to register else to log in.
    if(passwordConfirmInput) { 
        register();
    } else {
        login();
    }
}

/**
 * Prijava na outlook
 */
function onOutlookLogin() {
    window.location.href = './outlookLogin';
}

/**
 * Provjera unesenih podataka za prijavu ili registraciju i obavljanje odredene akcije
 */
function onSubmit() {  
    let url;
    let email = emailInput.value;
    let password = passwordInput.value;
    let user = { user: {
        email: emailInput.value,
        password: passwordInput.value,
    }};

    let valid = checkMail(email);
    // If passwordConfirmInput exists user is trying to register else to log in.
    if (passwordConfirmInput) {
        let confirmPassword = passwordConfirmInput.value;

        if (valid) {
            valid = checkPasswordConf(password, confirmPassword);
        } else {
            checkPasswordConf(password, confirmPassword);
        }

        url = './register';
        user.user.role = roleSelected.value;
    } else {
        // Check if user logged in succesfully.
        if (valid) {
            valid = checkPassword(password);
        } else {
            checkPassword(password);
        }

        url = './login';
    }

    if (!valid) return;

    //send http POST
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept','application/json');
    xhr.responseType = 'json';
    
    xhr.send(JSON.stringify(user)); 
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if(!passwordConfirmInput) {
                /** 
                 * localStorage.getItem("user") returns string ex.:
                 * "{"id":2,
                 * "email":"antonio.kamber97@yahoo.com",
                 * "sessionToken":"82d643e83539c493a72ac6221fd7d783da5cb59a9dd5f43879989b2c4c3046af5d9455c2b9f8654e2bab9352be5c38bc1a8c4487e571ae9c3f3bc624c7b3c488"}"
                */
                localStorage.setItem("user", xhr.response.userData);
            }
            
            window.location.href = xhr.response.redirectUrl;
        }
      }

}

/**
 * Provjera ispravnosti e-mail adrese
 * @param {Object} email - adresa elektronicke poste korisnika
 * @returns {boolean}
 */

function checkMail(email) {
    if (validateEmail(email)) {
        emailError.innerHTML = "";
        return true;
    } else {
        emailError.innerHTML = "Please enter a valid e-mail address";
        return false;
    }
}

/**
 * Provjera ispravnosti potvrde lozinke
 * @param {Object} password - lozinka
 * @param {Object} confirmPassword - potvrda lozinke
 * @returns {boolean}
 */

function checkPasswordConf(password, confirmPassword) {
    if (!checkPassword(password)) {
        return false;
    } else if (password !== confirmPassword) {
        errorPassword.innerHTML = "Confirm password must match";
        return false;
    }

    return true;
}

/**
 * Provjera ispravnosti lozinke
 * @param {Object} password - lozinka
 * @returns {boolean}
 */

function checkPassword(password) {
    if (password.length < 6) {
        errorPassword.innerHTML = "Password must have at least 6 characters";
        return false;
    } else {
        errorPassword.innerHTML = "";
    }

    return true;
}

/**
 * Provjera polja i omogucavanje registracije
 */
function register() {
    if(emailInput.value && passwordInput.value && passwordConfirmInput 
        && passwordConfirmInput.value === passwordInput.value
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
    } 
}

/**
 * Odjava
 */
function logout() {
    let userData = JSON.parse(localStorage.getItem("user"));
    console.log('XXX',userData.sessionToken)
    //send http POST
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/user/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept','application/json');
    xhr.responseType = 'json';
    xhr.send(JSON.stringify({
        user: {
            id: userData.id,
            sessionToken: userData.sessionToken
        }
    })); 

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            localStorage.removeItem("user");
            localStorage.removeItem("calendarData");
            console.log(xhr.response);
            window.location.href = xhr.response.redirectUrl;
        }
      }
}
/**
 * Provjera polja i omogucavanje prijave 
 */
function login() {
    if(emailInput.value && passwordInput.value 
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
    } 
}
/**
 * Provjera ispravnosti e-mail formata
 * @param {Object} email - adresa elektronicke poste korisnika
 * @returns {boolean}
 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}