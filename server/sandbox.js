const avenuedelabrique = require('./websites/avenuedelabrique');
const connectToDatabase = require('./database');

async function findBestDiscountDeals(db) {
    return await db.collection('deals').find().sort({ discount: -1 }).limit(10).toArray();
}

async function findMostCommentedDeals(db) {
    return await db.collection('deals').find().sort({ commentsCount: -1 }).limit(10).toArray();
}

async function findDealsSortedByPrice(db, order = 1) {
    return await db.collection('deals').find().sort({ price: order }).toArray();
}

async function findDealsSortedByDate(db, order = -1) {
    return await db.collection('deals').find().sort({ dateAdded: order }).toArray();
}

async function findSalesByLegoSetId(db, legoSetId) {
    return await db.collection('sales').find({ legoSetId }).toArray();
}

async function findRecentSales(db) {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    return await db.collection('sales').find({ scrapedDate: { $gte: threeWeeksAgo } }).toArray();
}

async function main() {
    try {
        const { client, db } = await connectToDatabase();
        if (!db) return;

        const collection = db.collection('deals');

        // **1. Scraper Avenue de la Brique**
        console.log('🕵‍♀ Browsing Avenue de la Brique...');
        const legoDeals = await avenuedelabrique.scrape('https://www.avenuedelabrique.com/nouveautes-lego');
        console.log(`✅ ${legoDeals.length} deals trouvés sur Avenue de la Brique`);

        // **2. Insérer les deals dans MongoDB**
        if (legoDeals.length > 0) {
            const result = await collection.insertMany(legoDeals);
            console.log(`✅ ${result.insertedCount} deals insérés en base de données.`);
        } else {
            console.log("❌ Aucun deal à insérer.");
        }

        // **3. Exécuter les requêtes MongoDB**
        console.log("\n📊 Analyse des données en base...");
        console.log("🔍 Meilleures réductions :", await findBestDiscountDeals(db));
        console.log("💬 Offres les plus commentées :", await findMostCommentedDeals(db));
        console.log("💰 Offres triées par prix :", await findDealsSortedByPrice(db, 1));
        console.log("📅 Offres triées par date :", await findDealsSortedByDate(db));
        console.log("🎯 Ventes du LEGO 42156 :", await findSalesByLegoSetId(db, "42156"));
        console.log("🆕 Ventes récentes :", await findRecentSales(db));

        // **4. Fermer la connexion MongoDB**
        client.close();
        console.log("Connexion fermée.");
    } catch (error) {
        console.error('❌ Erreur lors du scraping :', error);
    }
}

main();
