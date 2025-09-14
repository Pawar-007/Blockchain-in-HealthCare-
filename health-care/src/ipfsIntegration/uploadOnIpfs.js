// upload.js
import lighthouse from "@lighthouse-web3/sdk";

const apiKey = import.meta.env.VITE_LIGHTHOUSE_API_KEY; // from .env

export async function uploadToLighthouse(file) {
  try {
    console.log("Uploading file to Lighthouse...");

    const output = await lighthouse.upload([file], apiKey);

    console.log(" Upload successful:", output);
    return output.data.Hash; // returns CID
  } catch (err) {
    console.error("Upload failed:", err.message);
    throw err;
  }
}
