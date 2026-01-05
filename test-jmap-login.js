/**
 * Test script to login to JMAP server and check capabilities
 */

const serverUrl = process.env.JMAP_SERVER_URL || 'https://hivepost.nl';
const username = process.env.JMAP_USERNAME || 'user@example.com';
const password = process.env.JMAP_PASSWORD || 'your-password';

async function testJMAPLogin() {
  try {
    console.log('Testing JMAP login...');
    console.log(`Server: ${serverUrl}`);
    console.log(`Username: ${username}`);
    console.log('');

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    // Get session
    const sessionUrl = `${serverUrl}/.well-known/jmap`;
    console.log(`Fetching session from: ${sessionUrl}`);

    const response = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to get session: ${response.status}`);
    }

    const session = await response.json();

    console.log('\n=== SESSION DATA ===\n');
    console.log('API URL:', session.apiUrl);
    console.log('Download URL:', session.downloadUrl);
    console.log('Upload URL:', session.uploadUrl || 'Not provided');
    console.log('Event Source URL:', session.eventSourceUrl || 'Not provided');
    console.log('Username:', session.username || 'Not provided');
    console.log('State:', session.state || 'Not provided');
    console.log('');

    // Display capabilities
    console.log('=== CAPABILITIES ===\n');
    if (session.capabilities) {
      const capabilityNames = Object.keys(session.capabilities);
      console.log(`Total capabilities: ${capabilityNames.length}\n`);
      
      capabilityNames.forEach(capability => {
        const details = session.capabilities[capability];
        console.log(`- ${capability}`);
        if (details && typeof details === 'object' && Object.keys(details).length > 0) {
          console.log(`  Details:`, JSON.stringify(details, null, 2));
        }
        console.log('');
      });
    } else {
      console.log('No capabilities found');
    }

    // Display accounts
    console.log('=== ACCOUNTS ===\n');
    if (session.accounts) {
      Object.keys(session.accounts).forEach(accountId => {
        const account = session.accounts[accountId];
        console.log(`Account ID: ${accountId}`);
        console.log(`  Name: ${account.name || 'N/A'}`);
        console.log(`  Is Personal: ${account.isPersonal || false}`);
        console.log(`  Is Read Only: ${account.isReadOnly || false}`);
        
        if (account.accountCapabilities) {
          console.log(`  Account Capabilities: ${Object.keys(account.accountCapabilities).join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('No accounts found');
    }

    // Display primary accounts
    console.log('=== PRIMARY ACCOUNTS ===\n');
    if (session.primaryAccounts) {
      Object.keys(session.primaryAccounts).forEach(capability => {
        console.log(`${capability}: ${session.primaryAccounts[capability]}`);
      });
    } else {
      console.log('No primary accounts found');
    }

    console.log('\n=== FULL SESSION JSON ===\n');
    console.log(JSON.stringify(session, null, 2));

    return session;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Run the test
testJMAPLogin()
  .then(() => {
    console.log('\n✅ Login test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Login test failed:', error);
    process.exit(1);
  });
