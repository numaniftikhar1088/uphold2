const cache = new Map();
const TTL = 60000; // 60 seconds

const setPrice = (symbol, price) => {
  cache.set(symbol, { price, timestamp: Date.now() });
};

const getPrice = (symbol) => {
  const entry = cache.get(symbol);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) return null;
  return entry.price;
};

const getStalePrice = (symbol) => {
  const entry = cache.get(symbol);
  return entry ? entry.price : null;
};

module.exports = { setPrice, getPrice, getStalePrice };
