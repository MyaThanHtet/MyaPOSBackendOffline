const list = async (Model, filter, sort) => {
  return Model.find(filter).sort(sort);
};

const upsert = async (Model, filter, data) => {
  return Model.findOneAndUpdate(filter, data, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });
};

const remove = async (Model, filter) => {
  return Model.findOneAndDelete(filter);
};

const update = async (Model, filter, data) => {
  return Model.findOneAndUpdate(filter, data, { new: true });
};

module.exports = {
  list,
  upsert,
  remove,
  update
};
