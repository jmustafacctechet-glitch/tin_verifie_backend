import { ParsedQrData } from '../types';

export interface ParserConfig {
  maxLength: number;
}

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  maxLength: 2048,
};

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export type ParserResult = ParsedQrData;
