/**
 * Test script to fetch calendars from JMAP server
 */

const serverUrl = process.env.JMAP_SERVER_URL || 'https://hivepost.nl';
const username = process.env.JMAP_USERNAME || 'user@example.com';
const password = process.env.JMAP_PASSWORD || 'your-password';

async function fetchCalendars() {
  try {
    console.log('Fetching calendars from JMAP server...');
    console.log(`Server: ${serverUrl}`);
    console.log(`Username: ${username}`);
    console.log('');

    // Step 1: Get session
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    const sessionUrl = `${serverUrl}/.well-known/jmap`;
    
    console.log('1. Getting session...');
    const sessionResponse = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to get session: ${sessionResponse.status}`);
    }

    const session = await sessionResponse.json();
    console.log(`   ✓ Session obtained`);
    console.log('');

    // Step 2: Get calendar account ID
    const calendarAccountId = session.primaryAccounts?.['urn:ietf:params:jmap:calendars'];
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    console.log(`2. Calendar Account ID: ${calendarAccountId}`);
    console.log('');

    // Step 3: Fetch calendars
    console.log('3. Fetching calendars using Calendar/get...');
    const apiUrl = session.apiUrl;
    
    const jmapRequest = {
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:calendars'],
      methodCalls: [
        ['Calendar/get', {
          accountId: calendarAccountId,
        }, '0']
      ]
    };

    console.log(`   Request URL: ${apiUrl}`);
    console.log('');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jmapRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch calendars: ${response.status}`);
    }

    const result = await response.json();
    console.log(`   ✓ Response received`);
    console.log('');

    // Step 4: Parse response
    const methodResponse = result.methodResponses?.[0];
    if (!methodResponse) {
      throw new Error('No method response in result');
    }

    const [responseMethod, responseData, callId] = methodResponse;

    console.log('=== RESPONSE ===\n');
    console.log(`Method: ${responseMethod}`);
    console.log(`Call ID: ${callId}`);
    console.log('');

    // Check for errors
    if (responseMethod.endsWith('/error')) {
      console.error('❌ Error response:', JSON.stringify(responseData, null, 2));
      throw new Error(`Server error: ${responseData.type} - ${responseData.description || ''}`);
    }

    // Process calendars
    const calendars = responseData.list || [];
    console.log(`=== CALENDARS ===\n`);
    console.log(`Total calendars: ${calendars.length}\n`);

    if (calendars.length === 0) {
      console.log('No calendars found.');
      return calendars;
    }

    // Display calendars
    calendars.forEach((calendar, index) => {
      console.log(`Calendar ${index + 1}:`);
      console.log(`  ID: ${calendar.id}`);
      console.log(`  Name: ${calendar.name || 'N/A'}`);
      console.log(`  Description: ${calendar.description || 'N/A'}`);
      console.log(`  Color: ${calendar.color || 'N/A'}`);
      console.log(`  Is Default: ${calendar.isDefault || false}`);
      console.log(`  Sort Order: ${calendar.sortOrder || 0}`);
      console.log('');
    });

    console.log('\n=== FULL CALENDARS JSON ===\n');
    console.log(JSON.stringify(calendars, null, 2));

    return calendars;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Run the test
fetchCalendars()
  .then((calendars) => {
    console.log(`\n✅ Successfully fetched ${calendars.length} calendar(s)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fetch calendars:', error.message);
    process.exit(1);
  });
