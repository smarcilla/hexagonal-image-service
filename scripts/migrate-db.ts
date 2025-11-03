import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'image_service';

async function migrate() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');

    const db = client.db(DB_NAME);

    // Create tasks collection with indexes
    console.log('Creating tasks collection indexes...');
    const tasksCollection = db.collection('tasks');

    await tasksCollection.createIndex({ _id: 1 });
    await tasksCollection.createIndex({ status: 1 });
    await tasksCollection.createIndex({ createdAt: -1 });
    await tasksCollection.createIndex({ updatedAt: -1 });

    // Create images collection with indexes
    console.log('Creating images collection indexes...');
    const imagesCollection = db.collection('images');

    await imagesCollection.createIndex({ _id: 1 });
    await imagesCollection.createIndex({ taskId: 1 }); // Índice para joins
    await imagesCollection.createIndex({ md5: 1 });
    await imagesCollection.createIndex({ timestamp: -1 });
    await imagesCollection.createIndex({ resolution: 1 });

    console.log('Migration completed successfully!');
    console.log('Indexes created:');
    console.log('  tasks: _id (unique), status, createdAt, updatedAt');
    console.log('  images: _id (unique), taskId, md5, timestamp, resolution');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

migrate();
