const crypto = require("crypto");

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};


const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};
module.exports = {
  generateOTP,
  hashOtp
};
