import { AuthorizationServer, JwtService } from '@jmondi/oauth2-server';
import { JWT_SECRET } from '$env/static/private';
import { AuthCodeRepository } from './repositories/AuthCodeRepository.js';
import { ClientRepository } from './repositories/ClientRepository.js';
import { TokenRepository } from './repositories/TokenRepository.js';
import { ScopeRepository } from './repositories/ScopeRepository.js';
import { UserRepository } from './repositories/UserRepository.js';

const authCodeRepository = new AuthCodeRepository();
const clientRepository = new ClientRepository();
const tokenRepository = new TokenRepository();
const scopeRepository = new ScopeRepository();
const userRepository = new UserRepository();

export const authorizationServer = new AuthorizationServer(
	clientRepository,
	tokenRepository,
	scopeRepository,
	new JwtService(JWT_SECRET),
	{ requiresPKCE: true, requiresS256: true }
);

authorizationServer.enableGrantType({
	grant: 'authorization_code',
	authCodeRepository,
	userRepository
});
authorizationServer.enableGrantType('client_credentials');
authorizationServer.enableGrantType('refresh_token');
