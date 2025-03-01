const fetch = require('node-fetch-commonjs');

const LoveTik = {
    async dapatkan(url) {
        try {
            const response = await fetch('https://lovetik.com/api/ajax/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: `query=${encodeURIComponent(url)}`
            });

            if (!response.ok) {
                throw new Error('Gagal mendapatkan data dari Lovetik');
            }

            const data = await response.json();
            if (!data.images) data.images = [];
            const result = {
                video: [],
                audio: []
            };

            data.links.forEach(item => {
                if (!item.a) return;
                const formatted = {
                    format: item.t.replace(/<.*?>|♪/g, '').trim(), // Menghapus tag HTML dan tanda ♪
                    resolution: item.s || 'Audio Only',
                    link: item.a
                };

                if (item.ft == 1) {
                    result.video.push(formatted);
                } else {
                    result.audio.push(formatted);
                }
            });

            data.render = async () => {
                const rendered = await fetch('https://lovetik.com/api/ajax/convert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    },
                    body: `c_data=${encodeURIComponent(data.links.filter(m => m.c)[0]?.c || '')}`
                });
                return rendered.json();
            }

            return {
                "status": 200,
                "author": "Yudzxml",
                "data": { ...data, ...result }
         }
        } catch (error) {
            console.error(error);
            throw new Error('Terjadi kesalahan saat memproses permintaan');
        }
    }
};

module.exports = async (req, res) => {
    const { method } = req;
    if (method === 'GET') {
        const { url } = req.query; // Mengambil parameter dari query string
        if (!url) {
            return res.status(400).json({ error: 'URL tidak valid. Pastikan URL YouTube diberikan.' });
        }

        try {
            const data = await LoveTik.dapatkan(url);
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};
