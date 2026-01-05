# jmap-js Integration

This document describes the integration of the [jmap-js](https://github.com/jmapio/jmap-js) library into the project.

## What Was Done

1. **Added jmap-js as a git submodule**
   - Location: `lib/jmap-js/`
   - Built library available at: `public/lib/jmap-js/JMAP.js`

2. **Added Overture library as a git submodule**
   - Location: `lib/overture/`
   - Built library available at: `public/lib/overture/O.js`
   - Overture is required by jmap-js for its data model and store functionality

3. **Created TypeScript integration layer**
   - `lib/jmap/jmap-js-integration.ts` - Loads and initializes Overture and jmap-js
   - `lib/jmap/jmap-js-wrapper.ts` - Wrapper class to use jmap-js with existing JMAPClient

4. **Integrated with existing client**
   - Updated `JMAPClient.getContacts()` to optionally use jmap-js
   - Falls back to native implementation if jmap-js is not available

## Current Status

The integration is **partially complete**. The libraries are built and the integration code is in place, but there are some challenges:

### Authentication Model Mismatch

- **jmap-js** expects: Access token-based authentication
- **Current implementation** uses: Basic Auth (username/password)

The jmap-js `Connection` class needs to be adapted to work with Basic Auth headers instead of access tokens.

### Next Steps

1. **Adapt Connection class for Basic Auth**
   - Modify jmap-js Connection to use Basic Auth headers
   - Or create a custom Connection adapter

2. **Test the integration**
   - Verify contacts can be fetched using jmap-js
   - Test create/update/delete operations

3. **Extend to other features**
   - Mail operations
   - Calendar operations
   - Real-time updates via jmap-js store

## Usage

To use jmap-js in your code:

```typescript
import { JMAPJSWrapper } from '@/lib/jmap/jmap-js-wrapper';

// Get wrapper from client
const wrapper = await client.getJMAPJSWrapper();
if (wrapper) {
  const contacts = await wrapper.getContacts();
  // Use jmap-js contacts...
}
```

## Files Added

- `lib/jmap-js/` - jmap-js submodule
- `lib/overture/` - Overture submodule  
- `lib/jmap/jmap-js-integration.ts` - Integration utilities
- `lib/jmap/jmap-js-wrapper.ts` - Wrapper class
- `public/lib/jmap-js/JMAP.js` - Built jmap-js library
- `public/lib/overture/O.js` - Built Overture library

## References

- [jmap-js GitHub](https://github.com/jmapio/jmap-js)
- [Overture GitHub](https://github.com/fastmail/overture)
- [JMAP Specification](https://jmap.io)
