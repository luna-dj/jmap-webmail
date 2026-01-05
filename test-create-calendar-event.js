/**
 * Test script to create a calendar event on JMAP server
 */

const serverUrl = process.env.JMAP_SERVER_URL || 'https://hivepost.nl';
const username = process.env.JMAP_USERNAME || 'user@example.com';
const password = process.env.JMAP_PASSWORD || 'your-password';

async function createCalendarEvent() {
  try {
    console.log('Creating a test calendar event...');
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
    const calendarAccountId = session.primaryAccounts?.['urn:ietf:params:jmap:calendars'];
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    console.log(`   ✓ Session obtained (Account ID: ${calendarAccountId})`);
    console.log('');

    // Step 2: Get calendars first
    console.log('2. Fetching calendars...');
    const apiUrl = session.apiUrl;
    
    const calendarRequest = {
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:calendars'],
      methodCalls: [
        ['Calendar/get', {
          accountId: calendarAccountId,
        }, '0']
      ]
    };

    const calendarResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarRequest),
    });

    const calendarResult = await calendarResponse.json();
    const calendarMethodResponse = calendarResult.methodResponses?.[0];
    
    let defaultCalendarId;
    if (calendarMethodResponse && !calendarMethodResponse[0].endsWith('/error')) {
      const calendars = calendarMethodResponse[1].list || [];
      console.log(`   ✓ Found ${calendars.length} calendar(s)`);
      
      if (calendars.length === 0) {
        console.log('   Creating default calendar...');
        // Create a default calendar
        const createCalendarRequest = {
          using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:calendars'],
          methodCalls: [
            ['Calendar/set', {
              accountId: calendarAccountId,
              create: {
                'calendar-default': {
                  name: 'Default',
                  isDefault: true
                }
              }
            }, '0']
          ]
        };

        const createCalResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createCalendarRequest),
        });

        const createCalResult = await createCalResponse.json();
        const createCalMethodResponse = createCalResult.methodResponses?.[0];
        if (createCalMethodResponse && !createCalMethodResponse[0].endsWith('/error')) {
          const created = createCalMethodResponse[1].created;
          if (created && Object.keys(created).length > 0) {
            defaultCalendarId = Object.values(created)[0].id;
            console.log(`   ✓ Created calendar with ID: ${defaultCalendarId}`);
          }
        }
      } else {
        // Use the first calendar or default
        const defaultCalendar = calendars.find((cal) => cal.isDefault) || calendars[0];
        defaultCalendarId = defaultCalendar.id;
        console.log(`   Using calendar: ${defaultCalendarId} (${defaultCalendar.name || 'Unnamed'})`);
      }
    } else {
      throw new Error('Failed to fetch calendars');
    }
    console.log('');

    // Step 3: Create calendar event using JSCalendar format (RFC 8984)
    console.log('3. Creating calendar event using CalendarEvent/set...');
    
    const eventId = `event-${Date.now()}`;
    
    // JSCalendar format for Stalwart
    // RFC 8984: JSCalendar - A JSON Representation of Calendar Data
    // calendarIds should be an object/map: { "calendarId": true }, similar to addressBookIds
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0); // 2 PM today
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0); // 3 PM today
    
    const jmapEvent = {
      '@type': 'Event',
      uid: `test-event-${Date.now()}@example.com`,
      title: 'Test Calendar Event',
      description: 'This is a test event created via JMAP API',
      start: startTime.toISOString(),
      duration: 'PT1H', // 1 hour
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendarIds: {
        [defaultCalendarId]: true  // Object format: { "calendarId": true }
      },
      showWithoutTime: false,
      status: 'confirmed'
    };

    const jmapRequest = {
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:calendars'],
      methodCalls: [
        ['CalendarEvent/set', {
          accountId: calendarAccountId,
          create: {
            [eventId]: jmapEvent
          }
        }, '0']
      ]
    };

    console.log(`   Request URL: ${apiUrl}`);
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Calendar ID: ${defaultCalendarId}`);
    console.log(`   Event Data:`, JSON.stringify(jmapEvent, null, 2));
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
      throw new Error(`Failed to create event: ${response.status}`);
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
    if (responseMethod === 'error' || responseMethod.endsWith('/error')) {
      console.error('❌ Error response:', JSON.stringify(responseData, null, 2));
      throw new Error(`Server error: ${responseData.type || 'unknown'} - ${responseData.description || JSON.stringify(responseData)}`);
    }

    if (responseData.notCreated && Object.keys(responseData.notCreated).length > 0) {
      console.error('❌ Event creation failed:', JSON.stringify(responseData.notCreated, null, 2));
      throw new Error('Event creation failed');
    }

    if (responseData.created && Object.keys(responseData.created).length > 0) {
      const createdEvent = responseData.created[eventId];
      console.log('✅ Event created successfully!');
      console.log(`   Server Event ID: ${createdEvent.id}`);
      console.log('');
      console.log('=== FULL RESPONSE ===\n');
      console.log(JSON.stringify(responseData, null, 2));
      
      return createdEvent.id;
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Run the test
createCalendarEvent()
  .then((eventId) => {
    console.log(`\n✅ Successfully created event with ID: ${eventId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create event:', error.message);
    process.exit(1);
  });
