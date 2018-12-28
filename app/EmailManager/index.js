var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'projectvm00@gmail.com',
        pass: 'vmproject123'
    }
});

var mailVerificationOptions = {
    from: 'projectvm00@gmail.com',
    to: '',
    subject: 'Please veryfiy your e-mail adress for VMProject app!',
    text: 'To verify your account please click on the link: '
};

module.exports = {

    sendVerificationMail: function(subjectMail, confirm_url) {
        mailVerificationOptions.to=subjectMail;
        mailVerificationOptions.text=mailVerificationOptions.text+confirm_url;

        transporter.sendMail(mailVerificationOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
};
