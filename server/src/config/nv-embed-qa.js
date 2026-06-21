import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || "",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export const callNvidia = async (text, inputType = "passage") => {
  // inputType must be "query" or "passage" — required by NV-EmbedQA / E5 asymmetric models.
  // "query": short search-style text (e.g. a single JD skill/requirement)
  // "passage": longer content being matched against (e.g. resume section text)
  try {
    const response = await client.embeddings.create({
      input: [text],
      model: "nvidia/nv-embedqa-e5-v5",
      encoding_format: "float",
      input_type: inputType, // FIX: top-level field, not nested under extra_body
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding API Error:", error.message || error);
    throw error;
  }
};
