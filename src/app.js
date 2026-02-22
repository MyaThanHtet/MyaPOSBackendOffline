const express = require('express');
const routes = require('./routes');
const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { ApiError } = require('./utils/errors');
const { setupSwagger } = require('./config/swagger');
const cors = require('cors');

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors());
app.use(requestLogger);

setupSwagger(app);

app.use('/api', routes);

app.use((req, res, next) => {
  next(new ApiError('NOT_FOUND', 'Not Found', 404));
});

app.use(errorHandler);

module.exports = app;
