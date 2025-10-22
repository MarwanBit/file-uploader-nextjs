import { S3Client } from "@aws-sdk/client-s3";
import ConfigSingleton from "./config";

const config = ConfigSingleton.getInstance().config;

const s3Client: S3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
});

export default s3Client;