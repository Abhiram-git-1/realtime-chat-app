const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({to, subject, text, html}) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationOTP = async (email, otp) => {
  await sendEmail({
    to: email,

    subject: "Verify your Realtime Chat account",

    text: `Your email verification OTP is ${otp}. This OTP expires in 10 minutes.`,

    html: `
      <div>
        <h2>Verify your email</h2>

        <p>
          Welcome to Realtime Chat.
        </p>

        <p>
          Your verification code is:
        </p>

        <h1>${otp}</h1>

        <p>
          This OTP expires in 10 minutes.
        </p>

        <p>
          If you did not create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
};

const sendPasswordResetOTP = async (email, otp) => {
  await sendEmail({
    to: email,

    subject: "Reset your Realtime Chat password",

    text: `Your password reset OTP is ${otp}. This OTP expires in 10 minutes.`,

    html: `
      <div>
        <h2>Password Reset</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Your password reset code is:
        </p>

        <h1>${otp}</h1>

        <p>
          This OTP expires in 10 minutes.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP,
};