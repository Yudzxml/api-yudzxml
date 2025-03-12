const axios = require('axios');
const crypto = require('crypto');

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download"
  },
  headers: {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://yt.savetube.me',
    'referer': 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  },
  formats: ['144', '240', '360', '480', '720', '1080', 'mp3'],

  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g);
      return Buffer.from(matches.join(''), 'hex');
    },

    decrypt: async (enc) => {
      try {
        const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        const data = Buffer.from(enc, 'base64');
        const iv = data.slice(0, 16);
        const content = data.slice(16);
        const key = savetube.crypto.hexToBuffer(secretKey);

        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

        return JSON.parse(decrypted.toString());
      } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
      }
    }
  },

  isUrl: (str) => {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  },

  youtube: (url) => {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  request: async (endpoint, data = {}, method = 'post') => {
    try {
      const response = await axios({
        method,
        url: `${endpoint.startsWith('http') ? '' : savetube.api.base}${endpoint}`,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: savetube.headers
      });
      return {
        status: true,
        code: 200,
        data: response.data
      };
    } catch (error) {
      return {
        status: false,
        code: error.response?.status || 500,
        error: error.message
      };
    }
  },

  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, 'get');
    if (!response.status) return response;
    return {
      status: true,
      code: 200,
      data: response.data.cdn
    };
  },

  download: async (link, format) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Link tidak boleh kosong."
      };
    }

    if (!savetube.isUrl(link)) {
      return {
        status: false,
        code: 400,
        error: "URL tidak valid. Harap masukkan link YouTube yang benar."
      };
    }

    if (!format || !savetube.formats.includes(format)) {
      return {
        status: false,
        code: 400,
        error: "Format tidak valid. Pilih salah satu dari: " + savetube.formats.join(', '),
        available_fmt: savetube.formats
      };
    }

    const id = savetube.youtube(link);
    if (!id) {
      return {
        status: false,
        code: 400,
        error: "Tidak dapat mengekstrak ID video dari URL yang diberikan."
      };
    }

    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;

      const result = await savetube.request(`https://${cdn}${savetube.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });
      if (!result.status) return result;
      const decrypted = await savetube.crypto.decrypt(result.data.data);

      const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
        id: id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: decrypted.key
      });

      return {
        status: 200,
        author: "Yudzxml"
        result: {
          title: decrypted.title || "Tidak diketahui",
          type: format === 'mp3' ? 'audio' : 'video',
          format: format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration,
          quality: format === 'mp3' ? '128' : format,
          downloaded: dl.data.data.downloaded || false
        }
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `Terjadi kesalahan: ${error.message}`
      };
    }
  }
};

module.exports = (req, res) => {
res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allow GET method
res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers
  const { method } = req;
  if (method === 'GET') {
    const { url, format } = req.query; // Mengambil parameter dari query string
    if (!url) {
      return res.status(400).json({ error: 'URL tidak valid. Pastikan URL yang diberikan benar.' });
    }

    // Validasi format
    const validFormats = ['mp3', '144', '240', '360', '480', '720', '1080'];
    if (format && !validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ error: `Format tidak valid. Pilih salah satu dari: ${validFormats.join(', ')}` });
    }

    savetube.download(url, format ? format.toLowerCase() : 'mp3') // Default to mp3 if no format is provided
      .then(data => res.status(200).json(data))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
};