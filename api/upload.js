export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const key = process.env.IMGBB_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Upload service not configured' });
  }

  try {
    const body = new URLSearchParams({ key, image });
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body,
    });
    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Upload failed');
    }
    return res.status(200).json({ url: json.data.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
