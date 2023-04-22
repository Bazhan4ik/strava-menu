import { MongoClient } from 'mongodb';

main();
async function main() {
    try {
        const client = await MongoClient.connect('mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/?retryWrites=true&w=majority', { });

        const db = client.db('sessionsTest');
        const collection = db.collection('64165120aee6d3942e9b9535');

        const sessions = await collection.deleteMany({});

    } catch (e) {
        throw e;
    }

}