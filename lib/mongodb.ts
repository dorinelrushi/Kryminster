import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const uri = process.env.MONGODB_URI as string;

// Use a global variable so the connection is reused across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

export async function getVotesCollection() {
  await client.connect();
  return client.db().collection('votes');
}

export async function getCommentsCollection() {
  await client.connect();
  return client.db().collection('comments');
}
