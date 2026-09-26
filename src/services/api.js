const API_URL = "http://localhost:8000";

export async function analyzeScreen(image, language) {
  const formData = new FormData();

  formData.append("image", image);
  formData.append("language", language);

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze screen");
  }

  const data = await response.json();

  return data;
}