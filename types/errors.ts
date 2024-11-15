export class YouTubeError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.name = 'YouTubeError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Set the prototype explicitly when extending Error in TypeScript
    Object.setPrototypeOf(this, YouTubeError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };
  }
}

export class GeminiError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.name = 'GeminiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Set the prototype explicitly when extending Error in TypeScript
    Object.setPrototypeOf(this, GeminiError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };
  }
}
