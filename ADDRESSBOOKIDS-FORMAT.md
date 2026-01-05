# addressBookIds Format Investigation

## Problem

When creating contacts via JMAP RFC 9610 (JMAP for Contacts), the server was rejecting contacts with the error:
- "Invalid patch operation for addressBookIds"
- "Contact has to belong to at least one address book"

## Solution

After investigating RFC 9610 and testing with the Stalwart server, the correct format was discovered.

### Correct Format

According to **RFC 9610 Section 2.1**:

> `addressBookIds*: Id[Boolean]`
> 
> The set of AddressBook ids that this ContactCard belongs to. A card MUST belong to at least one AddressBook at all times (until it is destroyed). The set is represented as an object, with each key being an AddressBook id. The value for each key in the object MUST be true.

### Implementation

**❌ WRONG** (Array format):
```json
{
  "addressBookIds": ["b"]
}
```

**✅ CORRECT** (Object/Map format):
```json
{
  "addressBookIds": {
    "b": true
  }
}
```

### Code Changes

1. **Added `getOrCreateDefaultAddressBook()` method** in `JMAPClient`:
   - Fetches existing address books
   - Uses default address book if available
   - Creates a new default address book if none exists

2. **Updated `createContact()` method**:
   - Calls `getOrCreateDefaultAddressBook()` before creating contact
   - Sets `addressBookIds` in the correct object format: `{ [addressBookId]: true }`

3. **Updated `mapContactToJMAPContact()` method**:
   - Added comment explaining addressBookIds format
   - Note: addressBookIds is set in `createContact()`, not in the mapping function

### Test Results

✅ Contact creation now works successfully:
```json
{
  "name": "Test Contact",
  "addressBookIds": {
    "b": true
  },
  "emails": {
    "email-0": {
      "address": "test@example.com",
      "contexts": ["personal"]
    }
  }
}
```

### Key Takeaways

1. **addressBookIds is NOT an array** - it's an object/map
2. **Values must be `true`** - not just any boolean, specifically `true`
3. **Contacts MUST belong to at least one address book** - cannot be created without one
4. **Address books can be fetched** using `AddressBook/get` method
5. **Default address book** should be used when available (`isDefault: true`)

### References

- RFC 9610: JMAP for Contacts - https://www.rfc-editor.org/rfc/rfc9610.html
- Section 2.1: ContactCard Data Type
- Stalwart Mail Server implementation
