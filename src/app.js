const express = require('express');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { ApiError } = require('./utils/errors');
const { setupSwagger } = require('./config/swagger');
const { frontendBuildDir } = require('./config/env');
const cors = require('cors');
const dbRoutes = require('./routes/dbRoutes');

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors());
app.use(requestLogger);

setupSwagger(app);

app.use('/db', dbRoutes);
app.use('/api/db', dbRoutes);
app.use('/api', routes);

const resolvedFrontendDir = frontendBuildDir ? path.resolve(frontendBuildDir) : '';
const frontendIndexFile = resolvedFrontendDir
  ? path.join(resolvedFrontendDir, 'index.html')
  : '';
const hasFrontendBuild = frontendIndexFile && fs.existsSync(frontendIndexFile);

if (hasFrontendBuild) {
  app.use(express.static(resolvedFrontendDir));

  // Keep API and DB routes untouched while supporting SPA deep links.
  app.get(/^\/(?!api(?:\/|$)|db(?:\/|$)).*/, (_req, res) => {
    res.sendFile(frontendIndexFile);
  });
}

app.use((req, res, next) => {
  next(new ApiError('NOT_FOUND', 'Not Found', 404));
});

app.use(errorHandler);

module.exports = app;
