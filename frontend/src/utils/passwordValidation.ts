export const validatePasswordComplexity = (password: string) => {
  const requirements = [
    { label: "At least 10 characters", valid: password.length >= 10 },
    { label: "At least 1 uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "At least 1 lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: "At least 2 numbers (0-9)", valid: (password.match(/\d/g) || []).length >= 2 },
    { label: "At least 1 special character (!@#$%^&*)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const isValid = requirements.every((r) => r.valid);
  const firstError = requirements.find((r) => !r.valid)?.label;

  return { isValid, requirements, firstError };
};
