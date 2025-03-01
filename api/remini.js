const axios = require('axios');
const { fromBuffer } = require('file-type');
const qs = require('qs');
const cors = require('cors'); // Impor cors

const tool = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

const isImageUrl = (url) => {
  const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return validImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const pxpic = {
  upload: async (buffer, mime) => {
    const fileName = Date.now() + '.' + mime.split('/')[1];
    const folder = "uploads";

    const responsej = await axios.post("https://pxpic.com/getSignedUrl", { folder, fileName }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { presignedUrl } = responsej.data;

    await axios.put(presignedUrl, buffer, {
      headers: {
        "Content-Type": mime,
      },
    });

    const cdnDomain = "https://files.fotoenhancer.com/uploads/";
    const sourceFileUrl = cdnDomain + fileName;

    return sourceFileUrl;
  },
  create: async (url, tools) => {
    if (!tool.includes(tools)) {
      return `Pilih salah satu dari tools ini: ${tool.join(', ')}`;
    }

    // Download image
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    if (!contentType.startsWith('image/')) {
      throw new Error('URL tidak mengarah ke gambar yang valid.');
    }

    const buffer = Buffer.from(response.data);
    const { mime } = await fromBuffer(buffer) || {};

    const imageUrl = await pxpic.upload(buffer, mime);

    let data = qs.stringify({
      'imageUrl': imageUrl,
      'targetFormat': 'png',
      'needCompress': 'no',
      'imageQuality': '100',
      'compressLevel': '6',
      'fileOriginalExtension': 'png',
      'aiFunction': tools,
      'upscalingLevel': ''
    });

    let config = {
      method: 'POST',
      url: 'https://pxpic.com/callAiFunction',
      headers: {
        'User -Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept-language': 'id-ID'
      },
      data: data
    };

    const api = await axios.request(config);
    return { 
      status: 'true',
      author: 'Yudzxml',
      data: api.data
    };
  }
}

// Middleware CORS
module.exports = (req, res) => {
  // Gunakan middleware CORS
  cors()(req, res, () => {
    const { method } = req;
    if (method === 'GET') {
      const { url, tools } = req.query; // Mengambil parameter dari query string
      if (!url || !isImageUrl(url)) {
        return res.status(400).json({ error: 'URL tidak valid. Pastikan URL mengarah ke gambar.' });
      }
      
      pxpic.create(url, tools) // Mengganti filePath dengan url
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  });
};
