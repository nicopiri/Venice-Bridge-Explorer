// src/services/awsService.js

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

const REGION = process.env.REACT_APP_AWS_REGION;
const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME;
const IDENTITY_POOL_ID = process.env.REACT_APP_ID_IDENTITY_POOL;

const s3 = new S3Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
  }),
});


// Funzione per caricare un'immagine in S3
export const uploadImageToS3 = async (file, bridgeID) => {
  const photoKey = `${bridgeID}_${file.name}`;
  
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: photoKey,
      Body: file,
      ACL: "public-read", // Opzionale: rende il file leggibile pubblicamente
    };

    await s3.send(new PutObjectCommand(params));
    alert("Foto caricata con successo.");
  } catch (error) {
    console.error("Error uploading photo:", error);
    if (error.name === 'CredentialsProviderError') {
      alert("Error: Check your AWS credentials and permissions.");
    } else {
      alert(`Error uploading photo: ${error.message}`);
    }
  }
  
};
