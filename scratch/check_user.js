import mongoose from 'mongoose';
import envVariables from '../src/app/config/env.js';
import User from '../src/app/modules/user/user.model.js';

async function checkUser() {
  try {
    await mongoose.connect(envVariables.DATABASE_URL);
    console.log('Connected to database');

    const user = await User.findOne({ email: 'admin@test.com' });
    console.log('User found:', JSON.stringify(user, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUser();
