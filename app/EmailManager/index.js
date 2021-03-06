var nodemailer = require('nodemailer');

const verificationText = 'To verify your account please click on the link: ';

//var transporter = nodemailer.createTransport({
//    service: 'gmail',
//    auth: {
//        user: 'projectvm00@gmail.com',
//        pass: 'vmproject123'
//    },
//    tls: {
//        rejectUnauthorized: false
//    }
//});

var transporter = nodemailer.createTransport({
    //service: 'gmail',
    host: "smtp.gmail.com",
    domains: ["gmail.com", "googlemail.com"],
    port: 587,
    auth: {
        user: 'projectvm00@gmail.com',
        pass: 'vmproject123'
    },
    tls: {
        rejectUnauthorized: false
    }
});

var mailVerificationOptions = {
    from: 'projectvm00@gmail.com',
    to: '',
    subject: 'Please veryfiy your e-mail adress for VMProject app!',
    text: 'To verify your account please click on the link: '
};

var confirmMeetingOptions = {
    from: 'projectvm00@gmail.com',
    to: '',
    subject: 'You have a request for a meeting in ProjectVM app.',
    text:'Please confirm the following meeting: ',
    html: ''
};

module.exports = {

    sendVerificationMail: function(subjectMail, confirm_url) {
        mailVerificationOptions.to = subjectMail;
        mailVerificationOptions.text = verificationText + confirm_url;

        transporter.sendMail(mailVerificationOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    },

    sendMailForMeetingConfirmation: function (subjectMail, htmlForm) {
        confirmMeetingOptions.to=subjectMail;
        confirmMeetingOptions.html=htmlForm

        transporter.sendMail(confirmMeetingOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

    }
};
