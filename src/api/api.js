// src/api/api.js
import axios from 'axios';

const LAMBDA_API_URL = 'https://1l63iebti8.execute-api.eu-north-1.amazonaws.com/prod    '; // Sostituisci con l'URL del tuo API Gateway

export const uploadImageToS3 = async (bridgeID, imageNumber, base64Image) => {
    try {
        const response = await axios.post(LAMBDA_API_URL, {
            bridgeID,
            imageNumber,
            base64Image
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw error;
    }
};
