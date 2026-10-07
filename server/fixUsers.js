const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/price_tracker').then(async () => {
  // Reset kalai.techx@gmail.com password to 'kalai123'
  const newPassword = 'kalai123';
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'kalai.techx@gmail.com' },
    { $set: { password: hashed, isVerified: true } }
  );

  console.log('✅ Password reset for kalai.techx@gmail.com');
  console.log('   New password: kalai123');
  console.log('   Modified:', result.modifiedCount);

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
