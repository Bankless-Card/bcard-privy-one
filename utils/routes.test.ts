import { getRoute, getFullUrl } from './routes';

describe('Routes utility functions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Make a copy of the original process.env
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore the original process.env
    process.env = originalEnv;
  });

  describe('getRoute function', () => {
    it('should return the path as is in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      expect(getRoute('/dashboard')).toBe('/dashboard');
      expect(getRoute('dashboard')).toBe('/dashboard');
      expect(getRoute('/')).toBe('/');
    });

    it('should prepend basePath in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      expect(getRoute('/dashboard')).toBe('/bcard-privy-one/dashboard');
      expect(getRoute('dashboard')).toBe('/bcard-privy-one/dashboard');
      expect(getRoute('/')).toBe('/bcard-privy-one/');
    });

    it('should return external URLs unchanged', () => {
      process.env.NODE_ENV = 'production';
      
      expect(getRoute('http://example.com')).toBe('http://example.com');
      expect(getRoute('https://example.com')).toBe('https://example.com');
    });

    it('should return anchor links unchanged', () => {
      process.env.NODE_ENV = 'production';
      
      expect(getRoute('#section')).toBe('#section');
    });
  });

  describe('getFullUrl function', () => {
    it('should create a full URL with domain and path', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://yourusername.github.io';
      
      expect(getFullUrl('/image.png')).toBe('https://yourusername.github.io/bcard-privy-one/image.png');
    });
  });
});
