const axios = require("axios");
const cheerio = require("cheerio");
const PDFDocument = require("pdfkit");

function h2k(integer) {
    let numb = parseInt(integer);
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
    }).format(numb);
}

async function toPDF(images, opt = {}) {
    return new Promise(async (resolve, reject) => {
        if (!Array.isArray(images)) images = [images];
        let buffs = [],
            doc = new PDFDocument({
                margin: 0
            });

        for (let x = 0; x < images.length; x++) {
            if (/.webp|.gif/.test(images[x])) continue;
            try {
                let data = (await axios.get(images[x], {
                    responseType: 'arraybuffer',
                    ...opt
                })).data;
                let image = doc.openImage(data);
                doc.addPage({
                    size: [image.width, image.height]
                });
                doc.image(data, 0, 0, {
                    width: image.width,
                    height: image.height
                });
            } catch (error) {
                continue;
            }
        }
        doc.on('data', (chunk) => buffs.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffs)));
        doc.on('error', (err) => reject(err));
        doc.end();
    });
}

class Komiku {
    async latest() {
        return new Promise(async (resolve, reject) => {
            await axios.get("https://komiku.id").then((a) => {
                let $ = cheerio.load(a.data);
                let array = [];
                $("#Terbaru .ls4w .ls4").each((a, i) => {
                    let url = "https://komiku.id/" + $(i).find("a").attr("href");
                    let title = $(i).find(".ls4j h3 a").text().trim();
                    let release = $(i).find(".ls4j .ls4s").text().trim().split(" ").slice(2).join(' ').trim();
                    let chapter = $(i).find(".ls4j .ls24").text().trim().split("Chapter")[1].trim();
                    let thumbnail = $(i).find(".lazy").attr("data-src").split("?")[0].trim();
                    array.push({
                        title,
                        release,
                        chapter,
                        thumbnail,
                        url
                    });
                });
                resolve({
                    status: 200,
                    author: "Yudzxml",
                    data: array
                });
            }).catch((error) => {
                reject({
                    status: 500,
                    author: "Yudzxml",
                    error: error.message
                });
            });
        });
    }

    async detail(url) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(url);
                const $ = cheerio.load(response.data);

                let result = {
                    metadata: {},
                    chapter: []
                };

                $("#Informasi").each((a, i) => {
                    $(i).find(".inftable tr").each((u, e) => {
                        let name = $(e).find("td").eq(0).text().split(" ").join("_").toLowerCase().trim();
                        let value = $(e).find("td").eq(1).text().trim();
                        result.metadata[name] = value;
                    });
                    result.metadata.thumbnail = $(i).find("img").attr("src").split("?")[0].trim();
                });
                result.metadata.sinopsis = $("#Judul .desc").text().trim();
                $("#Daftar_Chapter tbody tr").each((a, i) => {
                    let chapter = $(i).find(".judulseries a span").text();
                    let reader = h2k(Number($(i).find(".pembaca i").text().trim()));
                    let released = $(i).find(".tanggalseries").text().trim();
                    let url = "https://komiku.id/" + $(i).find(".judulseries a").attr("href");
                    if (!chapter) return;
                    result.chapter.push({
                        chapter,
                        reader,
                        released,
                        url
                    });
                });
                resolve({
                    status: 200,
                    author: "Yudzxml",
                    data: result
                });
            } catch (error) {
                reject({
                    status: 500,
                    author: "Yudzxml",
                    error: error.message
                });
            }
        });
    }

    async chapter(url) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(url);
                const $ = cheerio.load(response.data);
                let images = $("#Baca_Komik img").map((a, i) => $(i).attr("src")).get();
                let result = {
                    metadata: {},
                    buffer: {}
                };
                $(".tbl tbody tr").each((u, e) => {
                    let name = $(e).find("td").eq(0).text().split(" ").join("_").toLowerCase().trim();
                    let value = $(e).find("td").eq(1).text().trim();
                    result.metadata[name] = value;
                });
                result.buffer = await toPDF(images);
                resolve({
                    status: 200,
                    author: "Yudzxml",
                    data: result
                });
            } catch (error) {
                reject({
                    status: 500,
                    author: "Yudzxml",
                    error: error.message
                });
            }
        });
    }

    async search(q) {
        return new Promise(async (resolve, reject) => {
            await axios.get(`https://api.komiku.id/?post_type=manga&s=${q}`).then((a) => {
                let $ = cheerio.load(a.data);
                let array = [];
                $(".bge").each((a, i) => {
                    let title = $(i).find(".kan a h3").text().trim();
                    let url = "https://komiku.id" + $(i).find(".kan a").attr("href");
                    let thumbnail = $(i).find(".bgei img").attr("src").split("?")[0].trim();
                    let synopsis = $(i).find(".kan p").text().trim().split(".")[1].trim();
                    array.push({
                        title,
                        thumbnail,
                        synopsis,
                        url
                    });
                });
                resolve({
                    status: 200,
                    author: "Yudzxml",
                    data: array
                });
            }).catch((error) => {
                reject({
                    status: 500,
                    author: "Yudzxml",
                    error: error.message
                });
            });
        });
    }
}

// API Handler
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allow GET method
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

    const { method } = req;
    const komiku = new Komiku();

    if (method === 'GET') {
        const { action, url, query } = req.query;
        try {
            let result;
            if (action === 'latest') {
                result = await komiku.latest();
            } else if (action === 'detail') {
                if (!url) {
                    return res.status(400).json({ status: 400, author: "Yudzxml", error: 'URL tidak valid. Pastikan URL yang diberikan benar.' });
                }
                result = await komiku.detail(url);
            } else if (action === 'chapter') {
                if (!url) {
                    return res.status(400).json({ status: 400, author: "Yudzxml", error: 'URL tidak valid. Pastikan URL yang diberikan benar.' });
                }
                result = await komiku.chapter(url);
            } else if (action === 'search') {
                if (!query) {
                    return res.status(400).json({ status: 400, author: "Yudzxml", error: 'Query tidak valid. Pastikan query yang diberikan benar.' });
                }
                result = await komiku.search(query);
            } else {
                return res.status(400).json({ status: 400, author: "Yudzxml", error: 'Aksi tidak valid.' });
            }
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({ status: 500, author: "Yudzxml", error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
};