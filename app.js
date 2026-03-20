const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello from CI/CD Pipeline! - Automated Deploy v2');
});

// Only start the server if this file is run directly
// not when it is imported by the test file
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
  });
}

module.exports = app;