import React, { useEffect, useState, useRef } from 'react';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import AWS from 'aws-sdk';

const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const region = process.env.REACT_APP_AWS_REGION;

function MapComponent() {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [bridgeImages, setBridgeImages] = useState([]);
  const highlightGraphicRef = useRef(null);
  const mapViewRef = useRef(null);

  useEffect(() => {
    const map = new Map({
      basemap: 'topo-vector'
    });

    const view = new MapView({
      container: 'mapView',
      map: map,
      center: [12.3155, 45.4408],
      zoom: 14,
      popup: {
        defaultPopupTemplateEnabled: false
      }
    });

    const featureLayer = new FeatureLayer({
      url: 'https://services7.arcgis.com/BEVijU9IvwRENrmx/arcgis/rest/services/bridges/FeatureServer/0',
      outFields: ['birth_certificate_birthID', 'data_Bridge_Name', 'data_History']
    });

    map.add(featureLayer);
    mapViewRef.current = view;

    view.on("click", event => {
      view.hitTest(event).then(response => {
        if (response.results.length) {
          const graphic = response.results[0].graphic;
          if (graphic && graphic.attributes && graphic.attributes.birth_certificate_birthID) {
            setSelectedBridge({
              name: graphic.attributes.data_Bridge_Name,
              description: graphic.attributes.data_History
            });

            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
            }

            const markerSymbol = {
              type: "simple-marker",
              color: [226, 119, 40],
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            };

            const pointGraphic = new Graphic({
              geometry: graphic.geometry,
              symbol: markerSymbol
            });

            view.graphics.add(pointGraphic);
            highlightGraphicRef.current = pointGraphic;

            loadBridgeImages(graphic.attributes.birth_certificate_birthID);
          } else {
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

  const loadBridgeImages = (bridgeID) => {
    const bucketUrl = 'https://venicebridges.s3.eu-north-1.amazonaws.com/';
    const imageNames = [
      `${bridgeID}_image1.jpg`,
      `${bridgeID}_image2.jpg`
    ];

    const images = imageNames.map(image => ({
      url: `${bucketUrl}${image}`,
      alt: `${bridgeID} Image`
    }));

    setBridgeImages(images);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    const params = {
      Bucket: 'venicebridges',
      Key: `${selectedBridge.name}/${file.name}`,
      Body: file
    };

    try {
      await s3.upload(params).promise();
      alert('File uploaded successfully!');
      loadBridgeImages(selectedBridge.name);
    } catch (err) {
      console.error('There was an error uploading your file: ', err.message);
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
              {bridgeImages.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt}
                  style={{ maxWidth: '100%', marginBottom: '10px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'imageerror.png';
                  }}
                />
              ))}
            </div>
            <input type="file" onChange={handleFileUpload} />
          </div>
        ) : (
          <p>Seleziona un ponte sulla mappa per vedere i dettagli</p>
        )}
      </div>
    </div>
  );
}

export default MapComponent;
