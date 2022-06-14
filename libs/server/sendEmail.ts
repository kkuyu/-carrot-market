import nodemailer from "nodemailer";

interface SendEmailData {
  emailTo: string;
  emailSubject: string;
  emailContent: string;
}

const sendEmail = ({ emailTo, emailSubject, emailContent }: SendEmailData) => {
  const emailTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_ID,
    to: emailTo,
    subject: emailSubject,
    html: emailContent,
  };

  emailTransport.sendMail(mailOptions, (error, responses) => {
    if (error) {
      console.log(error);
    } else {
      console.log(responses);
    }
  });

  emailTransport.close();
};

export default sendEmail;
