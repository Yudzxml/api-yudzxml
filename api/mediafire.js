const cheerio = require('cheerio');

async function mediaFire(url) {
  try {
    const response = await fetch('https://r.jina.ai/' + url, {
      headers: {
        'x-return-format': 'html',
      }
    });
    const text = await response.text();
    const $ = cheerio.load(text);
  
    const Time = $('div.DLExtraInfo-uploadLocation div.DLExtraInfo-sectionDetails').text().match(/This file was uploaded from (.*?) on (.*?) at (.*?)\n/);
    const result = {
      title: $('div.dl-btn-label').text().trim(),
      link: $('div.dl-utility-nav a').attr('href'),
      filename: $('div.dl-btn-label').attr('title'),
      url: $('a#downloadButton').attr('href'),
      size: $('a#downloadButton').text().match(/\((.*?)\)/)[1],
      from: Time ? Time[1] : null,
      date: Time ? Time[2] : null,
      time: Time ? Time[3] : null,
      map: {
        background: "https://static.mediafire.com/images/backgrounds/download/additional_content/world.svg",
        region: "https://static.mediafire.com/images/backgrounds/download/additional_content/" + $('div.DLExtraInfo-uploadLocationRegion').attr('data-lazyclass') + ".svg",
      },
      repair: $('a.retry').attr('href'),
    };
    
    return {
      status: 200,
      author: "Yudzxml",
      data: { result }
    };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allow GET method
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers
  
  const { method } = req;
  if (method === 'GET') {
    const { url } = req.query; 
    if (!url) {
      return res.status(400).json({ error: 'URL tidak valid. Pastikan URL yang diberikan benar.' });
    }

    const result = await mediaFire(url);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(result.status).json(result);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
};