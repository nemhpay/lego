const axios = require('axios');
const cheerio = require('cheerio');

async function scrape(url) {
    try {
        console.log(`Scraping ${url}...`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const deals = [];

        $('.product').each((index, element) => {
            const title = $(element).find('.product-title a').text().trim();
            const priceText = $(element).find('.price').text().replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(priceText) || 0;

            const discountText = $(element).find('.discount-badge').text().replace(/[^\d]/g, '');
            const discount = discountText ? parseInt(discountText, 10) : 0;

            let link = $(element).find('.product-title a').attr('href');
            link = link ? (link.startsWith('http') ? link : `https://www.avenuedelabrique.com${link}`) : '';

            if (title && price && link) {
                deals.push({ title, price, discount, link });
            }
        });

        console.log(`Deals trouvés : ${deals.length}`);
        return deals;
    } catch (error) {
        console.error("Erreur lors du scraping :", error.message);
        return [];
    }
}

module.exports = { scrape };
