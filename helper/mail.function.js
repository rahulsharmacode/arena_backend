const nodemailer =  require("nodemailer");
const { default: hbs } = require("nodemailer-express-handlebars");
const path = require("path")

const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: Number(process.env.SMPT_PORT||587),
  auth: {
      user: process.env.SMPT_EMAIL,
      pass: process.env.SMPT_PASS
  }
});

transporter.use('compile', hbs({
  viewEngine : {
    extname : '.handlebars',
    partialsDir: path.join(__dirname, '..', 'utils', 'emails'),
    defaultLayout : false,
  },
  viewPath: path.join(__dirname, '..', 'utils', 'emails'),
  extName : '.handlebars',
}));

async function sendTemplateEmail({data,subject,template="invoice"}) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Arena" <test9812334@gmail.com>', // sender address
    to: data.email,
    subject: subject,
    template: template,
    context : data
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}


module.exports = {
    sendTemplateEmail
}