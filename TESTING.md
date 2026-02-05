# 🧪 Testing the Breach Checker

## Quick Test Guide

### 1. Start the Application

```powershell
npm run dev
```

Open browser to: **http://localhost:3000**

### 2. Navigate to Breach Checker

Click **"BREACH CHECK"** in the navigation menu.

### 3. Test Search

Enter this test query from [test.js](test.js):
```
918375016669
```

Click **"CHECK FOR BREACHES"** or press Enter.

### 4. Verify Results

You should see:
- ✅ Loading animation with progress bars
- ✅ Statistics (databases, records, search time, requests left)
- ✅ Database cards with breach data
- ✅ Individual records with fields
- ✅ Color-coded data (red for sensitive, amber for contact, green for general)
- ✅ Masked passwords (●●●●●●●●)
- ✅ Action recommendations

## Test Scenarios

### Scenario 1: Phone Number Search
```
Input: 918375016669
Expected: Results from API showing phone-related breaches
```

### Scenario 2: Email Search
```
Input: test@example.com
Expected: Results or "No data found" message
```

### Scenario 3: Name Search
```
Input: John Doe
Expected: Results or "No data found" message
```

### Scenario 4: Empty Search
```
Input: (empty)
Expected: Button disabled, no search triggered
```

### Scenario 5: Network Error
```
Disconnect internet
Input: any query
Expected: Red error card with retry option
```

## Visual Checklist

### ✅ Terminal Aesthetic
- [ ] Monospace font (JetBrains Mono)
- [ ] Terminal green (#33ff00) colors
- [ ] Black background (#0a0a0a)
- [ ] Sharp borders (no rounded corners)
- [ ] CRT scanline overlay visible
- [ ] Blinking cursor animation

### ✅ Search Interface
- [ ] Input field with "query>" prompt
- [ ] Placeholder text visible
- [ ] Search button with icon
- [ ] Enter key triggers search
- [ ] Button disabled when empty
- [ ] Privacy notice displayed

### ✅ Loading State
- [ ] Amber border on loading card
- [ ] Pulsing database icon
- [ ] Progress bar animations
- [ ] Query text shown
- [ ] Blinking cursor

### ✅ Results Display (If Found)
- [ ] Statistics grid with 4 metrics
- [ ] Red border on results card
- [ ] Database name with lock icon
- [ ] Record numbers labeled
- [ ] Fields organized in grid
- [ ] Field names formatted (uppercase)
- [ ] Color coding applied correctly
- [ ] Sensitive data masked
- [ ] Action items list shown

### ✅ No Results State
- [ ] Green border on card
- [ ] Shield icon
- [ ] "NO DATA FOUND" message
- [ ] Query shown
- [ ] Positive messaging

### ✅ Error State
- [ ] Red border on card
- [ ] Warning icon
- [ ] Error message displayed
- [ ] Retry button visible

### ✅ Responsive Design
- [ ] Works on desktop (1920px+)
- [ ] Works on tablet (768px+)
- [ ] Works on mobile (375px+)
- [ ] Grid collapses properly
- [ ] Text remains readable

## Field Color Testing

### Test Red (Sensitive) Fields
Look for these fields to be RED and MASKED:
- Password → `●●●●●●●●●●`
- CreditCard → `●●●●●●●●●●●●●●●●`
- SSN → `●●●●●●●●●`
- IP → `●●●●●●●●●●`

### Test Amber (Contact) Fields
Look for these fields to be AMBER:
- Email → Full address visible
- Phone → Number visible
- Phone2/Phone3 → Numbers visible

### Test Green (General) Fields
Look for these fields to be GREEN:
- Name → Full name visible
- Username → Username visible
- City → City name visible
- Country → Country name visible

## Performance Testing

### Load Time
- [ ] Page loads under 1 second
- [ ] Images/assets load quickly
- [ ] No layout shift

### Search Speed
- [ ] Search completes in 1-5 seconds
- [ ] Loading state appears immediately
- [ ] Results render smoothly

### Memory Usage
- [ ] No memory leaks after multiple searches
- [ ] Browser remains responsive
- [ ] Can search 10+ times without issues

## Functional Testing

### API Integration
```javascript
// Test API directly in console
const testAPI = async () => {
  const response = await fetch('https://leakosintapi.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: '8518143178:mR452s1L',
      request: '918375016669',
      limit: 100,
      lang: 'en',
      type: 'json'
    })
  });
  const data = await response.json();
  console.log(data);
};
testAPI();
```

### Expected Console Output
```javascript
{
  NumOfDatabase: 2,
  NumOfResults: 5,
  "search time": 0.234,
  free_requests_left: 95,
  List: { ... }
}
```

## Browser Compatibility

### Test Browsers
- [ ] Chrome 100+ ✅
- [ ] Edge 100+ ✅
- [ ] Firefox 100+ ✅
- [ ] Safari 15+ ✅

### Features to Verify
- [ ] Fetch API works
- [ ] CSS Grid layout
- [ ] Flexbox styling
- [ ] Custom fonts load
- [ ] Animations play

## Mobile Testing

### Portrait Mode
- [ ] Input field full width
- [ ] Buttons stack vertically
- [ ] Stats grid collapses (2 columns)
- [ ] Records readable
- [ ] No horizontal scroll

### Landscape Mode
- [ ] Layout maintains structure
- [ ] Navigation accessible
- [ ] Results grid optimized

## Error Scenarios

### Test Each Error Type

1. **Network Error**
   - Disconnect internet
   - Try search
   - Should show connection error

2. **API Error**
   - Change API token to invalid
   - Try search
   - Should show API error

3. **Empty Results**
   - Search for: `thisdoesnotexist@fakeemail.xyz`
   - Should show "No data found"

4. **Rate Limit**
   - Make 100+ searches rapidly
   - Should show rate limit message

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all inputs
- [ ] Enter triggers search
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Labels announced correctly
- [ ] Status changes announced
- [ ] Error messages read aloud
- [ ] Results navigable

### Color Contrast
- [ ] Green on black passes AA
- [ ] Red on black passes AA
- [ ] Amber on black passes AA
- [ ] Text readable at all sizes

## Security Testing

### Data Privacy
- [ ] No queries stored in localStorage
- [ ] No queries in URL parameters
- [ ] Console logs no sensitive data
- [ ] Network tab shows encrypted requests

### Sensitive Data
- [ ] Passwords always masked
- [ ] Credit cards always masked
- [ ] SSN always masked
- [ ] Can't copy masked values easily

## Integration Testing

### With Other Pages
1. Search in Breach Checker
2. Navigate to Dashboard
3. Return to Breach Checker
4. Previous search cleared ✓

### With Browser Extension
1. Install extension
2. Use web app
3. Both work independently ✓

## Bug Testing

### Known Issues to Check
- [ ] No console errors
- [ ] No 404 network requests
- [ ] No React warnings
- [ ] No CSS issues

### Edge Cases
- [ ] Very long email addresses
- [ ] Special characters in query
- [ ] Emoji in search
- [ ] SQL injection attempts (should be safe)
- [ ] XSS attempts (should be sanitized)

## Documentation Testing

### Verify All Docs
- [ ] BREACH_CHECKER_API.md accurate
- [ ] BREACH_CHECKER_GUIDE.md helpful
- [ ] README.md updated
- [ ] Code comments clear

## Final Checklist

Before marking as complete:

- [ ] All features work
- [ ] No console errors
- [ ] Design matches aesthetic
- [ ] Responsive on all devices
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Accessibility tested

## Success Criteria

✅ **PASS** if:
- Search returns real results
- UI maintains terminal aesthetic
- No errors or crashes
- Data displayed correctly
- Sensitive data masked
- Mobile friendly
- Fast and responsive

❌ **FAIL** if:
- API doesn't connect
- Results don't display
- Console shows errors
- Design breaks
- Data exposed incorrectly

---

## Report Issues

If you find bugs:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Note browser and OS version
4. Document expected vs actual behavior

## Test Results Template

```
Date: [DATE]
Tester: [NAME]
Browser: [BROWSER VERSION]
OS: [OS VERSION]

✅ PASSED:
- Search functionality
- Results display
- Terminal aesthetic
- Mobile responsive

❌ FAILED:
- [None]

🐛 BUGS FOUND:
- [None]

📝 NOTES:
- [Any observations]
```

---

**Testing Status**: Ready for testing
**Last Updated**: 2026-02-05

🛡️ Test thoroughly. Ship confidently.
