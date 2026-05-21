export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const key = process.env.UPLOADCARE_PUBLIC_KEY || '8240b649ccee18539f768a9a62bbd93d';
  if (!key) {
    return res.status(500).json({ error: 'Upload service not configured' });
  }

  try {
    // Use Uploadcare's simple upload endpoint with form-urlencoded
    const formBody = new URLSearchParams({
      'UPLOADCARE_PUB_KEY': key,
      'UPLOADCARE_STORE': 'auto',
      'file': image,
    });

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error('Parse error:', text);
      throw new Error('Invalid response from upload service');
    }

    if (!response.ok || !json.file) {
      throw new Error(json.error?.content || json.error || 'Upload failed');
    }

    const fileUrl = `https://ucarecdn.com/${json.file}/`;
    return res.status(200).json({ url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
