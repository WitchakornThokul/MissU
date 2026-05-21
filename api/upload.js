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
    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload using Uploadcare Upload API with proper multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36);

    const parts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="UPLOADCARE_PUB_KEY"`,
      '',
      key,
      `--${boundary}`,
      `Content-Disposition: form-data; name="UPLOADCARE_STORE"`,
      '',
      'auto',
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="image.jpg"`,
      `Content-Type: image/jpeg`,
      '',
    ].join('\r\n');

    const body = Buffer.concat([
      Buffer.from(parts + '\r\n'),
      buffer,
      Buffer.from('\r\n--' + boundary + '--\r\n'),
    ]);

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
      },
      body,
    });

    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error('Response text:', text);
      throw new Error('Invalid JSON response from Uploadcare');
    }

    if (!response.ok) {
      console.error('Uploadcare error:', json);
      throw new Error(json.error?.content || json.error || 'Upload failed');
    }

    if (!json.file) {
      console.error('No file in response:', json);
      throw new Error('No file ID returned from Uploadcare');
    }

    const fileUrl = `https://ucarecdn.com/${json.file}/`;
    return res.status(200).json({ url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err.message, err.stack);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
