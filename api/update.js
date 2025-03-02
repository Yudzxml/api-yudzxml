const fetch = require('node-fetch-commonjs');

async function updatebot() {
    let yudz = await fetch(`https://github.com/Yudzxml/Runbot/raw/refs/heads/main/ngokntlm.json`);
    let hasil = await yudz.json();
    let key_script = hasil.key;
    return {
        "status": 200,
        "author": "Yudzxml",
        "data": {
            "message": 'Diharapkan Jangan Menyebar Key Dan Script Tanpa Sepengetahuan Owner',
            "update": "https://github.com/Yudzxml/updatebot/raw/refs/heads/main/Yudzxyz.zip",
            "key": key_script
        }
    };
}

module.exports = async (req, res) => {
    const { method } = req;
    if (method === 'GET') {
        const { key } = req.query; 
        if (key !== 'YUDZXMLDEVX7BOTZ') {
            return res.status(400).json({ error: 'Key tidak valid. Pastikan key yang diberikan benar!! Silahkan Hubungi Owner Untuk Mendapatkan Key.' });
        }

        try {
            const data = await updatebot();
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};