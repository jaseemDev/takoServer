import nodemailer from "nodemailer";

export const sendEmail = async (toEmail, message) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f380f74e4b2d29",
      pass: "4fd8bea958aeb6",
    },
  });
  const mailOptions = {
    from: "noreply@tako.io",
    to: toEmail,
    subject: "Password Reset",
    text: message,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
