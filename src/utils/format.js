export const formatValidationError = (error) => {
  if (Array.isArray(error?.issues)) {
    return error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  return [{ field: '', message: 'Validation error' }];
};
