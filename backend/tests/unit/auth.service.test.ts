import { prismaMock } from '../setup';
import { AuthService } from '../../src/modules/auth/auth.service';

describe('AuthService (Unit)', () => {
  it('should throw error if user not found on login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(AuthService.login('test@test.com', 'password')).rejects.toThrow('Invalid email or password');
  });

  // More tests would be here...
});
