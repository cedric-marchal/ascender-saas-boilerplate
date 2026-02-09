# String Processing Rules

## Context

These rules apply to ALL string processing operations in the codebase. This is the single source of truth for string manipulation, ensuring consistency, security, and performance across the entire application.

## Rules

### 1. Universal Processing Order (P0)

ALWAYS follow this exact order for string operations. This order is optimized for:
- **Safety**: Validates before processing
- **Performance**: Reduces data as early as possible
- **Predictability**: Same order everywhere prevents bugs

```
1. VALIDATION    → Early return if invalid
2. SANITIZATION  → Remove dangerous content (if user input)
3. NORMALIZATION → Standardize format (trim, normalize, etc.)
4. TRANSFORMATION → Split, replace, etc.
5. FILTERING     → Remove unwanted elements
6. MAPPING       → Transform each element
7. AGGREGATION   → Reduce, join, etc.
8. FORMATTING    → Case, padding, etc.
9. LIMITATION    → Slice, truncate, etc.
```

### 2. Validation (P0)

ALWAYS validate input before any processing.

```tsx
// ✅ Correct: Comprehensive validation
function processName(name: string): string {
  // Type check
  if (!name || typeof name !== "string") {
    return "";
  }

  // Empty check after trim
  const cleaned = name.trim();

  if (cleaned.length === 0) {
    return "";
  }

  // Length validation
  if (cleaned.length > MAX_NAME_LENGTH) {
    return "";
  }

  // Rest of processing...
  return cleaned;
}

// ❌ Wrong: No validation
function processName(name: string): string {
  return name.trim().toUpperCase(); // Can crash if name is null
}

// ❌ Wrong: Checking length before trim
function processName(name: string): string {
  if (name.length === 0) {  // "   " has length > 0
    return "";
  }
  return name.trim(); // Would process empty string
}
```

### 3. Sanitization for User Input (P0)

For user-facing strings, ALWAYS sanitize to prevent XSS and injection attacks.

```tsx
// ✅ Correct: Sanitize user input
function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove HTML special chars
    .slice(0, MAX_INPUT_LENGTH);
}

// For display in React (automatic escaping)
function UserComment({ text }: { text: string }) {
  const sanitized = sanitizeUserInput(text);
  return <p>{sanitized}</p>; // React escapes by default
}

// ❌ Wrong: Using dangerouslySetInnerHTML with unsanitized input
function UserComment({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />; // XSS vulnerability
}
```

### 4. Normalization (P0)

ALWAYS normalize before transformation.

```tsx
// ✅ Correct: Normalize first
function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email
    .trim()                    // Remove whitespace
    .toLowerCase()             // Normalize case
    .normalize("NFD")          // Decompose accents
    .replace(/[\u0300-\u036f]/g, ""); // Remove accent marks
}

// ✅ Correct: Normalize whitespace
function normalizeWhitespace(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/\s+/g, " "); // Multiple spaces → single space
}

// ❌ Wrong: Transform before normalize
function normalizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim(); // trim should be first
}
```

### 5. Split → Filter → Map Order (P0)

When chaining array operations, ALWAYS follow this order:

```tsx
// ✅ Correct: Split → Filter → Map
function getInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "";
  }

  return trimmedName
    .split(" ")                                    // 1. SPLIT: Create array
    .filter((word: string) => word.length > 0)     // 2. FILTER: Reduce array
    .map((word: string) => word.charAt(0))         // 3. MAP: Transform smaller array
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ❌ Wrong: Map before filter (processes empty strings)
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word: string) => word.charAt(0))         // charAt(0) on "" returns ""
    .filter((char: string) => char.length > 0)     // Extra work
    .join("")
    .toUpperCase();
}

// ❌ Wrong: No filter (can produce empty elements)
function getInitials(name: string): string {
  return name
    .split(" ")                                    // "  John  " → ["", "", "John", "", ""]
    .map((word: string) => word.charAt(0))         // ["", "", "J", "", ""]
    .join("")                                      // "J" (wrong, should be "JO")
    .toUpperCase();
}
```

### 6. Join Before Format (P0)

ALWAYS join array elements BEFORE applying formatting operations.

```tsx
// ✅ Correct: Join first, format once
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")          // Join first
    .toUpperCase()     // Format once (1 call)
    .slice(0, 2);
}

// ❌ Wrong: Format in map (N calls instead of 1)
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0).toUpperCase()) // N calls to toUpperCase()
    .join("")
    .slice(0, 2);
}
```

### 7. Format Before Limit (P1)

Apply formatting BEFORE limiting length (logical order).

```tsx
// ✅ Correct: Format then limit
function formatName(name: string): string {
  return name
    .trim()
    .toUpperCase()     // Format first
    .slice(0, 50);     // Then limit
}

// ⚠️ Works but less logical: Limit then format
function formatName(name: string): string {
  return name
    .trim()
    .slice(0, 50)      // Limit first
    .toUpperCase();    // Then format (works but order is confusing)
}
```

### 8. Explicit Type Annotations (P0)

ALWAYS type callback parameters explicitly.

```tsx
// ✅ Correct: Explicit types
const words = text
  .split(" ")
  .filter((word: string) => word.length > 0)
  .map((word: string) => word.charAt(0));

const chars = text
  .split("")
  .map((char: string, index: number) => `${char}-${index}`);

// ❌ Wrong: Implicit types
const words = text
  .split(" ")
  .filter((word) => word.length > 0)      // Implicit type
  .map((word) => word.charAt(0));         // Implicit type

// ❌ Wrong: Abbreviated parameter names
const words = text
  .split(" ")
  .filter((w: string) => w.length > 0)    // Should be "word"
  .map((w: string) => w.charAt(0));       // Should be "word"
```

### 9. String Method Reference (P0)

Use the right method for the job. Here's the complete reference:

#### Testing / Checking

```tsx
// Case-sensitive checks
string.includes(substring)           // Contains substring
string.startsWith(prefix)            // Starts with prefix
string.endsWith(suffix)              // Ends with suffix

// Case-insensitive checks (normalize first)
string.toLowerCase().includes(substring.toLowerCase())

// Pattern matching
string.match(/pattern/)              // Returns matches or null
/pattern/.test(string)               // Returns boolean

// Empty check
string.trim().length === 0           // Is empty or whitespace-only
```

#### Extracting

```tsx
// Substring extraction
string.slice(start, end)             // Negative indices allowed
string.substring(start, end)         // No negative indices
string.charAt(index)                 // Single character (returns "" if out of bounds)
string.charCodeAt(index)             // Character code
string[index]                        // ❌ Avoid: returns undefined if out of bounds

// Splitting
string.split(separator)              // Always returns array
string.split(separator, limit)       // Limit number of splits

// Matching
string.match(/pattern/g)             // Global match (returns array or null)
string.matchAll(/pattern/g)          // Iterator of all matches
```

#### Transforming

```tsx
// Case
string.toLowerCase()                 // All lowercase
string.toUpperCase()                 // All uppercase
string.toLocaleLowerCase(locale)     // Locale-aware lowercase
string.toLocaleUpperCase(locale)     // Locale-aware uppercase

// Whitespace
string.trim()                        // Remove leading/trailing whitespace
string.trimStart()                   // Remove leading whitespace
string.trimEnd()                     // Remove trailing whitespace

// Replacing
string.replace(search, replacement)  // First occurrence
string.replaceAll(search, replacement) // All occurrences
string.replace(/pattern/g, replacement) // Regex replace all

// Padding
string.padStart(length, fillString)  // Pad at start
string.padEnd(length, fillString)    // Pad at end

// Repeating
string.repeat(count)                 // Repeat string N times

// Normalization
string.normalize()                   // Unicode normalization (NFD, NFC, NFKD, NFKC)
```

#### Combining

```tsx
// Concatenation
string1 + string2                    // Simple concat
string1.concat(string2, string3)     // Multi concat
`${string1} ${string2}`              // Template literal (preferred for readability)

// Joining arrays
array.join(separator)                // Array → string
```

### 10. Common Patterns (P0)

#### Capitalize First Letter

```tsx
// ✅ Correct: Safe capitalization
function capitalize(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// ❌ Wrong: No validation
function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1); // Crashes if text is empty
}
```

#### Title Case

```tsx
// ✅ Correct: Title case with proper order
function toTitleCase(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed
    .toLowerCase()                               // Normalize first
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Test cases:
// "HELLO WORLD" → "Hello World"
// "  hello   world  " → "Hello World"
```

#### Slugify

```tsx
// ✅ Correct: Complete slugify
function slugify(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")                            // Decompose accents
    .replace(/[\u0300-\u036f]/g, "")            // Remove accent marks
    .replace(/[^a-z0-9\s-]/g, "")               // Remove special chars
    .replace(/\s+/g, "-")                        // Spaces → hyphens
    .replace(/-+/g, "-")                         // Multiple hyphens → single
    .replace(/^-+|-+$/g, "");                   // Remove leading/trailing hyphens
}

// Test cases:
// "Hello World!" → "hello-world"
// "Café Münchën" → "cafe-munchen"
// "  Multiple   Spaces  " → "multiple-spaces"
```

#### Truncate with Ellipsis

```tsx
// ✅ Correct: Smart truncate
function truncate(text: string, maxLength: number): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (maxLength < 4) {
    throw new Error("maxLength must be at least 4 for ellipsis");
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength - 3) + "...";
}

// Test cases:
// truncate("Hello World", 8) → "Hello..."
// truncate("Hi", 10) → "Hi"
```

#### Extract Initials

```tsx
// ✅ Correct: Complete implementation (reference)
function getInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "";
  }

  const initials = trimmedName
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
}

// Test cases:
// "John Doe" → "JD"
// "  John   Doe  " → "JD"
// "John" → "JO" (first 2 chars)
// "" → ""
// "   " → ""
```

#### Remove Special Characters

```tsx
// ✅ Correct: Safe sanitization
function removeSpecialChars(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "");            // Keep alphanumeric + spaces
}

// For keeping accents:
function removeSpecialCharsKeepAccents(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "");          // Keep letters (any language) + numbers + spaces
}
```

#### Format Phone Number

```tsx
// ✅ Correct: Format French phone number
function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Extract digits only
  const digits = phone.replace(/\D/g, "");

  // Validate length
  if (digits.length !== 10) {
    return "";
  }

  // Format: XX XX XX XX XX
  return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

// Test cases:
// "0612345678" → "06 12 34 56 78"
// "06 12 34 56 78" → "06 12 34 56 78"
// "+33612345678" → "" (invalid length)
```

### 11. Performance Considerations (P1)

#### When to Use Regex vs Native Methods

```tsx
// ✅ Use native methods for simple operations (faster)
text.includes("search")              // Faster than /search/.test(text)
text.startsWith("prefix")            // Faster than /^prefix/.test(text)
text.endsWith("suffix")              // Faster than /suffix$/.test(text)
text.toLowerCase()                   // Faster than .replace(/[A-Z]/g, ...)

// ✅ Use regex for complex patterns
text.replace(/\s+/g, " ")            // Replace multiple spaces
text.replace(/[^a-zA-Z0-9]/g, "")   // Remove special chars
text.match(/\d+/g)                   // Extract all numbers
```

#### Chain vs Multiple Variables

```tsx
// ✅ Preferred: Single chain (more readable)
const result = text
  .trim()
  .toLowerCase()
  .replace(/\s+/g, " ");

// ⚠️ Also valid: Multiple variables (use for debugging or complex logic)
const trimmed = text.trim();
const lowercased = trimmed.toLowerCase();
const normalized = lowercased.replace(/\s+/g, " ");

// ❌ Wrong: Unnecessary intermediate variables
const step1 = text.trim();
const step2 = step1.toLowerCase();
const step3 = step2.replace(/\s+/g, " "); // Use chaining instead
```

### 12. Regex Patterns Reference (P1)

Common patterns for validation and transformation:

```tsx
// Email validation (basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number (French)
const PHONE_REGEX = /^0[1-9]\d{8}$/;

// Alphanumeric only
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

// Slug format
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Remove all whitespace
text.replace(/\s/g, "");

// Remove multiple whitespace → single space
text.replace(/\s+/g, " ");

// Remove all non-alphanumeric
text.replace(/[^a-zA-Z0-9]/g, "");

// Remove all digits
text.replace(/\d/g, "");

// Remove all non-digits
text.replace(/\D/g, "");

// Extract all digits
text.match(/\d+/g);

// Extract all words
text.match(/\w+/g);

// Remove HTML tags
text.replace(/<[^>]*>/g, "");

// Remove accents (use with normalize)
text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
```

### 13. Security Best Practices (P0)

#### XSS Prevention

```tsx
// ✅ Correct: Sanitize user input for display
function sanitizeForDisplay(userInput: string): string {
  if (!userInput || typeof userInput !== "string") {
    return "";
  }

  return userInput
    .trim()
    .replace(/[<>\"'&]/g, (char: string) => {
      const htmlEntities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return htmlEntities[char] || char;
    })
    .slice(0, MAX_USER_INPUT_LENGTH);
}

// ✅ React auto-escapes (safe by default)
function UserComment({ text }: { text: string }) {
  return <p>{text}</p>; // React escapes automatically
}

// ❌ DANGER: Never use dangerouslySetInnerHTML with user input
function UserComment({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />; // XSS vulnerability
}
```

#### SQL Injection Prevention (In Validation)

```tsx
// ✅ Correct: Validate and sanitize search input
function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  return query
    .trim()
    .replace(/[;'\"\\]/g, "")                    // Remove SQL dangerous chars
    .slice(0, MAX_SEARCH_LENGTH);
}

// Note: This is defense in depth. Primary defense is parameterized queries in Prisma
```

#### Path Traversal Prevention

```tsx
// ✅ Correct: Sanitize filename
function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "";
  }

  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "")            // Only safe chars
    .replace(/\.\.+/g, ".")                      // Remove ".."
    .slice(0, MAX_FILENAME_LENGTH);
}

// ❌ Wrong: Allowing path traversal
function sanitizeFilename(filename: string): string {
  return filename.trim(); // "../../../etc/passwd" is not sanitized
}
```

### 14. Internationalization (i18n) Considerations (P1)

```tsx
// ✅ Correct: Locale-aware comparison
function compareStringsLocale(a: string, b: string, locale: string = "fr-FR"): number {
  return a.localeCompare(b, locale, { sensitivity: "base" });
}

// ✅ Correct: Locale-aware case conversion
function toLocaleLowerCaseFr(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text.trim().toLocaleLowerCase("fr-FR");
}

// ✅ Correct: Handle accents properly
function normalizeForSearch(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")                            // Decompose: é → e + ´
    .replace(/[\u0300-\u036f]/g, "");           // Remove accents: e + ´ → e
}

// Test:
// normalizeForSearch("Café") → "cafe"
// normalizeForSearch("Münchën") → "munchen"
```

### 15. Edge Cases to Always Handle (P0)

```tsx
// ✅ Always handle these edge cases:

function robustStringFunction(input: string): string {
  // 1. Null/undefined check
  if (!input || typeof input !== "string") {
    return "";
  }

  // 2. Empty string after trim
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return "";
  }

  // 3. Length validation
  if (trimmed.length > MAX_LENGTH) {
    return "";
  }

  // 4. Multiple consecutive spaces
  const normalized = trimmed.replace(/\s+/g, " ");

  // 5. Special characters (if user input)
  const sanitized = normalized.replace(/[<>\"'&]/g, "");

  // 6. Unicode edge cases (if needed)
  const unicodeNormalized = sanitized.normalize("NFC");

  return unicodeNormalized;
}
```

## Complete Utility Examples

### 1. Email Utilities

```tsx
// @/utils/string/email.ts

const MAX_EMAIL_LENGTH = 255;

function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function validateEmail(email: string): boolean {
  const normalized = normalizeEmail(email);

  if (normalized.length === 0 || normalized.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(normalized);
}

function maskEmail(email: string): string {
  const normalized = normalizeEmail(email);

  if (!validateEmail(normalized)) {
    return "";
  }

  const [localPart, domain] = normalized.split("@");

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const visibleChars = localPart.slice(0, 2);
  return `${visibleChars}***@${domain}`;
}

export { normalizeEmail, validateEmail, maskEmail };

// Test cases:
// maskEmail("john.doe@example.com") → "jo***@example.com"
// maskEmail("a@example.com") → "a***@example.com"
```

### 2. Name Utilities

```tsx
// @/utils/string/name.ts

const MAX_NAME_LENGTH = 100;

function normalizeName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
}

function toTitleCase(name: string): string {
  const normalized = normalizeName(name);

  if (normalized.length === 0) {
    return "";
  }

  return normalized
    .toLowerCase()
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getInitials(name: string): string {
  const normalized = normalizeName(name);

  if (normalized.length === 0) {
    return "";
  }

  const initials = normalized
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
}

function maskName(name: string): string {
  const normalized = normalizeName(name);

  if (normalized.length === 0) {
    return "";
  }

  const words = normalized.split(" ");

  if (words.length === 1) {
    // Single name: "John" → "J***"
    return `${words[0].charAt(0)}***`;
  }

  // Multiple names: "John Doe" → "John D."
  const firstName = words[0];
  const lastInitial = words[words.length - 1].charAt(0);

  return `${firstName} ${lastInitial}.`;
}

export { normalizeName, toTitleCase, getInitials, maskName };

// Test cases:
// toTitleCase("JOHN DOE") → "John Doe"
// getInitials("John Doe") → "JD"
// maskName("John Doe") → "John D."
```

### 3. Slug Utilities

```tsx
// @/utils/string/slug.ts

const MAX_SLUG_LENGTH = 200;

function slugify(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return SLUG_REGEX.test(slug);
}

function unslugify(slug: string): string {
  if (!slug || typeof slug !== "string") {
    return "";
  }

  return slug
    .split("-")
    .filter((word: string) => word.length > 0)
    .map((word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export { slugify, validateSlug, unslugify };

// Test cases:
// slugify("Hello World!") → "hello-world"
// slugify("Café Münchën") → "cafe-munchen"
// unslugify("hello-world") → "Hello World"
```

### 4. Sanitization Utilities

```tsx
// @/utils/string/sanitize.ts

const MAX_USER_INPUT_LENGTH = 1000;

function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, (char: string) => {
      const htmlEntities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return htmlEntities[char] || char;
    })
    .slice(0, MAX_USER_INPUT_LENGTH);
}

function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "";
  }

  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/\.\.+/g, ".")
    .slice(0, 255);
}

function removeHtmlTags(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ");
}

export { sanitizeUserInput, sanitizeFilename, removeHtmlTags };
```

### 5. Truncate Utilities

```tsx
// @/utils/string/truncate.ts

function truncate(text: string, maxLength: number): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (maxLength < 4) {
    throw new Error("maxLength must be at least 4 for ellipsis");
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength - 3) + "...";
}

function truncateWords(text: string, maxWords: number): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (maxWords < 1) {
    throw new Error("maxWords must be at least 1");
  }

  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  if (words.length <= maxWords) {
    return trimmed;
  }

  return words.slice(0, maxWords).join(" ") + "...";
}

function truncateMiddle(text: string, maxLength: number): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (maxLength < 7) {
    throw new Error("maxLength must be at least 7 for middle truncation");
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const charsToShow = maxLength - 3; // Reserve 3 for "..."
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return (
    trimmed.slice(0, frontChars) +
    "..." +
    trimmed.slice(trimmed.length - backChars)
  );
}

export { truncate, truncateWords, truncateMiddle };

// Test cases:
// truncate("Hello World", 8) → "Hello..."
// truncateWords("Hello beautiful world", 2) → "Hello beautiful..."
// truncateMiddle("verylongfilename.txt", 15) → "verylo...ame.txt"
```

## Anti-Patterns

```tsx
// ❌ Wrong: No validation
function processString(text: string): string {
  return text.trim().toUpperCase(); // Can crash if text is null
}

// ❌ Wrong: Wrong order (trim after length check)
if (name.length === 0) return "";
return name.trim();

// ❌ Wrong: Wrong order (format before join)
.map((word: string) => word.charAt(0).toUpperCase())
.join("")

// ❌ Wrong: Map before filter
.map((word: string) => word.charAt(0))
.filter((char: string) => char.length > 0)

// ❌ Wrong: Using string[index] instead of charAt
const firstChar = text[0]; // Returns undefined if empty

// ❌ Wrong: No type annotation in callback
.map((word) => word.charAt(0))

// ❌ Wrong: Abbreviated parameter names
.map((w: string) => w.charAt(0))
.filter((c: string) => c.length > 0)

// ❌ Wrong: No sanitization for user input
function displayUserComment(comment: string) {
  return <div dangerouslySetInnerHTML={{ __html: comment }} />;
}

// ❌ Wrong: Hardcoded max length
.slice(0, 100) // Use constant: MAX_LENGTH

// ❌ Wrong: Not normalizing before comparison
if (email1 === email2) // Should normalize first

// ❌ Wrong: Case-sensitive includes for search
text.includes(searchTerm) // Should use toLowerCase() on both

// ❌ Wrong: Multiple spaces not normalized
text.split(" ") // "  hello  " → ["", "", "hello", "", ""]

// ❌ Wrong: No accent handling for search
function search(query: string, text: string): boolean {
  return text.includes(query); // "cafe" won't match "café"
}
```

## Key Principles

1. **Universal Order**: ALWAYS follow the 9-step order (Validation → Sanitization → Normalization → Transformation → Filtering → Mapping → Aggregation → Formatting → Limitation)

2. **Validate First**: ALWAYS check type and emptiness before processing

3. **Trim Early**: ALWAYS trim before any other operation (except type validation)

4. **Reduce Then Transform**: ALWAYS filter before map (smaller array = better performance)

5. **Join Then Format**: ALWAYS join before formatting operations (1 call instead of N)

6. **Explicit Types**: ALWAYS type callback parameters in `.map()`, `.filter()`, etc.

7. **Use charAt()**: ALWAYS use `.charAt(index)` instead of `[index]` (safer)

8. **Sanitize User Input**: ALWAYS sanitize strings from users (XSS prevention)

9. **Normalize for Comparison**: ALWAYS normalize case and accents for comparisons/search

10. **Constants for Limits**: NEVER hardcode max lengths, use named constants

11. **Performance Aware**: Use native methods over regex when possible

12. **i18n Ready**: Use locale-aware methods when dealing with user names/text

This document is the **single source of truth** for all string processing operations in the codebase.
