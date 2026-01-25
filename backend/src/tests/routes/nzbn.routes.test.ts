import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NZBN Routes', () => {
  let app: Express;
  let token: string;

  beforeAll(() => {
    app = createApp();
    const payload = { id: 'test-user', role: 'SPECIALIST' };
    token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/nzbn/search', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/nzbn/search?q=test');
      expect(res.status).toBe(401);
    });

    it('should return 400 if no search query is provided', async () => {
      const res = await request(app)
        .get('/api/v1/nzbn/search')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('should call the NZBN API and return the results', async () => {
      const mockResponse = {
        items: [{ nzbn: '12345', entityName: 'Test Company' }],
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const res = await request(app)
        .get('/api/v1/nzbn/search?q=Test%20Company')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.business.govt.nz/services/v4/nzbn/entities',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': config.nzbn.apiKey,
          },
          params: {
            'search-term': 'Test Company',
          },
        }
      );
    });

    it('should handle errors from the NZBN API', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 500, data: { error: 'Internal Server Error' } },
      });

      const res = await request(app)
        .get('/api/v1/nzbn/search?q=Test%20Company')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Failed to fetch data from NZBN API.');
    });
  });
});
