import mongoose from 'mongoose';
import envVariables from '../src/app/config/env.js';

async function checkAuditLogs() {
  try {
    await mongoose.connect(envVariables.DATABASE_URL);
    console.log('Connected to database');
    
    const count = await mongoose.connection.collection('auditlogs').countDocuments();
    console.log('Total audit logs:', count);
    
    const logs = await mongoose.connection.collection('auditlogs').find().limit(5).toArray();
    console.log('First 5 logs:', JSON.stringify(logs, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAuditLogs();
