import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const bucketName = 'nome-del-tuo-bucket';
const region = 'regione-del-tuo-bucket';
const accessKeyId = 'il-tuo-access-key-id';
const secretAccessKey = 'il-tuo-secret-access-key';

// Configurazione di AWS
AWS.config.update({
  region: region,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});

const s3 = new AWS.S3();

function AdminPage() {
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingImages();
  }, []);

  const fetchPendingImages = async () => {
    setLoading(true);
    const params = {
      Bucket: bucketName,
      Prefix: 'pending/'
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      const images = data.Contents.map(item => ({
        key: item.Key,
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${item.Key}`
      }));
      setPendingImages(images);
    } catch (error) {
      console.error('Errore durante il recupero delle immagini in attesa:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveImage = async (image) => {
    const sourceKey = image.key;
    const destinationKey = image.key.replace('pending/', '');

    try {
      // Copia l'immagine dalla cartella pending alla cartella principale
      await s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourceKey}`,
        Key: destinationKey,
        ACL: 'public-read'
      }).promise();

      // Elimina l'immagine dalla cartella pending
      await s3.deleteObject({
        Bucket: bucketName,
        Key: sourceKey
      }).promise();

      alert('Immagine approvata con successo.');
      fetchPendingImages();
    } catch (error) {
      console.error('Errore durante l\'approvazione dell\'immagine:', error);
      alert('Si è verificato un errore durante l\'approvazione dell\'immagine.');
    }
  };

  const rejectImage = async (image) => {
    const sourceKey = image.key;

    try {
      // Elimina l'immagine dalla cartella pending
      await s3.deleteObject({
        Bucket: bucketName,
        Key: sourceKey
      }).promise();

      alert('Immagine rifiutata e rimossa con successo.');
      fetchPendingImages();
    } catch (error) {
      console.error('Errore durante il rifiuto dell\'immagine:', error);
      alert('Si è verificato un errore durante il rifiuto dell\'immagine.');
    }
  };

  return (
    <div>
      <h2>Immagini in attesa di approvazione</h2>
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <div>
          {pendingImages.length === 0 ? (
            <p>Nessuna immagine in attesa di approvazione.</p>
          ) : (
            pendingImages.map((image, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <img src={image.url} alt={`Pending ${index}`} style={{ maxWidth: '100%' }} />
                <button onClick={() => approveImage(image)}>Approva</button>
                <button onClick={() => rejectImage(image)}>Rifiuta</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
