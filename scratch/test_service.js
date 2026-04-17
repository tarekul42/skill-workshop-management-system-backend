import mongoose from 'mongoose';
import envVariables from '../src/app/config/env.js';
import AuditService from '../src/app/modules/audit/audit.service.js';
// Register models
import '../src/app/modules/user/user.model.js';
import '../src/app/modules/workshop/workshop.model.js';
import '../src/app/modules/enrollment/enrollment.model.js';
import '../src/app/modules/payment/payment.model.js';
import '../src/app/modules/category/category.model.js';

async function testAuditService() {
  try {
    await mongoose.connect(envVariables.DATABASE_URL);
    console.log('Connected to database');
    
    const result = await AuditService.getAuditLogs({});
    console.log('Result count:', result.data.length);
    console.log('Meta total:', result.meta.total);
    
    if (result.data.length > 0) {
      console.log('First log:', JSON.stringify(result.data[0], null, 2));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

testAuditService();
