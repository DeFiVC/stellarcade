const request = require('supertest');
const express = require('express');
const { createHash } = require('crypto');
const { Keypair } = require('@stellar/stellar-sdk');

jest.mock('../../src/config/database', () => {
  const mock = jest.fn();
  mock.raw = jest.fn().mockResolvedValue({});
  return mock;
});

jest.mock('../../src/config/redis', () => {
  const mockClient = {
    get: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue('OK'),
    ttl: jest.fn().mockResolvedValue(60),
    setEx: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    isOpen: true,
  };
  return { client: mockClient, connectPromise: Promise.resolve() };
});

const router = require('../../src/routes/auth.routes');
const User = require('../../src/models/User.model');

jest.mock('../../src/models/User.model');

/** Mirrors how Freighter (and SEP-53-style wallets) actually sign messages. */
function signChallenge(keypair, challenge) {
  const hash = createHash('sha256')
    .update(`Stellar Signed Message:\n${challenge}`, 'utf8')
    .digest();
  return keypair.sign(hash).toString('base64');
}

const app = express();
app.use(express.json());
app.use('/auth', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('POST /auth/challenge', () => {
  test('400s when address is missing', async () => {
    const res = await request(app).post('/auth/challenge').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  test('issues a challenge for a valid address', async () => {
    const res = await request(app).post('/auth/challenge').send({ address: 'GALICE' });
    expect(res.status).toBe(200);
    expect(typeof res.body.challenge).toBe('string');
    expect(res.body.challenge.length).toBeGreaterThan(0);
  });
});

describe('POST /auth/login', () => {
  const OLD_ENV = process.env.JWT_SECRET;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });
  afterAll(() => {
    process.env.JWT_SECRET = OLD_ENV;
  });

  test('400s when address or signature is missing', async () => {
    const res = await request(app).post('/auth/login').send({ address: 'GALICE' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  test('401s for a signature that does not verify', async () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();

    await request(app).post('/auth/challenge').send({ address });
    const res = await request(app).post('/auth/login').send({ address, signature: 'bm90LWEtc2ln' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
  });

  test('400s when there is no pending challenge for the address', async () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();

    const res = await request(app).post('/auth/login').send({ address, signature: 'bm90LWEtc2ln' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
  });

  test('auto-provisions a profile and issues a token on first login', async () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();

    User.findByWallet.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 3,
      wallet_address: address,
      username: 'player',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    });

    const challengeRes = await request(app).post('/auth/challenge').send({ address });
    const signature = signChallenge(keypair, challengeRes.body.challenge);

    const res = await request(app).post('/auth/login').send({ address, signature });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.profile.address).toBe(address);
    expect(User.create).toHaveBeenCalledWith({
      wallet_address: address,
      username: 'player',
    });
  });

  test('logs in an existing profile without re-creating it', async () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();

    User.findByWallet.mockResolvedValue({
      id: 9,
      wallet_address: address,
      username: 'alice',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    });

    const challengeRes = await request(app).post('/auth/challenge').send({ address });
    const signature = signChallenge(keypair, challengeRes.body.challenge);

    const res = await request(app).post('/auth/login').send({ address, signature });

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('alice');
    expect(User.create).not.toHaveBeenCalled();
  });

  test('replaying a used challenge/signature fails', async () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();
    User.findByWallet.mockResolvedValue({ id: 1, wallet_address: address, username: 'alice' });

    const challengeRes = await request(app).post('/auth/challenge').send({ address });
    const signature = signChallenge(keypair, challengeRes.body.challenge);

    await request(app).post('/auth/login').send({ address, signature });
    const replay = await request(app).post('/auth/login').send({ address, signature });

    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe('CHALLENGE_NOT_FOUND');
  });
});
