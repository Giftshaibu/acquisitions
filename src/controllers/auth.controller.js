import logger from '../config/logger.js';
import { signupSchema } from '../validation/auth.validation.js';
import { formatValidationError } from '../utils/format.js';
import { createUser } from '../services/auth.service.js';
import { jwttoken } from '../utils/jwt.js';
import { cookies } from '../utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: formatValidationError(validationResult.error)});
    }
    const { name, email, role } = validationResult.data;
    
    const user = await createUser({ name, email, password: validationResult.data.password, role });

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    cookies.set(res, 'token', token);

    logger.info(`User registred successfully: ${email}`);
    return res.status(201).json({ 
      message: 'User registered successfully', 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    logger.error('Signup error', error);

    if(error.message === 'user with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};
