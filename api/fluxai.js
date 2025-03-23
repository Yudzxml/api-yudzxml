const axios = require('axios');
const qs = require('qs');

const models = {
  1: 'flux',
  2: 'PHOTOREALISTIC13'
};

async function aicreate(prompt, model) {
  let selectedModel = models[model];
  if (!selectedModel) {
    throw new Error('Model tidak ada, pilih antara 1-2');
  }

  let data = qs.stringify({
    'action': 'text_to_image_handle',
    'caption': prompt,
    'negative_prompt': 'low quality, nsfw, uncensored',
    'model_version': selectedModel,
    'size': '1024x1024'
  });

  let config = {
    method: 'POST',
    url: 'https://aicreate.com/wp-admin/admin-ajax.php',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'sec-ch-ua-platform': '"Android"',
      'x-requested-with': 'XMLHttpRequest',
      'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'sec-ch-ua-mobile': '?1',
      'origin': 'https://aicreate.com',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://aicreate.com/text-to-image-generator/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i'
    },
    data: data
  };

  try {
    const api = await axios.request(config);
    const result = api.data.html.match(/href="([^"]+)"/g).map(m => m.replace('href="', '').replace('"', ''));
    return result;
  } catch (error) {
    console.error(error);
    throw new Error('Gagal membuat gambar');
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { method } = req;

  if (method === 'GET') {
    const { prompt, model } = req.query;
    if (!prompt || !model) {
      return res.status(400).json({ error: 'Prompt dan model harus disediakan. Model : flux, PHOTOREALISTIC13'});
    }

    try {
      const images = await aicreate(prompt, model);
      return res.status(200).json({ images });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
};