# Swagger Editor App Pull Request

## Links

- Demo:
- YouTube walkthrough:

## Score checklist

### Feature 1: App Header / 60

- [ ] Non-authenticated users see Sign In and Sign Up buttons
- [ ] Authenticated users see History and Sign Out buttons
- [ ] About link is available in header and footer
- [ ] Expired or invalid token redirects from private routes to Main page
- [ ] Sign In / Sign Up buttons redirect to corresponding forms

### Feature 2: Sign In / Sign Up / 50

- [ ] Auth buttons are present where needed
- [ ] Client-side email and password validation is implemented
- [ ] Successful login redirects to Main page
- [ ] Authenticated users are redirected away from auth routes

### Feature 3: Swagger Editor / 120

- [ ] JSON and YAML schema loading works
- [ ] Format auto-detection works
- [ ] JSON ↔ YAML switching works
- [ ] Schema validation displays errors
- [ ] Authenticated users can save and restore schema
- [ ] Viewer auto-populates from valid schema
- [ ] Responsive split view works

### Feature 4: Swagger Viewer / 120

- [ ] Endpoints are listed by path and method
- [ ] Parameter types are displayed
- [ ] Request schema and examples are displayed
- [ ] Response schemas, examples, and status codes are displayed
- [ ] Try-It-Out executes through server proxy and displays response
- [ ] Generate cURL and copy-to-clipboard works

### Feature 5: History and Analytics / 70

- [ ] Server-rendered history and empty state are implemented
- [ ] Requests are sorted by timestamp descending
- [ ] Required analytics fields are recorded and shown

### Feature 6: About Page / 25

- [ ] Public access
- [ ] RS School course information
- [ ] Team member names, roles, and GitHub links
- [ ] Design consistency

### Feature 7: General Requirements / 55

- [ ] Two languages with toggler
- [ ] Sticky animated header
- [ ] Friendly error display
- [ ] Private routes return 401 or redirect properly

### Feature 8: YouTube Video / 50

- [ ] 5-7 minute YouTube walkthrough is linked

## Notes for reviewer
