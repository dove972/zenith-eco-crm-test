import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "ssl0.ovh.net",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const FROM_ADDRESS = `"${process.env.SMTP_FROM_NAME || "ZENITH ECO"}" <${process.env.SMTP_FROM_EMAIL || "crm@zenitheco.fr"}>`;

export default transporter;
