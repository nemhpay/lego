const avenuedelabrique = require('./avenuedelabrique');

async function main() {
    const url = 'https://www.avenuedelabrique.com/promotions-et-bons-plans-lego';
    const deals = await avenuedelabrique.scrape(url);

    console.log("Résultats :");
    console.log(deals);
}

main();
