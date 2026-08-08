import logger from '../config/logger.js';
import { getAllUsers } from '../services/users.service.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching users');

    const allUsers = await getAllUsers();
        
    return res.status(200).json({
      message: 'Successfully fetched all users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return next(error);
  }
};
