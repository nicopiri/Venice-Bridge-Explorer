import React, { useEffect, useState, useRef, useCallback } from 'react';
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import AWS from 'aws-sdk';
import axios from 'axios';

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
        id: '4ea81c99765144f6a522ecfa429518e0'
      }
    });

    const view = new MapView({
      container: mapRef.current,
      map: webmap,
      center: [12.3155, 45.4408],
      zoom: 14,
      popup: {
        defaultPopupTemplateEnabled: false
      }
    });

    mapViewRef.current = view;

    webmap.when(() => {
      const featureLayer = webmap.layers.getItemAt(0); // Assuming the feature layer is the first layer
      featureLayer.outFields = ['birth_certificate_birthID', 'data_Bridge_Name', 'data_History'];

      featureLayer.queryFeatures().then(result => {
        const bridgeData = result.features.map(feature => ({
          id: feature.attributes.birth_certificate_birthID,
          name: feature.attributes.data_Bridge_Name
        }));
        bridgeData.sort((a, b) => a.name.localeCompare(b.name));
        setBridges(bridgeData);
      });

      view.on("click", event => {
        console.log("Click event triggered");
        
        view.hitTest(event).then(response => {
          console.log("Hit test response:", response);
      
          const featureLayer = view.map.layers.find(layer => layer.type === "feature");
          console.log("Feature layer:", featureLayer);
      
          // Trova il primo risultato che ha una grafica dal layer delle caratteristiche dei ponti
          const result = response.results.find(result => 
            result.graphic && 
            result.graphic.layer && 
            result.graphic.layer === featureLayer
          );
          console.log("Selected result:", result);
      
          if (result && result.graphic) {
            const graphic = result.graphic;
            console.log("Selected graphic:", graphic);
            console.log("Graphic attributes:", graphic.attributes);
      
            if (graphic.attributes && graphic.attributes.birth_certificate_birthID) {
              const selectedBridgeInfo = {
                id: graphic.attributes.birth_certificate_birthID,
                name: graphic.attributes.data_Bridge_Name,
                description: graphic.attributes.data_History
              };
              console.log("Selected bridge info:", selectedBridgeInfo);
      
              setSelectedBridge(selectedBridgeInfo);
      
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
              console.log("Graphic doesn't have expected attributes");
            }
          } else {
            console.log("No valid result found");
            setSelectedBridge(null);
            setBridgeImages([]);
            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
              highlightGraphicRef.current = null;
            }
          }
        }).catch(error => {
          console.error("Error in hit test:", error);
        });
      });
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
        const newKey = imageKey.replace('pending_', '');
        await s3.copyObject({
          Bucket: 'venicebridges',
          CopySource: `venicebridges/${imageKey}`,
          Key: newKey
        }).promise();
      }

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
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAdminSelectBridge = async (event) => {
    const bridgeID = event.target.value;
    setAdminSelectedBridge(bridgeID);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const selectedBridge = bridges.find(bridge => bridge.id === bridgeID);
        if (selectedBridge) {
          const distance = calculateDistance(latitude, longitude, selectedBridge.latitude, selectedBridge.longitude);
          setUserLocation({ latitude, longitude, distance });
        }
      });
    }
  };

  return (
    <div>
      <div ref={mapRef} style={{ height: '600px', width: '100%' }}></div>

      {selectedBridge && (
        <div>
          <h3>{selectedBridge.name}</h3>
          <p>{selectedBridge.description}</p>
          <input type="file" onChange={handleFileUpload} />
          <div>
            {bridgeImages.map((image, index) => (
              <img key={index} src={image.url} alt={image.alt} style={{ maxWidth: '200px', margin: '10px' }} />
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <h3>Admin Panel</h3>
          <select value={adminSelectedBridge} onChange={handleAdminSelectBridge}>
            {bridges.map((bridge, index) => (
              <option key={index} value={bridge.id}>{bridge.name}</option>
            ))}
          </select>
          <div>
            {pendingImages.map((image, index) => (
              <div key={index}>
                <img src={image.url} alt="Pending" style={{ maxWidth: '200px', margin: '10px' }} />
                <button onClick={() => handleImageApproval(image.key, true)}>Approve</button>
                <button onClick={() => handleImageApproval(image.key, false)}>Reject</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isAdmin && <button onClick={handleAdminLogin}>Admin Login</button>}
    </div>
  );
}

export default MapComponent;
