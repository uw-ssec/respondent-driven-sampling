const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const tokenSecret = process.env.TOKEN_SECRET;

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, tokenSecret, (err, decodedToken) => {
    if (err) {
        console.log(err)
        return res.sendStatus(403)
    }
    req.decodedToken = decodedToken
    next()
  })
}

// Creates the JSON Web Token to be used by the client, a client having a valid JWT
// means that they should be atleast a volunteer in role and must have been approved
// by an admin.
function createToken(firstName, role, employeeId) {
    return jwt.sign({
        firstName:  newUser.firstName,
        role:       newUser.role,
        employeeId: newUser.employeeId,
    }, tokenSecret, { expiresIn: '1h' });
}

module.exports = {
    authenticateToken,
    createToken
}