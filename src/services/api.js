const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export const analyzeCodebase = async (files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Analysis failed');
  }

  return data;
};

