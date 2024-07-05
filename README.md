# The eccence of Venice Bridge Explorer

In essence, `Venice Bridge Explorer` is a digital homage to the bridges of Venice. It transforms static map data into an engaging, interactive experience that invites users to explore, learn, and contribute. Whether you’re an enthusiast of Venetian history, a casual explorer, or a dedicated researcher, this component offers a unique and valuable perspective on one of the world’s most iconic cities.

Embark on your virtual journey through Venice’s bridges with `WebApp` and discover the stories that span centuries, all brought to life through the synergy of cutting-edge technology and rich cultural heritage.

# Technical Sophistication
Under the hood, `Venice Bridge Explorer` is a testament to modern web development practices. It leverages React’s powerful state management and lifecycle methods, integrates with AWS for seamless data handling, and uses sophisticated mapping technologies from ArcGIS. The result is a component that is not only feature-rich but also robust and scalable.

# MapComponent

## Overview

The `Map.js` is a React component designed to display a map of Venice with features for interacting with bridge data. It uses the ArcGIS API for mapping and AWS S3 for managing bridge images. The component supports functionalities like displaying bridge details, uploading images, admin authentication for approving or rejecting image uploads, and locating the nearest bridge to the user's current position.

## Structure

### State Variables

- `selectedBridge`: Information about the currently selected bridge.
- `bridgeImages`: Images associated with the selected bridge.
- `userIP`: The IP address of the user.
- `isAdmin`: Boolean flag indicating if the user is an admin.
- `pendingImages`: List of images pending approval.
- `bridges`: List of all bridges loaded from the map.
- `adminSelectedBridge`: Bridge selected by the admin for uploading images.
- `userLocation`: The current geographical location of the user.

### Refs

- `highlightGraphicRef`: Reference to the graphic used for highlighting a bridge.
- `mapViewRef`: Reference to the `MapView` instance.
- `mapRef`: Reference to the map container.

### Callbacks and Functions

- `initializeMap`: Initializes the map and sets up event listeners for map interactions.
- `loadBridgeImages`: Loads images for a specific bridge from AWS S3.
- `handleFileUpload`: Handles image uploads from users.
- `handleAdminLogin`: Authenticates the admin user.
- `loadPendingImages`: Loads images pending approval from AWS S3.
- `handleImageApproval`: Approves or rejects pending images.
- `calculateDistance`: Calculates the distance between two geographical points.
- `showUserLocation`: Shows the user's current location on the map.
- `findNearestBridge`: Finds and highlights the nearest bridge to the user's location.
- `handleAdminFileUpload`: Handles image uploads by the admin.
- `handleAdminLogout`: Logs out the admin and reinitializes the map.
- `decodeHtmlEntities`, `sanitizeText`: Utility functions for decoding and sanitizing text.

## Functionality

### Map Initialization

The `initializeMap` function sets up a `WebMap` instance with a `MapView` centered on Venice. It loads bridge data and sets up a click event listener on the map to select bridges and highlight them.

### Image Loading

The `loadBridgeImages` function uses AWS S3 to fetch and display images related to the selected bridge.

### User Interaction

Users can upload images related to bridges, with restrictions on the number of uploads per day. The user's IP address is fetched using `axios`.

### Admin Functionality

Admins can log in using predefined credentials and approve or reject pending image uploads. They can also upload images directly to bridges.

### Geolocation

The component can find and highlight the nearest bridge to the user's current location using the `findNearestBridge` function.

### Text Sanitization

The `sanitizeText` function is used to decode and sanitize text containing special characters.

## UI Component

The `MapComponentUI` is used to render the UI, with props passed down for handling various functionalities like file uploads, admin actions, and map interactions.


### Description of the React Component

The `MapComponentUI` component is designed to provide an interactive user interface for exploring Venice's bridges through a map and additional support features. Here is a detailed overview of its main features and behavior.

#### State
 It uses React's `useState` to manage the width of the right panel and `useEffect` to dynamically adjust the width based on the bridge selection.

#### Layout
- **Header:** Includes the logo and the title "Venice Bridge Explorer," with distinctive styling and a red background.
- **Map:** The main area for the map, referenced by `mapRef`, with dynamic width based on bridge selection.
- **Right Panel:** Shows additional details, images, and upload tools. It expands to 50% width when a bridge is selected and reverts to 20% otherwise.
  - **User View:** If the user is not an admin, it displays information about the selected bridge, including descriptions, images, and a Google Maps Street View. It also includes options to find the nearest bridge, show the user's location, and log in as an admin.
  - **Admin View:** Includes tools for directly uploading images, managing pending images, and options to approve or reject images.

#### Styles and Animations
- **Button Style:** Buttons have a vintage style with red borders and shadows for depth. Smooth transitions enhance the user experience.
- **Footer:** The footer attributes creation to Niccolò Pirillo.

#### Dynamic Behavior
- The width of the right panel changes dynamically based on the `selectedBridge` state.
- Smooth transitions are applied to changes in the map and right panel widths for a pleasant visual experience.

### Component Usage
This component is ideal for applications requiring an interactive map with advanced data visualization and management features, such as exploring and managing bridges in a historic city like Venice. Its flexible structure allows for easy extension to include additional features or integrations.

<<<<<<< HEAD
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
# Venice-Bridge-Explorer
>>>>>>> 6f19acf428f748f5d7dd2d627647380fa13780e2
