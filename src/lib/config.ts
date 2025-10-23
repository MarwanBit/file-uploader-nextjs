import "dotenv/config";

/**
 * @fileoverview Configuration management using the Singleton pattern.
 * 
 * This module provides a centralized configuration singleton that loads and validates
 * environment variables. It ensures that required configuration values are present
 * at application startup and provides a type-safe interface for accessing them.
 * 
 * @module lib/config
 */

/**
 * Configuration interface defining all required environment variables.
 * 
 * @interface Config
 */
interface Config {
    /** AWS access key ID for S3 authentication */
    AWS_ACCESS_KEY_ID: string;
    /** AWS secret access key for S3 authentication */
    AWS_SECRET_ACCESS_KEY: string;
    /** AWS region where the S3 bucket is located */
    AWS_REGION: string;
    /** Name of the S3 bucket for file storage */
    APPLICATION_BUCKET_NAME: string;
    /** Port number for the application server */
    PORT: number;
}

/**
 * Singleton class for managing application configuration.
 * 
 * This class implements the Singleton pattern to ensure only one instance of the
 * configuration exists throughout the application lifecycle. It loads environment
 * variables and validates that all required values are present, throwing errors
 * if critical configuration is missing.
 * 
 * @class ConfigSingleton
 * 
 * @example
 * ```typescript
 * import ConfigSingleton from '@/lib/config';
 * 
 * // Get the singleton instance
 * const configInstance = ConfigSingleton.getInstance();
 * 
 * // Access configuration values
 * console.log('AWS Region:', configInstance.config.AWS_REGION);
 * console.log('Bucket:', configInstance.config.APPLICATION_BUCKET_NAME);
 * console.log('Port:', configInstance.config.PORT);
 * ```
 * 
 * @example
 * ```typescript
 * // Use in services
 * import ConfigSingleton from '@/lib/config';
 * 
 * class MyService {
 *   private config = ConfigSingleton.getInstance().config;
 *   
 *   async uploadFile() {
 *     const bucketName = this.config.APPLICATION_BUCKET_NAME;
 *     // ... use bucket name
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Configuration is loaded once at first access and cached
 * - Missing required env vars cause the application to throw immediately
 * - AWS_REGION defaults to "us-east-1" if not specified
 * - PORT defaults to 3000 if not specified
 * - Uses dotenv to load from .env files
 */
class ConfigSingleton {
    /**
     * The singleton instance.
     * @private
     * @static
     */
    private static instance: ConfigSingleton;
    
    /**
     * The configuration object containing all environment variables.
     * This is readonly to prevent accidental modification after initialization.
     * @readonly
     */
    public readonly config: Config;

    /**
     * Private constructor to prevent direct instantiation.
     * Use {@link getInstance} to access the singleton instance.
     * 
     * @private
     * @throws {Error} If required environment variables are missing
     */
    private constructor() {
        this.config = {
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? (() => {throw new Error("AWS_ACCESS_KEY_ID UNDEFINED IN CONFIG!")})(),
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? (() => {throw new Error("AWS_SECRET_ACCESS_KEY UNDEFINED IN CONFIG!")})(),
            AWS_REGION: process.env.AWS_REGION || "us-east-1",
            APPLICATION_BUCKET_NAME: process.env.APPLICATION_BUCKET_NAME ?? (() => {throw new Error("APPLICATION_BUCKET_NAME UNDEFINED IN CONFIG!")})(),
            PORT: parseInt(process.env.PORT || "3000"),
        };
    }

    /**
     * Gets or creates the singleton instance of ConfigSingleton.
     * 
     * This method ensures that only one instance of the configuration exists.
     * On first call, it creates the instance and validates all environment variables.
     * Subsequent calls return the cached instance.
     * 
     * @static
     * @returns The singleton ConfigSingleton instance
     * @throws {Error} If required environment variables are missing (on first call)
     * 
     * @example
     * ```typescript
     * // Get the singleton instance
     * const config = ConfigSingleton.getInstance();
     * 
     * // Access configuration
     * const awsRegion = config.config.AWS_REGION;
     * ```
     */
    public static getInstance(): ConfigSingleton {
        if (!ConfigSingleton.instance) {
            ConfigSingleton.instance = new ConfigSingleton();
        }
        return ConfigSingleton.instance;
    }
}

/**
 * Export the ConfigSingleton class as the default export.
 * 
 * @example
 * ```typescript
 * import ConfigSingleton from '@/lib/config';
 * 
 * const config = ConfigSingleton.getInstance().config;
 * ```
 */
export default ConfigSingleton;