/**
 * Controller for managing user-specific operations.
 */
const logger = require('../utils/logger');
const User = require('../models/User.model');
const Quest = require('../models/Quest.model');
const audit = require('../services/audit.service');

const ALLOWED_AUDIT_ACTIONS = ['wallet.deposit', 'wallet.withdraw', 'game.play'];

/**
 * Shapes a DB user row into the wire format the frontend's `UserProfile`
 * type expects (`address`, camelCase telegram/timestamp fields).
 * `telegramLinked` is derived, not stored, so it can never drift from the
 * fields it's derived from.
 */
const serializeUser = (user) => ({
  address: user.wallet_address,
  username: user.username || undefined,
  telegramHandle: user.telegram_handle || undefined,
  telegramUserId: user.telegram_user_id || undefined,
  telegramLinked: Boolean(user.telegram_handle || user.telegram_user_id),
  createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
  updatedAt: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at,
  ageConfirmedAt:
    user.age_confirmed_at instanceof Date
      ? user.age_confirmed_at.toISOString()
      : user.age_confirmed_at || undefined,
});

const getAuditLogs = async (req, res, next) => {
  try {
    const { actor, action } = req.query;
    const limit = req.query.limit === undefined ? 50 : parseInt(req.query.limit, 10);

    if (req.query.limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
      const error = new Error('Query parameter "limit" must be a positive integer.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    if (action && !ALLOWED_AUDIT_ACTIONS.includes(action)) {
      const error = new Error('Query parameter "action" has an unsupported value.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const entries = await audit.list({ actor, action, limit });
    res.status(200).json({ items: entries });
  } catch (error) {
    next(error);
  }
};

/**
 * Looks up a profile by wallet address, scoped strictly to the address
 * given — never "whichever profile was most recently updated". A missing
 * profile is a normal 404, the standard signal that a wallet needs
 * onboarding, not an error.
 */
const getProfile = async (req, res, next) => {
  try {
    const address = req.query.address;
    if (!address || typeof address !== 'string') {
      const error = new Error('Query parameter "address" is required.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const user = await User.findByWallet(address);
    if (!user) {
      const error = new Error(`No profile found for wallet address ${address}.`);
      error.statusCode = 404;
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }

    // Fetching your own profile is the one signal every surface (web app,
    // Telegram bot) reliably sends once per visit — best-effort, must never
    // fail the actual profile fetch.
    Quest.recordDailyLogin(user.id).catch((err) => {
      logger.error('Failed to record daily-login quest progress:', err);
    });

    res.status(200).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress || req.body.address;
    if (!walletAddress) {
      const error = new Error('walletAddress is required.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    logger.info(`Creating profile for wallet: ${walletAddress}`);
    let user = await User.findByWallet(walletAddress);
    if (!user) {
      user = await User.create({
        wallet_address: walletAddress,
        username: req.body.username || 'player',
        age_confirmed_at: req.body.ageConfirmed ? new Date() : null,
      });
    } else if (req.body.ageConfirmed && !user.age_confirmed_at) {
      // Idempotent create hit a wallet that already has a profile (e.g. one
      // that predates the age gate) — record the confirmation on it instead
      // of silently dropping it, or this profile can never clear onboarding.
      user = await User.updateByWallet(walletAddress, { age_confirmed_at: new Date() });
    }

    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing profile — username and/or Telegram-link fields.
 * Only fields actually supplied are touched, so a Telegram-linking sync
 * that sends `telegramUserId` alone never clobbers the display name, and
 * vice versa.
 */
const updateProfile = async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress || req.body.address;
    if (!walletAddress) {
      const error = new Error('walletAddress is required.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    const user = await User.findByWallet(walletAddress);
    if (!user) {
      const error = new Error(`No profile found for wallet address ${walletAddress}.`);
      error.statusCode = 404;
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }

    const patch = {};
    if (req.body.username !== undefined) patch.username = req.body.username;
    if (req.body.telegramUserId !== undefined) patch.telegram_user_id = req.body.telegramUserId;
    if (req.body.telegramHandle !== undefined) patch.telegram_handle = req.body.telegramHandle;
    // Only ever set, never clear — an absent or false `ageConfirmed` here
    // must not erase a confirmation the player already gave.
    if (req.body.ageConfirmed && !user.age_confirmed_at) patch.age_confirmed_at = new Date();

    const updated =
      Object.keys(patch).length > 0 ? await User.updateByWallet(walletAddress, patch) : user;

    res.status(200).json(serializeUser(updated));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  getAuditLogs,
  serializeUser,
};
