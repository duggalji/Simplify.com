/**
 * Custom error class for handling errors specific to YouTube API interactions.
 */
export class YouTubeError extends Error {
  public statusCode: number;  // HTTP status code associated with the error
  public errorCode?: string;   // Optional custom error code for more granular error handling

  /**
   * Constructs a new YouTubeError.
   * @param message - The error message to be displayed.
   * @param statusCode - The HTTP status code related to the error (defaults to 500).
   * @param errorCode - An optional custom error code.
   */
  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);  // Call the parent constructor with the error message
    this.name = 'YouTubeError';  // Set the name property to the name of this error class
    this.statusCode = statusCode;  // Set the status code
    this.errorCode = errorCode;  // Set the error code if provided

    // Set the prototype explicitly to maintain the correct prototype chain in TypeScript
    Object.setPrototypeOf(this, YouTubeError.prototype);
  }

  /**
   * Converts the error instance into a JSON representation.
   * Useful for error logging and serialization.
   * @returns An object containing the error details.
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };
  }
}

/**
 * Custom error class for handling errors specific to Gemini (or another service).
 */
export class GeminiError extends Error {
  public statusCode: number;  // HTTP status code associated with the error
  public errorCode?: string;   // Optional custom error code for more granular error handling

  /**
   * Constructs a new GeminiError.
   * @param message - The error message to be displayed.
   * @param statusCode - The HTTP status code related to the error (defaults to 500).
   * @param errorCode - An optional custom error code.
   */
  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);  // Call the parent constructor with the error message
    this.name = 'GeminiError';  // Set the name property to the name of this error class
    this.statusCode = statusCode;  // Set the status code
    this.errorCode = errorCode;  // Set the error code if provided

    // Set the prototype explicitly to maintain the correct prototype chain in TypeScript
    Object.setPrototypeOf(this, GeminiError.prototype);
  }

  /**
   * Converts the error instance into a JSON representation.
   * Useful for error logging and serialization.
   * @returns An object containing the error details.
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };
  }
}
