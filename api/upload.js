export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Try ImgBB first (easier to use)
  const imgbbKey = process.env.IMGBB_KEY;

  if (imgbbKey) {
    try {
      const body = new URLSearchParams();
      body.append('key', imgbbKey);
      body.append('image', image);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body,
      });

      const json = await response.json();

      if (json.success && json.data?.url) {
        return res.status(200).json({ url: json.data.url });
      }

      throw new Error(json.error?.message || 'ImgBB upload failed');
    } catch (err) {
      console.error('ImgBB error:', err);
      // Fall through to Uploadcare
    }
  }

  // Fallback to Uploadcare
  const uploadcareKey = process.env.UPLOADCARE_PUBLIC_KEY || '8240b649ccee18539f768a9a62bbd93d';

  try {
    // Use Uploadcare's simpler from-url endpoint
    // First convert base64 to data URL
    const dataUrl = `data:image/jpeg;base64,${image}`;

    const body = new URLSearchParams();
    body.append('pub_key', uploadcareKey);
    body.append('store', 'auto');
    body.append('source_url', dataUrl);

    const response = await fetch('https://upload.uploadcare.com/from_url/', {
      method: 'POST',
      body,
    });

    const json = await response.json();

    if (response.ok && json.file_id) {
      const fileUrl = `https://ucarecdn.com/${json.file_id}/`;
      return res.status(200).json({ url: fileUrl });
    }

    throw new Error(json.error || 'Uploadcare upload failed');
  } catch (err) {
    console.error('Uploadcare error:', err);
    return res.status(500).json({
      error: 'Upload service unavailable. Please add IMGBB_KEY to environment variables.',
      details: err.message
    });
  }
}
