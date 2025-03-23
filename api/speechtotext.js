const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');

function generateToken(secretKey) {
    const timestamp = Date.now().toString();
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(timestamp);
    const token = hmac.digest('hex');

    return {
        "x-timestamp": timestamp,
        "x-token": token
    };
}

async function Talknotes(fileUrl) {
    try {
        // Mengunduh file dari URL
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = response.data;

        const fileSizeInBytes = buffer.length;
        const maxSize = 5 * 1024 * 1024;

        if (fileSizeInBytes > maxSize) {
            console.error("File too large. Please upload a file smaller than 5MB.");
            return;
        }

        const form = new FormData();
        form.append('file', buffer, {
            filename: 'file1.mp3',
            contentType: 'audio/mpeg'
        });

        const tokenData = generateToken('w0erw90wr3rnhwoi3rwe98sdfihqio432033we8rhoeiw');
        const headers = {
            ...form.getHeaders(),
            'x-timestamp': tokenData['x-timestamp'],
            'x-token': tokenData['x-token'],
            "authority": "api.talknotes.io",
            "method": "POST",
            "path": "/tools/converter",
            "scheme": "https",
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "origin": "https://talknotes.io",
            "referer": "https://talknotes.io/",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
        };

        const apiResponse = await axios.post('https://api.talknotes.io/tools/converter', form, { headers });
        
        return apiResponse.data;
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { method } = req;

    if (method === 'GET') {
        const { url } = req.query; // Mengambil URL file dari query parameter
        if (!url) {
            return res.status(400).json({ error: 'URL file harus disediakan.' });
        }

        try {
            const data = await Talknotes(url); // Memanggil fungsi Talknotes dengan URL
            return res.status(200).json({ 
                status: 200,
                author: "Yudzxml",
                result: { data }
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};