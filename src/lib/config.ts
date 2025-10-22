import "dotenv/config";

interface Config {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    APPLICATION_BUCKET_NAME: string;
    PORT: number;
}

class ConfigSingleton {
    private static instance: ConfigSingleton;
    public readonly config: Config;

    private constructor() {
        this.config = {
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? (() => {throw new Error("AWS_ACCESS_KEY_ID UNDEFINED IN CONFIG!")})(),
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? (() => {throw new Error("AWS_SECRET_ACCESS_KEY UNDEFINED IN CONFIG!")})(),
            AWS_REGION: process.env.AWS_REGION || "us-east-1",
            APPLICATION_BUCKET_NAME: process.env.APPLICATION_BUCKET_NAME ?? (() => {throw new Error("APPLICATION_BUCKET_NAME UNDEFINED IN CONFIG!")})(),
            PORT: parseInt(process.env.PORT || "3000"),
        };
    }

    public static getInstance(): ConfigSingleton {
        if (!ConfigSingleton.instance) {
            ConfigSingleton.instance = new ConfigSingleton();
        }
        return ConfigSingleton.instance;
    }
}

export default ConfigSingleton;