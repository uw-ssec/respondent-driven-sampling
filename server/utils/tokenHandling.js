const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const tokenSecret = process.env.TOKEN_SECRET;

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
function authenticateToken (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, tokenSecret, async (err, decodedToken) => {
    if (err) {
        console.log(err);
        return res.sendStatus(403);
    }
    req.decodedToken = decodedToken;

    // Checking if the user's account is approved
    const user = await User.findOne({ email: decodedToken.employeeId });
    if (!user) {
      // This case means that the user has a valid JWT signed by our server but
      // the account it is linked to does not exist in our database.
      return res
        .status(400)
        .json({ message: "Account not found. Please contact your admin."});
    }
    if (user.approvalStatus !== "Approved") {
      return res
        .status(403)
        .json({ message: "Account not approved yet. Please contact your admin." });
    }
    next();
  })
}

// Creates the JSON Web Token to be used by the client, a client having a valid JWT
// means that they should be atleast a volunteer in role and must have been approved
// by an admin.
function createToken(firstName, role, employeeId) {
    return jwt.sign({
        firstName:  firstName,
        role:       role,
        employeeId: employeeId,
    }, tokenSecret, { expiresIn: '1h' });
}

module.exports = {
    authenticateToken,
    createToken
}