const express = require('express');
// const validateToken = require('./validateToken'); // Path to your validateToken middleware
const app = express();

app.use(express.json());

app.get('/protected-resource', validateToken, (req, res) => {
  res.send('This is a protected resource');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
