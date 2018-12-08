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

function onOutlookLogin() {
    window.location.href = './outlookLogin';
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
    xhr.setRequestHeader('Accept','application/json');
    xhr.responseType = 'json';
    xhr.send(JSON.stringify({
        user: {
            email: emailInput.value,
            password: passwordInput.value
        }
    })); 
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if(!passwordConfirmInput) {
                /** 
                 * localStorage.getItem("user") returns string ex.:
                 * "{"id":2,
                 * "email":"antonio.kamber97@yahoo.com",
                 * "sessionToken":"82d643e83539c493a72ac6221fd7d783da5cb59a9dd5f43879989b2c4c3046af5d9455c2b9f8654e2bab9352be5c38bc1a8c4487e571ae9c3f3bc624c7b3c488"}"
                */
                localStorage.setItem("user",xhr.response.userData);
            }
            
            window.location.href = xhr.response.redirectUrl;
        }
      }

}
function register() {
    if(emailInput.value && passwordInput.value && passwordConfirmInput 
        && passwordConfirmInput.value === passwordInput.value
        && validateEmail(emailInput.value)) {
        submitButton.removeAttribute("disabled","");
    } 
}

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
            token: userData.sessionToken
        }
    })); 

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            localStorage.removeItem("user");
            console.log(xhr.response)
            window.location.href = xhr.response.redirectUrl;
        }
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