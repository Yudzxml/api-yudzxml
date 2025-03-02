const axios = require('axios');

async function fetchYouTubeVideoInfo(url, format = 'mp3') {
    const headers = {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referer": "https://id.ytmp3.mobi/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    };

    try {
        const initialResponse = await axios.get(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers });
        if (initialResponse.status !== 200) throw new Error('Failed to fetch initial data');
        
        const init = initialResponse.data;

        const id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?/]+)/)?.[1];
        if (!id) throw new Error('Invalid YouTube URL');

        // Set format to the provided format (mp3 or mp4)
        let convertURL = `${init.convertURL}&v=${id}&f=${format}&_=${Math.random()}`;

        const convertResponse = await axios.get(convertURL, { headers });
        if (convertResponse.status !== 200) throw new Error('Failed to fetch conversion data');

        const convert = convertResponse.data;

        let info = {};
        for (let i = 0; i < 3; i++) {
            const progressResponse = await axios.get(convert.progressURL, { headers });
            if (progressResponse.status !== 200) throw new Error('Failed to fetch progress data');

            info = progressResponse.data;
            if (info.progress === 3) break;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before the next check
        }

        const result = {
            url: convert.downloadURL,
            title: info.title
        };

        return {
            status: 200,
            author: 'Yudzxml',
            data: result
        }; // Return the result
    } catch (error) {
        throw error; // Rethrow the error if needed
    }
}

// Middleware untuk API
module.exports = (req, res) => {  
res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allow GET method
res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers
    const { method } = req;
    if (method === 'GET') {
        const { url, format } = req.query; // Mengambil parameter dari query string
        if (!url) {
            return res.status(400).json({ error: 'URL tidak valid. Pastikan URL Yang diberikan Benar!!' });
        }

        // Validasi format
        const validFormats = ['mp3', 'mp4'];
        if (format && !validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({ error: `Format tidak valid. Pilih salah satu dari: ${validFormats.join(', ')}` });
        }

        fetchYouTubeVideoInfo(url, format ? format.toLowerCase() : 'mp3') // Default to mp3 if no format is provided
            .then(data => res.status(200).json(data))
            .catch(err => res.status(500).json({ error: err.message }));
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};
