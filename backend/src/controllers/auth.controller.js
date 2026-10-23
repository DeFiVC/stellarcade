/**
 * Controller for wallet-signature login.
 */
const User = require('../models/User.model');
const { authService } = require('../services/auth.service');
const { serializeUser } = require('./users.controller');

const postChallenge = async (req, res, next) => {
  try {
    const address = req.body.address;
    if (!address || typeof address !== 'string') {
      const error = new Error('address is required.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    const challenge = authService.createChallenge(address);
    res.status(200).json({ challenge });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies the wallet's signature over its own challenge, auto-provisions
 * a profile on first login (same "seamless login" behavior the old
 * JWT-derived getProfile used to have), and issues a token.
 */
const postLogin = async (req, res, next) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      const error = new Error('address and signature are required.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    authService.verifySignature(address, signature);

    let user = await User.findByWallet(address);
    if (!user) {
      user = await User.create({ wallet_address: address, username: 'player' });
    }

    const token = authService.issueToken(user);

    res.status(200).json({ token, profile: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postChallenge,
  postLogin,
};
