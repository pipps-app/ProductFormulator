// Quick improvement: Add form validation to prevent invalid entries
// Add this to your formulation form component

const validateFormulationData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Formulation name is required");
  }
  
  if (!data.batchSize || parseFloat(data.batchSize) <= 0) {
    errors.push("Batch size must be greater than 0");
  }
  
  if (data.markupPercentage && (parseFloat(data.markupPercentage) < 0 || parseFloat(data.markupPercentage) > 1000)) {
    errors.push("Markup percentage must be between 0% and 1000%");
  }
  
  return errors;
};

// Usage in your form submit handler:
const errors = validateFormulationData(formData);
if (errors.length > 0) {
  toast({
    title: "Validation Error",
    description: errors.join(", "),
    variant: "destructive"
  });
  return;
}
