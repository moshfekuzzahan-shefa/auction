import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/db';

describe('System API (Integration)', () => {
  beforeAll(async () => {
    // Clear test db before all tests
    await prisma.systemState.deleteMany();
    await prisma.systemState.create({
      data: {
        currentPhase: 'SETUP',
        totalBudget: 10000,
        minRoster: 11,
        maxRoster: 15
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.systemState.deleteMany();
    await prisma.$disconnect();
  });

  it('GET /api/system should return system state', async () => {
    const res = await request(app).get('/api/system');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentPhase).toBe('SETUP');
  });
});
