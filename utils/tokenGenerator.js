const crypto = require('crypto');

function generateToken() {
  return 'WRK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  
}

module.exports = generateToken;