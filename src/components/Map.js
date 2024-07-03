import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import AWS from 'aws-sdk';
import axios from 'axios';
import WebMap from "@arcgis/core/WebMap";
import MapComponentUI from './MapComponentUI';

const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const region = process.env.REACT_APP_AWS_REGION;


const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

function MapComponent() {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [bridgeImages, setBridgeImages] = useState([]);
  const [userIP, setUserIP] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [bridges, setBridges] = useState([]);
  const [adminSelectedBridge, setAdminSelectedBridge] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const highlightGraphicRef = useRef(null);
  const mapViewRef = useRef(null);
  const mapRef = useRef(null);

  const initializeMap = useCallback(() => {
    const webmap = new WebMap({
      portalItem: {
        id: "4ea81c99765144f6a522ecfa429518e0"
      }
    });
  
    const view = new MapView({
      container: mapRef.current,
      map: webmap,
      center: [12.3350, 45.4350], // Coordinates for Venice
      zoom: 14, // Appropriate zoom level for city view
      popup: {
        defaultPopupTemplateEnabled: false
      }
    });
  
    mapViewRef.current = view;
  
    view.when(() => {
      const featureLayer = webmap.layers.find(layer => layer.type === "feature");
  
      if (featureLayer) {
        featureLayer.queryFeatures().then(result => {
          const bridgeData = result.features.map(feature => ({
            id: feature.attributes.birth_certificate_birthID,
            name: feature.attributes.data_Bridge_Name
          }));
          bridgeData.sort((a, b) => a.name.localeCompare(b.name));
          setBridges(bridgeData);
        });
  
        featureLayer.highlightOptions = { color: [0, 0, 0, 0], fillOpacity: 0 };
  
        view.on("click", async (event) => {
          const featureLayer = view.map.layers.find(layer => layer.type === "feature");
  
          const { results } = await view.hitTest(event);
  
          const graphicHit = results.find(result => result.graphic.layer === featureLayer);
  
          if (graphicHit) {
            // Usa l'ObjectId per eseguire una query e ottenere tutti gli attributi
            const query = featureLayer.createQuery();
            query.objectIds = [graphicHit.graphic.attributes.ObjectId];
            query.outFields = ["birth_certificate_birthID", "data_Bridge_Name", "data_History", "data_Latitude", "data_Longitude"];
  
            try {
              const queryResult = await featureLayer.queryFeatures(query);
  
              if (queryResult.features.length > 0) {
                const feature = queryResult.features[0];
  
                const selectedBridgeInfo = {
                  id: feature.attributes.birth_certificate_birthID,
                  name: feature.attributes.data_Bridge_Name,
                  description: feature.attributes.data_History,
                  latitude: feature.attributes.data_Latitude,
                  longitude: feature.attributes.data_Longitude,
                  url: 'https://www.google.com/maps/embed?pb=!4v1625024000000!6m8!1m7!1sAF1QipNMrUOxK8HslcNX_Mjj8U8TE1V1yKJOJgIHrjmR!2m2!1d41.8902102!2d12.4922309!3f200.73!4f0!5f0.8'
                  //url : `//www.google.com/maps/@?api=1&map_action=pano&viewpoint=${feature.attributes.data_Latitude},${feature.attributes.data_Longitude}`
                };
  
                setSelectedBridge(selectedBridgeInfo);
                // Rimuovi eventuali grafiche di evidenziazione precedenti
                if (highlightGraphicRef.current) {
                  view.graphics.remove(highlightGraphicRef.current);
                }
  
                // Definisci il simbolo del marker con un'immagine
                const markerSymbol = {
                  type: "picture-marker",
                  url: "/outlined_bridge.png",  // Percorso relativo alla root del server
                  width: "65px",  // Imposta la larghezza desiderata
                  height: "40px"  // Imposta l'altezza desiderata
                };
  
                const pointGraphic = new Graphic({
                  geometry: feature.geometry,
                  symbol: markerSymbol
                });
  
                view.graphics.add(pointGraphic);
                highlightGraphicRef.current = pointGraphic;
  
                // Centra la vista sul ponte selezionato
                view.goTo({ target: feature.geometry, zoom: view.zoom });
  
                loadBridgeImages(feature.attributes.birth_certificate_birthID);
              } else {
                console.log("No features found in query result");
              }
            } catch (error) {
              console.error("Error querying feature details:", error);
            }
          } else {
            console.log("No valid graphic hit");
            setSelectedBridge(null);
            setBridgeImages([]);
            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
              highlightGraphicRef.current = null;
            }
          }
        });
      } else {
        console.error("Feature layer not found in the web map");
      }
    });
  }, []);
  
  

  useEffect(() => {
    initializeMap();

    axios.get('https://api.ipify.org?format=json')
      .then(response => {
        setUserIP(response.data.ip);
      })
      .catch(error => {
        console.error('Error fetching user IP:', error);
      });
  }, [initializeMap]);


  const loadBridgeImages = async (bridgeID) => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    const listParams = {
      Bucket: 'venicebridges',
      Prefix: `${bridgeID}_image`
    };

    try {
      const { Contents } = await s3.listObjectsV2(listParams).promise();
      const imageNames = Contents.map(item => item.Key);
      const images = imageNames.map(image => ({
        url: `https://venicebridges.s3.eu-north-1.amazonaws.com/${image}`,
        alt: `${bridgeID} Image`
      }));
      setBridgeImages(images);
    } catch (err) {
      console.error('There was an error loading images: ', err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedBridge || !userIP) return;

    const currentDate = new Date().toISOString().split('T')[0];
    const uploadKey = `upload_${userIP}_${selectedBridge.id}`;

    let uploadData;
    try {
      uploadData = JSON.parse(localStorage.getItem(uploadKey)) || {};
    } catch (e) {
      uploadData = {};
    }
    const { date, count } = uploadData;

    if (date === currentDate && count >= 4) {
      alert('You can only upload up to 4 images per bridge per day.');
      return;
    }

    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: `pending_${selectedBridge.id}_image`
      }).promise();
      const imageCount = Contents.length + 1;
      const newFileName = `pending_${selectedBridge.id}_image${imageCount}.jpg`;

      const uploadParams = {
        Bucket: 'venicebridges',
        Key: newFileName,
        Body: file
      };

      await s3.upload(uploadParams).promise();
      alert('File uploaded successfully! It will be reviewed by an admin.');

      const newCount = date === currentDate ? count + 1 : 1;
      localStorage.setItem(uploadKey, JSON.stringify({ date: currentDate, count: newCount }));
    } catch (err) {
      console.error('There was an error uploading your file: ', err.message);
    }
  };

  const handleAdminLogin = () => {
    const username = prompt('Enter admin username:');
    const password = prompt('Enter admin password:');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      loadPendingImages();
    } else {
      alert('Invalid credentials');
    }
  };

  const loadPendingImages = async () => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: 'pending_'
      }).promise();

      const pendingImages = Contents.map(item => ({
        key: item.Key,
        url: `https://venicebridges.s3.eu-north-1.amazonaws.com/${item.Key}`
      }));

      setPendingImages(pendingImages);
    } catch (err) {
      console.error('Error loading pending images:', err);
    }
  };

  const handleImageApproval = async (imageKey, approved) => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });
  
    try {
      if (approved) {
        // Extract the bridge ID from the image key
        const bridgeId = imageKey.split('_')[1];
        
        // Get the current list of images for this bridge
        const { Contents } = await s3.listObjectsV2({
          Bucket: 'venicebridges',
          Prefix: `${bridgeId}_image`
        }).promise();
  
        // Calculate the new image number
        const imageCount = Contents.length + 1;
        
        // Create the new key with the correct enumeration
        const newKey = `${bridgeId}_image${imageCount}.jpg`;
  
        // Copy the object with the new key
        await s3.copyObject({
          Bucket: 'venicebridges',
          CopySource: `venicebridges/${imageKey}`,
          Key: newKey
        }).promise();
      }
  
      // Delete the pending image
      await s3.deleteObject({
        Bucket: 'venicebridges',
        Key: imageKey
      }).promise();
  
      loadPendingImages();
    } catch (err) {
      console.error('Error handling image approval:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const showUserLocation = () => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let { latitude, longitude } = position.coords;
  
            const newLocation = { latitude, longitude };
            setUserLocation(newLocation);
            
            if (mapViewRef.current) {
              const point = {
                type: "point",
                longitude: longitude,
                latitude: latitude
              };
  
              const markerSymbol = {
                type: "picture-marker",  // Cambia il tipo a "picture-marker"
                url: "/mask_marker.png",  // Sostituisci con il percorso dell'immagine PNG
                width: "40px",  // Imposta la larghezza desiderata
                height: "45px"  // Imposta l'altezza desiderata
              };
  
              const userLocationGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol
              });
  
              mapViewRef.current.graphics.removeAll();
              mapViewRef.current.graphics.add(userLocationGraphic);
              mapViewRef.current.center = [longitude, latitude];
              mapViewRef.current.zoom = 15;
            }
            resolve(newLocation);
          },
          (error) => {
            console.error("Errore nel recupero della posizione dell'utente:", error);
            alert("Impossibile recuperare la tua posizione. Assicurati di aver concesso il permesso di accesso alla tua posizione.");
            reject(error);
          }
        );
      } else {
        alert("La geolocalizzazione non è supportata dal tuo browser.");
        reject(new Error("Geolocation not supported"));
      }
    });
  };
  

  const findNearestBridge = async () => {
    try {
      let location = userLocation;
      if (!location) {
        location = await showUserLocation();
      }
  
      if (!location) {
        throw new Error("Impossibile ottenere la posizione dell'utente");
      }
  
      const featureLayer = mapViewRef.current.map.layers.getItemAt(0);
      const query = featureLayer.createQuery();
      query.outFields = ["birth_certificate_birthID", "data_Bridge_Name", "data_History"];
      query.returnGeometry = true;
  
      const results = await featureLayer.queryFeatures(query);
      let nearestBridge = null;
      let shortestDistance = Infinity;
  
      results.features.forEach(feature => {
        const bridgeLat = feature.geometry.latitude;
        const bridgeLon = feature.geometry.longitude;
        const distance = calculateDistance(
          location.latitude, location.longitude,
          bridgeLat, bridgeLon
        );
  
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestBridge = feature;
        }
      });
  
      if (nearestBridge) {
        setSelectedBridge({
          id: nearestBridge.attributes.birth_certificate_birthID,
          name: nearestBridge.attributes.data_Bridge_Name,
          description: nearestBridge.attributes.data_History
        });
  
        if (highlightGraphicRef.current) {
          mapViewRef.current.graphics.remove(highlightGraphicRef.current);
        }
  
              const markerSymbol = {
                type: "picture-marker",  // Cambia il tipo a "picture-marker"
                url: "/outlined_bridge.png",  // Sostituisci con il percorso dell'immagine PNG
                width: "65px",  // Imposta la larghezza desiderata
                height: "40px"  // Imposta l'altezza desiderata
              };
  
        const pointGraphic = new Graphic({
          geometry: nearestBridge.geometry,
          symbol: markerSymbol
        });
  
        mapViewRef.current.graphics.add(pointGraphic);
        highlightGraphicRef.current = pointGraphic;
  
        mapViewRef.current.center = [nearestBridge.geometry.longitude, nearestBridge.geometry.latitude];
        mapViewRef.current.zoom = 16;
  
        loadBridgeImages(nearestBridge.attributes.birth_certificate_birthID);
      } else {
        alert("Nessun ponte trovato nelle vicinanze.");
      }
    } catch (error) {
      console.error("Errore nel trovare il ponte più vicino:", error);
      alert("Si è verificato un errore nel trovare il ponte più vicino. Per favore, riprova.");
    }
  };


  const handleAdminFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !adminSelectedBridge) return;

    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: `${adminSelectedBridge}_image`
      }).promise();

      const imageCount = Contents.length + 1;
      const newFileName = `${adminSelectedBridge}_image${imageCount}.jpg`;

      const uploadParams = {
        Bucket: 'venicebridges',
        Key: newFileName,
        Body: file
      };

      await s3.upload(uploadParams).promise();
      alert('File uploaded successfully!');
    } catch (err) {
      console.error('There was an error uploading your file: ', err.message);
    }
  };

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setAdminSelectedBridge(null);
    setTimeout(() => {
      initializeMap();
    }, 0);
  }, [initializeMap]);

  const decodeHtmlEntities = (text) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };
  
  const italianCharMap = {
    'Ã ': 'à',
    'Ã¨': 'è',
    'Ã©': 'é',
    'Ã¬': 'ì',
    'Ã²': 'ò',
    'Ã¹': 'ù',
    'Ã€': 'À',
    'Ãˆ': 'È',
    'Ã‰': 'É',
    'ÃŒ': 'Ì',
    'Ã':  'Ò',
    'Ã™': 'Ù'
    // Aggiungi altri mapping se necessario
  };
  
  const sanitizeText = (text) => {
    console.log('Raw text:', text); // Log del testo raw
  
    // Decodifica le entità HTML
    let decodedText = decodeHtmlEntities(text);
  
    // Sostituisci i caratteri problematici
    Object.keys(italianCharMap).forEach(key => {
      decodedText = decodedText.replace(new RegExp(key, 'g'), italianCharMap[key]);
    });
  
    // Sostituisci i punti interrogativi rimanenti con spazi
    decodedText = decodedText.replace('�', ' ');
  
    console.log('Processed text:', decodedText); // Log del testo elaborato
  
    return decodedText;
  };
  
  return (
    <MapComponentUI
      mapRef={mapRef}
      bridges={bridges}
      selectedBridge={selectedBridge}
      bridgeImages={bridgeImages}
      isAdmin={isAdmin}
      pendingImages={pendingImages}
      handleFileUpload={handleFileUpload}
      handleAdminLogin={handleAdminLogin}
      handleImageApproval={handleImageApproval}
      adminSelectedBridge={adminSelectedBridge}
      setAdminSelectedBridge={setAdminSelectedBridge}
      sanitizeText={sanitizeText}
      showUserLocation= {showUserLocation}
      findNearestBridge= {findNearestBridge}
      handleAdminLogout = {handleAdminLogout}
      handleAdminFileUpload = {handleAdminFileUpload}
    />
  );
}

export default MapComponent;