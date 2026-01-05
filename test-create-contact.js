/**
 * Test script to create a contact on JMAP server
 */

const serverUrl = process.env.JMAP_SERVER_URL || 'https://hivepost.nl';
const username = process.env.JMAP_USERNAME || 'user@example.com';
const password = process.env.JMAP_PASSWORD || 'your-password';

async function createContact() {
  try {
    console.log('Creating a test contact...');
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
    const contactAccountId = session.primaryAccounts?.['urn:ietf:params:jmap:contacts'];
    if (!contactAccountId) {
      throw new Error('No contact account found');
    }

    console.log(`   ✓ Session obtained (Account ID: ${contactAccountId})`);
    console.log('');

    // Step 2: Get address books first
    console.log('2. Fetching address books...');
    const apiUrl = session.apiUrl;
    
    const addressBookRequest = {
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:contacts'],
      methodCalls: [
        ['AddressBook/get', {
          accountId: contactAccountId,
        }, '0']
      ]
    };

    const addressBookResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressBookRequest),
    });

    const addressBookResult = await addressBookResponse.json();
    const addressBookMethodResponse = addressBookResult.methodResponses?.[0];
    
    if (addressBookMethodResponse && !addressBookMethodResponse[0].endsWith('/error')) {
      const addressBooks = addressBookMethodResponse[1].list || [];
      console.log(`   ✓ Found ${addressBooks.length} address book(s)`);
      
      if (addressBooks.length === 0) {
        console.log('   Creating default address book...');
        // Create a default address book
        const createAddressBookRequest = {
          using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:contacts'],
          methodCalls: [
            ['AddressBook/set', {
              accountId: contactAccountId,
              create: {
                'addressbook-default': {
                  name: 'Default'
                }
              }
            }, '0']
          ]
        };

        const createABResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createAddressBookRequest),
        });

        const createABResult = await createABResponse.json();
        const createABMethodResponse = createABResult.methodResponses?.[0];
        if (createABMethodResponse && !createABMethodResponse[0].endsWith('/error')) {
          const created = createABMethodResponse[1].created;
          if (created && Object.keys(created).length > 0) {
            const addressBookId = Object.values(created)[0].id;
            console.log(`   ✓ Created address book with ID: ${addressBookId}`);
            var defaultAddressBookId = addressBookId;
          }
        }
      } else {
        // Use the first address book
        var defaultAddressBookId = addressBooks[0].id;
        console.log(`   Using address book: ${defaultAddressBookId}`);
      }
    } else {
      throw new Error('Failed to fetch address books');
    }
    console.log('');

    // Step 3: Create contact using JSContact format (RFC 9610)
    console.log('3. Creating contact using ContactCard/set...');
    
    const contactId = `contact-${Date.now()}`;
    
    // JSContact format for Stalwart
    // According to RFC 9610, addressBookIds is Id[Boolean] - an object/map, not an array!
    // Keys are AddressBook IDs, values must be true
    const jmapContact = {
      name: 'Test Contact',
      addressBookIds: {
        [defaultAddressBookId]: true  // Object format: { "addressBookId": true }
      },
      emails: {
        'email-0': {
          address: 'test@example.com',
          contexts: ['personal']
        }
      },
      phones: {
        'phone-0': {
          number: '+1234567890',
          features: ['voice'],
          contexts: ['mobile']
        }
      },
      organizations: [{
        name: 'Test Company'
      }],
      titles: [{
        name: 'Software Developer'
      }],
      notes: 'This is a test contact created via JMAP API'
    };

    const jmapRequest = {
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:contacts'],
      methodCalls: [
        ['ContactCard/set', {
          accountId: contactAccountId,
          create: {
            [contactId]: jmapContact
          }
        }, '0']
      ]
    };

    console.log(`   Request URL: ${apiUrl}`);
    console.log(`   Contact ID: ${contactId}`);
    console.log(`   Contact Data:`, JSON.stringify(jmapContact, null, 2));
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
      throw new Error(`Failed to create contact: ${response.status}`);
    }

    const result = await response.json();
    console.log(`   ✓ Response received`);
    console.log('');

    // Step 3: Parse response
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

    if (responseData.notCreated && Object.keys(responseData.notCreated).length > 0) {
      console.error('❌ Contact creation failed:', JSON.stringify(responseData.notCreated, null, 2));
      throw new Error('Contact creation failed');
    }

    if (responseData.created && Object.keys(responseData.created).length > 0) {
      const createdContact = responseData.created[contactId];
      console.log('✅ Contact created successfully!');
      console.log(`   Server Contact ID: ${createdContact.id}`);
      console.log('');
      console.log('=== FULL RESPONSE ===\n');
      console.log(JSON.stringify(responseData, null, 2));
      
      return createdContact.id;
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
createContact()
  .then((contactId) => {
    console.log(`\n✅ Successfully created contact with ID: ${contactId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create contact:', error.message);
    process.exit(1);
  });
