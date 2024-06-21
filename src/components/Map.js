import React, { useEffect, useState, useRef } from 'react';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import AWS from 'aws-sdk';

function MapComponent() {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [bridgeImages, setBridgeImages] = useState([]);
  const highlightGraphicRef = useRef(null);
  const mapViewRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const map = new Map({
      basemap: 'topo-vector'
    });

    const view = new MapView({
      container: 'mapView',
      map: map,
      center: [12.3155, 45.4408], // Coordinate di Venezia
      zoom: 14,
      popup: {
        defaultPopupTemplateEnabled: false // Disabilita i popup di default
      }
    });

    const featureLayer = new FeatureLayer({
      url: 'https://services7.arcgis.com/BEVijU9IvwRENrmx/arcgis/rest/services/bridges/FeatureServer/0',
      outFields: ['birth_certificate_birthID', 'data_Bridge_Name', 'data_History'] // Campi da recuperare
    });

    map.add(featureLayer);
    mapViewRef.current = view;

    // Aggiungi un gestore di eventi per il clic sulla mappa
    view.on("click", event => {
      view.hitTest(event).then(response => {
        if (response.results.length) {
          const graphic = response.results[0].graphic;
          if (graphic && graphic.attributes && graphic.attributes.birth_certificate_birthID) {
            // Imposta il bridge selezionato nel state
            setSelectedBridge({
              name: graphic.attributes.data_Bridge_Name,
              description: graphic.attributes.data_History
            });

            // Rimuovi il segnalino esistente
            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
            }

            // Aggiungi un nuovo segnalino
            const markerSymbol = {
              type: "simple-marker",
              color: [226, 119, 40],  // arancione
              outline: {
                color: [255, 255, 255],  // bianco
                width: 2
              }
            };

            const pointGraphic = new Graphic({
              geometry: graphic.geometry,
              symbol: markerSymbol
            });

            view.graphics.add(pointGraphic);
            highlightGraphicRef.current = pointGraphic;

            // Carica le immagini relative al ponte selezionato da S3
            loadBridgeImages(graphic.attributes.birth_certificate_birthID);
          } else {
            // Resetta il ponte selezionato se nessun ponte valido è stato selezionato
            setSelectedBridge(null);
            setBridgeImages([]);
            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
              highlightGraphicRef.current = null;
            }
          }
        }
      });
    });

  }, []);

  // Funzione per caricare le immagini relative al ponte da Amazon S3
  const loadBridgeImages = (bridgeID) => {
    // Esempio di URL del bucket Amazon S3
    const bucketUrl = 'https://venicebridges.s3.eu-north-1.amazonaws.com/';

    // Lista di nomi file immagini
    const imageNames = [
      `${bridgeID}_image1.jpg`,
      `${bridgeID}_image2.jpg`
      // Aggiungi altri nomi file se necessario
    ];

    // Crea URL completi per le immagini
    const images = imageNames.map(image => ({
      url: `${bucketUrl}${image}`,
      alt: `${bridgeID} Image`
    }));

    // Imposta le immagini nello stato
    setBridgeImages(images);
  };

  // Funzione per gestire il caricamento del file su S3
  const handleFileUpload = async (event) => {
    event.preventDefault();
    
    // Ottieni il file selezionato dall'input
    const file = fileInputRef.current.files[0];

    // Configura l'oggetto AWS SDK con le credenziali e la regione
    AWS.config.update({
      accessKeyId: EnvironmentCredentials.accessKeyId,
      secretAccessKey: EnvironmentCredentials.secretAccessKey,
      region: EnvironmentCredentials.Location
    });

    // Crea un nuovo oggetto S3
    const s3 = new AWS.S3();

    // Configura i parametri per l'upload
    const params = {
      Bucket: 'venicebridges',
      Key: file.name, // Nome del file nel bucket
      Body: file,
      ACL: 'public-read' // Opzionale: imposta l'accesso del file come pubblico
    };

    try {
      // Esegui l'upload del file su S3
      const data = await s3.upload(params).promise();
      console.log('File uploaded successfully:', data.Location);
      // Puoi gestire qui le operazioni post-upload (ad esempio, aggiornare lo stato del componente, notificare l'utente, etc.)
    } catch (error) {
      console.error('Error uploading file:', error);
      // Gestisci qui gli errori di upload
    }
  }; 

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div id="mapView" style={{ flex: 1 }} />
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f4f4f4', overflowY: 'auto' }}>
        {selectedBridge ? (
          <div>
            <h2>{selectedBridge.name}</h2>
            <p>{selectedBridge.description}</p>
            <div>
              {bridgeImages.length > 0 ? (
                bridgeImages.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.alt}
                    style={{ maxWidth: '100%', marginBottom: '10px' }}
                    onError={(e) => {
                      e.target.onerror = null; // to avoid infinite loop in case "imageerror.png" also fails to load
                      e.target.src = 'imageerror.png'; // fallback image
                    }}
                  />
                ))
              ) : (
                <p>Nessuna immagine disponibile per questo ponte.</p>
              )}
            </div>
            <form onSubmit={handleFileUpload}>
              <input type="file" ref={fileInputRef} />
              <button type="submit">Carica Foto</button>
            </form>
          </div>
        ) : (
          <p>Seleziona un ponte sulla mappa per vedere i dettagli</p>
        )}
      </div>
    </div>
  );
}

export default MapComponent;
