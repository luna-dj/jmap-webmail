/**
 * Test script to fetch contacts from JMAP server
 */

const serverUrl = process.env.JMAP_SERVER_URL || 'https://hivepost.nl';
const username = process.env.JMAP_USERNAME || 'user@example.com';
const password = process.env.JMAP_PASSWORD || 'your-password';

async function fetchContacts() {
  try {
    console.log('Fetching contacts from JMAP server...');
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
    console.log(`   ✓ Session obtained (Account ID: ${Object.keys(session.accounts)[0]})`);
    console.log('');

    // Step 2: Get contact account ID
    const contactAccountId = session.primaryAccounts?.['urn:ietf:params:jmap:contacts'];
    if (!contactAccountId) {
      throw new Error('No contact account found');
    }

    console.log(`2. Contact Account ID: ${contactAccountId}`);
    console.log('');

    // Step 3: Check which contact standard is supported
    const hasContacts = session.capabilities?.['urn:ietf:params:jmap:contacts'] !== undefined;
    const hasAddressBook = session.capabilities?.['urn:ietf:params:jmap:addressbook'] !== undefined;
    
    let methodName;
    let capability;
    
    if (hasContacts) {
      methodName = 'ContactCard/get';
      capability = 'urn:ietf:params:jmap:contacts';
      console.log('3. Using RFC 9610 (JMAP for Contacts) - ContactCard/get');
    } else if (hasAddressBook) {
      methodName = 'AddressBook/get';
      capability = 'urn:ietf:params:jmap:addressbook';
      console.log('3. Using RFC 8621 (AddressBook) - AddressBook/get');
    } else {
      throw new Error('No contact capability found');
    }
    console.log('');

    // Step 4: Fetch contacts
    console.log('4. Fetching contacts...');
    const apiUrl = session.apiUrl;
    
    const jmapRequest = {
      using: ['urn:ietf:params:jmap:core', capability],
      methodCalls: [
        [methodName, {
          accountId: contactAccountId,
        }, '0']
      ]
    };

    console.log(`   Request URL: ${apiUrl}`);
    console.log(`   Method: ${methodName}`);
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
      throw new Error(`Failed to fetch contacts: ${response.status}`);
    }

    const result = await response.json();
    console.log(`   ✓ Response received`);
    console.log('');

    // Step 5: Parse response
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
      
      // Try fallback methods
      if (methodName === 'ContactCard/get') {
        console.log('\nTrying fallback: Contact/get...');
        const fallbackRequest = {
          using: ['urn:ietf:params:jmap:core', capability],
          methodCalls: [
            ['Contact/get', {
              accountId: contactAccountId,
            }, '0']
          ]
        };

        const fallbackResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackRequest),
        });

        const fallbackResult = await fallbackResponse.json();
        const fallbackMethodResponse = fallbackResult.methodResponses?.[0];
        if (fallbackMethodResponse && !fallbackMethodResponse[0].endsWith('/error')) {
          console.log('✓ Fallback method worked!');
          return processContacts(fallbackMethodResponse[1]);
        }
      }
      
      throw new Error(`Server error: ${responseData.type} - ${responseData.description || ''}`);
    }

    // Process contacts
    return processContacts(responseData);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

function processContacts(responseData) {
  console.log('=== CONTACTS ===\n');

  const contacts = responseData.list || [];
  console.log(`Total contacts: ${contacts.length}\n`);

  if (contacts.length === 0) {
    console.log('No contacts found.');
    return contacts;
  }

  // Display first contact structure
  console.log('Sample contact structure:');
  console.log(JSON.stringify(contacts[0], null, 2));
  console.log('');

  // Display all contacts summary
  contacts.forEach((contact, index) => {
    console.log(`Contact ${index + 1}:`);
    console.log(`  ID: ${contact.id}`);
    
    // Handle JSContact format (RFC 9610)
    if (contact.name || contact.fullName || contact.nameComponents) {
      if (contact.nameComponents) {
        const name = [
          contact.nameComponents.given,
          contact.nameComponents.family
        ].filter(Boolean).join(' ');
        console.log(`  Name: ${name || 'N/A'}`);
        console.log(`  First Name: ${contact.nameComponents.given || 'N/A'}`);
        console.log(`  Last Name: ${contact.nameComponents.family || 'N/A'}`);
      } else {
        console.log(`  Name: ${contact.name || contact.fullName || 'N/A'}`);
      }
    } else {
      // Handle AddressBook format (RFC 8621)
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.name || 'N/A';
      console.log(`  Name: ${name}`);
      console.log(`  First Name: ${contact.firstName || 'N/A'}`);
      console.log(`  Last Name: ${contact.lastName || 'N/A'}`);
    }

    // Handle emails (JSContact uses object/map)
    if (contact.emails) {
      if (typeof contact.emails === 'object' && !Array.isArray(contact.emails)) {
        const emailList = Object.values(contact.emails).map((e) => e.address || e);
        console.log(`  Emails: ${emailList.join(', ') || 'N/A'}`);
      } else {
        console.log(`  Emails: ${Array.isArray(contact.emails) ? contact.emails.join(', ') : contact.emails || 'N/A'}`);
      }
    } else if (contact.email) {
      console.log(`  Email: ${contact.email}`);
    }

    // Handle phones (JSContact uses object/map)
    if (contact.phones) {
      if (typeof contact.phones === 'object' && !Array.isArray(contact.phones)) {
        const phoneList = Object.values(contact.phones).map((p) => p.number || p);
        console.log(`  Phones: ${phoneList.join(', ') || 'N/A'}`);
      } else {
        console.log(`  Phones: ${Array.isArray(contact.phones) ? contact.phones.join(', ') : contact.phones || 'N/A'}`);
      }
    } else if (contact.phone) {
      console.log(`  Phone: ${contact.phone}`);
    }

    if (contact.company) {
      console.log(`  Company: ${contact.company}`);
    }
    if (contact.jobTitle) {
      console.log(`  Job Title: ${contact.jobTitle}`);
    }
    console.log('');
  });

  console.log('\n=== FULL CONTACTS JSON ===\n');
  console.log(JSON.stringify(contacts, null, 2));

  return contacts;
}

// Run the test
fetchContacts()
  .then((contacts) => {
    console.log(`\n✅ Successfully fetched ${contacts.length} contact(s)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fetch contacts:', error.message);
    process.exit(1);
  });
