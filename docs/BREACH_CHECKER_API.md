# 🔍 Breach Checker API Integration

## Overview

The Breach Checker now uses the **LeakOSINT API** to search through 15+ billion breach records in real-time.

## API Details

- **Endpoint**: `https://leakosintapi.com/`
- **Method**: POST
- **Authentication**: Token-based
- **Rate Limit**: Check `free_requests_left` in response

## Features Implemented

### ✅ Real API Integration
- Connects to LeakOSINT database
- Searches by email, phone, or name
- Returns actual breach data

### ✅ Dynamic Data Display
- Automatically categorizes fields (email, phone, sensitive, etc.)
- Color-coded by sensitivity:
  - 🔴 Red: Passwords, credit cards, SSN (masked)
  - 🟡 Amber: Email, phone numbers
  - 🟢 Green: General information
- Formats field names automatically

### ✅ Complete Response Handling
- Loading states with animations
- Error handling for API failures
- Empty state when no data found
- Statistics display (databases, records, search time)

### ✅ Terminal CLI Styling
- Maintains consistent aesthetic
- ASCII-style progress bars
- Status badges and indicators
- Color-coded severity levels

## API Response Structure

```json
{
  "NumOfDatabase": 2,
  "NumOfResults": 5,
  "search time": 0.234,
  "free_requests_left": 95,
  "List": {
    "DatabaseName1": {
      "NumOfResults": 3,
      "InfoLeak": "Optional description of the leak",
      "Data": [
        {
          "Email": "user@example.com",
          "Password": "encrypted",
          "Name": "John Doe",
          "Phone": "1234567890",
          ...
        }
      ]
    },
    "DatabaseName2": { ... }
  }
}
```

## Usage

### In Breach Checker Page

1. Enter email, phone, or name in search box
2. Click "CHECK FOR BREACHES" or press Enter
3. Wait for API response (1-3 seconds)
4. View results with all exposed data

### Programmatic Usage

```javascript
import { searchBreaches } from '../utils/breachApi';

// Search for breaches
const results = await searchBreaches('email@example.com');

// Check results
if (results.NumOfResults > 0) {
  console.log(`Found in ${results.NumOfDatabase} databases`);
  console.log(results.List);
}
```

## Field Categories

The system automatically categorizes fields:

- **Email**: Email addresses
- **Phone**: Phone numbers (Phone, Phone2, Phone3)
- **Address**: Location data (City, State, Country, etc.)
- **Sensitive**: Passwords, cards, SSN (automatically masked)
- **Personal**: Names, usernames, ages, DOB

## Security Features

### 🔒 Data Privacy
- No data is stored locally
- All searches are encrypted
- API credentials in secure config

### 🎭 Sensitive Data Masking
- Passwords shown as `●●●●●●●●`
- Credit cards masked
- SSN/passport numbers hidden

### 📊 Transparency
- Shows remaining API requests
- Displays search time
- Clear error messages

## Display Features

### Statistics Header
- Number of databases found
- Total records discovered
- Search time
- Remaining API requests

### Database Cards
- Database name with lock icon
- Leak description (if available)
- Number of records per database
- Color-coded severity

### Data Records
- Organized by record number
- Grouped fields with labels
- Masked sensitive information
- Copy-friendly formatting

### Action Items
- Clear numbered recommendations
- New search button
- Print report option

## Error Handling

### Connection Errors
- Network failures
- Timeout issues
- Invalid API responses

### API Errors
- Invalid token
- Rate limit exceeded
- Malformed requests

### Display
- Red error cards
- Clear error messages
- Retry functionality

## Testing

### Test Queries
```javascript
// Email search
"test@example.com"

// Phone search
"918375016669"

// Name search
"John Doe"
```

### Expected Behavior
1. Loading animation appears
2. API request sent
3. Results display or "No data found"
4. Statistics shown
5. Data organized by database

## Configuration

### Change API Credentials
Edit `src/utils/breachApi.js`:

```javascript
const API_URL = "https://leakosintapi.com/";
const API_TOKEN = "your-token-here";
```

### Adjust Result Limit
```javascript
const results = await searchBreaches(query, 200); // Default: 100
```

### Customize Field Categories
Edit `fieldTypes` in `breachApi.js` to add/modify categories.

## Performance

- **Average Search Time**: 1-3 seconds
- **Results Displayed**: Up to 100 records
- **API Response Size**: Varies by results (typically 10-500KB)

## Future Enhancements

- [ ] Export results to CSV/PDF
- [ ] Email alerts for new breaches
- [ ] Historical breach timeline
- [ ] Breach severity scoring
- [ ] Automated account security recommendations
- [ ] Integration with password managers

## Notes

- API has rate limits (check `free_requests_left`)
- Some databases may have incomplete data
- Sensitive fields are always masked in display
- All timestamps are in UTC

---

**Status**: ✅ Fully Functional

The Breach Checker is now production-ready with real API integration!
