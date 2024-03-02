function serializeUint8ArrayObject(obj) {
  return JSON.stringify(obj, (_, value) => {
    if (value instanceof Uint8Array) {
      return Array.from(value);
    }
    return value;
  });
}

function deserializeUint8ArrayObject(serializedObj) {
  return JSON.parse(serializedObj, (_, value) => {
    if (Array.isArray(value)) {
      return new Uint8Array(value);
    }
    return value;
  });
}

module.exports = {
  serializeUint8ArrayObject,
  deserializeUint8ArrayObject,
};
