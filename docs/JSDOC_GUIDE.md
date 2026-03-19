# JSDoc Standards Guide

All JavaScript modules should follow JSDoc conventions for maintainability, IDE support, and automated documentation generation.

## Module Header

Every `.js` file should start with a module-level JSDoc comment:

```javascript
/**
 * Module Name - Brief description
 *
 * Longer description of what this module does, its responsibilities,
 * and key behaviors.
 *
 * @module js/path/to/module
 * @example
 * import { myFunction } from './module.js';
 * myFunction('example');
 */
```

## Function Documentation

### Basic Function

```javascript
/**
 * Brief description of what function does
 *
 * Longer explanation if needed. Describe edge cases, side effects,
 * and important behavior.
 *
 * @param {string} name - Parameter description
 * @param {number} [age=18] - Optional parameter with default
 * @returns {boolean} What the function returns
 * @throws {Error} When this error occurs
 *
 * @example
 * const result = myFunction('John', 30);
 * console.log(result); // => true
 */
export function myFunction(name, age = 18) {
  // ...
}
```

### Async Function

```javascript
/**
 * Fetch user data asynchronously
 *
 * @param {string} userId - User ID to fetch
 * @returns {Promise<Object>} User object
 * @throws {Error} If user not found or network error
 *
 * @example
 * const user = await fetchUser('123');
 */
export async function fetchUser(userId) {
  // ...
}
```

### Complex Objects

```javascript
/**
 * Create a student record
 *
 * @param {Object} config - Configuration object
 * @param {string} config.id - Student ID
 * @param {string} config.name - Student name
 * @param {string} [config.grade='K'] - Grade level
 * @param {Array<string>} [config.groups=[]] - Group IDs
 * @returns {Object} Student record object
 */
export function createStudent(config) {
  // ...
}
```

## Type Annotations

### Primitive Types
```javascript
@param {string} name
@param {number} count
@param {boolean} isActive
@param {null} value
@param {undefined} value
```

### Complex Types
```javascript
@param {Array<string>} names
@param {Object<string, number>} counts
@param {Map} data
@param {Set} unique
@param {Function} callback
@param {Promise<Array>} asyncResult
```

### Union Types
```javascript
@param {string|number} id - Can be string or number
@param {?string} optional - Nullable string (can be null or string)
```

### Custom Types
```javascript
/**
 * @typedef {Object} Student
 * @property {string} id - Student ID
 * @property {string} name - Student name
 * @property {string} grade - Grade level
 */

/**
 * Get student by ID
 * @param {string} id - Student ID
 * @returns {Student} Student object
 */
export function getStudent(id) {
  // ...
}
```

## Special Tags

### @internal
Mark functions for internal use only:
```javascript
/**
 * Internal helper - do not use directly
 * @internal
 */
function _helper() { }
```

### @deprecated
Mark deprecated functions:
```javascript
/**
 * @deprecated Use newFunction() instead
 * @param {string} value
 */
export function oldFunction(value) { }
```

### @readonly
Mark constants/readonly properties:
```javascript
/**
 * Application version
 * @readonly
 * @type {string}
 */
export const VERSION = '1.0.0';
```

### @default
Document default values:
```javascript
/**
 * Create config
 * @param {Object} options
 * @param {string} [options.theme='light'] - Theme selection
 * @default 'light'
 */
export function configure(options) { }
```

## Class Documentation

```javascript
/**
 * Student manager class
 *
 * Handles CRUD operations for student records.
 */
export class StudentManager {
  /**
   * Create a new StudentManager
   * @param {Object} storage - Storage backend
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Get student by ID
   * @param {string} id - Student ID
   * @returns {Promise<Object>} Student object
   */
  async getStudent(id) {
    // ...
  }

  /**
   * Save student
   * @param {Object} student - Student object
   * @returns {Promise<boolean>} Success flag
   */
  async save(student) {
    // ...
  }
}
```

## Enum/Constant Documentation

```javascript
/**
 * Support types available in the system
 * @enum {string}
 * @readonly
 */
export const SUPPORT_TYPES = {
  PUSH_IN: 'push-in',
  PULLOUT: 'pullout',
  PLANNING: 'planning'
};
```

## Callbacks

```javascript
/**
 * Process array items
 *
 * @callback ItemProcessor
 * @param {*} item - Array item
 * @param {number} index - Item index
 * @returns {*} Processed item
 */

/**
 * Map array with custom processor
 * @param {Array} items - Items to process
 * @param {ItemProcessor} processor - Processing function
 * @returns {Array} Processed items
 */
export function processArray(items, processor) {
  // ...
}
```

## Best Practices

1. **Always document public APIs** - Every exported function needs JSDoc
2. **Use @example for complex functions** - Helps users understand usage
3. **Document edge cases** - Describe behavior with null, empty, or invalid inputs
4. **Keep descriptions concise** - First line should be <80 characters
5. **Use consistent terminology** - Same concept = same term across codebase
6. **Document side effects** - Mention localStorage, DOM changes, network calls
7. **Link related functions** - Use @see to reference related APIs
8. **Document errors** - Use @throws for every error condition
9. **Update when changing** - JSDoc stays with code changes
10. **Test your examples** - Example code should actually work

## IDE Support

Modern IDEs use JSDoc for:
- **IntelliSense** - Autocomplete suggestions
- **Hover tooltips** - Quick documentation
- **Type checking** - Parameter validation (in TypeScript-aware editors)
- **Navigation** - Jump to definitions
- **Refactoring** - Safe code changes

## Documentation Generation

Generate HTML docs from JSDoc:

```bash
npx jsdoc -c jsdoc.json
```

## Linting

Enforce JSDoc standards:

```bash
npm install --save-dev eslint-plugin-jsdoc
```

Then configure in `.eslintrc.json`:

```json
{
  "plugins": ["jsdoc"],
  "rules": {
    "jsdoc/require-description": "warn",
    "jsdoc/require-param": "warn",
    "jsdoc/require-returns": "warn"
  }
}
```

---

For more information, see [JSDoc.app](https://jsdoc.app)
