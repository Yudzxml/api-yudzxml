const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');

async function instanav(url) {
    const data = qs.stringify({
        'q': url,
        't': 'media',
        'lang': 'en'
    });

    const config = {
        method: 'POST',
        url: 'https://instanavigation.app/api/ajaxSearch',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'accept-language': 'id-ID',
            'referer': 'https://instanavigation.app/',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
            'origin': 'https://instanavigation.app',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
        },
        data: data
    };

    try {
        const api = await axios.request(config);
        const html = api.data.data;

        const $ = cheerio.load(html);
        const thumbnail = $('.download-items__thumb img').attr('src');

        const downloadUrls = [];
        $('.download-items__btn a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                downloadUrls.push(href);
            }
        });

        const urlParams = new URLSearchParams(downloadUrls[0]?.split('?')[1]); // Ambil filename dari URL pertama
        let filename = urlParams.get('filename');
        if (filename && filename.endsWith('.mp4')) {
            filename = filename.slice(0, -4);
        }

        return {
            status: 200,
            author: "Yudzxml",
            data: {
                title: filename || 'Title not found',
                thumbnail: thumbnail || 'Thumbnail not found',
                downloadUrls: downloadUrls.length > 0 ? downloadUrls : ['Download URL not found']
            }
        };
    } catch (error) {
        throw new Error('Error fetching data from instanavigation: ' + error.message);
    }
}

module.exports = async (req, res) => {
    const { method } = req;
    if (method === 'GET') {
        const { url } = req.query; 
        if (!url) {
            return res.status(400).json({ error: 'URL tidak valid. Pastikan URL Yang diberikan Benar!!.' });
        }

        try {
            const data = await instanav(url);
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};
