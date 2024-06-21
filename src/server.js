// node server.js

const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const app = express();
const port = 5000;

// Configura AWS SDK con le tue credenziali e regione
AWS.config.update({
  accessKeyId: env.accessKeyId,
  secretAccessKey:  env.secretAccessKey,
  region: env.location// es. 'eu-north-1'
});

const s3 = new AWS.S3();

// Configura multer per gestire l'upload su S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'venicebridges', // Nome del tuo bucket S3
    acl: 'public-read', // Imposta le autorizzazioni per il file
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname); // Imposta il nome del file nel bucket
    }
  })
});

// Endpoint API per il caricamento dell'immagine
app.post('/api/upload', upload.single('image'), (req, res) => {
  res.json({ imageUrl: req.file.location }); // Invia l'URL dell'immagine caricata come risposta
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server API avviato su http://localhost:${port}`);
});
