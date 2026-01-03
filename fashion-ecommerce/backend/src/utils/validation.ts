









export const isValidObjectId = (id: string | undefined | null): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
};







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

