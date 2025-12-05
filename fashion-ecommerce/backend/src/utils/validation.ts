/**
 * Validation utility functions
 * Used across controllers for consistent validation
 */

/**
 * Validates MongoDB ObjectId format
 * @param id - The ID to validate
 * @returns true if valid ObjectId format, false otherwise
 */
export const isValidObjectId = (id: string | undefined | null): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates and returns error response if ObjectId is invalid
 * @param id - The ID to validate
 * @param fieldName - Name of the field for error message
 * @returns Error response object or null if valid
 */
export const validateObjectId = (
  id: string | undefined | null,
  fieldName: string = 'ID'
): { success: false; message: string } | null => {
  if (!isValidObjectId(id)) {
    return {
      success: false,
      message: `Invalid ${fieldName} format`,
    };
  }
  return null;
};

/**
 * Validates enum value
 * @param value - The value to validate
 * @param validValues - Array of valid enum values
 * @param fieldName - Name of the field for error message
 * @returns Error response object or null if valid
 */
export const validateEnum = (
  value: string | undefined | null,
  validValues: string[],
  fieldName: string
): { success: false; message: string } | null => {
  if (value && !validValues.includes(value)) {
    return {
      success: false,
      message: `Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`,
    };
  }
  return null;
};

