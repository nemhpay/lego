const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://nemhpay:KgvyuYrFt9kosjZ4@myfirstcluster.2vihi.mongodb.net/?retryWrites=true&w=majority&appName=MyFirstCluster';
const MONGODB_DB_NAME = 'lego';

async function connectToDatabase() {
    console.log("Tentative de connexion à MongoDB...");

    try {
        const client = await MongoClient.connect(MONGODB_URI);
        console.log("Connecté à MongoDB !");
        
        const db = client.db(MONGODB_DB_NAME);
        return { client, db };
    } catch (error) {
        console.error("Erreur de connexion :", error.message);
        process.exit(1);
    }
}


module.exports = connectToDatabase; // <--- Assure-toi que c'est bien comme ça

async function insertDeals() {
    const { client, db } = await connectToDatabase();

    try {
        const deals = []; // Ajoute ici les données que tu veux insérer
        const collection = db.collection('deals');

        if (deals.length === 0) {
            console.log("Aucune donnée à insérer.");
            return;
        }

        const result = await collection.insertMany(deals);
        console.log("Insertion réussie :", result.insertedCount, "documents insérés.");
    } catch (error) {
        console.error("Erreur lors de l'insertion :", error.message);
    } finally {
        await client.close();
        console.log("Connexion à MongoDB fermée.");
    }
}

insertDeals();
