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
    // Prepare form data for Uploadcare
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Build multipart form data manually
    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="UPLOADCARE_PUB_KEY"\r\n\r\n`);
    parts.push(`${key}\r\n`);
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="UPLOADCARE_STORE"\r\n\r\n`);
    parts.push(`auto\r\n`);
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n`);
    parts.push(`Content-Type: image/jpeg\r\n\r\n`);

    const formData = Buffer.concat([
      Buffer.from(parts.join('')),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData,
    });

    const json = await response.json();

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
