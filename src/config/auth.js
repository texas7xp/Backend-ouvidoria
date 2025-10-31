import 'dotenv/config';

export default {
  jwtSecret: process.env.JWT_SECRET || 'fallbacksecret',
  jwtExpiresIn: '1h',
};