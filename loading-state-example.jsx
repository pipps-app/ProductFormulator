// Quick improvement: Add loading states to prevent user confusion
// Add this to your formulation components

import { useState } from 'react';

const FormulationWithLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const saveFormulation = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/formulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      // Handle success
      toast({ title: "Success", description: "Formulation saved!" });
      
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save formulation. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={() => saveFormulation(data)}
      disabled={isLoading}
      className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
    >
      {isLoading ? "Saving..." : "Save Formulation"}
    </button>
  );
};

export default FormulationWithLoading;
