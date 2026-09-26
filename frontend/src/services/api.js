const API_URL = "http://localhost:8000";

export async function analyzeScreen(image, language) {
  if (!image) {
    throw new Error("No screenshot selected.");
  }

  const formData = new FormData();

  formData.append("image", image);
  formData.append("language", language || "English");

  let response;

  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to SERI backend. Make sure the backend is running on port 8000."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `SERI backend returned an error (${response.status}).`
    );
  }

  return data;
}