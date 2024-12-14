export const getMaterialDefaults = () => {
    const savedValues = localStorage.getItem('material_default_values');
    return savedValues ? JSON.parse(savedValues) : [];
  };