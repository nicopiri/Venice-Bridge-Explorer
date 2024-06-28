// mapUtils.js

import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";

const initializeMap = (mapRef, setBridges, setSelectedBridge, setBridgeImages, highlightGraphicRef, mapViewRef, loadBridgeImages) => {
  const webmap = new WebMap({
    portalItem: {
      id: "4ea81c99765144f6a522ecfa429518e0"
    }
  });

  const view = new MapView({
    container: mapRef.current,
    map: webmap,
    center: [12.3155, 45.4408], // Coordinates for Venice
    zoom: 13, // Appropriate zoom level for city view
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
          const query = featureLayer.createQuery();
          query.objectIds = [graphicHit.graphic.attributes.ObjectId];
          query.outFields = ["birth_certificate_birthID", "data_Bridge_Name", "data_History"];

          try {
            const queryResult = await featureLayer.queryFeatures(query);

            if (queryResult.features.length > 0) {
              const feature = queryResult.features[0];
              const selectedBridgeInfo = {
                id: feature.attributes.birth_certificate_birthID,
                name: feature.attributes.data_Bridge_Name,
                description: feature.attributes.data_History
              };
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
                geometry: feature.geometry,
                symbol: markerSymbol
              });

              view.graphics.add(pointGraphic);
              highlightGraphicRef.current = pointGraphic;

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
};

export default initializeMap;
