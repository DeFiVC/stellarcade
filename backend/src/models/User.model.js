/**
 * Base model for Users.
 *
 * Provides an interface for user-related database operations.
 */
const db = require('../config/database');
const logger = require('../utils/logger');

const User = {
  
  async findByWallet(address) {
    try {
      return await db('users').where({ wallet_address: address }).first();
    } catch (error) {
      logger.error('Error in User.findByWallet:', error);
      throw error;
    }
  },

  /**
   * Create a new user profile.
   * @param {object} userData
   */
  async create(userData) {
    try {
      const users = await db('users').insert(userData).returning('*');
      return users[0];
    } catch (error) {
      logger.error('Error in User.create:', error);
      throw error;
    }
  },

  /**
   * Get the current balance of a user.
   * @param {number} userId
   */
  async getBalance(userId) {
    try {
      const user = await db('users').where({ id: userId }).select('balance').first();
      return user ? user.balance : 0;
    } catch (error) {
      logger.error('Error in User.getBalance:', error);
      throw error;
    }
  },

  /**
   * Update fields on an existing user, found by wallet address.
   * @param {string} address
   * @param {object} patch
   * @returns {Promise<object|null>}
   */
  async updateByWallet(address, patch) {
    try {
      const rows = await db('users')
        .where({ wallet_address: address })
        .update({ ...patch, updated_at: db.fn.now() })
        .returning('*');
      return rows[0] || null;
    } catch (error) {
      logger.error('Error in User.updateByWallet:', error);
      throw error;
    }
  },
};

module.exports = User;
