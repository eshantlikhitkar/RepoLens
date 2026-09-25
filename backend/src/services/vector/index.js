const { MongoVectorStore } = require('./mongoVectorStore');

let defaultVectorStore = null;

function getVectorStore() {
  if (!defaultVectorStore) {
    defaultVectorStore = new MongoVectorStore();
  }
  return defaultVectorStore;
}

module.exports = {
  getVectorStore,
  MongoVectorStore,
};
