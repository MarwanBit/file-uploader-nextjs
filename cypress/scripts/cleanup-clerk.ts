// In cypress/scripts/cleanup-clerk.ts
const { clerkClient } = require('@clerk/nextjs/server');

async function cleanup() {
  try {
    console.log('🔍 Looking for users to delete...');
    console.log('🔧 Environment check:');
    console.log('- CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
    console.log('- CLERK_SECRET_KEY starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...');
    
    const client = await clerkClient({
      secretKey: process.env.CLERK_SECRET_KEY
    });
    const { data: users } = await client.users.getUserList();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.emailAddresses[0]?.emailAddress || user.id}`);
    });
    
    // Delete ALL users
    for (const user of users) {
      try {
        await client.users.deleteUser(user.id);
        console.log(`✅ Deleted: ${user.emailAddresses[0]?.emailAddress || user.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete user ${user.id}:`, error.message);
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

cleanup();