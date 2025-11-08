import { VCPToolBox, VCPToolBoxClient } from './index.js';

describe('VCPToolBox SDK', () => {
  describe('VCPToolBoxClient', () => {
    it('should create client instance', () => {
      const client = new VCPToolBoxClient({
        baseURL: 'https://api.example.com'
      });

      expect(client).toBeInstanceOf(VCPToolBoxClient);
      expect(client.getVersion()).toBe('1.0.0');
    });

    it('should set and get auth token', () => {
      const client = new VCPToolBoxClient({
        baseURL: 'https://api.example.com'
      });

      client.setToken('test-token');
      expect(client.isAuth()).toBe(true);
    });
  });

  describe('VCPToolBox', () => {
    it('should create SDK instance', () => {
      const sdk = new VCPToolBox({
        baseURL: 'https://api.example.com'
      });

      expect(sdk.client).toBeInstanceOf(VCPToolBoxClient);
      expect(sdk.auth).toBeDefined();
      expect(sdk.games).toBeDefined();
      expect(sdk.plugins).toBeDefined();
      expect(sdk.ws).toBeDefined();
    });

    it('should create instance with factory method', () => {
      const sdk = VCPToolBox.create('https://api.example.com');

      expect(sdk).toBeInstanceOf(VCPToolBox);
    });

    it('should return correct version', () => {
      expect(VCPToolBox.getVersion()).toBe('1.0.0');
    });
  });
});
